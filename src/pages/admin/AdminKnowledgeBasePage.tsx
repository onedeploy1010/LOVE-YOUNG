import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  HelpCircle,
  Zap,
  Brain,
  MessageSquare,
} from "lucide-react";

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  is_active: boolean;
  source: string;
  source_memory_id: string | null;
  created_at: string;
  updated_at: string;
}

interface TrainingData {
  id: string;
  question: string;
  answer: string | null;
  category: string;
  source: string;
  confidence_score: number;
  is_verified: boolean;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

interface KnowledgeFormData {
  title: string;
  content: string;
  category: string;
  tags: string;
  is_active: string;
}

interface QaFormData {
  question: string;
  answer: string;
  category: string;
  source: string;
  confidence_score: number;
  is_verified: string;
}

const emptyKnowledgeForm: KnowledgeFormData = {
  title: "",
  content: "",
  category: "",
  tags: "",
  is_active: "active",
};

const emptyQaForm: QaFormData = {
  question: "",
  answer: "",
  category: "",
  source: "",
  confidence_score: 0.5,
  is_verified: "false",
};

const KNOWLEDGE_CATEGORIES = ["general", "product", "partner", "policy", "faq", "promotion"] as const;
const QA_CATEGORIES = ["general", "product", "order", "partner", "policy", "other"] as const;
const QA_SOURCES = ["customer_asked", "ai_generated", "manual"] as const;

export default function AdminKnowledgeBasePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Tab state
  const [mainTab, setMainTab] = useState("knowledge");

  // Knowledge tab state
  const [knowledgeSearch, setKnowledgeSearch] = useState("");
  const [knowledgeFilter, setKnowledgeFilter] = useState("all");
  const [knowledgeCreateOpen, setKnowledgeCreateOpen] = useState(false);
  const [knowledgeEditOpen, setKnowledgeEditOpen] = useState(false);
  const [knowledgeDetailOpen, setKnowledgeDetailOpen] = useState(false);
  const [knowledgeDeleteOpen, setKnowledgeDeleteOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [knowledgeForm, setKnowledgeForm] = useState<KnowledgeFormData>(emptyKnowledgeForm);

  // QA tab state
  const [qaSearch, setQaSearch] = useState("");
  const [qaFilter, setQaFilter] = useState("all");
  const [qaCreateOpen, setQaCreateOpen] = useState(false);
  const [qaEditOpen, setQaEditOpen] = useState(false);
  const [qaDetailOpen, setQaDetailOpen] = useState(false);
  const [qaDeleteOpen, setQaDeleteOpen] = useState(false);
  const [selectedQa, setSelectedQa] = useState<TrainingData | null>(null);
  const [qaForm, setQaForm] = useState<QaFormData>(emptyQaForm);
  const [aiSuggesting, setAiSuggesting] = useState(false);

  // ========== DATA FETCHING ==========

  const { data: articles = [], isLoading: loadingArticles } = useQuery({
    queryKey: ["ai-knowledge-base"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_knowledge_base")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching knowledge base:", error);
        return [];
      }
      return (data || []) as KnowledgeArticle[];
    },
  });

  const { data: trainingData = [], isLoading: loadingTraining } = useQuery({
    queryKey: ["ai-training-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_training_data")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching training data:", error);
        return [];
      }
      return (data || []) as TrainingData[];
    },
  });

  // ========== KNOWLEDGE MUTATIONS ==========

  const createArticleMutation = useMutation({
    mutationFn: async (formData: KnowledgeFormData) => {
      const { error } = await supabase.from("ai_knowledge_base").insert({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: formData.tags ? formData.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
        is_active: formData.is_active === "active",
        source: "manual",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-knowledge-base"] });
      toast({ title: t("admin.knowledgeBasePage.createSuccess") });
      setKnowledgeCreateOpen(false);
      setKnowledgeForm(emptyKnowledgeForm);
    },
    onError: (error) => {
      toast({ title: t("admin.knowledgeBasePage.createError"), description: String(error), variant: "destructive" });
    },
  });

  const updateArticleMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: KnowledgeFormData }) => {
      const { error } = await supabase
        .from("ai_knowledge_base")
        .update({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          tags: formData.tags ? formData.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
          is_active: formData.is_active === "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-knowledge-base"] });
      toast({ title: t("admin.knowledgeBasePage.updateSuccess") });
      setKnowledgeEditOpen(false);
      setSelectedArticle(null);
    },
    onError: (error) => {
      toast({ title: t("admin.knowledgeBasePage.updateError"), description: String(error), variant: "destructive" });
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_knowledge_base").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-knowledge-base"] });
      toast({ title: t("admin.knowledgeBasePage.deleteSuccess") });
      setKnowledgeDeleteOpen(false);
      setSelectedArticle(null);
    },
    onError: (error) => {
      toast({ title: t("admin.knowledgeBasePage.deleteError"), description: String(error), variant: "destructive" });
    },
  });

  // ========== QA MUTATIONS ==========

  const createQaMutation = useMutation({
    mutationFn: async (formData: QaFormData) => {
      const { error } = await supabase.from("ai_training_data").insert({
        question: formData.question,
        answer: formData.answer || null,
        category: formData.category,
        source: formData.source,
        confidence_score: formData.confidence_score,
        is_verified: formData.is_verified === "true",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-training-data"] });
      toast({ title: t("admin.knowledgeBasePage.createQaSuccess") });
      setQaCreateOpen(false);
      setQaForm(emptyQaForm);
    },
    onError: (error) => {
      toast({ title: t("admin.knowledgeBasePage.createQaError"), description: String(error), variant: "destructive" });
    },
  });

  const updateQaMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: QaFormData }) => {
      const { error } = await supabase
        .from("ai_training_data")
        .update({
          question: formData.question,
          answer: formData.answer || null,
          category: formData.category,
          source: formData.source,
          confidence_score: formData.confidence_score,
          is_verified: formData.is_verified === "true",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-training-data"] });
      toast({ title: t("admin.knowledgeBasePage.updateQaSuccess") });
      setQaEditOpen(false);
      setSelectedQa(null);
    },
    onError: (error) => {
      toast({ title: t("admin.knowledgeBasePage.updateQaError"), description: String(error), variant: "destructive" });
    },
  });

  const deleteQaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_training_data").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-training-data"] });
      toast({ title: t("admin.knowledgeBasePage.deleteQaSuccess") });
      setQaDeleteOpen(false);
      setSelectedQa(null);
    },
    onError: (error) => {
      toast({ title: t("admin.knowledgeBasePage.deleteQaError"), description: String(error), variant: "destructive" });
    },
  });

  // ========== EMBEDDING & AI ACTIONS ==========

  const handleGenerateEmbedding = async (table: string, recordId: string, text: string) => {
    try {
      const { error } = await supabase.functions.invoke("generate-embedding", {
        body: { text, table, record_id: recordId },
      });
      if (error) throw error;
      toast({ title: t("admin.knowledgeBasePage.embeddingSuccess") });
    } catch (err) {
      toast({ title: t("admin.knowledgeBasePage.embeddingError"), description: String(err), variant: "destructive" });
    }
  };

  const handleAiSuggestAnswer = async () => {
    if (!qaForm.question.trim()) return;
    setAiSuggesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-suggest-answer", {
        body: { question: qaForm.question },
      });
      if (error) throw error;
      if (data?.answer) {
        setQaForm({ ...qaForm, answer: data.answer });
        toast({ title: t("admin.knowledgeBasePage.aiSuggestSuccess") });
      }
    } catch (err) {
      toast({ title: t("admin.knowledgeBasePage.aiSuggestError"), description: String(err), variant: "destructive" });
    } finally {
      setAiSuggesting(false);
    }
  };

  // ========== HELPERS ==========

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const openEditArticle = (article: KnowledgeArticle) => {
    setSelectedArticle(article);
    setKnowledgeForm({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: (article.tags || []).join(", "),
      is_active: article.is_active ? "active" : "inactive",
    });
    setKnowledgeEditOpen(true);
  };

  const openEditQa = (qa: TrainingData) => {
    setSelectedQa(qa);
    setQaForm({
      question: qa.question,
      answer: qa.answer || "",
      category: qa.category,
      source: qa.source,
      confidence_score: qa.confidence_score,
      is_verified: qa.is_verified ? "true" : "false",
    });
    setQaEditOpen(true);
  };

  const getCategoryBadge = (category: string) => {
    const colorMap: Record<string, string> = {
      general: "bg-gray-500/10 text-gray-500 border-gray-500/20",
      product: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      partner: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      policy: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      faq: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      promotion: "bg-pink-500/10 text-pink-500 border-pink-500/20",
      order: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      other: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return (
      <Badge className={colorMap[category] || colorMap.general}>
        {t(`admin.knowledgeBasePage.category_${category}`) || category}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    const colorMap: Record<string, string> = {
      manual: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      customer_asked: "bg-green-500/10 text-green-500 border-green-500/20",
      ai_generated: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      import: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    };
    return (
      <Badge className={colorMap[source] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}>
        {t(`admin.knowledgeBasePage.source_${source}`) || source}
      </Badge>
    );
  };

  // ========== COMPUTED ==========

  const stats = {
    totalArticles: articles.length,
    activeArticles: articles.filter((a) => a.is_active).length,
    totalQa: trainingData.length,
    verifiedQa: trainingData.filter((q) => q.is_verified).length,
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      knowledgeSearch === "" ||
      article.title.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
      article.content.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
      article.category.toLowerCase().includes(knowledgeSearch.toLowerCase());
    const matchesFilter =
      knowledgeFilter === "all" ||
      (knowledgeFilter === "active" && article.is_active) ||
      (knowledgeFilter === "inactive" && !article.is_active);
    return matchesSearch && matchesFilter;
  });

  const filteredQa = trainingData.filter((qa) => {
    const matchesSearch =
      qaSearch === "" ||
      qa.question.toLowerCase().includes(qaSearch.toLowerCase()) ||
      (qa.answer || "").toLowerCase().includes(qaSearch.toLowerCase()) ||
      qa.category.toLowerCase().includes(qaSearch.toLowerCase());
    const matchesFilter =
      qaFilter === "all" ||
      (qaFilter === "verified" && qa.is_verified) ||
      (qaFilter === "unverified" && !qa.is_verified) ||
      (qaFilter === "ai_generated" && qa.source === "ai_generated");
    return matchesSearch && matchesFilter;
  });

  const isLoading = loadingArticles || loadingTraining;

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
            <h1 className="text-xl sm:text-2xl font-serif text-primary">
              {t("admin.knowledgeBasePage.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("admin.knowledgeBasePage.subtitle")}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{stats.totalArticles}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {t("admin.knowledgeBasePage.statTotalArticles")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-green-500">{stats.activeArticles}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {t("admin.knowledgeBasePage.statActiveArticles")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-blue-500">{stats.totalQa}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {t("admin.knowledgeBasePage.statTotalQa")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-yellow-500">{stats.verifiedQa}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {t("admin.knowledgeBasePage.statVerifiedQa")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <Tabs value={mainTab} onValueChange={setMainTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="knowledge" className="gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("admin.knowledgeBasePage.tabKnowledge")}</span>
                </TabsTrigger>
                <TabsTrigger value="qa" className="gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("admin.knowledgeBasePage.tabQa")}</span>
                </TabsTrigger>
              </TabsList>

              {/* ==================== KNOWLEDGE TAB ==================== */}
              <TabsContent value="knowledge" className="space-y-4">
                {/* Search + Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t("admin.knowledgeBasePage.searchArticles")}
                      className="pl-9 h-9 sm:h-10"
                      value={knowledgeSearch}
                      onChange={(e) => setKnowledgeSearch(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      setKnowledgeForm(emptyKnowledgeForm);
                      setKnowledgeCreateOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    {t("admin.knowledgeBasePage.addArticle")}
                  </Button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 border-b">
                  {["all", "active", "inactive"].map((filter) => (
                    <button
                      key={filter}
                      className={`px-3 py-1.5 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                        knowledgeFilter === filter
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setKnowledgeFilter(filter)}
                    >
                      {t(`admin.knowledgeBasePage.filter_${filter}`)}
                    </button>
                  ))}
                </div>

                {/* Article List */}
                {filteredArticles.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t("admin.knowledgeBasePage.noArticles")}</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {filteredArticles.map((article) => (
                      <div
                        key={article.id}
                        className="flex flex-col p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  article.is_active ? "bg-green-500" : "bg-gray-400"
                                }`}
                              />
                              <h3 className="text-sm sm:text-base font-medium truncate">{article.title}</h3>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap mb-2">
                              {getCategoryBadge(article.category)}
                              {getSourceBadge(article.source)}
                              {(article.tags || []).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                              {article.content.slice(0, 100)}
                              {article.content.length > 100 ? "..." : ""}
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground/60 mt-1">
                              {formatDate(article.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 sm:h-8 text-xs gap-1"
                            onClick={() => {
                              setSelectedArticle(article);
                              setKnowledgeDetailOpen(true);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {t("admin.knowledgeBasePage.view")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 sm:h-8 text-xs gap-1"
                            onClick={() => openEditArticle(article)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                            {t("admin.knowledgeBasePage.edit")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 sm:h-8 text-xs gap-1 text-purple-600 border-purple-200 hover:bg-purple-50"
                            onClick={() =>
                              handleGenerateEmbedding("ai_knowledge_base", article.id, article.content)
                            }
                          >
                            <Zap className="w-3.5 h-3.5" />
                            {t("admin.knowledgeBasePage.generateEmbedding")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 sm:h-8 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => {
                              setSelectedArticle(article);
                              setKnowledgeDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {t("admin.knowledgeBasePage.delete")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ==================== QA TAB ==================== */}
              <TabsContent value="qa" className="space-y-4">
                {/* Search + Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t("admin.knowledgeBasePage.searchQa")}
                      className="pl-9 h-9 sm:h-10"
                      value={qaSearch}
                      onChange={(e) => setQaSearch(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      setQaForm(emptyQaForm);
                      setQaCreateOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    {t("admin.knowledgeBasePage.addQa")}
                  </Button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 border-b">
                  {["all", "verified", "unverified", "ai_generated"].map((filter) => (
                    <button
                      key={filter}
                      className={`px-3 py-1.5 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                        qaFilter === filter
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setQaFilter(filter)}
                    >
                      {t(`admin.knowledgeBasePage.qaFilter_${filter}`)}
                    </button>
                  ))}
                </div>

                {/* QA List */}
                {filteredQa.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t("admin.knowledgeBasePage.noQa")}</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {filteredQa.map((qa) => (
                      <div
                        key={qa.id}
                        className="flex flex-col p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {qa.is_verified ? (
                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-gray-400 shrink-0" />
                              )}
                              <h3 className="text-sm sm:text-base font-medium line-clamp-2">{qa.question}</h3>
                            </div>
                            {qa.answer && (
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 ml-6">
                                {qa.answer.slice(0, 120)}
                                {qa.answer.length > 120 ? "..." : ""}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              {getCategoryBadge(qa.category)}
                              {getSourceBadge(qa.source)}
                            </div>
                            {/* Confidence Score Bar */}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                                {t("admin.knowledgeBasePage.confidence")}:
                              </span>
                              <div className="flex-1 max-w-[120px] h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    qa.confidence_score >= 0.8
                                      ? "bg-green-500"
                                      : qa.confidence_score >= 0.5
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                  }`}
                                  style={{ width: `${qa.confidence_score * 100}%` }}
                                />
                              </div>
                              <span className="text-[10px] sm:text-xs text-muted-foreground">
                                {(qa.confidence_score * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground/60 mt-1">
                              {formatDate(qa.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 sm:h-8 text-xs gap-1"
                            onClick={() => {
                              setSelectedQa(qa);
                              setQaDetailOpen(true);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {t("admin.knowledgeBasePage.view")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 sm:h-8 text-xs gap-1"
                            onClick={() => openEditQa(qa)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                            {t("admin.knowledgeBasePage.edit")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 sm:h-8 text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => {
                              setQaForm({
                                question: qa.question,
                                answer: qa.answer || "",
                                category: qa.category,
                                source: qa.source,
                                confidence_score: qa.confidence_score,
                                is_verified: qa.is_verified ? "true" : "false",
                              });
                              setSelectedQa(qa);
                              setQaEditOpen(true);
                              // Trigger AI suggestion after dialog opens
                              setTimeout(() => handleAiSuggestAnswer(), 100);
                            }}
                          >
                            <Brain className="w-3.5 h-3.5" />
                            {t("admin.knowledgeBasePage.aiSuggestAnswer")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 sm:h-8 text-xs gap-1 text-purple-600 border-purple-200 hover:bg-purple-50"
                            onClick={() =>
                              handleGenerateEmbedding(
                                "ai_training_data",
                                qa.id,
                                qa.question + " " + (qa.answer || "")
                              )
                            }
                          >
                            <Zap className="w-3.5 h-3.5" />
                            {t("admin.knowledgeBasePage.generateEmbedding")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 sm:h-8 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => {
                              setSelectedQa(qa);
                              setQaDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {t("admin.knowledgeBasePage.delete")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* ==================== KNOWLEDGE CREATE DIALOG ==================== */}
      <Dialog open={knowledgeCreateOpen} onOpenChange={setKnowledgeCreateOpen}>
        <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {t("admin.knowledgeBasePage.createArticleTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("admin.knowledgeBasePage.createArticleDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 sm:py-4">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm text-muted-foreground">
                {t("admin.knowledgeBasePage.fieldTitle")}
              </label>
              <Input
                value={knowledgeForm.title}
                onChange={(e) => setKnowledgeForm({ ...knowledgeForm, title: e.target.value })}
                className="h-9 sm:h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm text-muted-foreground">
                {t("admin.knowledgeBasePage.fieldContent")}
              </label>
              <Textarea
                value={knowledgeForm.content}
                onChange={(e) => setKnowledgeForm({ ...knowledgeForm, content: e.target.value })}
                className="min-h-[160px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.knowledgeBasePage.fieldCategory")}
                </label>
                <Select
                  value={knowledgeForm.category}
                  onValueChange={(v) => setKnowledgeForm({ ...knowledgeForm, category: v })}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue placeholder={t("admin.knowledgeBasePage.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {KNOWLEDGE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {t(`admin.knowledgeBasePage.category_${cat}`) || cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.knowledgeBasePage.fieldStatus")}
                </label>
                <Select
                  value={knowledgeForm.is_active}
                  onValueChange={(v) => setKnowledgeForm({ ...knowledgeForm, is_active: v })}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("admin.knowledgeBasePage.statusActive")}</SelectItem>
                    <SelectItem value="inactive">{t("admin.knowledgeBasePage.statusInactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm text-muted-foreground">
                {t("admin.knowledgeBasePage.fieldTags")}
              </label>
              <Input
                value={knowledgeForm.tags}
                onChange={(e) => setKnowledgeForm({ ...knowledgeForm, tags: e.target.value })}
                placeholder={t("admin.knowledgeBasePage.tagsPlaceholder")}
                className="h-9 sm:h-10"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setKnowledgeCreateOpen(false)}
              className="w-full sm:w-auto"
            >
              {t("admin.knowledgeBasePage.cancel")}
            </Button>
            <Button
              onClick={() => createArticleMutation.mutate(knowledgeForm)}
              disabled={createArticleMutation.isPending || !knowledgeForm.title || !knowledgeForm.content || !knowledgeForm.category}
              className="w-full sm:w-auto"
            >
              {createArticleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("admin.knowledgeBasePage.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== KNOWLEDGE EDIT DIALOG ==================== */}
      <Dialog open={knowledgeEditOpen} onOpenChange={setKnowledgeEditOpen}>
        <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {t("admin.knowledgeBasePage.editArticleTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("admin.knowledgeBasePage.editArticleDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 sm:py-4">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm text-muted-foreground">
                {t("admin.knowledgeBasePage.fieldTitle")}
              </label>
              <Input
                value={knowledgeForm.title}
                onChange={(e) => setKnowledgeForm({ ...knowledgeForm, title: e.target.value })}
                className="h-9 sm:h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm text-muted-foreground">
                {t("admin.knowledgeBasePage.fieldContent")}
              </label>
              <Textarea
                value={knowledgeForm.content}
                onChange={(e) => setKnowledgeForm({ ...knowledgeForm, content: e.target.value })}
                className="min-h-[160px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.knowledgeBasePage.fieldCategory")}
                </label>
                <Select
                  value={knowledgeForm.category}
                  onValueChange={(v) => setKnowledgeForm({ ...knowledgeForm, category: v })}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue placeholder={t("admin.knowledgeBasePage.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {KNOWLEDGE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {t(`admin.knowledgeBasePage.category_${cat}`) || cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.knowledgeBasePage.fieldStatus")}
                </label>
                <Select
                  value={knowledgeForm.is_active}
                  onValueChange={(v) => setKnowledgeForm({ ...knowledgeForm, is_active: v })}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("admin.knowledgeBasePage.statusActive")}</SelectItem>
                    <SelectItem value="inactive">{t("admin.knowledgeBasePage.statusInactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm text-muted-foreground">
                {t("admin.knowledgeBasePage.fieldTags")}
              </label>
              <Input
                value={knowledgeForm.tags}
                onChange={(e) => setKnowledgeForm({ ...knowledgeForm, tags: e.target.value })}
                placeholder={t("admin.knowledgeBasePage.tagsPlaceholder")}
                className="h-9 sm:h-10"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setKnowledgeEditOpen(false)}
              className="w-full sm:w-auto"
            >
              {t("admin.knowledgeBasePage.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (selectedArticle) {
                  updateArticleMutation.mutate({ id: selectedArticle.id, formData: knowledgeForm });
                }
              }}
              disabled={updateArticleMutation.isPending || !knowledgeForm.title || !knowledgeForm.content || !knowledgeForm.category}
              className="w-full sm:w-auto"
            >
              {updateArticleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("admin.knowledgeBasePage.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== KNOWLEDGE DELETE DIALOG ==================== */}
      <Dialog open={knowledgeDeleteOpen} onOpenChange={setKnowledgeDeleteOpen}>
        <DialogContent className="w-[95vw] max-w-[450px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              {t("admin.knowledgeBasePage.deleteArticleTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("admin.knowledgeBasePage.deleteArticleDesc")}
            </DialogDescription>
          </DialogHeader>
          {selectedArticle && (
            <div className="py-2 sm:py-4">
              <p className="text-sm font-medium">{selectedArticle.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedArticle.content.slice(0, 80)}
                {selectedArticle.content.length > 80 ? "..." : ""}
              </p>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setKnowledgeDeleteOpen(false)}
              className="w-full sm:w-auto"
            >
              {t("admin.knowledgeBasePage.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedArticle) deleteArticleMutation.mutate(selectedArticle.id);
              }}
              disabled={deleteArticleMutation.isPending}
              className="w-full sm:w-auto"
            >
              {deleteArticleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("admin.knowledgeBasePage.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== KNOWLEDGE DETAIL DIALOG ==================== */}
      <Dialog open={knowledgeDetailOpen} onOpenChange={setKnowledgeDetailOpen}>
        <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {t("admin.knowledgeBasePage.articleDetail")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedArticle?.title}
            </DialogDescription>
          </DialogHeader>
          {selectedArticle && (
            <div className="space-y-4 py-2 sm:py-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    selectedArticle.is_active ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                <span className="text-xs sm:text-sm font-medium">
                  {selectedArticle.is_active
                    ? t("admin.knowledgeBasePage.statusActive")
                    : t("admin.knowledgeBasePage.statusInactive")}
                </span>
                {getCategoryBadge(selectedArticle.category)}
                {getSourceBadge(selectedArticle.source)}
              </div>
              {(selectedArticle.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedArticle.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="border rounded-lg p-3 sm:p-4 bg-muted/20">
                <p className="text-sm whitespace-pre-wrap break-words">{selectedArticle.content}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{t("admin.knowledgeBasePage.createdAt")}: {formatDate(selectedArticle.created_at)}</span>
                <span>{t("admin.knowledgeBasePage.updatedAt")}: {formatDate(selectedArticle.updated_at)}</span>
              </div>
              {selectedArticle.source_memory_id && (
                <p className="text-xs text-muted-foreground">
                  {t("admin.knowledgeBasePage.sourceMemoryId")}: {selectedArticle.source_memory_id}
                </p>
              )}
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setKnowledgeDetailOpen(false)} className="w-full sm:w-auto">
              {t("admin.knowledgeBasePage.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== QA CREATE DIALOG ==================== */}
      <Dialog open={qaCreateOpen} onOpenChange={setQaCreateOpen}>
        <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {t("admin.knowledgeBasePage.createQaTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("admin.knowledgeBasePage.createQaDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 sm:py-4">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm text-muted-foreground">
                {t("admin.knowledgeBasePage.fieldQuestion")}
              </label>
              <Input
                value={qaForm.question}
                onChange={(e) => setQaForm({ ...qaForm, question: e.target.value })}
                className="h-9 sm:h-10"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.knowledgeBasePage.fieldAnswer")}
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={handleAiSuggestAnswer}
                  disabled={aiSuggesting || !qaForm.question.trim()}
                >
                  {aiSuggesting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Brain className="w-3.5 h-3.5" />
                  )}
                  {t("admin.knowledgeBasePage.aiSuggestAnswer")}
                </Button>
              </div>
              <Textarea
                value={qaForm.answer}
                onChange={(e) => setQaForm({ ...qaForm, answer: e.target.value })}
                className="min-h-[120px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.knowledgeBasePage.fieldCategory")}
                </label>
                <Select
                  value={qaForm.category}
                  onValueChange={(v) => setQaForm({ ...qaForm, category: v })}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue placeholder={t("admin.knowledgeBasePage.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {QA_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {t(`admin.knowledgeBasePage.category_${cat}`) || cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.knowledgeBasePage.fieldSource")}
                </label>
                <Select
                  value={qaForm.source}
                  onValueChange={(v) => setQaForm({ ...qaForm, source: v })}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue placeholder={t("admin.knowledgeBasePage.selectSource")} />
                  </SelectTrigger>
                  <SelectContent>
                    {QA_SOURCES.map((src) => (
                      <SelectItem key={src} value={src}>
                        {t(`admin.knowledgeBasePage.source_${src}`) || src}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.knowledgeBasePage.fieldConfidence")}
                </label>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={qaForm.confidence_score}
                  onChange={(e) => setQaForm({ ...qaForm, confidence_score: parseFloat(e.target.value) || 0 })}
                  className="h-9 sm:h-10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.knowledgeBasePage.fieldVerified")}
                </label>
                <Select
                  value={qaForm.is_verified}
                  onValueChange={(v) => setQaForm({ ...qaForm, is_verified: v })}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t("admin.knowledgeBasePage.verified")}</SelectItem>
                    <SelectItem value="false">{t("admin.knowledgeBasePage.unverified")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setQaCreateOpen(false)}
              className="w-full sm:w-auto"
            >
              {t("admin.knowledgeBasePage.cancel")}
            </Button>
            <Button
              onClick={() => createQaMutation.mutate(qaForm)}
              disabled={createQaMutation.isPending || !qaForm.question || !qaForm.category || !qaForm.source}
              className="w-full sm:w-auto"
            >
              {createQaMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("admin.knowledgeBasePage.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== QA EDIT DIALOG ==================== */}
      <Dialog open={qaEditOpen} onOpenChange={setQaEditOpen}>
        <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {t("admin.knowledgeBasePage.editQaTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("admin.knowledgeBasePage.editQaDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 sm:py-4">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm text-muted-foreground">
                {t("admin.knowledgeBasePage.fieldQuestion")}
              </label>
              <Input
                value={qaForm.question}
                onChange={(e) => setQaForm({ ...qaForm, question: e.target.value })}
                className="h-9 sm:h-10"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.knowledgeBasePage.fieldAnswer")}
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={handleAiSuggestAnswer}
                  disabled={aiSuggesting || !qaForm.question.trim()}
                >
                  {aiSuggesting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Brain className="w-3.5 h-3.5" />
                  )}
                  {t("admin.knowledgeBasePage.aiSuggestAnswer")}
                </Button>
              </div>
              <Textarea
                value={qaForm.answer}
                onChange={(e) => setQaForm({ ...qaForm, answer: e.target.value })}
                className="min-h-[120px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.knowledgeBasePage.fieldCategory")}
                </label>
                <Select
                  value={qaForm.category}
                  onValueChange={(v) => setQaForm({ ...qaForm, category: v })}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue placeholder={t("admin.knowledgeBasePage.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {QA_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {t(`admin.knowledgeBasePage.category_${cat}`) || cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.knowledgeBasePage.fieldSource")}
                </label>
                <Select
                  value={qaForm.source}
                  onValueChange={(v) => setQaForm({ ...qaForm, source: v })}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue placeholder={t("admin.knowledgeBasePage.selectSource")} />
                  </SelectTrigger>
                  <SelectContent>
                    {QA_SOURCES.map((src) => (
                      <SelectItem key={src} value={src}>
                        {t(`admin.knowledgeBasePage.source_${src}`) || src}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.knowledgeBasePage.fieldConfidence")}
                </label>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={qaForm.confidence_score}
                  onChange={(e) => setQaForm({ ...qaForm, confidence_score: parseFloat(e.target.value) || 0 })}
                  className="h-9 sm:h-10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.knowledgeBasePage.fieldVerified")}
                </label>
                <Select
                  value={qaForm.is_verified}
                  onValueChange={(v) => setQaForm({ ...qaForm, is_verified: v })}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t("admin.knowledgeBasePage.verified")}</SelectItem>
                    <SelectItem value="false">{t("admin.knowledgeBasePage.unverified")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setQaEditOpen(false)}
              className="w-full sm:w-auto"
            >
              {t("admin.knowledgeBasePage.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (selectedQa) {
                  updateQaMutation.mutate({ id: selectedQa.id, formData: qaForm });
                }
              }}
              disabled={updateQaMutation.isPending || !qaForm.question || !qaForm.category || !qaForm.source}
              className="w-full sm:w-auto"
            >
              {updateQaMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("admin.knowledgeBasePage.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== QA DELETE DIALOG ==================== */}
      <Dialog open={qaDeleteOpen} onOpenChange={setQaDeleteOpen}>
        <DialogContent className="w-[95vw] max-w-[450px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              {t("admin.knowledgeBasePage.deleteQaTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("admin.knowledgeBasePage.deleteQaDesc")}
            </DialogDescription>
          </DialogHeader>
          {selectedQa && (
            <div className="py-2 sm:py-4">
              <p className="text-sm font-medium">{selectedQa.question}</p>
              {selectedQa.answer && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedQa.answer.slice(0, 80)}
                  {selectedQa.answer.length > 80 ? "..." : ""}
                </p>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setQaDeleteOpen(false)}
              className="w-full sm:w-auto"
            >
              {t("admin.knowledgeBasePage.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedQa) deleteQaMutation.mutate(selectedQa.id);
              }}
              disabled={deleteQaMutation.isPending}
              className="w-full sm:w-auto"
            >
              {deleteQaMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("admin.knowledgeBasePage.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== QA DETAIL DIALOG ==================== */}
      <Dialog open={qaDetailOpen} onOpenChange={setQaDetailOpen}>
        <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {t("admin.knowledgeBasePage.qaDetail")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("admin.knowledgeBasePage.qaDetailDesc")}
            </DialogDescription>
          </DialogHeader>
          {selectedQa && (
            <div className="space-y-4 py-2 sm:py-4">
              <div className="flex items-center gap-2 flex-wrap">
                {selectedQa.is_verified ? (
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {t("admin.knowledgeBasePage.verified")}
                  </Badge>
                ) : (
                  <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20 gap-1">
                    <XCircle className="w-3 h-3" />
                    {t("admin.knowledgeBasePage.unverified")}
                  </Badge>
                )}
                {getCategoryBadge(selectedQa.category)}
                {getSourceBadge(selectedQa.source)}
              </div>

              {/* Question */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {t("admin.knowledgeBasePage.fieldQuestion")}
                </label>
                <div className="border rounded-lg p-3 sm:p-4 bg-muted/20">
                  <p className="text-sm whitespace-pre-wrap break-words">{selectedQa.question}</p>
                </div>
              </div>

              {/* Answer */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {t("admin.knowledgeBasePage.fieldAnswer")}
                </label>
                <div className="border rounded-lg p-3 sm:p-4 bg-muted/20">
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {selectedQa.answer || t("admin.knowledgeBasePage.noAnswer")}
                  </p>
                </div>
              </div>

              {/* Confidence */}
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.knowledgeBasePage.confidence")}:
                </span>
                <div className="flex-1 max-w-[200px] h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedQa.confidence_score >= 0.8
                        ? "bg-green-500"
                        : selectedQa.confidence_score >= 0.5
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${selectedQa.confidence_score * 100}%` }}
                  />
                </div>
                <span className="text-xs sm:text-sm font-medium">
                  {(selectedQa.confidence_score * 100).toFixed(0)}%
                </span>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{t("admin.knowledgeBasePage.createdAt")}: {formatDate(selectedQa.created_at)}</span>
                <span>{t("admin.knowledgeBasePage.updatedAt")}: {formatDate(selectedQa.updated_at)}</span>
              </div>
              {selectedQa.metadata != null ? (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    {t("admin.knowledgeBasePage.metadata")}
                  </label>
                  <pre className="text-xs bg-muted/30 border rounded-lg p-2 overflow-x-auto">
                    {String(JSON.stringify(selectedQa.metadata, null, 2))}
                  </pre>
                </div>
              ) : null}
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setQaDetailOpen(false)} className="w-full sm:w-auto">
              {t("admin.knowledgeBasePage.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
