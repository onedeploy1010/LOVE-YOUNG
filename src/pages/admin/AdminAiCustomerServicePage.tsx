import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AdminLayout } from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  Settings,
  MessageCircle,
  Search,
  Edit,
  Power,
  AlertTriangle,
  Star,
  Loader2,
  Zap,
  BookOpen,
  ShoppingCart,
  Users,
} from "lucide-react";

interface BotConfig {
  id: string;
  name: string;
  description: string;
  is_enabled: boolean;
  system_prompt: string;
  knowledge_base: unknown;
  greeting_message: string;
  fallback_message: string;
  model: string;
  temperature: number;
  max_tokens: number;
  response_language: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface Conversation {
  id: string;
  bot_id: string;
  whatsapp_conversation_id: string;
  customer_phone: string;
  customer_name: string;
  status: string;
  message_count: number;
  total_tokens: number;
  satisfaction_rating: number | null;
  escalation_reason: string | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  tokens_used: number | null;
  confidence: number | null;
  intent: string | null;
  metadata: unknown;
  created_at: string;
}

const botIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  business_plan: Users,
  product_info: BookOpen,
  order_service: ShoppingCart,
  sales_support: Zap,
};

export default function AdminAiCustomerServicePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"config" | "conversations">("config");
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedBot, setSelectedBot] = useState<BotConfig | null>(null);
  const [showConversationDialog, setShowConversationDialog] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Edit form state
  const [editDescription, setEditDescription] = useState("");
  const [editSystemPrompt, setEditSystemPrompt] = useState("");
  const [editKnowledgeBase, setEditKnowledgeBase] = useState("");
  const [editGreetingMessage, setEditGreetingMessage] = useState("");
  const [editFallbackMessage, setEditFallbackMessage] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editTemperature, setEditTemperature] = useState(0.7);
  const [editMaxTokens, setEditMaxTokens] = useState(1024);
  const [editResponseLanguage, setEditResponseLanguage] = useState("zh");

  // Fetch bot configs
  const { data: botConfigs = [], isLoading: loadingBots } = useQuery({
    queryKey: ["ai-bot-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_bot_config")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching bot configs:", error);
        return [];
      }

      return (data || []) as BotConfig[];
    },
  });

  // Fetch conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["ai-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_conversations")
        .select("*")
        .order("started_at", { ascending: false });

      if (error) {
        console.error("Error fetching conversations:", error);
        return [];
      }

      return (data || []) as Conversation[];
    },
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["ai-messages", selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const { data, error } = await supabase
        .from("ai_messages")
        .select("*")
        .eq("conversation_id", selectedConversation.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return [];
      }

      return (data || []) as Message[];
    },
    enabled: !!selectedConversation?.id,
  });

  // Fetch conversation stats per bot
  const { data: botStats = {} } = useQuery({
    queryKey: ["ai-bot-stats", botConfigs.map((b) => b.id).join(",")],
    queryFn: async () => {
      if (botConfigs.length === 0) return {};
      const stats: Record<string, { totalConversations: number; avgSatisfaction: number }> = {};
      for (const bot of botConfigs) {
        const { data, error } = await supabase
          .from("ai_conversations")
          .select("id, satisfaction_rating")
          .eq("bot_id", bot.id);

        if (error) {
          stats[bot.id] = { totalConversations: 0, avgSatisfaction: 0 };
          continue;
        }

        const convos = data || [];
        const rated = convos.filter((c: { satisfaction_rating: number | null }) => c.satisfaction_rating != null);
        const avgSat =
          rated.length > 0
            ? rated.reduce((sum: number, c: { satisfaction_rating: number | null }) => sum + (c.satisfaction_rating || 0), 0) / rated.length
            : 0;

        stats[bot.id] = {
          totalConversations: convos.length,
          avgSatisfaction: Math.round(avgSat * 10) / 10,
        };
      }
      return stats;
    },
    enabled: botConfigs.length > 0,
  });

  // Toggle bot enabled/disabled
  const toggleBotMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from("ai_bot_config")
        .update({ is_enabled, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-bot-configs"] });
      toast({ title: t("admin.aiCustomerServicePage.toggleSuccess") });
    },
    onError: (error) => {
      toast({ title: t("admin.aiCustomerServicePage.toggleError"), description: String(error), variant: "destructive" });
    },
  });

  // Update bot config
  const updateBotMutation = useMutation({
    mutationFn: async (data: Partial<BotConfig> & { id: string }) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from("ai_bot_config")
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-bot-configs"] });
      setShowConfigDialog(false);
      toast({ title: t("admin.aiCustomerServicePage.updateSuccess") });
    },
    onError: (error) => {
      toast({ title: t("admin.aiCustomerServicePage.updateError"), description: String(error), variant: "destructive" });
    },
  });

  const handleOpenConfig = (bot: BotConfig) => {
    setSelectedBot(bot);
    setEditDescription(bot.description || "");
    setEditSystemPrompt(bot.system_prompt || "");
    setEditKnowledgeBase(bot.knowledge_base ? JSON.stringify(bot.knowledge_base, null, 2) : "");
    setEditGreetingMessage(bot.greeting_message || "");
    setEditFallbackMessage(bot.fallback_message || "");
    setEditModel(bot.model || "gpt-4o-mini");
    setEditTemperature(bot.temperature ?? 0.7);
    setEditMaxTokens(bot.max_tokens ?? 1024);
    setEditResponseLanguage(bot.response_language || "zh");
    setShowConfigDialog(true);
  };

  const handleSaveConfig = () => {
    if (!selectedBot) return;
    let parsedKnowledgeBase: unknown = null;
    if (editKnowledgeBase.trim()) {
      try {
        parsedKnowledgeBase = JSON.parse(editKnowledgeBase);
      } catch {
        toast({ title: t("admin.aiCustomerServicePage.invalidJson"), variant: "destructive" });
        return;
      }
    }

    updateBotMutation.mutate({
      id: selectedBot.id,
      description: editDescription,
      system_prompt: editSystemPrompt,
      knowledge_base: parsedKnowledgeBase,
      greeting_message: editGreetingMessage,
      fallback_message: editFallbackMessage,
      model: editModel,
      temperature: editTemperature,
      max_tokens: editMaxTokens,
      response_language: editResponseLanguage,
    });
  };

  const handleOpenConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowConversationDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">{t("admin.aiCustomerServicePage.statusActive")}</Badge>;
      case "completed":
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">{t("admin.aiCustomerServicePage.statusCompleted")}</Badge>;
      case "escalated":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">{t("admin.aiCustomerServicePage.statusEscalated")}</Badge>;
      case "failed":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">{t("admin.aiCustomerServicePage.statusFailed")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating: number | null) => {
    if (rating == null) return <span className="text-xs text-muted-foreground">-</span>;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${star <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`}
          />
        ))}
      </div>
    );
  };

  // Conversation stats
  const conversationStats = {
    total: conversations.length,
    active: conversations.filter((c) => c.status === "active").length,
    escalated: conversations.filter((c) => c.status === "escalated").length,
    avgSatisfaction:
      conversations.filter((c) => c.satisfaction_rating != null).length > 0
        ? Math.round(
            (conversations
              .filter((c) => c.satisfaction_rating != null)
              .reduce((sum, c) => sum + (c.satisfaction_rating || 0), 0) /
              conversations.filter((c) => c.satisfaction_rating != null).length) *
              10
          ) / 10
        : 0,
  };

  const filteredConversations = conversations.filter((c) => {
    if (searchQuery === "") return true;
    const q = searchQuery.toLowerCase();
    return (
      c.customer_phone?.toLowerCase().includes(q) ||
      c.customer_name?.toLowerCase().includes(q) ||
      c.bot_id?.toLowerCase().includes(q)
    );
  });

  const isLoading = loadingBots || loadingConversations;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif text-primary">{t("admin.aiCustomerServicePage.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("admin.aiCustomerServicePage.subtitle")}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "config"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("config")}
          >
            <Settings className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            {t("admin.aiCustomerServicePage.botConfig")}
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "conversations"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("conversations")}
          >
            <MessageCircle className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            {t("admin.aiCustomerServicePage.conversations")}
          </button>
        </div>

        {/* Tab 1: Bot Configuration */}
        {activeTab === "config" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {botConfigs.map((bot) => {
              const BotIcon = botIconMap[bot.id] || Bot;
              const stats = botStats[bot.id] || { totalConversations: 0, avgSatisfaction: 0 };
              return (
                <Card key={bot.id} className="relative">
                  <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <BotIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm sm:text-base truncate">{bot.name}</CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{bot.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={bot.is_enabled}
                        onCheckedChange={(checked) => toggleBotMutation.mutate({ id: bot.id, is_enabled: checked })}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-2 sm:pt-3 space-y-3">
                    {/* Tags */}
                    {bot.tags && bot.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {bot.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{stats.totalConversations} {t("admin.aiCustomerServicePage.totalConversations")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" />
                        <span>{stats.avgSatisfaction > 0 ? stats.avgSatisfaction : "-"} {t("admin.aiCustomerServicePage.avgSatisfaction")}</span>
                      </div>
                    </div>

                    {/* Configure Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => handleOpenConfig(bot)}
                    >
                      <Edit className="w-4 h-4" />
                      {t("admin.aiCustomerServicePage.configure")}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Tab 2: Conversations */}
        {activeTab === "conversations" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-2xl font-bold">{conversationStats.total}</p>
                    <p className="text-xs text-muted-foreground truncate">{t("admin.aiCustomerServicePage.statTotal")}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <Power className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-2xl font-bold text-green-500">{conversationStats.active}</p>
                    <p className="text-xs text-muted-foreground truncate">{t("admin.aiCustomerServicePage.statActive")}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-2xl font-bold text-yellow-500">{conversationStats.escalated}</p>
                    <p className="text-xs text-muted-foreground truncate">{t("admin.aiCustomerServicePage.statEscalated")}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-2xl font-bold">{conversationStats.avgSatisfaction || "-"}</p>
                    <p className="text-xs text-muted-foreground truncate">{t("admin.aiCustomerServicePage.statAvgSatisfaction")}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conversation List */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    {t("admin.aiCustomerServicePage.conversationList")}
                  </CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t("admin.aiCustomerServicePage.searchPlaceholder")}
                      className="pl-9 h-9 sm:h-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t("admin.aiCustomerServicePage.noConversations")}</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer gap-3"
                        onClick={() => handleOpenConversation(conversation)}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">{conversation.bot_id}</Badge>
                              {getStatusBadge(conversation.status)}
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-0.5">
                              <span className="truncate">{conversation.customer_phone}</span>
                              <span className="shrink-0">{formatDate(conversation.started_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-12 sm:pl-0">
                          <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                            <span>{conversation.message_count} {t("admin.aiCustomerServicePage.messages")}</span>
                            <span>{conversation.total_tokens} tokens</span>
                          </div>
                          <div className="shrink-0">
                            {renderStars(conversation.satisfaction_rating)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bot Configure Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {t("admin.aiCustomerServicePage.configureBot")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("admin.aiCustomerServicePage.configureBotDesc")}
            </DialogDescription>
          </DialogHeader>

          {selectedBot && (
            <div className="space-y-4 py-2 sm:py-4">
              {/* Name (readonly) */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">{t("admin.aiCustomerServicePage.fieldName")}</label>
                <Input value={selectedBot.name} readOnly className="bg-muted h-9 sm:h-10" />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">{t("admin.aiCustomerServicePage.fieldDescription")}</label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>

              {/* System Prompt */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">{t("admin.aiCustomerServicePage.fieldSystemPrompt")}</label>
                <Textarea
                  value={editSystemPrompt}
                  onChange={(e) => setEditSystemPrompt(e.target.value)}
                  className="min-h-[160px] font-mono text-xs sm:text-sm"
                />
              </div>

              {/* Knowledge Base (JSON) */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">{t("admin.aiCustomerServicePage.fieldKnowledgeBase")}</label>
                <Textarea
                  value={editKnowledgeBase}
                  onChange={(e) => setEditKnowledgeBase(e.target.value)}
                  placeholder="JSON format"
                  className="min-h-[120px] font-mono text-xs sm:text-sm"
                />
              </div>

              {/* Greeting Message */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">{t("admin.aiCustomerServicePage.fieldGreetingMessage")}</label>
                <Textarea
                  value={editGreetingMessage}
                  onChange={(e) => setEditGreetingMessage(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Fallback Message */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">{t("admin.aiCustomerServicePage.fieldFallbackMessage")}</label>
                <Textarea
                  value={editFallbackMessage}
                  onChange={(e) => setEditFallbackMessage(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Model, Temperature, Max Tokens, Response Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm text-muted-foreground">{t("admin.aiCustomerServicePage.fieldModel")}</label>
                  <Select value={editModel} onValueChange={setEditModel}>
                    <SelectTrigger className="h-9 sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                      <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                      <SelectItem value="claude-3-haiku">claude-3-haiku</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm text-muted-foreground">{t("admin.aiCustomerServicePage.fieldTemperature")}</label>
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={editTemperature}
                    onChange={(e) => setEditTemperature(parseFloat(e.target.value) || 0)}
                    className="h-9 sm:h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm text-muted-foreground">{t("admin.aiCustomerServicePage.fieldMaxTokens")}</label>
                  <Input
                    type="number"
                    min={1}
                    value={editMaxTokens}
                    onChange={(e) => setEditMaxTokens(parseInt(e.target.value) || 1024)}
                    className="h-9 sm:h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm text-muted-foreground">{t("admin.aiCustomerServicePage.fieldResponseLanguage")}</label>
                  <Select value={editResponseLanguage} onValueChange={setEditResponseLanguage}>
                    <SelectTrigger className="h-9 sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh">zh</SelectItem>
                      <SelectItem value="en">en</SelectItem>
                      <SelectItem value="ms">ms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowConfigDialog(false)} className="w-full sm:w-auto">
              {t("admin.aiCustomerServicePage.cancel")}
            </Button>
            <Button onClick={handleSaveConfig} disabled={updateBotMutation.isPending} className="w-full sm:w-auto">
              {updateBotMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("admin.aiCustomerServicePage.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conversation Messages Dialog */}
      <Dialog open={showConversationDialog} onOpenChange={setShowConversationDialog}>
        <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {t("admin.aiCustomerServicePage.conversationDetail")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedConversation && (
                <span>
                  {selectedConversation.customer_phone}
                  {selectedConversation.customer_name ? ` - ${selectedConversation.customer_name}` : ""}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedConversation && (
            <div className="space-y-4 py-2 sm:py-4">
              {/* Conversation Info */}
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <Badge variant="outline">{selectedConversation.bot_id}</Badge>
                {getStatusBadge(selectedConversation.status)}
                <span className="text-muted-foreground">{selectedConversation.message_count} {t("admin.aiCustomerServicePage.messages")}</span>
                <span className="text-muted-foreground">{selectedConversation.total_tokens} tokens</span>
                {selectedConversation.satisfaction_rating != null && (
                  <div className="flex items-center gap-1">
                    {renderStars(selectedConversation.satisfaction_rating)}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="border rounded-lg p-3 sm:p-4 space-y-3 max-h-[50vh] overflow-y-auto bg-muted/20">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">{t("admin.aiCustomerServicePage.noMessages")}</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    if (message.role === "system") {
                      return (
                        <div key={message.id} className="text-center">
                          <p className="text-xs italic text-muted-foreground">{message.content}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatDateTime(message.created_at)}</p>
                        </div>
                      );
                    }

                    const isUser = message.role === "user";

                    return (
                      <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] space-y-1 ${isUser ? "items-end" : "items-start"}`}>
                          <div
                            className={`rounded-lg px-3 py-2 text-sm ${
                              isUser
                                ? "bg-primary/10 text-foreground"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          </div>
                          <div className={`flex items-center gap-2 text-[10px] text-muted-foreground/60 ${isUser ? "justify-end" : "justify-start"}`}>
                            <span>{message.role}</span>
                            {message.tokens_used != null && <span>{message.tokens_used} tokens</span>}
                            {message.confidence != null && <span>{t("admin.aiCustomerServicePage.confidence")}: {(message.confidence * 100).toFixed(0)}%</span>}
                            <span>{formatDateTime(message.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-3 sm:mt-4 flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConversationDialog(false)} className="w-full sm:w-auto">
              {t("admin.aiCustomerServicePage.close")}
            </Button>
            {selectedConversation && selectedConversation.status !== "escalated" && (
              <Button
                variant="destructive"
                className="w-full sm:w-auto gap-2"
                onClick={async () => {
                  try {
                    // Update conversation status to escalated
                    await supabase
                      .from("ai_conversations")
                      .update({ status: "escalated" })
                      .eq("id", selectedConversation.id);
                    // Create assignment if WhatsApp conversation exists
                    if (selectedConversation.whatsapp_conversation_id) {
                      await supabase.from("whatsapp_assignments").insert({
                        conversation_id: selectedConversation.whatsapp_conversation_id,
                        status: "assigned",
                        notes: "Escalated from AI customer service",
                        timeout_seconds: 300,
                      });
                      await supabase
                        .from("whatsapp_conversations")
                        .update({ assignment_status: "escalated" })
                        .eq("id", selectedConversation.whatsapp_conversation_id);
                    }
                    queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
                    toast({ title: t("admin.aiCustomerServicePage.escalateSuccess") || "Escalated to admin" });
                    setShowConversationDialog(false);
                  } catch {
                    toast({ title: t("admin.aiCustomerServicePage.escalateError") || "Escalation failed", variant: "destructive" });
                  }
                }}
              >
                <AlertTriangle className="w-4 h-4" />
                {t("admin.aiCustomerServicePage.escalateToAdmin") || "Escalate to Admin"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
