import type { ReactNode } from "react";
import { TechnicianShell } from "@/components/technician/TechnicianShell";
import { TechnicianDataProvider } from "@/lib/state/TechnicianDataContext";

// All technician routes live under /technician/*, mirroring /farmer/*.
export default function TechnicianLayout({ children }: { children: ReactNode }) {
  return (
    <TechnicianDataProvider>
      <TechnicianShell>{children}</TechnicianShell>
    </TechnicianDataProvider>
  );
}
