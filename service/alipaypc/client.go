package alipaypc

import (
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
	"net/url"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	AppID          string
	Gateway       string
	SignType      string
	ProductCode   string
	NotifyURL     string
	ReturnURL     string
	PrivateKeyPEM string
	PublicKeyPEM  string
}

type Client struct {
	config Config
}

func IsEnabled() bool {
	return strings.EqualFold(os.Getenv("ALIPAY_PC_ENABLED"), "true") ||
		strings.EqualFold(os.Getenv("ALIPAY_PC_ENABLED"), "1")
}

func LoadConfig() (Config, error) {
	if !IsEnabled() {
		return Config{}, errors.New("alipay pc is disabled")
	}

	cfg := Config{
		AppID:        strings.TrimSpace(os.Getenv("ALIPAY_APP_ID")),
		Gateway:      strings.TrimSpace(os.Getenv("ALIPAY_GATEWAY")),
		SignType:     strings.TrimSpace(os.Getenv("ALIPAY_SIGN_TYPE")),
		ProductCode:  strings.TrimSpace(os.Getenv("ALIPAY_PRODUCT_CODE")),
		NotifyURL:    strings.TrimSpace(os.Getenv("ALIPAY_NOTIFY_URL")),
		ReturnURL:    strings.TrimSpace(os.Getenv("ALIPAY_RETURN_URL")),
		PrivateKeyPEM: strings.TrimSpace(os.Getenv("ALIPAY_PRIVATE_KEY")),
		PublicKeyPEM:  strings.TrimSpace(os.Getenv("ALIPAY_PUBLIC_KEY")),
	}

	if cfg.Gateway == "" {
		cfg.Gateway = "https://openapi.alipay.com/gateway.do"
	}
	if cfg.SignType == "" {
		cfg.SignType = "RSA2"
	}
	if cfg.ProductCode == "" {
		cfg.ProductCode = "FAST_INSTANT_TRADE_PAY"
	}

	privateKeyPath := strings.TrimSpace(os.Getenv("ALIPAY_PRIVATE_KEY_PATH"))
	if cfg.PrivateKeyPEM == "" && privateKeyPath != "" {
		b, err := os.ReadFile(privateKeyPath)
		if err != nil {
			return Config{}, fmt.Errorf("read ALIPAY_PRIVATE_KEY_PATH failed: %w", err)
		}
		cfg.PrivateKeyPEM = strings.TrimSpace(string(b))
	}

	publicKeyPath := strings.TrimSpace(os.Getenv("ALIPAY_PUBLIC_KEY_PATH"))
	if cfg.PublicKeyPEM == "" && publicKeyPath != "" {
		b, err := os.ReadFile(publicKeyPath)
		if err != nil {
			return Config{}, fmt.Errorf("read ALIPAY_PUBLIC_KEY_PATH failed: %w", err)
		}
		cfg.PublicKeyPEM = strings.TrimSpace(string(b))
	}

	if cfg.AppID == "" {
		return Config{}, errors.New("ALIPAY_APP_ID is required")
	}
	if cfg.PrivateKeyPEM == "" {
		return Config{}, errors.New("ALIPAY_PRIVATE_KEY or ALIPAY_PRIVATE_KEY_PATH is required")
	}
	if cfg.PublicKeyPEM == "" {
		return Config{}, errors.New("ALIPAY_PUBLIC_KEY or ALIPAY_PUBLIC_KEY_PATH is required")
	}

	return cfg, nil
}

func NewClient(cfg Config) *Client {
	return &Client{config: cfg}
}


func normalizeTotalAmount(totalAmount interface{}) (string, error) {
	amount := strings.TrimSpace(fmt.Sprint(totalAmount))
	if amount == "" {
		return "", errors.New("total_amount is required")
	}

	value, err := strconv.ParseFloat(amount, 64)
	if err != nil {
		return "", fmt.Errorf("total_amount is invalid: %w", err)
	}
	if value <= 0 {
		return "", errors.New("total_amount must be greater than 0")
	}

	return fmt.Sprintf("%.2f", value), nil
}

func (c *Client) CreatePagePayURL(outTradeNo, subject, totalAmount string) (string, error) {
	return c.CreatePagePayURLWithURLs(outTradeNo, subject, totalAmount, c.config.ReturnURL, c.config.NotifyURL)
}

func (c *Client) CreatePagePayURLWithURLs(outTradeNo, subject, totalAmount, returnURL, notifyURL string) (string, error) {
	if outTradeNo == "" {
		return "", errors.New("out_trade_no is required")
	}
	if subject == "" {
		subject = "FeiXiangApi 余额充值"
	}
	normalizedAmount, err := normalizeTotalAmount(totalAmount)
	if err != nil {
		return "", err
	}
	totalAmount = normalizedAmount

	bizContent, err := json.Marshal(map[string]string{
		"out_trade_no": outTradeNo,
		"product_code": c.config.ProductCode,
		"total_amount": totalAmount,
		"subject":      subject,
	})
	if err != nil {
		return "", err
	}

	params := map[string]string{
		"app_id":      c.config.AppID,
		"method":      "alipay.trade.page.pay",
		"format":      "JSON",
		"charset":     "utf-8",
		"sign_type":   c.config.SignType,
		"timestamp":   time.Now().Format("2006-01-02 15:04:05"),
		"version":     "1.0",
		"biz_content": string(bizContent),
	}

	if returnURL != "" {
		params["return_url"] = returnURL
	}
	if notifyURL != "" {
		params["notify_url"] = notifyURL
	}

	signContent := BuildSignContent(params)
	sign, err := SignRSA2(c.config.PrivateKeyPEM, signContent)
	if err != nil {
		return "", err
	}
	params["sign"] = sign

	values := url.Values{}
	for k, v := range params {
		values.Set(k, v)
	}

	gateway := c.config.Gateway
	if gateway == "" {
		gateway = "https://openapi.alipay.com/gateway.do"
	}

	return gateway + "?" + values.Encode(), nil
}

func (c *Client) VerifyNotify(values url.Values) (bool, error) {
	sign := values.Get("sign")
	if sign == "" {
		return false, errors.New("missing sign")
	}

	params := map[string]string{}
	for k, v := range values {
		if k == "sign" || k == "sign_type" {
			continue
		}
		if len(v) > 0 {
			params[k] = v[0]
		}
	}

	signContent := BuildSignContent(params)
	if err := VerifyRSA2(c.config.PublicKeyPEM, signContent, sign); err != nil {
		return false, err
	}

	return true, nil
}

func BuildSignContent(params map[string]string) string {
	keys := make([]string, 0, len(params))
	for k, v := range params {
		if k == "" || v == "" || k == "sign" {
			continue
		}
		keys = append(keys, k)
	}

	sort.Strings(keys)

	parts := make([]string, 0, len(keys))
	for _, k := range keys {
		parts = append(parts, k+"="+params[k])
	}

	return strings.Join(parts, "&")
}

func SignRSA2(privateKeyPEM string, content string) (string, error) {
	privateKey, err := parsePrivateKey(privateKeyPEM)
	if err != nil {
		return "", err
	}

	h := sha256.New()
	_, _ = h.Write([]byte(content))
	digest := h.Sum(nil)

	sig, err := rsa.SignPKCS1v15(rand.Reader, privateKey, crypto.SHA256, digest)
	if err != nil {
		return "", err
	}

	return base64.StdEncoding.EncodeToString(sig), nil
}

func VerifyRSA2(publicKeyPEM string, content string, sign string) error {
	publicKey, err := parsePublicKey(publicKeyPEM)
	if err != nil {
		return err
	}

	sig, err := base64.StdEncoding.DecodeString(sign)
	if err != nil {
		return err
	}

	h := sha256.New()
	_, _ = h.Write([]byte(content))
	digest := h.Sum(nil)

	return rsa.VerifyPKCS1v15(publicKey, crypto.SHA256, digest, sig)
}

func parsePrivateKey(privateKeyPEM string) (*rsa.PrivateKey, error) {
	privateKeyPEM = normalizePEM(privateKeyPEM, "RSA PRIVATE KEY")

	block, _ := pem.Decode([]byte(privateKeyPEM))
	if block == nil {
		return nil, errors.New("invalid private key pem")
	}

	if key, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return key, nil
	}

	parsed, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}

	key, ok := parsed.(*rsa.PrivateKey)
	if !ok {
		return nil, errors.New("private key is not RSA")
	}

	return key, nil
}

func parsePublicKey(publicKeyPEM string) (*rsa.PublicKey, error) {
	publicKeyPEM = normalizePEM(publicKeyPEM, "PUBLIC KEY")

	block, _ := pem.Decode([]byte(publicKeyPEM))
	if block == nil {
		return nil, errors.New("invalid public key pem")
	}

	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err == nil {
		key, ok := pub.(*rsa.PublicKey)
		if !ok {
			return nil, errors.New("public key is not RSA")
		}
		return key, nil
	}

	cert, certErr := x509.ParseCertificate(block.Bytes)
	if certErr == nil {
		key, ok := cert.PublicKey.(*rsa.PublicKey)
		if !ok {
			return nil, errors.New("certificate public key is not RSA")
		}
		return key, nil
	}

	return nil, err
}

func normalizePEM(s string, pemType string) string {
	s = strings.TrimSpace(s)
	if strings.Contains(s, "-----BEGIN ") {
		return s
	}

	s = strings.ReplaceAll(s, "\r", "")
	s = strings.ReplaceAll(s, "\n", "")

	var b strings.Builder
	b.WriteString("-----BEGIN " + pemType + "-----\n")
	for len(s) > 64 {
		b.WriteString(s[:64])
		b.WriteString("\n")
		s = s[64:]
	}
	if len(s) > 0 {
		b.WriteString(s)
		b.WriteString("\n")
	}
	b.WriteString("-----END " + pemType + "-----\n")

	return b.String()
}

// CreatePagePayURL is a package-level compatibility wrapper used by controller/topup_alipay_pc.go.
func CreatePagePayURL(outTradeNo string, subject string, totalAmount interface{}, notifyURL string, returnURL string) (string, error) {
	cfg, err := LoadConfig()
	if err != nil {
		return "", err
	}

	amount, err := normalizeTotalAmount(totalAmount)
	if err != nil {
		return "", err
	}

	client := NewClient(cfg)
	return client.CreatePagePayURLWithURLs(outTradeNo, subject, amount, returnURL, notifyURL)
}

// FrontendReturnURL returns the preferred frontend return URL after the cashier flow.
func FrontendReturnURL(fallback string) string {
	if v := strings.TrimSpace(os.Getenv("ALIPAY_FRONTEND_RETURN_URL")); v != "" {
		return v
	}
	if v := strings.TrimSpace(os.Getenv("ALIPAY_RETURN_URL")); v != "" {
		return v
	}
	return fallback
}

// VerifyNotify is a package-level compatibility wrapper used by controller/topup_alipay_pc.go.
// It accepts common Gin/HTTP parameter shapes.
func VerifyNotify(params interface{}) error {
	cfg, err := LoadConfig()
	if err != nil {
		return err
	}

	values := url.Values{}

	switch p := params.(type) {
	case url.Values:
		values = p
	case map[string]string:
		for k, v := range p {
			values.Set(k, v)
		}
	case map[string][]string:
		for k, arr := range p {
			for _, v := range arr {
				values.Add(k, v)
			}
		}
	default:
		return fmt.Errorf("unsupported alipay notify params type %T", params)
	}

	ok, err := NewClient(cfg).VerifyNotify(values)
	if err != nil {
		return err
	}
	if !ok {
		return errors.New("alipay notify signature verification failed")
	}

	return nil
}
