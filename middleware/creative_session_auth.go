package middleware

import (
	"net/http"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

// CreativeSessionAuth authenticates Creative browser requests directly from
// the existing NewAPI login session. It does not fall back to API token auth
// and it does not require callers to provide New-Api-User manually.
func CreativeSessionAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)

		id, idOK := session.Get("id").(int)
		username, usernameOK := session.Get("username").(string)
		role, roleOK := session.Get("role").(int)
		status, statusOK := session.Get("status").(int)

		if !idOK || id <= 0 || !usernameOK || !roleOK || !statusOK {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": common.TranslateMessage(c, i18n.MsgAuthNotLoggedIn),
			})
			c.Abort()
			return
		}

		if status == common.UserStatusDisabled {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": common.TranslateMessage(c, i18n.MsgAuthUserBanned),
			})
			c.Abort()
			return
		}

		if role < common.RoleCommonUser || !validUserInfo(username, role) {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": common.TranslateMessage(c, i18n.MsgAuthUserInfoInvalid),
			})
			c.Abort()
			return
		}

		group, _ := session.Get("group").(string)
		if group == "" {
			group = "default"
		}

		c.Header("Auth-Version", "creative-session-v1")
		c.Set("username", username)
		c.Set("role", role)
		c.Set("id", id)
		c.Set("group", group)
		c.Set("user_group", group)
		c.Set("use_access_token", false)
		c.Next()
	}
}
