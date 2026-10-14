"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTickets, getTicket, uploadTicket, submitFeedback, type Ticket } from "@/lib/tickets";

const STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  valid:      { label: "✓ válido",     bg: "#D1FAE5", color: "#065F46" },
  invalid:    { label: "✗ inválido",   bg: "#FEE2E2", color: "#991B1B" },
  processing: { label: "⏳ leyendo",   bg: "#FEF3C7", color: "#92400E" },
  pending:    { label: "⏳ pendiente", bg: "#FEF3C7", color: "#92400E" },
};

function statusChip(status: string) {
  const s = STATUS_LABEL[status] ?? { label: status, bg: "#F3F4F6", color: "#6B7280" };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, flexShrink: 0 }}>
      {s.label}
    </span>
  );
}

const CONFIDENCE_LABEL: Record<string, string> = { high: "Alta", medium: "Media", low: "Baja" };
const CONFIDENCE_COLOR: Record<string, string> = { high: "#065F46", medium: "#92400E", low: "#991B1B" };
const CONFIDENCE_BG: Record<string, string>    = { high: "#D1FAE5", medium: "#FEF3C7", low: "#FEE2E2" };

function TicketRow({ ticket, onClick }: { ticket: Ticket; onClick: () => void }) {
  const date = ticket.purchased_at
    ? new Date(ticket.purchased_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
    : new Date(ticket.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  const brandSummary = ticket.brands.length > 0 ? ticket.brands.join(", ") : "Sin marcas";
  const amount = ticket.total_amount != null ? `€${ticket.total_amount.toFixed(2)}` : null;
  const isProcessing = ticket.status === "processing" || ticket.status === "pending";

  return (
    <div
      onClick={onClick}
      style={{ background: "var(--bg-card)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 8, boxShadow: "var(--shadow-sm)", cursor: "pointer" }}
    >
      <div style={{ width: 42, height: 42, background: isProcessing ? "linear-gradient(135deg,#FEF3C7,#FDE68A)" : "linear-gradient(135deg,#EEF2FF,#C7D2FE)", borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
        {isProcessing ? "⏳" : "🧾"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 2 }}>
          {ticket.store ?? "Tienda desconocida"}{amount ? ` · ${amount}` : ""}
        </p>
        <p style={{ fontSize: 11, color: "var(--text-3)" }}>{date} · {brandSummary}</p>
        {ticket.matched_promo_title && (
          <p style={{ fontSize: 11, color: "#4F46E5", fontWeight: 600, marginTop: 2 }}>
            🎁 {ticket.matched_promo_title}
          </p>
        )}
      </div>
      {statusChip(ticket.status)}
    </div>
  );
}

function TicketDetail({ ticketId, onClose }: { ticketId: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [voted, setVoted] = useState<"up" | "down" | null>(null);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => getTicket(ticketId),
    refetchInterval: (q) =>
      q.state.data?.status === "pending" || q.state.data?.status === "processing" ? 3000 : false,
  });

  const feedbackMutation = useMutation({
    mutationFn: (vote: "up" | "down") => submitFeedback(ticketId, vote),
    onSuccess: (_, vote) => {
      setVoted(vote);
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const date = ticket?.purchased_at
    ? new Date(ticket.purchased_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    : ticket
    ? new Date(ticket.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg-card)", borderRadius: "24px 24px 0 0", padding: "24px 20px 36px", maxHeight: "85dvh", overflowY: "auto" }}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, background: "var(--border)", borderRadius: 2, margin: "0 auto 20px" }} />

        {isLoading || !ticket ? (
          <p style={{ textAlign: "center", color: "var(--text-3)", padding: 20 }}>Cargando...</p>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)", fontFamily: "Syne, sans-serif" }}>
                  {ticket.store ?? "Tienda desconocida"}
                </p>
                <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>{date}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                {statusChip(ticket.status)}
                {ticket.total_amount != null && (
                  <span style={{ fontSize: 20, fontWeight: 800, color: "var(--primary)" }}>
                    €{ticket.total_amount.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Brands */}
            {ticket.brands.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Marcas detectadas</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ticket.brands.map((b) => (
                    <span key={b} style={{ background: "#EEF2FF", color: "#4338CA", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>{b}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Matched promo */}
            {ticket.matched_promo_title && (
              <div style={{ background: "linear-gradient(135deg,#EEF2FF,#DDE1FF)", borderRadius: 16, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>🎁</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#4338CA", marginBottom: 3 }}>Promoción detectada</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#1E1B4B" }}>{ticket.matched_promo_title}</p>
                </div>
                {ticket.match_confidence && (
                  <span style={{ background: CONFIDENCE_BG[ticket.match_confidence] ?? "#F3F4F6", color: CONFIDENCE_COLOR[ticket.match_confidence] ?? "#6B7280", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20 }}>
                    {CONFIDENCE_LABEL[ticket.match_confidence] ?? ticket.match_confidence}
                  </span>
                )}
              </div>
            )}

            {/* Products */}
            {ticket.products.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                  Productos ({ticket.products.length})
                </p>
                {ticket.products.slice(0, 5).map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                    <p style={{ fontSize: 13, color: "var(--text-1)", flex: 1, marginRight: 8 }}>{p.name}</p>
                    {p.price != null && (
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", flexShrink: 0 }}>€{p.price.toFixed(2)}</p>
                    )}
                  </div>
                ))}
                {ticket.products.length > 5 && (
                  <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>
                    +{ticket.products.length - 5} productos más
                  </p>
                )}
              </div>
            )}

            {/* Feedback */}
            {ticket.status === "valid" && (
              <div style={{ background: "var(--bg-surface)", borderRadius: 14, padding: "14px 16px" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 10, textAlign: "center" }}>
                  ¿Los datos son correctos?
                </p>
                {voted ? (
                  <p style={{ textAlign: "center", fontSize: 13, color: "#065F46", background: "#D1FAE5", borderRadius: 10, padding: "8px 12px" }}>
                    {voted === "up" ? "👍 ¡Gracias por confirmar!" : "👎 Lo anotamos para mejorar"}
                  </p>
                ) : (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => feedbackMutation.mutate("up")}
                      disabled={feedbackMutation.isPending}
                      style={{ flex: 1, background: "#D1FAE5", color: "#065F46", border: "none", borderRadius: 12, padding: 12, fontSize: 20, cursor: "pointer", fontWeight: 700 }}
                    >
                      👍
                    </button>
                    <button
                      onClick={() => feedbackMutation.mutate("down")}
                      disabled={feedbackMutation.isPending}
                      style={{ flex: 1, background: "#FEE2E2", color: "#991B1B", border: "none", borderRadius: 12, padding: 12, fontSize: 20, cursor: "pointer", fontWeight: 700 }}
                    >
                      👎
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function TicketScreen() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: getTickets,
    refetchInterval: 5000,
  });

  const mutation = useMutation({
    mutationFn: uploadTicket,
    onSuccess: () => {
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (err: Error) => {
      setUploadError(err.message ?? "Error al subir el ticket");
    },
  });

  useEffect(() => {
    if (isCameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOpen, cameraStream]);

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch {
      setUploadError("No se pudo acceder a la cámara. Prueba con 'Elegir de galería'.");
    }
  }

  function closeCamera() {
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setIsCameraOpen(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "ticket.jpg", { type: "image/jpeg" });
      closeCamera();
      setUploadError(null);
      mutation.mutate(file);
    }, "image/jpeg", 0.9);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    mutation.mutate(file);
    e.target.value = "";
  }

  return (
    <div>
      <div style={{ background: "var(--primary)", padding: "20px 20px 32px" }}>
        <p style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 800, color: "white", marginBottom: 4 }}>
          Añadir ticket
        </p>
        <p style={{ color: "rgba(255,255,255,.7)", fontSize: 13 }}>
          Sube la foto y la IA extrae los datos automáticamente
        </p>
      </div>

      <div style={{ padding: "0 16px", marginTop: -16 }}>
        <div style={{ background: "var(--bg-card)", borderRadius: 20, padding: 24, textAlign: "center", boxShadow: "var(--shadow-md)", marginBottom: 16 }}>
          <div style={{ width: 80, height: 80, margin: "0 auto 16px", background: "linear-gradient(135deg,#EEF2FF,#DDE1FF)", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
            📸
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 6, fontFamily: "Syne, sans-serif" }}>
            Fotografía tu ticket
          </p>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 20, lineHeight: 1.5 }}>
            Haz una foto clara del ticket completo. La IA leerá todos los datos automáticamente.
          </p>

          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" style={{ display: "none" }} onChange={handleFileChange} />

          <button onClick={openCamera} disabled={mutation.isPending} style={{ display: "block", width: "100%", background: "var(--primary)", color: "white", borderRadius: 14, padding: 13, fontSize: 14, fontWeight: 700, marginBottom: 10, border: "none", cursor: mutation.isPending ? "not-allowed" : "pointer", opacity: mutation.isPending ? 0.7 : 1 }}>
            {mutation.isPending ? "⏳ Procesando..." : "📷 Abrir cámara"}
          </button>

          <label style={{ display: "block", background: "#EEF2FF", color: "var(--primary)", borderRadius: 14, padding: 13, fontSize: 14, fontWeight: 700, cursor: mutation.isPending ? "not-allowed" : "pointer", opacity: mutation.isPending ? 0.7 : 1 }}>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" style={{ display: "none" }} onChange={handleFileChange} disabled={mutation.isPending} />
            🖼️ Elegir de galería
          </label>

          {uploadError && (
            <p style={{ marginTop: 12, fontSize: 12, color: "#DC2626", background: "#FEE2E2", borderRadius: 8, padding: "8px 12px" }}>
              {uploadError}
            </p>
          )}
          {mutation.isSuccess && (
            <p style={{ marginTop: 12, fontSize: 12, color: "#065F46", background: "#D1FAE5", borderRadius: 8, padding: "8px 12px" }}>
              ✓ Ticket recibido — procesando con IA...
            </p>
          )}
        </div>

        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 10, fontFamily: "Syne, sans-serif" }}>
          Tickets recientes
        </p>

        {isLoading && <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: 20 }}>Cargando...</p>}

        {!isLoading && tickets.length === 0 && (
          <div style={{ background: "var(--bg-card)", borderRadius: 14, padding: 24, textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🧾</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>Aún no tienes tickets</p>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Sube tu primer ticket para participar en las promos</p>
          </div>
        )}

        {tickets.map((t) => (
          <TicketRow key={t.id} ticket={t} onClick={() => setSelectedTicketId(t.id)} />
        ))}
      </div>

      {/* Ticket detail bottom sheet */}
      {selectedTicketId !== null && (
        <TicketDetail ticketId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />
      )}

      {/* Camera modal */}
      {isCameraOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: "100%", maxHeight: "calc(100dvh - 120px)", objectFit: "cover" }} />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <button onClick={closeCamera} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 44, height: 44, color: "white", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
          <div style={{ position: "absolute", bottom: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <button onClick={capturePhoto} style={{ width: 72, height: 72, background: "white", border: "5px solid rgba(255,255,255,0.4)", borderRadius: "50%", cursor: "pointer", boxShadow: "0 0 0 2px rgba(255,255,255,0.8)" }} />
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Toca para capturar</span>
          </div>
        </div>
      )}
    </div>
  );
}