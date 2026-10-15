"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";

const IS_DEV = process.env.NODE_ENV === "development";
const DEV_EMAIL = "dev@example.com";
const DEV_PASS = "DevTest2026!";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(IS_DEV ? DEV_EMAIL : "");
  const [password, setPassword] = useState(IS_DEV ? DEV_PASS : "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      authStorage.setTokens(data.access_token, data.refresh_token);
      router.push("/dashboard");
    } catch {
      setError("Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h1 className="text-xl font-semibold">Iniciar sesión</h1>
        {IS_DEV && (
          <div
            style={{
              background: "#FEF3C7",
              border: "1px solid #F59E0B",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              color: "#92400E",
            }}
          >
            <strong>Dev</strong> — credenciales de prueba precargadas
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <p className="text-center text-sm text-zinc-500">
          ¿No tienes cuenta?{" "}
          <a href="/register" className="font-medium text-zinc-900 dark:text-white">
            Regístrate
          </a>
        </p>
      </form>
    </div>
  );
}