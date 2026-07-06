package model

import (
	"encoding/json"
	"fmt"
	"strings"

	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/setting/billing_setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/QuantumNous/new-api/types"
)

type Pricing struct {
	ModelName              string                          `json:"model_name"`
	Description            string                          `json:"description,omitempty"`
	Icon                   string                          `json:"icon,omitempty"`
	Tags                   string                          `json:"tags,omitempty"`
	VendorID               int                             `json:"vendor_id,omitempty"`
	QuotaType              int                             `json:"quota_type"`
	ModelRatio             float64                         `json:"model_ratio"`
	ModelPrice             float64                         `json:"model_price"`
	OwnerBy                string                          `json:"owner_by"`
	CompletionRatio        float64                         `json:"completion_ratio"`
	CacheRatio             *float64                        `json:"cache_ratio,omitempty"`
	CreateCacheRatio       *float64                        `json:"create_cache_ratio,omitempty"`
	ImageRatio             *float64                        `json:"image_ratio,omitempty"`
	AudioRatio             *float64                        `json:"audio_ratio,omitempty"`
	AudioCompletionRatio   *float64                        `json:"audio_completion_ratio,omitempty"`
	VideoInputRatio        *float64                        `json:"video_input_ratio,omitempty"` // FEIXIANG_VIDEO_INPUT_RATIO_PRICING_V1_BACKEND_FIELD
	EnableGroup            []string                        `json:"enable_groups"`
	SupportedEndpointTypes []constant.EndpointType         `json:"supported_endpoint_types"`
	BillingMode            string                          `json:"billing_mode,omitempty"`
	BillingExpr            string                          `json:"billing_expr,omitempty"`
	PricingVersion         string                          `json:"pricing_version,omitempty"`
	PricingKind            string                          `json:"pricing_kind,omitempty"`
	VideoPricing           *FeiXiangVideoPricingContractV1 `json:"video_pricing,omitempty"`
	VideoResolutionPricing *VideoResolutionPricingPublic   `json:"video_resolution_pricing,omitempty"` // FEIXIANG_VIDEO_RESOLUTION_PRICING_V2_API_FIELD
}

type PricingVendor struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Icon        string `json:"icon,omitempty"`
}

var (
	pricingMap           []Pricing
	vendorsList          []PricingVendor
	supportedEndpointMap map[string]common.EndpointInfo
	lastGetPricingTime   time.Time
	updatePricingLock    sync.Mutex

	// 缓存映射：模型名 -> 启用分组 / 计费类型
	modelEnableGroups     = make(map[string][]string)
	modelQuotaTypeMap     = make(map[string]int)
	modelEnableGroupsLock = sync.RWMutex{}
)

var (
	modelSupportEndpointTypes = make(map[string][]constant.EndpointType)
	modelSupportEndpointsLock = sync.RWMutex{}
)

// FEIXIANG_VIDEO_INPUT_RATIO_PRICING_V1_BACKEND_HELPERS
// VideoInputRatio keeps the existing model pricing strategy unchanged:
// no-video-input uses ModelRatio; with-video-input uses this independent map.
// FEIXIANG_VIDEO_PRICING_ADMIN_PERSIST_V1_BACKEND_DEFAULTS
func getFeiXiangDefaultVideoInputRatioMapV1() map[string]float64 {
	return map[string]float64{
		"seedance-2.0-480p":      3.1,
		"seedance-2.0-720p":      3.1,
		"seedance-2.0-1080p":     3.455,
		"seedance-2.0-4k":        1.77,
		"seedance-2.0-fast-480p": 2.455,
		"seedance-2.0-fast-720p": 2.455,
	}
}

// FEIXIANG_VIDEO_PRICING_ADMIN_PERSIST_V1_BACKEND_HELPER
// VideoInputRatio is an admin-persisted option. For existing deployments that do
// not have the new option row yet, known Seedance defaults are returned in memory
// so operators do not need to manually INSERT into options after every deploy.
func getFeiXiangVideoInputRatioMapV1() map[string]float64 {
	defaults := getFeiXiangDefaultVideoInputRatioMapV1()
	raw := strings.TrimSpace(common.OptionMap["VideoInputRatio"])
	if raw == "" || raw == "{}" || raw == "null" {
		return defaults
	}

	pricingMap := make(map[string]float64)
	if err := json.Unmarshal([]byte(raw), &pricingMap); err != nil || len(pricingMap) == 0 {
		return defaults
	}

	for key, value := range defaults {
		if _, ok := pricingMap[key]; !ok {
			pricingMap[key] = value
		}
	}
	return pricingMap
}

func getFeiXiangVideoInputRatioV1(modelName string) *float64 {
	pricingMap := getFeiXiangVideoInputRatioMapV1()
	if len(pricingMap) == 0 {
		return nil
	}
	if value, ok := pricingMap[modelName]; ok && value > 0 {
		v := value
		return &v
	}
	return nil
}

func GetPricing() []Pricing {
	if time.Since(lastGetPricingTime) > time.Minute*1 || len(pricingMap) == 0 {
		updatePricingLock.Lock()
		defer updatePricingLock.Unlock()
		// Double check after acquiring the lock
		if time.Since(lastGetPricingTime) > time.Minute*1 || len(pricingMap) == 0 {
			modelSupportEndpointsLock.Lock()
			defer modelSupportEndpointsLock.Unlock()
			updatePricing()
		}
	}
	return pricingMap
}

func InvalidatePricingCache() {
	updatePricingLock.Lock()
	defer updatePricingLock.Unlock()

	pricingMap = nil
	vendorsList = nil
	lastGetPricingTime = time.Time{}
}

// GetVendors 返回当前定价接口使用到的供应商信息
func GetVendors() []PricingVendor {
	if time.Since(lastGetPricingTime) > time.Minute*1 || len(pricingMap) == 0 {
		// 保证先刷新一次
		GetPricing()
	}
	return vendorsList
}

func GetModelSupportEndpointTypes(model string) []constant.EndpointType {
	if model == "" {
		return make([]constant.EndpointType, 0)
	}
	modelSupportEndpointsLock.RLock()
	defer modelSupportEndpointsLock.RUnlock()
	if endpoints, ok := modelSupportEndpointTypes[model]; ok {
		return endpoints
	}
	return make([]constant.EndpointType, 0)
}

func updatePricing() {
	//modelRatios := common.GetModelRatios()
	enableAbilities, err := GetAllEnableAbilityWithChannels()
	enableAbilities = feiXiangAppendVideoPricingAbilities(enableAbilities)
	if err != nil {
		common.SysLog(fmt.Sprintf("GetAllEnableAbilityWithChannels error: %v", err))
		return
	}
	// 预加载模型元数据与供应商一次，避免循环查询
	var allMeta []Model
	_ = DB.Find(&allMeta).Error
	metaMap := make(map[string]*Model)
	prefixList := make([]*Model, 0)
	suffixList := make([]*Model, 0)
	containsList := make([]*Model, 0)
	for i := range allMeta {
		m := &allMeta[i]
		if m.NameRule == NameRuleExact {
			metaMap[m.ModelName] = m
		} else {
			switch m.NameRule {
			case NameRulePrefix:
				prefixList = append(prefixList, m)
			case NameRuleSuffix:
				suffixList = append(suffixList, m)
			case NameRuleContains:
				containsList = append(containsList, m)
			}
		}
	}

	// 将非精确规则模型匹配到 metaMap
	for _, m := range prefixList {
		for _, pricingModel := range enableAbilities {
			if strings.HasPrefix(pricingModel.Model, m.ModelName) {
				if _, exists := metaMap[pricingModel.Model]; !exists {
					metaMap[pricingModel.Model] = m
				}
			}
		}
	}
	for _, m := range suffixList {
		for _, pricingModel := range enableAbilities {
			if strings.HasSuffix(pricingModel.Model, m.ModelName) {
				if _, exists := metaMap[pricingModel.Model]; !exists {
					metaMap[pricingModel.Model] = m
				}
			}
		}
	}
	for _, m := range containsList {
		for _, pricingModel := range enableAbilities {
			if strings.Contains(pricingModel.Model, m.ModelName) {
				if _, exists := metaMap[pricingModel.Model]; !exists {
					metaMap[pricingModel.Model] = m
				}
			}
		}
	}

	// 预加载供应商
	var vendors []Vendor
	_ = DB.Find(&vendors).Error
	vendorMap := make(map[int]*Vendor)
	for i := range vendors {
		vendorMap[vendors[i].Id] = &vendors[i]
	}

	// 初始化默认供应商映射
	initDefaultVendorMapping(metaMap, vendorMap, enableAbilities)

	// 构建对前端友好的供应商列表
	vendorsList = make([]PricingVendor, 0, len(vendorMap))
	for _, v := range vendorMap {
		vendorsList = append(vendorsList, PricingVendor{
			ID:          v.Id,
			Name:        v.Name,
			Description: v.Description,
			Icon:        v.Icon,
		})
	}

	modelGroupsMap := make(map[string]*types.Set[string])

	for _, ability := range enableAbilities {
		groups, ok := modelGroupsMap[ability.Model]
		if !ok {
			groups = types.NewSet[string]()
			modelGroupsMap[ability.Model] = groups
		}
		groups.Add(ability.Group)
	}

	//这里使用切片而不是Set，因为一个模型可能支持多个端点类型，并且第一个端点是优先使用端点
	modelSupportEndpointsStr := make(map[string][]string)

	// 先根据已有能力填充原生端点
	for _, ability := range enableAbilities {
		endpoints := modelSupportEndpointsStr[ability.Model]
		channelTypes := common.GetEndpointTypesByChannelType(ability.ChannelType, ability.Model)
		for _, channelType := range channelTypes {
			if !common.StringsContains(endpoints, string(channelType)) {
				endpoints = append(endpoints, string(channelType))
			}
		}
		modelSupportEndpointsStr[ability.Model] = endpoints
	}

	// 再补充模型自定义端点：若配置有效则替换默认端点，不做合并
	for modelName, meta := range metaMap {
		if strings.TrimSpace(meta.Endpoints) == "" {
			continue
		}
		var raw map[string]interface{}
		if err := json.Unmarshal([]byte(meta.Endpoints), &raw); err == nil {
			endpoints := make([]string, 0, len(raw))
			for k, v := range raw {
				switch v.(type) {
				case string, map[string]interface{}:
					if !common.StringsContains(endpoints, k) {
						endpoints = append(endpoints, k)
					}
				}
			}
			if len(endpoints) > 0 {
				modelSupportEndpointsStr[modelName] = endpoints
			}
		}
	}

	modelSupportEndpointTypes = make(map[string][]constant.EndpointType)
	for model, endpoints := range modelSupportEndpointsStr {
		supportedEndpoints := make([]constant.EndpointType, 0)
		for _, endpointStr := range endpoints {
			endpointType := constant.EndpointType(endpointStr)
			supportedEndpoints = append(supportedEndpoints, endpointType)
		}
		modelSupportEndpointTypes[model] = supportedEndpoints
	}

	// 构建全局 supportedEndpointMap（默认 + 自定义覆盖）
	supportedEndpointMap = make(map[string]common.EndpointInfo)
	// 1. 默认端点
	for _, endpoints := range modelSupportEndpointTypes {
		for _, et := range endpoints {
			if info, ok := common.GetDefaultEndpointInfo(et); ok {
				if _, exists := supportedEndpointMap[string(et)]; !exists {
					supportedEndpointMap[string(et)] = info
				}
			}
		}
	}
	// 2. 自定义端点（models 表）覆盖默认
	for _, meta := range metaMap {
		if strings.TrimSpace(meta.Endpoints) == "" {
			continue
		}
		var raw map[string]interface{}
		if err := json.Unmarshal([]byte(meta.Endpoints), &raw); err == nil {
			for k, v := range raw {
				switch val := v.(type) {
				case string:
					supportedEndpointMap[k] = common.EndpointInfo{Path: val, Method: "POST"}
				case map[string]interface{}:
					ep := common.EndpointInfo{Method: "POST"}
					if p, ok := val["path"].(string); ok {
						ep.Path = p
					}
					if m, ok := val["method"].(string); ok {
						ep.Method = strings.ToUpper(m)
					}
					supportedEndpointMap[k] = ep
				default:
					// ignore unsupported types
				}
			}
		}
	}

	pricingMap = make([]Pricing, 0)
	for model, groups := range modelGroupsMap {
		pricing := Pricing{
			ModelName:              model,
			EnableGroup:            groups.Items(),
			SupportedEndpointTypes: modelSupportEndpointTypes[model],
		}

		// 补充模型元数据（描述、标签、供应商、状态）
		if meta, ok := metaMap[model]; ok {
			// 若模型被禁用(status!=1)，则直接跳过，不返回给前端
			if meta.Status != 1 {
				continue
			}
			pricing.Description = meta.Description
			pricing.Icon = meta.Icon
			pricing.Tags = meta.Tags
			pricing.VendorID = meta.VendorID
		}
		modelPrice, findPrice := ratio_setting.GetModelPrice(model, false)
		if findPrice {
			pricing.ModelPrice = modelPrice
			pricing.QuotaType = 1
		} else {
			modelRatio, _, _ := ratio_setting.GetModelRatio(model)
			pricing.ModelRatio = modelRatio
			pricing.CompletionRatio = ratio_setting.GetCompletionRatio(model)
			pricing.QuotaType = 0
		}
		if cacheRatio, ok := ratio_setting.GetCacheRatio(model); ok {
			pricing.CacheRatio = &cacheRatio
		}
		if createCacheRatio, ok := ratio_setting.GetCreateCacheRatio(model); ok {
			pricing.CreateCacheRatio = &createCacheRatio
		}
		if imageRatio, ok := ratio_setting.GetImageRatio(model); ok {
			pricing.ImageRatio = &imageRatio
		}
		if ratio_setting.ContainsAudioRatio(model) {
			audioRatio := ratio_setting.GetAudioRatio(model)
			pricing.AudioRatio = &audioRatio
		}
		if ratio_setting.ContainsAudioCompletionRatio(model) {
			audioCompletionRatio := ratio_setting.GetAudioCompletionRatio(model)
			pricing.AudioCompletionRatio = &audioCompletionRatio
		}
		if billingMode := billing_setting.GetBillingMode(model); billingMode == "tiered_expr" {
			if expr, ok := billing_setting.GetBillingExpr(model); ok && strings.TrimSpace(expr) != "" {
				pricing.BillingMode = billingMode
				pricing.BillingExpr = expr
			}
		}
		enrichFeiXiangVideoPricingContractV1(&pricing)

		// FEIXIANG_VIDEO_INPUT_RATIO_PRICING_V1_BACKEND_ASSIGN
		// video_input_ratio is independent from model_ratio and only affects with-video-input display.
		if videoInputRatio := getFeiXiangVideoInputRatioV1(model); videoInputRatio != nil {
			pricing.VideoInputRatio = videoInputRatio
		}

		// FEIXIANG_VIDEO_RESOLUTION_PRICING_V2_API_ASSIGN
		// /api/pricing returns the backend-configured resolution table first.
		// Existing per-resolution ModelRatio/VideoInputRatio values are kept as a fallback
		// so the frontend can display consistent backend prices before full migration.
		if videoResolutionPricing := GetVideoResolutionPricingForModel(model); videoResolutionPricing != nil {
			pricing.VideoResolutionPricing = videoResolutionPricing
			pricing.PricingKind = "video"
		} else if videoResolutionPricing := BuildVideoResolutionPricingFromLegacyModelPricing(model, pricing.ModelRatio, pricing.VideoInputRatio, pricing.CompletionRatio); videoResolutionPricing != nil {
			pricing.VideoResolutionPricing = videoResolutionPricing
			pricing.PricingKind = "video"
		}
		pricingMap = append(pricingMap, pricing)
	}

	// 防止大更新后数据不通用
	if len(pricingMap) > 0 {
		pricingMap[0].PricingVersion = "video-resolution-pricing-v2"
	}

	// 刷新缓存映射，供高并发快速查询
	modelEnableGroupsLock.Lock()
	modelEnableGroups = make(map[string][]string)
	modelQuotaTypeMap = make(map[string]int)
	for _, p := range pricingMap {
		modelEnableGroups[p.ModelName] = p.EnableGroup
		modelQuotaTypeMap[p.ModelName] = p.QuotaType
	}
	modelEnableGroupsLock.Unlock()

	lastGetPricingTime = time.Now()
}

// GetSupportedEndpointMap 返回全局端点到路径的映射
func GetSupportedEndpointMap() map[string]common.EndpointInfo {
	return supportedEndpointMap
}

// FEIXIANG_PRICING_INCLUDE_VIDEO_MODELS_V1
func feiXiangAppendVideoPricingAbilities(enableAbilities []AbilityWithChannel) []AbilityWithChannel {
	seen := make(map[string]struct{}, len(enableAbilities))
	for _, ability := range enableAbilities {
		key := ability.Group + "\x00" + ability.Model + "\x00" + fmt.Sprintf("%d", ability.ChannelId)
		seen[key] = struct{}{}
	}

	var channels []Channel
	if err := DB.Where("status = ?", common.ChannelStatusEnabled).Find(&channels).Error; err != nil {
		common.SysLog(fmt.Sprintf("feiXiangAppendVideoPricingAbilities query channels failed: %v", err))
		return enableAbilities
	}

	for _, channel := range channels {
		if !feiXiangPricingIsVideoCatalogChannel(channel) {
			continue
		}
		groups := feiXiangPricingSplitCSV(channel.Group)
		models := feiXiangPricingSplitCSV(channel.Models)
		for _, modelName := range models {
			if !feiXiangPricingIsSeedanceModelName(modelName) {
				continue
			}
			for _, group := range groups {
				if group == "" {
					continue
				}
				key := group + "\x00" + modelName + "\x00" + fmt.Sprintf("%d", channel.Id)
				if _, ok := seen[key]; ok {
					continue
				}
				seen[key] = struct{}{}
				enableAbilities = append(enableAbilities, AbilityWithChannel{
					Ability: Ability{
						Group:     group,
						Model:     modelName,
						ChannelId: channel.Id,
						Enabled:   true,
						Priority:  channel.Priority,
						Weight:    uint(channel.GetWeight()),
						Tag:       channel.Tag,
					},
					ChannelType: channel.Type,
				})
			}
		}
	}
	return enableAbilities
}

func feiXiangPricingIsVideoCatalogChannel(channel Channel) bool {
	if channel.Type == constant.ChannelTypeDoubaoVideo {
		return true
	}
	lowerName := strings.ToLower(channel.Name)
	lowerModels := strings.ToLower(channel.Models)
	return strings.Contains(lowerName, "seedance") || strings.Contains(lowerModels, "seedance") || strings.Contains(lowerName, "doubao-seedance")
}

func feiXiangPricingIsSeedanceModelName(modelName string) bool {
	modelName = strings.ToLower(strings.TrimSpace(modelName))
	return strings.Contains(modelName, "seedance") || strings.Contains(modelName, "doubao-seedance")
}

func feiXiangPricingSplitCSV(value string) []string {
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		out = append(out, part)
	}
	return out
}

// FEIXIANG_VIDEO_PRICING_CONTRACT_V1_BACKEND
type FeiXiangVideoPricingItemV1 struct {
	Resolution string  `json:"resolution"`
	Mode       string  `json:"mode"`
	ModeLabel  string  `json:"mode_label"`
	Price      float64 `json:"price"`
	Currency   string  `json:"currency,omitempty"`
	Unit       string  `json:"unit,omitempty"`
}

type FeiXiangVideoPricingContractV1 struct {
	Provider        string                       `json:"provider,omitempty"`
	ProviderModelID string                       `json:"provider_model_id,omitempty"`
	DisplayName     string                       `json:"display_name,omitempty"`
	BillingRule     string                       `json:"billing_rule,omitempty"`
	Unit            string                       `json:"unit,omitempty"`
	OutputIncluded  bool                         `json:"output_included"`
	Items           []FeiXiangVideoPricingItemV1 `json:"items"`
}

type feiXiangSeedanceVideoPricingRowV1 struct {
	Resolution        string
	WithVideoInput    float64
	WithoutVideoInput float64
}

func enrichFeiXiangVideoPricingContractV1(pricing *Pricing) {
	if pricing == nil {
		return
	}
	contract := getFeiXiangVideoPricingContractV1(pricing.ModelName)
	if contract == nil {
		return
	}
	pricing.PricingKind = "video"
	pricing.VideoPricing = contract
}

func getFeiXiangVideoPricingContractV1(modelName string) *FeiXiangVideoPricingContractV1 {
	name := strings.ToLower(strings.TrimSpace(modelName))
	if strings.HasPrefix(name, "seedance-2.0-fast-") {
		return buildFeiXiangSeedanceVideoPricingContractV1(
			"Doubao",
			"doubao-seedance-2-0-fast-260128",
			"Doubao-Seedance-2.0 Fast",
			[]feiXiangSeedanceVideoPricingRowV1{
				{Resolution: "480p", WithVideoInput: 4.91, WithoutVideoInput: 8.26},
				{Resolution: "720p", WithVideoInput: 4.91, WithoutVideoInput: 8.26},
			},
		)
	}
	if strings.HasPrefix(name, "seedance-2.0-") {
		return buildFeiXiangSeedanceVideoPricingContractV1(
			"Doubao",
			"doubao-seedance-2-0-260128",
			"Doubao-Seedance-2.0",
			[]feiXiangSeedanceVideoPricingRowV1{
				{Resolution: "480p", WithVideoInput: 6.20, WithoutVideoInput: 10.18},
				{Resolution: "720p", WithVideoInput: 6.20, WithoutVideoInput: 10.18},
				{Resolution: "1080p", WithVideoInput: 6.91, WithoutVideoInput: 11.36},
				{Resolution: "4k", WithVideoInput: 3.54, WithoutVideoInput: 5.75},
			},
		)
	}
	return nil
}

func buildFeiXiangSeedanceVideoPricingContractV1(provider, providerModelID, displayName string, rows []feiXiangSeedanceVideoPricingRowV1) *FeiXiangVideoPricingContractV1 {
	items := make([]FeiXiangVideoPricingItemV1, 0, len(rows)*2)
	for _, row := range rows {
		items = append(items,
			FeiXiangVideoPricingItemV1{
				Resolution: row.Resolution,
				Mode:       "with_video_input",
				ModeLabel:  "含视频输入",
				Price:      row.WithVideoInput,
				Currency:   "USD",
				Unit:       "1M tokens",
			},
			FeiXiangVideoPricingItemV1{
				Resolution: row.Resolution,
				Mode:       "without_video_input",
				ModeLabel:  "无视频输入",
				Price:      row.WithoutVideoInput,
				Currency:   "USD",
				Unit:       "1M tokens",
			},
		)
	}
	return &FeiXiangVideoPricingContractV1{
		Provider:        provider,
		ProviderModelID: providerModelID,
		DisplayName:     displayName,
		BillingRule:     "按视频生成任务计费",
		Unit:            "1M tokens",
		OutputIncluded:  true,
		Items:           items,
	}
}
