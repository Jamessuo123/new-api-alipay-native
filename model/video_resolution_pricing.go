package model

import (
	"encoding/json"
	"fmt"
	"math"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
)

const VideoResolutionPricingOptionKey = "VideoResolutionPricing"

const (
	VideoResolutionInputModeNoVideoInput   = "no_video_input"
	VideoResolutionInputModeWithVideoInput = "with_video_input"
)

type VideoResolutionPricingEntry struct {
	NoVideoInput   *float64 `json:"no_video_input,omitempty"`
	WithVideoInput *float64 `json:"with_video_input,omitempty"`
	Completion     *float64 `json:"completion,omitempty"`
}

type VideoResolutionPricingTable map[string]map[string]VideoResolutionPricingEntry

type VideoResolutionPricingResolveResult struct {
	ModelName           string   `json:"model_name"`
	BaseModel           string   `json:"base_model"`
	Resolution          string   `json:"resolution"`
	InputMode           string   `json:"input_mode"`
	HasVideoInput       bool     `json:"has_video_input"`
	NoVideoInputPrice   *float64 `json:"no_video_input_price,omitempty"`
	WithVideoInputPrice *float64 `json:"with_video_input_price,omitempty"`
	CompletionPrice     *float64 `json:"completion_price,omitempty"`
	MatchedPrice        *float64 `json:"matched_price,omitempty"`
	Matched             bool     `json:"matched"`
	Source              string   `json:"source,omitempty"`
}

func DefaultVideoResolutionPricingJSONString() string {
	return "{}"
}

func ValidateVideoResolutionPricingJSONString(raw string) error {
	_, err := parseVideoResolutionPricingTable(raw)
	return err
}

func ResolveVideoResolutionPricing(modelName string, requestBody any) VideoResolutionPricingResolveResult {
	baseModel, modelResolution := ParseVideoPricingModelAndResolution(modelName)
	requestResolution := ExtractVideoResolutionFromRequest(requestBody)
	resolution := requestResolution
	if resolution == "" {
		resolution = modelResolution
	}

	hasVideoInput := HasVideoInputPayload(requestBody)
	inputMode := VideoResolutionInputModeNoVideoInput
	if hasVideoInput {
		inputMode = VideoResolutionInputModeWithVideoInput
	}

	result := VideoResolutionPricingResolveResult{
		ModelName:     strings.TrimSpace(modelName),
		BaseModel:     baseModel,
		Resolution:    resolution,
		InputMode:     inputMode,
		HasVideoInput: hasVideoInput,
	}

	table := GetVideoResolutionPricingTable()
	entry, ok := lookupVideoResolutionPricingEntry(table, strings.TrimSpace(modelName), baseModel, resolution)
	if !ok {
		return result
	}

	result.Source = VideoResolutionPricingOptionKey
	result.NoVideoInputPrice = cloneFloatPtr(entry.NoVideoInput)
	result.WithVideoInputPrice = cloneFloatPtr(entry.WithVideoInput)
	result.CompletionPrice = cloneFloatPtr(entry.Completion)
	if inputMode == VideoResolutionInputModeWithVideoInput {
		result.MatchedPrice = cloneFloatPtr(entry.WithVideoInput)
	} else {
		result.MatchedPrice = cloneFloatPtr(entry.NoVideoInput)
	}
	result.Matched = result.MatchedPrice != nil
	return result
}

func ResolveVideoResolutionPricingFromJSON(modelName string, requestBody []byte) VideoResolutionPricingResolveResult {
	var parsed any
	if len(strings.TrimSpace(string(requestBody))) > 0 {
		decoder := json.NewDecoder(strings.NewReader(string(requestBody)))
		decoder.UseNumber()
		_ = decoder.Decode(&parsed)
	}
	return ResolveVideoResolutionPricing(modelName, parsed)
}

func GetVideoResolutionPricingTable() VideoResolutionPricingTable {
	common.OptionMapRWMutex.RLock()
	raw := common.OptionMap[VideoResolutionPricingOptionKey]
	common.OptionMapRWMutex.RUnlock()

	table, err := parseVideoResolutionPricingTable(raw)
	if err != nil || len(table) == 0 {
		return VideoResolutionPricingTable{}
	}
	return table
}

func ParseVideoPricingModelAndResolution(modelName string) (baseModel string, resolution string) {
	original := strings.TrimSpace(modelName)
	lower := strings.ToLower(original)
	if original == "" {
		return "", ""
	}

	resolution = NormalizeVideoResolution(lower)
	if resolution == "" {
		resolution = normalizeVideoResolutionFromModelSuffix(lower)
	}

	base := original
	if resolution != "" {
		base = trimVideoResolutionSuffix(original, resolution)
	}
	base = normalizeSeedanceBaseModel(base)
	return base, resolution
}

func ExtractVideoResolutionFromRequest(requestBody any) string {
	parsed := normalizeRequestBodyAny(requestBody)
	if parsed == nil {
		return ""
	}

	if resolution := extractResolutionFromAny(parsed); resolution != "" {
		return resolution
	}
	return ""
}

func HasVideoInputPayload(requestBody any) bool {
	parsed := normalizeRequestBodyAny(requestBody)
	if parsed == nil {
		return false
	}
	return hasVideoInputPayloadAny(parsed)
}

func parseVideoResolutionPricingTable(raw string) (VideoResolutionPricingTable, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" || raw == "null" {
		return VideoResolutionPricingTable{}, nil
	}

	decoder := json.NewDecoder(strings.NewReader(raw))
	decoder.UseNumber()
	var decoded map[string]map[string]map[string]any
	if err := decoder.Decode(&decoded); err != nil {
		return nil, fmt.Errorf("invalid %s json: %w", VideoResolutionPricingOptionKey, err)
	}

	table := make(VideoResolutionPricingTable, len(decoded))
	for modelName, byResolution := range decoded {
		modelName = strings.TrimSpace(modelName)
		if modelName == "" {
			return nil, fmt.Errorf("%s contains empty model key", VideoResolutionPricingOptionKey)
		}
		for resolutionKey, rawEntry := range byResolution {
			resolution := NormalizeVideoResolution(resolutionKey)
			if resolution == "" {
				return nil, fmt.Errorf("%s.%s contains invalid resolution %q", VideoResolutionPricingOptionKey, modelName, resolutionKey)
			}
			entry, err := parseVideoResolutionPricingEntry(rawEntry)
			if err != nil {
				return nil, fmt.Errorf("%s.%s.%s: %w", VideoResolutionPricingOptionKey, modelName, resolution, err)
			}
			if table[modelName] == nil {
				table[modelName] = make(map[string]VideoResolutionPricingEntry)
			}
			table[modelName][resolution] = entry
		}
	}
	return table, nil
}

func parseVideoResolutionPricingEntry(raw map[string]any) (VideoResolutionPricingEntry, error) {
	entry := VideoResolutionPricingEntry{}
	for key, value := range raw {
		normalized := normalizePricingKey(key)
		number, ok, err := parseOptionalFloat(value)
		if err != nil {
			return entry, fmt.Errorf("%s must be a number", key)
		}
		if !ok {
			continue
		}
		switch normalized {
		case "novideoinput", "withoutvideoinput", "texttovideo":
			entry.NoVideoInput = &number
		case "withvideoinput", "videoinput", "imagetovideo", "referencetovideo":
			entry.WithVideoInput = &number
		case "completion", "output", "outputprice":
			entry.Completion = &number
		}
	}
	if entry.NoVideoInput == nil && entry.WithVideoInput == nil && entry.Completion == nil {
		return entry, fmt.Errorf("entry must include at least one of no_video_input, with_video_input, completion")
	}
	return entry, nil
}

func lookupVideoResolutionPricingEntry(table VideoResolutionPricingTable, exactModelName string, baseModel string, resolution string) (VideoResolutionPricingEntry, bool) {
	if resolution == "" || len(table) == 0 {
		return VideoResolutionPricingEntry{}, false
	}

	candidates := []string{exactModelName, baseModel, strings.ToLower(exactModelName), strings.ToLower(baseModel)}
	seen := make(map[string]struct{}, len(candidates))
	for _, candidate := range candidates {
		candidate = strings.TrimSpace(candidate)
		if candidate == "" {
			continue
		}
		if _, ok := seen[candidate]; ok {
			continue
		}
		seen[candidate] = struct{}{}
		if byResolution, ok := table[candidate]; ok {
			if entry, ok := byResolution[resolution]; ok {
				return entry, true
			}
		}
	}
	return VideoResolutionPricingEntry{}, false
}

func normalizeRequestBodyAny(requestBody any) any {
	switch value := requestBody.(type) {
	case nil:
		return nil
	case []byte:
		return decodeRequestBodyJSON(string(value))
	case string:
		return decodeRequestBodyJSON(value)
	default:
		return value
	}
}

func decodeRequestBodyJSON(raw string) any {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	decoder := json.NewDecoder(strings.NewReader(raw))
	decoder.UseNumber()
	var parsed any
	if err := decoder.Decode(&parsed); err != nil {
		return nil
	}
	return parsed
}

func extractResolutionFromAny(value any) string {
	width := 0
	height := 0
	var walk func(any) string
	walk = func(current any) string {
		switch typed := current.(type) {
		case map[string]any:
			for key, value := range typed {
				lowerKey := strings.ToLower(strings.TrimSpace(key))
				if isResolutionKey(lowerKey) {
					if resolution := NormalizeVideoResolution(valueToString(value)); resolution != "" {
						return resolution
					}
				}
				if lowerKey == "width" || lowerKey == "w" {
					width = parseIntLike(value)
				}
				if lowerKey == "height" || lowerKey == "h" {
					height = parseIntLike(value)
				}
			}
			if resolution := normalizeVideoResolutionFromDimensions(width, height); resolution != "" {
				return resolution
			}
			for _, value := range typed {
				if resolution := walk(value); resolution != "" {
					return resolution
				}
			}
		case []any:
			for _, item := range typed {
				if resolution := walk(item); resolution != "" {
					return resolution
				}
			}
		}
		return ""
	}
	return walk(value)
}

func hasVideoInputPayloadAny(value any) bool {
	var walk func(string, any) bool
	walk = func(key string, current any) bool {
		normalizedKey := strings.ToLower(strings.TrimSpace(key))
		switch typed := current.(type) {
		case map[string]any:
			for k, v := range typed {
				if walk(k, v) {
					return true
				}
			}
		case []any:
			if isMediaInputKey(normalizedKey) && len(typed) > 0 {
				return true
			}
			for _, item := range typed {
				if walk(normalizedKey, item) {
					return true
				}
			}
		case string:
			trimmed := strings.TrimSpace(typed)
			if trimmed == "" {
				return false
			}
			if isMediaInputKey(normalizedKey) {
				return true
			}
			if normalizedKey == "type" {
				lowerValue := strings.ToLower(trimmed)
				return strings.Contains(lowerValue, "image") || strings.Contains(lowerValue, "video")
			}
		default:
			if current != nil && isMediaInputKey(normalizedKey) {
				return true
			}
		}
		return false
	}
	return walk("", value)
}

func isResolutionKey(key string) bool {
	switch key {
	case "resolution", "video_resolution", "videoresolution", "quality", "size", "dimensions", "dimension", "ratio":
		return true
	default:
		return false
	}
}

func isMediaInputKey(key string) bool {
	if key == "" {
		return false
	}
	if strings.Contains(key, "resolution") || strings.Contains(key, "duration") || strings.Contains(key, "model") {
		return false
	}
	mediaKeys := []string{
		"image", "images", "image_url", "imageurl", "input_image", "inputimage",
		"first_frame", "firstframe", "last_frame", "lastframe", "frame_image", "frameimage",
		"video", "videos", "video_url", "videourl", "input_video", "inputvideo",
		"reference_video", "referencevideo", "ref_video", "refvideo",
	}
	for _, mediaKey := range mediaKeys {
		if key == mediaKey || strings.Contains(key, mediaKey) {
			return true
		}
	}
	return false
}

func NormalizeVideoResolution(value string) string {
	lower := strings.ToLower(strings.TrimSpace(value))
	if lower == "" {
		return ""
	}
	compact := strings.NewReplacer("_", "", "-", "", " ", "").Replace(lower)
	if strings.Contains(compact, "480p") || strings.Contains(compact, "854x480") || strings.Contains(compact, "480x") {
		return "480p"
	}
	if strings.Contains(compact, "720p") || strings.Contains(compact, "1280x720") || strings.Contains(compact, "720x") {
		return "720p"
	}
	if strings.Contains(compact, "1080p") || strings.Contains(compact, "1920x1080") || strings.Contains(compact, "1080x") {
		return "1080p"
	}
	if strings.Contains(compact, "4k") || strings.Contains(compact, "2160p") || strings.Contains(compact, "3840x2160") || strings.Contains(compact, "4096x2160") {
		return "4k"
	}
	if resolution := normalizeVideoResolutionFromDimensionString(compact); resolution != "" {
		return resolution
	}
	return ""
}

func normalizeVideoResolutionFromModelSuffix(modelName string) string {
	suffixes := []string{"480p", "720p", "1080p", "4k"}
	lower := strings.ToLower(strings.TrimSpace(modelName))
	for _, suffix := range suffixes {
		if strings.HasSuffix(lower, "-"+suffix) || strings.HasSuffix(lower, "_"+suffix) || strings.HasSuffix(lower, suffix) {
			return suffix
		}
	}
	return ""
}

func normalizeVideoResolutionFromDimensionString(value string) string {
	re := regexp.MustCompile(`(\d{3,4})x(\d{3,4})`)
	matches := re.FindStringSubmatch(value)
	if len(matches) != 3 {
		return ""
	}
	width, _ := strconv.Atoi(matches[1])
	height, _ := strconv.Atoi(matches[2])
	return normalizeVideoResolutionFromDimensions(width, height)
}

func normalizeVideoResolutionFromDimensions(width int, height int) string {
	if width <= 0 && height <= 0 {
		return ""
	}
	side := height
	if side <= 0 || (width > 0 && width < side) {
		side = width
	}
	if side <= 540 {
		return "480p"
	}
	if side <= 900 {
		return "720p"
	}
	if side <= 1440 {
		return "1080p"
	}
	return "4k"
}

func trimVideoResolutionSuffix(modelName string, resolution string) string {
	base := strings.TrimSpace(modelName)
	if resolution == "" {
		return base
	}
	for _, suffix := range []string{"-" + resolution, "_" + resolution, resolution} {
		if strings.HasSuffix(strings.ToLower(base), strings.ToLower(suffix)) {
			return strings.TrimRight(base[:len(base)-len(suffix)], "-_")
		}
	}
	return base
}

func normalizeSeedanceBaseModel(base string) string {
	lower := strings.ToLower(strings.TrimSpace(base))
	switch {
	case strings.Contains(lower, "seedance-2.0-fast") || strings.Contains(lower, "seedance-2-0-fast"):
		return "seedance-2.0-fast"
	case strings.Contains(lower, "seedance-2.0") || strings.Contains(lower, "seedance-2-0"):
		return "seedance-2.0"
	default:
		return strings.TrimSpace(base)
	}
}

func parseOptionalFloat(value any) (float64, bool, error) {
	if value == nil {
		return 0, false, nil
	}
	switch typed := value.(type) {
	case json.Number:
		f, err := typed.Float64()
		return f, true, validateFiniteFloat(f, err)
	case float64:
		return typed, true, validateFiniteFloat(typed, nil)
	case float32:
		f := float64(typed)
		return f, true, validateFiniteFloat(f, nil)
	case int:
		return float64(typed), true, nil
	case int64:
		return float64(typed), true, nil
	case string:
		trimmed := strings.TrimSpace(typed)
		if trimmed == "" {
			return 0, false, nil
		}
		f, err := strconv.ParseFloat(trimmed, 64)
		return f, true, validateFiniteFloat(f, err)
	default:
		return 0, false, fmt.Errorf("unsupported type %T", value)
	}
}

func validateFiniteFloat(value float64, err error) error {
	if err != nil {
		return err
	}
	if math.IsNaN(value) || math.IsInf(value, 0) || value < 0 {
		return fmt.Errorf("invalid non-negative finite number")
	}
	return nil
}

func normalizePricingKey(key string) string {
	return strings.NewReplacer("_", "", "-", "", " ", "").Replace(strings.ToLower(strings.TrimSpace(key)))
}

func valueToString(value any) string {
	switch typed := value.(type) {
	case nil:
		return ""
	case string:
		return typed
	case json.Number:
		return typed.String()
	case float64:
		return strconv.FormatFloat(typed, 'f', -1, 64)
	case int:
		return strconv.Itoa(typed)
	case int64:
		return strconv.FormatInt(typed, 10)
	default:
		return fmt.Sprintf("%v", value)
	}
}

func parseIntLike(value any) int {
	stringValue := valueToString(value)
	if stringValue == "" {
		return 0
	}
	f, err := strconv.ParseFloat(stringValue, 64)
	if err != nil {
		return 0
	}
	return int(f)
}

func cloneFloatPtr(value *float64) *float64 {
	if value == nil {
		return nil
	}
	cloned := *value
	return &cloned
}

// FEIXIANG_VIDEO_RESOLUTION_PRICING_V2_API_PRICING
// VideoResolutionPricingPublic is the /api/pricing-facing shape. It is derived
// from the admin-configured VideoResolutionPricing option and is intentionally
// grouped by base model so the frontend can render a stable resolution table.
type VideoResolutionPricingResolutionPublic struct {
	Resolution     string   `json:"resolution"`
	NoVideoInput   *float64 `json:"no_video_input,omitempty"`
	WithVideoInput *float64 `json:"with_video_input,omitempty"`
	Completion     *float64 `json:"completion,omitempty"`
}

type VideoResolutionPricingPublic struct {
	ModelName         string                                   `json:"model_name,omitempty"`
	BaseModel         string                                   `json:"base_model"`
	ConfigModel       string                                   `json:"config_model,omitempty"`
	DefaultResolution string                                   `json:"default_resolution,omitempty"`
	Source            string                                   `json:"source,omitempty"`
	Currency          string                                   `json:"currency,omitempty"`
	Unit              string                                   `json:"unit,omitempty"`
	Resolutions       []VideoResolutionPricingResolutionPublic `json:"resolutions"`
}

// GetVideoResolutionPricingForModel returns the configured resolution table for
// a pricing catalog model. It only reads VideoResolutionPricing; callers may
// choose to fall back to legacy ModelRatio/VideoInputRatio values separately.
func GetVideoResolutionPricingForModel(modelName string) *VideoResolutionPricingPublic {
	table := GetVideoResolutionPricingTable()
	if len(table) == 0 {
		return nil
	}

	baseModel, defaultResolution := ParseVideoPricingModelAndResolution(modelName)
	rows, configModel, ok := lookupVideoResolutionPricingRowsForModel(table, modelName, baseModel)
	if !ok || len(rows) == 0 {
		return nil
	}

	return buildVideoResolutionPricingPublic(modelName, baseModel, configModel, defaultResolution, VideoResolutionPricingOptionKey, rows)
}

// BuildVideoResolutionPricingFromLegacyModelPricing makes /api/pricing useful
// immediately for existing deployments that already store per-resolution models
// as ModelRatio + VideoInputRatio + CompletionRatio, even before the operator
// has migrated all values into VideoResolutionPricing.
func BuildVideoResolutionPricingFromLegacyModelPricing(modelName string, modelRatio float64, videoInputRatio *float64, completionRatio float64) *VideoResolutionPricingPublic {
	baseModel, resolution := ParseVideoPricingModelAndResolution(modelName)
	if resolution == "" || !isLikelyVideoResolutionPricingModelName(modelName) {
		return nil
	}

	entry := VideoResolutionPricingEntry{}
	if modelRatio > 0 {
		value := modelRatio
		entry.NoVideoInput = &value
	}
	if videoInputRatio != nil && *videoInputRatio > 0 {
		entry.WithVideoInput = cloneFloatPtr(videoInputRatio)
	}
	if completionRatio > 0 {
		value := completionRatio
		entry.Completion = &value
	}
	if entry.NoVideoInput == nil && entry.WithVideoInput == nil && entry.Completion == nil {
		return nil
	}

	rows := map[string]VideoResolutionPricingEntry{resolution: entry}
	return buildVideoResolutionPricingPublic(modelName, baseModel, modelName, resolution, "legacy_model_pricing", rows)
}

func lookupVideoResolutionPricingRowsForModel(table VideoResolutionPricingTable, exactModelName string, baseModel string) (map[string]VideoResolutionPricingEntry, string, bool) {
	candidates := []string{
		strings.TrimSpace(exactModelName),
		strings.TrimSpace(baseModel),
		strings.ToLower(strings.TrimSpace(exactModelName)),
		strings.ToLower(strings.TrimSpace(baseModel)),
	}
	seen := make(map[string]struct{}, len(candidates))
	for _, candidate := range candidates {
		candidate = strings.TrimSpace(candidate)
		if candidate == "" {
			continue
		}
		if _, ok := seen[candidate]; ok {
			continue
		}
		seen[candidate] = struct{}{}
		for configuredModel, rows := range table {
			if strings.EqualFold(strings.TrimSpace(configuredModel), candidate) {
				return rows, configuredModel, true
			}
		}
	}
	return nil, "", false
}

func buildVideoResolutionPricingPublic(modelName string, baseModel string, configModel string, defaultResolution string, source string, rows map[string]VideoResolutionPricingEntry) *VideoResolutionPricingPublic {
	if len(rows) == 0 {
		return nil
	}
	keys := make([]string, 0, len(rows))
	for resolution := range rows {
		normalized := NormalizeVideoResolution(resolution)
		if normalized == "" {
			continue
		}
		keys = append(keys, normalized)
	}
	if len(keys) == 0 {
		return nil
	}
	sortVideoResolutionKeys(keys)
	if defaultResolution == "" {
		defaultResolution = keys[0]
	}
	if baseModel == "" {
		baseModel = strings.TrimSpace(configModel)
	}

	out := &VideoResolutionPricingPublic{
		ModelName:         strings.TrimSpace(modelName),
		BaseModel:         strings.TrimSpace(baseModel),
		ConfigModel:       strings.TrimSpace(configModel),
		DefaultResolution: defaultResolution,
		Source:            source,
		Currency:          "USD",
		Unit:              "1M tokens",
		Resolutions:       make([]VideoResolutionPricingResolutionPublic, 0, len(keys)),
	}
	seen := make(map[string]struct{}, len(keys))
	for _, resolution := range keys {
		if _, ok := seen[resolution]; ok {
			continue
		}
		seen[resolution] = struct{}{}
		entry := rows[resolution]
		out.Resolutions = append(out.Resolutions, VideoResolutionPricingResolutionPublic{
			Resolution:     resolution,
			NoVideoInput:   cloneFloatPtr(entry.NoVideoInput),
			WithVideoInput: cloneFloatPtr(entry.WithVideoInput),
			Completion:     cloneFloatPtr(entry.Completion),
		})
	}
	if len(out.Resolutions) == 0 {
		return nil
	}
	return out
}

func sortVideoResolutionKeys(keys []string) {
	sort.SliceStable(keys, func(i, j int) bool {
		leftRank := videoResolutionSortRank(keys[i])
		rightRank := videoResolutionSortRank(keys[j])
		if leftRank == rightRank {
			return keys[i] < keys[j]
		}
		return leftRank < rightRank
	})
}

func videoResolutionSortRank(resolution string) int {
	switch NormalizeVideoResolution(resolution) {
	case "480p":
		return 10
	case "720p":
		return 20
	case "1080p":
		return 30
	case "4k":
		return 40
	default:
		return 100
	}
}

func isLikelyVideoResolutionPricingModelName(modelName string) bool {
	lower := strings.ToLower(strings.TrimSpace(modelName))
	if lower == "" {
		return false
	}
	keywords := []string{"seedance", "doubao-seedance", "veo", "kling", "sora", "wan", "hailuo", "skyreels", "video"}
	for _, keyword := range keywords {
		if strings.Contains(lower, keyword) {
			return true
		}
	}
	return false
}
