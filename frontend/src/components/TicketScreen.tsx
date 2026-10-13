"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTickets, uploadTicket, type Ticket } from "@/lib/tickets";

const STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  valid:      { label: "✓ válido",    bg: "#D1FAE5", color: "#065F46" },
  invalid:    { label: "✗ inválido",  bg: "#FEE2E2", color: "#991B1B" },
  processing: { label: "⏳ leyendo",  bg: "#FEF3C7", color: "#92400E" },
  pending:    { label: "⏳ pendiente",bg: "#FEF3C7", color: "#92400E" },
};

function statusChip(status: string) {
  const s = STATUS_LABEL[status] ?? { label: status, bg: "#F3F4F6", color: "#6B7280" };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: 10,
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 20,
        flexShrink: 0,
      }}
    >
      {s.label}
    </span>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  const date = ticket.purchased_at
    ? new Date(ticket.purchased_at).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date(ticket.created_at).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  const brandSummary = ticket.brands.length > 0 ? ticket.brands.join(", ") : "Sin marcas";
  const amount = ticket.total_amount != null ? `€${ticket.total_amount.toFixed(2)}` : null;

  const isProcessing = ticket.status === "processing" || ticket.status === "pending";

  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: 14,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 8,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          background: isProcessing
            ? "linear-gradient(135deg, #FEF3C7, #FDE68A)"
            : "linear-gradient(135deg, #EEF2FF, #C7D2FE)",
          borderRadius: 12,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        {isProcessing ? "⏳" : "🧾"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 2 }}>
          {ticket.store ?? "Tienda desconocida"}
          {amount ? ` · ${amount}` : ""}
        </p>
        <p style={{ fontSize: 11, color: "var(--text-3)" }}>
          {date} · {brandSummary}
        </p>
      </div>
      {statusChip(ticket.status)}
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
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
      {/* Header */}
      <div style={{ background: "var(--primary)", padding: "20px 20px 32px" }}>
        <p
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: 20,
            fontWeight: 800,
            color: "white",
            marginBottom: 4,
          }}
        >
          Añadir ticket
        </p>
        <p style={{ color: "rgba(255,255,255,.7)", fontSize: 13 }}>
          Sube la foto y la IA extrae los datos automáticamente
        </p>
      </div>

      <div style={{ padding: "0 16px", marginTop: -16 }}>
        {/* Upload card */}
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: 20,
            padding: 24,
            textAlign: "center",
            boxShadow: "var(--shadow-md)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              margin: "0 auto 16px",
              background: "linear-gradient(135deg, #EEF2FF, #DDE1FF)",
              borderRadius: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
            }}
          >
            📸
          </div>
          <p
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text-1)",
              marginBottom: 6,
              fontFamily: "Syne, sans-serif",
            }}
          >
            Fotografía tu ticket
          </p>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-3)",
              marginBottom: 20,
              lineHeight: 1.5,
            }}
          >
            Haz una foto clara del ticket completo. La IA leerá todos los datos automáticamente.
          </p>

          {/* Hidden file input — gallery only */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <button
            onClick={openCamera}
            disabled={mutation.isPending}
            style={{
              display: "block",
              width: "100%",
              background: "var(--primary)",
              color: "white",
              borderRadius: 14,
              padding: 13,
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 10,
              border: "none",
              cursor: mutation.isPending ? "not-allowed" : "pointer",
              opacity: mutation.isPending ? 0.7 : 1,
            }}
          >
            {mutation.isPending ? "⏳ Procesando..." : "📷 Abrir cámara"}
          </button>

          <label
            style={{
              display: "block",
              background: "#EEF2FF",
              color: "var(--primary)",
              borderRadius: 14,
              padding: 13,
              fontSize: 14,
              fontWeight: 700,
              cursor: mutation.isPending ? "not-allowed" : "pointer",
              opacity: mutation.isPending ? 0.7 : 1,
            }}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              style={{ display: "none" }}
              onChange={handleFileChange}
              disabled={mutation.isPending}
            />
            🖼️ Elegir de galería
          </label>

          {uploadError && (
            <p
              style={{
                marginTop: 12,
                fontSize: 12,
                color: "#DC2626",
                background: "#FEE2E2",
                borderRadius: 8,
                padding: "8px 12px",
              }}
            >
              {uploadError}
            </p>
          )}

          {mutation.isSuccess && (
            <p
              style={{
                marginTop: 12,
                fontSize: 12,
                color: "#065F46",
                background: "#D1FAE5",
                borderRadius: 8,
                padding: "8px 12px",
              }}
            >
              ✓ Ticket recibido — procesando con IA...
            </p>
          )}
        </div>

        {/* Ticket list */}
        <p
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--text-1)",
            marginBottom: 10,
            fontFamily: "Syne, sans-serif",
          }}
        >
          Tickets recientes
        </p>

        {isLoading && (
          <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: 20 }}>
            Cargando...
          </p>
        )}

        {!isLoading && tickets.length === 0 && (
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: 14,
              padding: 24,
              textAlign: "center",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <p style={{ fontSize: 32, marginBottom: 8 }}>🧾</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>
              Aún no tienes tickets
            </p>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
              Sube tu primer ticket para participar en las promos
            </p>
          </div>
        )}

        {tickets.map((t) => (
          <TicketRow key={t.id} ticket={t} />
        ))}
      </div>

      {/* Camera modal */}
      {isCameraOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "#000",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: "100%", maxHeight: "calc(100dvh - 120px)", objectFit: "cover" }}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Close button */}
          <button
            onClick={closeCamera}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "50%",
              width: 44,
              height: 44,
              color: "white",
              fontSize: 20,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>

          {/* Capture button */}
          <div style={{ position: "absolute", bottom: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <button
              onClick={capturePhoto}
              style={{
                width: 72,
                height: 72,
                background: "white",
                border: "5px solid rgba(255,255,255,0.4)",
                borderRadius: "50%",
                cursor: "pointer",
                boxShadow: "0 0 0 2px rgba(255,255,255,0.8)",
              }}
            />
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Toca para capturar</span>
          </div>
        </div>
      )}
    </div>
  );
}
