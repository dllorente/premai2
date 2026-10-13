import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import BottomNav from "@/components/BottomNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) redirect("/login");

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
