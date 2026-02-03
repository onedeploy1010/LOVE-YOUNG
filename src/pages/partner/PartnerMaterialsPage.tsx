import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberLayout } from "@/components/MemberLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import {
  Share2, Download, Copy, Image, FileText, Video,
  ExternalLink, QrCode, Smartphone, CheckCircle, Loader2
} from "lucide-react";
import { useState } from "react";

const getMaterials = (t: (key: string) => string) => ({
  images: [
    { id: 1, title: t("member.materials.productPoster"), thumbnail: "/pics/love_young_brand_identity_20260106043554_1.png", size: "1080x1920" },
    { id: 2, title: t("member.materials.brandStory"), thumbnail: "/pics/love_young_founders_story_20260106043351_1.png", size: "1200x630" },
    { id: 3, title: t("member.materials.recruitPoster"), thumbnail: "/pics/love_young_digital_marketing_20260106043418_1.png", size: "1080x1920" },
    { id: 4, title: t("member.materials.holidayPromo"), thumbnail: "/pics/love_young_community_impact_20260106043528_1.png", size: "1080x1080" },
  ],
  documents: [
    { id: 1, title: t("member.materials.productManual"), type: "PDF", size: "2.5 MB" },
    { id: 2, title: t("member.materials.trainingMaterial"), type: "PDF", size: "5.2 MB" },
    { id: 3, title: t("member.materials.faqDocument"), type: "PDF", size: "1.1 MB" },
    { id: 4, title: t("member.materials.brandPpt"), type: "PPTX", size: "8.7 MB" },
  ],
  videos: [
    { id: 1, title: t("member.materials.brandVideo"), duration: "2:30", thumbnail: "/pics/love_young_brand_identity_20260106043554_1.png" },
    { id: 2, title: t("member.materials.productProcess"), duration: "5:15", thumbnail: "/pics/craftsmanship_journey.webp" },
    { id: 3, title: t("member.materials.successStory"), duration: "3:45", thumbnail: "/pics/partner_story_1.webp" },
  ]
});

export default function PartnerMaterialsPage() {
  const { t } = useTranslation();
  const materials = getMaterials(t);
  const { member, loading } = useAuth();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const referralCode = member?.referralCode || "";
  const referralLink = referralCode
    ? `${window.location.origin}/auth/login?ref=${referralCode}`
    : "";

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: t("member.materials.copiedToClipboard") });
    } catch {
      toast({ title: t("member.materials.copyFailed"), variant: "destructive" });
    }
  };

  const shareToWhatsApp = () => {
    const text = `${t("member.materials.shareText").replace("{code}", referralCode)}\n${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, "_blank");
  };

  if (!member) {
    // Still loading auth data — show spinner
    if (loading) {
      return (
        <MemberLayout>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </MemberLayout>
      );
    }
    // Auth loaded but no member record — prompt to purchase
    return (
      <MemberLayout>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <Share2 className="w-16 h-16 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("member.materials.notMember")}</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {t("member.materials.notMemberDesc")}
          </p>
          <a href="/#products">
            <Button>{t("member.materials.goShopping")}</Button>
          </a>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-primary" data-testid="text-materials-title">{t("member.materials.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("member.materials.subtitle")}</p>
        </div>

      {/* Referral Link Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-16 sm:h-16 rounded-xl bg-background flex items-center justify-center border-2 border-dashed border-primary/30 shrink-0">
                <QrCode className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg">{t("member.materials.myReferralLink")}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  {t("member.materials.referralCodeLabel")}: <span className="font-mono font-bold text-primary">{referralCode}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 md:flex-none h-8 sm:h-9 px-2 sm:px-3"
                onClick={() => copyToClipboard(referralCode, t("member.materials.referralCodeLabel"))}
                data-testid="button-copy-code"
              >
                <Copy className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" />
                <span className="text-[10px] sm:text-sm truncate">{t("member.materials.copyReferralCode")}</span>
              </Button>
              <Button
                size="sm"
                className="flex-1 md:flex-none h-8 sm:h-9 px-2 sm:px-3 bg-green-500 hover:bg-green-600"
                onClick={shareToWhatsApp}
                data-testid="button-share-whatsapp"
              >
                <Share2 className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" />
                <span className="text-[10px] sm:text-sm truncate">{t("member.materials.shareWhatsApp")}</span>
              </Button>
            </div>
          </div>

          <div>
            <p className="text-[10px] sm:text-sm text-muted-foreground mb-1">{t("member.materials.referralLinkLabel")}</p>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Input
                value={referralLink}
                readOnly
                className="font-mono text-[10px] sm:text-sm bg-background h-8 sm:h-9"
                data-testid="input-referral-link"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
                onClick={() => copyToClipboard(referralLink, t("member.materials.referralLinkLabel"))}
                data-testid="button-copy-link"
              >
                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="images" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="images" className="gap-1.5 text-xs sm:text-sm" data-testid="tab-images">
            <Image className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {t("member.materials.tabs.images")}
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5 text-xs sm:text-sm" data-testid="tab-documents">
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {t("member.materials.tabs.documents")}
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-1.5 text-xs sm:text-sm" data-testid="tab-videos">
            <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {t("member.materials.tabs.videos")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="images">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {materials.images.map((item) => (
              <Card key={item.id} className="overflow-hidden" data-testid={`card-image-${item.id}`}>
                <div className="aspect-[3/4] sm:aspect-[9/16] bg-muted overflow-hidden">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-2.5 sm:p-4">
                  <h4 className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1 truncate">{item.title}</h4>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">{item.size}</p>
                  <div className="flex gap-1.5 sm:gap-2">
                    <Button variant="outline" size="sm" className="flex-1 h-7 sm:h-9 text-[10px] sm:text-xs px-1.5 sm:px-3">
                      <Download className="w-3 h-3 mr-0.5 sm:mr-1 shrink-0" />
                      <span className="truncate">{t("member.materials.download")}</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-7 sm:h-9 text-[10px] sm:text-xs px-1.5 sm:px-3"
                      onClick={() => {
                        const text = `${t("member.materials.itemShareText").replace("{title}", item.title).replace("{code}", referralCode)}\n${referralLink}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                      }}
                    >
                      <Share2 className="w-3 h-3 mr-0.5 sm:mr-1 shrink-0" />
                      <span className="truncate">{t("member.materials.share")}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="space-y-2 sm:space-y-0">
            {materials.documents.map((doc) => (
              <Card key={doc.id} data-testid={`card-document-${doc.id}`} className="sm:rounded-none sm:border-x-0 sm:border-t-0 sm:shadow-none sm:last:border-b-0">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2.5 sm:gap-4 mb-2 sm:mb-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-base truncate">{doc.title}</p>
                      <p className="text-[10px] sm:text-sm text-muted-foreground">{doc.type} · {doc.size}</p>
                    </div>
                    {/* Desktop: inline buttons */}
                    <div className="hidden sm:flex gap-1.5 shrink-0">
                      <Button variant="outline" size="sm" className="h-9 px-3">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        {t("member.materials.preview")}
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 px-3">
                        <Download className="w-4 h-4 mr-1" />
                        {t("member.materials.download")}
                      </Button>
                    </div>
                  </div>
                  {/* Mobile: full-width buttons */}
                  <div className="flex gap-2 sm:hidden">
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px]">
                      <ExternalLink className="w-3 h-3 mr-1 shrink-0" />
                      {t("member.materials.preview")}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px]">
                      <Download className="w-3 h-3 mr-1 shrink-0" />
                      {t("member.materials.download")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="videos">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
            {materials.videos.map((video) => (
              <Card key={video.id} className="overflow-hidden" data-testid={`card-video-${video.id}`}>
                <div className="aspect-video bg-muted overflow-hidden relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white/90 flex items-center justify-center">
                      <Video className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                  </div>
                  <Badge className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 bg-black/70 text-[10px] sm:text-xs">{video.duration}</Badge>
                </div>
                <CardContent className="p-2.5 sm:p-4">
                  <h4 className="font-medium text-xs sm:text-sm mb-2 sm:mb-3 truncate">{video.title}</h4>
                  <div className="flex gap-1.5 sm:gap-2">
                    <Button variant="outline" size="sm" className="flex-1 h-7 sm:h-9 text-[10px] sm:text-xs px-1.5 sm:px-3">
                      <ExternalLink className="w-3 h-3 mr-0.5 sm:mr-1 shrink-0" />
                      <span className="truncate">{t("member.materials.play")}</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-7 sm:h-9 text-[10px] sm:text-xs px-1.5 sm:px-3"
                      onClick={() => {
                        const text = `${t("member.materials.itemShareText").replace("{title}", video.title).replace("{code}", referralCode)}\n${referralLink}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                      }}
                    >
                      <Share2 className="w-3 h-3 mr-0.5 sm:mr-1 shrink-0" />
                      <span className="truncate">{t("member.materials.share")}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            {t("member.materials.socialShare")}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">{t("member.materials.socialShareDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <Button
              variant="outline"
              className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 bg-green-500/5 border-green-500/20 hover:bg-green-500/10"
              onClick={shareToWhatsApp}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-base sm:text-lg">W</span>
              </div>
              <span className="text-xs sm:text-sm">WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10"
              onClick={shareToFacebook}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-base sm:text-lg">F</span>
              </div>
              <span className="text-xs sm:text-sm">Facebook</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 bg-pink-500/5 border-pink-500/20 hover:bg-pink-500/10"
              onClick={() => copyToClipboard(referralLink, t("member.materials.referralLinkLabel"))}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                <span className="text-white text-base sm:text-lg">I</span>
              </div>
              <span className="text-xs sm:text-sm">Instagram</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
              onClick={() => copyToClipboard(referralLink, t("member.materials.referralLinkLabel"))}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-white text-base sm:text-lg">小</span>
              </div>
              <span className="text-xs sm:text-sm">小红书</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </MemberLayout>
  );
}
