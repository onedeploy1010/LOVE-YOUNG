import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { Product } from '@/types';
import { PRODUCT_CONFIG } from '@/lib/constants';
import { IMAGES } from '@/assets/images';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Love Young 尊享焕颜礼盒',
    description: '顶级燕窝与胶原蛋白的完美结合，由内而外焕发青春。',
    price: 1999,
    originalPrice: 2599,
    stock: 50,
    category: 'GIFT_BOX',
    images: [IMAGES.HEALTHY_FOOD_1],
    features: ['高浓度燕窝', '深海胶原', '免洗炖煮']
  },
  {
    id: '2',
    name: '每日活力膳食包',
    description: '全营养配方，平衡都市忙碌生活带来的身体负担。',
    price: 299,
    stock: 200,
    category: 'HEALTH',
    images: [IMAGES.HEALTHY_FOOD_2],
    features: ['全谷物提取', '0添加', '独立便携']
  },
  {
    id: '3',
    name: '智能康养监测手环',
    description: 'Love Young 联名款，实时同步康养顾问数据。',
    price: 599,
    stock: 80,
    category: 'LIFESTYLE',
    images: [IMAGES.WELLNESS_LIFESTYLE_1],
    features: ['血氧监测', '心率追踪', '云端专家诊断']
  },
  {
    id: '4',
    name: '四季养生膳食礼盒',
    description: '遵循春生、夏长、秋收、冬藏的节律定制营养。',
    price: 1299,
    stock: 30,
    category: 'GIFT_BOX',
    images: [IMAGES.HEALTHY_FOOD_5],
    features: ['时令食材', '古法炮制', '精致包装']
  },
  {
    id: '5',
    name: '高活性益生菌粉',
    description: '针对肠道微生态，提升免疫力的秘密武器。',
    price: 459,
    stock: 150,
    category: 'HEALTH',
    images: [IMAGES.HEALTHY_FOOD_7],
    features: ['百亿活菌', '耐酸包裹技术', '清爽口感']
  },
  {
    id: '6',
    name: '定制化瑜伽套装',
    description: 'Love Young 环保系列，透气舒适的运动美学。',
    price: 688,
    stock: 45,
    category: 'LIFESTYLE',
    images: [IMAGES.LIFESTYLE_HERO],
    features: ['环保材质', '人体工学设计', '吸湿排汗']
  }
];

const Products: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'priceAsc' | 'priceDesc'>('default');

  const filteredProducts = useMemo(() => {
    let result = MOCK_PRODUCTS.filter(p => {
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (sortBy === 'priceAsc') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'priceDesc') result.sort((a, b) => b.price - a.price);

    return result;
  }, [selectedCategory, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-32 pb-24 container px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-serif text-primary mb-2">礼盒商城</h1>
            <p className="text-muted-foreground">为您甄选每一份来自大自然的健康馈赠</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="搜索产品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-secondary/50"
            />
          </div>
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-8 border-b border-border">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setSelectedCategory('ALL')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === 'ALL' ? 'bg-primary text-white' : 'bg-white text-primary border border-primary/20 hover:bg-primary/5'
              }`}
            >
              全部产品
            </button>
            {PRODUCT_CONFIG.CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.id ? 'bg-primary text-white' : 'bg-white text-primary border border-primary/20 hover:bg-primary/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-sm">
                <SlidersHorizontal className="w-4 h-4" />
                <span>排序方式</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-border shadow-xl rounded-xl overflow-hidden hidden group-hover:block z-50">
                <button onClick={() => setSortBy('default')} className="w-full px-4 py-2 text-left text-sm hover:bg-secondary/10">默认排序</button>
                <button onClick={() => setSortBy('priceAsc')} className="w-full px-4 py-2 text-left text-sm hover:bg-secondary/10">价格由低到高</button>
                <button onClick={() => setSortBy('priceDesc')} className="w-full px-4 py-2 text-left text-sm hover:bg-secondary/10">价格由高到低</button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <motion.div 
            layout
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence>
              {filteredProducts.map(product => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="py-32 text-center">
            <p className="text-muted-foreground text-lg">未找到符合条件的产品</p>
            <button 
              onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); }}
              className="mt-4 text-primary font-bold underline"
            >
              清除所有筛选
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Products;