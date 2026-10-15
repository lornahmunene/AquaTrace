/**
 * MOCK DATA — fictional "Kasyala Community Water Scheme", Makueni County.
 *
 * Every reading produced here is SIMULATED (source: "simulated"). It is
 * generated from a seeded random generator relative to the current date so the
 * demo always looks "live", but none of it comes from real sensors.
 * Replace by real backend data via lib/api/farmer.ts (set NEXT_PUBLIC_USE_MOCK=false).
 */
import { L } from "@/lib/i18n/config";
import { addDays, pad, ymd } from "@/lib/utils/date";
import type {
  Farmer,
  FieldBlock,
  IrrigationMethod,
  Issue,
  Notification,
  Recommendation,
  Schedule,
  SupplyReading,
  UsagePoint,
  WaterOverview,
} from "@/lib/types";

// ---------- helpers ----------
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

// ---------- static facts ----------
export const MONTHLY_ALLOCATION = 150_000;
export const DAILY_ALLOCATION = 4_800;
export const TANK_CAPACITY = 250_000;

export const FARMER: Farmer = {
  id: "farmer-0417",
  name: "Mary Mwende",
  schemeName: "Kasyala Community Water Scheme",
  zone: "Zone B",
  plotName: "Plot B-17",
  connectionId: "KCW-B-0417",
  acres: 1.2,
  crops: ["Tomatoes", "Maize", "Green grams"],
};

interface BlockDef {
  id: string;
  name: string;
  crop: string;
  acres: number;
  method: IrrigationMethod;
  startTime: string;
  durationMin: number;
  lpm: number; // litres per minute while irrigating
  dows: number[]; // 0 = Sunday
  moisture: number;
  min: number;
  max: number;
}

export const BLOCKS: BlockDef[] = [
  {
    id: "blk-a",
    name: "Block A",
    crop: "Tomatoes",
    acres: 0.4,
    method: "drip",
    startTime: "06:00",
    durationMin: 45,
    lpm: 55,
    dows: [0, 2, 4, 6],
    moisture: 71,
    min: 55,
    max: 65,
  },
  {
    id: "blk-b",
    name: "Block B",
    crop: "Maize",
    acres: 0.5,
    method: "furrow",
    startTime: "07:00",
    durationMin: 60,
    lpm: 70,
    dows: [1, 3, 5],
    moisture: 52,
    min: 45,
    max: 60,
  },
  {
    id: "blk-c",
    name: "Block C",
    crop: "Green grams",
    acres: 0.3,
    method: "sprinkler",
    startTime: "07:30",
    durationMin: 40,
    lpm: 50,
    dows: [0, 3, 6],
    moisture: 38,
    min: 40,
    max: 55,
  },
];

export const lpmForBlock = (blockId: string) =>
  BLOCKS.find((b) => b.id === blockId)?.lpm ?? 50;

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// ---------- schedules (also the source for simulated daily usage) ----------
interface Session {
  offset: number; // days from today
  schedule: Schedule;
}

function buildSessions(): Session[] {
  const rnd = mulberry32(7);
  const today = new Date();
  const nowMin = today.getHours() * 60 + today.getMinutes();
  const out: Session[] = [];

  for (let offset = -29; offset <= 6; offset++) {
    const date = addDays(today, offset);
    const dow = date.getDay();
    for (const b of BLOCKS) {
      if (!b.dows.includes(dow)) continue;

      let status: Schedule["status"] = "scheduled";
      if (offset < 0) status = rnd() < 0.1 ? "skipped" : "completed";
      if (offset === 0) {
        const start = toMin(b.startTime);
        const end = start + b.durationMin;
        status = nowMin >= end ? "completed" : nowMin >= start ? "running" : "scheduled";
      }

      const aiAdjusted = b.id === "blk-a" && dow === 6 && offset > 0;
      out.push({
        offset,
        schedule: {
          id: `sch-${ymd(date).replace(/-/g, "")}-${b.id}`,
          date: ymd(date),
          startTime: b.startTime,
          durationMin: b.durationMin,
          litres: b.durationMin * b.lpm,
          blockId: b.id,
          blockName: b.name,
          crop: b.crop,
          method: b.method,
          status,
          aiAdjusted,
          note: aiAdjusted
            ? L(
                "Start time set to avoid midday heat losses (sample rule).",
                "Muda wa kuanza umepangwa kuepuka upotevu wa joto la mchana (kanuni ya mfano).",
              )
            : undefined,
        },
      });
    }
  }
  return out;
}

export function buildSchedules(): Schedule[] {
  return buildSessions()
    .filter((s) => s.offset >= -3)
    .map((s) => s.schedule);
}

// ---------- usage ----------
export function buildDailyUsage(): UsagePoint[] {
  const rnd = mulberry32(21);
  const today = new Date();
  const nowMin = today.getHours() * 60 + today.getMinutes();
  const sessions = buildSessions();
  const points: UsagePoint[] = [];

  for (let offset = -29; offset <= 0; offset++) {
    const date = addDays(today, offset);
    let used = 0;
    for (const s of sessions.filter((x) => x.offset === offset)) {
      const sc = s.schedule;
      if (sc.status === "completed") used += sc.litres * (0.92 + rnd() * 0.2);
      else if (sc.status === "running") {
        const start = toMin(sc.startTime);
        const frac = Math.min(1, Math.max(0, (nowMin - start) / sc.durationMin));
        used += sc.litres * frac;
      }
    }
    // household / livestock draw-off
    used += offset === 0 ? 120 + rnd() * 100 : 250 + rnd() * 250;
    points.push({
      date: ymd(date),
      label: date.toLocaleDateString("en-KE", { day: "numeric", month: "short" }),
      usedLitres: Math.round(used / 10) * 10,
      allocatedLitres: DAILY_ALLOCATION,
    });
  }
  return points;
}

// ---------- supply trend (hourly, last 24h) ----------
export function buildSupplyTrend(): SupplyReading[] {
  const rnd = mulberry32(99);
  const out: SupplyReading[] = [];
  const now = new Date();
  now.setMinutes(0, 0, 0);

  for (let k = 23; k >= 0; k--) {
    const t = new Date(now.getTime() - k * 3_600_000);
    const h = t.getHours();
    let flow = 3 + rnd() * 6;
    if (h >= 6 && h <= 8) flow = 38 + rnd() * 24;
    let pressure = 2.85 - flow * 0.011 + (rnd() - 0.5) * 0.12;
    if (k === 19 || k === 18) {
      // a brief simulated low-pressure dip
      pressure = 1.3 + rnd() * 0.15;
      flow = 12;
    }
    out.push({
      time: t.toISOString(),
      label: `${pad(h)}:00`,
      pressureBar: Math.round(pressure * 100) / 100,
      flowLpm: Math.round(flow),
      source: "simulated",
    });
  }
  return out;
}

// ---------- overview ----------
export function buildOverview(
  usage: UsagePoint[],
  trend: SupplyReading[],
  sessions: Schedule[],
): WaterOverview {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const monthToDate = usage
    .filter((u) => u.date.startsWith(monthKey))
    .reduce((s, u) => s + u.usedLitres, 0);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const latest = trend[trend.length - 1];

  const supplyStatus = latest.pressureBar < 1.5 ? "low_pressure" : "normal";

  // Daily supply window 05:30–10:00 (sample rota for Zone B)
  const start = new Date();
  start.setHours(5, 30, 0, 0);
  let end = new Date();
  end.setHours(10, 0, 0, 0);
  if (end.getTime() < Date.now()) {
    start.setDate(start.getDate() + 1);
    end = addDays(end, 1);
  }

  void sessions;
  return {
    tank: {
      name: "Kasyala Tank 2",
      levelLitres: Math.round(TANK_CAPACITY * 0.67),
      capacityLitres: TANK_CAPACITY,
    },
    allocation: {
      monthlyLitres: MONTHLY_ALLOCATION,
      usedLitres: monthToDate,
      dailyLitres: DAILY_ALLOCATION,
      dayOfMonth: now.getDate(),
      daysInMonth,
    },
    usedTodayLitres: usage[usage.length - 1].usedLitres,
    pressureBar: latest.pressureBar,
    flowLpm: latest.flowLpm,
    supplyStatus,
    supplyStatusNote:
      supplyStatus === "normal"
        ? L(
            "Water is reaching your connection at normal pressure.",
            "Maji yanafika kwenye muunganisho wako kwa shinikizo la kawaida.",
          )
        : undefined,
    nextSupplyWindow: { start: start.toISOString(), end: end.toISOString() },
    lastUpdated: new Date().toISOString(),
    source: "simulated",
  };
}

// ---------- field blocks ----------
export function buildFieldBlocks(): FieldBlock[] {
  return BLOCKS.map((b) => ({
    id: b.id,
    name: b.name,
    crop: b.crop,
    acres: b.acres,
    method: b.method,
    soilMoisturePct: b.moisture,
    targetMinPct: b.min,
    targetMaxPct: b.max,
    lastReading: minutesAgo(12),
    source: "simulated",
  }));
}

// ---------- recommendations ----------
export function buildRecommendations(
  schedules: Schedule[],
  overview: WaterOverview,
): Recommendation[] {
  const todayStr = ymd(new Date());
  const nextFor = (blockId: string) =>
    schedules.find(
      (s) => s.blockId === blockId && s.status === "scheduled" && s.date >= todayStr,
    );

  const recs: Recommendation[] = [];

  const tomato = nextFor("blk-a");
  if (tomato) {
    recs.push({
      id: "rec-1",
      title: L(
        "Trim the next tomato session to 38 minutes",
        "Punguza kipindi kijacho cha nyanya hadi dakika 38",
      ),
      detail: L(
        "Soil moisture in Block A is 71%, above the 65% upper target. A shorter session avoids waterlogging and saves water.",
        "Unyevu wa udongo Kipande A ni 71%, juu ya lengo la 65%. Kipindi kifupi huzuia maji kujaa na huokoa maji.",
      ),
      impact: L("Saves about 385 L", "Huokoa takriban L 385"),
      priority: "medium",
      confidence: 0.82,
      status: "new",
      scheduleId: tomato.id,
      patch: { durationMin: 38 },
      generatedBy: "mock-rules",
    });
  }

  const maize = nextFor("blk-b");
  if (maize) {
    recs.push({
      id: "rec-2",
      title: L(
        "Start the next maize session at 05:30",
        "Anza kipindi kijacho cha mahindi saa 05:30",
      ),
      detail: L(
        "Line pressure usually dips when many farms irrigate between 07:00 and 09:00. An earlier start gives steadier flow to your furrows.",
        "Shinikizo la bomba hushuka mashamba mengi yanapomwagilia kati ya saa 07:00 na 09:00. Kuanza mapema huipa mifereji mtiririko thabiti.",
      ),
      impact: L("Steadier pressure", "Shinikizo thabiti zaidi"),
      priority: "medium",
      confidence: 0.74,
      status: "new",
      scheduleId: maize.id,
      patch: { startTime: "05:30" },
      generatedBy: "mock-rules",
    });
  }

  const gg = nextFor("blk-c");
  if (gg) {
    recs.push({
      id: "rec-3",
      title: L(
        "Add 10 minutes to the next green gram session",
        "Ongeza dakika 10 kwenye kipindi kijacho cha ndengu",
      ),
      detail: L(
        "Block C soil moisture is 38%, below the 40% lower target. A slightly longer session helps the crop avoid water stress.",
        "Unyevu wa udongo Kipande C ni 38%, chini ya lengo la 40%. Kipindi kirefu kidogo husaidia zao kuepuka upungufu wa maji.",
      ),
      impact: L("Uses about 500 L more", "Inatumia takriban L 500 zaidi"),
      priority: "high",
      confidence: 0.79,
      status: "new",
      scheduleId: gg.id,
      patch: { durationMin: 50 },
      generatedBy: "mock-rules",
    });
  }

  const a = overview.allocation;
  const projected = Math.round((a.usedLitres / Math.max(1, a.dayOfMonth)) * a.daysInMonth);
  const projPct = Math.round((projected / a.monthlyLitres) * 100);
  recs.push({
    id: "rec-4",
    title:
      projPct > 100
        ? L("You may run out of allocation before month-end", "Huenda mgao ukaisha kabla ya mwisho wa mwezi")
        : L("Your water use is on track this month", "Matumizi yako ya maji yako sawa mwezi huu"),
    detail: L(
      `At the current pace you would use about ${projPct}% of your monthly allocation by month-end.`,
      `Kwa kasi ya sasa utatumia takriban ${projPct}% ya mgao wako wa mwezi kufikia mwisho wa mwezi.`,
    ),
    impact: L("Advice only", "Ushauri tu"),
    priority: projPct > 100 ? "high" : "low",
    confidence: 0.9,
    status: "new",
    generatedBy: "mock-rules",
  });

  return recs;
}

// ---------- notifications ----------
export function buildNotifications(
  schedules: Schedule[],
  overview: WaterOverview,
): Notification[] {
  const todayStr = ymd(new Date());
  const next = schedules.find((s) => s.status === "scheduled" && s.date >= todayStr);
  const a = overview.allocation;
  const pct = Math.round((a.usedLitres / a.monthlyLitres) * 100);

  const list: Notification[] = [
    {
      id: "n-1",
      type: "supply",
      severity: "warning",
      title: L("Planned maintenance tomorrow", "Matengenezo yaliyopangwa kesho"),
      body: L(
        "Zone B supply will be off from 10:00 to 14:00 while a valve is replaced. Irrigate early and store water if you can.",
        "Maji ya Eneo B yatakatwa kuanzia saa 10:00 hadi 14:00 valvu inapobadilishwa. Mwagilia mapema na uhifadhi maji ukiweza.",
      ),
      createdAt: minutesAgo(90),
      read: false,
    },
    {
      id: "n-2",
      type: "supply",
      severity: "warning",
      title: L("Low pressure at your connection", "Shinikizo dogo kwenye muunganisho wako"),
      body: L(
        "Pressure fell to about 1.3 bar for roughly two hours yesterday and has since recovered.",
        "Shinikizo lilishuka hadi takriban bar 1.3 kwa takriban saa mbili jana na sasa limerudi.",
      ),
      createdAt: minutesAgo(19 * 60 + 10),
      read: false,
    },
  ];

  if (next) {
    list.push({
      id: "n-3",
      type: "schedule",
      severity: "info",
      title: L("Next irrigation session", "Kipindi kijacho cha umwagiliaji"),
      body: L(
        `${next.blockName} (${next.crop}) starts at ${next.startTime} for ${next.durationMin} minutes.`,
        `${next.blockName} (${next.crop}) kinaanza saa ${next.startTime} kwa dakika ${next.durationMin}.`,
      ),
      createdAt: minutesAgo(200),
      read: false,
    });
  }

  list.push(
    {
      id: "n-4",
      type: "issue",
      severity: "info",
      title: L("Update on report ISS-1042", "Taarifa kuhusu ripoti ISS-1042"),
      body: L(
        "A technician has started repairing the leak on the lateral pipeline near Block A.",
        "Fundi ameanza kukarabati uvujaji kwenye bomba tawi karibu na Kipande A.",
      ),
      createdAt: minutesAgo(300),
      read: false,
      issueId: "ISS-1042",
    },
    {
      id: "n-5",
      type: "leak",
      severity: "critical",
      title: L("Possible leak detected on your lateral line", "Uvujaji unaowezekana kwenye bomba lako tawi"),
      body: L(
        "Flow stayed above normal overnight while no irrigation was scheduled. Please check your lateral pipeline and report any leak.",
        "Mtiririko ulibaki juu ya kawaida usiku wakati hakuna umwagiliaji uliopangwa. Tafadhali kagua bomba tawi na uripoti uvujaji wowote.",
      ),
      createdAt: minutesAgo(4400),
      read: true,
    },
    {
      id: "n-6",
      type: "system",
      severity: "info",
      title: L("Monthly allocation update", "Taarifa ya mgao wa mwezi"),
      body: L(
        `You have used ${pct}% of this month's water allocation.`,
        `Umetumia ${pct}% ya mgao wa maji wa mwezi huu.`,
      ),
      createdAt: minutesAgo(1500),
      read: true,
    },
    {
      id: "n-7",
      type: "supply",
      severity: "info",
      title: L("Scheme tank refilled", "Tanki la mradi limejazwa"),
      body: L(
        "Kasyala Tank 2 has recovered to about two-thirds full.",
        "Tanki la Kasyala 2 limerudi takriban theluthi mbili ya ujazo.",
      ),
      createdAt: minutesAgo(2900),
      read: true,
    },
    {
      id: "n-8",
      type: "issue",
      severity: "info",
      title: L("Report ISS-1038 resolved", "Ripoti ISS-1038 imetatuliwa"),
      body: L(
        "The partially closed valve at standpipe SP-14 was opened and tested.",
        "Valvu iliyofungwa nusu kwenye bomba la umma SP-14 imefunguliwa na kujaribiwa.",
      ),
      createdAt: minutesAgo(11000),
      read: true,
      issueId: "ISS-1038",
    },
  );

  return list;
}

// ---------- issues ----------
export function buildIssues(): Issue[] {
  const own = {
    zone: "B" as const,
    origin: "farmer" as const,
    reporter: { id: FARMER.id, name: FARMER.name, plot: FARMER.plotName },
  };
  const list: Issue[] = [
    {
      id: "ISS-1051",
      type: "shortage",
      severity: "medium",
      location: "inlet",
      description: "No water reached my plot during the morning supply window yesterday.",
      status: "acknowledged",
      createdAt: minutesAgo(1500),
      updatedAt: minutesAgo(1400),
      timeline: [
        { status: "reported", at: minutesAgo(1500), note: L("Submitted by farmer", "Imetumwa na mkulima") },
        { status: "acknowledged", at: minutesAgo(1400), note: L("Technicians are checking Zone B flow records.", "Mafundi wanakagua rekodi za mtiririko wa Eneo B.") },
      ],
    },
    {
      id: "ISS-1042",
      type: "leak",
      severity: "high",
      location: "lateral",
      locationDetail: "Near the Block A tomato rows",
      description: "Water is bubbling up from the ground along the lateral pipe and the soil is waterlogged.",
      status: "in_progress",
      createdAt: minutesAgo(4320),
      updatedAt: minutesAgo(300),
      assignedTo: "J. Mutua",
      timeline: [
        { status: "reported", at: minutesAgo(4320), note: L("Submitted by farmer", "Imetumwa na mkulima") },
        { status: "acknowledged", at: minutesAgo(4230), note: L("Matches an overnight flow anomaly on your line.", "Inalingana na hitilafu ya mtiririko usiku kwenye bomba lako.") },
        { status: "technician_assigned", at: minutesAgo(3000), note: L("Assigned to J. Mutua.", "Amepangiwa J. Mutua.") },
        { status: "in_progress", at: minutesAgo(300), note: L("Repair clamp being fitted on the lateral pipe.", "Kibano cha ukarabati kinawekwa kwenye bomba tawi.") },
      ],
    },
    {
      id: "ISS-1038",
      type: "low_pressure",
      severity: "medium",
      location: "standpipe",
      locationDetail: "Standpipe SP-14",
      description: "Water only trickles from the standpipe in the evenings.",
      status: "resolved",
      createdAt: minutesAgo(13000),
      updatedAt: minutesAgo(11000),
      assignedTo: "P. Kioko",
      timeline: [
        { status: "reported", at: minutesAgo(13000), note: L("Submitted by farmer", "Imetumwa na mkulima") },
        { status: "acknowledged", at: minutesAgo(12900) },
        { status: "technician_assigned", at: minutesAgo(12000), note: L("Assigned to P. Kioko.", "Amepangiwa P. Kioko.") },
        { status: "in_progress", at: minutesAgo(11800) },
        { status: "resolved", at: minutesAgo(11000), note: L("A partially closed valve was fully opened and flow tested.", "Valvu iliyofungwa nusu imefunguliwa kikamilifu na mtiririko umejaribiwa.") },
      ],
    },
  ];
  return list.map((i) => ({ ...i, ...own }));
}
