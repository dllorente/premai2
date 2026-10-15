"use client";

import { useState } from "react";

const FAQ = [
  {
    q: "¿Cómo funciona el OCR?",
    a: "Subes una foto del ticket y nuestra IA (Claude) extrae automáticamente productos, marcas, importes y fecha. El proceso tarda entre 3 y 10 segundos.",
  },
  {
    q: "¿En qué supermercados aplica?",
    a: "En cualquiera: Mercadona, Carrefour, Lidl, Aldi, Dia, Alcampo, El Corte Inglés… Mientras el ticket sea legible, lo procesamos.",
  },
  {
    q: "¿Cuándo cobro el reembolso?",
    a: "Cada promo tiene su propio proceso de reembolso. El plazo habitual es de 4 a 8 semanas desde la validación de la participación.",
  },
  {
    q: "¿Es gratis usar PremAI2?",
    a: "Sí, completamente gratis. Ganamos cuando las marcas pagan por sus campañas. Tú no pagas nada.",
  },
  {
    q: "¿Qué tipo de promos detecta?",
    a: "Cashback, reembolso 100% (GRATIS), sorteos con ticket, muestras gratuitas y descuentos directos. El agente de búsqueda escanea internet continuamente para añadir nuevas.",
  },
  {
    q: "¿Puedo sugerir una promo?",
    a: "Sí. En la pantalla de Promos hay un botón «+ Sugerir promo» — pega la URL y la analizamos automáticamente con IA.",
  },
];

export default function AjustesPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div style={{ padding: "24px 16px", maxWidth: 480, margin: "0 auto" }}>
      <p style={{
        fontFamily: "var(--font-syne), sans-serif",
        fontWeight: 800, fontSize: 22,
        color: "var(--text-1)", margin: "0 0 4px",
      }}>
        Ajustes y ayuda
      </p>
      <p style={{ color: "var(--text-3)", fontSize: 13, margin: "0 0 28px" }}>
        Preguntas frecuentes sobre PremAI2
      </p>

      {FAQ.map((item, i) => (
        <div
          key={i}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            marginBottom: 8,
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: "100%", textAlign: "left",
              padding: "14px 16px",
              background: "none", border: "none", cursor: "pointer",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>
              {item.q}
            </span>
            <span style={{
              fontSize: 18, color: "var(--primary)", flexShrink: 0,
              display: "inline-block",
              transform: open === i ? "rotate(45deg)" : "none",
              transition: "transform .2s",
            }}>
              +
            </span>
          </button>
          {open === i && (
            <div style={{
              padding: "0 16px 16px",
              fontSize: 13, color: "var(--text-3)", lineHeight: 1.6,
            }}>
              {item.a}
            </div>
          )}
        </div>
      ))}

      <div style={{
        marginTop: 28,
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "16px",
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", margin: "0 0 8px", letterSpacing: ".05em" }}>
          VERSIÓN
        </p>
        <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0 }}>
          PremAI2 · Sprint 3.7 · Octubre 2026
        </p>
      </div>
    </div>
  );
}
