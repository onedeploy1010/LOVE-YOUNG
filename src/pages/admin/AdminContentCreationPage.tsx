import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
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
  PenSquare, Search, Plus, Edit, Trash2, Loader2,
  Sparkles, Eye, Calendar, Target, Image, Hash,
  FileText, Copy, ExternalLink,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface MarketingContent {
  id: string;
  title: string;
  body: string | null;
  content_type: string;
  platform: string[];
  cover_image: string | null;
  media_urls: string[];
  tags: string[];
  status: string;
  ai_generated: boolean;
  ai_prompt: string | null;
  ai_model: string | null;
  product_id: string | null;
  hashtags: string[];
  created_at: string;
  updated_at: string;
}

interface ContentFormData {
  title: string;
  body: string;
  content_type: string;
  platform: string[];
  cover_image: string;
  tags: string;
  hashtags: string;
}

interface AiGenerateFormData {
  product_id: string;
  topic: string;
  occasion: string;
  platform: string;
  tone: string;
  language: string;
}

const PLATFORMS = ["facebook", "instagram", "xiaohongshu", "tiktok", "youtube", "website"] as const;
const CONTENT_TYPES = ["post", "story", "reel", "video", "article"] as const;
const TONES = ["professional", "casual", "festive", "humorous", "inspirational"] as const;
const OCCASIONS = ["normal", "chinese_new_year", "hari_raya", "christmas", "valentines", "mothers_day", "mid_autumn", "product_launch", "flash_sale"] as const;

const emptyForm: ContentFormData = {
  title: "",
  body: "",
  content_type: "",
  platform: [],
  cover_image: "",
  tags: "",
  hashtags: "",
};

const emptyAiForm: AiGenerateFormData = {
  product_id: "",
  topic: "",
  occasion: "normal",
  platform: "instagram",
  tone: "professional",
  language: "zh",
};

export default function AdminContentCreationPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<MarketingContent | null>(null);
  const [form, setForm] = useState<ContentFormData>(emptyForm);
  const [aiForm, setAiForm] = useState<AiGenerateFormData>(emptyAiForm);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch content
  const { data: contents = [], isLoading } = useQuery({
    queryKey: ["marketing_content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_content")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MarketingContent[];
    },
  });

  // Fetch products for AI generate
  const { data: products = [] } = useQuery({
    queryKey: ["products_for_content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: ContentFormData) => {
      const { error } = await supabase.from("marketing_content").insert({
        title: data.title,
        body: data.body || null,
        content_type: data.content_type,
        platform: data.platform,
        cover_image: data.cover_image || null,
        tags: data.tags ? data.tags.split(",").map((s) => s.trim()) : [],
        hashtags: data.hashtags ? data.hashtags.split(",").map((s) => s.trim()) : [],
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_content"] });
      toast({ title: t("admin.contentCreationPage.createSuccess") });
      setCreateOpen(false);
      setForm(emptyForm);
    },
    onError: () => {
      toast({ title: t("admin.contentCreationPage.createError"), variant: "destructive" });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ContentFormData }) => {
      const { error } = await supabase
        .from("marketing_content")
        .update({
          title: data.title,
          body: data.body || null,
          content_type: data.content_type,
          platform: data.platform,
          cover_image: data.cover_image || null,
          tags: data.tags ? data.tags.split(",").map((s) => s.trim()) : [],
          hashtags: data.hashtags ? data.hashtags.split(",").map((s) => s.trim()) : [],
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_content"] });
      toast({ title: t("admin.contentCreationPage.updateSuccess") });
      setEditOpen(false);
    },
    onError: () => {
      toast({ title: t("admin.contentCreationPage.updateError"), variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_content").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_content"] });
      toast({ title: t("admin.contentCreationPage.deleteSuccess") });
      setDeleteOpen(false);
      setSelectedContent(null);
    },
    onError: () => {
      toast({ title: t("admin.contentCreationPage.deleteError"), variant: "destructive" });
    },
  });

  // Publish / Mark Ready mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("marketing_content")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_content"] });
      toast({ title: t("admin.contentCreationPage.updateSuccess") });
    },
  });

  // Add to calendar mutation
  const addToCalendarMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const content = contents.find((c) => c.id === contentId);
      if (!content) return;
      const { error } = await supabase.from("media_publishing_plan").insert({
        title: content.title,
        platform: content.platform?.[0] || "instagram",
        content_type: content.content_type,
        status: "planned",
        content_id: contentId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("admin.contentCreationPage.addedToCalendar") });
    },
    onError: () => {
      toast({ title: t("admin.contentCreationPage.addToCalendarError"), variant: "destructive" });
    },
  });

  // AI Generate handler
  const handleAiGenerate = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-content", {
        body: aiForm,
      });
      if (error) throw error;
      if (data) {
        setForm({
          ...emptyForm,
          title: data.title || "",
          body: data.body || "",
          hashtags: (data.hashtags || []).join(", "),
          content_type: aiForm.platform === "xiaohongshu" ? "post" : "post",
          platform: [aiForm.platform],
        });
        setAiOpen(false);
        setCreateOpen(true);
        toast({ title: t("admin.contentCreationPage.aiGenerateSuccess") });
      }
    } catch {
      toast({ title: t("admin.contentCreationPage.aiGenerateError"), variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  // Filter
  const filtered = contents.filter((c) => {
    const matchTab =
      tab === "all" ||
      (tab === "draft" && c.status === "draft") ||
      (tab === "ready" && c.status === "ready") ||
      (tab === "published" && c.status === "published") ||
      (tab === "ai" && c.ai_generated);
    const matchSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.body || "").toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  // Stats
  const totalCount = contents.length;
  const draftCount = contents.filter((c) => c.status === "draft").length;
  const aiCount = contents.filter((c) => c.ai_generated).length;
  const publishedCount = contents.filter((c) => c.status === "published").length;

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700",
      ai_generating: "bg-blue-100 text-blue-700",
      ready: "bg-green-100 text-green-700",
      published: "bg-purple-100 text-purple-700",
      archived: "bg-yellow-100 text-yellow-700",
    };
    return (
      <Badge className={colors[status] || "bg-gray-100 text-gray-700"}>
        {t(`admin.contentCreationPage.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
      </Badge>
    );
  };

  const openEdit = (content: MarketingContent) => {
    setSelectedContent(content);
    setForm({
      title: content.title,
      body: content.body || "",
      content_type: content.content_type,
      platform: content.platform,
      cover_image: content.cover_image || "",
      tags: (content.tags || []).join(", "),
      hashtags: (content.hashtags || []).join(", "),
    });
    setEditOpen(true);
  };

  const togglePlatform = (p: string) => {
    setForm((prev) => ({
      ...prev,
      platform: prev.platform.includes(p)
        ? prev.platform.filter((x) => x !== p)
        : [...prev.platform, p],
    }));
  };

  const ContentFormFields = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div>
        <label className="text-sm font-medium">{t("admin.contentCreationPage.fieldTitle")}</label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder={t("admin.contentCreationPage.fieldTitlePlaceholder")}
        />
      </div>
      <div>
        <label className="text-sm font-medium">{t("admin.contentCreationPage.fieldBody")}</label>
        <Textarea
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          placeholder={t("admin.contentCreationPage.fieldBodyPlaceholder")}
          rows={6}
        />
      </div>
      <div>
        <label className="text-sm font-medium">{t("admin.contentCreationPage.fieldContentType")}</label>
        <Select value={form.content_type} onValueChange={(v) => setForm({ ...form, content_type: v })}>
          <SelectTrigger><SelectValue placeholder={t("admin.contentCreationPage.selectContentType")} /></SelectTrigger>
          <SelectContent>
            {CONTENT_TYPES.map((ct) => (
              <SelectItem key={ct} value={ct}>{ct}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">{t("admin.contentCreationPage.fieldPlatform")}</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {PLATFORMS.map((p) => (
            <Badge
              key={p}
              variant={form.platform.includes(p) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => togglePlatform(p)}
            >
              {p}
            </Badge>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">{t("admin.contentCreationPage.fieldCoverImage")}</label>
        <Input
          value={form.cover_image}
          onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
          placeholder={t("admin.contentCreationPage.fieldCoverImagePlaceholder")}
        />
      </div>
      <div>
        <label className="text-sm font-medium">{t("admin.contentCreationPage.fieldTags")}</label>
        <Input
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          placeholder={t("admin.contentCreationPage.fieldTagsPlaceholder")}
        />
      </div>
      <div>
        <label className="text-sm font-medium">{t("admin.contentCreationPage.fieldHashtags")}</label>
        <Input
          value={form.hashtags}
          onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
          placeholder={t("admin.contentCreationPage.fieldHashtagsPlaceholder")}
        />
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <PenSquare className="w-6 h-6" />
              {t("admin.contentCreationPage.title")}
            </h1>
            <p className="text-muted-foreground">{t("admin.contentCreationPage.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setAiForm(emptyAiForm); setAiOpen(true); }}>
              <Sparkles className="w-4 h-4 mr-2" />
              {t("admin.contentCreationPage.aiGenerate")}
            </Button>
            <Button onClick={() => { setForm(emptyForm); setCreateOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              {t("admin.contentCreationPage.newContent")}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.contentCreationPage.totalContent")}</p>
                  <p className="text-2xl font-bold">{totalCount}</p>
                </div>
                <FileText className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.contentCreationPage.drafts")}</p>
                  <p className="text-2xl font-bold">{draftCount}</p>
                </div>
                <Edit className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.contentCreationPage.aiGenerated")}</p>
                  <p className="text-2xl font-bold">{aiCount}</p>
                </div>
                <Sparkles className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.contentCreationPage.published")}</p>
                  <p className="text-2xl font-bold">{publishedCount}</p>
                </div>
                <ExternalLink className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs + Search */}
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <TabsList>
              <TabsTrigger value="all">{t("admin.contentCreationPage.tabAll")}</TabsTrigger>
              <TabsTrigger value="draft">{t("admin.contentCreationPage.tabDraft")}</TabsTrigger>
              <TabsTrigger value="ready">{t("admin.contentCreationPage.tabReady")}</TabsTrigger>
              <TabsTrigger value="published">{t("admin.contentCreationPage.tabPublished")}</TabsTrigger>
              <TabsTrigger value="ai">{t("admin.contentCreationPage.tabAi")}</TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.contentCreationPage.searchPlaceholder")}
                className="pl-10"
              />
            </div>
          </div>

          <TabsContent value={tab} className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <PenSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>{t("admin.contentCreationPage.noContent")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((content) => (
                  <Card key={content.id} className="overflow-hidden">
                    {content.cover_image && (
                      <div className="h-40 bg-muted overflow-hidden">
                        <img
                          src={content.cover_image}
                          alt={content.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium line-clamp-2">{content.title}</h3>
                        {statusBadge(content.status)}
                      </div>
                      {content.body && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{content.body}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {content.platform?.map((p) => (
                          <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                        ))}
                        {content.ai_generated && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">
                            <Sparkles className="w-3 h-3 mr-1" /> AI
                          </Badge>
                        )}
                      </div>
                      {content.hashtags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {content.hashtags.slice(0, 3).map((h) => (
                            <span key={h} className="text-xs text-primary">#{h}</span>
                          ))}
                          {content.hashtags.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{content.hashtags.length - 3}</span>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedContent(content); setDetailOpen(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(content)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedContent(content); setDeleteOpen(true); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {content.status === "draft" && (
                          <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: content.id, status: "ready" })}>
                            {t("admin.contentCreationPage.markReady")}
                          </Button>
                        )}
                        {content.status === "ready" && (
                          <Button size="sm" variant="outline" onClick={() => addToCalendarMutation.mutate(content.id)}>
                            <Calendar className="w-4 h-4 mr-1" />
                            {t("admin.contentCreationPage.addToCalendar")}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("admin.contentCreationPage.newContent")}</DialogTitle>
              <DialogDescription>{t("admin.contentCreationPage.newContentDesc")}</DialogDescription>
            </DialogHeader>
            <ContentFormFields />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                {t("admin.contentCreationPage.cancel")}
              </Button>
              <Button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.title || !form.content_type || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("admin.contentCreationPage.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("admin.contentCreationPage.editContent")}</DialogTitle>
              <DialogDescription>{t("admin.contentCreationPage.editContentDesc")}</DialogDescription>
            </DialogHeader>
            <ContentFormFields />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                {t("admin.contentCreationPage.cancel")}
              </Button>
              <Button
                onClick={() => selectedContent && updateMutation.mutate({ id: selectedContent.id, data: form })}
                disabled={!form.title || !form.content_type || updateMutation.isPending}
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("admin.contentCreationPage.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedContent?.title}</DialogTitle>
            </DialogHeader>
            {selectedContent && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {selectedContent.cover_image && (
                  <img src={selectedContent.cover_image} alt="" className="w-full rounded-lg" />
                )}
                <div className="flex gap-2">
                  {statusBadge(selectedContent.status)}
                  <Badge variant="outline">{selectedContent.content_type}</Badge>
                  {selectedContent.ai_generated && (
                    <Badge className="bg-blue-100 text-blue-700">
                      <Sparkles className="w-3 h-3 mr-1" /> AI
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedContent.platform?.map((p) => (
                    <Badge key={p} variant="outline">{p}</Badge>
                  ))}
                </div>
                {selectedContent.body && (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{t("admin.contentCreationPage.fieldBody")}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedContent.body || "");
                          toast({ title: t("admin.contentCreationPage.copied") });
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{selectedContent.body}</p>
                  </div>
                )}
                {selectedContent.hashtags?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">{t("admin.contentCreationPage.fieldHashtags")}</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedContent.hashtags.map((h) => (
                        <span key={h} className="text-sm text-primary">#{h}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedContent.tags?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">{t("admin.contentCreationPage.fieldTags")}</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedContent.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(selectedContent.created_at).toLocaleString()}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailOpen(false)}>
                {t("admin.contentCreationPage.close")}
              </Button>
              {selectedContent?.status === "ready" && (
                <Button onClick={() => addToCalendarMutation.mutate(selectedContent.id)}>
                  <Calendar className="w-4 h-4 mr-2" />
                  {t("admin.contentCreationPage.addToCalendar")}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Generate Dialog */}
        <Dialog open={aiOpen} onOpenChange={setAiOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {t("admin.contentCreationPage.aiGenerateTitle")}
              </DialogTitle>
              <DialogDescription>{t("admin.contentCreationPage.aiGenerateDesc")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t("admin.contentCreationPage.aiProduct")}</label>
                <Select value={aiForm.product_id} onValueChange={(v) => setAiForm({ ...aiForm, product_id: v })}>
                  <SelectTrigger><SelectValue placeholder={t("admin.contentCreationPage.aiProductPlaceholder")} /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">{t("admin.contentCreationPage.aiTopic")}</label>
                <Input
                  value={aiForm.topic}
                  onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                  placeholder={t("admin.contentCreationPage.aiTopicPlaceholder")}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("admin.contentCreationPage.aiOccasion")}</label>
                <Select value={aiForm.occasion} onValueChange={(v) => setAiForm({ ...aiForm, occasion: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OCCASIONS.map((o) => (
                      <SelectItem key={o} value={o}>{t(`admin.contentCreationPage.occasion_${o}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t("admin.contentCreationPage.aiPlatform")}</label>
                  <Select value={aiForm.platform} onValueChange={(v) => setAiForm({ ...aiForm, platform: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("admin.contentCreationPage.aiTone")}</label>
                  <Select value={aiForm.tone} onValueChange={(v) => setAiForm({ ...aiForm, tone: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TONES.map((tone) => (
                        <SelectItem key={tone} value={tone}>{t(`admin.contentCreationPage.tone_${tone}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">{t("admin.contentCreationPage.aiLanguage")}</label>
                <Select value={aiForm.language} onValueChange={(v) => setAiForm({ ...aiForm, language: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ms">Bahasa Melayu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAiOpen(false)}>
                {t("admin.contentCreationPage.cancel")}
              </Button>
              <Button onClick={handleAiGenerate} disabled={aiLoading || (!aiForm.product_id && !aiForm.topic)}>
                {aiLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {t("admin.contentCreationPage.generate")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.contentCreationPage.deleteConfirmTitle")}</DialogTitle>
              <DialogDescription>
                {t("admin.contentCreationPage.deleteConfirmDesc")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                {t("admin.contentCreationPage.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedContent && deleteMutation.mutate(selectedContent.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("admin.contentCreationPage.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
