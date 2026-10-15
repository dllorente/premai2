"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";

const NAV_LINKS = [
  { href: "/dashboard", label: "Inicio" },
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
        padding: "0 40px",
        height: 64,
        display: "flex",
        alignItems: "center",
        gap: 40,
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 1px 12px rgba(18,22,58,.08)",
      }}
    >
      <span
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 800,
          fontSize: 18,
          color: "var(--primary)",
          marginRight: 16,
          flexShrink: 0,
          letterSpacing: "-.02em",
        }}
      >
        PremAI2
      </span>
      {NAV_LINKS.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== "/dashboard" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              fontSize: 14,
              fontWeight: active ? 700 : 500,
              color: active ? "var(--primary)" : "var(--text-2)",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: 8,
              background: active ? "rgba(79,70,229,0.08)" : "transparent",
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </header>
  );
}

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Desktop top nav — hidden on mobile via CSS */}
      <div className="desktop-only">
        <TopNav />
      </div>

      <main
        style={{
          minHeight: "100dvh",
          paddingBottom: "var(--nav-h)",
        }}
        className="main-content"
      >
        {children}
      </main>

      {/* Mobile bottom nav — hidden on desktop via CSS */}
      <div className="mobile-only">
        <BottomNav />
      </div>

      <style>{`
        .desktop-only { display: none; }
        .mobile-only  { display: block; }
        .main-content { padding-bottom: var(--nav-h); }

        @media (min-width: 768px) {
          .desktop-only { display: block; }
          .mobile-only  { display: none; }
          .main-content { padding-bottom: 0; max-width: 1200px; margin: 0 auto; padding: 0 32px; }
        }
      `}</style>
    </>
  );
}

import React from "react";
