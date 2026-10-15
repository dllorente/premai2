import { api } from "./api";

export type PromoType = "social" | "free" | "purchase";

export interface Promo {
  id: number;
  title: string;
  brand: string | null;
  description: string | null;
  requirements: string | null;
  participation_url: string;
  prize_description: string | null;
  start_date: string | null;
  end_date: string | null;
  requires_ticket: boolean;
  tickets_required: number | null;
  is_active: boolean;
  promo_type: PromoType | null;
}

export async function fetchPromos(promo_type?: PromoType): Promise<Promo[]> {
  const params = new URLSearchParams({ is_active: "true" });
  if (promo_type) params.set("promo_type", promo_type);
  const { data } = await api.get<Promo[]>(`/promos/?${params}`);
  return data;
}

export interface SubmitPromoResult {
  source_id: number;
  url: string;
  already_existed: boolean;
  scraping_queued: boolean;
}

export async function submitPromoUrl(
  url: string,
  brand?: string
): Promise<SubmitPromoResult> {
  const { data } = await api.post<SubmitPromoResult>("/promo-sources/submit", {
    url,
    brand: brand || null,
  });
  return data;
}