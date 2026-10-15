import { api } from "./api";

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