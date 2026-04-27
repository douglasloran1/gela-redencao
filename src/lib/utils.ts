import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const sendWhatsAppMessage = (to: string, message: string) => {
  // In a real app, this would call the WhatsApp Business API
  console.log(`Sending WhatsApp message to ${to}: ${message}`);
  // For now, we'll just show a toast
  toast.success("Mensagem enviada para o cliente via WhatsApp (simulado)");
};
