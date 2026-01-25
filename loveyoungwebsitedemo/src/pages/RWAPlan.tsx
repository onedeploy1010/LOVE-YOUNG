import React from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RWAPlanCard } from '@/components/RWAPlanCard';
import { RWA_CONFIG } from '@/lib/constants';
import { IMAGES } from '@/assets/images';
import { 
  Globe, 
  ShieldCheck, 
  Zap, 
  LineChart, 
  Building2, 
  Lock 
} from 'lucide-react';

const RWAPlan: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/5 -skew-x-12 transform translate-x-1/4 -z-10" />
        <div className="container px-4">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-6xl font-serif text-primary mb-6 leading-tight">
                让实物资产<br />
                在数字时代<span className="gold-text">共创价值</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Love Young RWA（Real World Assets）联合经营人计划，将品牌旗下的高端康养基地、全球供应链实物资产进行数字化锚定，让每位会员都能深度参与品牌经营，共享时代红利。
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="px-8 py-4 bg-primary text-white font-bold rounded-xl btn-luxury">
                  立即申请加入
                </button>
                <button className="px-8 py-4 border border-primary/20 text-primary font-bold rounded-xl hover:bg-primary/5">
                  下载计划白皮书
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Concepts */}
      <section className="py-24 bg-white">
        <div className="container px-4">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center">
                <Building2 className="text-secondary w-7 h-7" />
              </div>
              <h3 className="text-2xl font-serif text-primary">底层资产透明</h3>
              <p className="text-muted-foreground">每一份数字化经营权都锚定真实的康养基地房产、高端滋补品库存等实物资产。</p>
            </div>
            <div className="space-y-4">
              <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center">
                <Lock className="text-secondary w-7 h-7" />
              </div>
              <h3 className="text-2xl font-serif text-primary">技术确权保障</h3>
              <p className="text-muted-foreground">基于区块链技术进行收益确权，数据不可篡改，结算透明高效。</p>
            </div>
            <div className="space-y-4">
              <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center">
                <Globe className="text-secondary w-7 h-7" />
              </div>
              <h3 className="text-2xl font-serif text-primary">全球化流转</h3>
              <p className="text-muted-foreground">打破地域限制，参与全球高端康养产业链的布局与分红。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tiers Section */}
      <section className="py-24 bg-background">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif text-primary mb-4">经营人级别及权益</h2>
            <p className="text-muted-foreground">根据您的布局需求，选择最适合的共创方案</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {RWA_CONFIG.STAGES.map((stage) => (
              <RWAPlanCard 
                key={stage.level} 
                level={stage.level as any} 
                isRecommended={stage.level === 'FOUNDER'} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* ROI Analysis */}
      <section className="py-24 bg-primary text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <img src={IMAGES.RWA_CONCEPT} alt="RWA" className="w-full h-full object-cover" />
        </div>
        <div className="container relative z-10 px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-serif mb-8">多元化收益模型</h2>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full border border-secondary flex items-center justify-center text-secondary">
                    <Zap />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">即时消费返利</h4>
                    <p className="opacity-70">自购产品享受经营人专属折扣，分享销售获得高额积分返还。</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full border border-secondary flex items-center justify-center text-secondary">
                    <LineChart />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">资产月度分红</h4>
                    <p className="opacity-70">根据持有资产包份额，每月结算品牌全球经营利润分红。</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full border border-secondary flex items-center justify-center text-secondary">
                    <ShieldCheck />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">股权增值预期</h4>
                    <p className="opacity-70">战略经营人拥有优先转股权，享受品牌资本市场上市溢价收益。</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20">
              <h3 className="text-2xl font-serif gold-text mb-6">收益试算 (以创始人级别为例)</h3>
              <div className="space-y-4">
                <div className="flex justify-between pb-4 border-b border-white/10">
                  <span>初始投入</span>
                  <span className="font-bold">¥200,000</span>
                </div>
                <div className="flex justify-between pb-4 border-b border-white/10">
                  <span>年度预期分红率</span>
                  <span className="text-secondary font-bold text-xl">12% - 18%</span>
                </div>
                <div className="flex justify-between pb-4 border-b border-white/10">
                  <span>专属礼包价值</span>
                  <span className="font-bold">¥25,000</span>
                </div>
                <div className="flex justify-between">
                  <span>综合年化预期回报</span>
                  <span className="text-secondary font-bold text-xl">~25%</span>
                </div>
              </div>
              <button className="w-full mt-8 py-4 bg-secondary text-primary font-bold rounded-xl hover:shadow-lg transition-all">
                咨询资深康养管家
              </button>
              <p className="text-center mt-4 text-xs opacity-50">* 以上数据仅为基于历史经营状况的预测，不构成收益承诺</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gala Call to Action */}
      <section className="py-24">
        <div className="container px-4">
          <div className="relative rounded-3xl overflow-hidden">
            <img src={IMAGES.GALA_EVENT} alt="Gala" className="w-full h-[400px] object-cover brightness-50" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-8">
              <h2 className="text-3xl md:text-5xl font-serif mb-6">开启您的优雅商业新篇章</h2>
              <p className="max-w-xl mx-auto text-lg mb-8 opacity-90">
                加入 Love Young 联合经营人计划，不仅是资产的配置，更是圈层的进阶。下一场品牌全球私享沙龙，期待您的身影。
              </p>
              <button className="px-12 py-4 bg-white text-primary font-bold rounded-full hover:bg-secondary hover:text-primary transition-all">
                申请线下考察
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RWAPlan;