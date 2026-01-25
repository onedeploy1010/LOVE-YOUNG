import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User as UserIcon, 
  Package, 
  PieChart, 
  Coins, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  CreditCard, 
  ShieldCheck, 
  TrendingUp,
  LogOut,
  Settings
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PointsDisplay } from '@/components/PointsDisplay';
import { 
  User, 
  Order, 
  RWAPartner, 
  LYPoints, 
  OrderStatus, 
  RWALevel 
} from '@/types/index';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IMAGES } from '@/assets/images';

const MOCK_USER: User = {
  id: 'u123',
  username: '林舒雅',
  email: 'lin.shuya@example.com',
  avatar: IMAGES.BUSINESS_WOMAN_1,
  role: 'PARTNER',
  points: 12580,
  phone: '138****8888',
  createdAt: '2023-10-24'
};

const MOCK_POINTS: LYPoints = {
  userId: 'u123',
  balance: 12580,
  totalEarned: 25000,
  totalSpent: 12420,
  history: [
    { id: 't1', type: 'EARN', amount: 500, description: '每日签到奖励', createdAt: '2024-01-25 09:00' },
    { id: 't2', type: 'SPEND', amount: 2000, description: '兑换尊享礼盒', createdAt: '2024-01-24 15:30' },
    { id: 't3', type: 'EARN', amount: 15000, description: 'RWA季度分红转积分', createdAt: '2024-01-01 10:00' },
    { id: 't4', type: 'EARN', amount: 100, description: '购物积分回馈', createdAt: '2023-12-28 18:20' }
  ]
};

const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-882910',
    userId: 'u123',
    items: [{ productId: 'p1', productName: 'Love Young 传世尊享礼盒', quantity: 1, price: 2999 }],
    totalAmount: 2999,
    pointsUsed: 500,
    status: 'SHIPPED',
    shippingAddress: '上海市黄浦区南京东路888号',
    contactPhone: '138****8888',
    createdAt: '2024-01-20 14:30',
    updatedAt: '2024-01-21 10:00'
  },
  {
    id: 'ORD-881204',
    userId: 'u123',
    items: [{ productId: 'p2', productName: '元气滋补膳食组合', quantity: 2, price: 588 }],
    totalAmount: 1176,
    pointsUsed: 0,
    status: 'COMPLETED',
    shippingAddress: '上海市黄浦区南京东路888号',
    contactPhone: '138****8888',
    createdAt: '2023-12-15 11:20',
    updatedAt: '2023-12-18 16:45'
  }
];

const MOCK_PARTNER: RWAPartner = {
  id: 'rwa-001',
  userId: 'u123',
  level: 'FOUNDER',
  investmentAmount: 200000,
  shareRatio: 0.12,
  totalDividends: 24500,
  joinedAt: '2023-11-01',
  status: 'ACTIVE'
};

const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case 'PENDING': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">待付款</Badge>;
    case 'PAID': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">待发货</Badge>;
    case 'SHIPPED': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">已发货</Badge>;
    case 'COMPLETED': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">已完成</Badge>;
    case 'CANCELLED': return <Badge variant="secondary">已取消</Badge>;
    default: return null;
  }
};

const getLevelName = (level: RWALevel) => {
  const levels = { ANGEL: '天使经营人', FOUNDER: '创始经营人', STRATEGIC: '战略经营人' };
  return levels[level];
};

const MemberCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12">
        {/* Profile Hero Section */}
        <section className="mb-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8 luxury-shadow"
          >
            <Avatar className="h-24 w-24 border-4 border-secondary/20 ring-4 ring-primary/5">
              <AvatarImage src={MOCK_USER.avatar} alt={MOCK_USER.username} />
              <AvatarFallback className="bg-primary text-white text-2xl">{MOCK_USER.username[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-grow text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl font-serif text-primary">{MOCK_USER.username}</h1>
                <Badge className="gold-gradient text-white border-none">
                  {getLevelName(MOCK_PARTNER.level)}
                </Badge>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {MOCK_USER.role === 'PARTNER' ? '合伙人会员' : '普通会员'}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-4">加入时间：{MOCK_USER.createdAt}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="px-4 py-2 bg-white/50 rounded-lg border border-border/50">
                  <span className="text-xs text-muted-foreground block">当前积分</span>
                  <span className="text-xl font-bold gold-text">{MOCK_USER.points.toLocaleString()}</span>
                </div>
                <div className="px-4 py-2 bg-white/50 rounded-lg border border-border/50">
                  <span className="text-xs text-muted-foreground block">RWA权益金</span>
                  <span className="text-xl font-bold text-primary">¥{MOCK_PARTNER.investmentAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="rounded-full border-primary/20 text-primary">
                <Settings className="mr-2 h-4 w-4" /> 账号设置
              </Button>
              <Button variant="ghost" className="rounded-full text-destructive hover:bg-destructive/5">
                <LogOut className="mr-2 h-4 w-4" /> 退出
              </Button>
            </div>
          </motion.div>
        </section>

        <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
          <div className="flex justify-center mb-8">
            <TabsList className="bg-white/50 border border-border/50 p-1 h-auto rounded-full">
              <TabsTrigger value="overview" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white">
                <PieChart className="mr-2 h-4 w-4" /> 资产概览
              </TabsTrigger>
              <TabsTrigger value="orders" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Package className="mr-2 h-4 w-4" /> 我的订单
              </TabsTrigger>
              <TabsTrigger value="rwa" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white">
                <ShieldCheck className="mr-2 h-4 w-4" /> RWA计划
              </TabsTrigger>
              <TabsTrigger value="points" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Coins className="mr-2 h-4 w-4" /> 积分明细
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-secondary" /> 累计收益
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">¥{MOCK_PARTNER.totalDividends.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-2">较上月增长 +12.5%</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-secondary" /> 待办事项
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>待支付订单</span>
                      <Badge variant="outline">0</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>待收货商品</span>
                      <Badge variant="outline" className="bg-secondary/10">1</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-secondary" /> 会员特权
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-center"><ChevronRight className="h-3 w-3 mr-1 text-secondary" /> 全场商品9.5折优惠</li>
                    <li className="flex items-center"><ChevronRight className="h-3 w-3 mr-1 text-secondary" /> 专属客服1对1服务</li>
                    <li className="flex items-center"><ChevronRight className="h-3 w-3 mr-1 text-secondary" /> 品牌线下沙龙优先权</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-4">
              {MOCK_ORDERS.map((order) => (
                <Card key={order.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="bg-muted/30 px-6 py-3 flex flex-wrap justify-between items-center border-b">
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground mr-2">下单时间:</span>
                          <span className="font-medium">{order.createdAt}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground mr-2">订单编号:</span>
                          <span className="font-medium">{order.id}</span>
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="p-6">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-medium text-primary">{item.productName}</h4>
                            <p className="text-sm text-muted-foreground">数量: x{item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">¥{item.price.toLocaleString()}</div>
                            {order.pointsUsed > 0 && (
                              <div className="text-xs text-secondary">- {order.pointsUsed} 积分抵扣</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-6 py-4 bg-white flex justify-end gap-3 border-t">
                      <Button variant="outline" size="sm">查看详情</Button>
                      {order.status === 'SHIPPED' && (
                        <Button className="bg-primary text-white" size="sm">确认收货</Button>
                      )}
                      {order.status === 'COMPLETED' && (
                        <Button variant="outline" size="sm">评价分享</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rwa">
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>联合经营人计划 - {getLevelName(MOCK_PARTNER.level)}</CardTitle>
                    <CardDescription>您的投资状态与实时权益明细</CardDescription>
                  </div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                    进行中
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm mb-1">初始投入</div>
                    <div className="text-2xl font-bold text-primary">¥{MOCK_PARTNER.investmentAmount.toLocaleString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm mb-1">权益占比</div>
                    <div className="text-2xl font-bold text-primary">{(MOCK_PARTNER.shareRatio * 100).toFixed(1)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm mb-1">累计分红</div>
                    <div className="text-2xl font-bold gold-text">¥{MOCK_PARTNER.totalDividends.toLocaleString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm mb-1">加入时间</div>
                    <div className="text-2xl font-bold text-primary">{MOCK_PARTNER.joinedAt}</div>
                  </div>
                </div>

                <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
                  <h4 className="font-bold text-primary mb-4 flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" /> 下次结算预估 (2024年2月)
                  </h4>
                  <div className="flex justify-between items-center">
                    <div className="text-3xl font-serif text-primary">预计 ¥8,240.00</div>
                    <Button className="gold-gradient border-none">详情报告</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    * 结算金额基于品牌当月实际经营数据动态调整，最终以月度报告为准。
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="points">
            <PointsDisplay points={MOCK_POINTS} />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default MemberCenter;