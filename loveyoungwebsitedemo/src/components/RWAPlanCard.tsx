import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingUp, Gem, Star, ArrowRight } from 'lucide-react';
import { RWALevel } from '@/types';
import { RWA_CONFIG, PRODUCT_CONFIG } from '@/lib/constants';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IMAGES } from '@/assets/images';
import { cn } from '@/lib/utils';

interface RWAPlanCardProps {
  level: RWALevel;
  isRecommended?: boolean;
}

export const RWAPlanCard: React.FC<RWAPlanCardProps> = ({ level, isRecommended }) => {
  const stageData = RWA_CONFIG.STAGES.find(s => s.level === level);

  if (!stageData) return null;

  const getLevelIcon = () => {
    switch (level) {
      case 'ANGEL': return <Star className="w-6 h-6" />;
      case 'FOUNDER': return <ShieldCheck className="w-6 h-6" />;
      case 'STRATEGIC': return <Gem className="w-6 h-6" />;
      default: return <TrendingUp className="w-6 h-6" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "relative h-full transition-all duration-500",
        isRecommended ? "scale-105 z-10" : "scale-100"
      )}
    >
      {isRecommended && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <Badge className="bg-secondary text-white border-none px-4 py-1 rounded-full text-sm font-bold luxury-shadow">
            最受欢迎
          </Badge>
        </div>
      )}

      <Card className={cn(
        "h-full flex flex-col border-2 overflow-hidden",
        isRecommended 
          ? "border-secondary bg-white luxury-shadow" 
          : "border-border/50 bg-white/80 backdrop-blur-sm"
      )}>
        <CardHeader className={cn(
          "text-center p-8",
          isRecommended ? "bg-secondary/5" : "bg-muted/30"
        )}>
          <div className={cn(
            "mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4",
            isRecommended ? "bg-secondary text-white" : "bg-primary text-white"
          )}>
            {getLevelIcon()}
          </div>
          <CardTitle className="text-2xl font-serif font-bold text-primary mb-2">
            {stageData.name}
          </CardTitle>
          <div className="flex flex-col items-center">
            <span className="text-sm text-muted-foreground uppercase tracking-widest">投资门槛</span>
            <span className="text-3xl font-serif font-bold text-foreground mt-1">
              {PRODUCT_CONFIG.CURRENCY}{(stageData.threshold / 10000).toFixed(0)}万起
            </span>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-8">
          <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-primary/70 font-medium uppercase">预计年化分红</p>
              <p className="text-2xl font-serif font-bold text-primary">
                {(stageData.dividendRatio * 100).toFixed(0)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary/20" />
          </div>

          <div className="space-y-4">
            <p className="text-sm font-bold text-foreground">专属经营权益：</p>
            <ul className="space-y-3">
              {stageData.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <div className="mt-1 shrink-0 w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center">
                    <CheckIcon className="w-2.5 h-2.5 text-secondary" />
                  </div>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>

        <CardFooter className="p-8 pt-0">
          <Button
            className={cn(
              "w-full py-6 text-lg rounded-xl btn-luxury",
              isRecommended 
                ? "bg-secondary hover:bg-secondary/90 text-white" 
                : "bg-primary hover:bg-primary/90 text-white"
            )}
          >
            立即咨询详情
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </CardFooter>

        {/* Subtle decorative background */}
        <div className="absolute bottom-0 right-0 opacity-5 pointer-events-none">
          <img 
            src={IMAGES.RWA_CONCEPT} 
            alt="decor" 
            className="w-32 h-32 grayscale"
          />
        </div>
      </Card>
    </motion.div>
  );
};

const CheckIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="4" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
