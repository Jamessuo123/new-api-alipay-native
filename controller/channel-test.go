package controller

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/pkg/billingexpr"
	"github.com/QuantumNous/new-api/relay"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/relay/helper"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/QuantumNous/new-api/types"

	"github.com/bytedance/gopkg/util/gopool"
	"github.com/samber/lo"
	"github.com/tidwall/gjson"

	"github.com/gin-gonic/gin"
)

type testResult struct {
	context     *gin.Context
	localErr    error
	newAPIError *types.NewAPIError
	message     string
	dryRun      bool
}

func normalizeChannelTestEndpoint(channel *model.Channel, modelName, endpointType string) string {
	normalized := strings.TrimSpace(endpointType)
	if normalized != "" {
		return normalized
	}
	if strings.HasSuffix(modelName, ratio_setting.CompactModelSuffix) {
		return string(constant.EndpointTypeOpenAIResponseCompact)
	}
	if channel != nil && channel.Type == constant.ChannelTypeCodex {
		return string(constant.EndpointTypeOpenAIResponse)
	}
	return normalized
}

func resolveChannelTestUserID(c *gin.Context) (int, error) {
	if c != nil {
		if userID := c.GetInt("id"); userID > 0 {
			return userID, nil
		}
	}

	var rootUser model.User
	if err := model.DB.Select("id").Where("role = ?", common.RoleRootUser).First(&rootUser).Error; err != nil {
		return 0, fmt.Errorf("failed to resolve channel test user: %w", err)
	}
	if rootUser.Id == 0 {
		return 0, errors.New("failed to resolve channel test user")
	}
	return rootUser.Id, nil
}

// FEIXIANG_DOUBAO_VIDEO_CHANNEL_TEST_DRYRUN_V1_1_FLEX
// dryRunDoubaoVideoChannelTest validates the local DoubaoVideo/Seedance channel
// wiring without sending any upstream video generation request.
//
// The official Seedance API creates an asynchronous video generation task, so
// the admin channel-test button should not call it as a connectivity probe.
func dryRunDoubaoVideoChannelTest(channel *model.Channel, testModel string) testResult {
	channelTypeName := "DoubaoVideo"
	if channel == nil {
		return testResult{localErr: fmt.Errorf("%s dry-run failed: channel is nil", channelTypeName)}
	}
	if !isFeiXiangDoubaoVideoChannelType(channel) {
		return testResult{localErr: fmt.Errorf("%s dry-run failed: invalid channel type %s", channelTypeName, constant.GetChannelTypeName(channel.Type))}
	}
	if strings.TrimSpace(channel.GetBaseURL()) == "" {
		return testResult{localErr: fmt.Errorf("%s dry-run failed: Base URL 未配置", channelTypeName)}
	}

	hasKey := false
	for _, key := range channel.GetKeys() {
		if strings.TrimSpace(key) != "" {
			hasKey = true
			break
		}
	}
	if !hasKey {
		return testResult{localErr: fmt.Errorf("%s dry-run failed: API Key 未配置", channelTypeName)}
	}

	modelName := resolveDoubaoVideoDryRunModel(channel, testModel)
	if !isDoubaoVideoDryRunSeedanceModel(modelName) {
		return testResult{localErr: fmt.Errorf("%s dry-run failed: model %q is not a Seedance 2.0 model", channelTypeName, modelName)}
	}

	return testResult{
		message: "DoubaoVideo dry-run 通过：Seedance 视频链路配置完整，未真实创建视频任务。",
		dryRun:  true,
	}
}

func isFeiXiangDoubaoVideoChannelType(channel *model.Channel) bool {
	if channel == nil {
		return false
	}
	name := strings.ToLower(strings.TrimSpace(constant.GetChannelTypeName(channel.Type)))
	name = strings.ReplaceAll(name, "_", "-")
	name = strings.ReplaceAll(name, " ", "-")
	return name == "doubaovideo" || name == "doubao-video"
}

func resolveDoubaoVideoDryRunModel(channel *model.Channel, testModel string) string {
	modelName := strings.TrimSpace(testModel)
	if modelName != "" {
		return modelName
	}
	if channel != nil {
		for _, candidate := range channel.GetModels() {
			candidate = strings.TrimSpace(candidate)
			if isDoubaoVideoDryRunSeedanceModel(candidate) {
				return candidate
			}
		}
	}
	return "seedance-2.0-fast-480p"
}

func isDoubaoVideoDryRunSeedanceModel(modelName string) bool {
	name := strings.ToLower(strings.TrimSpace(modelName))
	name = strings.ReplaceAll(name, "_", "-")
	return strings.Contains(name, "seedance-2.0") ||
		strings.Contains(name, "seedance-2-0") ||
		strings.Contains(name, "doubao-seedance-2-0")
}

func testChannel(channel *model.Channel, testUserID int, testModel string, endpointType string, isStream bool) testResult {
	tik := time.Now()

	// FEIXIANG_DOUBAO_VIDEO_CHANNEL_TEST_REAL_PROBE_V1_CALL
	if channel != nil && channel.Type == constant.ChannelTypeDoubaoVideo {
		return realProbeDoubaoVideoChannelTest(context.Background(), channel, testModel)
	}
	var unsupportedTestChannelTypes = []int{
		constant.ChannelTypeMidjourney,
		constant.ChannelTypeMidjourneyPlus,
		constant.ChannelTypeSunoAPI,
		constant.ChannelTypeKling,
		constant.ChannelTypeJimeng,
		constant.ChannelTypeDoubaoVideo,
		constant.ChannelTypeVidu,
	}
	if lo.Contains(unsupportedTestChannelTypes, channel.Type) {
		channelTypeName := constant.GetChannelTypeName(channel.Type)
		return testResult{
			localErr: fmt.Errorf("%s channel test is not supported", channelTypeName),
		}
	}
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	testModel = strings.TrimSpace(testModel)
	if testModel == "" {
		if channel.TestModel != nil && *channel.TestModel != "" {
			testModel = strings.TrimSpace(*channel.TestModel)
		} else {
			models := channel.GetModels()
			if len(models) > 0 {
				testModel = strings.TrimSpace(models[0])
			}
			if testModel == "" {
				testModel = "gpt-4o-mini"
			}
		}
	}

	endpointType = normalizeChannelTestEndpoint(channel, testModel, endpointType)

	// FEIXIANG_IMAGE_CHANNEL_TEST_REAL_PROBE_V1_1_ENTRY_FIX
	// Image-generation channel tests should perform a real upstream probe with an
	// intentionally invalid parameter instead of generating an image. This must run
	// after testModel has been resolved from the channel config.
	if isFeiXiangImageGenerationTestModel(testModel) || constant.EndpointType(endpointType) == constant.EndpointTypeImageGeneration {
		return realProbeImageGenerationChannelTest(context.Background(), channel, testModel)
	}

	requestPath := "/v1/chat/completions"

	// 如果指定了端点类型，使用指定的端点类型
	if endpointType != "" {
		if endpointInfo, ok := common.GetDefaultEndpointInfo(constant.EndpointType(endpointType)); ok {
			requestPath = endpointInfo.Path
		}
	} else {
		// 如果没有指定端点类型，使用原有的自动检测逻辑

		if strings.Contains(strings.ToLower(testModel), "rerank") {
			requestPath = "/v1/rerank"
		}

		// 先判断是否为 Embedding 模型
		if strings.Contains(strings.ToLower(testModel), "embedding") ||
			strings.HasPrefix(testModel, "m3e") || // m3e 系列模型
			strings.Contains(testModel, "bge-") || // bge 系列模型
			strings.Contains(testModel, "embed") ||
			channel.Type == constant.ChannelTypeMokaAI { // 其他 embedding 模型
			requestPath = "/v1/embeddings" // 修改请求路径
		}

		// FEIXIANG_GPT_IMAGE_2_CHANNEL_TEST_FIX
		// Image-only models must use the OpenAI Images endpoint during channel tests.
		if isFeiXiangImageGenerationTestModel(testModel) {
			requestPath = "/v1/images/generations"
		}

		// responses-only models
		if strings.Contains(strings.ToLower(testModel), "codex") {
			requestPath = "/v1/responses"
		}

		// responses compaction models (must use /v1/responses/compact)
		if strings.HasSuffix(testModel, ratio_setting.CompactModelSuffix) {
			requestPath = "/v1/responses/compact"
		}
	}
	if strings.HasPrefix(requestPath, "/v1/responses/compact") {
		testModel = ratio_setting.WithCompactModelSuffix(testModel)
	}

	c.Request = &http.Request{
		Method: "POST",
		URL:    &url.URL{Path: requestPath}, // 使用动态路径
		Body:   nil,
		Header: make(http.Header),
	}

	cache, err := model.GetUserCache(testUserID)
	if err != nil {
		return testResult{
			localErr:    err,
			newAPIError: nil,
		}
	}
	cache.WriteContext(c)
	c.Set("id", testUserID)

	//c.Request.Header.Set("Authorization", "Bearer "+channel.Key)
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("channel", channel.Type)
	c.Set("base_url", channel.GetBaseURL())
	group, _ := model.GetUserGroup(testUserID, false)
	c.Set("group", group)

	newAPIError := middleware.SetupContextForSelectedChannel(c, channel, testModel)
	if newAPIError != nil {
		return testResult{
			context:     c,
			localErr:    newAPIError,
			newAPIError: newAPIError,
		}
	}

	// Determine relay format based on endpoint type or request path
	var relayFormat types.RelayFormat
	if endpointType != "" {
		// 根据指定的端点类型设置 relayFormat
		switch constant.EndpointType(endpointType) {
		case constant.EndpointTypeOpenAI:
			relayFormat = types.RelayFormatOpenAI
		case constant.EndpointTypeOpenAIResponse:
			relayFormat = types.RelayFormatOpenAIResponses
		case constant.EndpointTypeOpenAIResponseCompact:
			relayFormat = types.RelayFormatOpenAIResponsesCompaction
		case constant.EndpointTypeAnthropic:
			relayFormat = types.RelayFormatClaude
		case constant.EndpointTypeGemini:
			relayFormat = types.RelayFormatGemini
		case constant.EndpointTypeJinaRerank:
			relayFormat = types.RelayFormatRerank
		case constant.EndpointTypeImageGeneration:
			relayFormat = types.RelayFormatOpenAIImage
		case constant.EndpointTypeEmbeddings:
			relayFormat = types.RelayFormatEmbedding
		default:
			relayFormat = types.RelayFormatOpenAI
		}
	} else {
		// 根据请求路径自动检测
		relayFormat = types.RelayFormatOpenAI
		if c.Request.URL.Path == "/v1/embeddings" {
			relayFormat = types.RelayFormatEmbedding
		}
		if c.Request.URL.Path == "/v1/images/generations" {
			relayFormat = types.RelayFormatOpenAIImage
		}
		if c.Request.URL.Path == "/v1/messages" {
			relayFormat = types.RelayFormatClaude
		}
		if strings.Contains(c.Request.URL.Path, "/v1beta/models") {
			relayFormat = types.RelayFormatGemini
		}
		if c.Request.URL.Path == "/v1/rerank" || c.Request.URL.Path == "/rerank" {
			relayFormat = types.RelayFormatRerank
		}
		if c.Request.URL.Path == "/v1/responses" {
			relayFormat = types.RelayFormatOpenAIResponses
		}
		if strings.HasPrefix(c.Request.URL.Path, "/v1/responses/compact") {
			relayFormat = types.RelayFormatOpenAIResponsesCompaction
		}
	}

	request := buildTestRequest(testModel, endpointType, channel, isStream)

	info, err := relaycommon.GenRelayInfo(c, relayFormat, request, nil)

	if err != nil {
		return testResult{
			context:     c,
			localErr:    err,
			newAPIError: types.NewError(err, types.ErrorCodeGenRelayInfoFailed),
		}
	}

	info.IsChannelTest = true
	info.InitChannelMeta(c)

	err = attachTestBillingRequestInput(info, request)
	if err != nil {
		return testResult{
			context:     c,
			localErr:    err,
			newAPIError: types.NewError(err, types.ErrorCodeJsonMarshalFailed),
		}
	}

	err = helper.ModelMappedHelper(c, info, request)
	if err != nil {
		return testResult{
			context:     c,
			localErr:    err,
			newAPIError: types.NewError(err, types.ErrorCodeChannelModelMappedError),
		}
	}

	testModel = info.UpstreamModelName
	// 更新请求中的模型名称
	request.SetModelName(testModel)

	apiType, _ := common.ChannelType2APIType(channel.Type)
	if info.RelayMode == relayconstant.RelayModeResponsesCompact &&
		apiType != constant.APITypeOpenAI &&
		apiType != constant.APITypeCodex {
		return testResult{
			context:     c,
			localErr:    fmt.Errorf("responses compaction test only supports openai/codex channels, got api type %d", apiType),
			newAPIError: types.NewError(fmt.Errorf("unsupported api type: %d", apiType), types.ErrorCodeInvalidApiType),
		}
	}
	adaptor := relay.GetAdaptor(apiType)
	if adaptor == nil {
		return testResult{
			context:     c,
			localErr:    fmt.Errorf("invalid api type: %d, adaptor is nil", apiType),
			newAPIError: types.NewError(fmt.Errorf("invalid api type: %d, adaptor is nil", apiType), types.ErrorCodeInvalidApiType),
		}
	}

	//// 创建一个用于日志的 info 副本，移除 ApiKey
	//logInfo := info
	//logInfo.ApiKey = ""
	common.SysLog(fmt.Sprintf("testing channel %d with model %s , info %+v ", channel.Id, testModel, info.ToString()))

	priceData, err := helper.ModelPriceHelper(c, info, 0, request.GetTokenCountMeta())
	if err != nil {
		return testResult{
			context:     c,
			localErr:    err,
			newAPIError: types.NewError(err, types.ErrorCodeModelPriceError, types.ErrOptionWithStatusCode(http.StatusBadRequest)),
		}
	}

	adaptor.Init(info)

	var convertedRequest any
	// 根据 RelayMode 选择正确的转换函数
	switch info.RelayMode {
	case relayconstant.RelayModeEmbeddings:
		// Embedding 请求 - request 已经是正确的类型
		if embeddingReq, ok := request.(*dto.EmbeddingRequest); ok {
			convertedRequest, err = adaptor.ConvertEmbeddingRequest(c, info, *embeddingReq)
		} else {
			return testResult{
				context:     c,
				localErr:    errors.New("invalid embedding request type"),
				newAPIError: types.NewError(errors.New("invalid embedding request type"), types.ErrorCodeConvertRequestFailed),
			}
		}
	case relayconstant.RelayModeImagesGenerations:
		// 图像生成请求 - request 已经是正确的类型
		if imageReq, ok := request.(*dto.ImageRequest); ok {
			convertedRequest, err = adaptor.ConvertImageRequest(c, info, *imageReq)
		} else {
			return testResult{
				context:     c,
				localErr:    errors.New("invalid image request type"),
				newAPIError: types.NewError(errors.New("invalid image request type"), types.ErrorCodeConvertRequestFailed),
			}
		}
	case relayconstant.RelayModeRerank:
		// Rerank 请求 - request 已经是正确的类型
		if rerankReq, ok := request.(*dto.RerankRequest); ok {
			convertedRequest, err = adaptor.ConvertRerankRequest(c, info.RelayMode, *rerankReq)
		} else {
			return testResult{
				context:     c,
				localErr:    errors.New("invalid rerank request type"),
				newAPIError: types.NewError(errors.New("invalid rerank request type"), types.ErrorCodeConvertRequestFailed),
			}
		}
	case relayconstant.RelayModeResponses:
		// Response 请求 - request 已经是正确的类型
		if responseReq, ok := request.(*dto.OpenAIResponsesRequest); ok {
			convertedRequest, err = adaptor.ConvertOpenAIResponsesRequest(c, info, *responseReq)
		} else {
			return testResult{
				context:     c,
				localErr:    errors.New("invalid response request type"),
				newAPIError: types.NewError(errors.New("invalid response request type"), types.ErrorCodeConvertRequestFailed),
			}
		}
	case relayconstant.RelayModeResponsesCompact:
		// Response compaction request - convert to OpenAIResponsesRequest before adapting
		switch req := request.(type) {
		case *dto.OpenAIResponsesCompactionRequest:
			convertedRequest, err = adaptor.ConvertOpenAIResponsesRequest(c, info, dto.OpenAIResponsesRequest{
				Model:              req.Model,
				Input:              req.Input,
				Instructions:       req.Instructions,
				PreviousResponseID: req.PreviousResponseID,
			})
		case *dto.OpenAIResponsesRequest:
			convertedRequest, err = adaptor.ConvertOpenAIResponsesRequest(c, info, *req)
		default:
			return testResult{
				context:     c,
				localErr:    errors.New("invalid response compaction request type"),
				newAPIError: types.NewError(errors.New("invalid response compaction request type"), types.ErrorCodeConvertRequestFailed),
			}
		}
	default:
		// Chat/Completion 等其他请求类型
		if generalReq, ok := request.(*dto.GeneralOpenAIRequest); ok {
			convertedRequest, err = adaptor.ConvertOpenAIRequest(c, info, generalReq)
		} else {
			return testResult{
				context:     c,
				localErr:    errors.New("invalid general request type"),
				newAPIError: types.NewError(errors.New("invalid general request type"), types.ErrorCodeConvertRequestFailed),
			}
		}
	}

	if err != nil {
		return testResult{
			context:     c,
			localErr:    err,
			newAPIError: types.NewError(err, types.ErrorCodeConvertRequestFailed),
		}
	}
	jsonData, err := common.Marshal(convertedRequest)
	if err != nil {
		return testResult{
			context:     c,
			localErr:    err,
			newAPIError: types.NewError(err, types.ErrorCodeJsonMarshalFailed),
		}
	}

	//jsonData, err = relaycommon.RemoveDisabledFields(jsonData, info.ChannelOtherSettings)
	//if err != nil {
	//	return testResult{
	//		context:     c,
	//		localErr:    err,
	//		newAPIError: types.NewError(err, types.ErrorCodeConvertRequestFailed),
	//	}
	//}

	if len(info.ParamOverride) > 0 {
		jsonData, err = relaycommon.ApplyParamOverrideWithRelayInfo(jsonData, info)
		if err != nil {
			if fixedErr, ok := relaycommon.AsParamOverrideReturnError(err); ok {
				return testResult{
					context:     c,
					localErr:    fixedErr,
					newAPIError: relaycommon.NewAPIErrorFromParamOverride(fixedErr),
				}
			}
			return testResult{
				context:     c,
				localErr:    err,
				newAPIError: types.NewError(err, types.ErrorCodeChannelParamOverrideInvalid),
			}
		}
	}

	requestBody := bytes.NewBuffer(jsonData)
	c.Request.Body = io.NopCloser(bytes.NewBuffer(jsonData))
	resp, err := adaptor.DoRequest(c, info, requestBody)
	if err != nil {
		return testResult{
			context:     c,
			localErr:    err,
			newAPIError: types.NewOpenAIError(err, types.ErrorCodeDoRequestFailed, http.StatusInternalServerError),
		}
	}
	var httpResp *http.Response
	if resp != nil {
		httpResp = resp.(*http.Response)
		if httpResp.StatusCode != http.StatusOK {
			err := service.RelayErrorHandler(c.Request.Context(), httpResp, true)
			common.SysError(fmt.Sprintf(
				"channel test bad response: channel_id=%d name=%s type=%d model=%s endpoint_type=%s status=%d err=%v",
				channel.Id,
				channel.Name,
				channel.Type,
				testModel,
				endpointType,
				httpResp.StatusCode,
				err,
			))
			return testResult{
				context:     c,
				localErr:    err,
				newAPIError: types.NewOpenAIError(err, types.ErrorCodeBadResponse, http.StatusInternalServerError),
			}
		}
	}
	usageA, respErr := adaptor.DoResponse(c, httpResp, info)
	if respErr != nil {
		return testResult{
			context:     c,
			localErr:    respErr,
			newAPIError: respErr,
		}
	}
	usage, usageErr := coerceTestUsage(usageA, isStream, info.GetEstimatePromptTokens())
	if usageErr != nil {
		return testResult{
			context:     c,
			localErr:    usageErr,
			newAPIError: types.NewOpenAIError(usageErr, types.ErrorCodeBadResponseBody, http.StatusInternalServerError),
		}
	}
	result := w.Result()
	respBody, err := readTestResponseBody(result.Body, isStream)
	if err != nil {
		return testResult{
			context:     c,
			localErr:    err,
			newAPIError: types.NewOpenAIError(err, types.ErrorCodeReadResponseBodyFailed, http.StatusInternalServerError),
		}
	}
	if bodyErr := validateTestResponseBody(respBody, isStream); bodyErr != nil {
		return testResult{
			context:     c,
			localErr:    bodyErr,
			newAPIError: types.NewOpenAIError(bodyErr, types.ErrorCodeBadResponseBody, http.StatusInternalServerError),
		}
	}
	info.SetEstimatePromptTokens(usage.PromptTokens)

	quota, tieredResult := settleTestQuota(info, priceData, usage)
	tok := time.Now()
	milliseconds := tok.Sub(tik).Milliseconds()
	consumedTime := float64(milliseconds) / 1000.0
	other := buildTestLogOther(c, info, priceData, usage, tieredResult)
	model.RecordConsumeLog(c, testUserID, model.RecordConsumeLogParams{
		ChannelId:        channel.Id,
		PromptTokens:     usage.PromptTokens,
		CompletionTokens: usage.CompletionTokens,
		ModelName:        info.OriginModelName,
		TokenName:        "模型测试",
		Quota:            quota,
		Content:          "模型测试",
		UseTimeSeconds:   int(consumedTime),
		IsStream:         info.IsStream,
		Group:            info.UsingGroup,
		Other:            other,
	})
	common.SysLog(fmt.Sprintf("testing channel #%d, response: \n%s", channel.Id, string(respBody)))
	return testResult{
		context:     c,
		localErr:    nil,
		newAPIError: nil,
	}
}

// FEIXIANG_DOUBAO_VIDEO_CHANNEL_TEST_REAL_PROBE_V1
// realProbeDoubaoVideoChannelTest performs a real upstream HTTP round-trip for
// DoubaoVideo / Seedance channels without creating a video task.
//
// The probe intentionally sends duration=0. Official Seedance 2.0 duration is
// [4,15] or -1, so a healthy upstream should reject the request at validation
// time. That gives us a real response time while avoiding billable generation.
func realProbeDoubaoVideoChannelTest(ctx context.Context, channel *model.Channel, testModel string) testResult {
	if ctx == nil {
		ctx = context.Background()
	}
	if channel == nil {
		return testResult{localErr: errors.New("DoubaoVideo channel is nil")}
	}

	modelName := normalizeDoubaoVideoProbeModel(channel, testModel)
	if modelName == "" {
		return testResult{localErr: errors.New("DoubaoVideo probe model is empty")}
	}
	if !strings.Contains(strings.ToLower(modelName), "seedance") && !strings.Contains(strings.ToLower(channel.Name), "seedance") {
		return testResult{localErr: fmt.Errorf("DoubaoVideo real-probe requires a Seedance model, got %q", modelName)}
	}

	apiKey := firstDoubaoVideoProbeKey(channel)
	if apiKey == "" {
		return testResult{localErr: errors.New("DoubaoVideo API Key is empty")}
	}

	endpoint := normalizeDoubaoVideoProbeEndpoint(channel.GetBaseURL())
	probeModelName := resolveDoubaoVideoProbeModelName(modelName)
	body := fmt.Sprintf(`{"model":%q,"content":[{"type":"text","text":"FeiXiangApi channel connectivity probe. This request intentionally uses invalid duration=0 to avoid creating a video task."}],"resolution":"480p","ratio":"16:9","duration":0,"generate_audio":false,"watermark":false}`, probeModelName)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(body))
	if err != nil {
		return testResult{localErr: err, newAPIError: types.NewOpenAIError(err, types.ErrorCodeDoRequestFailed, http.StatusInternalServerError)}
	}
	auth := apiKey
	if !strings.HasPrefix(strings.ToLower(auth), "bearer ") {
		auth = "Bearer " + auth
	}
	req.Header.Set("Authorization", auth)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	started := time.Now()
	resp, err := (&http.Client{Timeout: 15 * time.Second}).Do(req)
	elapsedMS := time.Since(started).Milliseconds()
	if err != nil {
		wrapped := fmt.Errorf("DoubaoVideo real-probe request failed: %w", err)
		return testResult{localErr: wrapped, newAPIError: types.NewOpenAIError(wrapped, types.ErrorCodeDoRequestFailed, http.StatusInternalServerError)}
	}
	defer resp.Body.Close()

	respBody, readErr := io.ReadAll(io.LimitReader(resp.Body, 64<<10))
	if readErr != nil {
		wrapped := fmt.Errorf("DoubaoVideo real-probe failed to read upstream response: %w", readErr)
		return testResult{localErr: wrapped, newAPIError: types.NewOpenAIError(wrapped, types.ErrorCodeReadResponseBodyFailed, http.StatusInternalServerError)}
	}

	bodyText := strings.TrimSpace(string(respBody))
	common.SysLog(fmt.Sprintf(
		"DoubaoVideo real-probe channel_id=%d model=%s status=%d elapsed_ms=%d endpoint=%s body=%s",
		channel.Id,
		modelName,
		resp.StatusCode,
		elapsedMS,
		endpoint,
		truncateDoubaoVideoProbeBody(bodyText),
	))

	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
		wrapped := fmt.Errorf("DoubaoVideo real-probe auth failed: upstream returned %d: %s", resp.StatusCode, truncateDoubaoVideoProbeBody(bodyText))
		return testResult{localErr: wrapped, newAPIError: types.NewOpenAIError(wrapped, types.ErrorCodeBadResponse, resp.StatusCode)}
	}

	if resp.StatusCode == http.StatusTooManyRequests {
		wrapped := fmt.Errorf("DoubaoVideo real-probe rate limited: upstream returned 429: %s", truncateDoubaoVideoProbeBody(bodyText))
		return testResult{localErr: wrapped, newAPIError: types.NewOpenAIError(wrapped, types.ErrorCodeBadResponse, http.StatusTooManyRequests)}
	}

	if resp.StatusCode >= 500 {
		wrapped := fmt.Errorf("DoubaoVideo real-probe upstream server error %d: %s", resp.StatusCode, truncateDoubaoVideoProbeBody(bodyText))
		return testResult{localErr: wrapped, newAPIError: types.NewOpenAIError(wrapped, types.ErrorCodeBadResponse, http.StatusBadGateway)}
	}

	// A 2xx with a task id means the deliberately invalid probe unexpectedly
	// created a video task. Treat it as failure to avoid hiding a billable action.
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		if doubaoVideoProbeResponseHasTaskID(respBody) {
			wrapped := errors.New("DoubaoVideo real-probe unexpectedly created a video task; aborting probe result")
			return testResult{localErr: wrapped, newAPIError: types.NewOpenAIError(wrapped, types.ErrorCodeBadResponseBody, http.StatusInternalServerError)}
		}
		return testResult{localErr: nil, newAPIError: nil}
	}

	// Expected safe success: upstream accepted auth/model/path and rejected the
	// invalid duration at parameter validation, so no task should be created.
	if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusUnprocessableEntity {
		lowerBody := strings.ToLower(bodyText)
		if strings.Contains(lowerBody, "duration") || strings.Contains(lowerBody, "时长") || strings.Contains(lowerBody, "dur") {
			return testResult{localErr: nil, newAPIError: nil}
		}
		if strings.Contains(lowerBody, "model") || strings.Contains(lowerBody, "模型") {
			wrapped := fmt.Errorf("DoubaoVideo real-probe model check failed: upstream returned %d: %s", resp.StatusCode, truncateDoubaoVideoProbeBody(bodyText))
			return testResult{localErr: wrapped, newAPIError: types.NewOpenAIError(wrapped, types.ErrorCodeBadResponse, http.StatusBadRequest)}
		}
	}

	wrapped := fmt.Errorf("DoubaoVideo real-probe unexpected upstream response %d: %s", resp.StatusCode, truncateDoubaoVideoProbeBody(bodyText))
	return testResult{localErr: wrapped, newAPIError: types.NewOpenAIError(wrapped, types.ErrorCodeBadResponse, http.StatusInternalServerError)}
}

func normalizeDoubaoVideoProbeModel(channel *model.Channel, testModel string) string {
	modelName := strings.TrimSpace(testModel)
	if modelName != "" {
		return modelName
	}
	if channel != nil && channel.TestModel != nil {
		modelName = strings.TrimSpace(*channel.TestModel)
		if modelName != "" {
			return modelName
		}
	}
	if channel != nil {
		for _, m := range channel.GetModels() {
			m = strings.TrimSpace(m)
			if m != "" {
				return m
			}
		}
	}
	return "doubao-seedance-2-0-260128"
}

func firstDoubaoVideoProbeKey(channel *model.Channel) string {
	if channel == nil {
		return ""
	}
	for _, key := range channel.GetKeys() {
		key = strings.Trim(strings.TrimSpace(key), "\"")
		if key != "" {
			return key
		}
	}
	return strings.Trim(strings.TrimSpace(channel.Key), "\"")
}

// FEIXIANG_DOUBAO_VIDEO_CHANNEL_TEST_REAL_PROBE_V1_1_MODEL_ALIAS
// resolveDoubaoVideoProbeModelName converts FeiXiangApi pricing/display model IDs
// into Volcano Ark Seedance upstream Model ID / Endpoint ID values.
//
// The public model square uses local price IDs such as seedance-2.0-fast-480p,
// but Ark's CreateContentsGenerationsTasks API requires the real Model ID or
// Endpoint ID, e.g. doubao-seedance-2-0-fast-260128.
// FEIXIANG_DOUBAO_VIDEO_CHANNEL_TEST_REAL_PROBE_V1_2_STANDARD_ALIAS_FIX
// resolveDoubaoVideoProbeModelName converts FeiXiang display/pricing model IDs
// into Volcano Ark Seedance model/endpoint IDs for the real upstream probe.
// The channel test must not send local pricing IDs such as seedance-2.0-480p
// to Ark, otherwise Ark returns InvalidEndpointOrModel.NotFound before the
// intended duration=0 safety validation can run.
func resolveDoubaoVideoProbeModelName(modelName string) string {
	m := strings.TrimSpace(modelName)
	if m == "" {
		return "doubao-seedance-2-0-fast-260128"
	}

	lower := strings.ToLower(m)

	if strings.HasPrefix(lower, "doubao-seedance-2-0") {
		return m
	}

	if strings.HasPrefix(lower, "seedance-2.0-fast") || strings.HasPrefix(lower, "seedance-2-0-fast") {
		return "doubao-seedance-2-0-fast-260128"
	}

	if strings.HasPrefix(lower, "seedance-2.0") || strings.HasPrefix(lower, "seedance-2-0") {
		return "doubao-seedance-2-0-260128"
	}

	return m
}
func normalizeDoubaoVideoProbeEndpoint(baseURL string) string {
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if baseURL == "" {
		baseURL = "https://ark.cn-beijing.volces.com/api/v3"
	}
	if strings.HasSuffix(baseURL, "/contents/generations/tasks") {
		return baseURL
	}
	if strings.Contains(baseURL, "/api/v3") {
		return baseURL + "/contents/generations/tasks"
	}
	return baseURL + "/api/v3/contents/generations/tasks"
}

func doubaoVideoProbeResponseHasTaskID(respBody []byte) bool {
	for _, path := range []string{"id", "task_id", "data.id", "data.task_id", "result.id", "result.task_id"} {
		v := gjson.GetBytes(respBody, path)
		if v.Exists() && strings.TrimSpace(v.String()) != "" {
			return true
		}
	}
	return false
}

func truncateDoubaoVideoProbeBody(value string) string {
	value = strings.TrimSpace(value)
	if len(value) <= 600 {
		return value
	}
	return value[:600] + "..."
}

func attachTestBillingRequestInput(info *relaycommon.RelayInfo, request dto.Request) error {
	if info == nil {
		return nil
	}

	input, err := helper.BuildBillingExprRequestInputFromRequest(request, info.RequestHeaders)
	if err != nil {
		return err
	}
	info.BillingRequestInput = &input
	return nil
}

func settleTestQuota(info *relaycommon.RelayInfo, priceData types.PriceData, usage *dto.Usage) (int, *billingexpr.TieredResult) {
	if usage != nil && info != nil && info.TieredBillingSnapshot != nil {
		isClaudeUsageSemantic := usage.UsageSemantic == "anthropic" || info.GetFinalRequestRelayFormat() == types.RelayFormatClaude
		usedVars := billingexpr.UsedVars(info.TieredBillingSnapshot.ExprString)
		if ok, quota, result := service.TryTieredSettle(info, service.BuildTieredTokenParams(usage, isClaudeUsageSemantic, usedVars)); ok {
			return quota, result
		}
	}

	quota := 0
	if !priceData.UsePrice {
		quota = usage.PromptTokens + int(math.Round(float64(usage.CompletionTokens)*priceData.CompletionRatio))
		quota = int(math.Round(float64(quota) * priceData.ModelRatio))
		if priceData.ModelRatio != 0 && quota <= 0 {
			quota = 1
		}
		return quota, nil
	}

	return int(priceData.ModelPrice * common.QuotaPerUnit), nil
}

func buildTestLogOther(c *gin.Context, info *relaycommon.RelayInfo, priceData types.PriceData, usage *dto.Usage, tieredResult *billingexpr.TieredResult) map[string]interface{} {
	other := service.GenerateTextOtherInfo(c, info, priceData.ModelRatio, priceData.GroupRatioInfo.GroupRatio, priceData.CompletionRatio,
		usage.PromptTokensDetails.CachedTokens, priceData.CacheRatio, priceData.ModelPrice, priceData.GroupRatioInfo.GroupSpecialRatio)
	if tieredResult != nil {
		service.InjectTieredBillingInfo(other, info, tieredResult)
	}
	return other
}

func coerceTestUsage(usageAny any, isStream bool, estimatePromptTokens int) (*dto.Usage, error) {
	switch u := usageAny.(type) {
	case *dto.Usage:
		return u, nil
	case dto.Usage:
		return &u, nil
	case nil:
		if !isStream {
			return nil, errors.New("usage is nil")
		}
		usage := &dto.Usage{
			PromptTokens: estimatePromptTokens,
		}
		usage.TotalTokens = usage.PromptTokens
		return usage, nil
	default:
		if !isStream {
			return nil, fmt.Errorf("invalid usage type: %T", usageAny)
		}
		usage := &dto.Usage{
			PromptTokens: estimatePromptTokens,
		}
		usage.TotalTokens = usage.PromptTokens
		return usage, nil
	}
}

func readTestResponseBody(body io.ReadCloser, isStream bool) ([]byte, error) {
	defer func() { _ = body.Close() }()
	const maxStreamLogBytes = 8 << 10
	if isStream {
		return io.ReadAll(io.LimitReader(body, maxStreamLogBytes))
	}
	return io.ReadAll(body)
}

func detectErrorFromTestResponseBody(respBody []byte) error {
	b := bytes.TrimSpace(respBody)
	if len(b) == 0 {
		return nil
	}
	if message := detectErrorMessageFromJSONBytes(b); message != "" {
		return fmt.Errorf("upstream error: %s", message)
	}

	for _, line := range bytes.Split(b, []byte{'\n'}) {
		line = bytes.TrimSpace(line)
		if len(line) == 0 {
			continue
		}
		if !bytes.HasPrefix(line, []byte("data:")) {
			continue
		}
		payload := bytes.TrimSpace(bytes.TrimPrefix(line, []byte("data:")))
		if len(payload) == 0 || bytes.Equal(payload, []byte("[DONE]")) {
			continue
		}
		if message := detectErrorMessageFromJSONBytes(payload); message != "" {
			return fmt.Errorf("upstream error: %s", message)
		}
	}

	return nil
}

func validateStreamTestResponseBody(respBody []byte) error {
	b := bytes.TrimSpace(respBody)
	if len(b) == 0 {
		return errors.New("stream response body is empty")
	}

	for _, line := range bytes.Split(b, []byte{'\n'}) {
		line = bytes.TrimSpace(line)
		if len(line) == 0 || !bytes.HasPrefix(line, []byte("data:")) {
			continue
		}
		payload := bytes.TrimSpace(bytes.TrimPrefix(line, []byte("data:")))
		if len(payload) == 0 || bytes.Equal(payload, []byte("[DONE]")) {
			continue
		}

		return nil
	}

	return errors.New("stream response body does not contain a valid stream event")
}

func validateTestResponseBody(respBody []byte, isStream bool) error {
	if bodyErr := detectErrorFromTestResponseBody(respBody); bodyErr != nil {
		return bodyErr
	}
	if isStream {
		return validateStreamTestResponseBody(respBody)
	}
	return nil
}

func shouldUseStreamForAutomaticChannelTest(channel *model.Channel) bool {
	return channel != nil && channel.Type == constant.ChannelTypeCodex
}

func detectErrorMessageFromJSONBytes(jsonBytes []byte) string {
	if len(jsonBytes) == 0 {
		return ""
	}
	if jsonBytes[0] != '{' && jsonBytes[0] != '[' {
		return ""
	}
	errVal := gjson.GetBytes(jsonBytes, "error")
	if !errVal.Exists() || errVal.Type == gjson.Null {
		return ""
	}

	message := gjson.GetBytes(jsonBytes, "error.message").String()
	if message == "" {
		message = gjson.GetBytes(jsonBytes, "error.error.message").String()
	}
	if message == "" && errVal.Type == gjson.String {
		message = errVal.String()
	}
	if message == "" {
		message = errVal.Raw
	}
	message = strings.TrimSpace(message)
	if message == "" {
		return "upstream returned error payload"
	}
	return message
}

// FEIXIANG_GPT_IMAGE_2_CHANNEL_TEST_FIX
// isFeiXiangImageGenerationTestModel keeps image-only models out of the chat
// channel test path. Third-party OpenAI-compatible upstreams commonly expose
// models such as gpt-image-2 through /v1/images/generations rather than
// /v1/chat/completions.

// FEIXIANG_IMAGE_CHANNEL_TEST_REAL_PROBE_V1_1_HELPERS
// realProbeImageGenerationChannelTest performs a real upstream HTTP round-trip
// for image-generation channels without creating an image. It intentionally sends
// an missing required prompt so upstream validates the request quickly and returns a
// parameter error. That gives a real response time while avoiding billable image
// generation latency.
// FEIXIANG_IMAGE_CHANNEL_TEST_REAL_PROBE_V1_2_MISSING_PROMPT_FAST_FAIL
// realProbeImageGenerationChannelTest performs a real upstream HTTP round-trip
// for image-generation channels without generating an image. It intentionally
// omits the required prompt field so upstream should reject the request during
// validation. This avoids slow/billable image generation while still measuring
// real HTTP response latency and auth/base-url reachability.
// FEIXIANG_IMAGE_CHANNEL_TEST_MODELS_PROBE_V2
// realProbeImageGenerationChannelTest performs a real upstream HTTP round-trip
// for image-generation channels without creating an image. It probes /v1/models
// instead of /v1/images/generations because some upstream image gateways do not
// fast-fail invalid image-generation payloads and may wait until timeout.
// FEIXIANG_IMAGE_CHANNEL_TEST_MODELS_PROBE_V2_1_FORCE_MODELS_ENDPOINT
// realProbeImageGenerationChannelTest performs a real upstream HTTP round-trip
// without creating an image. It probes GET /v1/models instead of POST
// /v1/images/generations because some OpenAI-compatible gateways do not fail
// image generation validation quickly and may block until the image job timeout.
func realProbeImageGenerationChannelTest(ctx context.Context, channel *model.Channel, testModel string) testResult {
	if channel == nil {
		return testResult{localErr: errors.New("ImageGeneration channel is nil")}
	}

	modelName := resolveFeiXiangImageProbeModel(channel, testModel)
	if modelName == "" {
		modelName = "gpt-image-2"
	}

	apiKey := firstImageGenerationProbeKey(channel)
	if apiKey == "" {
		return testResult{localErr: errors.New("ImageGeneration API Key is empty")}
	}

	endpoint := normalizeImageGenerationProbeEndpoint(channel.GetBaseURL())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return testResult{localErr: err, newAPIError: types.NewOpenAIError(err, types.ErrorCodeDoRequestFailed, http.StatusInternalServerError)}
	}
	auth := apiKey
	if !strings.HasPrefix(strings.ToLower(auth), "bearer ") {
		auth = "Bearer " + auth
	}
	req.Header.Set("Authorization", auth)
	req.Header.Set("Accept", "application/json")

	started := time.Now()
	resp, err := (&http.Client{Timeout: 10 * time.Second}).Do(req)
	elapsedMS := time.Since(started).Milliseconds()
	if err != nil {
		wrapped := fmt.Errorf("ImageGeneration models-probe request failed: %w", err)
		return testResult{localErr: wrapped, newAPIError: types.NewOpenAIError(wrapped, types.ErrorCodeDoRequestFailed, http.StatusInternalServerError)}
	}
	defer resp.Body.Close()

	respBody, readErr := io.ReadAll(io.LimitReader(resp.Body, 64<<10))
	if readErr != nil {
		wrapped := fmt.Errorf("ImageGeneration models-probe failed to read upstream response: %w", readErr)
		return testResult{localErr: wrapped, newAPIError: types.NewOpenAIError(wrapped, types.ErrorCodeReadResponseBodyFailed, http.StatusInternalServerError)}
	}

	bodyText := strings.TrimSpace(string(respBody))
	common.SysLog(fmt.Sprintf(
		"ImageGeneration models-probe channel_id=%d model=%s status=%d elapsed_ms=%d endpoint=%s body=%s",
		channel.Id,
		modelName,
		resp.StatusCode,
		elapsedMS,
		endpoint,
		truncateImageGenerationProbeBody(bodyText),
	))

	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
		wrapped := fmt.Errorf("ImageGeneration models-probe auth failed: upstream returned %d: %s", resp.StatusCode, truncateImageGenerationProbeBody(bodyText))
		return testResult{localErr: wrapped, newAPIError: types.NewOpenAIError(wrapped, types.ErrorCodeBadResponse, resp.StatusCode)}
	}

	if resp.StatusCode == http.StatusTooManyRequests {
		wrapped := fmt.Errorf("ImageGeneration models-probe rate limited: upstream returned 429: %s", truncateImageGenerationProbeBody(bodyText))
		return testResult{localErr: wrapped, newAPIError: types.NewOpenAIError(wrapped, types.ErrorCodeBadResponse, http.StatusTooManyRequests)}
	}

	if resp.StatusCode == http.StatusNotFound {
		wrapped := fmt.Errorf("ImageGeneration models-probe endpoint not found: upstream returned 404 at %s: %s", endpoint, truncateImageGenerationProbeBody(bodyText))
		return testResult{localErr: wrapped, newAPIError: types.NewOpenAIError(wrapped, types.ErrorCodeBadResponse, http.StatusNotFound)}
	}

	if resp.StatusCode >= 500 {
		wrapped := fmt.Errorf("ImageGeneration models-probe upstream server error %d: %s", resp.StatusCode, truncateImageGenerationProbeBody(bodyText))
		return testResult{localErr: wrapped, newAPIError: types.NewOpenAIError(wrapped, types.ErrorCodeBadResponse, http.StatusBadGateway)}
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		wrapped := fmt.Errorf("ImageGeneration models-probe unexpected upstream response %d: %s", resp.StatusCode, truncateImageGenerationProbeBody(bodyText))
		return testResult{localErr: wrapped, newAPIError: types.NewOpenAIError(wrapped, types.ErrorCodeBadResponse, resp.StatusCode)}
	}

	return testResult{}
}

func normalizeImageGenerationProbeModel(channel *model.Channel, testModel string) string {
	modelName := strings.TrimSpace(testModel)
	if modelName != "" {
		return modelName
	}
	if channel != nil && channel.TestModel != nil {
		modelName = strings.TrimSpace(*channel.TestModel)
		if modelName != "" {
			return modelName
		}
	}
	return "gpt-image-2"
}

func firstImageGenerationProbeKey(channel *model.Channel) string {
	if channel == nil {
		return ""
	}
	for _, key := range channel.GetKeys() {
		key = strings.Trim(strings.TrimSpace(key), "\"")
		if key != "" {
			return key
		}
	}
	return strings.Trim(strings.TrimSpace(channel.Key), "\"")
}

func isExpectedImageGenerationProbeRejection(statusCode int, bodyText string) bool {
	if statusCode < 400 || statusCode >= 500 {
		return false
	}
	if statusCode == http.StatusUnauthorized || statusCode == http.StatusForbidden || statusCode == http.StatusTooManyRequests || statusCode == http.StatusNotFound {
		return false
	}
	lower := strings.ToLower(bodyText)
	if strings.Contains(lower, "prompt") || strings.Contains(lower, "required") || strings.Contains(lower, "missing") || strings.Contains(lower, "invalid") || strings.Contains(lower, "parameter") || strings.Contains(lower, "badrequest") || strings.Contains(lower, "bad_request") || strings.Contains(lower, "request") {
		return true
	}
	return statusCode == http.StatusBadRequest || statusCode == http.StatusUnprocessableEntity
}

// FEIXIANG_IMAGE_CHANNEL_TEST_MODELS_PROBE_V2
// FEIXIANG_IMAGE_CHANNEL_TEST_MODELS_PROBE_V2_1_FORCE_MODELS_ENDPOINT
func normalizeImageGenerationProbeEndpoint(baseURL string) string {
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if baseURL == "" {
		baseURL = "https://api.openai.com/v1"
	}

	if strings.HasSuffix(baseURL, "/models") {
		return baseURL
	}
	if strings.HasSuffix(baseURL, "/v1") {
		return baseURL + "/models"
	}
	return baseURL + "/v1/models"
}

func imageGenerationProbeResponseHasImage(body []byte) bool {
	lower := strings.ToLower(string(body))
	return strings.Contains(lower, `"data"`) && (strings.Contains(lower, `"url"`) || strings.Contains(lower, `"b64_json"`) || strings.Contains(lower, `"revised_prompt"`))
}

func truncateImageGenerationProbeBody(body string) string {
	body = strings.TrimSpace(body)
	if len(body) <= 600 {
		return body
	}
	return body[:600] + "..."
}

func isFeiXiangImageGenerationTestModel(modelName string) bool {
	name := strings.ToLower(strings.TrimSpace(modelName))
	if name == "" {
		return false
	}

	markers := []string{
		"gpt-image",
		"gpt_image",
		"dall-e",
		"dalle",
		"imagen",
		"flux",
		"sdxl",
		"stable-diffusion",
		"seedream",
		"jimeng",
		"gemini-3.1-flash-image",
		"gemini-2.5-flash-image",
		"gemini-flash-image",
		"image-generation",
		"image_generation",
	}

	for _, marker := range markers {
		if strings.Contains(name, marker) {
			return true
		}
	}

	// Keep this last so normal chat models containing words like "vision" are not
	// automatically treated as image generation models.
	if strings.HasSuffix(name, "-image") || strings.Contains(name, "-image-") {
		return true
	}

	return false
}

func buildTestRequest(model string, endpointType string, channel *model.Channel, isStream bool) dto.Request {
	testResponsesInput := json.RawMessage(`[{"role":"user","content":"hi"}]`)

	// 根据端点类型构建不同的测试请求
	if endpointType != "" {
		switch constant.EndpointType(endpointType) {
		case constant.EndpointTypeEmbeddings:
			// 返回 EmbeddingRequest
			return &dto.EmbeddingRequest{
				Model: model,
				Input: []any{"hello world"},
			}
		case constant.EndpointTypeImageGeneration:
			// 返回 ImageRequest
			return &dto.ImageRequest{
				Model:  model,
				Prompt: "a cute cat",
				N:      lo.ToPtr(uint(1)),
				Size:   "1024x1024",
			}
		case constant.EndpointTypeJinaRerank:
			// 返回 RerankRequest
			return &dto.RerankRequest{
				Model:     model,
				Query:     "What is Deep Learning?",
				Documents: []any{"Deep Learning is a subset of machine learning.", "Machine learning is a field of artificial intelligence."},
				TopN:      lo.ToPtr(2),
			}
		case constant.EndpointTypeOpenAIResponse:
			// 返回 OpenAIResponsesRequest
			return &dto.OpenAIResponsesRequest{
				Model:  model,
				Input:  json.RawMessage(`[{"role":"user","content":"hi"}]`),
				Stream: lo.ToPtr(isStream),
			}
		case constant.EndpointTypeOpenAIResponseCompact:
			// 返回 OpenAIResponsesCompactionRequest
			return &dto.OpenAIResponsesCompactionRequest{
				Model: model,
				Input: testResponsesInput,
			}
		case constant.EndpointTypeAnthropic, constant.EndpointTypeGemini, constant.EndpointTypeOpenAI:
			// 返回 GeneralOpenAIRequest
			maxTokens := uint(16)
			if constant.EndpointType(endpointType) == constant.EndpointTypeGemini {
				maxTokens = 3000
			}
			req := &dto.GeneralOpenAIRequest{
				Model:  model,
				Stream: lo.ToPtr(isStream),
				Messages: []dto.Message{
					{
						Role:    "user",
						Content: "hi",
					},
				},
				MaxTokens: lo.ToPtr(maxTokens),
			}
			if isStream {
				req.StreamOptions = &dto.StreamOptions{IncludeUsage: true}
			}
			return req
		}
	}

	// 自动检测逻辑（保持原有行为）
	if strings.Contains(strings.ToLower(model), "rerank") {
		return &dto.RerankRequest{
			Model:     model,
			Query:     "What is Deep Learning?",
			Documents: []any{"Deep Learning is a subset of machine learning.", "Machine learning is a field of artificial intelligence."},
			TopN:      lo.ToPtr(2),
		}
	}

	// FEIXIANG_GPT_IMAGE_2_CHANNEL_TEST_FIX
	// 自动识别 OpenAI-compatible 图片生成模型，避免把 gpt-image-2 当成 chat 模型测试。
	if isFeiXiangImageGenerationTestModel(model) {
		return &dto.ImageRequest{
			Model:  model,
			Prompt: "a cute cat, simple product-style test image",
			N:      lo.ToPtr(uint(1)),
			Size:   "1024x1024",
		}
	}
	// 先判断是否为 Embedding 模型
	if strings.Contains(strings.ToLower(model), "embedding") ||
		strings.HasPrefix(model, "m3e") ||
		strings.Contains(model, "bge-") {
		// 返回 EmbeddingRequest
		return &dto.EmbeddingRequest{
			Model: model,
			Input: []any{"hello world"},
		}
	}

	// Responses compaction models (must use /v1/responses/compact)
	if strings.HasSuffix(model, ratio_setting.CompactModelSuffix) {
		return &dto.OpenAIResponsesCompactionRequest{
			Model: model,
			Input: testResponsesInput,
		}
	}

	// Responses-only models (e.g. codex series)
	if strings.Contains(strings.ToLower(model), "codex") {
		return &dto.OpenAIResponsesRequest{
			Model:  model,
			Input:  json.RawMessage(`[{"role":"user","content":"hi"}]`),
			Stream: lo.ToPtr(isStream),
		}
	}

	// Chat/Completion 请求 - 返回 GeneralOpenAIRequest
	testRequest := &dto.GeneralOpenAIRequest{
		Model:  model,
		Stream: lo.ToPtr(isStream),
		Messages: []dto.Message{
			{
				Role:    "user",
				Content: "hi",
			},
		},
	}
	if isStream {
		testRequest.StreamOptions = &dto.StreamOptions{IncludeUsage: true}
	}

	if dto.IsOpenAIReasoningOModel(model) {
		testRequest.MaxCompletionTokens = lo.ToPtr(uint(16))
	} else if strings.Contains(model, "thinking") {
		if !strings.Contains(model, "claude") {
			testRequest.MaxTokens = lo.ToPtr(uint(50))
		}
	} else if strings.Contains(model, "gemini") {
		testRequest.MaxTokens = lo.ToPtr(uint(3000))
	} else {
		testRequest.MaxTokens = lo.ToPtr(uint(16))
	}

	return testRequest
}

func TestChannel(c *gin.Context) {
	channelId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	channel, err := model.CacheGetChannel(channelId)
	if err != nil {
		channel, err = model.GetChannelById(channelId, true)
		if err != nil {
			common.ApiError(c, err)
			return
		}
	}
	//defer func() {
	//	if channel.ChannelInfo.IsMultiKey {
	//		go func() { _ = channel.SaveChannelInfo() }()
	//	}
	//}()
	testModel := c.Query("model")
	endpointType := c.Query("endpoint_type")
	isStream, _ := strconv.ParseBool(c.Query("stream"))
	testUserID, err := resolveChannelTestUserID(c)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	tik := time.Now()
	result := testChannel(channel, testUserID, testModel, endpointType, isStream)
	if result.localErr != nil {
		resp := gin.H{
			"success": false,
			"message": result.localErr.Error(),
			"time":    0.0,
		}
		if result.newAPIError != nil {
			resp["error_code"] = result.newAPIError.GetErrorCode()
		}
		c.JSON(http.StatusOK, resp)
		return
	}
	tok := time.Now()
	milliseconds := tok.Sub(tik).Milliseconds()
	go channel.UpdateResponseTime(milliseconds)
	consumedTime := float64(milliseconds) / 1000.0
	if result.newAPIError != nil {
		c.JSON(http.StatusOK, gin.H{
			"success":    false,
			"message":    result.newAPIError.Error(),
			"time":       consumedTime,
			"error_code": result.newAPIError.GetErrorCode(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": result.message,
		"time":    consumedTime,
	})
}

var testAllChannelsLock sync.Mutex
var testAllChannelsRunning bool = false

func testAllChannels(notify bool) error {
	testUserID, err := resolveChannelTestUserID(nil)
	if err != nil {
		return err
	}

	testAllChannelsLock.Lock()
	if testAllChannelsRunning {
		testAllChannelsLock.Unlock()
		return errors.New("测试已在运行中")
	}
	testAllChannelsRunning = true
	testAllChannelsLock.Unlock()
	channels, getChannelErr := model.GetAllChannels(0, 0, true, false)
	if getChannelErr != nil {
		return getChannelErr
	}
	var disableThreshold = int64(common.ChannelDisableThreshold * 1000)
	if disableThreshold == 0 {
		disableThreshold = 10000000 // a impossible value
	}
	gopool.Go(func() {
		// 使用 defer 确保无论如何都会重置运行状态，防止死锁
		defer func() {
			testAllChannelsLock.Lock()
			testAllChannelsRunning = false
			testAllChannelsLock.Unlock()
		}()

		for _, channel := range channels {
			if channel.Status == common.ChannelStatusManuallyDisabled {
				continue
			}
			isChannelEnabled := channel.Status == common.ChannelStatusEnabled
			tik := time.Now()
			result := testChannel(channel, testUserID, "", "", shouldUseStreamForAutomaticChannelTest(channel))
			tok := time.Now()
			milliseconds := tok.Sub(tik).Milliseconds()

			shouldBanChannel := false
			newAPIError := result.newAPIError
			// request error disables the channel
			if newAPIError != nil {
				shouldBanChannel = service.ShouldDisableChannel(result.newAPIError)
			}

			// 当错误检查通过，才检查响应时间
			if common.AutomaticDisableChannelEnabled && !shouldBanChannel {
				if milliseconds > disableThreshold {
					err := fmt.Errorf("响应时间 %.2fs 超过阈值 %.2fs", float64(milliseconds)/1000.0, float64(disableThreshold)/1000.0)
					newAPIError = types.NewOpenAIError(err, types.ErrorCodeChannelResponseTimeExceeded, http.StatusRequestTimeout)
					shouldBanChannel = true
				}
			}

			// disable channel
			if isChannelEnabled && shouldBanChannel && channel.GetAutoBan() {
				processChannelError(result.context, *types.NewChannelError(channel.Id, channel.Type, channel.Name, channel.ChannelInfo.IsMultiKey, common.GetContextKeyString(result.context, constant.ContextKeyChannelKey), channel.GetAutoBan()), newAPIError)
			}

			// enable channel
			if !isChannelEnabled && service.ShouldEnableChannel(newAPIError, channel.Status) {
				service.EnableChannel(channel.Id, common.GetContextKeyString(result.context, constant.ContextKeyChannelKey), channel.Name)
			}

			channel.UpdateResponseTime(milliseconds)
			time.Sleep(common.RequestInterval)
		}

		if notify {
			service.NotifyRootUser(dto.NotifyTypeChannelTest, "通道测试完成", "所有通道测试已完成")
		}
	})
	return nil
}

func TestAllChannels(c *gin.Context) {
	err := testAllChannels(true)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}

var autoTestChannelsOnce sync.Once

func AutomaticallyTestChannels() {
	// 只在Master节点定时测试渠道
	if !common.IsMasterNode {
		return
	}
	autoTestChannelsOnce.Do(func() {
		for {
			if !operation_setting.GetMonitorSetting().AutoTestChannelEnabled {
				time.Sleep(1 * time.Minute)
				continue
			}
			for {
				frequency := operation_setting.GetMonitorSetting().AutoTestChannelMinutes
				time.Sleep(time.Duration(int(math.Round(frequency))) * time.Minute)
				common.SysLog(fmt.Sprintf("automatically test channels with interval %f minutes", frequency))
				common.SysLog("automatically testing all channels")
				_ = testAllChannels(false)
				common.SysLog("automatically channel test finished")
				if !operation_setting.GetMonitorSetting().AutoTestChannelEnabled {
					break
				}
			}
		}
	})
}

func resolveFeiXiangImageProbeModel(channel *model.Channel, testModel string) string {
	modelName := strings.TrimSpace(testModel)
	if modelName != "" {
		return modelName
	}
	if channel != nil && channel.TestModel != nil {
		modelName = strings.TrimSpace(*channel.TestModel)
		if modelName != "" {
			return modelName
		}
	}
	if channel != nil {
		models := channel.GetModels()
		if len(models) > 0 {
			modelName = strings.TrimSpace(models[0])
			if modelName != "" {
				return modelName
			}
		}
	}
	return "gpt-image-2"
}
