export default function PromosPage() {
  return (
    <div style={{ padding: "24px 16px" }}>
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 40, marginBottom: 12 }}>🎁</p>
        <p
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontWeight: 700,
            fontSize: 20,
            color: "var(--text-1)",
            marginBottom: 8,
          }}
        >
          Promos activas
        </p>
        <p style={{ color: "var(--text-3)", fontSize: 14 }}>
          Próximamente — Sprint 3
        </p>
      </div>
    </div>
  );
}
