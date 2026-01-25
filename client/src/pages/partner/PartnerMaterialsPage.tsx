import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PartnerLayout } from "@/components/PartnerLayout";
import {
  Share2, Download, Copy, Image, FileText, Video,
  ExternalLink, Check, QrCode, Smartphone
} from "lucide-react";
import { useState } from "react";

const materials = {
  images: [
    { id: 1, title: "产品海报 - 燕窝系列", thumbnail: "/pics/love_young_brand_identity_20260106043554_1.png", size: "1080x1920" },
    { id: 2, title: "品牌故事图", thumbnail: "/pics/love_young_founders_story_20260106043351_1.png", size: "1200x630" },
    { id: 3, title: "经营人招募海报", thumbnail: "/pics/love_young_digital_marketing_20260106043418_1.png", size: "1080x1920" },
    { id: 4, title: "节日促销素材", thumbnail: "/pics/love_young_community_impact_20260106043528_1.png", size: "1080x1080" },
  ],
  documents: [
    { id: 1, title: "产品手册 PDF", type: "PDF", size: "2.5 MB" },
    { id: 2, title: "经营人培训资料", type: "PDF", size: "5.2 MB" },
    { id: 3, title: "常见问题解答", type: "PDF", size: "1.1 MB" },
    { id: 4, title: "品牌介绍PPT", type: "PPTX", size: "8.7 MB" },
  ],
  videos: [
    { id: 1, title: "品牌宣传片", duration: "2:30", thumbnail: "/pics/love_young_brand_identity_20260106043554_1.png" },
    { id: 2, title: "产品制作过程", duration: "5:15", thumbnail: "/pics/craftsmanship_journey.webp" },
    { id: 3, title: "经营人成功案例", duration: "3:45", thumbnail: "/pics/partner_story_1.webp" },
  ]
};

export default function PartnerMaterialsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`https://loveyoung.my/share/${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-materials-title">推广物料</h1>
          <p className="text-muted-foreground">获取分享素材，助力您的推广</p>
        </div>

      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-background flex items-center justify-center border-2 border-dashed border-primary/30">
                <QrCode className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">我的专属推广二维码</h3>
                <p className="text-muted-foreground text-sm">扫码即可直接加入您的推荐网络</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" data-testid="button-download-qr">
                <Download className="w-4 h-4 mr-2" />
                下载二维码
              </Button>
              <Button data-testid="button-share-qr">
                <Share2 className="w-4 h-4 mr-2" />
                分享链接
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="images" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="images" className="gap-2" data-testid="tab-images">
            <Image className="w-4 h-4" />
            图片素材
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2" data-testid="tab-documents">
            <FileText className="w-4 h-4" />
            文档资料
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-2" data-testid="tab-videos">
            <Video className="w-4 h-4" />
            视频素材
          </TabsTrigger>
        </TabsList>

        <TabsContent value="images">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {materials.images.map((item) => (
              <Card key={item.id} className="overflow-hidden" data-testid={`card-image-${item.id}`}>
                <div className="aspect-[9/16] bg-muted overflow-hidden">
                  <img 
                    src={item.thumbnail} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{item.size}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="w-3 h-3 mr-1" />
                      下载
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Share2 className="w-3 h-3 mr-1" />
                      分享
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {materials.documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="flex items-center justify-between p-4 hover-elevate"
                    data-testid={`card-document-${doc.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-sm text-muted-foreground">{doc.type} · {doc.size}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        预览
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        下载
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {materials.videos.map((video) => (
              <Card key={video.id} className="overflow-hidden" data-testid={`card-video-${video.id}`}>
                <div className="aspect-video bg-muted overflow-hidden relative">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                      <Video className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <Badge className="absolute bottom-2 right-2 bg-black/70">{video.duration}</Badge>
                </div>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">{video.title}</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      播放
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Share2 className="w-3 h-3 mr-1" />
                      分享
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            社交媒体快速分享
          </CardTitle>
          <CardDescription>一键分享到各大社交平台</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-green-500/5 border-green-500/20 hover:bg-green-500/10">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-lg">W</span>
              </div>
              <span>WhatsApp</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-lg">F</span>
              </div>
              <span>Facebook</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-pink-500/5 border-pink-500/20 hover:bg-pink-500/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                <span className="text-white text-lg">I</span>
              </div>
              <span>Instagram</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-red-500/5 border-red-500/20 hover:bg-red-500/10">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-white text-lg">小</span>
              </div>
              <span>小红书</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </PartnerLayout>
  );
}
