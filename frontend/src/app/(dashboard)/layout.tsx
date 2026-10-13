import BottomNav from "@/components/BottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <main
        style={{
          paddingBottom: "calc(var(--nav-h) + 8px)",
          minHeight: "100dvh",
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
