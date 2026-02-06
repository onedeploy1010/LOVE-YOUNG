import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function AdminXiaohongshuPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-primary">小红书管理</h1>
          <p className="text-sm text-muted-foreground">管理小红书内容和投放</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Construction className="w-5 h-5 text-primary" />
              功能开发中
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">此功能正在开发中，敬请期待。</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
