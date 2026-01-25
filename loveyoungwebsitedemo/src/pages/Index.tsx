import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, ShieldCheck, Users, TrendingUp } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { RWAPlanCard } from '@/components/RWAPlanCard';
import { IMAGES } from '@/assets/images';
import { ROUTE_PATHS } from '@/lib/routes';
import { Product } from '@/types';

const MOCK_FEATURED_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Love Young 尊享焕颜礼盒',
    description: '汇集全球顶级滋补原料，专为现代女性定制的奢宠之选。',
    price: 1999,
    originalPrice: 2599,
    stock: 50,
    category: 'GIFT_BOX',
    images: [IMAGES.HEALTHY_FOOD_1],
    features: ['高浓度燕窝', '深海胶原蛋白', '有机草本萃取']
  },
  {
    id: 'p2',
    name: '青春定格膳食套装',
    description: '精准营养配方，由内而外激发细胞活力。',
    price: 899,
    stock: 100,
    category: 'HEALTH',
    images: [IMAGES.HEALTHY_FOOD_3],
    features: ['零糖添加', '小分子易吸收', '独立包装']
  }
];

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={IMAGES.LIFESTYLE_HERO} 
            alt="Hero" 
            className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent" />
        </div>

        <div className="container relative z-10 px-4">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl text-white"
          >
            <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight">
              重塑女性<br />
              <span className="gold-text italic">优雅生命力</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 font-light tracking-wide">
              Love Young：融合东方养生智慧与现代科技，打造高端康养与财富共赢的生态圈。
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to={ROUTE_PATHS.PRODUCTS}>
                <button className="px-8 py-4 bg-secondary text-primary font-bold rounded-full btn-luxury hover:bg-secondary/90 transition-all">
                  选购尊享礼盒
                </button>
              </Link>
              <Link to={ROUTE_PATHS.RWA_PLAN}>
                <button className="px-8 py-4 border-2 border-white/30 backdrop-blur-md text-white font-bold rounded-full hover:bg-white/10 transition-all">
                  加入经营人计划
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Brand Philosophy */}
      <section className="py-24 bg-white">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img 
                src={IMAGES.BUSINESS_WOMAN_1} 
                alt="Founder" 
                className="rounded-2xl shadow-2xl relative z-10"
              />
              <div className="absolute -bottom-6 -right-6 w-full h-full border-4 border-secondary/20 rounded-2xl -z-0" />
            </motion.div>
            
            <div className="space-y-8">
              <div className="inline-block px-4 py-1 border border-primary text-primary rounded-full text-sm font-semibold tracking-widest">
                ABOUT LOVE YOUNG
              </div>
              <h2 className="text-4xl font-serif text-primary">不仅是品牌，更是向美而生的力量</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Love Young 致力于为当代女性提供全方位的生命质量提升方案。我们坚持选用天然纯粹的原料，结合RWA数字资产技术，让每一位参与者在收获健康的同时，共享品牌成长的商业红利。
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 border-l-4 border-secondary bg-background">
                  <h4 className="font-bold text-primary">100% 天然</h4>
                  <p className="text-sm text-muted-foreground">严选全球核心产区原料</p>
                </div>
                <div className="p-4 border-l-4 border-secondary bg-background">
                  <h4 className="font-bold text-primary">RWA赋能</h4>
                  <p className="text-sm text-muted-foreground">实物资产数字化收益</p>
                </div>
              </div>
              <Link to={ROUTE_PATHS.BRAND} className="inline-flex items-center text-primary font-bold hover:gap-2 transition-all">
                了解更多品牌故事 <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-background oriental-pattern">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif text-primary mb-4">尊享礼赠 · 养生臻品</h2>
            <p className="text-muted-foreground">每一份礼盒，都是对生命的极致礼赞</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {MOCK_FEATURED_PRODUCTS.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
            <div className="flex items-center justify-center p-8 border-2 border-dashed border-primary/20 rounded-2xl">
              <Link to={ROUTE_PATHS.PRODUCTS} className="text-center group">
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                  <ArrowRight className="text-primary" />
                </div>
                <span className="text-primary font-medium">查看全部商城产品</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* RWA Teaser */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={IMAGES.RWA_CONCEPT} alt="RWA background" className="w-full h-full object-cover opacity-10 grayscale" />
        </div>
        <div className="container relative z-10 px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-serif text-primary mb-6">RWA 联合经营人计划</h2>
            <p className="text-muted-foreground text-lg">
              打破传统投资壁垒，Love Young 通过 RWA（实物资产数字化）技术，让每位会员都能参与品牌康养基地的经营，实现财富稳健增值。
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <RWAPlanCard level="ANGEL" />
            <RWAPlanCard level="FOUNDER" isRecommended />
            <RWAPlanCard level="STRATEGIC" />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-primary text-white">
        <div className="container px-4">
          <h2 className="text-3xl font-serif text-center mb-16">联合经营人见证</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-6">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-secondary text-secondary" />)}
                </div>
                <p className="text-lg italic opacity-80 leading-relaxed">
                  "作为创始经营人，我不止看到了品牌的高速成长，更在这里找到了志同道合的高质量女性社交圈。Love Young 让我实现了事业与生活的双重优雅。"
                </p>
                <div className="flex items-center gap-4">
                  <img 
                    src={IMAGES[`BUSINESS_WOMAN_${i + 3}` as keyof typeof IMAGES]} 
                    alt="user" 
                    className="w-12 h-12 rounded-full object-cover border-2 border-secondary"
                  />
                  <div>
                    <p className="font-bold">李女士</p>
                    <p className="text-xs opacity-60 uppercase tracking-widest">Founder Partner</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values / Features */}
      <section className="py-24 bg-white">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-3">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldCheck className="text-secondary w-8 h-8" />
              </div>
              <h4 className="font-serif text-primary text-xl">品质保证</h4>
              <p className="text-sm text-muted-foreground">溯源系统 全流程质检</p>
            </div>
            <div className="space-y-3">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto">
                <TrendingUp className="text-secondary w-8 h-8" />
              </div>
              <h4 className="font-serif text-primary text-xl">持续收益</h4>
              <p className="text-sm text-muted-foreground">RWA数字化 季度分红</p>
            </div>
            <div className="space-y-3">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto">
                <Users className="text-secondary w-8 h-8" />
              </div>
              <h4 className="font-serif text-primary text-xl">精英圈层</h4>
              <p className="text-sm text-muted-foreground">高端沙龙 资源对接</p>
            </div>
            <div className="space-y-3">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto">
                <Star className="text-secondary w-8 h-8" />
              </div>
              <h4 className="font-serif text-primary text-xl">管家服务</h4>
              <p className="text-sm text-muted-foreground">1对1私人 康养顾问</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;