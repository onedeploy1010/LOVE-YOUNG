import { SiWhatsapp, SiFacebook, SiInstagram } from "react-icons/si";
import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";

interface FooterProps {
  whatsappLink: string;
  metaShopLink: string;
}

export function Footer({ whatsappLink, metaShopLink }: FooterProps) {
  const { t } = useLanguage();
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
              <span className="text-xs border-l border-primary-foreground/30 pl-2 opacity-70">{t("footer.brandName")}</span>
            </div>
            <p className="mt-4 opacity-70 max-w-md leading-relaxed" data-testid="text-footer-description">
              {t("footer.description")}
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
            <h4 className="font-semibold text-secondary mb-4" data-testid="text-footer-links-title">{t("footer.quickLinks")}</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/brand"
                  className="opacity-70 hover-elevate inline-block"
                  data-testid="link-footer-brand"
                >
                  {t("nav.brand")}
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="opacity-70 hover-elevate inline-block"
                  data-testid="link-footer-products"
                >
                  {t("nav.products")}
                </Link>
              </li>
              <li>
                <Link
                  href="/partner"
                  className="opacity-70 hover-elevate inline-block"
                  data-testid="link-footer-rwa"
                >
                  {t("nav.partner")}
                </Link>
              </li>
              <li>
                <Link
                  href="/member"
                  className="opacity-70 hover-elevate inline-block"
                  data-testid="link-footer-member"
                >
                  {t("nav.member")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-secondary mb-4" data-testid="text-footer-contact-title">{t("footer.contactUs")}</h4>
            <ul className="space-y-3 opacity-70">
              <li className="flex items-start gap-2" data-testid="text-footer-hours">
                <span className="font-medium opacity-100">{t("footer.businessHours")}:</span>
                <span>{t("footer.hoursValue")}</span>
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
                  {t("footer.clickToChat")}
                </a>
              </li>
              <li className="text-sm">
                <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded" data-testid="text-footer-response-time">
                  {t("footer.responseTime")}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm opacity-60" data-testid="text-footer-copyright">
            © {currentYear} Love Young. {t("footer.allRightsReserved")}
          </p>
          <p className="text-sm opacity-60" data-testid="text-footer-slogan">
            {t("footer.slogan")}
          </p>
        </div>
      </div>
    </footer>
  );
}
