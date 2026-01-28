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

// 12种口味 for 2026发财礼盒
const flavors = [
  { key: "original", nameCn: "原味燕窝", nameEn: "Original Bird Nest", descCn: "经典原味，燕窝本真滋味", descEn: "Classic original flavor, pure bird nest taste" },
  { key: "redDate", nameCn: "红枣燕窝", nameEn: "Red Date Bird Nest", descCn: "红枣养血，温补气血", descEn: "Red date nourishes blood, warming and replenishing" },
  { key: "snowPear", nameCn: "雪梨燕窝", nameEn: "Snow Pear Bird Nest", descCn: "雪梨润肺，清润甘甜", descEn: "Snow pear moistens lungs, refreshing and sweet" },
  { key: "peachGum", nameCn: "桃胶燕窝", nameEn: "Peach Gum Bird Nest", descCn: "桃胶美颜，胶原满满", descEn: "Peach gum for beauty, rich in collagen" },
  { key: "coconut", nameCn: "椰子燕窝", nameEn: "Coconut Bird Nest", descCn: "椰香四溢，热带风情", descEn: "Aromatic coconut, tropical flavor" },
  { key: "mango", nameCn: "芒果燕窝", nameEn: "Mango Bird Nest", descCn: "芒果香甜，热带鲜果", descEn: "Sweet mango, tropical fresh fruit" },
  { key: "cocoaOat", nameCn: "可可燕麦燕窝", nameEn: "Cocoa Oat Bird Nest", descCn: "可可燕麦，浓郁丝滑", descEn: "Cocoa oat, rich and silky" },
  { key: "matchaOat", nameCn: "抹茶燕麦燕窝", nameEn: "Matcha Oat Bird Nest", descCn: "抹茶清香，健康养生", descEn: "Matcha fragrance, healthy and nourishing" },
  { key: "purpleRiceOat", nameCn: "紫米燕麦燕窝", nameEn: "Purple Rice Oat Bird Nest", descCn: "紫米营养，谷物健康", descEn: "Purple rice nutrition, grain health" },
  { key: "peachGumLongan", nameCn: "桃胶桂圆燕窝", nameEn: "Peach Gum Longan Bird Nest", descCn: "桃胶桂圆，养颜安神", descEn: "Peach gum longan, beauty and calming" },
  { key: "dateGoji", nameCn: "枣杞燕窝", nameEn: "Date Goji Bird Nest", descCn: "红枣枸杞，补血明目", descEn: "Red date goji, blood nourishing and eye brightening" },
  { key: "papaya", nameCn: "木瓜燕窝", nameEn: "Papaya Bird Nest", descCn: "木瓜丰胸，美容养颜", descEn: "Papaya for beauty and skincare" },
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
                        {flavor.nameCn}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-1">{flavor.nameEn}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-flavor-desc-${flavor.key}`}>
                        {flavor.descCn}
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
