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
  Brain,
  Database,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  Users,
  UserCheck,
  Loader2,
  Zap,
  BookOpen,
  Star,
} from "lucide-react";

// --- Type definitions ---

interface ProductMemory {
  id: string;
  product_id: string | null;
  category: string;
  title: string;
  content: string;
  language: string;
  priority: number;
  is_active: boolean;
  embedding: unknown;
  created_at: string;
  updated_at: string;
}

interface CustomerMemory {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  memory_type: string;
  content: string;
  importance: number;
  source: string;
  metadata: unknown;
  embedding: unknown;
  created_at: string;
  updated_at: string;
}

interface PartnerMemory {
  id: string;
  category: string;
  title: string;
  content: string;
  language: string;
  priority: number;
  is_active: boolean;
  embedding: unknown;
  created_at: string;
  updated_at: string;
}

// --- Constants ---

const PRODUCT_CATEGORIES = ["features", "ingredients", "usage", "benefits", "storage", "other"];
const CUSTOMER_MEMORY_TYPES = ["preference", "complaint", "purchase_history", "interaction", "feedback", "other"];
const CUSTOMER_SOURCES = ["ai_detected", "manual", "chatbot"];
const PARTNER_CATEGORIES = ["policy", "commission", "tier", "benefit", "faq", "other"];
const LANGUAGES = ["zh", "en", "ms"];

// --- Component ---

export default function AdminMemoryDatabasePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"product" | "customer" | "partner">("product");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [phoneFilter, setPhoneFilter] = useState("");

  // Dialog states
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);

  // Editing state
  const [editingProductMemory, setEditingProductMemory] = useState<ProductMemory | null>(null);
  const [editingCustomerMemory, setEditingCustomerMemory] = useState<CustomerMemory | null>(null);
  const [editingPartnerMemory, setEditingPartnerMemory] = useState<PartnerMemory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ table: string; id: string; title: string } | null>(null);

  // Product memory form state
  const [formProductId, setFormProductId] = useState("");
  const [formCategory, setFormCategory] = useState("features");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formLanguage, setFormLanguage] = useState("zh");
  const [formPriority, setFormPriority] = useState(3);
  const [formIsActive, setFormIsActive] = useState(true);

  // Customer memory form state
  const [formCustomerPhone, setFormCustomerPhone] = useState("");
  const [formCustomerName, setFormCustomerName] = useState("");
  const [formMemoryType, setFormMemoryType] = useState("preference");
  const [formImportance, setFormImportance] = useState(3);
  const [formSource, setFormSource] = useState("manual");

  // --- Data fetching ---

  const { data: productMemories = [], isLoading: loadingProduct } = useQuery({
    queryKey: ["product-memory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_memory")
        .select("*")
        .order("priority", { ascending: false });
      if (error) {
        console.error("Error fetching product_memory:", error);
        return [];
      }
      return (data || []) as ProductMemory[];
    },
  });

  const { data: customerMemories = [], isLoading: loadingCustomer } = useQuery({
    queryKey: ["customer-memory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_memory")
        .select("*")
        .order("importance", { ascending: false });
      if (error) {
        console.error("Error fetching customer_memory:", error);
        return [];
      }
      return (data || []) as CustomerMemory[];
    },
  });

  const { data: partnerMemories = [], isLoading: loadingPartner } = useQuery({
    queryKey: ["partner-memory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_memory")
        .select("*")
        .order("priority", { ascending: false });
      if (error) {
        console.error("Error fetching partner_memory:", error);
        return [];
      }
      return (data || []) as PartnerMemory[];
    },
  });

  // --- Stats ---

  const stats = {
    total: productMemories.length + customerMemories.length + partnerMemories.length,
    product: productMemories.length,
    customer: customerMemories.length,
    partner: partnerMemories.length,
  };

  // --- Filtered data ---

  const filteredProductMemories = productMemories.filter((m) => {
    const matchesSearch =
      searchQuery === "" ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredCustomerMemories = customerMemories.filter((m) => {
    const matchesSearch =
      searchQuery === "" ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPhone = phoneFilter === "" || m.customer_phone.includes(phoneFilter);
    return matchesSearch && matchesPhone;
  });

  const filteredPartnerMemories = partnerMemories.filter((m) => {
    const matchesSearch =
      searchQuery === "" ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // --- Mutations ---

  const saveProductMemoryMutation = useMutation({
    mutationFn: async (data: Partial<ProductMemory> & { id?: string }) => {
      const payload = {
        product_id: data.product_id || null,
        category: data.category,
        title: data.title,
        content: data.content,
        language: data.language,
        priority: data.priority,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      };
      if (data.id) {
        const { error } = await supabase.from("product_memory").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("product_memory").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-memory"] });
      setShowFormDialog(false);
      toast({ title: t("admin.memoryDatabasePage.saveSuccess") });
    },
    onError: (error) => {
      toast({ title: t("admin.memoryDatabasePage.saveError"), description: String(error), variant: "destructive" });
    },
  });

  const saveCustomerMemoryMutation = useMutation({
    mutationFn: async (data: Partial<CustomerMemory> & { id?: string }) => {
      const payload = {
        customer_phone: data.customer_phone,
        customer_name: data.customer_name || null,
        memory_type: data.memory_type,
        content: data.content,
        importance: data.importance,
        source: data.source,
        updated_at: new Date().toISOString(),
      };
      if (data.id) {
        const { error } = await supabase.from("customer_memory").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("customer_memory").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-memory"] });
      setShowFormDialog(false);
      toast({ title: t("admin.memoryDatabasePage.saveSuccess") });
    },
    onError: (error) => {
      toast({ title: t("admin.memoryDatabasePage.saveError"), description: String(error), variant: "destructive" });
    },
  });

  const savePartnerMemoryMutation = useMutation({
    mutationFn: async (data: Partial<PartnerMemory> & { id?: string }) => {
      const payload = {
        category: data.category,
        title: data.title,
        content: data.content,
        language: data.language,
        priority: data.priority,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      };
      if (data.id) {
        const { error } = await supabase.from("partner_memory").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("partner_memory").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-memory"] });
      setShowFormDialog(false);
      toast({ title: t("admin.memoryDatabasePage.saveSuccess") });
    },
    onError: (error) => {
      toast({ title: t("admin.memoryDatabasePage.saveError"), description: String(error), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ table, id }: { table: string; id: string }) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-memory"] });
      queryClient.invalidateQueries({ queryKey: ["customer-memory"] });
      queryClient.invalidateQueries({ queryKey: ["partner-memory"] });
      setShowDeleteDialog(false);
      setDeleteTarget(null);
      toast({ title: t("admin.memoryDatabasePage.deleteSuccess") });
    },
    onError: (error) => {
      toast({ title: t("admin.memoryDatabasePage.deleteError"), description: String(error), variant: "destructive" });
    },
  });

  const generateEmbeddingMutation = useMutation({
    mutationFn: async ({ text, table, record_id }: { text: string; table: string; record_id: string }) => {
      const { error } = await supabase.functions.invoke("generate-embedding", {
        body: { text, table, record_id },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("admin.memoryDatabasePage.embeddingSuccess") });
    },
    onError: (error) => {
      toast({ title: t("admin.memoryDatabasePage.embeddingError"), description: String(error), variant: "destructive" });
    },
  });

  const strengthenKnowledgeMutation = useMutation({
    mutationFn: async ({ title, content, category }: { title: string; content: string; category: string }) => {
      const { error } = await supabase.from("ai_knowledge_base").insert({
        title,
        content,
        category,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("admin.memoryDatabasePage.strengthenSuccess") });
    },
    onError: (error) => {
      toast({ title: t("admin.memoryDatabasePage.strengthenError"), description: String(error), variant: "destructive" });
    },
  });

  // --- Handlers ---

  const resetForm = () => {
    setFormProductId("");
    setFormCategory("features");
    setFormTitle("");
    setFormContent("");
    setFormLanguage("zh");
    setFormPriority(3);
    setFormIsActive(true);
    setFormCustomerPhone("");
    setFormCustomerName("");
    setFormMemoryType("preference");
    setFormImportance(3);
    setFormSource("manual");
    setEditingProductMemory(null);
    setEditingCustomerMemory(null);
    setEditingPartnerMemory(null);
  };

  const handleNewMemory = () => {
    resetForm();
    if (activeTab === "product") {
      setFormCategory("features");
    } else if (activeTab === "customer") {
      setFormMemoryType("preference");
      setFormSource("manual");
    } else {
      setFormCategory("policy");
    }
    setShowFormDialog(true);
  };

  const handleEditProductMemory = (memory: ProductMemory) => {
    resetForm();
    setEditingProductMemory(memory);
    setFormProductId(memory.product_id || "");
    setFormCategory(memory.category);
    setFormTitle(memory.title);
    setFormContent(memory.content);
    setFormLanguage(memory.language);
    setFormPriority(memory.priority);
    setFormIsActive(memory.is_active);
    setShowFormDialog(true);
  };

  const handleEditCustomerMemory = (memory: CustomerMemory) => {
    resetForm();
    setEditingCustomerMemory(memory);
    setFormCustomerPhone(memory.customer_phone);
    setFormCustomerName(memory.customer_name || "");
    setFormMemoryType(memory.memory_type);
    setFormContent(memory.content);
    setFormImportance(memory.importance);
    setFormSource(memory.source);
    setShowFormDialog(true);
  };

  const handleEditPartnerMemory = (memory: PartnerMemory) => {
    resetForm();
    setEditingPartnerMemory(memory);
    setFormCategory(memory.category);
    setFormTitle(memory.title);
    setFormContent(memory.content);
    setFormLanguage(memory.language);
    setFormPriority(memory.priority);
    setFormIsActive(memory.is_active);
    setShowFormDialog(true);
  };

  const handleSave = () => {
    if (activeTab === "product") {
      saveProductMemoryMutation.mutate({
        id: editingProductMemory?.id,
        product_id: formProductId || null,
        category: formCategory,
        title: formTitle,
        content: formContent,
        language: formLanguage,
        priority: formPriority,
        is_active: formIsActive,
      });
    } else if (activeTab === "customer") {
      saveCustomerMemoryMutation.mutate({
        id: editingCustomerMemory?.id,
        customer_phone: formCustomerPhone,
        customer_name: formCustomerName || null,
        memory_type: formMemoryType,
        content: formContent,
        importance: formImportance,
        source: formSource,
      });
    } else {
      savePartnerMemoryMutation.mutate({
        id: editingPartnerMemory?.id,
        category: formCategory,
        title: formTitle,
        content: formContent,
        language: formLanguage,
        priority: formPriority,
        is_active: formIsActive,
      });
    }
  };

  const handleDelete = (table: string, id: string, title: string) => {
    setDeleteTarget({ table, id, title });
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate({ table: deleteTarget.table, id: deleteTarget.id });
    }
  };

  // --- Helpers ---

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const renderStars = (rating: number) => {
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

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      features: "bg-blue-500/10 text-blue-600 border-blue-200",
      ingredients: "bg-green-500/10 text-green-600 border-green-200",
      usage: "bg-purple-500/10 text-purple-600 border-purple-200",
      benefits: "bg-amber-500/10 text-amber-600 border-amber-200",
      storage: "bg-gray-500/10 text-gray-600 border-gray-200",
      policy: "bg-blue-500/10 text-blue-600 border-blue-200",
      commission: "bg-green-500/10 text-green-600 border-green-200",
      tier: "bg-purple-500/10 text-purple-600 border-purple-200",
      benefit: "bg-amber-500/10 text-amber-600 border-amber-200",
      faq: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
      preference: "bg-pink-500/10 text-pink-600 border-pink-200",
      complaint: "bg-red-500/10 text-red-600 border-red-200",
      purchase_history: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      interaction: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
      feedback: "bg-orange-500/10 text-orange-600 border-orange-200",
      other: "bg-gray-500/10 text-gray-600 border-gray-200",
    };
    return colors[category] || colors.other;
  };

  const getLanguageBadge = (lang: string) => {
    const labels: Record<string, string> = { zh: "ZH", en: "EN", ms: "MS" };
    return (
      <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5">
        {labels[lang] || lang}
      </Badge>
    );
  };

  const isSaving =
    saveProductMemoryMutation.isPending ||
    saveCustomerMemoryMutation.isPending ||
    savePartnerMemoryMutation.isPending;

  const isLoading = loadingProduct || loadingCustomer || loadingPartner;

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
              {t("admin.memoryDatabasePage.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("admin.memoryDatabasePage.subtitle")}
            </p>
          </div>
          <Button className="gap-2" onClick={handleNewMemory}>
            <Plus className="w-4 h-4" />
            {t("admin.memoryDatabasePage.addMemory")}
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {t("admin.memoryDatabasePage.statTotal")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-blue-500">{stats.product}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {t("admin.memoryDatabasePage.statProduct")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-green-500">{stats.customer}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {t("admin.memoryDatabasePage.statCustomer")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5 text-purple-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-purple-500">{stats.partner}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {t("admin.memoryDatabasePage.statPartner")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "product"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => { setActiveTab("product"); setSearchQuery(""); setCategoryFilter("all"); setPhoneFilter(""); }}
          >
            <Package className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            {t("admin.memoryDatabasePage.tabProduct")}
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "customer"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => { setActiveTab("customer"); setSearchQuery(""); setCategoryFilter("all"); setPhoneFilter(""); }}
          >
            <Users className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            {t("admin.memoryDatabasePage.tabCustomer")}
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "partner"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => { setActiveTab("partner"); setSearchQuery(""); setCategoryFilter("all"); setPhoneFilter(""); }}
          >
            <UserCheck className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            {t("admin.memoryDatabasePage.tabPartner")}
          </button>
        </div>

        {/* Tab: Product Memory */}
        {activeTab === "product" && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  {t("admin.memoryDatabasePage.productMemoryTitle")} ({filteredProductMemories.length})
                </CardTitle>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-9 sm:h-10 w-full sm:w-40">
                      <SelectValue placeholder={t("admin.memoryDatabasePage.filterCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.memoryDatabasePage.allCategories")}</SelectItem>
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t("admin.memoryDatabasePage.searchPlaceholder")}
                      className="pl-9 h-9 sm:h-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {filteredProductMemories.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">{t("admin.memoryDatabasePage.noMemories")}</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {filteredProductMemories.map((memory) => (
                    <div
                      key={memory.id}
                      className={`p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                        !memory.is_active ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                            <span className="font-medium text-sm sm:text-base">{memory.title}</span>
                            <Badge className={getCategoryBadgeColor(memory.category)} variant="outline">
                              {memory.category}
                            </Badge>
                            {getLanguageBadge(memory.language)}
                            {!memory.is_active && (
                              <Badge variant="outline" className="text-[10px] sm:text-xs text-red-500 border-red-200">
                                {t("admin.memoryDatabasePage.inactive")}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            {renderStars(memory.priority)}
                            <span className="text-xs text-muted-foreground">{formatDate(memory.created_at)}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{memory.content}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingProductMemory(memory);
                              setShowViewDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditProductMemory(memory)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              generateEmbeddingMutation.mutate({
                                text: memory.content,
                                table: "product_memory",
                                record_id: memory.id,
                              })
                            }
                            disabled={generateEmbeddingMutation.isPending}
                          >
                            {generateEmbeddingMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Zap className="w-4 h-4 text-amber-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              strengthenKnowledgeMutation.mutate({
                                title: memory.title,
                                content: memory.content,
                                category: memory.category,
                              })
                            }
                            disabled={strengthenKnowledgeMutation.isPending}
                          >
                            {strengthenKnowledgeMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <BookOpen className="w-4 h-4 text-blue-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete("product_memory", memory.id, memory.title)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab: Customer Memory */}
        {activeTab === "customer" && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  {t("admin.memoryDatabasePage.customerMemoryTitle")} ({filteredCustomerMemories.length})
                </CardTitle>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative w-full sm:w-44">
                    <Input
                      placeholder={t("admin.memoryDatabasePage.filterPhone")}
                      className="h-9 sm:h-10"
                      value={phoneFilter}
                      onChange={(e) => setPhoneFilter(e.target.value)}
                    />
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t("admin.memoryDatabasePage.searchPlaceholder")}
                      className="pl-9 h-9 sm:h-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {filteredCustomerMemories.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">{t("admin.memoryDatabasePage.noMemories")}</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {filteredCustomerMemories.map((memory) => (
                    <div
                      key={memory.id}
                      className="p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                            <span className="font-medium text-sm sm:text-base">
                              {memory.customer_name || memory.customer_phone}
                            </span>
                            {memory.customer_name && (
                              <span className="text-xs text-muted-foreground">{memory.customer_phone}</span>
                            )}
                            <Badge className={getCategoryBadgeColor(memory.memory_type)} variant="outline">
                              {memory.memory_type}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] sm:text-xs">
                              {memory.source}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            {renderStars(memory.importance)}
                            <span className="text-xs text-muted-foreground">{formatDate(memory.created_at)}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{memory.content}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingCustomerMemory(memory);
                              setShowViewDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditCustomerMemory(memory)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              generateEmbeddingMutation.mutate({
                                text: memory.content,
                                table: "customer_memory",
                                record_id: memory.id,
                              })
                            }
                            disabled={generateEmbeddingMutation.isPending}
                          >
                            {generateEmbeddingMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Zap className="w-4 h-4 text-amber-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() =>
                              handleDelete("customer_memory", memory.id, memory.customer_name || memory.customer_phone)
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab: Partner Memory */}
        {activeTab === "partner" && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                  {t("admin.memoryDatabasePage.partnerMemoryTitle")} ({filteredPartnerMemories.length})
                </CardTitle>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-9 sm:h-10 w-full sm:w-40">
                      <SelectValue placeholder={t("admin.memoryDatabasePage.filterCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.memoryDatabasePage.allCategories")}</SelectItem>
                      {PARTNER_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t("admin.memoryDatabasePage.searchPlaceholder")}
                      className="pl-9 h-9 sm:h-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {filteredPartnerMemories.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">{t("admin.memoryDatabasePage.noMemories")}</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {filteredPartnerMemories.map((memory) => (
                    <div
                      key={memory.id}
                      className={`p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                        !memory.is_active ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                            <span className="font-medium text-sm sm:text-base">{memory.title}</span>
                            <Badge className={getCategoryBadgeColor(memory.category)} variant="outline">
                              {memory.category}
                            </Badge>
                            {getLanguageBadge(memory.language)}
                            {!memory.is_active && (
                              <Badge variant="outline" className="text-[10px] sm:text-xs text-red-500 border-red-200">
                                {t("admin.memoryDatabasePage.inactive")}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            {renderStars(memory.priority)}
                            <span className="text-xs text-muted-foreground">{formatDate(memory.created_at)}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{memory.content}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingPartnerMemory(memory);
                              setShowViewDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditPartnerMemory(memory)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              generateEmbeddingMutation.mutate({
                                text: memory.content,
                                table: "partner_memory",
                                record_id: memory.id,
                              })
                            }
                            disabled={generateEmbeddingMutation.isPending}
                          >
                            {generateEmbeddingMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Zap className="w-4 h-4 text-amber-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              strengthenKnowledgeMutation.mutate({
                                title: memory.title,
                                content: memory.content,
                                category: memory.category,
                              })
                            }
                            disabled={strengthenKnowledgeMutation.isPending}
                          >
                            {strengthenKnowledgeMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <BookOpen className="w-4 h-4 text-blue-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete("partner_memory", memory.id, memory.title)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {activeTab === "product"
                ? editingProductMemory
                  ? t("admin.memoryDatabasePage.editProductMemory")
                  : t("admin.memoryDatabasePage.addProductMemory")
                : activeTab === "customer"
                ? editingCustomerMemory
                  ? t("admin.memoryDatabasePage.editCustomerMemory")
                  : t("admin.memoryDatabasePage.addCustomerMemory")
                : editingPartnerMemory
                ? t("admin.memoryDatabasePage.editPartnerMemory")
                : t("admin.memoryDatabasePage.addPartnerMemory")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("admin.memoryDatabasePage.formDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 sm:py-4">
            {/* Product Memory Form */}
            {activeTab === "product" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.memoryDatabasePage.fieldProductId")}
                  </label>
                  <Input
                    value={formProductId}
                    onChange={(e) => setFormProductId(e.target.value)}
                    placeholder={t("admin.memoryDatabasePage.fieldProductIdPlaceholder")}
                    className="h-9 sm:h-10"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm text-muted-foreground">
                      {t("admin.memoryDatabasePage.fieldCategory")}
                    </label>
                    <Select value={formCategory} onValueChange={setFormCategory}>
                      <SelectTrigger className="h-9 sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm text-muted-foreground">
                      {t("admin.memoryDatabasePage.fieldLanguage")}
                    </label>
                    <Select value={formLanguage} onValueChange={setFormLanguage}>
                      <SelectTrigger className="h-9 sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang} value={lang}>{lang.toUpperCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.memoryDatabasePage.fieldTitle")}
                  </label>
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.memoryDatabasePage.fieldContent")}
                  </label>
                  <Textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm text-muted-foreground">
                      {t("admin.memoryDatabasePage.fieldPriority")} (1-5)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={formPriority}
                      onChange={(e) => setFormPriority(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="h-9 sm:h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm text-muted-foreground">
                      {t("admin.memoryDatabasePage.fieldIsActive")}
                    </label>
                    <div className="flex items-center gap-2 h-9 sm:h-10">
                      <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                      <span className="text-sm">
                        {formIsActive
                          ? t("admin.memoryDatabasePage.active")
                          : t("admin.memoryDatabasePage.inactive")}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Customer Memory Form */}
            {activeTab === "customer" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm text-muted-foreground">
                      {t("admin.memoryDatabasePage.fieldCustomerPhone")}
                    </label>
                    <Input
                      value={formCustomerPhone}
                      onChange={(e) => setFormCustomerPhone(e.target.value)}
                      placeholder="+60..."
                      className="h-9 sm:h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm text-muted-foreground">
                      {t("admin.memoryDatabasePage.fieldCustomerName")}
                    </label>
                    <Input
                      value={formCustomerName}
                      onChange={(e) => setFormCustomerName(e.target.value)}
                      className="h-9 sm:h-10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm text-muted-foreground">
                      {t("admin.memoryDatabasePage.fieldMemoryType")}
                    </label>
                    <Select value={formMemoryType} onValueChange={setFormMemoryType}>
                      <SelectTrigger className="h-9 sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CUSTOMER_MEMORY_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm text-muted-foreground">
                      {t("admin.memoryDatabasePage.fieldSource")}
                    </label>
                    <Select value={formSource} onValueChange={setFormSource}>
                      <SelectTrigger className="h-9 sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CUSTOMER_SOURCES.map((src) => (
                          <SelectItem key={src} value={src}>{src}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.memoryDatabasePage.fieldContent")}
                  </label>
                  <Textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.memoryDatabasePage.fieldImportance")} (1-5)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={formImportance}
                    onChange={(e) => setFormImportance(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="h-9 sm:h-10"
                  />
                </div>
              </>
            )}

            {/* Partner Memory Form */}
            {activeTab === "partner" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm text-muted-foreground">
                      {t("admin.memoryDatabasePage.fieldCategory")}
                    </label>
                    <Select value={formCategory} onValueChange={setFormCategory}>
                      <SelectTrigger className="h-9 sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PARTNER_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm text-muted-foreground">
                      {t("admin.memoryDatabasePage.fieldLanguage")}
                    </label>
                    <Select value={formLanguage} onValueChange={setFormLanguage}>
                      <SelectTrigger className="h-9 sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang} value={lang}>{lang.toUpperCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.memoryDatabasePage.fieldTitle")}
                  </label>
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.memoryDatabasePage.fieldContent")}
                  </label>
                  <Textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm text-muted-foreground">
                      {t("admin.memoryDatabasePage.fieldPriority")} (1-5)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={formPriority}
                      onChange={(e) => setFormPriority(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="h-9 sm:h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm text-muted-foreground">
                      {t("admin.memoryDatabasePage.fieldIsActive")}
                    </label>
                    <div className="flex items-center gap-2 h-9 sm:h-10">
                      <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                      <span className="text-sm">
                        {formIsActive
                          ? t("admin.memoryDatabasePage.active")
                          : t("admin.memoryDatabasePage.inactive")}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFormDialog(false)}
              className="w-full sm:w-auto"
            >
              {t("admin.memoryDatabasePage.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("admin.memoryDatabasePage.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={(open) => {
        setShowViewDialog(open);
        if (!open) {
          setEditingProductMemory(null);
          setEditingCustomerMemory(null);
          setEditingPartnerMemory(null);
        }
      }}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {t("admin.memoryDatabasePage.viewDetail")}
            </DialogTitle>
          </DialogHeader>

          {editingProductMemory && activeTab === "product" && (
            <div className="space-y-4 py-2 sm:py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("admin.memoryDatabasePage.fieldTitle")}</p>
                  <p className="font-medium">{editingProductMemory.title}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("admin.memoryDatabasePage.fieldProductId")}</p>
                  <p className="font-medium">{editingProductMemory.product_id || "-"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={getCategoryBadgeColor(editingProductMemory.category)} variant="outline">
                  {editingProductMemory.category}
                </Badge>
                {getLanguageBadge(editingProductMemory.language)}
                <Badge variant={editingProductMemory.is_active ? "default" : "destructive"}>
                  {editingProductMemory.is_active ? t("admin.memoryDatabasePage.active") : t("admin.memoryDatabasePage.inactive")}
                </Badge>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t("admin.memoryDatabasePage.fieldPriority")}</p>
                {renderStars(editingProductMemory.priority)}
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t("admin.memoryDatabasePage.fieldContent")}</p>
                <div className="border rounded-lg p-3 bg-muted/20 max-h-[40vh] overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{editingProductMemory.content}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{t("admin.memoryDatabasePage.createdAt")}: {formatDate(editingProductMemory.created_at)}</span>
                <span>{t("admin.memoryDatabasePage.updatedAt")}: {formatDate(editingProductMemory.updated_at)}</span>
                <span>{editingProductMemory.embedding ? t("admin.memoryDatabasePage.hasEmbedding") : t("admin.memoryDatabasePage.noEmbedding")}</span>
              </div>
            </div>
          )}

          {editingCustomerMemory && activeTab === "customer" && (
            <div className="space-y-4 py-2 sm:py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("admin.memoryDatabasePage.fieldCustomerName")}</p>
                  <p className="font-medium">{editingCustomerMemory.customer_name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("admin.memoryDatabasePage.fieldCustomerPhone")}</p>
                  <p className="font-medium">{editingCustomerMemory.customer_phone}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={getCategoryBadgeColor(editingCustomerMemory.memory_type)} variant="outline">
                  {editingCustomerMemory.memory_type}
                </Badge>
                <Badge variant="outline">{editingCustomerMemory.source}</Badge>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t("admin.memoryDatabasePage.fieldImportance")}</p>
                {renderStars(editingCustomerMemory.importance)}
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t("admin.memoryDatabasePage.fieldContent")}</p>
                <div className="border rounded-lg p-3 bg-muted/20 max-h-[40vh] overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{editingCustomerMemory.content}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{t("admin.memoryDatabasePage.createdAt")}: {formatDate(editingCustomerMemory.created_at)}</span>
                <span>{t("admin.memoryDatabasePage.updatedAt")}: {formatDate(editingCustomerMemory.updated_at)}</span>
                <span>{editingCustomerMemory.embedding ? t("admin.memoryDatabasePage.hasEmbedding") : t("admin.memoryDatabasePage.noEmbedding")}</span>
              </div>
            </div>
          )}

          {editingPartnerMemory && activeTab === "partner" && (
            <div className="space-y-4 py-2 sm:py-4">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">{t("admin.memoryDatabasePage.fieldTitle")}</p>
                <p className="font-medium">{editingPartnerMemory.title}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={getCategoryBadgeColor(editingPartnerMemory.category)} variant="outline">
                  {editingPartnerMemory.category}
                </Badge>
                {getLanguageBadge(editingPartnerMemory.language)}
                <Badge variant={editingPartnerMemory.is_active ? "default" : "destructive"}>
                  {editingPartnerMemory.is_active ? t("admin.memoryDatabasePage.active") : t("admin.memoryDatabasePage.inactive")}
                </Badge>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t("admin.memoryDatabasePage.fieldPriority")}</p>
                {renderStars(editingPartnerMemory.priority)}
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t("admin.memoryDatabasePage.fieldContent")}</p>
                <div className="border rounded-lg p-3 bg-muted/20 max-h-[40vh] overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{editingPartnerMemory.content}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{t("admin.memoryDatabasePage.createdAt")}: {formatDate(editingPartnerMemory.created_at)}</span>
                <span>{t("admin.memoryDatabasePage.updatedAt")}: {formatDate(editingPartnerMemory.updated_at)}</span>
                <span>{editingPartnerMemory.embedding ? t("admin.memoryDatabasePage.hasEmbedding") : t("admin.memoryDatabasePage.noEmbedding")}</span>
              </div>
            </div>
          )}

          <DialogFooter className="mt-3 sm:mt-4">
            <Button variant="outline" onClick={() => setShowViewDialog(false)} className="w-full sm:w-auto">
              {t("admin.memoryDatabasePage.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="w-[95vw] max-w-[400px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive text-base sm:text-lg">
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              {t("admin.memoryDatabasePage.deleteConfirmTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("admin.memoryDatabasePage.deleteConfirmDesc")} "{deleteTarget?.title}"
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="w-full sm:w-auto"
            >
              {t("admin.memoryDatabasePage.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="w-full sm:w-auto"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("admin.memoryDatabasePage.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
