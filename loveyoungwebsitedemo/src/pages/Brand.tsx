import React from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { IMAGES } from '@/assets/images';
import { Quote } from 'lucide-react';

const Brand: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Header */}
      <section className="pt-32 pb-20 bg-primary text-white text-center">
        <div className="container px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-serif mb-6"
          >
            让生命，<span className="gold-text italic">优雅生长</span>
          </motion.h1>
          <p className="max-w-2xl mx-auto text-lg opacity-80 font-light">
            Love Young 品牌诞生于对现代女性生命质量的深刻洞察。我们致力于构建一个融合健康、财富与自我实现的闭环生态系统。
          </p>
        </div>
      </section>

      {/* Brand Story */}
      <section className="py-24">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-4xl font-serif text-primary mb-8">品牌起源</h2>
              <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                <p>
                  在一个快节奏的时代，女性往往在多重角色中消耗着自我。Love Young 的创始人意识到，真正的美丽并非来自昂贵的装饰，而是源于身体内部的和谐与经济层面的独立。
                </p>
                <p>
                  我们走访全球核心产区，寻觅最纯净的自然馈赠；我们引入前沿的RWA资产管理技术，打破资本垄断。我们希望每一位女性在品味高端滋补品的同时，也能拥有一份可以持续增值的商业资产。
                </p>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <img 
                src={IMAGES.LIFESTYLE_HERO} 
                alt="Brand Vision" 
                className="rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-white">
        <div className="container px-4">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="p-10 bg-background rounded-3xl space-y-4 luxury-shadow">
              <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center text-secondary font-bold">01</div>
              <h3 className="text-2xl font-serif text-primary">品牌使命</h3>
              <p className="text-muted-foreground">赋能女性自我关爱，通过高端康养方案与资产增值计划，实现身心与财富的双重自由。</p>
            </div>
            <div className="p-10 bg-primary text-white rounded-3xl space-y-4 shadow-xl transform scale-105">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-secondary font-bold">02</div>
              <h3 className="text-2xl font-serif gold-text">核心愿景</h3>
              <p className="opacity-80">打造全球领先的数字化康养生活平台，让每一位合作伙伴都能成为品牌价值的共同体。</p>
            </div>
            <div className="p-10 bg-background rounded-3xl space-y-4 luxury-shadow">
              <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center text-secondary font-bold">03</div>
              <h3 className="text-2xl font-serif text-primary">价值观</h3>
              <p className="text-muted-foreground">真诚、共赢、极致、向善。我们坚持以长期主义的眼光，打磨每一款产品，服务每一位用户。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Quote */}
      <section className="py-24 relative">
        <div className="container px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <Quote className="w-16 h-16 text-secondary/20 mx-auto mb-8" />
            <h2 className="text-3xl md:text-4xl font-serif text-primary italic leading-relaxed mb-12">
              "我们不只是在售卖礼盒，我们是在重新定义现代女性的生活方式。Love Young 是一个平台，让美变得有厚度，让事业变得有温度。"
            </h2>
            <div className="flex flex-col items-center">
              <img 
                src={IMAGES.BUSINESS_WOMAN_2} 
                alt="Founder" 
                className="w-24 h-24 rounded-full object-cover border-4 border-secondary mb-4 shadow-lg"
              />
              <h4 className="text-xl font-bold text-primary">Love Young 创始人</h4>
              <p className="text-secondary tracking-widest uppercase text-sm">Visionary & Founder</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gala Event Showcase */}
      <section className="py-24 bg-background">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif text-primary mb-4">精英社交圈</h2>
            <p className="text-muted-foreground">连接全球影响力，共享高端生活美学</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <img src={IMAGES.GALA_EVENT} alt="Gala" className="h-64 w-full object-cover rounded-xl" />
            <img src={IMAGES.NETWORKING_EVENT_1} alt="Gala" className="h-64 w-full object-cover rounded-xl" />
            <img src={IMAGES.NETWORKING_EVENT_3} alt="Gala" className="h-64 w-full object-cover rounded-xl" />
            <img src={IMAGES.NETWORKING_EVENT_5} alt="Gala" className="h-64 w-full object-cover rounded-xl" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Brand;