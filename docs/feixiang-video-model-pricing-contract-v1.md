# FeiXiang 视频模型定价契约 v1

## 适用范围

当前 v1 只约束 Seedance 2.0 / Seedance 2.0 Fast 视频模型。

## 后台字段口径

- 模型名称：`seedance-2.0-480p` / `seedance-2.0-fast-480p` 等。
- 输入价格：文生视频 / 无视频输入单价，单位 `/1M`。
- 补全价格：固定 `0`，因为输出视频已包含在视频生成单价中。
- 分组倍率：最终用户价格 = 后台基础价格 × 当前计费分组倍率。

## 前端展示口径

- 模型广场卡片底部分组名必须与当前显示价格使用同一个计费分组。
- 模型详情页优先使用后端传入的模型输入价格展示无视频输入价格；没有匹配行时才使用旧的 Seedance fallback 表。
- 输出视频统一显示为已包含，不单独展示输出 token 价格。

## 后续 v2 建议

新增明确后端字段：

- `video_text_to_video_price`：文生视频 / 无视频输入单价。
- `video_input_price`：图生视频 / 含视频输入单价。
- `video_output_included`：输出视频是否已包含。
- `video_resolution`：分辨率。
- `provider_model_id`：上游官方模型 ID。

v1 暂不改数据库结构，避免影响线上计费。
