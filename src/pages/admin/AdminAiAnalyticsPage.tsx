import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/i18n";
import {
  BarChart3,
  MessageSquare,
  TrendingUp,
  Package,
  Users,
  HelpCircle,
  Building,
  ShoppingCart,
  Loader2,
} from "lucide-react";

interface CategorySummary {
  category: string;
  pattern_count: number;
  total_questions: number;
  last_asked: string;
}

interface QuestionPattern {
  id: string;
  category: string;
  question_pattern: string;
  sample_questions: string[];
  question_count: number;
  last_asked_at: string;
}

interface TrainingData {
  id: string;
  question: string;
  answer: string;
  category: string;
  is_verified: boolean;
  confidence_score: number;
}

const categoryConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  product: { icon: Package, label: "产品咨询", color: "bg-blue-500" },
  partner: { icon: Users, label: "经营人计划", color: "bg-green-500" },
  brand: { icon: Building, label: "品牌相关", color: "bg-purple-500" },
  order: { icon: ShoppingCart, label: "订单物流", color: "bg-orange-500" },
  howto: { icon: HelpCircle, label: "使用指南", color: "bg-yellow-500" },
  general: { icon: MessageSquare, label: "其他问题", color: "bg-gray-500" },
};

export default function AdminAiAnalyticsPage() {
  const { t } = useTranslation();

  // Fetch category summary
  const { data: categorySummary, isLoading: loadingSummary } = useQuery({
    queryKey: ["ai-category-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_question_category_summary")
        .select("*");
      if (error) throw error;
      return data as CategorySummary[];
    },
  });

  // Fetch top question patterns
  const { data: topPatterns, isLoading: loadingPatterns } = useQuery({
    queryKey: ["ai-top-patterns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_question_analytics")
        .select("*")
        .order("question_count", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as QuestionPattern[];
    },
  });

  // Fetch training data stats
  const { data: trainingStats } = useQuery({
    queryKey: ["ai-training-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_training_data")
        .select("category, is_verified");
      if (error) throw error;

      const total = data.length;
      const verified = data.filter(d => d.is_verified).length;
      const byCategory = data.reduce((acc, d) => {
        acc[d.category] = (acc[d.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return { total, verified, byCategory };
    },
  });

  // Fetch recent unverified questions for training
  const { data: unverifiedQuestions } = useQuery({
    queryKey: ["ai-unverified-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_training_data")
        .select("*")
        .eq("is_verified", false)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as TrainingData[];
    },
  });

  const totalQuestions = categorySummary?.reduce((sum, c) => sum + (c.total_questions || 0), 0) || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-serif text-primary flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            AI 客户咨询数据中心
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            分析客户问题，优化AI回答质量
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalQuestions}</p>
                  <p className="text-xs text-muted-foreground">总咨询量</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{trainingStats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">训练数据</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{trainingStats?.verified || 0}</p>
                  <p className="text-xs text-muted-foreground">已验证回答</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100">
                  <HelpCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unverifiedQuestions?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">待训练</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">问题分类分布</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {categorySummary?.map((cat) => {
                  const config = categoryConfig[cat.category] || categoryConfig.general;
                  const Icon = config.icon;
                  const percentage = totalQuestions > 0
                    ? Math.round((cat.total_questions / totalQuestions) * 100)
                    : 0;

                  return (
                    <div
                      key={cat.category}
                      className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded ${config.color}`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                      <div className="text-2xl font-bold">{cat.total_questions || 0}</div>
                      <div className="text-xs text-muted-foreground">{percentage}%</div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">热门问题模式</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPatterns ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  {topPatterns?.slice(0, 10).map((pattern, idx) => {
                    const config = categoryConfig[pattern.category] || categoryConfig.general;
                    return (
                      <div
                        key={pattern.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {pattern.sample_questions?.[0] || pattern.question_pattern}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {config.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {pattern.question_count} 次
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Training */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">待训练问答</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {unverifiedQuestions?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    暂无待训练数据 ✨
                  </p>
                ) : (
                  unverifiedQuestions?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border bg-muted/30 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">Q: {item.question}</p>
                        <Badge variant="outline" className="shrink-0">
                          {categoryConfig[item.category]?.label || item.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        A: {item.answer}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          置信度: {Math.round((item.confidence_score || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Training Data by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">训练数据分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Object.entries(trainingStats?.byCategory || {}).map(([category, count]) => {
                const config = categoryConfig[category] || categoryConfig.general;
                const Icon = config.icon;
                return (
                  <div key={category} className="flex items-center gap-3 p-3 rounded-lg border">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{count}</p>
                      <p className="text-xs text-muted-foreground">{config.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
