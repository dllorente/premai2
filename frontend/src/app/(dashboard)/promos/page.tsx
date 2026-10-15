"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { submitPromoUrl } from "@/lib/promos";

export default function PromosPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [brand, setBrand] = useState("");
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

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
      <div style={{ marginBottom: 24 }}>
        <p style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 800,
          fontSize: 22,
          color: "var(--text-1)",
          margin: "0 0 4px",
        }}>
          Promos activas
        </p>
        <p style={{ color: "var(--text-3)", fontSize: 13, margin: 0 }}>
          Descuentos y cashback detectados automáticamente
        </p>
      </div>

      {/* Discovery CTA */}
      <div style={{
        background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
        borderRadius: 16,
        padding: "20px 20px",
        marginBottom: 20,
        color: "white",
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 4px", opacity: 0.85 }}>
          ¿Conoces una promo que no aparece?
        </p>
        <p style={{ fontSize: 12, margin: "0 0 14px", opacity: 0.75, lineHeight: 1.5 }}>
          Envía la URL y la procesamos automáticamente con IA.
        </p>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            background: "white",
            color: "#4F46E5",
            border: "none",
            borderRadius: 8,
            padding: "8px 18px",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          + Sugerir promo
        </button>
      </div>

      {/* Empty state placeholder */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "32px 24px",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 36, marginBottom: 10 }}>🤖</p>
        <p style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 700,
          fontSize: 16,
          color: "var(--text-1)",
          margin: "0 0 6px",
        }}>
          Buscando promos nuevas…
        </p>
        <p style={{ color: "var(--text-3)", fontSize: 13 }}>
          El agente de descubrimiento escanea la web continuamente.
          Las promos aparecerán aquí en cuanto las detectemos.
        </p>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 50,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-card)",
              borderRadius: "20px 20px 0 0",
              padding: "24px 20px 40px",
              width: "100%",
              maxWidth: 480,
            }}
          >
            {/* Drag handle */}
            <div style={{
              width: 40, height: 4,
              background: "var(--border)",
              borderRadius: 2,
              margin: "0 auto 20px",
            }} />

            <p style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: 18,
              color: "var(--text-1)",
              margin: "0 0 4px",
            }}>
              Sugerir una promo
            </p>
            <p style={{ color: "var(--text-3)", fontSize: 13, margin: "0 0 20px" }}>
              Pega la URL de la web de la promoción y la analizamos automáticamente.
            </p>

            <form onSubmit={handleSubmit}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>
                URL de la promo *
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.marca.es/promocion-verano"
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text-1)",
                  fontSize: 14,
                  marginBottom: 12,
                  boxSizing: "border-box",
                }}
              />

              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>
                Marca (opcional)
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ej: Danone, Nestlé, Coca-Cola…"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text-1)",
                  fontSize: 14,
                  marginBottom: 16,
                  boxSizing: "border-box",
                }}
              />

              {result && (
                <div style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: result.ok ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
                  color: result.ok ? "#10B981" : "#F43F5E",
                  fontSize: 13,
                  marginBottom: 12,
                  fontWeight: 500,
                }}>
                  {result.msg}
                </div>
              )}

              <button
                type="submit"
                disabled={mutation.isPending || !url.trim()}
                style={{
                  width: "100%",
                  background: "#4F46E5",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  padding: "13px",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: mutation.isPending ? "not-allowed" : "pointer",
                  opacity: mutation.isPending ? 0.7 : 1,
                }}
              >
                {mutation.isPending ? "Enviando…" : "Enviar URL"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}