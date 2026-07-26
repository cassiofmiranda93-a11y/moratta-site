import { MessageCircle } from "lucide-react";
import { WHATSAPP_URL } from "@/constants/company";

export default function WhatsAppFloat() {
  return <a href={`${WHATSAPP_URL}?text=${encodeURIComponent("Olá! Quero saber mais sobre os imóveis disponíveis.")}`} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-xl hover:scale-110 hover:bg-green-600" aria-label="Falar no WhatsApp"><MessageCircle size={32} /></a>;
}
