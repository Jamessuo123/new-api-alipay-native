/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useState, useCallback } from 'react'
import i18next from 'i18next'
import { toast } from 'sonner'
import {
  calculateAmount,
  calculateStripeAmount,
  calculateWaffoPancakeAmount,
  requestPayment,
  requestAlipayPcPayment,
  requestStripePayment,
  isApiSuccess,
} from '../api'
import {
  isStripePayment,
  isWaffoPancakePayment,
  submitPaymentForm,
} from '../lib'

// ============================================================================
// Payment Hook
// ============================================================================

export function usePayment() {
  const [amount, setAmount] = useState<number>(0)
  const [calculating, setCalculating] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Calculate payment amount
  const calculatePaymentAmount = useCallback(
    async (topupAmount: number, paymentType: string) => {
      try {
        setCalculating(true)

        const isStripe = isStripePayment(paymentType)
        const isAlipayPc = paymentType === 'alipay_pc'
        const isPancake = isWaffoPancakePayment(paymentType)
        const response = isStripe
          ? await calculateStripeAmount({ amount: topupAmount })
          : isPancake
            ? await calculateWaffoPancakeAmount({ amount: topupAmount })
            : await calculateAmount({ amount: topupAmount })

        if (isApiSuccess(response) && response.data) {
          const calculatedAmount = parseFloat(response.data)
          setAmount(calculatedAmount)
          return calculatedAmount
        }

        // Don't show error for calculation, just set to 0
        setAmount(0)
        return 0
      } catch (_error) {
        setAmount(0)
        return 0
      } finally {
        setCalculating(false)
      }
    },
    []
  )

  // Process payment
  const processPayment = useCallback(
    async (topupAmount: number, paymentType: string) => {
      try {
        setProcessing(true)

        const isStripe = isStripePayment(paymentType)
        const amount = Math.floor(topupAmount)

        const response = isStripe
          ? await requestStripePayment({
              amount,
              payment_method: 'stripe',
            })
          : await requestPayment({
              amount,
              payment_method: paymentType,
            })

        if (!isApiSuccess(response)) {
          toast.error(response.message || i18next.t('Payment request failed'))
          return false
        }

        // Handle Stripe payment
        if (isStripe && response.data?.pay_link) {
          window.open(response.data.pay_link as string, '_blank', 'noopener,noreferrer')
          toast.success(i18next.t('Redirecting to payment page...'))
          return true
        }

        // Handle non-Stripe payment
        if (!isStripe && response.data) {
          const url = (response as unknown as { url?: string }).url
          if (url) {
            const epayRaw = response as unknown as Record<string, unknown>
          const epayBody =
            epayRaw.data &&
            typeof epayRaw.data === 'object' &&
            !Array.isArray(epayRaw.data) &&
            ('data' in (epayRaw.data as Record<string, unknown>) ||
              'url' in (epayRaw.data as Record<string, unknown>) ||
              'cashier_url' in (epayRaw.data as Record<string, unknown>) ||
              'payment_url' in (epayRaw.data as Record<string, unknown>) ||
              'order_no' in (epayRaw.data as Record<string, unknown>))
              ? (epayRaw.data as Record<string, unknown>)
              : epayRaw
          const epayForm =
            epayBody.data &&
            typeof epayBody.data === 'object' &&
            !Array.isArray(epayBody.data)
              ? (epayBody.data as Record<string, unknown>)
              : ((response.data || {}) as Record<string, unknown>)
          submitPaymentForm(String(epayBody.url ?? epayRaw.url ?? url ?? ''), {
            ...epayForm,
            cashier_url: epayBody.cashier_url ?? epayRaw.cashier_url,
            payment_url: epayBody.payment_url ?? epayRaw.payment_url,
            payurl: epayBody.payurl ?? epayRaw.payurl,
            order_no:
              epayBody.order_no ??
              epayBody.trade_no ??
              epayRaw.order_no ??
              epayRaw.trade_no ??
              epayForm.order_no ??
              epayForm.trade_no ??
              epayForm.out_trade_no ??
              epayForm.service_trade_no,
            trade_no:
              epayBody.trade_no ??
              epayBody.order_no ??
              epayRaw.trade_no ??
              epayRaw.order_no ??
              epayForm.trade_no ??
              epayForm.out_trade_no ??
              epayForm.service_trade_no,
            pay_money:
              epayBody.pay_money ?? epayBody.money ?? epayRaw.pay_money ?? epayRaw.money,
            money: epayBody.money ?? epayBody.pay_money ?? epayRaw.money ?? epayRaw.pay_money,
            create_time: epayBody.create_time ?? epayRaw.create_time,
            expire_at: epayBody.expire_at ?? epayRaw.expire_at,
          })
          toast.success(i18next.t('Redirecting to payment page...'))
            return true
          }
        }

        return false
      } catch (_error) {
        toast.error(i18next.t('Payment request failed'))
        return false
      } finally {
        setProcessing(false)
      }
    },
    []
  )

  return {
    amount,
    calculating,
    processing,
    calculatePaymentAmount,
    processPayment,
    setAmount,
  }
}
