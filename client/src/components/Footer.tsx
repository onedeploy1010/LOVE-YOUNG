import { SiWhatsapp, SiFacebook, SiInstagram } from "react-icons/si";

interface FooterProps {
  whatsappLink: string;
  metaShopLink: string;
}

export function Footer({ whatsappLink, metaShopLink }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <span className="font-serif text-2xl font-semibold text-foreground">
              LOVEYOUNG
            </span>
            <p className="mt-4 text-muted-foreground max-w-md leading-relaxed">
              精选优质燕窝与花胶，坚持传统工艺，每日鲜炖，冷链配送。为您带来纯正天然的滋补养生体验。
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="WhatsApp"
                data-testid="link-footer-whatsapp"
              >
                <SiWhatsapp className="w-5 h-5" />
              </a>
              <a
                href={metaShopLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Facebook"
                data-testid="link-footer-facebook"
              >
                <SiFacebook className="w-5 h-5" />
              </a>
              <a
                href={metaShopLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Instagram"
                data-testid="link-footer-instagram"
              >
                <SiInstagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">快速链接</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#products"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-products"
                >
                  产品系列
                </a>
              </li>
              <li>
                <a
                  href="#benefits"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-benefits"
                >
                  品牌优势
                </a>
              </li>
              <li>
                <a
                  href="#how-to-order"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-order"
                >
                  如何订购
                </a>
              </li>
              <li>
                <a
                  href="#testimonials"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-testimonials"
                >
                  客户评价
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">联系我们</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">营业时间:</span>
                <span>周一至周日 9:00-21:00</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">WhatsApp:</span>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                  data-testid="link-footer-whatsapp-number"
                >
                  点击咨询
                </a>
              </li>
              <li className="text-sm">
                <span className="text-xs bg-whatsapp/10 text-whatsapp px-2 py-1 rounded">
                  自动回复24小时内响应
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} LOVEYOUNG燕窝花胶鲜炖. 保留所有权利.
          </p>
          <p className="text-sm text-muted-foreground">
            100% 天然原料 | 每日新鲜炖煮 | 冷链安全配送
          </p>
        </div>
      </div>
    </footer>
  );
}
