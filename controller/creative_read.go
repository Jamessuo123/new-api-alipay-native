package controller

import (
	"encoding/json"
	"errors"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func creativeListOptions(c *gin.Context) model.CreativeListOptions {
	page := 1
	pageSize := 24
	if value, err := strconv.Atoi(c.DefaultQuery("page", "1")); err == nil && value > 0 {
		page = value
	}
	for _, key := range []string{"page_size", "p"} {
		if value, err := strconv.Atoi(c.Query(key)); err == nil && value > 0 {
			pageSize = value
			break
		}
	}
	if pageSize > 100 {
		pageSize = 100
	}
	return model.CreativeListOptions{Page: page, PageSize: pageSize}
}

func creativeJSONValue(raw string, fallback any) any {
	if strings.TrimSpace(raw) == "" {
		return fallback
	}
	var value any
	if err := json.Unmarshal([]byte(raw), &value); err != nil {
		return fallback
	}
	return value
}

func creativeSuccess(c *gin.Context, data any) {
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "", "data": data})
}

func creativeFailure(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{"success": false, "message": message})
}

func creativeCurrentUserID(c *gin.Context) int {
	return c.GetInt("id")
}

func creativeTaskDTO(item model.CreativeGenerationTask) gin.H {
	return gin.H{
		"id":               item.Id,
		"task_no":          item.TaskNo,
		"type":             item.Type,
		"status":           item.Status,
		"model":            item.Model,
		"prompt":           item.Prompt,
		"negative_prompt":  item.NegativePrompt,
		"params":           creativeJSONValue(item.ParamsJSON, gin.H{}),
		"reference_assets": creativeJSONValue(item.ReferenceAssetsJSON, []any{}),
		"result_assets":    creativeJSONValue(item.ResultAssetsJSON, []any{}),
		"relay_task_id":    item.RelayTaskId,
		"cost_quota":       item.CostQuota,
		"cost_usd":         item.CostUSD,
		"error_code":       item.ErrorCode,
		"error_message":    item.ErrorMessage,
		"started_at":       item.StartedAt,
		"completed_at":     item.CompletedAt,
		"created_at":       item.CreatedAt,
		"updated_at":       item.UpdatedAt,
	}
}

func creativeAssetDTO(item model.CreativeAsset) gin.H {
	return gin.H{
		"id":              item.Id,
		"task_id":         item.TaskId,
		"type":            item.Type,
		"source":          item.Source,
		"model":           item.Model,
		"url":             item.URL,
		"thumbnail_url":   item.ThumbnailURL,
		"storage_key":     item.StorageKey,
		"mime_type":       item.MimeType,
		"width":           item.Width,
		"height":          item.Height,
		"duration":        item.Duration,
		"size_bytes":      item.SizeBytes,
		"prompt_snapshot": item.PromptSnapshot,
		"params":          creativeJSONValue(item.ParamsSnapshotJSON, gin.H{}),
		"favorite":        item.Favorite,
		"visibility":      item.Visibility,
		"created_at":      item.CreatedAt,
		"updated_at":      item.UpdatedAt,
	}
}

func creativeProjectDTO(item model.CreativeProject) gin.H {
	return gin.H{
		"id":               item.Id,
		"project_no":       item.ProjectNo,
		"name":             item.Name,
		"title":            item.Name,
		"sku":              item.SKU,
		"category":         item.Category,
		"status":           item.Status,
		"product_asset_id": item.ProductAssetId,
		"cover_url":        item.CoverURL,
		"platforms":        creativeJSONValue(item.PlatformsJSON, []any{}),
		"selling_points":   creativeJSONValue(item.SellingPointsJSON, []any{}),
		"brand_tone":       creativeJSONValue(item.BrandToneJSON, gin.H{}),
		"marketing_goal":   item.MarketingGoal,
		"publish_package":  item.PublishPackage,
		"latest_task_id":   item.LatestTaskId,
		"material_count":   item.MaterialCount,
		"asset_count":      item.MaterialCount,
		"image_count":      item.ImageCount,
		"video_count":      item.VideoCount,
		"created_at":       item.CreatedAt,
		"updated_at":       item.UpdatedAt,
	}
}

func GetCreativeTasks(c *gin.Context) {
	options := creativeListOptions(c)
	items, total, err := model.ListCreativeTasks(creativeCurrentUserID(c), options)
	if err != nil {
		common.SysLog("creative list tasks failed: " + err.Error())
		creativeFailure(c, http.StatusInternalServerError, "读取创作任务失败")
		return
	}
	result := make([]gin.H, 0, len(items))
	for _, item := range items {
		result = append(result, creativeTaskDTO(item))
	}
	creativeSuccess(c, gin.H{"items": result, "total": total, "page": options.Page, "page_size": options.PageSize})
}

func GetCreativeTask(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		creativeFailure(c, http.StatusBadRequest, "任务 ID 无效")
		return
	}
	item, err := model.GetCreativeTask(creativeCurrentUserID(c), id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		creativeFailure(c, http.StatusNotFound, "创作任务不存在")
		return
	}
	if err != nil {
		common.SysLog("creative get task failed: " + err.Error())
		creativeFailure(c, http.StatusInternalServerError, "读取创作任务失败")
		return
	}
	creativeSuccess(c, creativeTaskDTO(*item))
}

func GetCreativeAssets(c *gin.Context) {
	options := creativeListOptions(c)
	items, total, err := model.ListCreativeAssets(creativeCurrentUserID(c), options, strings.TrimSpace(c.Query("type")))
	if err != nil {
		common.SysLog("creative list assets failed: " + err.Error())
		creativeFailure(c, http.StatusInternalServerError, "读取素材库失败")
		return
	}
	result := make([]gin.H, 0, len(items))
	for _, item := range items {
		result = append(result, creativeAssetDTO(item))
	}
	creativeSuccess(c, gin.H{"items": result, "total": total, "page": options.Page, "page_size": options.PageSize})
}

func GetCreativeAsset(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		creativeFailure(c, http.StatusBadRequest, "素材 ID 无效")
		return
	}
	item, err := model.GetCreativeAsset(creativeCurrentUserID(c), id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		creativeFailure(c, http.StatusNotFound, "素材不存在")
		return
	}
	if err != nil {
		common.SysLog("creative get asset failed: " + err.Error())
		creativeFailure(c, http.StatusInternalServerError, "读取素材失败")
		return
	}
	creativeSuccess(c, creativeAssetDTO(*item))
}

func GetCreativeProjects(c *gin.Context) {
	options := creativeListOptions(c)
	items, total, err := model.ListCreativeProjects(creativeCurrentUserID(c), options)
	if err != nil {
		common.SysLog("creative list projects failed: " + err.Error())
		creativeFailure(c, http.StatusInternalServerError, "读取项目失败")
		return
	}
	result := make([]gin.H, 0, len(items))
	for _, item := range items {
		result = append(result, creativeProjectDTO(item))
	}
	creativeSuccess(c, gin.H{"items": result, "total": total, "page": options.Page, "page_size": options.PageSize})
}

func GetCreativeProject(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		creativeFailure(c, http.StatusBadRequest, "项目 ID 无效")
		return
	}
	item, err := model.GetCreativeProject(creativeCurrentUserID(c), id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		creativeFailure(c, http.StatusNotFound, "项目不存在")
		return
	}
	if err != nil {
		common.SysLog("creative get project failed: " + err.Error())
		creativeFailure(c, http.StatusInternalServerError, "读取项目失败")
		return
	}
	creativeSuccess(c, creativeProjectDTO(*item))
}

func GetCreativePreferences(c *gin.Context) {
	rows, err := model.ListCreativeUserSettings(creativeCurrentUserID(c))
	if err != nil {
		common.SysLog("creative list preferences failed: " + err.Error())
		creativeFailure(c, http.StatusInternalServerError, "读取创作设置失败")
		return
	}
	values := gin.H{}
	for _, row := range rows {
		values[row.Key] = creativeJSONValue(row.ValueJSON, nil)
	}
	creativeSuccess(c, gin.H{
		"values": values,
		"defaults": gin.H{
			"image_model":   "gpt-image-2",
			"video_model":   "",
			"image_ratio":   "1:1",
			"auto_save":     true,
			"quality_check": true,
		},
		"read_only_stage": true,
	})
}

type creativeCapabilityAccumulator struct {
	Model        string
	MediaType    string
	Groups       map[string]struct{}
	ChannelIDs   map[int]struct{}
	ChannelTypes map[int]struct{}
}

func creativeMediaType(modelName string) string {
	name := strings.ToLower(modelName)
	videoHints := []string{"seedance", "veo", "kling", "sora", "hailuo", "minimax-video", "wan-video", "video"}
	for _, hint := range videoHints {
		if strings.Contains(name, hint) {
			return "video"
		}
	}
	imageHints := []string{"image", "dall-e", "flux", "midjourney", "ideogram", "recraft", "imagen"}
	for _, hint := range imageHints {
		if strings.Contains(name, hint) {
			return "image"
		}
	}
	return ""
}

func GetCreativeCapabilities(c *gin.Context) {
	userID := creativeCurrentUserID(c)
	group, err := model.GetUserGroup(userID, false)
	if err != nil || strings.TrimSpace(group) == "" {
		group = "default"
	}
	rows, err := model.ListCreativeCapabilities(group)
	if err != nil {
		common.SysLog("creative list capabilities failed: " + err.Error())
		creativeFailure(c, http.StatusInternalServerError, "读取创作模型能力失败")
		return
	}
	byModel := map[string]*creativeCapabilityAccumulator{}
	for _, row := range rows {
		mediaType := creativeMediaType(row.Model)
		if mediaType == "" {
			continue
		}
		entry := byModel[row.Model]
		if entry == nil {
			entry = &creativeCapabilityAccumulator{Model: row.Model, MediaType: mediaType, Groups: map[string]struct{}{}, ChannelIDs: map[int]struct{}{}, ChannelTypes: map[int]struct{}{}}
			byModel[row.Model] = entry
		}
		entry.Groups[row.Group] = struct{}{}
		entry.ChannelIDs[row.ChannelId] = struct{}{}
		entry.ChannelTypes[row.ChannelType] = struct{}{}
	}

	imageModels := make([]gin.H, 0)
	videoModels := make([]gin.H, 0)
	modelNames := make([]string, 0, len(byModel))
	for name := range byModel {
		modelNames = append(modelNames, name)
	}
	sort.Strings(modelNames)
	for _, name := range modelNames {
		entry := byModel[name]
		groups := make([]string, 0, len(entry.Groups))
		for value := range entry.Groups {
			groups = append(groups, value)
		}
		sort.Strings(groups)
		profile := gin.H{"id": entry.Model, "model": entry.Model, "media_type": entry.MediaType, "groups": groups, "channel_count": len(entry.ChannelIDs), "available": len(entry.ChannelIDs) > 0}
		if entry.MediaType == "image" {
			profile["ratios"] = []string{"1:1", "3:4", "4:5", "16:9", "9:16"}
			profile["resolutions"] = []string{"1K", "2K", "4K"}
			profile["reference_modes"] = []string{"single"}
			imageModels = append(imageModels, profile)
		} else {
			profile["ratios"] = []string{"16:9", "9:16", "1:1"}
			profile["resolutions"] = []string{"720p", "1080p"}
			profile["durations"] = []int{5, 10, 15}
			profile["reference_modes"] = []string{"multi", "first_last"}
			videoModels = append(videoModels, profile)
		}
	}
	creativeSuccess(c, gin.H{
		"group":           group,
		"image_models":    imageModels,
		"video_models":    videoModels,
		"image_enabled":   len(imageModels) > 0,
		"video_enabled":   len(videoModels) > 0,
		"read_only_stage": true,
	})
}
