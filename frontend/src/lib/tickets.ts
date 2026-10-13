import { api } from "./api";

export interface Ticket {
  id: number;
  user_id: number;
  image_path: string | null;
  status: "pending" | "processing" | "valid" | "invalid";
  store: string | null;
  purchased_at: string | null;
  total_amount: number | null;
  ticket_number: string | null;
  brands: string[];
  products: { name: string; brand: string; price: number; quantity: number }[];
  raw_text: string | null;
  ocr_provider: string | null;
  ocr_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketUploadResponse {
  ticket_id: number;
  status: string;
  message: string;
}

export async function uploadTicket(file: File): Promise<TicketUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<TicketUploadResponse>("/tickets/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getTickets(): Promise<Ticket[]> {
  const { data } = await api.get<Ticket[]>("/tickets/");
  return data;
}
