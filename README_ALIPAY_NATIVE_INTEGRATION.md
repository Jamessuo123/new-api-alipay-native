# New API 官方支付宝当面付接入补丁

本补丁接入的是支付宝官方原生当面付订单码/扫码支付，不是经营码，也不是易支付。

## 核心链路

```text
/api/user/pay 继续接收前端原有充值请求
  -> payment_method=alipay 时后端拦截
  -> 调用 alipay.trade.precreate
  -> 写入 TopUp pending 订单，PaymentProvider=alipay_native
  -> 返回 /api/user/native-pay/:trade_no 二维码页
  -> 支付宝异步通知 /api/user/alipay/notify
  -> RSA2 验签 + app_id/金额/订单/provider 校验
  -> model.RechargeAlipayNative 幂等入账
```

## 需要的环境变量

写入实际容器环境变量文件，例如：

```text
/root/new-api-container.env
```

```env
NATIVE_PAY_ENABLED=true
ALIPAY_NATIVE_ENABLED=true
ALIPAY_APP_ID=你的支付宝APPID
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
ALIPAY_PRIVATE_KEY_PATH=/app/certs/alipay_app_private_key.pem
ALIPAY_PUBLIC_KEY_PATH=/app/certs/alipay_public_key.pem
ALIPAY_NOTIFY_URL=https://mwcte.com/api/user/alipay/notify
ALIPAY_RETURN_URL=https://mwcte.com/console/topup?show_history=true
ALIPAY_MIN_TOPUP=10
ALIPAY_SUBJECT=New API 余额充值
```

## 证书路径

宿主机建议：

```text
/www/dk_project/dk_app/newapi/new-api/certs/alipay_app_private_key.pem
/www/dk_project/dk_app/newapi/new-api/certs/alipay_public_key.pem
```

容器内路径：

```text
/app/certs/alipay_app_private_key.pem
/app/certs/alipay_public_key.pem
```

## 新增接口

```text
POST /api/user/alipay/notify
GET  /api/user/native-pay/:trade_no
POST /api/user/native-pay/:trade_no
GET  /api/user/native-pay/:trade_no/status
POST /api/user/alipay/pay
POST /api/user/alipay/amount
```

其中 `/api/user/pay` 已兼容：当前端提交 `payment_method=alipay` 时，会直接走官方支付宝当面付，不需要改前端。

## 部署检查

```bash
cd /www/dk_project/new-api-source

git status --short

go test ./model ./controller

docker build -t new-api:alipay-native .

cd /www/dk_project/dk_app/newapi/new-api
docker compose up -d --force-recreate new-api
```

如果服务器 Go 版本低于 `go.mod` 要求，以 Docker build 为准；Dockerfile 会使用项目要求的 Go 版本。

## 验收

1. 打开 `/api/user/topup/info`，确认 `pay_methods` 有 `type=alipay`。
2. 前端充值选择支付宝。
3. 后端创建 `TopUp.status=pending`，`payment_provider=alipay_native`。
4. 打开二维码页 `/api/user/native-pay/:trade_no`。
5. 支付宝扫码小额支付。
6. `/api/user/alipay/notify` 返回纯文本 `success`。
7. `TopUp.status=success`，用户 `quota` 增加。
8. 重放同一个 notify 不重复加额度。
