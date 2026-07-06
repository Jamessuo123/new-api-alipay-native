package model

import (
	"errors"
	"fmt"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

type AdminUserInviteInfo struct {
	InviterUserID        int    `json:"inviter_user_id"`
	InviterUsername      string `json:"inviter_username"`
	InvitedCount         int    `json:"invited_count"`
	InviterRewardTotal   int    `json:"inviter_reward_total"`
	InviterRewardBalance int    `json:"inviter_reward_balance"`
	InviteeRewardTotal   int    `json:"invitee_reward_total"`
	RewardTotal          int    `json:"reward_total"`
	AbnormalCount        int    `json:"abnormal_count"`
	LastInvitedAt        int64  `json:"last_invited_at"`
	RewardSource         string `json:"reward_source"`
}

type AdminInviteUserBrief struct {
	ID          int    `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	Email       string `json:"email"`
	Status      int    `json:"status"`
	Quota       int    `json:"quota"`
	CreatedAt   int64  `json:"created_at"`
}

type AdminInviteeItem struct {
	UserID         int    `json:"user_id"`
	Username       string `json:"username"`
	DisplayName    string `json:"display_name"`
	Email          string `json:"email"`
	Status         int    `json:"status"`
	CreatedAt      int64  `json:"created_at"`
	RelationStatus string `json:"relation_status"`
	InviterReward  int    `json:"inviter_reward"`
	InviteeReward  int    `json:"invitee_reward"`
	RewardStatus   string `json:"reward_status"`
	RewardSource   string `json:"reward_source"`
	IssuedAt       int64  `json:"issued_at"`
}

type AdminInviteRewardLogItem struct {
	ID               string `json:"id"`
	ReceiverUserID   int    `json:"receiver_user_id"`
	ReceiverUsername string `json:"receiver_username"`
	ReceiverRole     string `json:"receiver_role"`
	RewardType       string `json:"reward_type"`
	RewardAmount     int    `json:"reward_amount"`
	Status           string `json:"status"`
	Source           string `json:"source"`
	RelatedUserID    int    `json:"related_user_id"`
	RelatedUsername  string `json:"related_username"`
	CreatedAt        int64  `json:"created_at"`
	IssuedAt         int64  `json:"issued_at"`
}

type AdminUserInviteDetail struct {
	User       AdminInviteUserBrief       `json:"user"`
	Summary    AdminUserInviteInfo        `json:"summary"`
	Inviter    *AdminInviteUserBrief      `json:"inviter"`
	Invitees   []AdminInviteeItem         `json:"invitees"`
	RewardLogs []AdminInviteRewardLogItem `json:"reward_logs"`
}

type adminInviteAggregateRow struct {
	InviterID     int   `gorm:"column:inviter_id"`
	Count         int64 `gorm:"column:count"`
	LastInvitedAt int64 `gorm:"column:last_invited_at"`
}

func makeAdminInviteUserBrief(user User) AdminInviteUserBrief {
	return AdminInviteUserBrief{
		ID:          user.Id,
		Username:    user.Username,
		DisplayName: user.DisplayName,
		Email:       user.Email,
		Status:      user.Status,
		Quota:       user.Quota,
		CreatedAt:   user.CreatedAt,
	}
}

func collectAdminInviteUserIDs(users []*User) ([]int, []int) {
	userIDSet := map[int]bool{}
	inviterIDSet := map[int]bool{}

	for _, user := range users {
		if user == nil || user.Id == 0 {
			continue
		}
		userIDSet[user.Id] = true
		if user.InviterId > 0 {
			inviterIDSet[user.InviterId] = true
		}
	}

	userIDs := make([]int, 0, len(userIDSet))
	for id := range userIDSet {
		userIDs = append(userIDs, id)
	}

	inviterIDs := make([]int, 0, len(inviterIDSet))
	for id := range inviterIDSet {
		inviterIDs = append(inviterIDs, id)
	}

	return userIDs, inviterIDs
}

func loadAdminInviteUserNames(ids []int) map[int]string {
	result := map[int]string{}
	if len(ids) == 0 {
		return result
	}

	var users []User
	if err := DB.Unscoped().Model(&User{}).Select("id, username").Where("id IN ?", ids).Find(&users).Error; err != nil {
		common.SysLog(fmt.Sprintf("failed to load invite user names: %v", err))
		return result
	}

	for _, user := range users {
		result[user.Id] = user.Username
	}

	return result
}

func loadAdminInviteAggregates(userIDs []int) map[int]adminInviteAggregateRow {
	result := map[int]adminInviteAggregateRow{}
	if len(userIDs) == 0 {
		return result
	}

	var rows []adminInviteAggregateRow
	err := DB.Unscoped().
		Model(&User{}).
		Select("inviter_id, COUNT(*) as count, COALESCE(MAX(created_at), 0) as last_invited_at").
		Where("inviter_id IN ?", userIDs).
		Group("inviter_id").
		Scan(&rows).Error
	if err != nil {
		common.SysLog(fmt.Sprintf("failed to load invite aggregates: %v", err))
		return result
	}

	for _, row := range rows {
		result[row.InviterID] = row
	}

	return result
}

func legacyInviteeRewardForUser(user *User) int {
	if user == nil || user.InviterId <= 0 {
		return 0
	}
	if common.QuotaForInvitee > 0 {
		return common.InviteRewardConfigToQuota(common.QuotaForInvitee)
	}
	return 0
}

func legacyInviterRewardPerInvite(inviter *User, inviteeCount int) int {
	if common.QuotaForInviter > 0 {
		return common.InviteRewardConfigToQuota(common.QuotaForInviter)
	}
	if inviter != nil && inviter.AffHistoryQuota > 0 && inviteeCount > 0 {
		return inviter.AffHistoryQuota / inviteeCount
	}
	return 0
}

func buildAdminInviteInfo(user *User, inviterNames map[int]string, aggregates map[int]adminInviteAggregateRow) *AdminUserInviteInfo {
	if user == nil {
		return nil
	}

	aggregate := aggregates[user.Id]
	invitedCount := int(aggregate.Count)
	if user.AffCount > invitedCount {
		invitedCount = user.AffCount
	}

	info := &AdminUserInviteInfo{
		InviterUserID:        user.InviterId,
		InviterUsername:      inviterNames[user.InviterId],
		InvitedCount:         invitedCount,
		InviterRewardTotal:   user.AffHistoryQuota,
		InviterRewardBalance: user.AffQuota,
		InviteeRewardTotal:   legacyInviteeRewardForUser(user),
		AbnormalCount:        0,
		LastInvitedAt:        aggregate.LastInvitedAt,
		RewardSource:         "legacy_user_fields",
	}
	info.RewardTotal = info.InviterRewardTotal + info.InviteeRewardTotal
	return info
}

func AttachAdminInviteInfo(users []*User) {
	if len(users) == 0 {
		return
	}

	userIDs, inviterIDs := collectAdminInviteUserIDs(users)
	inviterNames := loadAdminInviteUserNames(inviterIDs)
	aggregates := loadAdminInviteAggregates(userIDs)

	for _, user := range users {
		if user == nil {
			continue
		}
		user.InviteInfo = buildAdminInviteInfo(user, inviterNames, aggregates)
	}
}

func GetAdminUserInviteDetail(id int) (*AdminUserInviteDetail, error) {
	if id == 0 {
		return nil, errors.New("id 为空！")
	}

	var user User
	if err := DB.Unscoped().Omit("password").First(&user, "id = ?", id).Error; err != nil {
		return nil, err
	}

	var invitees []User
	if err := DB.Unscoped().Omit("password").Where("inviter_id = ?", id).Order("id desc").Find(&invitees).Error; err != nil {
		return nil, err
	}

	var inviter *AdminInviteUserBrief
	if user.InviterId > 0 {
		var inviterUser User
		err := DB.Unscoped().Omit("password").First(&inviterUser, "id = ?", user.InviterId).Error
		if err == nil {
			brief := makeAdminInviteUserBrief(inviterUser)
			inviter = &brief
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
	}

	userIDs := []int{user.Id}
	inviterIDs := []int{}
	if user.InviterId > 0 {
		inviterIDs = append(inviterIDs, user.InviterId)
	}
	inviterNames := loadAdminInviteUserNames(inviterIDs)
	aggregates := loadAdminInviteAggregates(userIDs)
	summary := buildAdminInviteInfo(&user, inviterNames, aggregates)
	if summary == nil {
		summary = &AdminUserInviteInfo{RewardSource: "legacy_user_fields"}
	}

	inviterRewardPerInvite := legacyInviterRewardPerInvite(&user, len(invitees))

	items := make([]AdminInviteeItem, 0, len(invitees))
	rewardLogs := make([]AdminInviteRewardLogItem, 0, len(invitees)*2)

	for _, invitee := range invitees {
		inviteeReward := legacyInviteeRewardForUser(&invitee)
		item := AdminInviteeItem{
			UserID:         invitee.Id,
			Username:       invitee.Username,
			DisplayName:    invitee.DisplayName,
			Email:          invitee.Email,
			Status:         invitee.Status,
			CreatedAt:      invitee.CreatedAt,
			RelationStatus: "active",
			InviterReward:  inviterRewardPerInvite,
			InviteeReward:  inviteeReward,
			RewardStatus:   "issued_legacy",
			RewardSource:   "legacy_user_fields",
			IssuedAt:       invitee.CreatedAt,
		}
		items = append(items, item)

		if inviterRewardPerInvite > 0 {
			rewardLogs = append(rewardLogs, AdminInviteRewardLogItem{
				ID:               fmt.Sprintf("legacy-inviter-%d-%d", user.Id, invitee.Id),
				ReceiverUserID:   user.Id,
				ReceiverUsername: user.Username,
				ReceiverRole:     "inviter",
				RewardType:       "inviter_reward",
				RewardAmount:     inviterRewardPerInvite,
				Status:           "issued_legacy",
				Source:           "legacy_user_fields",
				RelatedUserID:    invitee.Id,
				RelatedUsername:  invitee.Username,
				CreatedAt:        invitee.CreatedAt,
				IssuedAt:         invitee.CreatedAt,
			})
		}

		if inviteeReward > 0 {
			rewardLogs = append(rewardLogs, AdminInviteRewardLogItem{
				ID:               fmt.Sprintf("legacy-invitee-%d-%d", user.Id, invitee.Id),
				ReceiverUserID:   invitee.Id,
				ReceiverUsername: invitee.Username,
				ReceiverRole:     "invitee",
				RewardType:       "invitee_reward",
				RewardAmount:     inviteeReward,
				Status:           "issued_legacy",
				Source:           "legacy_user_fields",
				RelatedUserID:    user.Id,
				RelatedUsername:  user.Username,
				CreatedAt:        invitee.CreatedAt,
				IssuedAt:         invitee.CreatedAt,
			})
		}
	}

	detail := &AdminUserInviteDetail{
		User:       makeAdminInviteUserBrief(user),
		Summary:    *summary,
		Inviter:    inviter,
		Invitees:   items,
		RewardLogs: rewardLogs,
	}

	return detail, nil
}
