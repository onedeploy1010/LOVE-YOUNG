import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminLayout } from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
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
  Send,
  Loader2,
  ArrowLeft,
  UserCheck,
  ArrowRightLeft,
  CheckCircle,
  RotateCcw,
  User,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WhatsappConversation {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  status: string;
  assignment_status: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

interface WhatsappMessage {
  id: string;
  conversation_id: string;
  sender_type: string; // 'customer' | 'bot' | 'admin'
  sender_id: string | null;
  content: string;
  message_type: string;
  status: string;
  created_at: string;
}

interface WhatsappAdmin {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  status: string;
  is_on_duty: boolean;
}

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

type FilterTab = "ai" | "mine" | "unassigned" | "escalated" | "resolved";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function borderColorForConversation(c: WhatsappConversation): string {
  if (c.status === "resolved" || c.status === "closed") return "border-l-gray-400";
  if (c.assignment_status === "escalated") return "border-l-yellow-500";
  if (c.assignment_status === "assigned") return "border-l-blue-500";
  return "border-l-green-500"; // AI handling or null
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMessageDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminAiCustomerServicePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // UI state
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ai");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferAdminId, setTransferAdminId] = useState("");
  const [showBotConfigDialog, setShowBotConfigDialog] = useState(false);
  const [selectedBot, setSelectedBot] = useState<BotConfig | null>(null);

  // Bot config form state
  const [editDescription, setEditDescription] = useState("");
  const [editSystemPrompt, setEditSystemPrompt] = useState("");
  const [editKnowledgeBase, setEditKnowledgeBase] = useState("");
  const [editGreetingMessage, setEditGreetingMessage] = useState("");
  const [editFallbackMessage, setEditFallbackMessage] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editTemperature, setEditTemperature] = useState(0.7);
  const [editMaxTokens, setEditMaxTokens] = useState(1024);
  const [editResponseLanguage, setEditResponseLanguage] = useState("zh");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  // Fetch all conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["whatsapp-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) {
        console.error("Error fetching conversations:", error);
        return [];
      }
      return (data || []) as WhatsappConversation[];
    },
  });

  // Fetch my assignments
  const { data: myAssignments = [] } = useQuery({
    queryKey: ["whatsapp-my-assignments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("whatsapp_assignments")
        .select("conversation_id, status")
        .eq("admin_id", user.id)
        .in("status", ["assigned", "active"]);
      if (error) {
        console.error("Error fetching assignments:", error);
        return [];
      }
      return (data || []) as { conversation_id: string; status: string }[];
    },
    enabled: !!user?.id,
  });

  // Selected conversation object
  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) || null;

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["whatsapp-messages", selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return [];
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("conversation_id", selectedConversationId)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("Error fetching messages:", error);
        return [];
      }
      return (data || []) as WhatsappMessage[];
    },
    enabled: !!selectedConversationId,
  });

  // Fetch on-duty admins (for transfer)
  const { data: onDutyAdmins = [] } = useQuery({
    queryKey: ["whatsapp-on-duty-admins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_admins")
        .select("*")
        .eq("is_on_duty", true);
      if (error) {
        console.error("Error fetching admins:", error);
        return [];
      }
      return (data || []) as WhatsappAdmin[];
    },
  });

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

  // -------------------------------------------------------------------------
  // Real-time subscriptions
  // -------------------------------------------------------------------------

  useEffect(() => {
    const channel = supabase
      .channel("conversations-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_conversations" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!selectedConversationId) return;

    const channel = supabase
      .channel(`messages-realtime-${selectedConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whatsapp_messages",
          filter: `conversation_id=eq.${selectedConversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", selectedConversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversationId, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // -------------------------------------------------------------------------
  // Filtering
  // -------------------------------------------------------------------------

  const myAssignmentConversationIds = new Set(myAssignments.map((a) => a.conversation_id));

  const filteredConversations = conversations.filter((c) => {
    // Apply search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = c.customer_name?.toLowerCase().includes(q);
      const phoneMatch = c.customer_phone?.toLowerCase().includes(q);
      if (!nameMatch && !phoneMatch) return false;
    }

    // Apply tab filter
    switch (activeFilter) {
      case "ai":
        return !c.assignment_status || c.assignment_status === "ai_handling";
      case "mine":
        return myAssignmentConversationIds.has(c.id);
      case "unassigned":
        return c.assignment_status === "unassigned";
      case "escalated":
        return c.assignment_status === "escalated";
      case "resolved":
        return c.status === "resolved" || c.status === "closed";
      default:
        return true;
    }
  });

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversationId || !user?.id) throw new Error("No conversation or user");
      const { error } = await supabase.from("whatsapp_messages").insert({
        conversation_id: selectedConversationId,
        sender_type: "admin",
        sender_id: user.id,
        content,
        message_type: "text",
        status: "sent",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
    },
    onError: (error) => {
      toast({
        title: t("admin.aiCustomerServicePage.sendError"),
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Take over conversation
  const takeOverMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversationId || !user?.id) throw new Error("No conversation or user");
      const { error: assignError } = await supabase.from("whatsapp_assignments").insert({
        conversation_id: selectedConversationId,
        admin_id: user.id,
        status: "assigned",
        timeout_seconds: 300,
      });
      if (assignError) throw assignError;

      const { error: convError } = await supabase
        .from("whatsapp_conversations")
        .update({ assignment_status: "assigned" })
        .eq("id", selectedConversationId);
      if (convError) throw convError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-my-assignments"] });
      toast({ title: t("admin.aiCustomerServicePage.takeOverSuccess") });
    },
    onError: (error) => {
      toast({
        title: t("admin.aiCustomerServicePage.takeOverError"),
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Transfer conversation
  const transferMutation = useMutation({
    mutationFn: async (targetAdminId: string) => {
      if (!selectedConversationId) throw new Error("No conversation");
      // Update existing assignment to completed
      await supabase
        .from("whatsapp_assignments")
        .update({ status: "completed" })
        .eq("conversation_id", selectedConversationId)
        .in("status", ["assigned", "active"]);

      // Create new assignment
      const { error: assignError } = await supabase.from("whatsapp_assignments").insert({
        conversation_id: selectedConversationId,
        admin_id: targetAdminId,
        status: "assigned",
        timeout_seconds: 300,
      });
      if (assignError) throw assignError;

      const { error: convError } = await supabase
        .from("whatsapp_conversations")
        .update({ assignment_status: "assigned" })
        .eq("id", selectedConversationId);
      if (convError) throw convError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-my-assignments"] });
      setShowTransferDialog(false);
      setTransferAdminId("");
      toast({ title: t("admin.aiCustomerServicePage.transferSuccess") });
    },
    onError: (error) => {
      toast({
        title: t("admin.aiCustomerServicePage.transferError"),
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Mark resolved
  const markResolvedMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversationId) throw new Error("No conversation");
      const { error: convError } = await supabase
        .from("whatsapp_conversations")
        .update({ status: "resolved", assignment_status: "resolved" })
        .eq("id", selectedConversationId);
      if (convError) throw convError;

      await supabase
        .from("whatsapp_assignments")
        .update({ status: "completed" })
        .eq("conversation_id", selectedConversationId)
        .in("status", ["assigned", "active"]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-my-assignments"] });
      toast({ title: t("admin.aiCustomerServicePage.resolveSuccess") });
    },
    onError: (error) => {
      toast({
        title: t("admin.aiCustomerServicePage.resolveError"),
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Back to AI
  const backToAiMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversationId) throw new Error("No conversation");
      const { error: convError } = await supabase
        .from("whatsapp_conversations")
        .update({ assignment_status: "ai_handling" })
        .eq("id", selectedConversationId);
      if (convError) throw convError;

      await supabase
        .from("whatsapp_assignments")
        .update({ status: "completed" })
        .eq("conversation_id", selectedConversationId)
        .in("status", ["assigned", "active"]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-my-assignments"] });
      toast({ title: t("admin.aiCustomerServicePage.backToAiSuccess") });
    },
    onError: (error) => {
      toast({
        title: t("admin.aiCustomerServicePage.backToAiError"),
        description: String(error),
        variant: "destructive",
      });
    },
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
      toast({
        title: t("admin.aiCustomerServicePage.toggleError"),
        description: String(error),
        variant: "destructive",
      });
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
      setShowBotConfigDialog(false);
      toast({ title: t("admin.aiCustomerServicePage.updateSuccess") });
    },
    onError: (error) => {
      toast({
        title: t("admin.aiCustomerServicePage.updateError"),
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      setSelectedConversationId(conversationId);
      setShowMobileChat(true);
      setReplyText("");
    },
    []
  );

  const handleSendMessage = useCallback(() => {
    const text = replyText.trim();
    if (!text) return;
    sendMessageMutation.mutate(text);
  }, [replyText, sendMessageMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const handleOpenBotConfig = useCallback((bot: BotConfig) => {
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
    setShowBotConfigDialog(true);
  }, []);

  const handleSaveBotConfig = useCallback(() => {
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
  }, [
    selectedBot,
    editDescription,
    editSystemPrompt,
    editKnowledgeBase,
    editGreetingMessage,
    editFallbackMessage,
    editModel,
    editTemperature,
    editMaxTokens,
    editResponseLanguage,
    updateBotMutation,
    toast,
    t,
  ]);

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">{t("admin.aiCustomerServicePage.statusActive")}</Badge>;
      case "resolved":
      case "closed":
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20 text-xs">{t("admin.aiCustomerServicePage.statusResolved")}</Badge>;
      case "escalated":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">{t("admin.aiCustomerServicePage.statusEscalated")}</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status || "open"}</Badge>;
    }
  };

  const getAssignmentBadge = (assignment_status: string | null) => {
    switch (assignment_status) {
      case "ai_handling":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs"><Bot className="w-3 h-3 mr-1" />AI</Badge>;
      case "assigned":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs"><User className="w-3 h-3 mr-1" />{t("admin.aiCustomerServicePage.assigned")}</Badge>;
      case "escalated":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">{t("admin.aiCustomerServicePage.statusEscalated")}</Badge>;
      case "unassigned":
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-xs">{t("admin.aiCustomerServicePage.unassigned")}</Badge>;
      case "resolved":
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20 text-xs">{t("admin.aiCustomerServicePage.statusResolved")}</Badge>;
      default:
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs"><Bot className="w-3 h-3 mr-1" />AI</Badge>;
    }
  };

  const isConversationResolved =
    selectedConversation?.status === "resolved" || selectedConversation?.status === "closed";

  // Group messages by date for display
  const groupedMessages: { date: string; messages: WhatsappMessage[] }[] = [];
  let currentDateGroup = "";
  for (const msg of messages) {
    const dateStr = formatMessageDate(msg.created_at);
    if (dateStr !== currentDateGroup) {
      currentDateGroup = dateStr;
      groupedMessages.push({ date: dateStr, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loadingConversations) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  // -------------------------------------------------------------------------
  // Filter tabs config
  // -------------------------------------------------------------------------

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "ai", label: t("admin.aiCustomerServicePage.filterAi") },
    { key: "mine", label: t("admin.aiCustomerServicePage.filterMine") },
    { key: "unassigned", label: t("admin.aiCustomerServicePage.filterUnassigned") },
    { key: "escalated", label: t("admin.aiCustomerServicePage.filterEscalated") },
    { key: "resolved", label: t("admin.aiCustomerServicePage.filterResolved") },
  ];

  // Count badges for tabs
  const tabCounts: Record<FilterTab, number> = {
    ai: conversations.filter((c) => !c.assignment_status || c.assignment_status === "ai_handling").length,
    mine: conversations.filter((c) => myAssignmentConversationIds.has(c.id)).length,
    unassigned: conversations.filter((c) => c.assignment_status === "unassigned").length,
    escalated: conversations.filter((c) => c.assignment_status === "escalated").length,
    resolved: conversations.filter((c) => c.status === "resolved" || c.status === "closed").length,
  };

  // -------------------------------------------------------------------------
  // Render: Left Panel (conversation list)
  // -------------------------------------------------------------------------

  const renderLeftPanel = () => (
    <div className="flex flex-col h-full border-r bg-background">
      {/* Filter tabs */}
      <div className="p-2 border-b">
        <ScrollArea className="w-full">
          <div className="flex gap-1 pb-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  activeFilter === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                onClick={() => setActiveFilter(tab.key)}
              >
                {tab.label}
                {tabCounts[tab.key] > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full ${
                      activeFilter === tab.key
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    }`}
                  >
                    {tabCounts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Search */}
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("admin.aiCustomerServicePage.searchPlaceholder")}
            className="pl-8 h-8 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div className="p-1">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <MessageCircle className="w-10 h-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                {t("admin.aiCustomerServicePage.noConversations")}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const isSelected = conversation.id === selectedConversationId;
              return (
                <button
                  key={conversation.id}
                  className={`w-full text-left p-3 rounded-lg mb-0.5 border-l-4 transition-colors ${borderColorForConversation(conversation)} ${
                    isSelected
                      ? "bg-primary/5 border-r-2 border-r-primary"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">
                          {conversation.customer_name || conversation.customer_phone}
                        </span>
                        {conversation.unread_count > 0 && (
                          <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                            {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
                          </span>
                        )}
                      </div>
                      {conversation.customer_name && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {conversation.customer_phone}
                        </p>
                      )}
                      {conversation.last_message && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {conversation.last_message}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                      {formatRelativeTime(conversation.last_message_at || conversation.updated_at)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // -------------------------------------------------------------------------
  // Render: Right Panel (chat view)
  // -------------------------------------------------------------------------

  const renderRightPanel = () => {
    if (!selectedConversation) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-muted/10">
          <MessageCircle className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-lg">
            {t("admin.aiCustomerServicePage.selectConversation")}
          </p>
          <p className="text-muted-foreground/60 text-sm mt-1">
            {t("admin.aiCustomerServicePage.selectConversationDesc")}
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-background">
        {/* Chat header */}
        <div className="shrink-0 border-b px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile back button */}
              <button
                className="lg:hidden shrink-0 p-1 rounded-md hover:bg-muted"
                onClick={() => {
                  setShowMobileChat(false);
                  setSelectedConversationId(null);
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold truncate">
                    {selectedConversation.customer_name || selectedConversation.customer_phone}
                  </h3>
                  {getStatusBadge(selectedConversation.status)}
                  {getAssignmentBadge(selectedConversation.assignment_status)}
                </div>
                {selectedConversation.customer_name && (
                  <p className="text-xs text-muted-foreground">{selectedConversation.customer_phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => takeOverMutation.mutate()}
              disabled={takeOverMutation.isPending || isConversationResolved}
            >
              {takeOverMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <UserCheck className="w-3 h-3" />
              )}
              {t("admin.aiCustomerServicePage.takeOver")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setShowTransferDialog(true)}
              disabled={isConversationResolved}
            >
              <ArrowRightLeft className="w-3 h-3" />
              {t("admin.aiCustomerServicePage.transfer")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => markResolvedMutation.mutate()}
              disabled={markResolvedMutation.isPending || isConversationResolved}
            >
              {markResolvedMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle className="w-3 h-3" />
              )}
              {t("admin.aiCustomerServicePage.markResolved")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => backToAiMutation.mutate()}
              disabled={backToAiMutation.isPending || isConversationResolved}
            >
              {backToAiMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RotateCcw className="w-3 h-3" />
              )}
              {t("admin.aiCustomerServicePage.backToAi")}
            </Button>
          </div>
        </div>

        {/* Messages area */}
        <ScrollArea className="flex-1 px-4">
          <div className="py-4 space-y-1">
            {loadingMessages ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <MessageCircle className="w-10 h-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t("admin.aiCustomerServicePage.noMessages")}
                </p>
              </div>
            ) : (
              groupedMessages.map((group) => (
                <div key={group.date}>
                  {/* Date separator */}
                  <div className="flex items-center justify-center my-4">
                    <span className="px-3 py-1 text-[10px] text-muted-foreground bg-muted rounded-full">
                      {group.date}
                    </span>
                  </div>
                  {/* Messages in date group */}
                  {group.messages.map((message) => {
                    const isCustomer = message.sender_type === "customer";
                    const isBot = message.sender_type === "bot";

                    return (
                      <div
                        key={message.id}
                        className={`flex mb-3 ${isCustomer ? "justify-end" : "justify-start"}`}
                      >
                        {/* Avatar for bot/admin */}
                        {!isCustomer && (
                          <div className="shrink-0 mr-2 mt-1">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                isBot ? "bg-green-500/10" : "bg-blue-500/10"
                              }`}
                            >
                              {isBot ? (
                                <Bot className="w-3.5 h-3.5 text-green-600" />
                              ) : (
                                <User className="w-3.5 h-3.5 text-blue-600" />
                              )}
                            </div>
                          </div>
                        )}

                        <div className={`max-w-[75%] ${isCustomer ? "items-end" : "items-start"}`}>
                          {/* Sender label */}
                          {!isCustomer && (
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 h-4 ${
                                  isBot
                                    ? "text-green-600 border-green-200"
                                    : "text-blue-600 border-blue-200"
                                }`}
                              >
                                {isBot ? "Bot" : "Admin"}
                              </Badge>
                            </div>
                          )}

                          {/* Message bubble */}
                          <div
                            className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                              isCustomer
                                ? "bg-primary/10 text-foreground rounded-tr-sm"
                                : isBot
                                ? "bg-muted text-foreground rounded-tl-sm"
                                : "bg-blue-50 dark:bg-blue-950/30 text-foreground rounded-tl-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          </div>

                          {/* Timestamp */}
                          <div
                            className={`flex items-center gap-1.5 mt-0.5 ${
                              isCustomer ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span className="text-[10px] text-muted-foreground/60">
                              {formatMessageTime(message.created_at)}
                            </span>
                            {message.status && message.status !== "sent" && (
                              <span className="text-[10px] text-muted-foreground/40">
                                {message.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Reply input */}
        <div className="shrink-0 border-t p-3 bg-background">
          {isConversationResolved ? (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">
                {t("admin.aiCustomerServicePage.conversationResolved")}
              </p>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                placeholder={t("admin.aiCustomerServicePage.replyPlaceholder")}
                className="min-h-[40px] max-h-[120px] resize-none text-sm"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <Button
                size="sm"
                className="shrink-0 h-10 w-10 p-0"
                onClick={handleSendMessage}
                disabled={!replyText.trim() || sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif text-primary">
              {t("admin.aiCustomerServicePage.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("admin.aiCustomerServicePage.subtitle")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              if (botConfigs.length > 0) {
                handleOpenBotConfig(botConfigs[0]);
              }
            }}
            disabled={loadingBots || botConfigs.length === 0}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">{t("admin.aiCustomerServicePage.botConfig")}</span>
          </Button>
        </div>

        {/* Split panel layout */}
        <div className="border rounded-lg overflow-hidden bg-background" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
          {/* Desktop: side by side */}
          <div className="hidden lg:flex h-full">
            <div className="w-80 shrink-0 h-full">{renderLeftPanel()}</div>
            <div className="flex-1 h-full">{renderRightPanel()}</div>
          </div>

          {/* Mobile: toggle between list and chat */}
          <div className="lg:hidden h-full">
            {showMobileChat && selectedConversation ? (
              <div className="h-full">{renderRightPanel()}</div>
            ) : (
              <div className="h-full">{renderLeftPanel()}</div>
            )}
          </div>
        </div>
      </div>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="w-[95vw] max-w-[400px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ArrowRightLeft className="w-4 h-4 text-primary" />
              {t("admin.aiCustomerServicePage.transferTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("admin.aiCustomerServicePage.transferDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <label className="text-sm text-muted-foreground">
              {t("admin.aiCustomerServicePage.selectAdmin")}
            </label>
            <Select value={transferAdminId} onValueChange={setTransferAdminId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t("admin.aiCustomerServicePage.selectAdminPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {onDutyAdmins
                  .filter((admin) => admin.user_id !== user?.id)
                  .map((admin) => (
                    <SelectItem key={admin.id} value={admin.user_id}>
                      <div className="flex items-center gap-2">
                        <span>{admin.name}</span>
                        <span className="text-muted-foreground text-xs">{admin.phone}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {onDutyAdmins.filter((a) => a.user_id !== user?.id).length === 0 && (
              <p className="text-xs text-muted-foreground">
                {t("admin.aiCustomerServicePage.noAdminsOnDuty")}
              </p>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowTransferDialog(false);
                setTransferAdminId("");
              }}
              className="w-full sm:w-auto"
            >
              {t("admin.aiCustomerServicePage.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (transferAdminId) {
                  transferMutation.mutate(transferAdminId);
                }
              }}
              disabled={!transferAdminId || transferMutation.isPending}
              className="w-full sm:w-auto"
            >
              {transferMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("admin.aiCustomerServicePage.confirmTransfer")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bot Config Dialog */}
      <Dialog open={showBotConfigDialog} onOpenChange={setShowBotConfigDialog}>
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

          {/* Bot selector tabs */}
          {botConfigs.length > 1 && (
            <div className="flex gap-1.5 flex-wrap pt-2">
              {botConfigs.map((bot) => (
                <button
                  key={bot.id}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    selectedBot?.id === bot.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => handleOpenBotConfig(bot)}
                >
                  {bot.name}
                </button>
              ))}
            </div>
          )}

          {selectedBot && (
            <div className="space-y-4 py-2 sm:py-4">
              {/* Enable toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{selectedBot.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedBot.is_enabled
                      ? t("admin.aiCustomerServicePage.botEnabled")
                      : t("admin.aiCustomerServicePage.botDisabled")}
                  </p>
                </div>
                <Switch
                  checked={selectedBot.is_enabled}
                  onCheckedChange={(checked) => {
                    toggleBotMutation.mutate({ id: selectedBot.id, is_enabled: checked });
                    setSelectedBot({ ...selectedBot, is_enabled: checked });
                  }}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.aiCustomerServicePage.fieldDescription")}
                </label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>

              {/* System Prompt */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.aiCustomerServicePage.fieldSystemPrompt")}
                </label>
                <Textarea
                  value={editSystemPrompt}
                  onChange={(e) => setEditSystemPrompt(e.target.value)}
                  className="min-h-[160px] font-mono text-xs sm:text-sm"
                />
              </div>

              {/* Knowledge Base (JSON) */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.aiCustomerServicePage.fieldKnowledgeBase")}
                </label>
                <Textarea
                  value={editKnowledgeBase}
                  onChange={(e) => setEditKnowledgeBase(e.target.value)}
                  placeholder="JSON format"
                  className="min-h-[120px] font-mono text-xs sm:text-sm"
                />
              </div>

              {/* Greeting Message */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.aiCustomerServicePage.fieldGreetingMessage")}
                </label>
                <Textarea
                  value={editGreetingMessage}
                  onChange={(e) => setEditGreetingMessage(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Fallback Message */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.aiCustomerServicePage.fieldFallbackMessage")}
                </label>
                <Textarea
                  value={editFallbackMessage}
                  onChange={(e) => setEditFallbackMessage(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Model, Temperature, Max Tokens, Response Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.aiCustomerServicePage.fieldModel")}
                  </label>
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
                  <label className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.aiCustomerServicePage.fieldTemperature")}
                  </label>
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
                  <label className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.aiCustomerServicePage.fieldMaxTokens")}
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={editMaxTokens}
                    onChange={(e) => setEditMaxTokens(parseInt(e.target.value) || 1024)}
                    className="h-9 sm:h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.aiCustomerServicePage.fieldResponseLanguage")}
                  </label>
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBotConfigDialog(false)}
              className="w-full sm:w-auto"
            >
              {t("admin.aiCustomerServicePage.cancel")}
            </Button>
            <Button
              onClick={handleSaveBotConfig}
              disabled={updateBotMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updateBotMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("admin.aiCustomerServicePage.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
