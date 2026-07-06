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
import { api } from '@/lib/api'
import type {
  AffiliateTransferRequest,
  ApiResponse,
  InviteConsumptionOverview,
  InviteDetail,
  InviteRewardConfig,
  InviteRewardsUser,
} from './types'

export async function getInviteRewardConfig(): Promise<
  ApiResponse<InviteRewardConfig>
> {
  const res = await api.get('/api/invite/reward-config')
  return res.data
}

export async function getSelfInviteRewardsUser(): Promise<
  ApiResponse<InviteRewardsUser>
> {
  const res = await api.get('/api/user/self')
  return res.data
}

export async function getAffiliateCode(): Promise<ApiResponse<string>> {
  const res = await api.get('/api/user/aff')
  return res.data
}

export async function getSelfInviteDetail(): Promise<ApiResponse<InviteDetail>> {
  const res = await api.get('/api/user/invite-detail')
  return res.data
}


export async function getInviteConsumptionOverview(
  range: string,
  page = 1,
  pageSize = 20
): Promise<ApiResponse<InviteConsumptionOverview>> {
  const params = new URLSearchParams({
    range,
    page: String(page),
    page_size: String(pageSize),
    sort: 'quota_desc',
  })
  const res = await api.get(`/api/user/invite-consumption?${params.toString()}`)
  return res.data
}

export async function transferAffiliateQuota(
  request: AffiliateTransferRequest
): Promise<ApiResponse> {
  const res = await api.post('/api/user/aff_transfer', request)
  return res.data
}
