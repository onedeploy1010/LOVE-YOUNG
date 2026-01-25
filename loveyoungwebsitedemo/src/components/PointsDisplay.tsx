import React from 'react';
import { motion } from 'framer-motion';
import { Coins, History, TrendingUp, Info, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';
import { LYPoints, LYPointsTransaction } from '@/types/index';
import { POINTS_CONFIG } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PointsDisplayProps {
  points: LYPoints;
}

export function PointsDisplay({ points }: PointsDisplayProps) {
  const { balance, totalEarned, totalSpent, history } = points;

  // Calculate a hypothetical progress to a next milestone (e.g., every 5000 points)
  const milestone = 5000;
  const currentProgress = (balance % milestone) / milestone * 100;

  const getTransactionIcon = (type: LYPointsTransaction['type']) => {
    switch (type) {
      case 'EARN': return <ArrowUpRight className="w-4 h-4 text-emerald-500" />;
      case 'SPEND': return <ArrowDownRight className="w-4 h-4 text-rose-500" />;
      case 'REFUND': return <RefreshCcw className="w-4 h-4 text-blue-500" />;
      default: return <Coins className="w-4 h-4 text-secondary" />;
    }
  };

  const getTransactionColor = (type: LYPointsTransaction['type']) => {
    switch (type) {
      case 'EARN': return 'text-emerald-600';
      case 'SPEND': return 'text-rose-600';
      case 'REFUND': return 'text-blue-600';
      default: return 'text-foreground';
    }
  };

  const getTransactionPrefix = (type: LYPointsTransaction['type']) => {
    return type === 'SPEND' ? '-' : '+';
  };

  return (
    <div className="grid gap-6 md:grid-cols-12">
      {/* Main Points Dashboard */}
      <Card className="md:col-span-8 overflow-hidden border-none luxury-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Coins className="w-5 h-5 text-secondary" />
            会员积分资产
          </CardTitle>
          <CardDescription>管理您的 Love Young 专属会员积分</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">可用积分余额</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-serif font-bold gold-text">{balance.toLocaleString()}</span>
                <span className="text-muted-foreground">LYP</span>
              </div>
            </div>
            
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground">距离下一等级奖励</span>
                <span className="font-medium">{Math.floor(currentProgress)}%</span>
              </div>
              <Progress value={currentProgress} className="h-2 bg-secondary/20" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-50">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">累计获得积分</p>
                <p className="font-bold">{totalEarned.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-rose-50">
                <ArrowDownRight className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">累计已用积分</p>
                <p className="font-bold">{totalSpent.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points Rules Info */}
      <Card className="md:col-span-4 border-none luxury-shadow bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-secondary">
            <Info className="w-5 h-5" />
            积分使用规则
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm opacity-90">
            <div className="flex justify-between items-center">
              <span>消费获取率</span>
              <span className="font-medium">1 RMB = {POINTS_CONFIG.EARN_RATE} 积分</span>
            </div>
            <div className="flex justify-between items-center">
              <span>抵扣比例</span>
              <span className="font-medium">{POINTS_CONFIG.REDEMPTION_RATE} 积分 = 1 RMB</span>
            </div>
            <div className="flex justify-between items-center">
              <span>最高抵扣</span>
              <span className="font-medium">订单总额 {POINTS_CONFIG.MAX_POINTS_OFFSET_RATIO * 100}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>每日签到</span>
              <span className="font-medium">+{POINTS_CONFIG.SIGN_IN_POINTS} 积分</span>
            </div>
          </div>
          <div className="mt-6 p-3 rounded-lg bg-white/10 border border-white/20 text-xs leading-relaxed">
            温馨提示：积分自获取之日起，有效期为12个月。请在有效期内尽快使用。
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="md:col-span-12 border-none luxury-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            积分明细记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {history.length > 0 ? (
              history.map((tx, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={tx.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors border-b last:border-0 border-border/40"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-background rounded-full border border-border">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className={cn("font-bold", getTransactionColor(tx.type))}>
                    {getTransactionPrefix(tx.type)}{tx.amount.toLocaleString()}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <p>暂无积分变动记录</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
