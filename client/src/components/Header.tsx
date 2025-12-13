import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ShoppingBag } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";

interface HeaderProps {
  whatsappLink: string;
  metaShopLink: string;
}

export function Header({ whatsappLink, metaShopLink }: HeaderProps) {
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "#products", label: t("nav.products") },
    { href: "#innovation", label: t("nav.benefits") },
    { href: "#how-to-order", label: t("nav.howToOrder") },
    { href: "#testimonials", label: t("nav.testimonials") },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border"
          : "bg-transparent"
      }`}
      data-testid="header"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          <a
            href="/"
            className="flex items-center gap-2"
            data-testid="link-logo"
          >
            <span className="font-serif text-xl md:text-2xl font-semibold tracking-tight text-foreground">
              LOVEYOUNG
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`link-nav-${link.href.replace("#", "")}`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Button
              variant="outline"
              size="default"
              className="gap-2"
              onClick={() => window.open(whatsappLink, "_blank")}
              data-testid="button-header-whatsapp"
            >
              <SiWhatsapp className="w-4 h-4" />
              <span className="hidden lg:inline">{t("header.whatsapp")}</span>
            </Button>
            <Button
              size="default"
              className="gap-2"
              onClick={() => window.open(metaShopLink, "_blank")}
              data-testid="button-header-meta-shop"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden lg:inline">{t("header.shop")}</span>
            </Button>
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                data-testid="button-mobile-menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-6">
              <div className="flex flex-col gap-6 mt-8">
                <span className="font-serif text-xl font-semibold">
                  LOVEYOUNG
                </span>
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <button
                      key={link.href}
                      onClick={() => scrollToSection(link.href)}
                      className="text-left text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                      data-testid={`link-mobile-${link.href.replace("#", "")}`}
                    >
                      {link.label}
                    </button>
                  ))}
                </nav>
                <div className="flex flex-col gap-3 pt-4 border-t border-border">
                  <div className="flex justify-center pb-2">
                    <LanguageSwitcher />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-2 justify-center"
                    onClick={() => window.open(whatsappLink, "_blank")}
                    data-testid="button-mobile-whatsapp"
                  >
                    <SiWhatsapp className="w-4 h-4" />
                    {t("header.whatsapp")}
                  </Button>
                  <Button
                    className="w-full gap-2 justify-center"
                    onClick={() => window.open(metaShopLink, "_blank")}
                    data-testid="button-mobile-meta-shop"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {t("header.shop")}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
