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
import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatQuota } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog } from '@/components/dialog'
import { QUOTA_PER_DOLLAR } from '../../constants'

interface TransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (amount: number) => Promise<boolean>
  availableQuota: number
  transferring: boolean
}

function formatAmountInputValue(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0'
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

function quotaToAmount(quota: number): number {
  if (!Number.isFinite(quota) || quota <= 0) return 0
  return quota / QUOTA_PER_DOLLAR
}

function amountToQuota(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0
  return Math.floor(amount * QUOTA_PER_DOLLAR)
}

function defaultTransferAmount(availableQuota: number): string {
  const availableAmount = quotaToAmount(availableQuota)
  if (availableAmount <= 0) return '0'
  return formatAmountInputValue(Math.min(1, availableAmount))
}

export function TransferDialog({
  open,
  onOpenChange,
  onConfirm,
  availableQuota,
  transferring,
}: TransferDialogProps) {
  const { t } = useTranslation()
  const [amountText, setAmountText] = useState(() =>
    defaultTransferAmount(availableQuota)
  )

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmountText(defaultTransferAmount(availableQuota))
    }
  }, [availableQuota, open])

  const parsedAmount = Number(amountText)
  const availableAmount = quotaToAmount(availableQuota)
  const transferQuota = amountToQuota(parsedAmount)
  const validationMessage = useMemo(() => {
    const raw = amountText.trim()
    if (!raw) return '请输入转入额度'
    if (!Number.isFinite(parsedAmount)) return '请输入有效的转入额度'
    if (parsedAmount <= 0) return '转入额度必须大于 0'
    if (availableQuota < QUOTA_PER_DOLLAR) {
      return `可转入返利未达到最低转入额度 ${formatQuota(QUOTA_PER_DOLLAR)}`
    }
    if (parsedAmount < 1) {
      return `最低转入额度为 ${formatQuota(QUOTA_PER_DOLLAR)}`
    }
    if (transferQuota > availableQuota) return '转入额度不能超过可转入返利'
    return ''
  }, [amountText, availableQuota, parsedAmount, transferQuota])

  const handleConfirm = async () => {
    if (validationMessage || transferring) return
    const success = await onConfirm(transferQuota)
    if (success) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('Transfer Rewards')}
      description={t('Move affiliate rewards to your main balance')}
      contentClassName='max-sm:w-[calc(100vw-1.5rem)] sm:max-w-md'
      titleClassName='text-xl font-semibold'
      footerClassName='grid grid-cols-2 gap-2 sm:flex'
      contentHeight='auto'
      bodyClassName='space-y-4'
      footer={
        <>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={transferring}
          >
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={transferring || Boolean(validationMessage)}
          >
            {transferring && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {t('Transfer')}
          </Button>
        </>
      }
    >
      <div className='space-y-4 py-3 sm:space-y-6 sm:py-4'>
        <div className='space-y-2'>
          <Label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
            {t('Available Rewards')}
          </Label>
          <div className='text-2xl font-semibold'>
            {formatQuota(availableQuota)}
          </div>
          <p className='text-muted-foreground text-xs'>
            最低转入金额：{formatQuota(QUOTA_PER_DOLLAR)}
          </p>
        </div>

        <div className='space-y-3'>
          <Label
            htmlFor='transfer-amount'
            className='text-muted-foreground text-xs font-medium tracking-wider uppercase'
          >
            转移额度
          </Label>
          <Input
            id='transfer-amount'
            type='number'
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            min={1}
            max={formatAmountInputValue(availableAmount)}
            step={0.01}
            inputMode='decimal'
            aria-invalid={Boolean(validationMessage)}
            className='font-mono text-lg'
          />
          {validationMessage ? (
            <p className='text-destructive text-xs'>{validationMessage}</p>
          ) : (
            <p className='text-muted-foreground text-xs'>
              输入范围：{formatQuota(QUOTA_PER_DOLLAR)} 至{' '}
              {formatQuota(availableQuota)}
            </p>
          )}
        </div>
      </div>
    </Dialog>
  )
}
