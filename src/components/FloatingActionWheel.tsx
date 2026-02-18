import { useState, useEffect, useRef, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n";
import { MessageCircle, Share2, X } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { AiChatBot } from "./AiChatBot";
import { FloatingReferralButton } from "./FloatingReferralButton";

const WHATSAPP_PHONE = "60178228658";

// Pages where FAB should be hidden (has its own input bar)
const HIDDEN_ON_PAGES = ["/admin/order-supplement"];

type PanelType = "chat" | "referral" | null;

export function FloatingActionWheel() {
  const { user, member } = useAuth();
  const { t } = useTranslation();
  const [location] = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const referralCode = member?.referralCode || "";
  const hasReferral = !!user && !!member && !!referralCode;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExpanded(false);
        setActivePanel(null);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const whatsappLink = `https://wa.me/${WHATSAPP_PHONE}`;

  const handleMainClick = () => {
    if (activePanel) {
      setActivePanel(null);
      return;
    }
    setExpanded(!expanded);
  };

  const handleSubClick = (id: string) => {
    if (id === "whatsapp") {
      window.open(whatsappLink, "_blank");
      setExpanded(false);
      return;
    }
    setExpanded(false);
    setActivePanel(id as PanelType);
  };

  const handleClosePanel = () => {
    setActivePanel(null);
  };

  // Mobile touch: drag finger across buttons to highlight, release to select
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const container = wheelRef.current;
    if (!container) return;

    const items = container.querySelectorAll<HTMLElement>("[data-wheel-id]");
    let found = false;
    items.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (
        touch.clientX >= rect.left - 8 &&
        touch.clientX <= rect.right + 8 &&
        touch.clientY >= rect.top - 8 &&
        touch.clientY <= rect.bottom + 8
      ) {
        setHoveredItem(el.dataset.wheelId || null);
        found = true;
      }
    });
    if (!found) setHoveredItem(null);
  };

  const handleTouchEnd = () => {
    if (hoveredItem) {
      handleSubClick(hoveredItem);
    }
    setHoveredItem(null);
  };

  // Scale/blur for active vs inactive sub-buttons
  const getSubStyle = (id: string): CSSProperties => {
    const base: CSSProperties = { transition: "all 300ms cubic-bezier(.4,0,.2,1)" };
    if (!hoveredItem) return base;
    if (hoveredItem === id) {
      return { ...base, transform: "scale(1.12)", opacity: 1, filter: "none" };
    }
    return { ...base, transform: "scale(0.82)", filter: "blur(3px)", opacity: 0.35 };
  };

  const isHidden = HIDDEN_ON_PAGES.some((p) => location.startsWith(p));
  const isActive = expanded || !!activePanel;

  // Don't render on pages with their own input bar
  if (isHidden) return null;

  const subItems = [
    { id: "chat", icon: MessageCircle, label: t("chatbot.title"), bg: "bg-gradient-to-r from-blue-500 to-indigo-500" },
    { id: "whatsapp", icon: SiWhatsapp, label: t("chatbot.whatsappLabel"), bg: "bg-gradient-to-r from-green-500 to-green-600" },
    ...(hasReferral
      ? [{ id: "referral", icon: Share2, label: t("chatbot.referralLabel"), bg: "bg-gradient-to-r from-emerald-500 to-green-500" }]
      : []),
  ];

  return (
    <>
      {/* Backdrop */}
      {isActive && (
        <div
          className="fixed inset-0 z-[58] bg-black/15"
          onClick={() => {
            setExpanded(false);
            setActivePanel(null);
          }}
        />
      )}

      {/* Panels — always mounted for state persistence */}
      <AiChatBot open={activePanel === "chat"} onClose={handleClosePanel} />
      <FloatingReferralButton open={activePanel === "referral"} onClose={handleClosePanel} />

      {/* Sub-buttons — horizontal row above FAB */}
      {expanded && !activePanel && (
        <div
          ref={wheelRef}
          className="fixed right-3 z-[60] flex flex-row-reverse gap-2.5 items-center animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-200"
          style={{ bottom: "5.5rem" }}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {subItems.map((item) => (
            <button
              key={item.id}
              data-wheel-id={item.id}
              className={`flex items-center justify-center gap-2 px-3 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-xl text-white font-semibold select-none touch-none active:scale-95 ${item.bg}`}
              style={getSubStyle(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => handleSubClick(item.id)}
              title={item.label}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="text-sm whitespace-nowrap hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main FAB — larger, with pulse ring */}
      <div className="fixed bottom-5 right-3 z-[60]">
        {/* Pulse ring when idle */}
        {!isActive && (
          <span
            className="absolute inset-0 rounded-full bg-primary/25 pointer-events-none"
            style={{ animation: "ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite" }}
          />
        )}
        <button
          onClick={handleMainClick}
          className={`relative flex items-center justify-center h-14 w-14 rounded-full text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 ${
            isActive
              ? "bg-gray-700 hover:bg-gray-600 rotate-0"
              : "bg-gradient-to-br from-primary via-primary to-primary/80 hover:shadow-[0_6px_28px_rgba(0,0,0,0.35)]"
          }`}
        >
          {isActive ? (
            <X className="w-6 h-6 transition-transform duration-300" />
          ) : (
            <MessageCircle className="w-6 h-6 transition-transform duration-300" />
          )}
        </button>
      </div>
    </>
  );
}
