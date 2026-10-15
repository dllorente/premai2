"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchPromos, submitPromoUrl, type PromoType, type Promo } from "@/lib/promos";

const FILTERS: { label: string; value: PromoType | undefined }[] = [
  { label: "Todas", value: undefined },
  { label: "Sorteos", value: "social" },
  { label: "Gratis", value: "free" },
  { label: "Cashback", value: "purchase" },
];

const TYPE_CONFIG: Record<PromoType, { label: string; color: string; bg: string }> = {
  social:   { label: "Sorteo",   color: "#7C3AED", bg: "rgba(124,58,237,0.1)" },
  free:     { label: "Gratis",   color: "#059669", bg: "rgba(5,150,105,0.1)" },
  purchase: { label: "Cashback", color: "#D97706", bg: "rgba(217,119,6,0.1)" },
};

function PromoCard({ promo }: { promo: Promo }) {
  const typeConf = promo.promo_type ? TYPE_CONFIG[promo.promo_type] : null;
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: "16px",
      marginBottom: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {promo.brand && (
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--primary)", margin: "0 0 3px", letterSpacing: ".05em", textTransform: "uppercase" }}>
              {promo.brand}
            </p>
          )}
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", margin: 0, lineHeight: 1.3 }}>
            {promo.title}
          </p>
        </div>
        {typeConf && (
          <span style={{
            flexShrink: 0,
            background: typeConf.bg,
            color: typeConf.color,
            borderRadius: 20,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 700,
          }}>
            {typeConf.label}
          </span>
        )}
      </div>

      {promo.prize_description && (
        <p style={{ fontSize: 12, color: "var(--text-3)", margin: "0 0 10px", lineHeight: 1.5 }}>
          {promo.prize_description}
        </p>
      )}

      {promo.end_date && (
        <p style={{ fontSize: 11, color: "var(--text-3)", margin: "0 0 10px" }}>
          Hasta {new Date(promo.end_date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}

      <a
        href={promo.participation_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          background: "var(--primary)",
          color: "white",
          borderRadius: 8,
          padding: "7px 16px",
          fontSize: 12,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Participar →
      </a>
    </div>
  );
}

export default function PromosPage() {
  const [activeFilter, setActiveFilter] = useState<PromoType | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [brand, setBrand] = useState("");
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const { data: promos, isLoading } = useQuery({
    queryKey: ["promos", activeFilter],
    queryFn: () => fetchPromos(activeFilter),
  });

  const mutation = useMutation({
    mutationFn: () => submitPromoUrl(url.trim(), brand.trim() || undefined),
    onSuccess: (data) => {
      setResult({
        ok: true,
        msg: data.already_existed
          ? "Esta URL ya estaba en nuestro sistema."
          : "URL enviada. La estamos analizando en segundo plano.",
      });
      setUrl("");
      setBrand("");
    },
    onError: () => {
      setResult({ ok: false, msg: "URL no válida o error al enviar. Revisa el formato." });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setResult(null);
    mutation.mutate();
  };

  const closeModal = () => {
    setModalOpen(false);
    setResult(null);
    setUrl("");
    setBrand("");
  };

  return (
    <div style={{ padding: "24px 16px", maxWidth: 480, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 800, fontSize: 22, color: "var(--text-1)", margin: "0 0 4px" }}>
          Promos activas
        </p>
        <p style={{ color: "var(--text-3)", fontSize: 13, margin: 0 }}>
          Descuentos y cashback detectados automáticamente
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
        {FILTERS.map((f) => {
          const active = activeFilter === f.value;
          return (
            <button
              key={f.label}
              onClick={() => setActiveFilter(f.value)}
              style={{
                flexShrink: 0,
                padding: "6px 14px",
                borderRadius: 20,
                border: "1px solid",
                borderColor: active ? "var(--primary)" : "var(--border)",
                background: active ? "var(--primary)" : "transparent",
                color: active ? "white" : "var(--text-2)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Discovery CTA */}
      <div style={{
        background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
        borderRadius: 16,
        padding: "16px 20px",
        marginBottom: 16,
        color: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>¿Conoces una promo?</p>
          <p style={{ fontSize: 11, margin: 0, opacity: 0.8 }}>Envía la URL y la analizamos con IA</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            flexShrink: 0,
            background: "white",
            color: "#4F46E5",
            border: "none",
            borderRadius: 8,
            padding: "7px 14px",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          + Sugerir
        </button>
      </div>

      {/* Promo list */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)", fontSize: 13 }}>
          Cargando promos…
        </div>
      ) : promos && promos.length > 0 ? (
        promos.map((p) => <PromoCard key={p.id} promo={p} />)
      ) : (
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "32px 24px",
          textAlign: "center",
        }}>
          <p style={{ fontSize: 36, marginBottom: 10 }}>🤖</p>
          <p style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text-1)", margin: "0 0 6px" }}>
            Buscando promos nuevas…
          </p>
          <p style={{ color: "var(--text-3)", fontSize: 13, lineHeight: 1.5 }}>
            El agente escanea la web continuamente. Las promos aparecerán aquí en cuanto las detectemos.
          </p>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          onClick={closeModal}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--bg-card)", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 480 }}
          >
            <div style={{ width: 40, height: 4, background: "var(--border)", borderRadius: 2, margin: "0 auto 20px" }} />

            <p style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 800, fontSize: 18, color: "var(--text-1)", margin: "0 0 4px" }}>
              Sugerir una promo
            </p>
            <p style={{ color: "var(--text-3)", fontSize: 13, margin: "0 0 20px" }}>
              Pega la URL de la web de la promoción y la analizamos automáticamente.
            </p>

            {result?.ok ? (
              <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
                <p style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text-1)", margin: "0 0 8px" }}>
                  Estamos analizando tu promo
                </p>
                <p style={{ fontSize: 13, color: "var(--text-3)", margin: "0 0 24px", lineHeight: 1.5 }}>
                  La IA está leyendo la página y las bases legales. Te avisaremos cuando esté lista.
                </p>
                <button onClick={closeModal} style={{ width: "100%", background: "var(--bg)", color: "var(--text-1)", border: "1px solid var(--border)", borderRadius: 12, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>URL de la promo *</label>
                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.marca.es/promocion-verano" required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-1)", fontSize: 14, marginBottom: 12, boxSizing: "border-box" }} />

                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>Marca (opcional)</label>
                <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ej: Danone, Nestlé, Coca-Cola…"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-1)", fontSize: 14, marginBottom: 16, boxSizing: "border-box" }} />

                {result && (
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(244,63,94,0.1)", color: "#F43F5E", fontSize: 13, marginBottom: 12, fontWeight: 500 }}>
                    {result.msg}
                  </div>
                )}

                <button type="submit" disabled={mutation.isPending || !url.trim()}
                  style={{ width: "100%", background: "#4F46E5", color: "white", border: "none", borderRadius: 12, padding: "13px", fontWeight: 700, fontSize: 15, cursor: mutation.isPending ? "not-allowed" : "pointer", opacity: mutation.isPending ? 0.7 : 1 }}>
                  {mutation.isPending ? "Enviando…" : "Enviar URL"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
