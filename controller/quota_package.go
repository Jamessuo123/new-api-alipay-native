package controller

import (
	"fmt"
	"math"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/service/alipaypc"
	"github.com/gin-gonic/gin"
)

type QuotaPackagePlanDTO struct {
	Id             int      `json:"id"`
	Name           string   `json:"name"`
	Subtitle       string   `json:"subtitle"`
	Badge          string   `json:"badge"`
	Description    string   `json:"description"`
	Features       []string `json:"features"`
	PriceCents     int64    `json:"price_cents"`
	UsdCreditCents int64    `json:"usd_credit_cents"`
	GrantQuota     int64    `json:"grant_quota"`
	SortOrder      int      `json:"sort_order"`
	Enabled        bool     `json:"enabled"`
	Recommended    bool     `json:"recommended"`
	CreatedAt      int64    `json:"created_at"`
	UpdatedAt      int64    `json:"updated_at"`
}

type QuotaPackageOrderDTO struct {
	Id                  int    `json:"id"`
	TradeNo             string `json:"trade_no"`
	UserId              int    `json:"user_id"`
	PlanId              int    `json:"plan_id"`
	PlanSnapshotJSON    string `json:"plan_snapshot_json"`
	PayAmountCents      int64  `json:"pay_amount_cents"`
	GrantUsdCreditCents int64  `json:"grant_usd_credit_cents"`
	GrantQuota          int64  `json:"grant_quota"`
	PaymentMethod       string `json:"payment_method"`
	PaymentProvider     string `json:"payment_provider"`
	Status              string `json:"status"`
	CreateTime          int64  `json:"create_time"`
	CompleteTime        int64  `json:"complete_time"`
	FulfilledAt         int64  `json:"fulfilled_at"`
}

type QuotaPackagePlanPayload struct {
	Name           string   `json:"name"`
	Subtitle       string   `json:"subtitle"`
	Badge          string   `json:"badge"`
	Description    string   `json:"description"`
	Features       []string `json:"features"`
	PriceCents     int64    `json:"price_cents"`
	UsdCreditCents int64    `json:"usd_credit_cents"`
	SortOrder      int      `json:"sort_order"`
	Enabled        bool     `json:"enabled"`
	Recommended    bool     `json:"recommended"`
}

type QuotaPackagePurchaseRequest struct {
	PlanId        int    `json:"plan_id"`
	PaymentMethod string `json:"payment_method"`
}

type QuotaPackagePlanStatusRequest struct {
	Enabled *bool `json:"enabled"`
}

func buildQuotaPackagePlanDTO(plan model.QuotaPackagePlan) QuotaPackagePlanDTO {
	return QuotaPackagePlanDTO{
		Id:             plan.Id,
		Name:           plan.Name,
		Subtitle:       plan.Subtitle,
		Badge:          plan.Badge,
		Description:    plan.Description,
		Features:       plan.Features(),
		PriceCents:     plan.PriceCents,
		UsdCreditCents: plan.UsdCreditCents,
		GrantQuota:     model.QuotaPackageUsdCreditToQuota(plan.UsdCreditCents),
		SortOrder:      plan.SortOrder,
		Enabled:        plan.Enabled,
		Recommended:    plan.Recommended,
		CreatedAt:      plan.CreatedAt,
		UpdatedAt:      plan.UpdatedAt,
	}
}

func buildQuotaPackageOrderDTO(order model.QuotaPackageOrder) QuotaPackageOrderDTO {
	return QuotaPackageOrderDTO{
		Id:                  order.Id,
		TradeNo:             order.TradeNo,
		UserId:              order.UserId,
		PlanId:              order.PlanId,
		PlanSnapshotJSON:    order.PlanSnapshotJSON,
		PayAmountCents:      order.PayAmountCents,
		GrantUsdCreditCents: order.GrantUsdCreditCents,
		GrantQuota:          order.GrantQuota,
		PaymentMethod:       order.PaymentMethod,
		PaymentProvider:     order.PaymentProvider,
		Status:              order.Status,
		CreateTime:          order.CreateTime,
		CompleteTime:        order.CompleteTime,
		FulfilledAt:         order.FulfilledAt,
	}
}

func validateQuotaPackagePlanPayload(payload *QuotaPackagePlanPayload) error {
	payload.Name = strings.TrimSpace(payload.Name)
	payload.Subtitle = strings.TrimSpace(payload.Subtitle)
	payload.Badge = strings.TrimSpace(payload.Badge)
	payload.Description = strings.TrimSpace(payload.Description)
	if payload.Name == "" {
		return fmt.Errorf("套餐名称不能为空")
	}
	if payload.PriceCents <= 0 {
		return fmt.Errorf("人民币售价必须大于0")
	}
	if payload.PriceCents > 999900 {
		return fmt.Errorf("人民币售价不能超过9999元")
	}
	if payload.UsdCreditCents <= 0 {
		return fmt.Errorf("到账 $ API 额度必须大于0")
	}
	if payload.UsdCreditCents > 100000000 {
		return fmt.Errorf("到账 $ API 额度过大")
	}
	return nil
}

func quotaPackagePlanFromPayload(payload QuotaPackagePlanPayload) model.QuotaPackagePlan {
	return model.QuotaPackagePlan{
		Name:           payload.Name,
		Subtitle:       payload.Subtitle,
		Badge:          payload.Badge,
		Description:    payload.Description,
		FeaturesJSON:   model.EncodeQuotaPackageFeatures(payload.Features),
		PriceCents:     payload.PriceCents,
		UsdCreditCents: payload.UsdCreditCents,
		SortOrder:      payload.SortOrder,
		Enabled:        payload.Enabled,
		Recommended:    payload.Recommended,
	}
}

func GetQuotaPackagePlans(c *gin.Context) {
	if !requirePaymentCompliance(c) {
		return
	}
	plans, err := model.GetEnabledQuotaPackagePlans()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	result := make([]QuotaPackagePlanDTO, 0, len(plans))
	for _, plan := range plans {
		result = append(result, buildQuotaPackagePlanDTO(plan))
	}
	common.ApiSuccess(c, result)
}

func RequestQuotaPackageAlipayPcOrder(c *gin.Context) {
	if !requirePaymentCompliance(c) {
		return
	}
	if !IsAlipayPcTopUpEnabled() {
		common.ApiErrorMsg(c, "支付宝 PC 支付未启用")
		return
	}
	var req QuotaPackagePurchaseRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.PlanId <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if req.PaymentMethod != "" && req.PaymentMethod != PaymentMethodAlipayPC {
		common.ApiErrorMsg(c, "当前套餐仅支持支付宝官方支付")
		return
	}
	plan, err := model.GetQuotaPackagePlanById(req.PlanId, false)
	if err != nil {
		common.ApiErrorMsg(c, "套餐不存在或已下架")
		return
	}
	payMoney := model.QuotaPackageMoneyFromCents(plan.PriceCents)
	if payMoney < 0.01 {
		common.ApiErrorMsg(c, "套餐售价过低")
		return
	}
	userId := c.GetInt("id")
	tradeNo := fmt.Sprintf("PKGALIUSR%dNO%s%d", userId, common.GetRandomString(6), time.Now().Unix())
	callbackAddress := service.GetCallbackAddress()
	notifyURL := firstNonEmpty(os.Getenv("ALIPAY_NOTIFY_URL"), callbackAddress+"/api/user/topup/alipay/notify")
	returnURL := firstNonEmpty(os.Getenv("ALIPAY_RETURN_URL"), callbackAddress+"/api/user/topup/alipay/return")
	cashierURL, err := alipaypc.CreatePagePayURL(tradeNo, fmt.Sprintf("FeiXiangApi 套餐 %s", plan.Name), payMoney, notifyURL, returnURL)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("套餐支付宝 PC 拉起支付失败 user_id=%d trade_no=%s plan_id=%d error=%q", userId, tradeNo, plan.Id, err.Error()))
		common.ApiErrorMsg(c, "拉起支付宝支付失败")
		return
	}
	order, err := model.CreateQuotaPackagePendingOrderFromPlan(userId, plan, tradeNo, PaymentProviderAlipayPC)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("套餐订单创建失败 user_id=%d trade_no=%s plan_id=%d error=%q", userId, tradeNo, plan.Id, err.Error()))
		common.ApiErrorMsg(c, "创建套餐订单失败")
		return
	}
	common.ApiSuccess(c, gin.H{
		"url":                    cashierURL,
		"cashier_url":            cashierURL,
		"payment_url":            cashierURL,
		"order_no":               tradeNo,
		"trade_no":               tradeNo,
		"payment_method":         PaymentMethodAlipayPC,
		"payment_provider":       PaymentProviderAlipayPC,
		"pay_money":              payMoney,
		"money":                  payMoney,
		"price_cents":            plan.PriceCents,
		"usd_credit_cents":       plan.UsdCreditCents,
		"grant_quota":            order.GrantQuota,
		"create_time":            order.CreateTime,
		"created_at":             order.CreateTime,
		"expire_at":              order.CreateTime + 30*60,
		"quota_package_order_id": order.Id,
	})
}

func GetSelfQuotaPackageOrders(c *gin.Context) {
	userId := c.GetInt("id")
	orders := make([]model.QuotaPackageOrder, 0)
	if err := model.DB.Where("user_id = ?", userId).Order("id desc").Limit(50).Find(&orders).Error; err != nil {
		common.ApiError(c, err)
		return
	}
	result := make([]QuotaPackageOrderDTO, 0, len(orders))
	for _, order := range orders {
		result = append(result, buildQuotaPackageOrderDTO(order))
	}
	common.ApiSuccess(c, result)
}

func AdminListQuotaPackagePlans(c *gin.Context) {
	plans, err := model.AdminListQuotaPackagePlans()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	result := make([]QuotaPackagePlanDTO, 0, len(plans))
	for _, plan := range plans {
		result = append(result, buildQuotaPackagePlanDTO(plan))
	}
	common.ApiSuccess(c, result)
}

func AdminCreateQuotaPackagePlan(c *gin.Context) {
	if !requirePaymentCompliance(c) {
		return
	}
	var payload QuotaPackagePlanPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if err := validateQuotaPackagePlanPayload(&payload); err != nil {
		common.ApiError(c, err)
		return
	}
	plan := quotaPackagePlanFromPayload(payload)
	if err := model.DB.Create(&plan).Error; err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, buildQuotaPackagePlanDTO(plan))
}

func AdminUpdateQuotaPackagePlan(c *gin.Context) {
	if !requirePaymentCompliance(c) {
		return
	}
	id, _ := strconv.Atoi(c.Param("id"))
	if id <= 0 {
		common.ApiErrorMsg(c, "无效的ID")
		return
	}
	var payload QuotaPackagePlanPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if err := validateQuotaPackagePlanPayload(&payload); err != nil {
		common.ApiError(c, err)
		return
	}
	updateMap := map[string]interface{}{
		"name":             payload.Name,
		"subtitle":         payload.Subtitle,
		"badge":            payload.Badge,
		"description":      payload.Description,
		"features_json":    model.EncodeQuotaPackageFeatures(payload.Features),
		"price_cents":      payload.PriceCents,
		"usd_credit_cents": payload.UsdCreditCents,
		"sort_order":       payload.SortOrder,
		"enabled":          payload.Enabled,
		"recommended":      payload.Recommended,
		"updated_at":       common.GetTimestamp(),
	}
	result := model.DB.Model(&model.QuotaPackagePlan{}).Where("id = ? AND deleted_at = ?", id, 0).Updates(updateMap)
	if result.Error != nil {
		common.ApiError(c, result.Error)
		return
	}
	if result.RowsAffected == 0 {
		common.ApiErrorMsg(c, "套餐不存在")
		return
	}
	common.ApiSuccess(c, nil)
}

func AdminUpdateQuotaPackagePlanStatus(c *gin.Context) {
	if !requirePaymentCompliance(c) {
		return
	}
	id, _ := strconv.Atoi(c.Param("id"))
	if id <= 0 {
		common.ApiErrorMsg(c, "无效的ID")
		return
	}
	var req QuotaPackagePlanStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Enabled == nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	result := model.DB.Model(&model.QuotaPackagePlan{}).Where("id = ? AND deleted_at = ?", id, 0).Update("enabled", *req.Enabled)
	if result.Error != nil {
		common.ApiError(c, result.Error)
		return
	}
	if result.RowsAffected == 0 {
		common.ApiErrorMsg(c, "套餐不存在")
		return
	}
	common.ApiSuccess(c, nil)
}

func AdminDeleteQuotaPackagePlan(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if id <= 0 {
		common.ApiErrorMsg(c, "无效的ID")
		return
	}
	result := model.DB.Model(&model.QuotaPackagePlan{}).Where("id = ? AND deleted_at = ?", id, 0).Updates(map[string]interface{}{
		"deleted_at": common.GetTimestamp(),
		"enabled":    false,
		"updated_at": common.GetTimestamp(),
	})
	if result.Error != nil {
		common.ApiError(c, result.Error)
		return
	}
	if result.RowsAffected == 0 {
		common.ApiErrorMsg(c, "套餐不存在")
		return
	}
	common.ApiSuccess(c, nil)
}

func AdminListQuotaPackageOrders(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	orders := make([]model.QuotaPackageOrder, 0)
	var total int64
	query := model.DB.Model(&model.QuotaPackageOrder{})
	if err := query.Count(&total).Error; err != nil {
		common.ApiError(c, err)
		return
	}
	if err := query.Order("id desc").Limit(pageInfo.GetPageSize()).Offset(pageInfo.GetStartIdx()).Find(&orders).Error; err != nil {
		common.ApiError(c, err)
		return
	}
	result := make([]QuotaPackageOrderDTO, 0, len(orders))
	for _, order := range orders {
		result = append(result, buildQuotaPackageOrderDTO(order))
	}
	common.ApiSuccess(c, gin.H{"items": result, "total": total})
}

func completeQuotaPackageAlipayNotifyIfNeeded(c *gin.Context, tradeNo string, params map[string]string) (bool, bool) {
	order := model.GetQuotaPackageOrderByTradeNo(tradeNo)
	if order == nil {
		return false, true
	}
	if order.PaymentProvider != PaymentProviderAlipayPC {
		return true, false
	}
	if totalAmount, err := strconv.ParseFloat(params["total_amount"], 64); err == nil && totalAmount > 0 {
		if math.Abs(totalAmount-model.QuotaPackageMoneyFromCents(order.PayAmountCents)) > 0.01 {
			return true, false
		}
	}
	LockOrder(tradeNo)
	defer UnlockOrder(tradeNo)
	if err := model.CompleteQuotaPackageOrder(tradeNo, common.GetJsonString(params), PaymentProviderAlipayPC, c.ClientIP()); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("套餐支付宝 PC 回调完成失败 trade_no=%s error=%q", tradeNo, err.Error()))
		return true, false
	}
	return true, true
}
