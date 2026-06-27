package doubao

var ModelList = []string{
	"doubao-seedance-1-0-pro-250528",
	"doubao-seedance-1-0-lite-t2v",
	"doubao-seedance-1-0-lite-i2v",
	"doubao-seedance-1-5-pro-251215",
	"doubao-seedance-2-0-260128",
	"doubao-seedance-2-0-fast-260128",

	"seedance-2.0-fast-480p",
	"seedance-2.0-fast-720p",
	"seedance-2.0-480p",
	"seedance-2.0-720p",
	"seedance-2.0-1080p",
	"seedance-2.0-4k",}

var ChannelName = "doubao-video"

// videoInputRatioMap 视频输入折扣比率（含视频单价 / 不含视频单价）。
// 管理员应将 ModelRatio 设置为"不含视频"的较高费率，
// 系统在检测到视频输入时自动乘以此折扣。
var videoInputRatioMap = map[string]float64{
	"doubao-seedance-2-0-260128":      28.0 / 46.0, // ~0.6087
	"doubao-seedance-2-0-fast-260128": 22.0 / 37.0, // ~0.5946
}

func GetVideoInputRatio(modelName string) (float64, bool) {
	if spec, ok := ResolveSeedanceResolutionPricingAlias(modelName); ok {
		return GetSeedanceVideoInputRatio(modelName, spec.Resolution)
	}
	return GetSeedanceVideoInputRatio(modelName, "")
}

// FEIXIANG_SEEDANCE_FAST_PRICING_V1
func ResolveSeedanceFastPricingAlias(modelName string) (upstreamModel string, resolution string, ok bool) {
	spec, ok := ResolveSeedanceResolutionPricingAlias(modelName)
	if !ok || spec.Family != FeiXiangSeedanceFamilyFast {
		return "", "", false
	}
	return spec.UpstreamModel, spec.Resolution, true
}

func NormalizeSeedanceFastPricingModelName(modelName string) string {
	return NormalizeSeedanceResolutionPricingModelName(modelName)
}

func IsSeedanceFastPricingModel(modelName string) bool {
	return IsSeedanceFastResolutionPricingModel(modelName)
}

// FEIXIANG_SEEDANCE_RESOLUTION_PRICING_V1
const (
	FeiXiangSeedanceFastModelID     = "doubao-seedance-2-0-fast-260128"
	FeiXiangSeedanceStandardModelID = "doubao-seedance-2-0-260128"
	FeiXiangSeedanceFamilyFast      = "fast"
	FeiXiangSeedanceFamilyStandard  = "standard"
)

type FeiXiangSeedanceResolutionPricingSpec struct {
	UpstreamModel    string
	Resolution       string
	Family           string
	NonVideoInputRMB float64
	VideoInputRMB    float64
}

var feiXiangSeedanceResolutionPricingAliases = map[string]FeiXiangSeedanceResolutionPricingSpec{
	"seedance-2.0-fast-480p": {
		UpstreamModel:    FeiXiangSeedanceFastModelID,
		Resolution:       "480p",
		Family:           FeiXiangSeedanceFamilyFast,
		NonVideoInputRMB: 37.0,
		VideoInputRMB:    22.0,
	},
	"seedance-2.0-fast-720p": {
		UpstreamModel:    FeiXiangSeedanceFastModelID,
		Resolution:       "720p",
		Family:           FeiXiangSeedanceFamilyFast,
		NonVideoInputRMB: 37.0,
		VideoInputRMB:    22.0,
	},
	"seedance-2.0-480p": {
		UpstreamModel:    FeiXiangSeedanceStandardModelID,
		Resolution:       "480p",
		Family:           FeiXiangSeedanceFamilyStandard,
		NonVideoInputRMB: 46.0,
		VideoInputRMB:    28.0,
	},
	"seedance-2.0-720p": {
		UpstreamModel:    FeiXiangSeedanceStandardModelID,
		Resolution:       "720p",
		Family:           FeiXiangSeedanceFamilyStandard,
		NonVideoInputRMB: 46.0,
		VideoInputRMB:    28.0,
	},
	"seedance-2.0-1080p": {
		UpstreamModel:    FeiXiangSeedanceStandardModelID,
		Resolution:       "1080p",
		Family:           FeiXiangSeedanceFamilyStandard,
		NonVideoInputRMB: 51.0,
		VideoInputRMB:    31.0,
	},
	"seedance-2.0-4k": {
		UpstreamModel:    FeiXiangSeedanceStandardModelID,
		Resolution:       "4k",
		Family:           FeiXiangSeedanceFamilyStandard,
		NonVideoInputRMB: 26.0,
		VideoInputRMB:    16.0,
	},
}

var feiXiangSeedanceRawResolutionPricing = map[string]map[string]FeiXiangSeedanceResolutionPricingSpec{
	FeiXiangSeedanceFastModelID: {
		"480p": {UpstreamModel: FeiXiangSeedanceFastModelID, Resolution: "480p", Family: FeiXiangSeedanceFamilyFast, NonVideoInputRMB: 37.0, VideoInputRMB: 22.0},
		"720p": {UpstreamModel: FeiXiangSeedanceFastModelID, Resolution: "720p", Family: FeiXiangSeedanceFamilyFast, NonVideoInputRMB: 37.0, VideoInputRMB: 22.0},
	},
	FeiXiangSeedanceStandardModelID: {
		"480p":  {UpstreamModel: FeiXiangSeedanceStandardModelID, Resolution: "480p", Family: FeiXiangSeedanceFamilyStandard, NonVideoInputRMB: 46.0, VideoInputRMB: 28.0},
		"720p":  {UpstreamModel: FeiXiangSeedanceStandardModelID, Resolution: "720p", Family: FeiXiangSeedanceFamilyStandard, NonVideoInputRMB: 46.0, VideoInputRMB: 28.0},
		"1080p": {UpstreamModel: FeiXiangSeedanceStandardModelID, Resolution: "1080p", Family: FeiXiangSeedanceFamilyStandard, NonVideoInputRMB: 51.0, VideoInputRMB: 31.0},
		"4k":    {UpstreamModel: FeiXiangSeedanceStandardModelID, Resolution: "4k", Family: FeiXiangSeedanceFamilyStandard, NonVideoInputRMB: 26.0, VideoInputRMB: 16.0},
	},
}

func ResolveSeedanceResolutionPricingAlias(modelName string) (FeiXiangSeedanceResolutionPricingSpec, bool) {
	spec, ok := feiXiangSeedanceResolutionPricingAliases[modelName]
	return spec, ok
}

func NormalizeSeedanceResolutionPricingModelName(modelName string) string {
	if spec, ok := ResolveSeedanceResolutionPricingAlias(modelName); ok {
		return spec.UpstreamModel
	}
	return modelName
}

func IsSeedanceResolutionPricingModel(modelName string) bool {
	modelName = NormalizeSeedanceResolutionPricingModelName(modelName)
	return modelName == FeiXiangSeedanceFastModelID || modelName == FeiXiangSeedanceStandardModelID
}

func IsSeedanceFastResolutionPricingModel(modelName string) bool {
	modelName = NormalizeSeedanceResolutionPricingModelName(modelName)
	return modelName == FeiXiangSeedanceFastModelID
}

func IsSeedanceStandardResolutionPricingModel(modelName string) bool {
	modelName = NormalizeSeedanceResolutionPricingModelName(modelName)
	return modelName == FeiXiangSeedanceStandardModelID
}

func GetSeedanceResolutionPricingSpec(modelName string, resolution string) (FeiXiangSeedanceResolutionPricingSpec, bool) {
	if spec, ok := ResolveSeedanceResolutionPricingAlias(modelName); ok {
		return spec, true
	}
	modelName = NormalizeSeedanceResolutionPricingModelName(modelName)
	if resolution == "" {
		resolution = "720p"
	}
	byResolution, ok := feiXiangSeedanceRawResolutionPricing[modelName]
	if !ok {
		return FeiXiangSeedanceResolutionPricingSpec{}, false
	}
	spec, ok := byResolution[resolution]
	return spec, ok
}

func GetSeedanceVideoInputRatio(modelName string, resolution string) (float64, bool) {
	spec, ok := GetSeedanceResolutionPricingSpec(modelName, resolution)
	if !ok || spec.NonVideoInputRMB <= 0 || spec.VideoInputRMB <= 0 {
		return 0, false
	}
	return spec.VideoInputRMB / spec.NonVideoInputRMB, true
}

// GetSeedanceResolutionMultiplier returns a multiplier for raw upstream-model calls.
// Alias models should have their own base price configured per resolution, so aliases return 1.
func GetSeedanceResolutionMultiplier(modelName string, resolution string) (float64, bool) {
	if _, ok := ResolveSeedanceResolutionPricingAlias(modelName); ok {
		return 1.0, true
	}
	normalized := NormalizeSeedanceResolutionPricingModelName(modelName)
	spec, ok := GetSeedanceResolutionPricingSpec(normalized, resolution)
	if !ok || spec.NonVideoInputRMB <= 0 {
		return 0, false
	}
	switch normalized {
	case FeiXiangSeedanceFastModelID:
		return spec.NonVideoInputRMB / 37.0, true
	case FeiXiangSeedanceStandardModelID:
		return spec.NonVideoInputRMB / 46.0, true
	default:
		return 1.0, true
	}
}

// Compatibility helpers for feixiang-seedance-fast-pricing-v1 callers.
