// Prints the URLs to open the dev app on this machine, on a phone on the same
// WiFi, and through ngrok (when `npm run dev:all` started it).
import os from "node:os";

const PORT = 3000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const lanIps = Object.values(os.networkInterfaces())
  .flat()
  .filter((i) => i && i.family === "IPv4" && !i.internal)
  .map((i) => i.address);

async function ngrokUrl() {
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch("http://127.0.0.1:4040/api/tunnels");
      const { tunnels } = await res.json();
      const https = tunnels.find((t) => t.public_url.startsWith("https://"));
      if (https) return https.public_url;
    } catch {
      // ngrok not up yet
    }
    await sleep(1000);
  }
  return null;
}

await sleep(4000);
const lines = [`  Mac:    http://localhost:${PORT}`];
for (const ip of lanIps) lines.push(`  Móvil:  http://${ip}:${PORT}   (mismo WiFi)`);
if (process.argv.includes("--ngrok")) {
  const url = await ngrokUrl();
  lines.push(url ? `  ngrok:  ${url}   (cualquier red, HTTPS)` : "  ngrok:  no arrancó (¿ngrok instalado y con authtoken?)");
}
console.log(`\n  PremAI2 listo:\n${lines.join("\n")}\n`);
