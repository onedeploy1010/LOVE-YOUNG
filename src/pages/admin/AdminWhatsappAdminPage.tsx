import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
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
  Users, Search, Plus, Edit, Trash2, Loader2,
  Phone, Clock, MessageSquare, UserCheck,
  AlertCircle, ArrowRightLeft, Settings,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface WhatsappAdmin {
  id: string;
  user_id: string | null;
  name: string;
  phone: string;
  whatsapp_phone_id: string | null;
  status: string;
  is_on_duty: boolean;
  duty_start: string | null;
  duty_end: string | null;
  max_concurrent_chats: number;
  current_chat_count: number;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

interface WhatsappAssignment {
  id: string;
  conversation_id: string;
  admin_id: string | null;
  assigned_at: string;
  timeout_at: string | null;
  responded_at: string | null;
  status: string;
  timeout_seconds: number;
  transferred_from: string | null;
  notes: string | null;
  created_at: string;
}

interface AdminFormData {
  name: string;
  phone: string;
  duty_start: string;
  duty_end: string;
  max_concurrent_chats: number;
}

const emptyForm: AdminFormData = {
  name: "",
  phone: "",
  duty_start: "09:00",
  duty_end: "18:00",
  max_concurrent_chats: 5,
};

export default function AdminWhatsappAdminPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<WhatsappAdmin | null>(null);
  const [form, setForm] = useState<AdminFormData>(emptyForm);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [assignAdminId, setAssignAdminId] = useState("");

  // Fetch admins
  const { data: admins = [], isLoading } = useQuery({
    queryKey: ["whatsapp_admins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_admins")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WhatsappAdmin[];
    },
  });

  // Fetch unassigned conversations
  const { data: unassignedConversations = [] } = useQuery({
    queryKey: ["unassigned_conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .select("id, customer_phone, customer_name, created_at, assignment_status")
        .or("assignment_status.eq.unassigned,assignment_status.is.null")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as { id: string; customer_phone: string; customer_name: string | null; created_at: string; assignment_status: string | null }[];
    },
  });

  // Fetch recent assignments
  const { data: assignments = [] } = useQuery({
    queryKey: ["whatsapp_assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_assignments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as WhatsappAssignment[];
    },
  });

  // Create admin
  const createMutation = useMutation({
    mutationFn: async (data: AdminFormData) => {
      const { error } = await supabase.from("whatsapp_admins").insert({
        name: data.name,
        phone: data.phone,
        duty_start: data.duty_start || null,
        duty_end: data.duty_end || null,
        max_concurrent_chats: data.max_concurrent_chats,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp_admins"] });
      toast({ title: t("admin.whatsappAdminsPage.createSuccess") });
      setCreateOpen(false);
      setForm(emptyForm);
    },
    onError: () => {
      toast({ title: t("admin.whatsappAdminsPage.createError"), variant: "destructive" });
    },
  });

  // Update admin
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AdminFormData }) => {
      const { error } = await supabase
        .from("whatsapp_admins")
        .update({
          name: data.name,
          phone: data.phone,
          duty_start: data.duty_start || null,
          duty_end: data.duty_end || null,
          max_concurrent_chats: data.max_concurrent_chats,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp_admins"] });
      toast({ title: t("admin.whatsappAdminsPage.updateSuccess") });
      setEditOpen(false);
    },
    onError: () => {
      toast({ title: t("admin.whatsappAdminsPage.updateError"), variant: "destructive" });
    },
  });

  // Delete admin
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("whatsapp_admins").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp_admins"] });
      toast({ title: t("admin.whatsappAdminsPage.deleteSuccess") });
      setDeleteOpen(false);
      setSelectedAdmin(null);
    },
    onError: () => {
      toast({ title: t("admin.whatsappAdminsPage.deleteError"), variant: "destructive" });
    },
  });

  // Toggle duty
  const toggleDutyMutation = useMutation({
    mutationFn: async ({ id, is_on_duty }: { id: string; is_on_duty: boolean }) => {
      const { error } = await supabase
        .from("whatsapp_admins")
        .update({ is_on_duty })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp_admins"] });
    },
  });

  // Toggle status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("whatsapp_admins")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp_admins"] });
    },
  });

  // Assign conversation
  const assignMutation = useMutation({
    mutationFn: async ({ conversationId, adminId }: { conversationId: string; adminId: string }) => {
      // Create assignment
      const { error: assignError } = await supabase.from("whatsapp_assignments").insert({
        conversation_id: conversationId,
        admin_id: adminId,
        timeout_seconds: 300,
        timeout_at: new Date(Date.now() + 300000).toISOString(),
      });
      if (assignError) throw assignError;
      // Update conversation
      const { error: convError } = await supabase
        .from("whatsapp_conversations")
        .update({ assigned_admin_id: adminId, assignment_status: "assigned" })
        .eq("id", conversationId);
      if (convError) throw convError;
      // Increment chat count
      const admin = admins.find((a) => a.id === adminId);
      if (admin) {
        await supabase
          .from("whatsapp_admins")
          .update({ current_chat_count: admin.current_chat_count + 1 })
          .eq("id", adminId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp_admins"] });
      queryClient.invalidateQueries({ queryKey: ["unassigned_conversations"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp_assignments"] });
      toast({ title: t("admin.whatsappAdminsPage.assignSuccess") });
      setAssignOpen(false);
    },
    onError: () => {
      toast({ title: t("admin.whatsappAdminsPage.assignError"), variant: "destructive" });
    },
  });

  // Filter
  const filtered = admins.filter((a) => {
    const matchTab =
      tab === "all" ||
      (tab === "online" && a.status === "online") ||
      (tab === "offline" && a.status === "offline") ||
      (tab === "on_duty" && a.is_on_duty);
    const matchSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.phone.includes(search);
    return matchTab && matchSearch;
  });

  // Stats
  const totalAdmins = admins.length;
  const onlineCount = admins.filter((a) => a.status === "online").length;
  const onDutyCount = admins.filter((a) => a.is_on_duty).length;
  const activeChats = admins.reduce((sum, a) => sum + a.current_chat_count, 0);

  const statusColor: Record<string, string> = {
    online: "bg-green-100 text-green-700",
    offline: "bg-gray-100 text-gray-700",
    busy: "bg-yellow-100 text-yellow-700",
  };

  const openEdit = (admin: WhatsappAdmin) => {
    setSelectedAdmin(admin);
    setForm({
      name: admin.name,
      phone: admin.phone,
      duty_start: admin.duty_start || "09:00",
      duty_end: admin.duty_end || "18:00",
      max_concurrent_chats: admin.max_concurrent_chats,
    });
    setEditOpen(true);
  };

  const FormFields = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">{t("admin.whatsappAdminsPage.fieldName")}</label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={t("admin.whatsappAdminsPage.fieldNamePlaceholder")}
        />
      </div>
      <div>
        <label className="text-sm font-medium">{t("admin.whatsappAdminsPage.fieldPhone")}</label>
        <Input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder={t("admin.whatsappAdminsPage.fieldPhonePlaceholder")}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">{t("admin.whatsappAdminsPage.dutyStart")}</label>
          <Input
            type="time"
            value={form.duty_start}
            onChange={(e) => setForm({ ...form, duty_start: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t("admin.whatsappAdminsPage.dutyEnd")}</label>
          <Input
            type="time"
            value={form.duty_end}
            onChange={(e) => setForm({ ...form, duty_end: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">{t("admin.whatsappAdminsPage.maxChats")}</label>
        <Input
          type="number"
          min={1}
          max={20}
          value={form.max_concurrent_chats}
          onChange={(e) => setForm({ ...form, max_concurrent_chats: parseInt(e.target.value) || 5 })}
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
              <Users className="w-6 h-6" />
              {t("admin.whatsappAdminsPage.title")}
            </h1>
            <p className="text-muted-foreground">{t("admin.whatsappAdminsPage.subtitle")}</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            {t("admin.whatsappAdminsPage.addAdmin")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.whatsappAdminsPage.totalAdmins")}</p>
                  <p className="text-2xl font-bold">{totalAdmins}</p>
                </div>
                <Users className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.whatsappAdminsPage.online")}</p>
                  <p className="text-2xl font-bold text-green-600">{onlineCount}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-300" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.whatsappAdminsPage.onDuty")}</p>
                  <p className="text-2xl font-bold text-blue-600">{onDutyCount}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-300" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.whatsappAdminsPage.activeChats")}</p>
                  <p className="text-2xl font-bold">{activeChats}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Admin List */}
          <div className="lg:col-span-2">
            <Tabs value={tab} onValueChange={setTab}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="all">{t("admin.whatsappAdminsPage.tabAll")}</TabsTrigger>
                  <TabsTrigger value="online">{t("admin.whatsappAdminsPage.tabOnline")}</TabsTrigger>
                  <TabsTrigger value="offline">{t("admin.whatsappAdminsPage.tabOffline")}</TabsTrigger>
                  <TabsTrigger value="on_duty">{t("admin.whatsappAdminsPage.tabOnDuty")}</TabsTrigger>
                </TabsList>
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("admin.whatsappAdminsPage.searchPlaceholder")}
                    className="pl-10"
                  />
                </div>
              </div>

              <TabsContent value={tab}>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filtered.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>{t("admin.whatsappAdminsPage.noAdmins")}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((admin) => (
                      <Card key={admin.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">{admin.name}</h3>
                                  <Badge className={statusColor[admin.status] || "bg-gray-100 text-gray-700"}>
                                    {t(`admin.whatsappAdminsPage.status_${admin.status}`)}
                                  </Badge>
                                  {admin.is_on_duty && (
                                    <Badge className="bg-blue-100 text-blue-700">
                                      {t("admin.whatsappAdminsPage.onDuty")}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> {admin.phone}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" /> {admin.current_chat_count}/{admin.max_concurrent_chats}
                                  </span>
                                  {admin.duty_start && admin.duty_end && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {admin.duty_start}-{admin.duty_end}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2 mr-2">
                                <span className="text-xs text-muted-foreground">{t("admin.whatsappAdminsPage.onDuty")}</span>
                                <Switch
                                  checked={admin.is_on_duty}
                                  onCheckedChange={(checked) => toggleDutyMutation.mutate({ id: admin.id, is_on_duty: checked })}
                                />
                              </div>
                              <Select
                                value={admin.status}
                                onValueChange={(v) => toggleStatusMutation.mutate({ id: admin.id, status: v })}
                              >
                                <SelectTrigger className="w-24 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="online">{t("admin.whatsappAdminsPage.status_online")}</SelectItem>
                                  <SelectItem value="offline">{t("admin.whatsappAdminsPage.status_offline")}</SelectItem>
                                  <SelectItem value="busy">{t("admin.whatsappAdminsPage.status_busy")}</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button size="sm" variant="ghost" onClick={() => openEdit(admin)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setSelectedAdmin(admin); setDeleteOpen(true); }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Assignment Queue Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="w-5 h-5" />
                  {t("admin.whatsappAdminsPage.assignmentQueue")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {unassignedConversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t("admin.whatsappAdminsPage.noUnassigned")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {unassignedConversations.map((conv) => (
                      <div key={conv.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{conv.customer_name || conv.customer_phone}</p>
                          <p className="text-xs text-muted-foreground">{conv.customer_phone}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedConversationId(conv.id);
                            setAssignAdminId("");
                            setAssignOpen(true);
                          }}
                        >
                          <ArrowRightLeft className="w-4 h-4 mr-1" />
                          {t("admin.whatsappAdminsPage.assign")}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Auto-Assignment Settings */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="w-5 h-5" />
                  {t("admin.whatsappAdminsPage.autoAssignment")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("admin.whatsappAdminsPage.autoAssignEnabled")}</span>
                    <Switch defaultChecked />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">{t("admin.whatsappAdminsPage.timeoutSeconds")}</label>
                    <Input type="number" defaultValue={300} min={60} max={3600} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">{t("admin.whatsappAdminsPage.strategy")}</label>
                    <Select defaultValue="least_busy">
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="least_busy">{t("admin.whatsappAdminsPage.strategyLeastBusy")}</SelectItem>
                        <SelectItem value="round_robin">{t("admin.whatsappAdminsPage.strategyRoundRobin")}</SelectItem>
                        <SelectItem value="manual">{t("admin.whatsappAdminsPage.strategyManual")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create Admin Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.whatsappAdminsPage.addAdmin")}</DialogTitle>
              <DialogDescription>{t("admin.whatsappAdminsPage.addAdminDesc")}</DialogDescription>
            </DialogHeader>
            <FormFields />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                {t("admin.whatsappAdminsPage.cancel")}
              </Button>
              <Button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.name || !form.phone || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("admin.whatsappAdminsPage.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Admin Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.whatsappAdminsPage.editAdmin")}</DialogTitle>
              <DialogDescription>{t("admin.whatsappAdminsPage.editAdminDesc")}</DialogDescription>
            </DialogHeader>
            <FormFields />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                {t("admin.whatsappAdminsPage.cancel")}
              </Button>
              <Button
                onClick={() => selectedAdmin && updateMutation.mutate({ id: selectedAdmin.id, data: form })}
                disabled={!form.name || !form.phone || updateMutation.isPending}
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("admin.whatsappAdminsPage.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.whatsappAdminsPage.deleteConfirmTitle")}</DialogTitle>
              <DialogDescription>{t("admin.whatsappAdminsPage.deleteConfirmDesc")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                {t("admin.whatsappAdminsPage.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedAdmin && deleteMutation.mutate(selectedAdmin.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("admin.whatsappAdminsPage.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Dialog */}
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.whatsappAdminsPage.assignConversation")}</DialogTitle>
              <DialogDescription>{t("admin.whatsappAdminsPage.assignConversationDesc")}</DialogDescription>
            </DialogHeader>
            <div>
              <label className="text-sm font-medium">{t("admin.whatsappAdminsPage.selectAdmin")}</label>
              <Select value={assignAdminId} onValueChange={setAssignAdminId}>
                <SelectTrigger><SelectValue placeholder={t("admin.whatsappAdminsPage.selectAdminPlaceholder")} /></SelectTrigger>
                <SelectContent>
                  {admins
                    .filter((a) => a.status === "online" && a.current_chat_count < a.max_concurrent_chats)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} ({a.current_chat_count}/{a.max_concurrent_chats})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignOpen(false)}>
                {t("admin.whatsappAdminsPage.cancel")}
              </Button>
              <Button
                onClick={() => assignMutation.mutate({ conversationId: selectedConversationId, adminId: assignAdminId })}
                disabled={!assignAdminId || assignMutation.isPending}
              >
                {assignMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("admin.whatsappAdminsPage.assign")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
