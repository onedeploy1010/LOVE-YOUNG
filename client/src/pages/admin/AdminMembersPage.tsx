import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/AdminLayout";
import {
  Users, Search, Star, Crown, Shield, Eye, Mail, Phone
} from "lucide-react";

const mockMembers = [
  { id: "1", name: "张三", email: "zhangsan@example.com", phone: "+60 12-345 6789", role: "member", points: 1580, orders: 5 },
  { id: "2", name: "李四", email: "lisi@example.com", phone: "+60 12-345 6790", role: "partner", points: 2800, orders: 12 },
  { id: "3", name: "王五", email: "wangwu@example.com", phone: "+60 12-345 6791", role: "member", points: 450, orders: 2 },
  { id: "4", name: "赵六", email: "zhaoliu@example.com", phone: "+60 12-345 6792", role: "admin", points: 0, orders: 0 },
];

const getRoleBadge = (role: string) => {
  switch (role) {
    case "member": return { label: "会员", icon: Star, variant: "secondary" as const };
    case "partner": return { label: "经营人", icon: Crown, variant: "default" as const };
    case "admin": return { label: "管理员", icon: Shield, variant: "destructive" as const };
    default: return { label: "用户", icon: Users, variant: "outline" as const };
  }
};

export default function AdminMembersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredMembers = mockMembers.filter(member => {
    const matchesSearch = searchQuery === "" || 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || member.role === activeTab;
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: mockMembers.length,
    members: mockMembers.filter(m => m.role === "member").length,
    partners: mockMembers.filter(m => m.role === "partner").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-members-title">会员管理</h1>
          <p className="text-muted-foreground">查看与管理所有会员</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">总用户</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary">{stats.members}</p>
                <p className="text-sm text-muted-foreground">普通会员</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{stats.partners}</p>
                <p className="text-sm text-muted-foreground">经营人</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                会员列表
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索姓名或邮箱..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" data-testid="tab-all">全部</TabsTrigger>
                <TabsTrigger value="member" data-testid="tab-member">会员</TabsTrigger>
                <TabsTrigger value="partner" data-testid="tab-partner">经营人</TabsTrigger>
                <TabsTrigger value="admin" data-testid="tab-admin">管理员</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">暂无会员</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMembers.map((member) => {
                      const roleConfig = getRoleBadge(member.role);
                      const RoleIcon = roleConfig.icon;
                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                          data-testid={`member-${member.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <RoleIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{member.name}</span>
                                <Badge variant={roleConfig.variant}>{roleConfig.label}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {member.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {member.phone}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                              <p className="text-sm">{member.points} 积分</p>
                              <p className="text-xs text-muted-foreground">{member.orders} 订单</p>
                            </div>
                            <Button variant="outline" size="sm" className="gap-1" data-testid={`button-view-${member.id}`}>
                              <Eye className="w-4 h-4" />
                              详情
                            </Button>
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
    </AdminLayout>
  );
}
