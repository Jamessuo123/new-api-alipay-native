package controller

import (
	"bytes"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"html"
	"image/png"
	"io"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/boombuler/barcode"
	"github.com/boombuler/barcode/qr"
	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

const (
	alipayNativeMethod       = "alipay.trade.precreate"
	alipayNativeProductCode  = "FACE_TO_FACE_PAYMENT"
	alipayNativeFormat       = "JSON"
	alipayNativeCharset      = "utf-8"
	alipayNativeSignType     = "RSA2"
	alipayNativeVersion      = "1.0"
	alipayNativeTimeout      = "2h"
	alipayNativeResponseNode = "alipay_trade_precreate_response"
)

type AlipayNativePayRequest struct {
	Amount        int64  `json:"amount"`
	PaymentMethod string `json:"payment_method"`
}

type alipayNativeProviderPayload struct {
	QRCode    string                 `json:"qr_code,omitempty"`
	Precreate map[string]interface{} `json:"precreate,omitempty"`
}

func alipayEnv(key string) string {
	return strings.TrimSpace(os.Getenv(key))
}

func alipayBoolEnv(key string, fallback bool) bool {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	switch strings.ToLower(value) {
	case "1", "true", "yes", "y", "on":
		return true
	default:
		return false
	}
}

func getAlipayAppID() string {
	if value := alipayEnv("ALIPAY_APP_ID"); value != "" {
		return value
	}
	return strings.TrimSpace(setting.AlipayAppId)
}

func getAlipayGateway() string {
	if value := alipayEnv("ALIPAY_GATEWAY"); value != "" {
		return value
	}
	if strings.TrimSpace(setting.AlipayGateway) != "" {
		return strings.TrimSpace(setting.AlipayGateway)
	}
	return "https://openapi.alipay.com/gateway.do"
}

func getAlipayPrivateKeyPath() string {
	if value := alipayEnv("ALIPAY_PRIVATE_KEY_PATH"); value != "" {
		return value
	}
	return strings.TrimSpace(setting.AlipayPrivateKeyPath)
}

func getAlipayPublicKeyPath() string {
	if value := alipayEnv("ALIPAY_PUBLIC_KEY_PATH"); value != "" {
		return value
	}
	return strings.TrimSpace(setting.AlipayPublicKeyPath)
}

func getAlipayNotifyURL() string {
	if value := alipayEnv("ALIPAY_NOTIFY_URL"); value != "" {
		return value
	}
	if strings.TrimSpace(setting.AlipayNotifyUrl) != "" {
		return strings.TrimSpace(setting.AlipayNotifyUrl)
	}
	base := strings.TrimRight(service.GetCallbackAddress(), "/")
	if base == "" {
		return "/api/user/alipay/notify"
	}
	return base + "/api/user/alipay/notify"
}

func getAlipayReturnURL() string {
	if value := alipayEnv("ALIPAY_RETURN_URL"); value != "" {
		return value
	}
	if strings.TrimSpace(setting.AlipayReturnUrl) != "" {
		return strings.TrimSpace(setting.AlipayReturnUrl)
	}
	return paymentReturnPath("/console/topup?show_history=true")
}

func getAlipaySubject() string {
	if value := alipayEnv("ALIPAY_SUBJECT"); value != "" {
		return value
	}
	if strings.TrimSpace(setting.AlipayNativeSubject) != "" {
		return strings.TrimSpace(setting.AlipayNativeSubject)
	}
	return "New API 余额充值"
}

func getAlipayNativeMinTopUp() int64 {
	minTopUp := int64(setting.AlipayNativeMinTopUp)
	if minTopUp <= 0 {
		minTopUp = 10
	}
	if value := alipayEnv("ALIPAY_MIN_TOPUP"); value != "" {
		if parsed, err := strconv.ParseInt(value, 10, 64); err == nil && parsed > 0 {
			minTopUp = parsed
		}
	}
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		return decimal.NewFromInt(minTopUp).Mul(decimal.NewFromFloat(common.QuotaPerUnit)).IntPart()
	}
	return minTopUp
}

func isAlipayNativeNotifyURLConfigured() bool {
	return alipayEnv("ALIPAY_NOTIFY_URL") != "" ||
		strings.TrimSpace(setting.AlipayNotifyUrl) != "" ||
		strings.TrimSpace(service.GetCallbackAddress()) != ""
}

func isAlipayNativeTopUpEnabled() bool {
	if !isPaymentComplianceConfirmed() {
		return false
	}
	return alipayBoolEnv("NATIVE_PAY_ENABLED", setting.NativePayEnabled) &&
		alipayBoolEnv("ALIPAY_NATIVE_ENABLED", setting.AlipayNativeEnabled) &&
		getAlipayAppID() != "" &&
		getAlipayPrivateKeyPath() != "" &&
		getAlipayPublicKeyPath() != "" &&
		isAlipayNativeNotifyURLConfigured()
}

func normalizeAlipayNativeTopUpAmount(amount int64) int64 {
	if operation_setting.GetQuotaDisplayType() != operation_setting.QuotaDisplayTypeTokens {
		return amount
	}
	normalized := decimal.NewFromInt(amount).Div(decimal.NewFromFloat(common.QuotaPerUnit)).IntPart()
	if normalized < 1 {
		return 1
	}
	return normalized
}

func formatAlipayAmount(payMoney float64) string {
	return decimal.NewFromFloat(payMoney).StringFixed(2)
}

func buildAlipayNativePayURL(tradeNo string) string {
	path := "/api/user/native-pay/" + url.PathEscape(tradeNo)
	base := strings.TrimRight(service.GetCallbackAddress(), "/")
	if base == "" {
		return path
	}
	return base + path
}

func RequestAlipayNativeAmount(c *gin.Context) {
	var req AmountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}
	if req.Amount < getAlipayNativeMinTopUp() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("充值数量不能小于 %d", getAlipayNativeMinTopUp())})
		return
	}
	id := c.GetInt("id")
	group, err := model.GetUserGroup(id, true)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "获取用户分组失败"})
		return
	}
	payMoney := getPayMoney(req.Amount, group)
	if payMoney < 0.01 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值金额过低"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "success", "data": formatAlipayAmount(payMoney)})
}

func RequestAlipayNativePay(c *gin.Context) {
	var req AlipayNativePayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}
	if req.PaymentMethod == "" {
		req.PaymentMethod = model.PaymentMethodAlipayNative
	}
	if req.PaymentMethod != model.PaymentMethodAlipayNative {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "支付方式错误"})
		return
	}
	requestAlipayNativePay(c, req.Amount)
}

func RequestAlipayNativePayFromEpay(c *gin.Context, req EpayRequest) {
	requestAlipayNativePay(c, req.Amount)
}

func requestAlipayNativePay(c *gin.Context, amount int64) {
	if !isAlipayNativeTopUpEnabled() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "支付宝当面付未配置"})
		return
	}
	if amount < getAlipayNativeMinTopUp() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("充值数量不能小于 %d", getAlipayNativeMinTopUp())})
		return
	}

	id := c.GetInt("id")
	group, err := model.GetUserGroup(id, true)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "获取用户分组失败"})
		return
	}

	payMoney := getPayMoney(amount, group)
	if payMoney < 0.01 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值金额过低"})
		return
	}

	tradeNo := fmt.Sprintf("USR%dALIPAY%s%d", id, common.GetRandomString(6), time.Now().Unix())
	normalizedAmount := normalizeAlipayNativeTopUpAmount(amount)
	topUp := &model.TopUp{
		UserId:          id,
		Amount:          normalizedAmount,
		Money:           payMoney,
		TradeNo:         tradeNo,
		PaymentMethod:   model.PaymentMethodAlipayNative,
		PaymentProvider: model.PaymentProviderAlipayNative,
		CreateTime:      time.Now().Unix(),
		Status:          common.TopUpStatusPending,
	}
	if err := topUp.Insert(); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("支付宝当面付 创建充值订单失败 user_id=%d trade_no=%s amount=%d error=%q", id, tradeNo, amount, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}

	qrCode, precreatePayload, err := alipayNativePrecreate(tradeNo, formatAlipayAmount(payMoney))
	if err != nil {
		_ = model.UpdatePendingTopUpStatus(tradeNo, model.PaymentProviderAlipayNative, common.TopUpStatusFailed)
		logger.LogError(c.Request.Context(), fmt.Sprintf("支付宝当面付 预创建订单失败 user_id=%d trade_no=%s amount=%d money=%.2f error=%q", id, tradeNo, amount, payMoney, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付宝支付失败"})
		return
	}

	topUp.ProviderPayload = common.GetJsonString(alipayNativeProviderPayload{
		QRCode:    qrCode,
		Precreate: precreatePayload,
	})
	if err := topUp.Update(); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("支付宝当面付 保存二维码信息失败 user_id=%d trade_no=%s error=%q", id, tradeNo, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "保存支付订单失败"})
		return
	}

	payLink := buildAlipayNativePayURL(tradeNo)
	logger.LogInfo(c.Request.Context(), fmt.Sprintf("支付宝当面付 充值订单创建成功 user_id=%d trade_no=%s amount=%d money=%.2f pay_link=%q", id, tradeNo, amount, payMoney, payLink))
	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"url":     payLink,
		"data": gin.H{
			"trade_no": tradeNo,
			"pay_link": payLink,
		},
	})
}

func alipayNativePrecreate(tradeNo string, totalAmount string) (string, map[string]interface{}, error) {
	bizContentBytes, err := json.Marshal(map[string]string{
		"out_trade_no":    tradeNo,
		"total_amount":    totalAmount,
		"subject":         getAlipaySubject(),
		"product_code":    alipayNativeProductCode,
		"timeout_express": alipayNativeTimeout,
	})
	if err != nil {
		return "", nil, err
	}

	params := map[string]string{
		"app_id":      getAlipayAppID(),
		"method":      alipayNativeMethod,
		"format":      alipayNativeFormat,
		"charset":     alipayNativeCharset,
		"sign_type":   alipayNativeSignType,
		"timestamp":   time.Now().Format("2006-01-02 15:04:05"),
		"version":     alipayNativeVersion,
		"notify_url":  getAlipayNotifyURL(),
		"biz_content": string(bizContentBytes),
	}

	sign, err := alipayRSA2Sign(params)
	if err != nil {
		return "", nil, err
	}
	params["sign"] = sign

	form := url.Values{}
	for key, value := range params {
		form.Set(key, value)
	}

	client := &http.Client{Timeout: 20 * time.Second}
	resp, err := client.PostForm(getAlipayGateway(), form)
	if err != nil {
		return "", nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", nil, err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", nil, fmt.Errorf("alipay http status=%d body=%s", resp.StatusCode, string(body))
	}

	var parsed map[string]interface{}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return "", nil, err
	}

	responseMap, ok := parsed[alipayNativeResponseNode].(map[string]interface{})
	if !ok {
		return "", parsed, fmt.Errorf("alipay response missing %s: %s", alipayNativeResponseNode, string(body))
	}
	code := fmt.Sprint(responseMap["code"])
	if code != "10000" {
		return "", parsed, fmt.Errorf("alipay precreate failed code=%s sub_code=%v sub_msg=%v msg=%v", code, responseMap["sub_code"], responseMap["sub_msg"], responseMap["msg"])
	}
	qrCode := strings.TrimSpace(fmt.Sprint(responseMap["qr_code"]))
	if qrCode == "" {
		return "", parsed, errors.New("alipay precreate response missing qr_code")
	}
	return qrCode, parsed, nil
}

func alipaySigningContent(params map[string]string) string {
	keys := make([]string, 0, len(params))
	for key, value := range params {
		if key == "sign" || key == "sign_type" || strings.TrimSpace(value) == "" {
			continue
		}
		keys = append(keys, key)
	}
	sort.Strings(keys)
	parts := make([]string, 0, len(keys))
	for _, key := range keys {
		parts = append(parts, key+"="+params[key])
	}
	return strings.Join(parts, "&")
}

func alipayRSA2Sign(params map[string]string) (string, error) {
	privateKey, err := loadAlipayPrivateKey(getAlipayPrivateKeyPath())
	if err != nil {
		return "", err
	}
	content := alipaySigningContent(params)
	digest := sha256.Sum256([]byte(content))
	sig, err := rsa.SignPKCS1v15(rand.Reader, privateKey, crypto.SHA256, digest[:])
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(sig), nil
}

func verifyAlipayRSA2(params map[string]string) error {
	if strings.ToUpper(strings.TrimSpace(params["sign_type"])) != alipayNativeSignType {
		return errors.New("unsupported alipay sign_type")
	}
	sign := strings.TrimSpace(params["sign"])
	if sign == "" {
		return errors.New("missing alipay sign")
	}
	sig, err := base64.StdEncoding.DecodeString(sign)
	if err != nil {
		return err
	}
	publicKey, err := loadAlipayPublicKey(getAlipayPublicKeyPath())
	if err != nil {
		return err
	}
	content := alipaySigningContent(params)
	digest := sha256.Sum256([]byte(content))
	return rsa.VerifyPKCS1v15(publicKey, crypto.SHA256, digest[:], sig)
}

func normalizePEMData(data []byte, blockType string) []byte {
	if bytes.Contains(data, []byte("-----BEGIN ")) {
		return data
	}
	compact := strings.Map(func(r rune) rune {
		if r == '\n' || r == '\r' || r == '\t' || r == ' ' {
			return -1
		}
		return r
	}, string(data))
	var b strings.Builder
	b.WriteString("-----BEGIN " + blockType + "-----\n")
	for len(compact) > 64 {
		b.WriteString(compact[:64] + "\n")
		compact = compact[64:]
	}
	if compact != "" {
		b.WriteString(compact + "\n")
	}
	b.WriteString("-----END " + blockType + "-----\n")
	return []byte(b.String())
}

func loadAlipayPrivateKey(path string) (*rsa.PrivateKey, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	data = normalizePEMData(data, "PRIVATE KEY")
	block, _ := pem.Decode(data)
	if block == nil {
		return nil, errors.New("invalid private key pem")
	}
	if key, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return key, nil
	}
	keyAny, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}
	key, ok := keyAny.(*rsa.PrivateKey)
	if !ok {
		return nil, errors.New("private key is not rsa")
	}
	return key, nil
}

func loadAlipayPublicKey(path string) (*rsa.PublicKey, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	data = normalizePEMData(data, "PUBLIC KEY")
	block, _ := pem.Decode(data)
	if block == nil {
		return nil, errors.New("invalid public key pem")
	}
	if cert, err := x509.ParseCertificate(block.Bytes); err == nil {
		key, ok := cert.PublicKey.(*rsa.PublicKey)
		if !ok {
			return nil, errors.New("certificate public key is not rsa")
		}
		return key, nil
	}
	if pubAny, err := x509.ParsePKIXPublicKey(block.Bytes); err == nil {
		key, ok := pubAny.(*rsa.PublicKey)
		if !ok {
			return nil, errors.New("public key is not rsa")
		}
		return key, nil
	}
	return x509.ParsePKCS1PublicKey(block.Bytes)
}

func parseAlipayProviderPayload(raw string) alipayNativeProviderPayload {
	var payload alipayNativeProviderPayload
	if strings.TrimSpace(raw) == "" {
		return payload
	}
	_ = json.Unmarshal([]byte(raw), &payload)
	return payload
}

func alipayQRCodeDataURI(qrCode string) (string, error) {
	qrImage, err := qr.Encode(qrCode, qr.M, qr.Auto)
	if err != nil {
		return "", err
	}
	qrImage, err = barcode.Scale(qrImage, 280, 280)
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	if err := png.Encode(&buf, qrImage); err != nil {
		return "", err
	}
	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}

func AlipayNativePayPage(c *gin.Context) {
	tradeNo := strings.TrimSpace(c.Param("trade_no"))
	topUp := model.GetTopUpByTradeNo(tradeNo)
	if topUp == nil || topUp.PaymentProvider != model.PaymentProviderAlipayNative {
		c.String(http.StatusNotFound, "payment order not found")
		return
	}

	payload := parseAlipayProviderPayload(topUp.ProviderPayload)
	qrDataURI := ""
	if payload.QRCode != "" && topUp.Status == common.TopUpStatusPending {
		if dataURI, err := alipayQRCodeDataURI(payload.QRCode); err == nil {
			qrDataURI = dataURI
		} else {
			logger.LogError(c.Request.Context(), fmt.Sprintf("支付宝当面付 二维码渲染失败 trade_no=%s error=%q", tradeNo, err.Error()))
		}
	}

	statusURL := "/api/user/native-pay/" + url.PathEscape(tradeNo) + "/status"
	returnURL := getAlipayReturnURL()
	statusText := "等待支付"
	if topUp.Status == common.TopUpStatusSuccess {
		statusText = "支付成功"
	} else if topUp.Status == common.TopUpStatusFailed || topUp.Status == common.TopUpStatusExpired {
		statusText = "订单已失效"
	}

	qrHTML := `<div class="qr-missing">二维码暂不可用，请返回充值页重新下单。</div>`
	if qrDataURI != "" {
		qrHTML = `<img class="qr" src="` + html.EscapeString(qrDataURI) + `" alt="支付宝付款二维码" />`
	} else if topUp.Status == common.TopUpStatusSuccess {
		qrHTML = `<div class="success-mark">✓</div>`
	}

	page := `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>支付宝扫码支付</title>
<style>
body{margin:0;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,"PingFang SC","Microsoft YaHei",sans-serif;color:#1f2937;display:flex;align-items:center;justify-content:center;min-height:100vh}.card{width:min(92vw,430px);background:#fff;border-radius:22px;box-shadow:0 20px 60px rgba(15,23,42,.12);padding:30px 26px;text-align:center}.title{font-size:24px;font-weight:700;margin:0 0 8px}.sub{color:#64748b;font-size:14px;margin-bottom:22px}.amount{font-size:34px;font-weight:800;margin:10px 0 6px}.meta{font-size:13px;color:#64748b;word-break:break-all;margin:4px 0}.qr{width:280px;height:280px;border:1px solid #e5e7eb;border-radius:16px;padding:10px;background:#fff;margin:20px auto 10px;box-sizing:border-box}.status{margin-top:16px;font-weight:600}.hint{margin-top:14px;font-size:13px;color:#64748b;line-height:1.7}.success{color:#16a34a}.error{color:#dc2626}.success-mark{font-size:96px;color:#16a34a;line-height:1.4}.qr-missing{margin:24px 0;padding:18px;border-radius:14px;background:#fef2f2;color:#dc2626;font-size:14px}.btn{display:inline-block;margin-top:18px;padding:10px 16px;border-radius:999px;text-decoration:none;background:#1677ff;color:#fff;font-weight:600}
</style>
</head>
<body>
<div class="card">
  <h1 class="title">支付宝扫码支付</h1>
  <div class="sub">请使用支付宝扫一扫完成付款</div>
  <div class="amount">¥` + html.EscapeString(formatAlipayAmount(topUp.Money)) + `</div>
  <div class="meta">订单号：` + html.EscapeString(topUp.TradeNo) + `</div>
  ` + qrHTML + `
  <div id="status" class="status">支付状态：` + html.EscapeString(statusText) + `</div>
  <div class="hint">二维码有效期通常为 2 小时。支付完成后本页会自动跳转，也可以返回充值页查看到账结果。</div>
  <a class="btn" href="` + html.EscapeString(returnURL) + `">返回充值页</a>
</div>
<script>
const statusUrl = ` + strconv.Quote(statusURL) + `;
const returnUrl = ` + strconv.Quote(returnURL) + `;
async function poll(){
  try{
    const res = await fetch(statusUrl,{credentials:'same-origin'});
    const data = await res.json();
    if(data && data.data){
      const el = document.getElementById('status');
      if(data.data.paid){
        el.className='status success';
        el.textContent='支付状态：支付成功，正在跳转...';
        setTimeout(()=>{ window.location.href = returnUrl; }, 900);
        return;
      }
      if(data.data.status === 'failed' || data.data.status === 'expired'){
        el.className='status error';
        el.textContent='支付状态：订单已失效，请重新下单';
        return;
      }
    }
  }catch(e){}
  setTimeout(poll, 2000);
}
poll();
</script>
</body>
</html>`
	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(page))
}

func AlipayNativePayStatus(c *gin.Context) {
	tradeNo := strings.TrimSpace(c.Param("trade_no"))
	topUp := model.GetTopUpByTradeNo(tradeNo)
	if topUp == nil || topUp.PaymentProvider != model.PaymentProviderAlipayNative {
		c.JSON(http.StatusNotFound, gin.H{"message": "error", "data": "订单不存在"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"trade_no":   topUp.TradeNo,
			"status":     topUp.Status,
			"paid":       topUp.Status == common.TopUpStatusSuccess,
			"amount":     formatAlipayAmount(topUp.Money),
			"return_url": getAlipayReturnURL(),
		},
	})
}

func collectAlipayNotifyParams(c *gin.Context) (map[string]string, error) {
	if err := c.Request.ParseForm(); err != nil {
		return nil, err
	}
	params := map[string]string{}
	for key, values := range c.Request.Form {
		if len(values) > 0 {
			params[key] = values[0]
		}
	}
	return params, nil
}

func alipayAmountsEqual(notified string, expected float64) bool {
	notifiedDecimal, err := decimal.NewFromString(strings.TrimSpace(notified))
	if err != nil {
		return false
	}
	expectedDecimal := decimal.NewFromFloat(expected)
	return notifiedDecimal.StringFixed(2) == expectedDecimal.StringFixed(2)
}

func AlipayNativeNotify(c *gin.Context) {
	if !isAlipayNativeTopUpEnabled() {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("支付宝当面付 webhook 被拒绝 reason=webhook_disabled path=%q client_ip=%s", c.Request.RequestURI, c.ClientIP()))
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}

	params, err := collectAlipayNotifyParams(c)
	if err != nil || len(params) == 0 {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("支付宝当面付 webhook 参数解析失败 path=%q client_ip=%s error=%v", c.Request.RequestURI, c.ClientIP(), err))
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}

	if err := verifyAlipayRSA2(params); err != nil {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("支付宝当面付 webhook 验签失败 path=%q client_ip=%s trade_no=%s error=%q", c.Request.RequestURI, c.ClientIP(), params["out_trade_no"], err.Error()))
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}

	if strings.TrimSpace(params["app_id"]) != getAlipayAppID() {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("支付宝当面付 webhook app_id 不匹配 trade_no=%s notify_app_id=%s client_ip=%s", params["out_trade_no"], params["app_id"], c.ClientIP()))
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}

	tradeNo := strings.TrimSpace(params["out_trade_no"])
	if tradeNo == "" {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("支付宝当面付 webhook 缺少 out_trade_no client_ip=%s", c.ClientIP()))
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}

	topUp := model.GetTopUpByTradeNo(tradeNo)
	if topUp == nil {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("支付宝当面付 webhook 本地订单不存在 trade_no=%s client_ip=%s", tradeNo, c.ClientIP()))
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}
	if topUp.PaymentProvider != model.PaymentProviderAlipayNative {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("支付宝当面付 webhook 订单支付网关不匹配 trade_no=%s provider=%s client_ip=%s", tradeNo, topUp.PaymentProvider, c.ClientIP()))
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}
	if !alipayAmountsEqual(params["total_amount"], topUp.Money) {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("支付宝当面付 webhook 金额不匹配 trade_no=%s notify_amount=%s order_money=%.2f client_ip=%s", tradeNo, params["total_amount"], topUp.Money, c.ClientIP()))
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}

	tradeStatus := strings.TrimSpace(params["trade_status"])
	if tradeStatus != "TRADE_SUCCESS" && tradeStatus != "TRADE_FINISHED" {
		if tradeStatus == "TRADE_CLOSED" {
			if err := model.UpdatePendingTopUpStatus(tradeNo, model.PaymentProviderAlipayNative, common.TopUpStatusFailed); err != nil && !errors.Is(err, model.ErrTopUpStatusInvalid) && !errors.Is(err, model.ErrTopUpNotFound) {
				logger.LogError(c.Request.Context(), fmt.Sprintf("支付宝当面付 webhook 标记关闭订单失败 trade_no=%s error=%q", tradeNo, err.Error()))
			}
		}
		logger.LogInfo(c.Request.Context(), fmt.Sprintf("支付宝当面付 webhook 忽略非成功状态 trade_no=%s trade_status=%s client_ip=%s", tradeNo, tradeStatus, c.ClientIP()))
		_, _ = c.Writer.Write([]byte("success"))
		return
	}

	LockOrder(tradeNo)
	defer UnlockOrder(tradeNo)

	if err := model.RechargeAlipayNative(tradeNo, c.ClientIP()); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("支付宝当面付 充值处理失败 trade_no=%s client_ip=%s error=%q", tradeNo, c.ClientIP(), err.Error()))
		_, _ = c.Writer.Write([]byte("fail"))
		return
	}

	logger.LogInfo(c.Request.Context(), fmt.Sprintf("支付宝当面付 充值成功 trade_no=%s trade_status=%s client_ip=%s", tradeNo, tradeStatus, c.ClientIP()))
	_, _ = c.Writer.Write([]byte("success"))
}
