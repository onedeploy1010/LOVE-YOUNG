import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTE_PATHS } from '@/lib/routes';
import routes from '@/lib/routes';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Info */}
          <div className="space-y-6">
            <h3 className="text-2xl font-serif font-bold gold-text">
              Love Young
            </h3>
            <p className="text-primary-foreground/70 leading-relaxed">
              Love Young 致力于打造高品质生活方式，通过联合经营人模式与优质康养产品，为精英人士提供身心健康与财富增值的双重保障。
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-secondary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-secondary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-secondary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-secondary transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">快速链接</h4>
            <ul className="space-y-4">
              {routes.map((route) => (
                <li key={route.path}>
                  <Link
                    to={route.path}
                    className="text-primary-foreground/70 hover:text-secondary transition-colors"
                  >
                    {route.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to={ROUTE_PATHS.REGISTER} className="text-primary-foreground/70 hover:text-secondary transition-colors">
                  加入我们
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">核心服务</h4>
            <ul className="space-y-4">
              <li className="text-primary-foreground/70 hover:text-secondary cursor-pointer">RWA 联合经营计划</li>
              <li className="text-primary-foreground/70 hover:text-secondary cursor-pointer">尊享礼盒定制</li>
              <li className="text-primary-foreground/70 hover:text-secondary cursor-pointer">全球康养基地</li>
              <li className="text-primary-foreground/70 hover:text-secondary cursor-pointer">会员权益中心</li>
              <li className="text-primary-foreground/70 hover:text-secondary cursor-pointer">私人管家服务</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">联系我们</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-secondary shrink-0 mt-1" />
                <span className="text-primary-foreground/70">
                  上海市静安区南京西路 1266 号恒隆广场
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-secondary shrink-0" />
                <span className="text-primary-foreground/70">400-820-XXXX</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-secondary shrink-0" />
                <span className="text-primary-foreground/70">contact@loveyoung.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/50 text-sm">
            © {currentYear} Love Young 品牌管理（上海）有限公司. 版权所有
          </p>
          <div className="flex gap-6 text-sm text-primary-foreground/50">
            <a href="#" className="hover:text-secondary transition-colors">隐私政策</a>
            <a href="#" className="hover:text-secondary transition-colors">服务条款</a>
            <a href="#" className="hover:text-secondary transition-colors">沪ICP备XXXXXXXX号</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
