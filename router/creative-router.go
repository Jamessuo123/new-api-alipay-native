package router

import (
	"github.com/QuantumNous/new-api/controller"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/gin-gonic/gin"
)

// SetCreativeRouter registers the P2 read-only Creative API surface.
// It deliberately performs no migrations and exposes no write routes.
func SetCreativeRouter(apiRouter *gin.RouterGroup) {
	creativeRouter := apiRouter.Group("/creative")
	creativeRouter.Use(middleware.CreativeSessionAuth())
	{
		creativeRouter.GET("/capabilities", controller.GetCreativeCapabilities)
		creativeRouter.GET("/tasks", controller.GetCreativeTasks)
		creativeRouter.GET("/generations/self", controller.GetCreativeTasks)
		creativeRouter.GET("/tasks/:id", controller.GetCreativeTask)
		creativeRouter.GET("/assets", controller.GetCreativeAssets)
		creativeRouter.GET("/assets/self", controller.GetCreativeAssets)
		creativeRouter.GET("/assets/:id", controller.GetCreativeAsset)
		creativeRouter.GET("/projects", controller.GetCreativeProjects)
		creativeRouter.GET("/projects/:id", controller.GetCreativeProject)
		creativeRouter.GET("/preferences", controller.GetCreativePreferences)
	}
}
