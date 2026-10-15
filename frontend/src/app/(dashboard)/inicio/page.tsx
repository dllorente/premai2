const promos = [
  {
    brand: "COCA-COLA",
    title: "Verano Coca-Cola",
    subtitle: "× 1000 premios",
    desc: "Sube 2 tickets con Coca-Cola · Gana viajes a Ibiza",
    progress: 1,
    total: 2,
    gradient: "linear-gradient(135deg, #E61C24 0%, #8B0000 100%)",
    badge: "🔥 Termina en 3 días",
    badgeBg: "rgba(255,255,255,.2)",
    cta: "Participar",
    ctaBg: "white",
    ctaColor: "#E61C24",
    progressColor: "#F59E0B",
  },
  {
    brand: "DANONE",
    title: "Vive Sano Danone",
    subtitle: "× 500 premios",
    desc: "3 tickets con yogures · Gana cheques regalo",
    progress: 3,
    total: 3,
    gradient: "linear-gradient(135deg, #005BAB 0%, #003580 100%)",
    badge: "✓ Completada",
    badgeBg: "#34D399",
    cta: "Enviar",
    ctaBg: "#34D399",
    ctaColor: "#003580",
    progressColor: "#34D399",
  },
  {
    brand: "NESTLÉ",
    title: "Nestlé Contigo",
    subtitle: "× 200 premios",
    desc: "1 ticket con Nestlé · Gana experiencias",
    progress: 0,
    total: 1,
    gradient: "linear-gradient(135deg, #7B3F9E 0%, #4A1570 100%)",
    badge: "🆕 Nueva",
    badgeBg: "rgba(255,255,255,.2)",
    cta: "Ver",
    ctaBg: "rgba(255,255,255,.2)",
    ctaColor: "white",
    progressColor: "rgba(255,255,255,.4)",
  },
];

export default function InicioPage() {
  return (
    <div>
      {/* Header */}
      <div
        style={{
          background: "var(--primary)",
          padding: "16px 20px 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <p style={{ color: "rgba(255,255,255,.7)", fontSize: 12, marginBottom: 2 }}>
              Buenos días
            </p>
            <p
              style={{
                color: "white",
                fontSize: 18,
                fontWeight: 700,
                fontFamily: "var(--font-display, Syne, sans-serif)",
              }}
            >
              PremAI2 👋
            </p>
          </div>
          <div
            style={{
              width: 42,
              height: 42,
              background: "rgba(255,255,255,.2)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              color: "white",
              fontWeight: 700,
            }}
          >
            P
          </div>
        </div>

        {/* Points */}
        <div
          style={{
            background: "rgba(255,255,255,.15)",
            borderRadius: 16,
            padding: "14px 16px",
          }}
        >
          <p
            style={{
              color: "rgba(255,255,255,.8)",
              fontSize: 11,
              marginBottom: 4,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            Tus puntos
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <p
              style={{
                color: "white",
                fontSize: 32,
                fontWeight: 800,
                lineHeight: 1,
                fontFamily: "var(--font-display, Syne, sans-serif)",
              }}
            >
              2.840
            </p>
            <p style={{ color: "#34D399", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              +180 esta semana
            </p>
          </div>
        </div>
      </div>

      {/* Promos */}
      <div style={{ padding: "16px 16px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <p
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text-1)",
              fontFamily: "Syne, sans-serif",
            }}
          >
            Promos activas
          </p>
          <p style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>Ver todas →</p>
        </div>

        {promos.map((p) => (
          <div
            key={p.brand}
            style={{
              background: p.gradient,
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              color: "white",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: -20,
                bottom: -20,
                width: 100,
                height: 100,
                background: "rgba(255,255,255,.07)",
                borderRadius: "50%",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,.2)",
                  borderRadius: 8,
                  padding: "4px 8px",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".05em",
                }}
              >
                {p.brand}
              </div>
              <div
                style={{
                  background: p.badgeBg,
                  borderRadius: 20,
                  padding: "3px 10px",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {p.badge}
              </div>
            </div>
            <p
              style={{
                fontSize: 16,
                fontWeight: 800,
                fontFamily: "Syne, sans-serif",
                lineHeight: 1.2,
                marginBottom: 6,
              }}
            >
              {p.title}
              <br />
              {p.subtitle}
            </p>
            <p style={{ fontSize: 12, opacity: 0.85, marginBottom: 12 }}>{p.desc}</p>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div>
                <div
                  style={{
                    background: "rgba(255,255,255,.15)",
                    borderRadius: 6,
                    height: 5,
                    width: 140,
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      background: p.progressColor,
                      borderRadius: 6,
                      height: 5,
                      width: p.total > 0 ? (p.progress / p.total) * 140 : 0,
                    }}
                  />
                </div>
                <p style={{ fontSize: 10, opacity: 0.7 }}>
                  {p.progress} de {p.total} tickets subidos
                </p>
              </div>
              <div
                style={{
                  background: p.ctaBg,
                  borderRadius: 20,
                  padding: "6px 14px",
                  color: p.ctaColor,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {p.cta}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cómo funciona */}
      <div style={{ padding: "16px 16px 32px" }}>
        <p style={{
          fontSize: 15, fontWeight: 700, color: "var(--text-1)",
          fontFamily: "Syne, sans-serif", marginBottom: 16,
        }}>
          ¿Cómo funciona?
        </p>
        {[
          { icon: "📸", step: "1", title: "Sube tu ticket", desc: "Haz foto o sube la imagen de cualquier ticket de compra." },
          { icon: "🤖", step: "2", title: "La IA lo analiza", desc: "Nuestro OCR extrae productos, marcas e importes automáticamente." },
          { icon: "🎯", step: "3", title: "Detectamos promos", desc: "Cruzamos tu compra con cientos de promociones activas." },
          { icon: "💰", step: "4", title: "Cobra el reembolso", desc: "Participa en las promos que aplican y recibe el cashback." },
        ].map((s) => (
          <div key={s.step} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40, flexShrink: 0,
              background: "var(--primary)", borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", margin: "0 0 2px" }}>
                {s.step}. {s.title}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0, lineHeight: 1.5 }}>
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
