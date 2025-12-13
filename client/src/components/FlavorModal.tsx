import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Baby, Users, Sparkles, Heart, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface FlavorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const flavors = [
  { key: "original", nameKey: "flavors.original", descKey: "flavors.originalDesc" },
  { key: "redDate", nameKey: "flavors.redDate", descKey: "flavors.redDateDesc" },
  { key: "snowPear", nameKey: "flavors.snowPear", descKey: "flavors.snowPearDesc" },
  { key: "peachGum", nameKey: "flavors.peachGum", descKey: "flavors.peachGumDesc" },
  { key: "coconut", nameKey: "flavors.coconut", descKey: "flavors.coconutDesc" },
  { key: "mango", nameKey: "flavors.mango", descKey: "flavors.mangoDesc" },
  { key: "fishMawOriginal", nameKey: "flavors.fishMawOriginal", descKey: "flavors.fishMawOriginalDesc" },
  { key: "fishMawRedDate", nameKey: "flavors.fishMawRedDate", descKey: "flavors.fishMawRedDateDesc" },
];

interface TargetAudience {
  key: string;
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  flavorsKey: string;
}

const targets: TargetAudience[] = [
  { key: "pregnant", icon: Baby, titleKey: "target.pregnant", descKey: "target.pregnantDesc", flavorsKey: "target.pregnantFlavors" },
  { key: "children", icon: Users, titleKey: "target.children", descKey: "target.childrenDesc", flavorsKey: "target.childrenFlavors" },
  { key: "beauty", icon: Sparkles, titleKey: "target.beauty", descKey: "target.beautyDesc", flavorsKey: "target.beautyFlavors" },
  { key: "health", icon: Heart, titleKey: "target.health", descKey: "target.healthDesc", flavorsKey: "target.healthFlavors" },
];

export function FlavorModal({ open, onOpenChange }: FlavorModalProps) {
  const { t } = useLanguage();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-hidden" data-testid="modal-flavor">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl font-bold" data-testid="text-modal-title">
            {t("flavors.modalTitle")}
          </SheetTitle>
        </SheetHeader>
        
        <Tabs defaultValue="flavors" className="h-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="flavors" data-testid="tab-flavors">
              {t("flavors.modalTitle")}
            </TabsTrigger>
            <TabsTrigger value="recommendations" data-testid="tab-recommendations">
              {t("flavors.recommended")}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="flavors" className="overflow-y-auto max-h-[calc(85vh-140px)] pb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {flavors.map((flavor, index) => (
                <Card
                  key={flavor.key}
                  className="p-4 hover-elevate"
                  data-testid={`card-flavor-${flavor.key}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground mb-1" data-testid={`text-flavor-name-${flavor.key}`}>
                        {t(flavor.nameKey)}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-flavor-desc-${flavor.key}`}>
                        {t(flavor.descKey)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="recommendations" className="overflow-y-auto max-h-[calc(85vh-140px)] pb-8">
            <div className="mb-4">
              <h3 className="font-semibold text-foreground mb-1">
                {t("flavors.targetAudience")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("flavors.recommended")}
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {targets.map((target) => {
                const IconComponent = target.icon;
                return (
                  <Card
                    key={target.key}
                    className="p-4 hover-elevate"
                    data-testid={`card-target-${target.key}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-500/10 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground mb-1" data-testid={`text-target-name-${target.key}`}>
                          {t(target.titleKey)}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2" data-testid={`text-target-desc-${target.key}`}>
                          {t(target.descKey)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {t(target.flavorsKey).split("、").map((flavor, idx) => (
                            <Badge 
                              key={idx} 
                              variant="secondary" 
                              className="text-xs"
                              data-testid={`badge-target-flavor-${target.key}-${idx}`}
                            >
                              {flavor.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
