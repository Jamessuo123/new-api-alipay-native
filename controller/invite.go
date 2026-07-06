package controller

import (
	"fmt"
	"net/http"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
)

type InviteRewardConfigResponse struct {
	Enabled              bool   `json:"enabled"`
	NewUserQuota         int    `json:"new_user_quota"`
	InviterReward        int    `json:"inviter_reward"`
	InviteeReward        int    `json:"invitee_reward"`
	NewUserQuotaDisplay  string `json:"new_user_quota_display"`
	InviterRewardDisplay string `json:"inviter_reward_display"`
	InviteeRewardDisplay string `json:"invitee_reward_display"`
	UnitLabel            string `json:"unit_label"`
	Source               string `json:"source"`
}

// GetInviteRewardConfig exposes only the public invite-reward values that the
// landing page needs. It intentionally does not expose the full option map.

func formatInviteRewardConfigDisplay(value int) string {
	if value <= 0 {
		return "$0 额度"
	}
	return fmt.Sprintf("$%d 额度", value)
}

func GetInviteRewardConfig(c *gin.Context) {
	data := InviteRewardConfigResponse{
		Enabled:              common.QuotaForNewUser > 0 || common.QuotaForInviter > 0 || common.QuotaForInvitee > 0,
		NewUserQuota:         common.QuotaForNewUser,
		InviterReward:        common.QuotaForInviter,
		InviteeReward:        common.QuotaForInvitee,
		NewUserQuotaDisplay:  formatInviteRewardConfigDisplay(common.QuotaForNewUser),
		InviterRewardDisplay: formatInviteRewardConfigDisplay(common.QuotaForInviter),
		InviteeRewardDisplay: formatInviteRewardConfigDisplay(common.QuotaForInvitee),
		UnitLabel:            "平台额度",
		Source:               "quota_settings",
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    data,
	})
}
