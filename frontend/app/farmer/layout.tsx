import type { ReactNode } from "react";
import { FarmerShell } from "@/components/farmer/FarmerShell";
import { FarmerDataProvider } from "@/lib/state/FarmerDataContext";

// All farmer routes live under /farmer/*. Technician routes will live under
// /technician/* with their own layout, provider and navigation.
export default function FarmerLayout({ children }: { children: ReactNode }) {
  return (
    <FarmerDataProvider>
      <FarmerShell>{children}</FarmerShell>
    </FarmerDataProvider>
  );
}
