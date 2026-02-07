import { useState, useEffect, type CSSProperties } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { MessageCircle, Share2, X } from "lucide-react";
import { AiChatBot } from "./AiChatBot";
import { FloatingReferralButton } from "./FloatingReferralButton";

type PanelType = "chat" | "referral" | null;

export function FloatingActionWheel() {
  const { user, member } = useAuth();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const referralCode = member?.referralCode || "";
  const hasReferral = !!user && !!member && !!referralCode;

  // Close on Escape
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

  const handleMainClick = () => {
    if (activePanel) {
      setActivePanel(null);
      return;
    }
    if (hasReferral) {
      // Multiple actions → toggle wheel
      setExpanded(!expanded);
    } else {
      // Only chat → open directly
      setActivePanel("chat");
    }
  };

  const handleSubClick = (panel: "chat" | "referral") => {
    setExpanded(false);
    setActivePanel(panel);
  };

  const handleClosePanel = () => {
    setActivePanel(null);
  };

  // Hover: active item scales up, others shrink + blur
  const getSubStyle = (id: string): CSSProperties => {
    const base: CSSProperties = { transition: "all 300ms cubic-bezier(.4,0,.2,1)" };
    if (!hoveredItem) return base;
    if (hoveredItem === id) {
      return { ...base, transform: "scale(1.1)", opacity: 1 };
    }
    return { ...base, transform: "scale(0.88)", filter: "blur(2px)", opacity: 0.5 };
  };

  const isActive = expanded || !!activePanel;

  return (
    <>
      {/* Backdrop */}
      {isActive && (
        <div
          className="fixed inset-0 z-[58] bg-black/10"
          onClick={() => {
            setExpanded(false);
            setActivePanel(null);
          }}
        />
      )}

      {/* Panels — always rendered so state persists across open/close */}
      <AiChatBot open={activePanel === "chat"} onClose={handleClosePanel} />
      <FloatingReferralButton open={activePanel === "referral"} onClose={handleClosePanel} />

      {/* Sub-FABs (wheel items) */}
      {expanded && !activePanel && (
        <div
          className="fixed right-4 z-[60] flex flex-col-reverse items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{ bottom: "4.5rem" }}
        >
          {/* Chat button */}
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-white text-sm font-medium bg-blue-500 hover:bg-blue-600"
            style={getSubStyle("chat")}
            onMouseEnter={() => setHoveredItem("chat")}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => handleSubClick("chat")}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t("chatbot.title")}</span>
          </button>

          {/* Referral button */}
          {hasReferral && (
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-white text-sm font-medium bg-green-500 hover:bg-green-600"
              style={getSubStyle("referral")}
              onMouseEnter={() => setHoveredItem("referral")}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => handleSubClick("referral")}
            >
              <Share2 className="w-4 h-4" />
              <span>{t("chatbot.referralLabel")}</span>
            </button>
          )}
        </div>
      )}

      {/* Main FAB */}
      <Button
        onClick={handleMainClick}
        className="fixed bottom-4 right-4 z-[60] h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-transform duration-300"
        size="icon"
      >
        {isActive ? (
          <X className="w-5 h-5" />
        ) : (
          <MessageCircle className="w-5 h-5" />
        )}
      </Button>
    </>
  );
}
