import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { ProductCheckoutModal } from "@/components/ProductCheckoutModal";
import {
  X,
  Send,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  LogIn,
  UserPlus,
  Bot,
  RotateCcw,
  ShoppingBag,
  Users,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

const WHATSAPP_PHONE = "60178228658";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  feedback?: "positive" | "negative" | null;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  }>;
  packages?: Array<{
    id: string;
    name: string;
    price: number;
    ly_points: number;
    description: string;
  }>;
}

interface AiChatBotProps {
  open: boolean;
  onClose: () => void;
}

export function AiChatBot({ open, onClose }: AiChatBotProps) {
  const [, navigate] = useLocation();
  const { user, member } = useAuth();
  const { t, language } = useTranslation();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showTopics, setShowTopics] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
    price: number;
    originalPrice: number;
    image: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const whatsappLink = `https://wa.me/${WHATSAPP_PHONE}`;

  const handleRestart = () => {
    setMessages([]);
    setConversationId(null);
    setShowTopics(true);
    setInput("");
  };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open && user) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, user]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setShowTopics(false);
    setLoading(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("ai-suggest-answer", {
        body: {
          question: text.trim(),
          language,
          conversation_history: conversationHistory,
          conversation_id: conversationId,
          member_id: member?.id,
        },
      });

      if (error) throw error;

      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer || t("chatbot.error"),
        products: data.recommended_products,
        packages: data.recommended_packages,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: t("chatbot.error"),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (
    msgId: string,
    feedback: "positive" | "negative"
  ) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback } : m))
    );

    if (conversationId) {
      await supabase
        .from("ai_messages")
        .update({ feedback })
        .eq("conversation_id", conversationId)
        .eq("role", "assistant")
        .order("created_at", { ascending: false })
        .limit(1)
        .catch(() => {});
    }

    if (feedback === "negative") {
      sendMessage(t("chatbot.topicQuestions.products"));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const topicKeys = [
    "intro",
    "cashback",
    "rwa",
    "lyPoints",
    "network",
    "referral",
  ] as const;

  // Component always mounted for state persistence; only render panel when open
  if (!open) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[59] w-[calc(100%-2rem)] max-w-sm bg-card border rounded-xl shadow-xl animate-in slide-in-from-bottom-4 fade-in duration-200 flex flex-col max-h-[70vh]">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b shrink-0">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">
            {t("chatbot.title")}
          </h3>
          <p className="text-[10px] text-muted-foreground">
            {language.toUpperCase()}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-green-600 hover:text-green-700"
          onClick={() => window.open(whatsappLink, "_blank")}
          title={t("chatbot.transferHuman")}
        >
          <SiWhatsapp className="w-4 h-4" />
        </Button>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleRestart}
            title={t("chatbot.restart")}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Auth Gate */}
      {!user ? (
        <div className="p-6 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("chatbot.loginRequired")}
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              onClick={() => {
                onClose();
                navigate("/auth/login");
              }}
            >
              <LogIn className="w-3.5 h-3.5 mr-1" />
              {t("chatbot.login")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate("/auth/login");
              }}
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              {t("chatbot.register")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-3 space-y-3">
              {/* Greeting */}
              <div className="flex gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-muted rounded-lg rounded-tl-none px-3 py-2 text-sm max-w-[85%]">
                  {t("chatbot.greeting")}
                </div>
              </div>

              {/* Topic Chips */}
              {showTopics && (
                <div className="flex flex-wrap gap-1.5 pl-8">
                  {topicKeys.map((key) => (
                    <button
                      key={key}
                      className="px-2.5 py-1 text-xs rounded-full border bg-background hover:bg-primary/5 hover:border-primary/30 transition-colors"
                      onClick={() =>
                        sendMessage(t(`chatbot.topicQuestions.${key}`))
                      }
                    >
                      {t(`chatbot.topics.${key}`)}
                    </button>
                  ))}
                </div>
              )}

              {/* Messages */}
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-lg rounded-tr-none px-3 py-2 text-sm max-w-[85%]">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3 h-3 text-primary" />
                      </div>
                      <div className="max-w-[85%] space-y-1.5">
                        <div className="bg-muted rounded-lg rounded-tl-none px-3 py-2 text-sm whitespace-pre-wrap">
                          {msg.content}
                        </div>

                        {/* Product Recommendations */}
                        {msg.products && msg.products.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs text-muted-foreground px-1">
                              {t("chatbot.recommendProducts")}
                            </p>
                            {msg.products.map((product) => (
                              <div
                                key={product.id}
                                className="flex items-center gap-2 p-2 rounded-lg border bg-background"
                              >
                                {product.image_url && (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-10 h-10 rounded object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-primary font-semibold">
                                    RM {(product.price / 100).toFixed(2)}
                                  </p>
                                </div>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-6 text-[10px] px-2 shrink-0 gap-1"
                                  onClick={() => {
                                    setSelectedProduct({
                                      id: product.id,
                                      name: product.name,
                                      price: product.price / 100,
                                      originalPrice: product.price / 100,
                                      image: product.image_url || "",
                                    });
                                    setCheckoutOpen(true);
                                  }}
                                >
                                  <ShoppingBag className="w-3 h-3" />
                                  {t("chatbot.orderNow")}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Partner Package Recommendations */}
                        {msg.packages && msg.packages.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs text-muted-foreground px-1">
                              {t("chatbot.recommendPackages")}
                            </p>
                            {msg.packages.map((pkg) => (
                              <div
                                key={pkg.id}
                                className="flex items-center gap-2 p-2 rounded-lg border bg-gradient-to-r from-primary/5 to-secondary/5"
                              >
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <Users className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">
                                    {pkg.name}
                                  </p>
                                  <p className="text-xs text-primary font-semibold">
                                    RM {(pkg.price / 100).toFixed(0)}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {pkg.ly_points} LY能量值
                                  </p>
                                </div>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-6 text-[10px] px-2 shrink-0 gap-1"
                                  onClick={() => {
                                    onClose();
                                    navigate(`/partner/join?tier=${pkg.id}`);
                                  }}
                                >
                                  <Users className="w-3 h-3" />
                                  {t("chatbot.joinNow")}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Feedback */}
                        {!msg.feedback && (
                          <div className="flex gap-1 px-1">
                            <button
                              className="p-1 rounded hover:bg-muted transition-colors"
                              onClick={() =>
                                handleFeedback(msg.id, "positive")
                              }
                              title={t("chatbot.feedback.helpful")}
                            >
                              <ThumbsUp className="w-3 h-3 text-muted-foreground" />
                            </button>
                            <button
                              className="p-1 rounded hover:bg-muted transition-colors"
                              onClick={() =>
                                handleFeedback(msg.id, "negative")
                              }
                              title={t("chatbot.feedback.notHelpful")}
                            >
                              <ThumbsDown className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>
                        )}
                        {msg.feedback === "positive" && (
                          <div className="flex gap-1 px-1">
                            <ThumbsUp className="w-3 h-3 text-green-500" />
                            <span className="text-[10px] text-green-600">
                              {t("chatbot.feedback.helpful")}
                            </span>
                          </div>
                        )}
                        {msg.feedback === "negative" && (
                          <div className="flex gap-1 px-1">
                            <ThumbsDown className="w-3 h-3 text-red-500" />
                            <span className="text-[10px] text-red-600">
                              {t("chatbot.feedback.notHelpful")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg rounded-tl-none px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                    {t("chatbot.thinking")}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-3 border-t shrink-0">
            <div className="flex gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("chatbot.placeholder")}
                className="min-h-[36px] max-h-[80px] resize-none text-sm"
                rows={1}
                disabled={loading}
              />
              <Button
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Product Checkout Modal */}
      <ProductCheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        product={selectedProduct}
      />
    </div>
  );
}
