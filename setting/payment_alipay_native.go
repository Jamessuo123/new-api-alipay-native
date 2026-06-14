package setting

// Official Alipay Face-to-Face Payment (alipay.trade.precreate) configuration.
// Runtime deployments can supply these via environment variables; the controller
// also reads these package variables so they can be wired into option storage in
// a later admin-UI iteration without touching the payment flow.
var (
	NativePayEnabled     bool
	AlipayNativeEnabled  bool
	AlipayAppId          string
	AlipayGateway        string = "https://openapi.alipay.com/gateway.do"
	AlipayPrivateKeyPath string
	AlipayPublicKeyPath  string
	AlipayNotifyUrl      string
	AlipayReturnUrl      string
	AlipayNativeMinTopUp int    = 10
	AlipayNativeSubject  string = "New API 余额充值"
)
