package controller

import (
	"fmt"
	"math"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/service/alipaypc"
	"github.com/QuantumNous/new-api/setting/operation_setting"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

const PaymentMethodAlipayPC = "alipay_pc"
const PaymentProviderAlipayPC = "alipay_pc"

type AlipayPCRequest struct { Amount int64 `json:"amount"`; PaymentMethod string `json:"payment_method"` }
func IsAlipayPcTopUpEnabled() bool { return alipaypc.IsEnabled() }
func RequestAlipayPcTopUp(c *gin.Context) { var req AlipayPCRequest; if err:=c.ShouldBindJSON(&req); err!=nil{ c.JSON(http.StatusOK, gin.H{"message":"error","data":"参数错误"}); return }; RequestAlipayPcTopUpFromAmount(c, req.Amount) }
func RequestAlipayPcTopUpFromAmount(c *gin.Context, requestAmount int64) {
	if !IsAlipayPcTopUpEnabled() { c.JSON(http.StatusOK, gin.H{"message":"error","data":"支付宝 PC 支付未启用"}); return }
	if requestAmount < getMinTopup() { c.JSON(http.StatusOK, gin.H{"message":"error","data":fmt.Sprintf("充值数量不能小于 %d", getMinTopup())}); return }
	id:=c.GetInt("id"); group,err:=model.GetUserGroup(id,true); if err!=nil{ c.JSON(http.StatusOK, gin.H{"message":"error","data":"获取用户分组失败"}); return }
	payMoney:=getPayMoney(requestAmount, group); if payMoney < 0.01 { c.JSON(http.StatusOK, gin.H{"message":"error","data":"充值金额过低"}); return }
	amount:=normalizeAlipayTopUpAmount(requestAmount); tradeNo:=fmt.Sprintf("ALIUSR%dNO%s%d", id, common.GetRandomString(6), time.Now().Unix())
	callbackAddress:=service.GetCallbackAddress(); notifyURL:=firstNonEmpty(os.Getenv("ALIPAY_NOTIFY_URL"), callbackAddress+"/api/user/topup/alipay/notify"); returnURL:=firstNonEmpty(os.Getenv("ALIPAY_RETURN_URL"), callbackAddress+"/api/user/topup/alipay/return")
	cashierURL,err:=alipaypc.CreatePagePayURL(tradeNo, fmt.Sprintf("FeiXiangApi 充值 %d", requestAmount), payMoney, notifyURL, returnURL); if err!=nil{ logger.LogError(c.Request.Context(), fmt.Sprintf("支付宝 PC 拉起支付失败 user_id=%d trade_no=%s amount=%d error=%q", id, tradeNo, requestAmount, err.Error())); c.JSON(http.StatusOK, gin.H{"message":"error","data":"拉起支付宝支付失败"}); return }
	topUp:=&model.TopUp{UserId:id,Amount:amount,Money:payMoney,TradeNo:tradeNo,PaymentMethod:PaymentMethodAlipayPC,PaymentProvider:PaymentProviderAlipayPC,CreateTime:time.Now().Unix(),Status:common.TopUpStatusPending}; if err:=topUp.Insert(); err!=nil{ logger.LogError(c.Request.Context(), fmt.Sprintf("支付宝 PC 创建充值订单失败 user_id=%d trade_no=%s amount=%d error=%q", id, tradeNo, requestAmount, err.Error())); c.JSON(http.StatusOK, gin.H{"message":"error","data":"创建订单失败"}); return }
	c.JSON(http.StatusOK, gin.H{"message":"success","url":cashierURL,"cashier_url":cashierURL,"payment_url":cashierURL,"order_no":tradeNo,"trade_no":tradeNo,"amount":amount,"pay_money":payMoney,"money":payMoney,"payment_method":PaymentMethodAlipayPC,"payment_provider":PaymentProviderAlipayPC,"create_time":topUp.CreateTime,"created_at":topUp.CreateTime,"expire_at":topUp.CreateTime+30*60,"data":gin.H{"cashier_url":cashierURL,"payment_url":cashierURL,"order_no":tradeNo,"trade_no":tradeNo,"amount":amount,"pay_money":payMoney,"money":payMoney,"payment_method":PaymentMethodAlipayPC,"payment_provider":PaymentProviderAlipayPC,"create_time":topUp.CreateTime,"expire_at":topUp.CreateTime+30*60}})
}
func GetAlipayPcTopUpStatus(c *gin.Context) { tradeNo:=c.Param("trade_no"); if strings.TrimSpace(tradeNo)==""{common.ApiErrorMsg(c,"订单号不能为空"); return}; userId:=c.GetInt("id"); topUp:=model.GetTopUpByTradeNo(tradeNo); if topUp==nil||topUp.UserId!=userId{common.ApiErrorMsg(c,"订单不存在或无权访问"); return}; common.ApiSuccess(c, buildAlipayTopUpOrderItem(topUp)) }
func AlipayPcReturn(c *gin.Context) { fallback:=service.GetCallbackAddress()+"/dashboard/wallet"; c.Redirect(http.StatusFound, alipaypc.FrontendReturnURL(fallback)) }
func AlipayPcNotify(c *gin.Context) {
	params:=map[string]string{}; if err:=c.Request.ParseForm(); err!=nil{ _,_=c.Writer.Write([]byte("failure")); return }; for k,vs:=range c.Request.Form{ if len(vs)>0{params[k]=vs[0]} }; if len(params)==0{_,_=c.Writer.Write([]byte("failure")); return}
	if err:=alipaypc.VerifyNotify(params); err!=nil{ logger.LogWarn(c.Request.Context(), fmt.Sprintf("支付宝 PC 回调验签失败 client_ip=%s error=%q params=%q", c.ClientIP(), err.Error(), common.GetJsonString(params))); _,_=c.Writer.Write([]byte("failure")); return }
	tradeStatus:=params["trade_status"]; if tradeStatus!="TRADE_SUCCESS"&&tradeStatus!="TRADE_FINISHED"{ _,_=c.Writer.Write([]byte("success")); return }
	tradeNo:=params["out_trade_no"]; LockOrder(tradeNo); defer UnlockOrder(tradeNo); topUp:=model.GetTopUpByTradeNo(tradeNo); if topUp==nil{_,_=c.Writer.Write([]byte("failure")); return}; if topUp.PaymentProvider!=PaymentProviderAlipayPC{_,_=c.Writer.Write([]byte("failure")); return}
	if totalAmount,err:=strconv.ParseFloat(params["total_amount"],64); err==nil&&totalAmount>0{ if math.Abs(totalAmount-topUp.Money)>0.01{_,_=c.Writer.Write([]byte("failure")); return} }
	if topUp.Status==common.TopUpStatusPending{ topUp.Status=common.TopUpStatusSuccess; topUp.CompleteTime=common.GetTimestamp(); if err:=topUp.Update(); err!=nil{_,_=c.Writer.Write([]byte("failure")); return}; dAmount:=decimal.NewFromInt(int64(topUp.Amount)); dQuotaPerUnit:=decimal.NewFromFloat(common.QuotaPerUnit); quotaToAdd:=int(dAmount.Mul(dQuotaPerUnit).IntPart()); if err:=model.IncreaseUserQuota(topUp.UserId, quotaToAdd, true); err!=nil{_,_=c.Writer.Write([]byte("failure")); return}; model.RecordTopupLog(topUp.UserId, fmt.Sprintf("使用支付宝 PC 支付充值成功，充值金额: %v，支付金额：%f", logger.LogQuota(quotaToAdd), topUp.Money), c.ClientIP(), topUp.PaymentMethod, PaymentProviderAlipayPC) }
	_,_=c.Writer.Write([]byte("success"))
}
func normalizeAlipayTopUpAmount(amount int64) int64 { if operation_setting.GetQuotaDisplayType()==operation_setting.QuotaDisplayTypeTokens{ dAmount:=decimal.NewFromInt(amount); dQuotaPerUnit:=decimal.NewFromFloat(common.QuotaPerUnit); return dAmount.Div(dQuotaPerUnit).IntPart() }; return amount }
func buildAlipayTopUpOrderItem(topUp *model.TopUp) gin.H { if topUp==nil{return gin.H{}}; username:=""; if user,err:=model.GetUserById(topUp.UserId,false); err==nil&&user!=nil{username=user.Username}; return gin.H{"id":topUp.Id,"user_id":topUp.UserId,"username":username,"order_no":topUp.TradeNo,"trade_no":topUp.TradeNo,"amount":topUp.Amount,"money":topUp.Money,"pay_money":topUp.Money,"payment_method":topUp.PaymentMethod,"payment_provider":topUp.PaymentProvider,"status":topUp.Status,"create_time":topUp.CreateTime,"created_at":topUp.CreateTime,"complete_time":topUp.CompleteTime,"paid_at":topUp.CompleteTime,"expire_at":topUp.CreateTime+30*60} }
func firstNonEmpty(values ...string) string { for _,v:=range values{ if strings.TrimSpace(v)!=""{ return strings.TrimSpace(v) } }; return "" }
