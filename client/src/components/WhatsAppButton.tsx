import { SiWhatsapp } from "react-icons/si";

interface WhatsAppButtonProps {
  whatsappLink: string;
}

export function WhatsAppButton({ whatsappLink }: WhatsAppButtonProps) {
  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-whatsapp text-white rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
      data-testid="button-floating-whatsapp"
      aria-label="WhatsApp咨询"
    >
      <SiWhatsapp className="w-7 h-7 md:w-8 md:h-8" />
    </a>
  );
}
