import { ViewModeProvider } from "@/contexts/ViewModeContext";
import DashboardShell from "@/components/DashboardShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ViewModeProvider>
      <DashboardShell>{children}</DashboardShell>
    </ViewModeProvider>
  );
}
