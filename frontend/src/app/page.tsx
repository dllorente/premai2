import { redirect } from "next/navigation";

// Auth-based routing for "/" lives in middleware.ts (no cookies() here, which
// would break prerendering under cacheComponents).
export default function Home() {
  redirect("/inicio");
}
