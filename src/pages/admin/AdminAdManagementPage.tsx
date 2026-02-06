import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Megaphone, Search, Plus, DollarSign, Eye, BarChart3,
  Clock, CheckCircle, Pause, FileEdit, Loader2, Trash2,
  Calendar, Target, TrendingUp, Layers,
  XCircle, Image, Film, Globe, Smartphone,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

// ── Interfaces ──────────────────────────────────────────────────────

interface Campaign {
  id: string; ad_account_id: string | null; name: string; platform: string;
  objective: string; status: string; budget_type: string; budget_amount: number;
  spent_amount: number; start_date: string | null; end_date: string | null;
  target_audience: string | null; tags: string[] | null; notes: string | null;
  created_at: string; updated_at: string;
}

interface AdPlacementPlan {
  id: string; name: string; description: string | null; platform: string;
  status: string; total_budget: number; daily_budget: number;
  start_date: string | null; end_date: string | null; target_audience: string | null;
  kpi_targets: string | null; approval_notes: string | null; approved_by: string | null;
  approved_at: string | null; campaign_id: string | null; created_at: string; updated_at: string;
}

interface AdSet {
  id: string; campaign_id: string | null; name: string; targeting: unknown;
  budget: number; status: string; created_at: string; updated_at: string;
  marketing_campaigns?: { name: string } | null;
}

interface AdCreative {
  id: string; ad_set_id: string | null; title: string; description: string | null;
  media_url: string | null; call_to_action: string | null;
  creative_type: string; status: string; created_at: string; updated_at: string;
}

// ── Form Types ──────────────────────────────────────────────────────

interface CampaignFormData {
  name: string; platform: string; objective: string; budget_type: string;
  budget_amount: string; start_date: string; end_date: string; notes: string;
}
interface PlanFormData {
  name: string; description: string; platform: string; campaign_id: string;
  total_budget: string; daily_budget: string; start_date: string; end_date: string;
  kpi_targets: string; notes: string;
}
interface AdSetFormData {
  name: string; campaign_id: string; targeting: string; budget: string; status: string;
}
interface CreativeFormData {
  ad_set_id: string; title: string; description: string; media_url: string;
  call_to_action: string; creative_type: string; status: string;
}

const defCampaign: CampaignFormData = {
  name: "", platform: "facebook", objective: "awareness",
  budget_type: "daily", budget_amount: "", start_date: "", end_date: "", notes: "",
};
const defPlan: PlanFormData = {
  name: "", description: "", platform: "facebook", campaign_id: "",
  total_budget: "", daily_budget: "", start_date: "", end_date: "", kpi_targets: "", notes: "",
};
const defAdSet: AdSetFormData = { name: "", campaign_id: "", targeting: "{}", budget: "", status: "active" };
const defCreative: CreativeFormData = {
  ad_set_id: "", title: "", description: "", media_url: "",
  call_to_action: "", creative_type: "image", status: "draft",
};

// ── Component ───────────────────────────────────────────────────────

export default function AdminAdManagementPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const T = (k: string) => t(`admin.adManagementPage.${k}`);

  // Main tab
  const [mainTab, setMainTab] = useState("campaigns");

  // Campaign state
  const [cSearch, setCSearch] = useState("");
  const [cFilter, setCFilter] = useState("all");
  const [showCModal, setShowCModal] = useState(false);
  const [showCDetails, setShowCDetails] = useState(false);
  const [showCDelete, setShowCDelete] = useState(false);
  const [selCampaign, setSelCampaign] = useState<Campaign | null>(null);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [cForm, setCForm] = useState<CampaignFormData>(defCampaign);

  // Placement state
  const [pSearch, setPSearch] = useState("");
  const [pFilter, setPFilter] = useState("all");
  const [showPModal, setShowPModal] = useState(false);
  const [showPDelete, setShowPDelete] = useState(false);
  const [editPlan, setEditPlan] = useState<AdPlacementPlan | null>(null);
  const [delPlan, setDelPlan] = useState<AdPlacementPlan | null>(null);
  const [pForm, setPForm] = useState<PlanFormData>(defPlan);

  // Creatives state
  const [showASModal, setShowASModal] = useState(false);
  const [showASDelete, setShowASDelete] = useState(false);
  const [showCrModal, setShowCrModal] = useState(false);
  const [showCrDelete, setShowCrDelete] = useState(false);
  const [editAS, setEditAS] = useState<AdSet | null>(null);
  const [delAS, setDelAS] = useState<AdSet | null>(null);
  const [editCr, setEditCr] = useState<AdCreative | null>(null);
  const [delCr, setDelCr] = useState<AdCreative | null>(null);
  const [asForm, setASForm] = useState<AdSetFormData>(defAdSet);
  const [crForm, setCrForm] = useState<CreativeFormData>(defCreative);

  // ── Queries ───────────────────────────────────────────────────────

  const { data: campaigns = [], isLoading: lc } = useQuery({
    queryKey: ["admin-marketing-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("marketing_campaigns").select("*").order("created_at", { ascending: false });
      if (error) { console.error("Error fetching campaigns:", error); return []; }
      return (data || []) as Campaign[];
    },
  });

  const { data: plans = [], isLoading: lp } = useQuery({
    queryKey: ["admin-ad-placement-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ad_placement_plans").select("*").order("created_at", { ascending: false });
      if (error) { console.error("Error fetching plans:", error); return []; }
      return (data || []) as AdPlacementPlan[];
    },
  });

  const { data: adSets = [], isLoading: las } = useQuery({
    queryKey: ["admin-marketing-ad-sets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("marketing_ad_sets").select("*, marketing_campaigns(name)").order("created_at", { ascending: false });
      if (error) { console.error("Error fetching ad sets:", error); return []; }
      return (data || []) as AdSet[];
    },
  });

  const { data: creatives = [], isLoading: lcr } = useQuery({
    queryKey: ["admin-marketing-ad-creatives"],
    queryFn: async () => {
      const { data, error } = await supabase.from("marketing_ad_creatives").select("*").order("created_at", { ascending: false });
      if (error) { console.error("Error fetching creatives:", error); return []; }
      return (data || []) as AdCreative[];
    },
  });

  // ── Campaign Mutations ────────────────────────────────────────────

  const createCampaign = useMutation({
    mutationFn: async (d: CampaignFormData) => {
      const { error } = await supabase.from("marketing_campaigns").insert({
        name: d.name, platform: d.platform, objective: d.objective, status: "draft",
        budget_type: d.budget_type, budget_amount: Math.round(parseFloat(d.budget_amount) * 100),
        spent_amount: 0, start_date: d.start_date || null, end_date: d.end_date || null, notes: d.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-marketing-campaigns"] }); setShowCModal(false); setCForm(defCampaign); toast({ title: T("campaignCreated") }); },
    onError: (e) => { toast({ title: T("createFailed"), description: String(e), variant: "destructive" }); },
  });

  const updateCampaign = useMutation({
    mutationFn: async (d: CampaignFormData & { id: string }) => {
      const { error } = await supabase.from("marketing_campaigns").update({
        name: d.name, platform: d.platform, objective: d.objective, budget_type: d.budget_type,
        budget_amount: Math.round(parseFloat(d.budget_amount) * 100),
        start_date: d.start_date || null, end_date: d.end_date || null,
        notes: d.notes || null, updated_at: new Date().toISOString(),
      }).eq("id", d.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-marketing-campaigns"] }); setShowCModal(false); setEditCampaign(null); setCForm(defCampaign); toast({ title: T("campaignUpdated") }); },
    onError: (e) => { toast({ title: T("updateFailed"), description: String(e), variant: "destructive" }); },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("marketing_campaigns").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-marketing-campaigns"] }); setShowCDelete(false); setSelCampaign(null); toast({ title: T("campaignDeleted") }); },
    onError: (e) => { toast({ title: T("deleteFailed"), description: String(e), variant: "destructive" }); },
  });

  const updateCStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("marketing_campaigns").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-marketing-campaigns"] }); toast({ title: T("statusUpdated") }); },
    onError: (e) => { toast({ title: T("updateFailed"), description: String(e), variant: "destructive" }); },
  });

  // ── Placement Mutations ───────────────────────────────────────────

  const createPlan = useMutation({
    mutationFn: async (d: PlanFormData) => {
      const { error } = await supabase.from("ad_placement_plans").insert({
        name: d.name, description: d.description || null, platform: d.platform,
        campaign_id: d.campaign_id || null, total_budget: parseFloat(d.total_budget) || 0,
        daily_budget: parseFloat(d.daily_budget) || 0, start_date: d.start_date || null,
        end_date: d.end_date || null, kpi_targets: d.kpi_targets || null,
        approval_notes: d.notes || null, status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ad-placement-plans"] }); setShowPModal(false); setPForm(defPlan); setEditPlan(null); toast({ title: T("planCreated") }); },
    onError: (e) => { toast({ title: T("createFailed"), description: String(e), variant: "destructive" }); },
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, d }: { id: string; d: PlanFormData }) => {
      const { error } = await supabase.from("ad_placement_plans").update({
        name: d.name, description: d.description || null, platform: d.platform,
        campaign_id: d.campaign_id || null, total_budget: parseFloat(d.total_budget) || 0,
        daily_budget: parseFloat(d.daily_budget) || 0, start_date: d.start_date || null,
        end_date: d.end_date || null, kpi_targets: d.kpi_targets || null,
        approval_notes: d.notes || null, updated_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ad-placement-plans"] }); setShowPModal(false); setPForm(defPlan); setEditPlan(null); toast({ title: T("planUpdated") }); },
    onError: (e) => { toast({ title: T("updateFailed"), description: String(e), variant: "destructive" }); },
  });

  const deletePlan_ = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("ad_placement_plans").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ad-placement-plans"] }); setShowPDelete(false); setDelPlan(null); toast({ title: T("planDeleted") }); },
    onError: (e) => { toast({ title: T("deleteFailed"), description: String(e), variant: "destructive" }); },
  });

  const submitApproval = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ad_placement_plans").update({ status: "pending_approval", updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ad-placement-plans"] }); toast({ title: T("submittedForApproval") }); },
    onError: (e) => { toast({ title: T("submitFailed"), description: String(e), variant: "destructive" }); },
  });

  const approvePlan = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase.from("ad_placement_plans").update({
        status: "approved", approval_notes: notes || null,
        approved_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ad-placement-plans"] }); toast({ title: T("planApproved") }); },
    onError: (e) => { toast({ title: T("approveFailed"), description: String(e), variant: "destructive" }); },
  });

  const rejectPlan = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase.from("ad_placement_plans").update({
        status: "draft", approval_notes: notes || null, updated_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ad-placement-plans"] }); toast({ title: T("planRejected") }); },
    onError: (e) => { toast({ title: T("rejectFailed"), description: String(e), variant: "destructive" }); },
  });

  // ── Creatives Mutations ───────────────────────────────────────────

  const createAS = useMutation({
    mutationFn: async (d: AdSetFormData) => {
      let tgt: unknown = {}; try { tgt = JSON.parse(d.targeting); } catch { tgt = {}; }
      const { error } = await supabase.from("marketing_ad_sets").insert({
        name: d.name, campaign_id: d.campaign_id || null, targeting: tgt,
        budget: parseFloat(d.budget) || 0, status: d.status,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-marketing-ad-sets"] }); setShowASModal(false); setASForm(defAdSet); setEditAS(null); toast({ title: T("adSetCreated") }); },
    onError: (e) => { toast({ title: T("createFailed"), description: String(e), variant: "destructive" }); },
  });

  const updateAS = useMutation({
    mutationFn: async ({ id, d }: { id: string; d: AdSetFormData }) => {
      let tgt: unknown = {}; try { tgt = JSON.parse(d.targeting); } catch { tgt = {}; }
      const { error } = await supabase.from("marketing_ad_sets").update({
        name: d.name, campaign_id: d.campaign_id || null, targeting: tgt,
        budget: parseFloat(d.budget) || 0, status: d.status, updated_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-marketing-ad-sets"] }); setShowASModal(false); setASForm(defAdSet); setEditAS(null); toast({ title: T("adSetUpdated") }); },
    onError: (e) => { toast({ title: T("updateFailed"), description: String(e), variant: "destructive" }); },
  });

  const deleteAS = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("marketing_ad_sets").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-marketing-ad-sets"] }); setShowASDelete(false); setDelAS(null); toast({ title: T("adSetDeleted") }); },
    onError: (e) => { toast({ title: T("deleteFailed"), description: String(e), variant: "destructive" }); },
  });

  const createCr = useMutation({
    mutationFn: async (d: CreativeFormData) => {
      const { error } = await supabase.from("marketing_ad_creatives").insert({
        ad_set_id: d.ad_set_id || null, title: d.title, description: d.description || null,
        media_url: d.media_url || null, call_to_action: d.call_to_action || null,
        creative_type: d.creative_type, status: d.status,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-marketing-ad-creatives"] }); setShowCrModal(false); setCrForm(defCreative); setEditCr(null); toast({ title: T("creativeCreated") }); },
    onError: (e) => { toast({ title: T("createFailed"), description: String(e), variant: "destructive" }); },
  });

  const updateCr = useMutation({
    mutationFn: async ({ id, d }: { id: string; d: CreativeFormData }) => {
      const { error } = await supabase.from("marketing_ad_creatives").update({
        ad_set_id: d.ad_set_id || null, title: d.title, description: d.description || null,
        media_url: d.media_url || null, call_to_action: d.call_to_action || null,
        creative_type: d.creative_type, status: d.status, updated_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-marketing-ad-creatives"] }); setShowCrModal(false); setCrForm(defCreative); setEditCr(null); toast({ title: T("creativeUpdated") }); },
    onError: (e) => { toast({ title: T("updateFailed"), description: String(e), variant: "destructive" }); },
  });

  const deleteCr_ = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("marketing_ad_creatives").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-marketing-ad-creatives"] }); setShowCrDelete(false); setDelCr(null); toast({ title: T("creativeDeleted") }); },
    onError: (e) => { toast({ title: T("deleteFailed"), description: String(e), variant: "destructive" }); },
  });

  // ── Handlers ──────────────────────────────────────────────────────

  const handleNew = () => {
    if (mainTab === "campaigns") { setEditCampaign(null); setCForm(defCampaign); setShowCModal(true); }
    else if (mainTab === "placements") { setEditPlan(null); setPForm(defPlan); setShowPModal(true); }
    else { setEditAS(null); setASForm(defAdSet); setShowASModal(true); }
  };

  const handleSubmitC = () => {
    if (!cForm.name.trim()) { toast({ title: T("nameRequired"), variant: "destructive" }); return; }
    if (!cForm.budget_amount || parseFloat(cForm.budget_amount) <= 0) { toast({ title: T("budgetRequired"), variant: "destructive" }); return; }
    editCampaign ? updateCampaign.mutate({ ...cForm, id: editCampaign.id }) : createCampaign.mutate(cForm);
  };

  const handleSubmitP = () => {
    if (!pForm.name.trim()) { toast({ title: T("nameRequired"), variant: "destructive" }); return; }
    editPlan ? updatePlan.mutate({ id: editPlan.id, d: pForm }) : createPlan.mutate(pForm);
  };

  const handleSubmitAS = () => {
    if (!asForm.name.trim()) { toast({ title: T("nameRequired"), variant: "destructive" }); return; }
    editAS ? updateAS.mutate({ id: editAS.id, d: asForm }) : createAS.mutate(asForm);
  };

  const handleSubmitCr = () => {
    if (!crForm.title.trim()) { toast({ title: T("nameRequired"), variant: "destructive" }); return; }
    editCr ? updateCr.mutate({ id: editCr.id, d: crForm }) : createCr.mutate(crForm);
  };

  // ── Helpers ───────────────────────────────────────────────────────

  const campaignStatusCfg = (s: string) => {
    switch (s) {
      case "active": return { label: T("statusActive"), icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" };
      case "paused": return { label: T("statusPaused"), icon: Pause, color: "text-yellow-500", bg: "bg-yellow-500/10" };
      case "draft": return { label: T("statusDraft"), icon: FileEdit, color: "text-blue-500", bg: "bg-blue-500/10" };
      case "completed": return { label: T("statusCompleted"), icon: CheckCircle, color: "text-muted-foreground", bg: "bg-muted" };
      default: return { label: T("statusUnknown"), icon: Clock, color: "text-muted-foreground", bg: "bg-muted" };
    }
  };

  const planStatusCfg = (s: string) => {
    switch (s) {
      case "draft": return { label: T("statusDraft"), color: "text-gray-500", bg: "bg-gray-500/10", icon: Clock };
      case "pending_approval": return { label: T("statusPending"), color: "text-yellow-500", bg: "bg-yellow-500/10", icon: Clock };
      case "approved": return { label: T("statusApproved"), color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle };
      case "active": return { label: T("statusActive"), color: "text-blue-500", bg: "bg-blue-500/10", icon: Target };
      case "completed": return { label: T("statusCompleted"), color: "text-gray-500", bg: "bg-gray-500/10", icon: CheckCircle };
      default: return { label: s, color: "text-muted-foreground", bg: "bg-muted", icon: Clock };
    }
  };

  const platCfg = (p: string) => {
    switch (p) {
      case "facebook": return { label: "Facebook", icon: Globe, color: "text-blue-600", bg: "bg-blue-600/10" };
      case "instagram": return { label: "Instagram", icon: Smartphone, color: "text-pink-500", bg: "bg-pink-500/10" };
      case "both": return { label: "Facebook + Instagram", icon: Layers, color: "text-purple-500", bg: "bg-purple-500/10" };
      case "xiaohongshu": return { label: T("platformXiaohongshu"), icon: Megaphone, color: "text-red-500", bg: "bg-red-500/10" };
      case "google": return { label: "Google", icon: Megaphone, color: "text-green-600", bg: "bg-green-600/10" };
      case "tiktok": return { label: "TikTok", icon: Megaphone, color: "text-black", bg: "bg-black/10" };
      default: return { label: p, icon: Megaphone, color: "text-muted-foreground", bg: "bg-muted" };
    }
  };

  const objLabel = (o: string) => {
    const m: Record<string, string> = {
      awareness: T("objectiveAwareness"), traffic: T("objectiveTraffic"),
      engagement: T("objectiveEngagement"), leads: T("objectiveLeads"),
      sales: T("objectiveSales"), app_promotion: T("objectiveAppPromotion"),
    };
    return m[o] || o;
  };

  const btLabel = (b: string) => b === "daily" ? T("budgetDaily") : b === "lifetime" ? T("budgetLifetime") : b;

  const fmtDate = (d: string | null) => d
    ? new Date(d).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
    : "-";

  const fmtDT = (d: string | null) => d
    ? new Date(d).toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "-";

  // ── Filtered & Stats ──────────────────────────────────────────────

  const filtC = campaigns.filter(c =>
    (cSearch === "" || c.name.toLowerCase().includes(cSearch.toLowerCase())) &&
    (cFilter === "all" || c.status === cFilter)
  );

  const filtP = plans.filter(p =>
    (pSearch === "" || p.name.toLowerCase().includes(pSearch.toLowerCase())) &&
    (pFilter === "all" || (pFilter === "pending" ? p.status === "pending_approval" : p.status === pFilter))
  );

  const totalCampaigns = campaigns.length;
  const activePlans = plans.filter(p => p.status === "active" || p.status === "approved").length;
  const totalSpend = campaigns.reduce((s, c) => s + c.spent_amount, 0);
  const totalBudget = campaigns.reduce((s, c) => s + c.budget_amount, 0);
  const roas = totalSpend > 0 ? (totalBudget / totalSpend).toFixed(2) : "0.00";

  // ── Loading ───────────────────────────────────────────────────────

  if (lc || lp || las || lcr) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  // ── Render ────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif text-primary">{T("title")}</h1>
            <p className="text-sm text-muted-foreground">{T("subtitle")}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="gap-2" onClick={async () => {
              try {
                const { error } = await supabase.functions.invoke("meta-sync-performance");
                if (error) throw error;
                toast({ title: T("syncSuccess") });
                qc.invalidateQueries({ queryKey: ["admin-marketing-campaigns"] });
              } catch {
                toast({ title: T("syncFailed"), variant: "destructive" });
              }
            }}>
              <TrendingUp className="w-4 h-4" />{T("syncPerformance")}
            </Button>
            <Button className="gap-2 bg-secondary text-secondary-foreground flex-1 sm:flex-none" onClick={handleNew}>
              <Plus className="w-4 h-4" />{T("new")}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: Megaphone, val: totalCampaigns, label: T("totalCampaigns"), iconCls: "text-primary", bgCls: "bg-primary/10" },
            { icon: Target, val: activePlans, label: T("activePlans"), iconCls: "text-green-500", bgCls: "bg-green-500/10", valCls: "text-green-500" },
            { icon: DollarSign, val: `RM ${(totalSpend / 100).toLocaleString()}`, label: T("totalSpend"), iconCls: "text-yellow-500", bgCls: "bg-yellow-500/10", valCls: "text-yellow-500" },
            { icon: BarChart3, val: `${roas}x`, label: T("roas"), iconCls: "text-blue-500", bgCls: "bg-blue-500/10", valCls: "text-blue-500" },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${s.bgCls} flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${s.iconCls}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-lg sm:text-2xl font-bold truncate ${s.valCls || ""}`}>{s.val}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs Card */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <Tabs value={mainTab} onValueChange={setMainTab}>
              <TabsList className="grid w-full grid-cols-3 h-auto p-1 mb-4">
                <TabsTrigger value="campaigns" className="text-xs sm:text-sm py-1.5 sm:py-2">{T("tabCampaigns")}</TabsTrigger>
                <TabsTrigger value="placements" className="text-xs sm:text-sm py-1.5 sm:py-2">{T("tabPlacements")}</TabsTrigger>
                <TabsTrigger value="creatives" className="text-xs sm:text-sm py-1.5 sm:py-2">{T("tabCreatives")}</TabsTrigger>
              </TabsList>

              {/* ── CAMPAIGNS TAB ── */}
              <TabsContent value="campaigns">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />{T("campaignList")}</CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder={T("searchPlaceholder")} className="pl-9 h-9 sm:h-10" value={cSearch} onChange={e => setCSearch(e.target.value)} />
                  </div>
                </div>
                <Tabs value={cFilter} onValueChange={setCFilter}>
                  <TabsList className="grid w-full grid-cols-5 h-auto p-1">
                    {["all", "active", "paused", "draft", "completed"].map(v => (
                      <TabsTrigger key={v} value={v} className="text-xs sm:text-sm py-1.5 sm:py-2">{v === "all" ? T("tabAll") : campaignStatusCfg(v).label}</TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value={cFilter} className="mt-3 sm:mt-4">
                    {filtC.length === 0 ? (
                      <div className="text-center py-12"><Megaphone className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" /><p className="text-muted-foreground">{T("noCampaigns")}</p></div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {filtC.map(c => {
                          const sc = campaignStatusCfg(c.status); const SI = sc.icon;
                          const pc = platCfg(c.platform); const PI = pc.icon;
                          return (
                            <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3">
                              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${sc.bg}`}><SI className={`w-4 h-4 sm:w-5 sm:h-5 ${sc.color}`} /></div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                    <span className="font-medium text-sm sm:text-base truncate">{c.name}</span>
                                    <Badge variant="outline" className="text-xs">{sc.label}</Badge>
                                    <Badge className={`${pc.bg} ${pc.color} text-xs`}><PI className="w-3 h-3 mr-1" />{pc.label}</Badge>
                                  </div>
                                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1"><Target className="w-3 h-3" />{objLabel(c.objective)}</span>
                                    <span className="shrink-0">{btLabel(c.budget_type)}: RM {(c.budget_amount / 100).toLocaleString()}</span>
                                    <span className="shrink-0 hidden sm:inline">{fmtDate(c.start_date)} ~ {fmtDate(c.end_date)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 pl-12 sm:pl-0">
                                <div className="text-right">
                                  <span className="font-bold text-primary text-sm sm:text-base">RM {(c.spent_amount / 100).toLocaleString()}</span>
                                  <p className="text-xs text-muted-foreground">{T("spent")}</p>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="outline" size="sm" className="gap-1 h-8" onClick={() => { setSelCampaign(c); setShowCDetails(true); }}><Eye className="w-4 h-4" /><span className="hidden sm:inline">{T("details")}</span></Button>
                                  <Button variant="outline" size="sm" className="gap-1 h-8" onClick={() => { setEditCampaign(c); setCForm({ name: c.name, platform: c.platform, objective: c.objective, budget_type: c.budget_type, budget_amount: (c.budget_amount / 100).toString(), start_date: c.start_date || "", end_date: c.end_date || "", notes: c.notes || "" }); setShowCModal(true); }}><FileEdit className="w-4 h-4" /></Button>
                                  <Button variant="outline" size="sm" className="gap-1 h-8" onClick={() => { setSelCampaign(c); setShowCDelete(true); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* ── PLACEMENTS TAB ── */}
              <TabsContent value="placements">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />{T("planList")}</CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder={T("searchPlaceholder")} className="pl-9 h-9 sm:h-10" value={pSearch} onChange={e => setPSearch(e.target.value)} />
                  </div>
                </div>
                <Tabs value={pFilter} onValueChange={setPFilter}>
                  <TabsList className="grid w-full grid-cols-6 h-auto p-1">
                    {["all", "draft", "pending", "approved", "active", "completed"].map(v => (
                      <TabsTrigger key={v} value={v} className="text-xs sm:text-sm py-1.5 sm:py-2">{v === "all" ? T("tabAll") : v === "pending" ? T("statusPending") : planStatusCfg(v).label}</TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value={pFilter} className="mt-3 sm:mt-4">
                    {filtP.length === 0 ? (
                      <div className="text-center py-12"><Target className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" /><p className="text-muted-foreground">{T("noPlans")}</p></div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {filtP.map(p => {
                          const sc = planStatusCfg(p.status); const SI = sc.icon;
                          return (
                            <div key={p.id} className="p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${sc.bg}`}><SI className={`w-4 h-4 sm:w-5 sm:h-5 ${sc.color}`} /></div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                      <span className="font-medium text-sm sm:text-base truncate">{p.name}</span>
                                      <Badge variant="secondary" className="text-xs">{platCfg(p.platform).label}</Badge>
                                      <Badge variant="outline" className={`text-xs ${sc.color}`}>{sc.label}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1 flex-wrap">
                                      <span>{T("budget")}: RM {p.total_budget.toLocaleString()}</span>
                                      <span>{T("dailyBudgetLabel")}: RM {p.daily_budget.toLocaleString()}</span>
                                      {p.start_date && p.end_date && <span className="shrink-0">{fmtDate(p.start_date)} ~ {fmtDate(p.end_date)}</span>}
                                    </div>
                                    {p.approval_notes && <p className="text-xs text-muted-foreground mt-1 bg-muted px-2 py-1 rounded">{T("approvalNotes")}: {p.approval_notes}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 pl-12 sm:pl-0 shrink-0">
                                  {p.status === "draft" && (
                                    <Button variant="outline" size="sm" className="gap-1 h-8 text-xs" onClick={() => submitApproval.mutate(p.id)} disabled={submitApproval.isPending}>
                                      {submitApproval.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                      <span className="hidden sm:inline">{T("submitForApproval")}</span>
                                    </Button>
                                  )}
                                  {p.status === "pending_approval" && (<>
                                    <Button variant="outline" size="sm" className="gap-1 h-8 text-xs text-green-600" onClick={() => approvePlan.mutate({ id: p.id, notes: "" })} disabled={approvePlan.isPending}><CheckCircle className="w-3.5 h-3.5" /><span className="hidden sm:inline">{T("approve")}</span></Button>
                                    <Button variant="outline" size="sm" className="gap-1 h-8 text-xs text-red-600" onClick={() => rejectPlan.mutate({ id: p.id, notes: "" })} disabled={rejectPlan.isPending}><XCircle className="w-3.5 h-3.5" /><span className="hidden sm:inline">{T("reject")}</span></Button>
                                  </>)}
                                  {(p.status === "draft" || p.status === "pending_approval") && (
                                    <Button variant="outline" size="sm" className="gap-1 h-8" onClick={() => { setEditPlan(p); setPForm({ name: p.name, description: p.description || "", platform: p.platform, campaign_id: p.campaign_id || "", total_budget: String(p.total_budget), daily_budget: String(p.daily_budget), start_date: p.start_date || "", end_date: p.end_date || "", kpi_targets: p.kpi_targets || "", notes: p.approval_notes || "" }); setShowPModal(true); }}><FileEdit className="w-3.5 h-3.5" /></Button>
                                  )}
                                  <Button variant="outline" size="sm" className="gap-1 h-8 text-destructive" onClick={() => { setDelPlan(p); setShowPDelete(true); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* ── CREATIVES TAB ── */}
              <TabsContent value="creatives">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Image className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />{T("creativesTitle")}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => { setEditAS(null); setASForm(defAdSet); setShowASModal(true); }}><Plus className="w-4 h-4" />{T("newAdSet")}</Button>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => { setEditCr(null); setCrForm(defCreative); setShowCrModal(true); }}><Plus className="w-4 h-4" />{T("newCreative")}</Button>
                  </div>
                </div>
                {adSets.length === 0 ? (
                  <div className="text-center py-12"><Layers className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" /><p className="text-muted-foreground">{T("noAdSets")}</p></div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {adSets.map(as_ => {
                      const asCr = creatives.filter(c => c.ad_set_id === as_.id);
                      return (
                        <div key={as_.id} className="border rounded-lg">
                          <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/30">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <Layers className="w-4 h-4 text-primary shrink-0" />
                                <span className="font-medium text-sm sm:text-base truncate">{as_.name}</span>
                                {as_.marketing_campaigns?.name && <Badge variant="secondary" className="text-xs">{as_.marketing_campaigns.name}</Badge>}
                                <Badge variant="outline" className="text-xs">{as_.status}</Badge>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground mt-1">
                                <span>{T("budget")}: RM {as_.budget.toLocaleString()}</span>
                                {as_.targeting != null && typeof as_.targeting === "object" ? (
                                  <span className="truncate max-w-[200px]">{T("targeting")}: {String(JSON.stringify(as_.targeting)).substring(0, 50)}...</span>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button variant="outline" size="sm" className="h-8" onClick={() => { setEditAS(as_); setASForm({ name: as_.name, campaign_id: as_.campaign_id || "", targeting: JSON.stringify(as_.targeting || {}, null, 2), budget: String(as_.budget), status: as_.status }); setShowASModal(true); }}><FileEdit className="w-3.5 h-3.5" /></Button>
                              <Button variant="outline" size="sm" className="h-8 text-destructive" onClick={() => { setDelAS(as_); setShowASDelete(true); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </div>
                          <div className="p-3 sm:p-4 space-y-2">
                            {asCr.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-3">{T("noCreatives")}</p>
                            ) : asCr.map(cr => (
                              <div key={cr.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 border rounded-md hover:bg-muted/30 gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  {cr.creative_type === "video" ? <Film className="w-4 h-4 text-purple-500 shrink-0" /> : <Image className="w-4 h-4 text-blue-500 shrink-0" />}
                                  <span className="text-sm font-medium truncate">{cr.title}</span>
                                  <Badge variant="outline" className="text-xs">{cr.creative_type}</Badge>
                                  <Badge variant="outline" className="text-xs">{cr.status}</Badge>
                                </div>
                                <div className="flex gap-1 shrink-0 pl-6 sm:pl-0">
                                  <Button variant="ghost" size="sm" className="h-7" onClick={() => { setEditCr(cr); setCrForm({ ad_set_id: cr.ad_set_id || "", title: cr.title, description: cr.description || "", media_url: cr.media_url || "", call_to_action: cr.call_to_action || "", creative_type: cr.creative_type, status: cr.status }); setShowCrModal(true); }}><FileEdit className="w-3 h-3" /></Button>
                                  <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => { setDelCr(cr); setShowCrDelete(true); }}><Trash2 className="w-3 h-3" /></Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* ══════════════ CAMPAIGN DIALOGS ══════════════ */}

      {/* Campaign Create/Edit */}
      <Dialog open={showCModal} onOpenChange={setShowCModal}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {editCampaign ? T("editCampaign") : T("newCampaign")}
            </DialogTitle>
            <DialogDescription className="text-sm">{editCampaign ? T("editCampaignDesc") : T("newCampaignDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="space-y-1.5"><label className="text-sm font-medium">{T("campaignName")} *</label>
              <Input value={cForm.name} onChange={e => setCForm({ ...cForm, name: e.target.value })} placeholder={T("campaignNamePlaceholder")} className="h-9 sm:h-10" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5"><label className="text-sm font-medium">{T("platform")}</label>
                <Select value={cForm.platform} onValueChange={v => setCForm({ ...cForm, platform: v })}><SelectTrigger className="h-9 sm:h-10"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="facebook">Facebook</SelectItem><SelectItem value="instagram">Instagram</SelectItem><SelectItem value="both">Facebook + Instagram</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">{T("objective")}</label>
                <Select value={cForm.objective} onValueChange={v => setCForm({ ...cForm, objective: v })}><SelectTrigger className="h-9 sm:h-10"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="awareness">{T("objectiveAwareness")}</SelectItem><SelectItem value="traffic">{T("objectiveTraffic")}</SelectItem><SelectItem value="engagement">{T("objectiveEngagement")}</SelectItem><SelectItem value="leads">{T("objectiveLeads")}</SelectItem><SelectItem value="sales">{T("objectiveSales")}</SelectItem><SelectItem value="app_promotion">{T("objectiveAppPromotion")}</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5"><label className="text-sm font-medium">{T("budgetType")}</label>
                <Select value={cForm.budget_type} onValueChange={v => setCForm({ ...cForm, budget_type: v })}><SelectTrigger className="h-9 sm:h-10"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="daily">{T("budgetDaily")}</SelectItem><SelectItem value="lifetime">{T("budgetLifetime")}</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">{T("budgetAmount")} (RM) *</label>
                <Input type="number" step="0.01" value={cForm.budget_amount} onChange={e => setCForm({ ...cForm, budget_amount: e.target.value })} placeholder="0.00" className="h-9 sm:h-10" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5"><label className="text-sm font-medium">{T("startDate")}</label>
                <Input type="date" value={cForm.start_date} onChange={e => setCForm({ ...cForm, start_date: e.target.value })} className="h-9 sm:h-10" /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">{T("endDate")}</label>
                <Input type="date" value={cForm.end_date} onChange={e => setCForm({ ...cForm, end_date: e.target.value })} className="h-9 sm:h-10" /></div>
            </div>
            <div className="space-y-1.5"><label className="text-sm font-medium">{T("notes")}</label>
              <Textarea value={cForm.notes} onChange={e => setCForm({ ...cForm, notes: e.target.value })} placeholder={T("notesPlaceholder")} className="min-h-[80px]" /></div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setShowCModal(false)} className="w-full sm:w-auto">{T("cancel")}</Button>
            <Button onClick={handleSubmitC} disabled={createCampaign.isPending || updateCampaign.isPending} className="w-full sm:w-auto">
              {(createCampaign.isPending || updateCampaign.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editCampaign ? T("save") : T("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Details */}
      <Dialog open={showCDetails} onOpenChange={setShowCDetails}>
        <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="truncate">{T("campaignDetails")} - {selCampaign?.name}</span>
            </DialogTitle>
          </DialogHeader>
          {selCampaign && (
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div><p className="text-xs sm:text-sm text-muted-foreground">{T("status")}</p><Badge className={`${campaignStatusCfg(selCampaign.status).bg} text-xs`}>{campaignStatusCfg(selCampaign.status).label}</Badge></div>
                <div><p className="text-xs sm:text-sm text-muted-foreground">{T("platform")}</p><Badge className={`${platCfg(selCampaign.platform).bg} ${platCfg(selCampaign.platform).color} text-xs`}>{platCfg(selCampaign.platform).label}</Badge></div>
                <div><p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1"><Target className="w-3 h-3" />{T("objective")}</p><p className="font-medium text-sm">{objLabel(selCampaign.objective)}</p></div>
                <div><p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" />{T("budget")}</p><p className="font-medium text-sm">RM {(selCampaign.budget_amount / 100).toLocaleString()} ({btLabel(selCampaign.budget_type)})</p></div>
                <div><p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" />{T("spent")}</p><p className="font-bold text-primary text-sm">RM {(selCampaign.spent_amount / 100).toLocaleString()}</p></div>
                <div><p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{T("dateRange")}</p><p className="font-medium text-sm">{fmtDate(selCampaign.start_date)} ~ {fmtDate(selCampaign.end_date)}</p></div>
                <div><p className="text-xs sm:text-sm text-muted-foreground">{T("createdAt")}</p><p className="font-medium text-sm">{fmtDT(selCampaign.created_at)}</p></div>
                <div><p className="text-xs sm:text-sm text-muted-foreground">{T("updatedAt")}</p><p className="font-medium text-sm">{fmtDT(selCampaign.updated_at)}</p></div>
              </div>
              <div className="p-3 sm:p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{T("budgetUsage")}</span>
                  <span className="text-sm text-muted-foreground">{selCampaign.budget_amount > 0 ? Math.min(100, Math.round((selCampaign.spent_amount / selCampaign.budget_amount) * 100)) : 0}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${selCampaign.budget_amount > 0 ? Math.min(100, (selCampaign.spent_amount / selCampaign.budget_amount) * 100) : 0}%` }} />
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>RM {(selCampaign.spent_amount / 100).toLocaleString()} {T("spent")}</span>
                  <span>RM {(selCampaign.budget_amount / 100).toLocaleString()} {T("budget")}</span>
                </div>
              </div>
              {selCampaign.notes && (<><Separator /><div><p className="text-xs sm:text-sm text-muted-foreground">{T("notes")}</p><p className="text-xs sm:text-sm bg-muted p-2.5 sm:p-3 rounded-lg">{selCampaign.notes}</p></div></>)}
              <div className="flex flex-wrap gap-2 justify-end pt-2 sm:pt-4">
                {selCampaign.status === "draft" && <Button onClick={() => { updateCStatus.mutate({ id: selCampaign.id, status: "active" }); setSelCampaign({ ...selCampaign, status: "active" }); }} disabled={updateCStatus.isPending} className="w-full sm:w-auto">{updateCStatus.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<CheckCircle className="w-4 h-4 mr-2" />{T("activate")}</Button>}
                {selCampaign.status === "active" && <Button variant="outline" onClick={() => { updateCStatus.mutate({ id: selCampaign.id, status: "paused" }); setSelCampaign({ ...selCampaign, status: "paused" }); }} disabled={updateCStatus.isPending} className="w-full sm:w-auto">{updateCStatus.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<Pause className="w-4 h-4 mr-2" />{T("pause")}</Button>}
                {selCampaign.status === "paused" && <Button onClick={() => { updateCStatus.mutate({ id: selCampaign.id, status: "active" }); setSelCampaign({ ...selCampaign, status: "active" }); }} disabled={updateCStatus.isPending} className="w-full sm:w-auto">{updateCStatus.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<CheckCircle className="w-4 h-4 mr-2" />{T("resume")}</Button>}
              </div>
            </div>
          )}
          <DialogFooter className="mt-3 sm:mt-4"><Button variant="outline" onClick={() => setShowCDetails(false)} className="w-full sm:w-auto">{T("close")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Delete */}
      <Dialog open={showCDelete} onOpenChange={setShowCDelete}>
        <DialogContent className="w-[95vw] max-w-[400px] p-4 sm:p-6">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Trash2 className="w-4 h-4 text-destructive" />{T("deleteCampaign")}</DialogTitle><DialogDescription>{T("deleteConfirm")}</DialogDescription></DialogHeader>
          {selCampaign && <div className="py-2 sm:py-4"><p className="text-sm">{T("deleteWarning")} <span className="font-bold">{selCampaign.name}</span></p></div>}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setShowCDelete(false)} className="w-full sm:w-auto">{T("cancel")}</Button>
            <Button variant="destructive" onClick={() => selCampaign && deleteCampaign.mutate(selCampaign.id)} disabled={deleteCampaign.isPending} className="w-full sm:w-auto">{deleteCampaign.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{T("confirmDelete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════ PLACEMENT DIALOGS ══════════════ */}

      {/* Plan Create/Edit */}
      <Dialog open={showPModal} onOpenChange={setShowPModal}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg"><Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />{editPlan ? T("editPlan") : T("createPlan")}</DialogTitle>
            <DialogDescription className="text-sm">{editPlan ? T("editPlanDesc") : T("createPlanDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="space-y-1.5"><label className="text-sm font-medium">{T("planName")} *</label>
              <Input value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })} placeholder={T("planNamePlaceholder")} className="h-9 sm:h-10" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">{T("description")}</label>
              <Textarea value={pForm.description} onChange={e => setPForm({ ...pForm, description: e.target.value })} placeholder={T("descriptionPlaceholder")} className="min-h-[80px]" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5"><label className="text-sm font-medium">{T("platform")} *</label>
                <Select value={pForm.platform} onValueChange={v => setPForm({ ...pForm, platform: v })}><SelectTrigger className="h-9 sm:h-10"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="facebook">Facebook</SelectItem><SelectItem value="instagram">Instagram</SelectItem><SelectItem value="both">Facebook + Instagram</SelectItem><SelectItem value="xiaohongshu">{T("platformXiaohongshu")}</SelectItem><SelectItem value="google">Google</SelectItem><SelectItem value="tiktok">TikTok</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">{T("campaign")}</label>
                <Select value={pForm.campaign_id} onValueChange={v => setPForm({ ...pForm, campaign_id: v })}><SelectTrigger className="h-9 sm:h-10"><SelectValue placeholder={T("selectCampaign")} /></SelectTrigger>
                  <SelectContent><SelectItem value="">{T("none")}</SelectItem>{campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5"><label className="text-sm font-medium">{T("totalBudget")} (RM)</label>
                <Input type="number" step="0.01" value={pForm.total_budget} onChange={e => setPForm({ ...pForm, total_budget: e.target.value })} placeholder="0.00" className="h-9 sm:h-10" /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">{T("dailyBudget")} (RM)</label>
                <Input type="number" step="0.01" value={pForm.daily_budget} onChange={e => setPForm({ ...pForm, daily_budget: e.target.value })} placeholder="0.00" className="h-9 sm:h-10" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5"><label className="text-sm font-medium">{T("startDate")}</label>
                <Input type="date" value={pForm.start_date} onChange={e => setPForm({ ...pForm, start_date: e.target.value })} className="h-9 sm:h-10" /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">{T("endDate")}</label>
                <Input type="date" value={pForm.end_date} onChange={e => setPForm({ ...pForm, end_date: e.target.value })} className="h-9 sm:h-10" /></div>
            </div>
            <div className="space-y-1.5"><label className="text-sm font-medium">{T("kpiTargets")}</label>
              <Textarea value={pForm.kpi_targets} onChange={e => setPForm({ ...pForm, kpi_targets: e.target.value })} placeholder={T("kpiTargetsPlaceholder")} className="min-h-[80px] font-mono text-sm" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">{T("notes")}</label>
              <Textarea value={pForm.notes} onChange={e => setPForm({ ...pForm, notes: e.target.value })} placeholder={T("notesPlaceholder")} className="min-h-[80px]" /></div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setShowPModal(false)} className="w-full sm:w-auto">{T("cancel")}</Button>
            <Button onClick={handleSubmitP} disabled={createPlan.isPending || updatePlan.isPending} className="w-full sm:w-auto">
              {(createPlan.isPending || updatePlan.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editPlan ? T("save") : T("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Delete */}
      <Dialog open={showPDelete} onOpenChange={setShowPDelete}>
        <DialogContent className="w-[95vw] max-w-[400px] p-4 sm:p-6">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Trash2 className="w-4 h-4 text-destructive" />{T("deletePlan")}</DialogTitle><DialogDescription>{T("deleteConfirm")}</DialogDescription></DialogHeader>
          {delPlan && <div className="py-2 sm:py-4"><p className="text-sm font-medium">{delPlan.name}</p><p className="text-xs text-muted-foreground mt-1">{platCfg(delPlan.platform).label} - RM {delPlan.total_budget.toLocaleString()}</p></div>}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setShowPDelete(false)} className="w-full sm:w-auto">{T("cancel")}</Button>
            <Button variant="destructive" onClick={() => delPlan && deletePlan_.mutate(delPlan.id)} disabled={deletePlan_.isPending} className="w-full sm:w-auto">{deletePlan_.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{T("confirmDelete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════ CREATIVES DIALOGS ══════════════ */}

      {/* Ad Set Create/Edit */}
      <Dialog open={showASModal} onOpenChange={setShowASModal}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Layers className="w-4 h-4 text-primary" />{editAS ? T("editAdSet") : T("newAdSet")}</DialogTitle>
            <DialogDescription>{editAS ? T("editAdSetDesc") : T("newAdSetDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="space-y-1.5"><label className="text-sm font-medium">{T("adSetName")} *</label>
              <Input value={asForm.name} onChange={e => setASForm({ ...asForm, name: e.target.value })} placeholder={T("adSetNamePlaceholder")} className="h-9 sm:h-10" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5"><label className="text-sm font-medium">{T("campaign")}</label>
                <Select value={asForm.campaign_id} onValueChange={v => setASForm({ ...asForm, campaign_id: v })}><SelectTrigger className="h-9 sm:h-10"><SelectValue placeholder={T("selectCampaign")} /></SelectTrigger>
                  <SelectContent><SelectItem value="">{T("none")}</SelectItem>{campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">{T("budget")} (RM)</label>
                <Input type="number" step="0.01" value={asForm.budget} onChange={e => setASForm({ ...asForm, budget: e.target.value })} placeholder="0.00" className="h-9 sm:h-10" /></div>
            </div>
            <div className="space-y-1.5"><label className="text-sm font-medium">{T("targeting")} (JSON)</label>
              <Textarea value={asForm.targeting} onChange={e => setASForm({ ...asForm, targeting: e.target.value })} placeholder='{"age_min": 18, "age_max": 65}' className="min-h-[100px] font-mono text-sm" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">{T("status")}</label>
              <Select value={asForm.status} onValueChange={v => setASForm({ ...asForm, status: v })}><SelectTrigger className="h-9 sm:h-10"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">{T("statusActive")}</SelectItem><SelectItem value="paused">{T("statusPaused")}</SelectItem><SelectItem value="draft">{T("statusDraft")}</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setShowASModal(false)} className="w-full sm:w-auto">{T("cancel")}</Button>
            <Button onClick={handleSubmitAS} disabled={createAS.isPending || updateAS.isPending} className="w-full sm:w-auto">
              {(createAS.isPending || updateAS.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editAS ? T("save") : T("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ad Set Delete */}
      <Dialog open={showASDelete} onOpenChange={setShowASDelete}>
        <DialogContent className="w-[95vw] max-w-[400px] p-4 sm:p-6">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Trash2 className="w-4 h-4 text-destructive" />{T("deleteAdSet")}</DialogTitle><DialogDescription>{T("deleteConfirm")}</DialogDescription></DialogHeader>
          {delAS && <div className="py-2 sm:py-4"><p className="text-sm font-medium">{delAS.name}</p></div>}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setShowASDelete(false)} className="w-full sm:w-auto">{T("cancel")}</Button>
            <Button variant="destructive" onClick={() => delAS && deleteAS.mutate(delAS.id)} disabled={deleteAS.isPending} className="w-full sm:w-auto">{deleteAS.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{T("confirmDelete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Creative Create/Edit */}
      <Dialog open={showCrModal} onOpenChange={setShowCrModal}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Image className="w-4 h-4 text-primary" />{editCr ? T("editCreative") : T("newCreative")}</DialogTitle>
            <DialogDescription>{editCr ? T("editCreativeDesc") : T("newCreativeDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="space-y-1.5"><label className="text-sm font-medium">{T("adSet")}</label>
              <Select value={crForm.ad_set_id} onValueChange={v => setCrForm({ ...crForm, ad_set_id: v })}><SelectTrigger className="h-9 sm:h-10"><SelectValue placeholder={T("selectAdSet")} /></SelectTrigger>
                <SelectContent><SelectItem value="">{T("none")}</SelectItem>{adSets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">{T("creativeTitle")} *</label>
              <Input value={crForm.title} onChange={e => setCrForm({ ...crForm, title: e.target.value })} placeholder={T("creativeTitlePlaceholder")} className="h-9 sm:h-10" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">{T("description")}</label>
              <Textarea value={crForm.description} onChange={e => setCrForm({ ...crForm, description: e.target.value })} placeholder={T("descriptionPlaceholder")} className="min-h-[80px]" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">{T("mediaUrl")}</label>
              <Input value={crForm.media_url} onChange={e => setCrForm({ ...crForm, media_url: e.target.value })} placeholder="https://..." className="h-9 sm:h-10" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5"><label className="text-sm font-medium">{T("callToAction")}</label>
                <Input value={crForm.call_to_action} onChange={e => setCrForm({ ...crForm, call_to_action: e.target.value })} placeholder="Shop Now" className="h-9 sm:h-10" /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">{T("creativeType")}</label>
                <Select value={crForm.creative_type} onValueChange={v => setCrForm({ ...crForm, creative_type: v })}><SelectTrigger className="h-9 sm:h-10"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="image">{T("typeImage")}</SelectItem><SelectItem value="video">{T("typeVideo")}</SelectItem><SelectItem value="carousel">{T("typeCarousel")}</SelectItem><SelectItem value="story">{T("typeStory")}</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-1.5"><label className="text-sm font-medium">{T("status")}</label>
              <Select value={crForm.status} onValueChange={v => setCrForm({ ...crForm, status: v })}><SelectTrigger className="h-9 sm:h-10"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="draft">{T("statusDraft")}</SelectItem><SelectItem value="active">{T("statusActive")}</SelectItem><SelectItem value="paused">{T("statusPaused")}</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setShowCrModal(false)} className="w-full sm:w-auto">{T("cancel")}</Button>
            <Button onClick={handleSubmitCr} disabled={createCr.isPending || updateCr.isPending} className="w-full sm:w-auto">
              {(createCr.isPending || updateCr.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editCr ? T("save") : T("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Creative Delete */}
      <Dialog open={showCrDelete} onOpenChange={setShowCrDelete}>
        <DialogContent className="w-[95vw] max-w-[400px] p-4 sm:p-6">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Trash2 className="w-4 h-4 text-destructive" />{T("deleteCreative")}</DialogTitle><DialogDescription>{T("deleteConfirm")}</DialogDescription></DialogHeader>
          {delCr && <div className="py-2 sm:py-4"><p className="text-sm font-medium">{delCr.title}</p></div>}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button variant="outline" onClick={() => setShowCrDelete(false)} className="w-full sm:w-auto">{T("cancel")}</Button>
            <Button variant="destructive" onClick={() => delCr && deleteCr_.mutate(delCr.id)} disabled={deleteCr_.isPending} className="w-full sm:w-auto">{deleteCr_.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{T("confirmDelete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
