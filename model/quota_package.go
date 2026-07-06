package model

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

const (
	PaymentMethodQuotaPackage = "quota_package"
)

type QuotaPackagePlan struct {
	Id int `json:"id"`

	Name         string `json:"name" gorm:"type:varchar(128);not null"`
	Subtitle     string `json:"subtitle" gorm:"type:varchar(255);default:''"`
	Badge        string `json:"badge" gorm:"type:varchar(64);default:''"`
	Description  string `json:"description" gorm:"type:text"`
	FeaturesJSON string `json:"features_json" gorm:"column:features_json;type:text"`

	// PriceCents is CNY cents. UsdCreditCents is platform API credit cents.
	PriceCents     int64 `json:"price_cents" gorm:"type:bigint;not null;default:0"`
	UsdCreditCents int64 `json:"usd_credit_cents" gorm:"type:bigint;not null;default:0"`

	SortOrder   int  `json:"sort_order" gorm:"type:int;default:0"`
	Enabled     bool `json:"enabled" gorm:"default:true"`
	Recommended bool `json:"recommended" gorm:"default:false"`

	DeletedAt int64 `json:"deleted_at" gorm:"type:bigint;not null;default:0;index"`
	CreatedAt int64 `json:"created_at" gorm:"type:bigint"`
	UpdatedAt int64 `json:"updated_at" gorm:"type:bigint"`
}

func (p *QuotaPackagePlan) BeforeCreate(tx *gorm.DB) error {
	now := common.GetTimestamp()
	p.CreatedAt = now
	p.UpdatedAt = now
	return nil
}

func (p *QuotaPackagePlan) BeforeUpdate(tx *gorm.DB) error {
	p.UpdatedAt = common.GetTimestamp()
	return nil
}

func (p *QuotaPackagePlan) Features() []string {
	if p == nil || strings.TrimSpace(p.FeaturesJSON) == "" {
		return []string{}
	}
	var features []string
	if err := json.Unmarshal([]byte(p.FeaturesJSON), &features); err != nil {
		return []string{}
	}
	result := make([]string, 0, len(features))
	for _, feature := range features {
		feature = strings.TrimSpace(feature)
		if feature != "" {
			result = append(result, feature)
		}
	}
	return result
}

func EncodeQuotaPackageFeatures(features []string) string {
	clean := make([]string, 0, len(features))
	for _, feature := range features {
		feature = strings.TrimSpace(feature)
		if feature != "" {
			clean = append(clean, feature)
		}
	}
	payload, err := json.Marshal(clean)
	if err != nil {
		return "[]"
	}
	return string(payload)
}

type QuotaPackagePlanSnapshot struct {
	Id              int      `json:"id"`
	Name            string   `json:"name"`
	Subtitle        string   `json:"subtitle"`
	Badge           string   `json:"badge"`
	Description     string   `json:"description"`
	Features        []string `json:"features"`
	PriceCents      int64    `json:"price_cents"`
	UsdCreditCents  int64    `json:"usd_credit_cents"`
	GrantQuota      int64    `json:"grant_quota"`
	SnapshotVersion string   `json:"snapshot_version"`
}

func BuildQuotaPackagePlanSnapshot(plan *QuotaPackagePlan, grantQuota int64) string {
	if plan == nil {
		return "{}"
	}
	snapshot := QuotaPackagePlanSnapshot{
		Id:              plan.Id,
		Name:            plan.Name,
		Subtitle:        plan.Subtitle,
		Badge:           plan.Badge,
		Description:     plan.Description,
		Features:        plan.Features(),
		PriceCents:      plan.PriceCents,
		UsdCreditCents:  plan.UsdCreditCents,
		GrantQuota:      grantQuota,
		SnapshotVersion: "quota-package-v1",
	}
	payload, err := json.Marshal(snapshot)
	if err != nil {
		return "{}"
	}
	return string(payload)
}

type QuotaPackageOrder struct {
	Id int `json:"id"`

	TradeNo string `json:"trade_no" gorm:"unique;type:varchar(255);index"`
	UserId  int    `json:"user_id" gorm:"index"`
	PlanId  int    `json:"plan_id" gorm:"index"`

	PlanSnapshotJSON    string `json:"plan_snapshot_json" gorm:"column:plan_snapshot_json;type:text"`
	PayAmountCents      int64  `json:"pay_amount_cents" gorm:"type:bigint;not null;default:0"`
	GrantUsdCreditCents int64  `json:"grant_usd_credit_cents" gorm:"type:bigint;not null;default:0"`
	GrantQuota          int64  `json:"grant_quota" gorm:"type:bigint;not null;default:0"`

	PaymentMethod   string `json:"payment_method" gorm:"type:varchar(50)"`
	PaymentProvider string `json:"payment_provider" gorm:"type:varchar(50);default:''"`
	Status          string `json:"status" gorm:"type:varchar(32);index"`

	CreateTime   int64 `json:"create_time" gorm:"type:bigint"`
	CompleteTime int64 `json:"complete_time" gorm:"type:bigint"`
	FulfilledAt  int64 `json:"fulfilled_at" gorm:"type:bigint"`

	ProviderPayload string `json:"provider_payload" gorm:"type:text"`
	CreatedAt       int64  `json:"created_at" gorm:"type:bigint"`
	UpdatedAt       int64  `json:"updated_at" gorm:"type:bigint"`
}

func (o *QuotaPackageOrder) BeforeCreate(tx *gorm.DB) error {
	now := common.GetTimestamp()
	if o.CreateTime == 0 {
		o.CreateTime = now
	}
	o.CreatedAt = now
	o.UpdatedAt = now
	return nil
}

func (o *QuotaPackageOrder) BeforeUpdate(tx *gorm.DB) error {
	o.UpdatedAt = common.GetTimestamp()
	return nil
}

func QuotaPackageUsdCreditToQuota(usdCreditCents int64) int64 {
	if usdCreditCents <= 0 || common.QuotaPerUnit <= 0 {
		return 0
	}
	return decimal.NewFromInt(usdCreditCents).
		Div(decimal.NewFromInt(100)).
		Mul(decimal.NewFromFloat(common.QuotaPerUnit)).
		IntPart()
}

func QuotaPackageMoneyFromCents(cents int64) float64 {
	if cents <= 0 {
		return 0
	}
	money, _ := decimal.NewFromInt(cents).Div(decimal.NewFromInt(100)).Float64()
	return money
}

func GetEnabledQuotaPackagePlans() ([]QuotaPackagePlan, error) {
	plans := make([]QuotaPackagePlan, 0)
	err := DB.Where("enabled = ? AND deleted_at = ?", true, 0).
		Order("sort_order desc, id desc").
		Find(&plans).Error
	return plans, err
}

func AdminListQuotaPackagePlans() ([]QuotaPackagePlan, error) {
	plans := make([]QuotaPackagePlan, 0)
	err := DB.Where("deleted_at = ?", 0).
		Order("sort_order desc, id desc").
		Find(&plans).Error
	return plans, err
}

func GetQuotaPackagePlanById(id int, includeDisabled bool) (*QuotaPackagePlan, error) {
	if id <= 0 {
		return nil, errors.New("invalid plan id")
	}
	var plan QuotaPackagePlan
	query := DB.Where("id = ? AND deleted_at = ?", id, 0)
	if !includeDisabled {
		query = query.Where("enabled = ?", true)
	}
	if err := query.First(&plan).Error; err != nil {
		return nil, err
	}
	return &plan, nil
}

func GetQuotaPackageOrderByTradeNo(tradeNo string) *QuotaPackageOrder {
	tradeNo = strings.TrimSpace(tradeNo)
	if tradeNo == "" {
		return nil
	}
	var order QuotaPackageOrder
	if err := DB.Where("trade_no = ?", tradeNo).First(&order).Error; err != nil {
		return nil
	}
	return &order
}

func CreateQuotaPackagePendingOrderFromPlan(userId int, plan *QuotaPackagePlan, tradeNo string, paymentProvider string) (*QuotaPackageOrder, error) {
	if userId <= 0 {
		return nil, errors.New("invalid user id")
	}
	if plan == nil || plan.Id <= 0 {
		return nil, errors.New("invalid package plan")
	}
	if !plan.Enabled || plan.DeletedAt != 0 {
		return nil, errors.New("套餐未上架")
	}
	tradeNo = strings.TrimSpace(tradeNo)
	if tradeNo == "" {
		return nil, errors.New("tradeNo is empty")
	}
	grantQuota := QuotaPackageUsdCreditToQuota(plan.UsdCreditCents)
	if plan.PriceCents <= 0 {
		return nil, errors.New("套餐售价必须大于0")
	}
	if plan.UsdCreditCents <= 0 || grantQuota <= 0 {
		return nil, errors.New("套餐 API 额度必须大于0")
	}
	now := common.GetTimestamp()
	order := &QuotaPackageOrder{
		TradeNo:             tradeNo,
		UserId:              userId,
		PlanId:              plan.Id,
		PlanSnapshotJSON:    BuildQuotaPackagePlanSnapshot(plan, grantQuota),
		PayAmountCents:      plan.PriceCents,
		GrantUsdCreditCents: plan.UsdCreditCents,
		GrantQuota:          grantQuota,
		PaymentMethod:       PaymentMethodQuotaPackage,
		PaymentProvider:     paymentProvider,
		Status:              common.TopUpStatusPending,
		CreateTime:          now,
	}
	topUpAmount := decimal.NewFromInt(plan.UsdCreditCents).Div(decimal.NewFromInt(100)).IntPart()
	topUp := &TopUp{
		UserId:          userId,
		Amount:          topUpAmount,
		Money:           QuotaPackageMoneyFromCents(plan.PriceCents),
		TradeNo:         tradeNo,
		PaymentMethod:   PaymentMethodQuotaPackage,
		PaymentProvider: paymentProvider,
		CreateTime:      now,
		Status:          common.TopUpStatusPending,
	}
	err := DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(order).Error; err != nil {
			return err
		}
		if err := tx.Create(topUp).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return order, nil
}

func CompleteQuotaPackageOrder(tradeNo string, providerPayload string, expectedPaymentProvider string, callerIp string) error {
	tradeNo = strings.TrimSpace(tradeNo)
	if tradeNo == "" {
		return errors.New("tradeNo is empty")
	}
	refCol := "`trade_no`"
	if common.UsingPostgreSQL {
		refCol = `"trade_no"`
	}
	var logUserId int
	var logPlanName string
	var logMoney float64
	var logUsdCreditCents int64
	var logQuota int64
	err := DB.Transaction(func(tx *gorm.DB) error {
		var order QuotaPackageOrder
		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where(refCol+" = ?", tradeNo).First(&order).Error; err != nil {
			return ErrTopUpNotFound
		}
		if expectedPaymentProvider != "" && order.PaymentProvider != expectedPaymentProvider {
			return ErrPaymentMethodMismatch
		}
		if order.Status == common.TopUpStatusSuccess {
			return nil
		}
		if order.Status != common.TopUpStatusPending {
			return ErrTopUpStatusInvalid
		}
		grantQuota := order.GrantQuota
		if grantQuota <= 0 {
			grantQuota = QuotaPackageUsdCreditToQuota(order.GrantUsdCreditCents)
		}
		if grantQuota <= 0 {
			return errors.New("套餐额度无效")
		}
		now := common.GetTimestamp()
		if err := tx.Model(&User{}).Where("id = ?", order.UserId).
			Update("quota", gorm.Expr("quota + ?", grantQuota)).Error; err != nil {
			return err
		}
		updates := map[string]interface{}{
			"status":           common.TopUpStatusSuccess,
			"complete_time":    now,
			"fulfilled_at":     now,
			"grant_quota":      grantQuota,
			"provider_payload": providerPayload,
			"updated_at":       now,
		}
		if err := tx.Model(&QuotaPackageOrder{}).Where("id = ?", order.Id).Updates(updates).Error; err != nil {
			return err
		}
		var topUp TopUp
		if err := tx.Where("trade_no = ?", tradeNo).First(&topUp).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				topUp = TopUp{
					UserId:          order.UserId,
					Amount:          decimal.NewFromInt(order.GrantUsdCreditCents).Div(decimal.NewFromInt(100)).IntPart(),
					Money:           QuotaPackageMoneyFromCents(order.PayAmountCents),
					TradeNo:         tradeNo,
					PaymentMethod:   PaymentMethodQuotaPackage,
					PaymentProvider: order.PaymentProvider,
					CreateTime:      order.CreateTime,
					CompleteTime:    now,
					Status:          common.TopUpStatusSuccess,
				}
				if err := tx.Create(&topUp).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		} else {
			topUp.Status = common.TopUpStatusSuccess
			topUp.CompleteTime = now
			topUp.PaymentMethod = PaymentMethodQuotaPackage
			topUp.PaymentProvider = order.PaymentProvider
			topUp.Money = QuotaPackageMoneyFromCents(order.PayAmountCents)
			if err := tx.Save(&topUp).Error; err != nil {
				return err
			}
		}
		logUserId = order.UserId
		logPlanName = orderPlanNameFromSnapshot(order.PlanSnapshotJSON)
		logMoney = QuotaPackageMoneyFromCents(order.PayAmountCents)
		logUsdCreditCents = order.GrantUsdCreditCents
		logQuota = grantQuota
		return nil
	})
	if err != nil {
		return err
	}
	if logUserId > 0 && logQuota > 0 {
		if cacheErr := cacheIncrUserQuota(logUserId, logQuota); cacheErr != nil {
			common.SysLog(fmt.Sprintf("failed to increase user quota cache for quota package order: user_id=%d, quota=%d, error=%s", logUserId, logQuota, cacheErr.Error()))
		}
	}
	if logUserId > 0 {
		usdCredit, _ := decimal.NewFromInt(logUsdCreditCents).Div(decimal.NewFromInt(100)).Float64()
		content := fmt.Sprintf("购买 API 额度套餐成功，套餐: %s，支付金额: ¥%.2f，到账: $%.2f API 额度，增加额度: %s", logPlanName, logMoney, usdCredit, logger.LogQuota(int(logQuota)))
		RecordTopupLog(logUserId, content, callerIp, PaymentMethodQuotaPackage, expectedPaymentProvider)
	}
	return nil
}

func orderPlanNameFromSnapshot(snapshot string) string {
	var data QuotaPackagePlanSnapshot
	if err := json.Unmarshal([]byte(snapshot), &data); err != nil {
		return "API 额度套餐"
	}
	if strings.TrimSpace(data.Name) == "" {
		return "API 额度套餐"
	}
	return data.Name
}

func EnsureDefaultQuotaPackagePlans() error {
	var count int64
	if err := DB.Model(&QuotaPackagePlan{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	plans := []QuotaPackagePlan{
		{
			Name:           "轻量月卡",
			Subtitle:       "适合轻度体验、测试接入",
			Badge:          "新手推荐",
			Description:    "购买后获得 $5 API 额度，可用于平台支持的文本、图像、视频等模型调用。",
			FeaturesJSON:   EncodeQuotaPackageFeatures([]string{"$5 API 额度实时到账", "支持平台全部可用模型", "按模型实际倍率扣费"}),
			PriceCents:     2900,
			UsdCreditCents: 500,
			SortOrder:      10,
			Enabled:        true,
			Recommended:    false,
		},
		{
			Name:           "标准月卡",
			Subtitle:       "适合 Claude Code / GPT / Gemini 日常调用",
			Badge:          "最受欢迎",
			Description:    "购买后获得 $18 API 额度，适合个人开发者和日常工作流调用。",
			FeaturesJSON:   EncodeQuotaPackageFeatures([]string{"$18 API 额度实时到账", "文本 / 图像 / 视频模型通用", "额度进入现有钱包余额"}),
			PriceCents:     9900,
			UsdCreditCents: 1800,
			SortOrder:      20,
			Enabled:        true,
			Recommended:    true,
		},
		{
			Name:           "专业月卡",
			Subtitle:       "适合高频开发、自动化工作流",
			Badge:          "高频首选",
			Description:    "购买后获得 $40 API 额度，适合高频 API 调用和多模型组合使用。",
			FeaturesJSON:   EncodeQuotaPackageFeatures([]string{"$40 API 额度实时到账", "适合高频开发调用", "后续模型调价不影响已到账余额"}),
			PriceCents:     19900,
			UsdCreditCents: 4000,
			SortOrder:      30,
			Enabled:        true,
			Recommended:    false,
		},
		{
			Name:           "团队月卡",
			Subtitle:       "适合团队共享、高频 API 调用",
			Badge:          "团队推荐",
			Description:    "购买后获得 $110 API 额度，适合团队开发和视频 / 图像模型高频使用。",
			FeaturesJSON:   EncodeQuotaPackageFeatures([]string{"$110 API 额度实时到账", "适合团队与批量工作流", "统一按模型倍率扣费"}),
			PriceCents:     49900,
			UsdCreditCents: 11000,
			SortOrder:      40,
			Enabled:        true,
			Recommended:    false,
		},
	}
	return DB.Create(&plans).Error
}
