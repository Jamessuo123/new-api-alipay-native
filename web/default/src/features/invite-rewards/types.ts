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
export interface ApiResponse<T = unknown> {
  success?: boolean
  message?: string
  data?: T
}

export interface InviteRewardConfig {
  enabled: boolean
  new_user_quota: number
  inviter_reward: number
  invitee_reward: number
  new_user_quota_display: string
  inviter_reward_display: string
  invitee_reward_display: string
  unit_label: string
  source: string
}

export interface InviteRewardsUser {
  id: number
  username: string
  display_name?: string
  quota: number
  used_quota?: number
  request_count?: number
  aff_code?: string
  aff_count: number
  aff_quota: number
  aff_history_quota: number
  inviter_id?: number
  group?: string
}

export interface InviteUserBrief {
  id: number
  username: string
  display_name?: string
  email?: string
  status: number
  quota: number
  created_at: number
}

export interface InviteSummary {
  inviter_user_id: number
  inviter_username: string
  invited_count: number
  inviter_reward_total: number
  inviter_reward_balance: number
  invitee_reward_total: number
  reward_total: number
  abnormal_count: number
  last_invited_at: number
  reward_source: string
}

export interface InviteeItem {
  user_id: number
  username: string
  display_name?: string
  email?: string
  status: number
  created_at: number
  relation_status: string
  inviter_reward: number
  invitee_reward: number
  reward_status: string
  reward_source: string
  issued_at: number
}

export interface InviteRewardLogItem {
  id: string
  receiver_user_id: number
  receiver_username: string
  receiver_role: string
  reward_type: string
  reward_amount: number
  status: string
  source: string
  related_user_id: number
  related_username: string
  created_at: number
  issued_at: number
}

export interface InviteDetail {
  user: InviteUserBrief
  summary: InviteSummary
  inviter?: InviteUserBrief | null
  invitees: InviteeItem[]
  reward_logs: InviteRewardLogItem[]
}

export interface AffiliateTransferRequest {
  quota: number
}


export interface InviteConsumptionSummary {
  invitee_count: number
  active_invitee_count: number
  total_requests: number
  total_tokens: number
  total_quota: number
  total_amount_display: string
  last_used_at: number
}

export interface InviteConsumptionItem {
  user_id: number
  username: string
  display_name?: string
  status: number
  created_at: number
  request_count: number
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  used_quota: number
  used_amount_display: string
  last_used_at: number
  usage_status: 'active' | 'inactive' | 'silent' | 'unused' | string
}

export interface InviteConsumptionPagination {
  page: number
  page_size: number
  total: number
}

export interface InviteConsumptionOverview {
  summary: InviteConsumptionSummary
  items: InviteConsumptionItem[]
  pagination: InviteConsumptionPagination
}
