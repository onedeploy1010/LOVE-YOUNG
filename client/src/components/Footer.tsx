import { SiWhatsapp, SiFacebook, SiInstagram } from "react-icons/si";
import { Link } from "wouter";

interface FooterProps {
  whatsappLink: string;
  metaShopLink: string;
}

export function Footer({ whatsappLink, metaShopLink }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold text-secondary">
                LOVE YOUNG
              </span>
              <span className="text-xs border-l border-primary-foreground/30 pl-2 opacity-70">养乐</span>
            </div>
            <p className="mt-4 opacity-70 max-w-md leading-relaxed" data-testid="text-footer-description">
              逆风启航，重定义女性力量。从 Young Love 到 Love Young，我们相信先爱自己，才能更好地爱这个世界。
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-foreground/10 hover-elevate"
                aria-label="WhatsApp"
                data-testid="link-footer-whatsapp"
              >
                <SiWhatsapp className="w-5 h-5" />
              </a>
              <a
                href={metaShopLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-foreground/10 hover-elevate"
                aria-label="Facebook"
                data-testid="link-footer-facebook"
              >
                <SiFacebook className="w-5 h-5" />
              </a>
              <a
                href={metaShopLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-foreground/10 hover-elevate"
                aria-label="Instagram"
                data-testid="link-footer-instagram"
              >
                <SiInstagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-secondary mb-4" data-testid="text-footer-links-title">快速链接</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#brand"
                  className="opacity-70 hover-elevate inline-block"
                  data-testid="link-footer-brand"
                >
                  品牌故事
                </a>
              </li>
              <li>
                <a
                  href="#products"
                  className="opacity-70 hover-elevate inline-block"
                  data-testid="link-footer-products"
                >
                  产品中心
                </a>
              </li>
              <li>
                <a
                  href="#rwa"
                  className="opacity-70 hover-elevate inline-block"
                  data-testid="link-footer-rwa"
                >
                  联合经营
                </a>
              </li>
              <li>
                <Link
                  href="/partner"
                  className="opacity-70 hover-elevate inline-block"
                  data-testid="link-footer-partner"
                >
                  成为经营人
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-secondary mb-4" data-testid="text-footer-contact-title">联系我们</h4>
            <ul className="space-y-3 opacity-70">
              <li className="flex items-start gap-2" data-testid="text-footer-hours">
                <span className="font-medium opacity-100">营业时间:</span>
                <span>周一至周日 9:00-21:00</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium opacity-100">WhatsApp:</span>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover-elevate inline-block"
                  data-testid="link-footer-whatsapp-number"
                >
                  点击咨询
                </a>
              </li>
              <li className="text-sm">
                <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded" data-testid="text-footer-response-time">
                  24小时内响应
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm opacity-60" data-testid="text-footer-copyright">
            © {currentYear} Love Young 养乐. 保留所有权利.
          </p>
          <p className="text-sm opacity-60" data-testid="text-footer-slogan">
            Against The Wind | 逆风启航
          </p>
        </div>
      </div>
    </footer>
  );
}
