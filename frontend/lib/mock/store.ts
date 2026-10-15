/**
 * Shared in-memory "database" for the mock backend.
 *
 * Farmer and technician apps read the SAME incidents, so a report filed in the
 * farmer app appears in the technician queue, and technician actions notify the
 * farmer. A real backend replaces this with a database; the UI is unaffected.
 * State lives in module scope: it survives client-side navigation and resets on
 * a full page refresh.
 */
import type { Issue, Notification } from "@/lib/types";
import { buildIssues } from "./seed";
import { buildOtherIssues } from "./technicianSeed";

interface Store {
  issues: Issue[];
  nextIssueNumber: number;
  /** Notifications waiting for the demo farmer (written by technician actions). */
  farmerInbox: Notification[];
}

let store: Store | null = null;

export function getStore(): Store {
  return (store ??= {
    issues: [...buildIssues(), ...buildOtherIssues()],
    nextIssueNumber: 1060,
    farmerInbox: [],
  });
}

export function nextIssueId(): string {
  return `ISS-${getStore().nextIssueNumber++}`;
}

/** Returns and clears notifications waiting for the demo farmer. */
export function drainFarmerInbox(): Notification[] {
  const s = getStore();
  const items = s.farmerInbox;
  s.farmerInbox = [];
  return items;
}
