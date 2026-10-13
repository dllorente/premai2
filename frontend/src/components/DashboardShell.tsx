"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useViewMode } from "@/contexts/ViewModeContext";

const NAV_LINKS = [
  { href: "/inicio", label: "Inicio" },
  { href: "/promos", label: "Promos" },
  { href: "/tickets", label: "Tickets" },
  { href: "/perfil", label: "Perfil" },
  { href: "/ajustes", label: "Ajustes" },
];

function TopNav() {
  const pathname = usePathname();
  return (
    <header
      style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
        padding: "0 32px",
        height: 56,
        display: "flex",
        alignItems: "center",
        gap: 32,
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <span
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 800,
          fontSize: 16,
          color: "var(--primary)",
          marginRight: 8,
          flexShrink: 0,
        }}
      >
        PremAI
      </span>
      {NAV_LINKS.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== "/inicio" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              fontSize: 13,
              fontWeight: active ? 700 : 500,
              color: active ? "var(--primary)" : "var(--text-2)",
              textDecoration: "none",
              padding: "4px 0",
              borderBottom: active
                ? "2px solid var(--primary)"
                : "2px solid transparent",
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </header>
  );
}

function InlineBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      style={{
        height: "var(--nav-h)",
        background: "var(--bg-card)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 4px 8px",
        boxShadow: "0 -4px 20px rgba(18,22,58,.06)",
        flexShrink: 0,
        zIndex: 20,
        position: "relative",
      }}
    >
      {NAV_LINKS.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== "/inicio" && pathname.startsWith(link.href));
        const isTicket = link.href === "/tickets";
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: isTicket ? "0 4px" : "8px 4px",
              textDecoration: "none",
            }}
          >
            {isTicket ? (
              <div
                style={{
                  width: 46,
                  height: 46,
                  marginTop: -18,
                  background:
                    "linear-gradient(135deg, var(--primary), var(--secondary))",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(79,70,229,.45)",
                  border: "3px solid var(--bg-card)",
                  fontSize: 18,
                }}
              >
                📷
              </div>
            ) : (
              <span style={{ fontSize: 18 }}>
                {link.href === "/inicio" && "🏠"}
                {link.href === "/promos" && "🎁"}
                {link.href === "/perfil" && "👤"}
                {link.href === "/ajustes" && "⋯"}
              </span>
            )}
            <span
              style={{
                fontSize: 10,
                fontWeight: active ? 700 : 600,
                color: active ? "var(--primary)" : "var(--text-3)",
                marginTop: isTicket ? 2 : 0,
              }}
            >
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

const DEVICE_SIZES = [
  { key: "iphone", label: "iPhone", w: 390, h: 844 },
  { key: "android", label: "Android", w: 412, h: 915 },
  { key: "tablet", label: "Tablet", w: 768, h: 1024 },
] as const;

type DeviceKey = (typeof DEVICE_SIZES)[number]["key"];

function DevicePicker({
  current,
  onChange,
}: {
  current: DeviceKey;
  onChange: (k: DeviceKey) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {DEVICE_SIZES.map((d) => (
        <button
          key={d.key}
          onClick={() => onChange(d.key)}
          style={{
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: current === d.key ? "var(--primary)" : "var(--bg-card)",
            color: current === d.key ? "white" : "var(--text-2)",
            cursor: "pointer",
          }}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { mode, toggle } = useViewMode();
  const isWeb = mode === "web";

  // device picker state — only used in app mode
  const [deviceKey, setDeviceKey] = React.useState<DeviceKey>("iphone");
  const device = DEVICE_SIZES.find((d) => d.key === deviceKey)!;

  return (
    <div
      style={{
        background: isWeb ? "var(--bg)" : "#1a1a2e",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Top controls bar ─────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          background: isWeb ? "transparent" : "#12122a",
          borderBottom: isWeb ? "none" : "1px solid rgba(255,255,255,.08)",
          gap: 12,
          flexShrink: 0,
          minHeight: 48,
        }}
      >
        {/* Device picker — only in app mode */}
        {!isWeb && (
          <DevicePicker current={deviceKey} onChange={setDeviceKey} />
        )}
        {isWeb && <span />}

        {/* Toggle button */}
        <button
          onClick={toggle}
          title={isWeb ? "Cambiar a vista App" : "Cambiar a vista Web"}
          style={{
            background: isWeb ? "var(--bg-card)" : "rgba(255,255,255,.1)",
            border: isWeb
              ? "1px solid var(--border)"
              : "1px solid rgba(255,255,255,.2)",
            borderRadius: 20,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: isWeb ? "var(--primary)" : "white",
            flexShrink: 0,
          }}
        >
          {isWeb ? "📱 App" : "🖥️ Web"}
        </button>
      </div>

      {/* ── Web mode ─────────────────────────────────────────── */}
      {isWeb && (
        <>
          <TopNav />
          <main
            style={{
              flex: 1,
              maxWidth: 1080,
              width: "100%",
              margin: "0 auto",
              padding: "0 0 40px",
            }}
          >
            {children}
          </main>
        </>
      )}

      {/* ── App mode — phone frame ────────────────────────────── */}
      {!isWeb && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "16px 16px 32px",
            overflowY: "auto",
          }}
        >
          {/* Phone shell */}
          <div
            style={{
              width: device.w,
              minHeight: device.h,
              background: "var(--bg)",
              borderRadius: 44,
              border: "8px solid #2a2a4a",
              boxShadow:
                "0 0 0 2px #3a3a6a, 0 32px 80px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,255,255,.05)",
              overflow: "hidden",
              position: "relative",
              flexShrink: 0,
            }}
          >
            {/* Notch */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 120,
                height: 28,
                background: "#2a2a4a",
                borderRadius: "0 0 20px 20px",
                zIndex: 100,
              }}
            />

            {/* Inner flex column: scroll area + inline bottom nav */}
            <div
              style={{
                height: device.h - 16,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Scrollable content */}
              <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
                <main style={{ paddingTop: 28, paddingBottom: 16 }}>{children}</main>
              </div>

              {/* Inline bottom nav — replaces position:fixed inside the frame */}
              <InlineBottomNav />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// lazy import React for useState (Next.js "use client" already has it in scope)
import React from "react";
