package model

import (
	"strings"

	"github.com/QuantumNous/new-api/common"
)

// CreativeListOptions is intentionally read-only and shared by the P2 Creative APIs.
type CreativeListOptions struct {
	Page     int
	PageSize int
}

func (o CreativeListOptions) normalized() CreativeListOptions {
	if o.Page < 1 {
		o.Page = 1
	}
	if o.PageSize < 1 {
		o.PageSize = 24
	}
	if o.PageSize > 100 {
		o.PageSize = 100
	}
	return o
}

type CreativeGenerationTask struct {
	Id                  int64  `json:"id" gorm:"column:id"`
	UserId              int64  `json:"-" gorm:"column:user_id"`
	TaskNo              string `json:"task_no" gorm:"column:task_no"`
	Type                string `json:"type" gorm:"column:type"`
	Status              string `json:"status" gorm:"column:status"`
	Model               string `json:"model" gorm:"column:model"`
	Prompt              string `json:"prompt" gorm:"column:prompt"`
	NegativePrompt      string `json:"negative_prompt" gorm:"column:negative_prompt"`
	ParamsJSON          string `json:"-" gorm:"column:params_json"`
	ReferenceAssetsJSON string `json:"-" gorm:"column:reference_assets_json"`
	ResultAssetsJSON    string `json:"-" gorm:"column:result_assets_json"`
	RelayTaskId         string `json:"relay_task_id,omitempty" gorm:"column:relay_task_id"`
	CostQuota           int64  `json:"cost_quota" gorm:"column:cost_quota"`
	CostUSD             string `json:"cost_usd" gorm:"column:cost_usd"`
	ErrorCode           string `json:"error_code,omitempty" gorm:"column:error_code"`
	ErrorMessage        string `json:"error_message,omitempty" gorm:"column:error_message"`
	StartedAt           int64  `json:"started_at" gorm:"column:started_at"`
	CompletedAt         int64  `json:"completed_at" gorm:"column:completed_at"`
	DeletedAt           int64  `json:"-" gorm:"column:deleted_at"`
	CreatedAt           int64  `json:"created_at" gorm:"column:created_at"`
	UpdatedAt           int64  `json:"updated_at" gorm:"column:updated_at"`
}

func (CreativeGenerationTask) TableName() string { return "creative_generation_tasks" }

type CreativeAsset struct {
	Id                 int64   `json:"id" gorm:"column:id"`
	UserId             int64   `json:"-" gorm:"column:user_id"`
	TaskId             int64   `json:"task_id" gorm:"column:task_id"`
	Type               string  `json:"type" gorm:"column:type"`
	Source             string  `json:"source" gorm:"column:source"`
	Model              string  `json:"model" gorm:"column:model"`
	URL                string  `json:"url" gorm:"column:url"`
	ThumbnailURL       string  `json:"thumbnail_url" gorm:"column:thumbnail_url"`
	StorageKey         string  `json:"storage_key,omitempty" gorm:"column:storage_key"`
	MimeType           string  `json:"mime_type,omitempty" gorm:"column:mime_type"`
	Width              int64   `json:"width" gorm:"column:width"`
	Height             int64   `json:"height" gorm:"column:height"`
	Duration           float64 `json:"duration" gorm:"column:duration"`
	SizeBytes          int64   `json:"size_bytes" gorm:"column:size_bytes"`
	PromptSnapshot     string  `json:"prompt_snapshot" gorm:"column:prompt_snapshot"`
	ParamsSnapshotJSON string  `json:"-" gorm:"column:params_snapshot_json"`
	Favorite           bool    `json:"favorite" gorm:"column:favorite"`
	Visibility         string  `json:"visibility" gorm:"column:visibility"`
	DeletedAt          int64   `json:"-" gorm:"column:deleted_at"`
	CreatedAt          int64   `json:"created_at" gorm:"column:created_at"`
	UpdatedAt          int64   `json:"updated_at" gorm:"column:updated_at"`
}

func (CreativeAsset) TableName() string { return "creative_assets" }

type CreativeProject struct {
	Id                int64  `json:"id" gorm:"column:id"`
	UserId            int64  `json:"-" gorm:"column:user_id"`
	ProjectNo         string `json:"project_no" gorm:"column:project_no"`
	Name              string `json:"name" gorm:"column:name"`
	SKU               string `json:"sku" gorm:"column:sku"`
	Category          string `json:"category" gorm:"column:category"`
	Status            string `json:"status" gorm:"column:status"`
	ProductAssetId    int64  `json:"product_asset_id" gorm:"column:product_asset_id"`
	CoverURL          string `json:"cover_url" gorm:"column:cover_url"`
	PlatformsJSON     string `json:"-" gorm:"column:platforms_json"`
	SellingPointsJSON string `json:"-" gorm:"column:selling_points_json"`
	BrandToneJSON     string `json:"-" gorm:"column:brand_tone_json"`
	MarketingGoal     string `json:"marketing_goal" gorm:"column:marketing_goal"`
	PublishPackage    string `json:"publish_package" gorm:"column:publish_package"`
	LatestTaskId      int64  `json:"latest_task_id" gorm:"column:latest_task_id"`
	MaterialCount     int64  `json:"material_count" gorm:"column:material_count"`
	ImageCount        int64  `json:"image_count" gorm:"column:image_count"`
	VideoCount        int64  `json:"video_count" gorm:"column:video_count"`
	DeletedAt         int64  `json:"-" gorm:"column:deleted_at"`
	CreatedAt         int64  `json:"created_at" gorm:"column:created_at"`
	UpdatedAt         int64  `json:"updated_at" gorm:"column:updated_at"`
}

func (CreativeProject) TableName() string { return "creative_projects" }

type CreativeUserSetting struct {
	Id        int64  `json:"id" gorm:"column:id"`
	UserId    int64  `json:"-" gorm:"column:user_id"`
	Key       string `json:"key" gorm:"column:key"`
	ValueJSON string `json:"-" gorm:"column:value_json"`
	CreatedAt int64  `json:"created_at" gorm:"column:created_at"`
	UpdatedAt int64  `json:"updated_at" gorm:"column:updated_at"`
}

func (CreativeUserSetting) TableName() string { return "creative_user_settings" }

type CreativeCapabilityRow struct {
	Model       string `json:"model"`
	Group       string `json:"group" gorm:"column:group_name"`
	ChannelId   int    `json:"channel_id"`
	ChannelType int    `json:"channel_type"`
	Priority    int64  `json:"priority"`
	Weight      uint   `json:"weight"`
}

func ListCreativeTasks(userID int, options CreativeListOptions) ([]CreativeGenerationTask, int64, error) {
	options = options.normalized()
	if !DB.Migrator().HasTable("creative_generation_tasks") {
		return []CreativeGenerationTask{}, 0, nil
	}
	query := DB.Model(&CreativeGenerationTask{}).Where("user_id = ? AND deleted_at = ?", userID, 0)
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []CreativeGenerationTask
	err := query.Order("created_at DESC, id DESC").Offset((options.Page - 1) * options.PageSize).Limit(options.PageSize).Find(&items).Error
	return items, total, err
}

func GetCreativeTask(userID int, id int64) (*CreativeGenerationTask, error) {
	var item CreativeGenerationTask
	err := DB.Where("id = ? AND user_id = ? AND deleted_at = ?", id, userID, 0).First(&item).Error
	return &item, err
}

func ListCreativeAssets(userID int, options CreativeListOptions, assetType string) ([]CreativeAsset, int64, error) {
	options = options.normalized()
	if !DB.Migrator().HasTable("creative_assets") {
		return []CreativeAsset{}, 0, nil
	}
	query := DB.Model(&CreativeAsset{}).Where("user_id = ? AND deleted_at = ?", userID, 0)
	if assetType != "" && assetType != "all" {
		query = query.Where("type = ?", assetType)
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []CreativeAsset
	err := query.Order("created_at DESC, id DESC").Offset((options.Page - 1) * options.PageSize).Limit(options.PageSize).Find(&items).Error
	return items, total, err
}

func GetCreativeAsset(userID int, id int64) (*CreativeAsset, error) {
	var item CreativeAsset
	err := DB.Where("id = ? AND user_id = ? AND deleted_at = ?", id, userID, 0).First(&item).Error
	return &item, err
}

func ListCreativeProjects(userID int, options CreativeListOptions) ([]CreativeProject, int64, error) {
	options = options.normalized()
	if !DB.Migrator().HasTable("creative_projects") {
		return []CreativeProject{}, 0, nil
	}
	query := DB.Model(&CreativeProject{}).Where("user_id = ? AND deleted_at = ?", userID, 0)
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []CreativeProject
	err := query.Order("updated_at DESC, id DESC").Offset((options.Page - 1) * options.PageSize).Limit(options.PageSize).Find(&items).Error
	return items, total, err
}

func GetCreativeProject(userID int, id int64) (*CreativeProject, error) {
	var item CreativeProject
	err := DB.Where("id = ? AND user_id = ? AND deleted_at = ?", id, userID, 0).First(&item).Error
	return &item, err
}

func ListCreativeUserSettings(userID int) ([]CreativeUserSetting, error) {
	if !DB.Migrator().HasTable("creative_user_settings") {
		return []CreativeUserSetting{}, nil
	}
	var items []CreativeUserSetting
	err := DB.Where("user_id = ?", userID).Order("updated_at DESC, id DESC").Find(&items).Error
	return items, err
}

func ListCreativeCapabilities(group string) ([]CreativeCapabilityRow, error) {
	group = strings.TrimSpace(group)
	if group == "" {
		group = "default"
	}
	groups := []string{group}
	if group != "default" {
		groups = append(groups, "default")
	}
	var rows []CreativeCapabilityRow
	err := DB.Table("abilities").
		Select("abilities.model, abilities."+commonGroupCol+" AS group_name, abilities.channel_id, channels.type AS channel_type, COALESCE(abilities.priority, 0) AS priority, COALESCE(abilities.weight, 0) AS weight").
		Joins("JOIN channels ON channels.id = abilities.channel_id").
		Where("abilities.enabled = ? AND channels.status = ?", true, common.ChannelStatusEnabled).
		Where("abilities."+commonGroupCol+" IN ?", groups).
		Order("abilities.model ASC, priority DESC, weight DESC, abilities.channel_id ASC").
		Scan(&rows).Error
	return rows, err
}
