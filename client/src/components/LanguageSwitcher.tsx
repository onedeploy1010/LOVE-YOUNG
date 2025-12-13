import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useLanguage, type Language, languageLabels } from "@/lib/i18n";

const languages: { value: Language; label: string; flag: string }[] = [
  { value: "zh", label: "中文", flag: "CN" },
  { value: "en", label: "English", flag: "EN" },
  { value: "ms", label: "Bahasa Melayu", flag: "MY" },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 px-2"
          data-testid="button-language-switcher"
        >
          <Globe className="w-4 h-4" />
          <span className="text-xs font-medium">{languageLabels[language]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => setLanguage(lang.value)}
            className={language === lang.value ? "bg-accent" : ""}
            data-testid={`menu-language-${lang.value}`}
          >
            <span className="mr-2 text-xs font-bold text-muted-foreground">{lang.flag}</span>
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
