/**
 * MOCK DATA for the technician side — fictional Kasyala Community Water Scheme.
 * Every number is SIMULATED (source: "simulated"). Detections are produced by
 * hard-coded demo rules, not by a trained model or real sensor analysis.
 */
import { L } from "@/lib/i18n/config";
import { addDays, ymd } from "@/lib/utils/date";
import type {
  BalancePoint,
  Issue,
  LeakDetection,
  NetworkOverview,
  Sensor,
  SensorStatus,
  Technician,
  ZoneId,
  ZoneStat,
} from "@/lib/types";
import { FARMER, minutesAgo, mulberry32, TANK_CAPACITY } from "./seed";

// ---------- technicians ----------
const SCHEME = FARMER.schemeName;

export const TECHNICIANS: Technician[] = [
  { id: "tech-02", name: "J. Mutua", fullName: "Joseph Mutua", zones: ["B", "C"], schemeName: SCHEME },
  { id: "tech-04", name: "P. Kioko", fullName: "Peter Kioko", zones: ["A", "B"], schemeName: SCHEME },
  { id: "tech-05", name: "A. Nzioka", fullName: "Agnes Nzioka", zones: ["A", "D"], schemeName: SCHEME },
  { id: "tech-07", name: "G. Mwikali", fullName: "Grace Mwikali", zones: ["C", "D"], schemeName: SCHEME },
];
/** The signed-in technician in the demo (real backend: from the auth token). */
export const ME = TECHNICIANS[0];

export const TARGET_LOSS_PCT = 20;

// ---------- sensors ----------
interface SensorOverride {
  status: SensorStatus;
  lastSeenMin: number;
  battery?: number;
}

const OVERRIDES: Record<string, SensorOverride> = {
  "SM-C-02": { status: "offline", lastSeenMin: 60 * 31 },
  "PS-D-02": { status: "offline", lastSeenMin: 60 * 9 },
  "PS-C-02": { status: "low_battery", lastSeenMin: 6, battery: 11 },
  "SM-A-02": { status: "low_battery", lastSeenMin: 14, battery: 14 },
  "PS-B-02": { status: "low_battery", lastSeenMin: 9, battery: 17 },
};

export function buildSensors(): Sensor[] {
  const rnd = mulberry32(314);
  const zones: ZoneId[] = ["A", "B", "C", "D"];
  const out: Sensor[] = [];

  const add = (
    id: string,
    type: Sensor["type"],
    zone: ZoneId,
    location: Sensor["location"],
    value: number,
    unit: string,
    powered: boolean,
  ) => {
    const o = OVERRIDES[id];
    const status: SensorStatus = o?.status ?? "online";
    out.push({
      id,
      type,
      zone,
      location,
      status,
      lastSeen: minutesAgo(o?.lastSeenMin ?? Math.floor(1 + rnd() * 9)),
      batteryPct: powered ? null : (o?.battery ?? Math.round(45 + rnd() * 50)),
      value: status === "offline" ? null : value,
      unit,
      source: "simulated",
    });
  };

  const r1 = (n: number) => Math.round(n * 10) / 10;

  for (const z of zones) {
    add(`FM-${z}-IN`, "flow", z, L("Zone inlet meter", "Mita ya kuingilia eneo"), Math.round(38 + rnd() * 30), "L/min", true);
    add(`PS-${z}-01`, "pressure", z, L("Zone inlet", "Mlango wa eneo"), r1(2.4 + rnd() * 0.8), "bar", false);
    add(`PS-${z}-02`, "pressure", z, L("Tail end of network", "Mwisho wa mtandao"), r1(1.6 + rnd() * 0.9), "bar", false);
    add(`SM-${z}-01`, "soil_moisture", z, L("Demo plot 1", "Shamba la mfano 1"), Math.round(42 + rnd() * 25), "%", false);
    add(`SM-${z}-02`, "soil_moisture", z, L("Demo plot 2", "Shamba la mfano 2"), Math.round(38 + rnd() * 25), "%", false);
  }
  add("FM-B-02", "flow", "B", L("Lateral L-B3", "Bomba tawi L-B3"), 21, "L/min", true);
  add("FM-C-02", "flow", "C", L("Trunk main to Zone C", "Bomba kuu kwenda Eneo C"), 64, "L/min", true);
  add("TL-01", "tank_level", "A", L("Kasyala Tank 1", "Tanki la Kasyala 1"), 74, "%", true);
  add("TL-02", "tank_level", "B", L("Kasyala Tank 2", "Tanki la Kasyala 2"), 67, "%", true);

  // The farmer view shows Block A at 71% — keep the demo plot consistent.
  const blockA = out.find((s) => s.id === "SM-B-01");
  if (blockA) {
    blockA.location = L("Plot B-17, Block A", "Plot B-17, Kipande A");
    blockA.value = 71;
  }
  return out;
}

// ---------- zones & network ----------
interface ZoneDef {
  id: ZoneId;
  name: ZoneStat["name"];
  farms: number;
  inflow: number;
  lossPct: number;
  pressure: number;
}

const ZONE_DEFS: ZoneDef[] = [
  { id: "A", name: L("Upper Kasyala", "Kasyala ya Juu"), farms: 38, inflow: 96_000, lossPct: 14.2, pressure: 2.9 },
  { id: "B", name: L("Kasyala Central", "Kasyala ya Kati"), farms: 52, inflow: 138_000, lossPct: 31.5, pressure: 2.2 },
  { id: "C", name: L("Lowlands", "Nyanda za Chini"), farms: 44, inflow: 118_000, lossPct: 27.8, pressure: 2.0 },
  { id: "D", name: L("Ridge", "Kilima"), farms: 31, inflow: 74_000, lossPct: 12.6, pressure: 2.7 },
];

export function buildZones(sensors: Sensor[]): ZoneStat[] {
  return ZONE_DEFS.map((z) => {
    const mine = sensors.filter((s) => s.zone === z.id);
    const loss = Math.round(z.inflow * (z.lossPct / 100));
    return {
      id: z.id,
      name: z.name,
      farms: z.farms,
      inflowLitres24h: z.inflow,
      consumedLitres24h: z.inflow - loss,
      lossLitres24h: loss,
      lossPct: z.lossPct,
      avgPressureBar: z.pressure,
      sensorsOnline: mine.filter((s) => s.status !== "offline").length,
      sensorsTotal: mine.length,
      source: "simulated",
    };
  });
}

export function buildNetworkOverview(zones: ZoneStat[]): NetworkOverview {
  const inflow = zones.reduce((s, z) => s + z.inflowLitres24h, 0);
  const consumed = zones.reduce((s, z) => s + z.consumedLitres24h, 0);
  const loss = inflow - consumed;
  return {
    inflowLitres24h: inflow,
    consumedLitres24h: consumed,
    lossLitres24h: loss,
    lossPct: Math.round((loss / inflow) * 1000) / 10,
    targetLossPct: TARGET_LOSS_PCT,
    tanks: [
      { id: "t1", name: "Kasyala Tank 1", levelLitres: Math.round(400_000 * 0.74), capacityLitres: 400_000 },
      { id: "t2", name: "Kasyala Tank 2", levelLitres: Math.round(TANK_CAPACITY * 0.67), capacityLitres: TANK_CAPACITY },
    ],
    lastUpdated: new Date().toISOString(),
    source: "simulated",
  };
}

export function buildWaterBalance(overview: NetworkOverview): BalancePoint[] {
  const rnd = mulberry32(58);
  const today = new Date();
  const pts: BalancePoint[] = [];
  for (let i = -29; i <= 0; i++) {
    const d = addDays(today, i);
    let inflow = Math.round(overview.inflowLitres24h * (0.93 + rnd() * 0.12));
    // Loss crept up over the last few days (a simulated leak developing).
    const ramp = i >= -5 ? (i + 5) * 0.9 : 0;
    let lossPct = Math.round((16.5 + rnd() * 2.5 + ramp) * 10) / 10;
    let consumed = Math.round(inflow * (1 - lossPct / 100));
    if (i === 0) {
      inflow = overview.inflowLitres24h;
      consumed = overview.consumedLitres24h;
      lossPct = overview.lossPct;
    }
    pts.push({
      date: ymd(d),
      label: d.toLocaleDateString("en-KE", { day: "numeric", month: "short" }),
      inflowLitres: inflow,
      consumedLitres: consumed,
      lossPct,
    });
  }
  return pts;
}

// ---------- leak detections (demo rules) ----------
export function buildDetections(): LeakDetection[] {
  return [
    {
      id: "det-1",
      zone: "B",
      segment: L("Lateral L-B3, near the Block A offtake", "Bomba tawi L-B3, karibu na Kipande A"),
      signal: L("Night flow 3.1× the usual baseline", "Mtiririko wa usiku mara 3.1 ya kawaida"),
      detectedAt: minutesAgo(4400),
      estLossLitresPerDay: 5400,
      confidence: 0.86,
      status: "converted",
      incidentId: "ISS-1042",
      generatedBy: "mock-rules",
    },
    {
      id: "det-2",
      zone: "C",
      segment: L("Trunk main between Tank 2 and the Zone C inlet", "Bomba kuu kati ya Tanki 2 na Eneo C"),
      signal: L("Pressure falls while flow rises after 22:00", "Shinikizo linashuka mtiririko ukipanda baada ya saa 22:00"),
      detectedAt: minutesAgo(380),
      estLossLitresPerDay: 9800,
      confidence: 0.78,
      status: "new",
      generatedBy: "mock-rules",
    },
    {
      id: "det-3",
      zone: "A",
      segment: L("Tank 1 overflow line", "Bomba la kufurika la Tanki 1"),
      signal: L("Level drops 2% overnight with no scheduled draw-off", "Kiwango kinashuka 2% usiku bila matumizi yaliyopangwa"),
      detectedAt: minutesAgo(1500),
      estLossLitresPerDay: 3200,
      confidence: 0.71,
      status: "investigating",
      generatedBy: "mock-rules",
    },
    {
      id: "det-4",
      zone: "D",
      segment: L("Standpipe SP-31 area", "Eneo la bomba la umma SP-31"),
      signal: L("Flow continues when no taps are open", "Maji yanaendelea kutiririka bila koki wazi"),
      detectedAt: minutesAgo(760),
      estLossLitresPerDay: 2100,
      confidence: 0.64,
      status: "new",
      generatedBy: "mock-rules",
    },
    {
      id: "det-5",
      zone: "C",
      segment: L("Lateral L-C7", "Bomba tawi L-C7"),
      signal: L("Zone meter reads 12% above the sum of farm meters", "Mita ya eneo inasoma 12% juu ya jumla ya mita za mashamba"),
      detectedAt: minutesAgo(2900),
      estLossLitresPerDay: 4300,
      confidence: 0.55,
      status: "new",
      generatedBy: "mock-rules",
    },
  ];
}

// ---------- other farmers' / sensor incidents ----------
type Seed = Omit<Issue, "timeline"> & { timeline: Issue["timeline"] };

const rep = (id: string, name: string, plot: string) => ({ id, name, plot });
const sub = L("Submitted by farmer", "Imetumwa na mkulima");

export function buildOtherIssues(): Issue[] {
  const list: Seed[] = [
    {
      id: "ISS-1053",
      type: "low_pressure",
      severity: "high",
      location: "lateral",
      locationDetail: "Sensor PS-C-02 (tail end)",
      description: "Pressure at the tail-end sensor PS-C-02 has stayed below 1.2 bar for 40 minutes.",
      status: "reported",
      createdAt: minutesAgo(90),
      updatedAt: minutesAgo(90),
      zone: "C",
      origin: "sensor",
      timeline: [{ status: "reported", at: minutesAgo(90), note: L("Raised automatically by a pressure threshold rule (demo).", "Imeanzishwa kiotomatiki na kanuni ya kiwango cha shinikizo (mfano).") }],
    },
    {
      id: "ISS-1052",
      type: "low_pressure",
      severity: "medium",
      location: "lateral",
      description: "Water is very weak in the afternoons, hardly enough to fill the drums.",
      status: "reported",
      createdAt: minutesAgo(55),
      updatedAt: minutesAgo(55),
      zone: "B",
      origin: "farmer",
      reporter: rep("farmer-0522", "Lucy Wayua", "Plot B-22"),
      timeline: [{ status: "reported", at: minutesAgo(55), note: sub, by: "Lucy Wayua" }],
    },
    {
      id: "ISS-1049",
      type: "leak",
      severity: "medium",
      location: "tank",
      locationDetail: "Tank 1 overflow line",
      description: "Overflow line is dripping continuously even when the tank is not full.",
      status: "in_progress",
      createdAt: minutesAgo(2600),
      updatedAt: minutesAgo(240),
      assignedTo: "A. Nzioka",
      zone: "A",
      origin: "sensor",
      timeline: [
        { status: "reported", at: minutesAgo(2600), note: L("Raised from tank-level anomaly (demo).", "Imeanzishwa kutokana na hitilafu ya kiwango cha tanki (mfano).") },
        { status: "acknowledged", at: minutesAgo(2550), by: "P. Kioko" },
        { status: "technician_assigned", at: minutesAgo(2400), note: L("Assigned to A. Nzioka.", "Amepangiwa A. Nzioka."), by: "P. Kioko" },
        { status: "in_progress", at: minutesAgo(240), note: L("Float valve being replaced.", "Valvu ya kuelea inabadilishwa."), by: "A. Nzioka" },
      ],
    },
    {
      id: "ISS-1048",
      type: "leak",
      severity: "low",
      location: "field",
      locationDetail: "Drip line near the borehole path",
      description: "A small spray from the drip line joint, I fixed it temporarily with tape.",
      status: "reported",
      createdAt: minutesAgo(40),
      updatedAt: minutesAgo(40),
      zone: "D",
      origin: "farmer",
      reporter: rep("farmer-0931", "Esther Mutheu", "Plot D-09"),
      timeline: [{ status: "reported", at: minutesAgo(40), note: sub, by: "Esther Mutheu" }],
    },
    {
      id: "ISS-1047",
      type: "shortage",
      severity: "high",
      location: "inlet",
      description: "No water at all since yesterday evening. Tomato seedlings are wilting.",
      status: "reported",
      createdAt: minutesAgo(190),
      updatedAt: minutesAgo(190),
      zone: "C",
      origin: "farmer",
      reporter: rep("farmer-0304", "Peter Musyoka", "Plot C-04"),
      timeline: [{ status: "reported", at: minutesAgo(190), note: sub, by: "Peter Musyoka" }],
    },
    {
      id: "ISS-1046",
      type: "low_pressure",
      severity: "medium",
      location: "lateral",
      description: "Pressure is low from mid-morning, the sprinklers do not reach the far rows.",
      status: "acknowledged",
      createdAt: minutesAgo(380),
      updatedAt: minutesAgo(330),
      zone: "C",
      origin: "farmer",
      reporter: rep("farmer-0611", "Grace Ndunge", "Plot C-11"),
      timeline: [
        { status: "reported", at: minutesAgo(380), note: sub, by: "Grace Ndunge" },
        { status: "acknowledged", at: minutesAgo(330), note: L("Possibly linked to the Zone C trunk main.", "Huenda inahusiana na bomba kuu la Eneo C."), by: "G. Mwikali" },
      ],
    },
    {
      id: "ISS-1045",
      type: "shortage",
      severity: "medium",
      location: "inlet",
      description: "Supply came for only 30 minutes this morning instead of the usual 4 hours.",
      status: "in_progress",
      createdAt: minutesAgo(1200),
      updatedAt: minutesAgo(180),
      assignedTo: "G. Mwikali",
      zone: "D",
      origin: "farmer",
      reporter: rep("farmer-0715", "Daniel Mwanzia", "Plot D-15"),
      timeline: [
        { status: "reported", at: minutesAgo(1200), note: sub, by: "Daniel Mwanzia" },
        { status: "acknowledged", at: minutesAgo(1100), by: "A. Nzioka" },
        { status: "technician_assigned", at: minutesAgo(900), note: L("Assigned to G. Mwikali.", "Amepangiwa G. Mwikali."), by: "A. Nzioka" },
        { status: "in_progress", at: minutesAgo(180), note: L("Checking the zone inlet valve setting.", "Inakagua mpangilio wa valvu ya kuingilia eneo."), by: "G. Mwikali" },
      ],
    },
    {
      id: "ISS-1044",
      type: "leak",
      severity: "medium",
      location: "standpipe",
      locationDetail: "Standpipe SP-22",
      description: "The tap at SP-22 does not close fully and water keeps running.",
      status: "technician_assigned",
      createdAt: minutesAgo(2900),
      updatedAt: minutesAgo(1900),
      assignedTo: "P. Kioko",
      zone: "C",
      origin: "farmer",
      reporter: rep("farmer-0202", "Samuel Kilonzo", "Plot C-02"),
      timeline: [
        { status: "reported", at: minutesAgo(2900), note: sub, by: "Samuel Kilonzo" },
        { status: "acknowledged", at: minutesAgo(2800), by: "J. Mutua" },
        { status: "technician_assigned", at: minutesAgo(1900), note: L("Assigned to P. Kioko.", "Amepangiwa P. Kioko."), by: "J. Mutua" },
      ],
    },
    {
      id: "ISS-1040",
      type: "low_pressure",
      severity: "medium",
      location: "standpipe",
      locationDetail: "Standpipe SP-31",
      description: "Only a trickle at the standpipe after 6 pm.",
      status: "resolved",
      createdAt: minutesAgo(7400),
      updatedAt: minutesAgo(6200),
      assignedTo: "A. Nzioka",
      zone: "D",
      origin: "farmer",
      reporter: rep("farmer-0828", "Mercy Katumbi", "Plot D-28"),
      timeline: [
        { status: "reported", at: minutesAgo(7400), note: sub, by: "Mercy Katumbi" },
        { status: "acknowledged", at: minutesAgo(7300), by: "A. Nzioka" },
        { status: "technician_assigned", at: minutesAgo(7200), by: "A. Nzioka" },
        { status: "in_progress", at: minutesAgo(6600), by: "A. Nzioka" },
        { status: "resolved", at: minutesAgo(6200), note: L("Blocked strainer cleaned; pressure back to normal.", "Kichujio kilichoziba kimesafishwa; shinikizo limerudi kawaida."), by: "A. Nzioka" },
      ],
    },
    {
      id: "ISS-1039",
      type: "leak",
      severity: "high",
      location: "lateral",
      locationDetail: "Lateral L-A2",
      description: "Pipe burst near the road crossing, water flowing into the ditch.",
      status: "resolved",
      createdAt: minutesAgo(8800),
      updatedAt: minutesAgo(8300),
      assignedTo: "P. Kioko",
      zone: "A",
      origin: "farmer",
      reporter: rep("farmer-0108", "John Kyalo", "Plot A-08"),
      timeline: [
        { status: "reported", at: minutesAgo(8800), note: sub, by: "John Kyalo" },
        { status: "acknowledged", at: minutesAgo(8770), by: "P. Kioko" },
        { status: "technician_assigned", at: minutesAgo(8760), by: "P. Kioko" },
        { status: "in_progress", at: minutesAgo(8700), by: "P. Kioko" },
        { status: "resolved", at: minutesAgo(8300), note: L("Burst section replaced with new HDPE pipe.", "Sehemu iliyopasuka imebadilishwa kwa bomba jipya la HDPE."), by: "P. Kioko" },
      ],
    },
  ];
  return list;
}
