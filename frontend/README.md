# AquaTrace — Farmer dashboard (build step 1)

AI + IoT water distribution and loss management for farmers and technicians in Makueni County, Kenya.
This step delivers the **Farmer dashboard**. The technician side is a placeholder route.

```bash
npm install
npm run dev        # http://localhost:3000
```

## What's in the farmer dashboard

| Route | Features |
| --- | --- |
| `/farmer` | Tank level, allocation left, today's use, line pressure; interactive consumption chart (7/14/30 days, allocation line toggle); monthly allocation donut with pace and projection; supply status + 24h pressure/flow chart; today's irrigation; top AI advice; open reports; latest alerts; quick "report a problem" |
| `/farmer/irrigation` | Schedule grouped by day with scope/crop/status filters, skip/restore sessions, AI recommendations (apply changes the schedule, dismiss), soil-moisture field conditions |
| `/farmer/notifications` | Alerts with read/unread, type and severity filters, mark all read, deep links to reports |
| `/farmer/issues` | Report leak / low pressure / shortage (dialog), status filters, search, expandable progress timeline, reopen resolved reports |

Language switcher (English / Kiswahili) is in the top bar and on the landing page.

## Architecture

```
app/
  page.tsx                 role picker (placeholder for auth)
  farmer/                  farmer routes + layout (FarmerDataProvider)
  technician/              placeholder; will mirror farmer/ with its own layout
components/
  layout/                  AppShell (sidebar, top bar, mobile tabs), LanguageSwitcher
  farmer/                  farmer-only components
  ui/                      Card, Badge, Modal, Segmented, Toast, ...
lib/
  types.ts                 domain types = API contract
  api/client.ts            fetch wrapper, USE_MOCK flag, Accept-Language header
  api/farmer.ts            FarmerApi interface + HTTP implementation  <-- the only thing UI calls
  mock/                    seed data + in-memory FarmerApi (never imported by UI)
  i18n/                    config, dictionaries (en, sw), provider, remote AI-translation stub
  state/                   shared farmer state (alerts, issues, report dialog)
  hooks/                   useAsync, useIrrigation, useDayLabel
```

### Connecting the FastAPI/Flask backend
1. Copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_USE_MOCK=false` and `NEXT_PUBLIC_API_BASE_URL`.
2. Implement the endpoints in `docs/API_CONTRACT.md` (response shapes are the types in `lib/types.ts`).
3. Add auth headers in `lib/api/client.ts` (marked `TODO(auth)`).

### Real IoT data vs simulated data
Every mock reading is tagged `source: "simulated"`, and the UI shows a **Simulated data** badge
(top bar, supply card, field conditions) plus a **Sample** badge on recommendations. When the
backend returns `source: "sensor"`, the badges switch to "Live sensor" / disappear. Recommendations
carry `generatedBy: "mock-rules" | "ai-model"` the same way.

### Languages / AI translation
- UI strings: `lib/i18n/dictionaries/{en,sw}.ts`. Missing keys fall back to English.
- Backend content (alerts, recommendations, timeline notes) may be a plain string (already
  translated using the `Accept-Language` header the client sends) or `{ en, sw }`; `lt()` resolves both.
- Free-text translation (e.g. a farmer's report shown to a technician) goes through
  `lib/i18n/remote.ts`, a stub for `POST /i18n/translate`.
- To add Kikamba: add a locale in `lib/i18n/config.ts`, a dictionary file, and a loader entry.
  The Kiswahili strings are a hackathon draft; have a native speaker review them.

The scheme, farmer and all figures are fictional.
