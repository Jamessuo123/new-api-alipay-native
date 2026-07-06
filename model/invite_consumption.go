package model

import (
	"errors"
	"sort"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
)

type InviteConsumptionQuery struct {
	InviterUserID  int
	StartTimestamp int64
	EndTimestamp   int64
	Page           int
	PageSize       int
	Sort           string
}

type InviteConsumptionSummary struct {
	InviteeCount       int    `json:"invitee_count"`
	ActiveInviteeCount int    `json:"active_invitee_count"`
	TotalRequests      int64  `json:"total_requests"`
	TotalTokens        int64  `json:"total_tokens"`
	TotalQuota         int64  `json:"total_quota"`
	TotalAmountDisplay string `json:"total_amount_display"`
	LastUsedAt         int64  `json:"last_used_at"`
}

type InviteConsumptionItem struct {
	UserID            int    `json:"user_id"`
	Username          string `json:"username"`
	DisplayName       string `json:"display_name"`
	Status            int    `json:"status"`
	CreatedAt         int64  `json:"created_at"`
	RequestCount      int64  `json:"request_count"`
	PromptTokens      int64  `json:"prompt_tokens"`
	CompletionTokens  int64  `json:"completion_tokens"`
	TotalTokens       int64  `json:"total_tokens"`
	UsedQuota         int64  `json:"used_quota"`
	UsedAmountDisplay string `json:"used_amount_display"`
	LastUsedAt        int64  `json:"last_used_at"`
	UsageStatus       string `json:"usage_status"`
}

type InviteConsumptionPagination struct {
	Page     int `json:"page"`
	PageSize int `json:"page_size"`
	Total    int `json:"total"`
}

type InviteConsumptionOverview struct {
	Summary    InviteConsumptionSummary    `json:"summary"`
	Items      []InviteConsumptionItem     `json:"items"`
	Pagination InviteConsumptionPagination `json:"pagination"`
}

type inviteConsumptionAggregateRow struct {
	UserID           int   `gorm:"column:user_id"`
	RequestCount     int64 `gorm:"column:request_count"`
	UsedQuota        int64 `gorm:"column:used_quota"`
	PromptTokens     int64 `gorm:"column:prompt_tokens"`
	CompletionTokens int64 `gorm:"column:completion_tokens"`
	LastUsedAt       int64 `gorm:"column:last_used_at"`
}

func normalizeInviteConsumptionQuery(query InviteConsumptionQuery) InviteConsumptionQuery {
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 {
		query.PageSize = 20
	}
	if query.PageSize > 100 {
		query.PageSize = 100
	}
	query.Sort = strings.ToLower(strings.TrimSpace(query.Sort))
	if query.Sort == "" {
		query.Sort = "quota_desc"
	}
	if query.StartTimestamp > 0 && query.EndTimestamp > 0 && query.StartTimestamp > query.EndTimestamp {
		query.StartTimestamp, query.EndTimestamp = query.EndTimestamp, query.StartTimestamp
	}
	return query
}

func formatInviteConsumptionAmount(quota int64) string {
	if quota <= 0 {
		return logger.FormatQuota(0)
	}
	return logger.FormatQuota(int(quota))
}

func inviteConsumptionUsageStatus(requestCount int64, lastUsedAt int64, now int64) string {
	if requestCount <= 0 || lastUsedAt <= 0 {
		return "unused"
	}
	if lastUsedAt >= now-7*24*60*60 {
		return "active"
	}
	if lastUsedAt < now-30*24*60*60 {
		return "silent"
	}
	return "inactive"
}

func sortInviteConsumptionItems(items []InviteConsumptionItem, sortKey string) {
	sort.SliceStable(items, func(i, j int) bool {
		left := items[i]
		right := items[j]

		switch sortKey {
		case "request_desc", "requests_desc":
			if left.RequestCount != right.RequestCount {
				return left.RequestCount > right.RequestCount
			}
		case "last_used_desc":
			if left.LastUsedAt != right.LastUsedAt {
				return left.LastUsedAt > right.LastUsedAt
			}
		case "created_desc":
			if left.CreatedAt != right.CreatedAt {
				return left.CreatedAt > right.CreatedAt
			}
		default:
			if left.UsedQuota != right.UsedQuota {
				return left.UsedQuota > right.UsedQuota
			}
		}

		if left.LastUsedAt != right.LastUsedAt {
			return left.LastUsedAt > right.LastUsedAt
		}
		if left.CreatedAt != right.CreatedAt {
			return left.CreatedAt > right.CreatedAt
		}
		return left.UserID > right.UserID
	})
}

func pageInviteConsumptionItems(items []InviteConsumptionItem, page int, pageSize int) []InviteConsumptionItem {
	if len(items) == 0 {
		return []InviteConsumptionItem{}
	}
	start := (page - 1) * pageSize
	if start >= len(items) {
		return []InviteConsumptionItem{}
	}
	end := start + pageSize
	if end > len(items) {
		end = len(items)
	}
	return items[start:end]
}

func GetInviteConsumptionOverview(query InviteConsumptionQuery) (*InviteConsumptionOverview, error) {
	query = normalizeInviteConsumptionQuery(query)
	if query.InviterUserID <= 0 {
		return nil, errors.New("邀请人为空")
	}

	var invitees []User
	if err := DB.Unscoped().
		Model(&User{}).
		Select("id, username, display_name, status, created_at").
		Where("inviter_id = ?", query.InviterUserID).
		Order("id desc").
		Find(&invitees).Error; err != nil {
		return nil, err
	}

	ids := make([]int, 0, len(invitees))
	for _, invitee := range invitees {
		if invitee.Id > 0 {
			ids = append(ids, invitee.Id)
		}
	}

	aggregates := map[int]inviteConsumptionAggregateRow{}
	if len(ids) > 0 {
		var rows []inviteConsumptionAggregateRow
		tx := LOG_DB.Model(&Log{}).
			Select("user_id, COUNT(*) AS request_count, COALESCE(SUM(quota), 0) AS used_quota, COALESCE(SUM(prompt_tokens), 0) AS prompt_tokens, COALESCE(SUM(completion_tokens), 0) AS completion_tokens, COALESCE(MAX(created_at), 0) AS last_used_at").
			Where("user_id IN ? AND type = ?", ids, LogTypeConsume)
		if query.StartTimestamp > 0 {
			tx = tx.Where("created_at >= ?", query.StartTimestamp)
		}
		if query.EndTimestamp > 0 {
			tx = tx.Where("created_at <= ?", query.EndTimestamp)
		}
		if err := tx.Group("user_id").Scan(&rows).Error; err != nil {
			return nil, err
		}
		for _, row := range rows {
			aggregates[row.UserID] = row
		}
	}

	now := common.GetTimestamp()
	items := make([]InviteConsumptionItem, 0, len(invitees))
	summary := InviteConsumptionSummary{InviteeCount: len(invitees), LastUsedAt: 0}

	for _, invitee := range invitees {
		row := aggregates[invitee.Id]
		totalTokens := row.PromptTokens + row.CompletionTokens
		item := InviteConsumptionItem{
			UserID:            invitee.Id,
			Username:          invitee.Username,
			DisplayName:       invitee.DisplayName,
			Status:            invitee.Status,
			CreatedAt:         invitee.CreatedAt,
			RequestCount:      row.RequestCount,
			PromptTokens:      row.PromptTokens,
			CompletionTokens:  row.CompletionTokens,
			TotalTokens:       totalTokens,
			UsedQuota:         row.UsedQuota,
			UsedAmountDisplay: formatInviteConsumptionAmount(row.UsedQuota),
			LastUsedAt:        row.LastUsedAt,
			UsageStatus:       inviteConsumptionUsageStatus(row.RequestCount, row.LastUsedAt, now),
		}
		items = append(items, item)

		if row.RequestCount > 0 {
			summary.ActiveInviteeCount++
		}
		summary.TotalRequests += row.RequestCount
		summary.TotalTokens += totalTokens
		summary.TotalQuota += row.UsedQuota
		if row.LastUsedAt > summary.LastUsedAt {
			summary.LastUsedAt = row.LastUsedAt
		}
	}
	summary.TotalAmountDisplay = formatInviteConsumptionAmount(summary.TotalQuota)

	sortInviteConsumptionItems(items, query.Sort)
	total := len(items)
	pagedItems := pageInviteConsumptionItems(items, query.Page, query.PageSize)

	return &InviteConsumptionOverview{
		Summary: summary,
		Items:   pagedItems,
		Pagination: InviteConsumptionPagination{
			Page:     query.Page,
			PageSize: query.PageSize,
			Total:    total,
		},
	}, nil
}
