# Farmer API contract (for the FastAPI/Flask backend)

Base URL: `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8000/api/v1`).
All bodies are JSON. The client sends `Accept-Language: en | sw`. Text fields typed `Text` in
`lib/types.ts` may be a plain string (translated server-side) or `{ "en": "...", "sw": "..." }`.
Response shapes are the TypeScript types in `lib/types.ts`.

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/farmer/profile` | `Farmer` |
| GET | `/farmer/overview` | `WaterOverview` (set `source: "sensor"` for real readings) |
| GET | `/farmer/usage?range=7d\|14d\|30d` | `UsagePoint[]` (daily, oldest first) |
| GET | `/farmer/supply-trend` | `SupplyReading[]` (last 24h, hourly) |
| GET | `/farmer/field-blocks` | `FieldBlock[]` |
| GET | `/farmer/schedules` | `Schedule[]` |
| PATCH | `/farmer/schedules/{id}` body `{ "status": "skipped" \| "scheduled" }` | `Schedule` |
| GET | `/farmer/recommendations` | `Recommendation[]` (`generatedBy: "ai-model"`) |
| POST | `/farmer/recommendations/{id}/apply` | `{ recommendation, schedule? }` |
| POST | `/farmer/recommendations/{id}/dismiss` | `Recommendation` |
| GET | `/farmer/notifications` | `Notification[]` (newest first) |
| POST | `/farmer/notifications/read` body `{ "ids"?: string[] }` | 204 (omit `ids` = all) |
| GET | `/farmer/issues` | `Issue[]` (newest first) |
| POST | `/farmer/issues` body `NewIssueInput` | `Issue` (status `reported`) |
| POST | `/farmer/issues/{id}/reopen` | `Issue` |

Errors: non-2xx with `{ "detail": "message" }` (FastAPI default).

Planned: `POST /i18n/translate` `{ text, target, source? }` -> `{ text, provider }`
(see `lib/i18n/remote.ts`), and a WebSocket/SSE stream for live sensor updates (the overview
currently polls every 30 s).
