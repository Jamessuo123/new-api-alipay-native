package common

func GetTrustQuota() int {
	return int(10 * QuotaPerUnit)
}

// InviteRewardConfigToQuota converts invite reward option values to internal quota.
// Admin settings such as QuotaForNewUser/QuotaForInviter/QuotaForInvitee are
// entered and displayed as dollar quota units: value 1 means "$1 额度". Runtime
// balances store internal quota, so reward issuance must multiply by QuotaPerUnit.
func InviteRewardConfigToQuota(value int) int {
	if value <= 0 {
		return 0
	}
	quota := int(float64(value) * QuotaPerUnit)
	if quota < 0 {
		return 0
	}
	return quota
}
