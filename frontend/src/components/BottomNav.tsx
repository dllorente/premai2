"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/inicio",
    label: "Inicio",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
          stroke={active ? "var(--primary)" : "var(--text-3)"}
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M8 20v-7h6v7"
          stroke={active ? "var(--primary)" : "var(--text-3)"}
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/promos",
    label: "Promos",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect
          x="2" y="5" width="18" height="14" rx="2"
          stroke={active ? "var(--primary)" : "var(--text-3)"}
          strokeWidth="1.7"
        />
        <path
          d="M15 2v6M7 2v6M2 10h18"
          stroke={active ? "var(--primary)" : "var(--text-3)"}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/tickets",
    label: "Ticket",
    primary: true,
    icon: (_active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="5" width="16" height="12" rx="2" stroke="white" strokeWidth="1.7" />
        <circle cx="11" cy="11" r="3" stroke="white" strokeWidth="1.7" />
        <circle cx="16.5" cy="6.5" r="1" fill="white" />
      </svg>
    ),
  },
  {
    href: "/perfil",
    label: "Perfil",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle
          cx="11" cy="8" r="4"
          stroke={active ? "var(--primary)" : "var(--text-3)"}
          strokeWidth="1.7"
        />
        <path
          d="M3 20c0-4 3.6-7 8-7s8 3 8 7"
          stroke={active ? "var(--primary)" : "var(--text-3)"}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/ajustes",
    label: "Más",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="5" r="1.5" fill={active ? "var(--primary)" : "var(--text-3)"} />
        <circle cx="11" cy="11" r="1.5" fill={active ? "var(--primary)" : "var(--text-3)"} />
        <circle cx="11" cy="17" r="1.5" fill={active ? "var(--primary)" : "var(--text-3)"} />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "var(--nav-h)",
        background: "var(--bg-card)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 4px 8px",
        boxShadow: "0 -4px 20px rgba(18,22,58,.06)",
        zIndex: 50,
      }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href || (tab.href !== "/inicio" && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              padding: tab.primary ? "0 4px" : "8px 4px",
              textDecoration: "none",
            }}
          >
            {tab.primary ? (
              <div
                style={{
                  width: 50,
                  height: 50,
                  marginTop: -20,
                  background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(79,70,229,.45)",
                  border: "3px solid var(--bg-card)",
                }}
              >
                {tab.icon(active)}
              </div>
            ) : (
              tab.icon(active)
            )}
            <span
              style={{
                fontSize: 10,
                fontWeight: active ? 700 : 600,
                color: active ? "var(--primary)" : "var(--text-3)",
                marginTop: tab.primary ? 2 : 0,
              }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
