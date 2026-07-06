package controller

import (
    "fmt"
    "math"
    "net/http"
    "time"

    "github.com/gin-gonic/gin"

    "github.com/QuantumNous/new-api/model"
)

type publicPassiveSummaryRow struct {
    Total      int64   `json:"total" gorm:"column:total"`
    AvgUseTime float64 `json:"avg_use_time" gorm:"column:avg_use_time"`
}

type publicPassiveModelRow struct {
    ModelName  string  `json:"model_name" gorm:"column:model_name"`
    Total      int64   `json:"total" gorm:"column:total"`
    AvgUseTime float64 `json:"avg_use_time" gorm:"column:avg_use_time"`
}

type publicPassiveChannelRow struct {
    ChannelID   int     `json:"channel_id" gorm:"column:channel_id"`
    ChannelName string  `json:"channel_name" gorm:"column:channel_name"`
    Total       int64   `json:"total" gorm:"column:total"`
    AvgUseTime  float64 `json:"avg_use_time" gorm:"column:avg_use_time"`
}

func publicRound2(v float64) float64 {
    if math.IsNaN(v) || math.IsInf(v, 0) {
        return 0
    }
    return math.Round(v*100) / 100
}

// GetPublicApiStatus returns passive platform status from existing logs only.
// It does not call any upstream provider, does not test models/channels, and does not create billable requests.
func GetPublicApiStatus(c *gin.Context) {
    now := time.Now()
    windowMinutes := 15
    since := now.Add(-time.Duration(windowMinutes) * time.Minute).Unix()

    queryErrors := make([]string, 0)

    dbOK := true
    var ping int
    if err := model.DB.Raw("SELECT 1").Scan(&ping).Error; err != nil {
        dbOK = false
        queryErrors = append(queryErrors, fmt.Sprintf("database ping failed: %v", err))
    }

    var summary publicPassiveSummaryRow
    if err := model.DB.Raw(`
        SELECT COUNT(1) AS total, COALESCE(AVG(use_time), 0) AS avg_use_time
        FROM logs
        WHERE created_at >= ?
    `, since).Scan(&summary).Error; err != nil {
        queryErrors = append(queryErrors, fmt.Sprintf("summary query failed: %v", err))
    }

    var errorCount int64
    if err := model.DB.Raw(`
        SELECT COUNT(1)
        FROM logs
        WHERE created_at >= ?
          AND (
            LOWER(COALESCE(content, '')) LIKE '%error%'
            OR LOWER(COALESCE(content, '')) LIKE '%fail%'
            OR LOWER(COALESCE(content, '')) LIKE '%invalid%'
            OR LOWER(COALESCE(content, '')) LIKE '%timeout%'
            OR LOWER(COALESCE(content, '')) LIKE '%panic%'
          )
    `, since).Scan(&errorCount).Error; err != nil {
        queryErrors = append(queryErrors, fmt.Sprintf("error-rate query failed: %v", err))
    }

    models := make([]publicPassiveModelRow, 0)
    if err := model.DB.Raw(`
        SELECT COALESCE(model_name, '') AS model_name,
               COUNT(1) AS total,
               COALESCE(AVG(use_time), 0) AS avg_use_time
        FROM logs
        WHERE created_at >= ?
          AND COALESCE(model_name, '') <> ''
        GROUP BY model_name
        ORDER BY total DESC
        LIMIT 10
    `, since).Scan(&models).Error; err != nil {
        queryErrors = append(queryErrors, fmt.Sprintf("model query failed: %v", err))
    }

    channels := make([]publicPassiveChannelRow, 0)
    if err := model.DB.Raw(`
        SELECT l.channel_id AS channel_id,
               COALESCE(c.name, '') AS channel_name,
               COUNT(1) AS total,
               COALESCE(AVG(l.use_time), 0) AS avg_use_time
        FROM logs l
        LEFT JOIN channels c ON c.id = l.channel_id
        WHERE l.created_at >= ?
          AND l.channel_id > 0
        GROUP BY l.channel_id, c.name
        ORDER BY total DESC
        LIMIT 10
    `, since).Scan(&channels).Error; err != nil {
        queryErrors = append(queryErrors, fmt.Sprintf("channel query failed: %v", err))
    }

    for i := range models {
        models[i].AvgUseTime = publicRound2(models[i].AvgUseTime)
    }
    for i := range channels {
        channels[i].AvgUseTime = publicRound2(channels[i].AvgUseTime)
    }

    errorRate := 0.0
    successRate := 100.0
    if summary.Total > 0 {
        errorRate = float64(errorCount) * 100 / float64(summary.Total)
        successRate = 100 - errorRate
        if successRate < 0 {
            successRate = 0
        }
    }

    platformStatus := "operational"
    if !dbOK || len(queryErrors) > 0 {
        platformStatus = "degraded"
    }
    if summary.Total > 0 && errorRate >= 20 {
        platformStatus = "degraded"
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data": gin.H{
            "source": "passive_logs_only",
            "note": "Passive status only: no upstream provider or model probing is performed.",
            "generated_at": now.Format(time.RFC3339),
            "window_minutes": windowMinutes,
            "platform_status": platformStatus,
            "database_status": map[bool]string{true: "operational", false: "degraded"}[dbOK],
            "recent_requests": summary.Total,
            "recent_errors": errorCount,
            "success_rate": publicRound2(successRate),
            "error_rate": publicRound2(errorRate),
            "avg_latency_seconds": publicRound2(summary.AvgUseTime),
            "models": models,
            "channels": channels,
            "query_errors": queryErrors,
        },
    })
}
