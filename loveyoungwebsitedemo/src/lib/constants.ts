export const PRODUCT_CONFIG = {
  CATEGORIES: [
    { id: 'GIFT_BOX', label: '尊享礼盒' },
    { id: 'HEALTH', label: '养生膳食' },
    { id: 'LIFESTYLE', label: '生活方式' }
  ],
  SHIPPING_FEE: 0,
  MIN_FREE_SHIPPING_AMOUNT: 0,
  CURRENCY: '¥'
};

export const RWA_CONFIG = {
  STAGES: [
    {
      level: 'ANGEL',
      name: '天使经营人',
      threshold: 50000,
      dividendRatio: 0.05,
      benefits: ['专属礼盒', '季度分红', '线下沙龙']
    },
    {
      level: 'FOUNDER',
      name: '创始经营人',
      threshold: 200000,
      dividendRatio: 0.12,
      benefits: ['核心决策权', '月度分红', '定制化服务', '品牌活动特邀']
    },
    {
      level: 'STRATEGIC',
      name: '战略经营人',
      threshold: 1000000,
      dividendRatio: 0.25,
      benefits: ['股权优先认购', '全球康养基地免费入驻', '年度分红', '1对1管家服务']
    }
  ],
  SETTLEMENT_CYCLE: 'MONTHLY'
};

export const POINTS_CONFIG = {
  EARN_RATE: 1, // 1 RMB = 1 Point
  REDEMPTION_RATE: 100, // 100 Points = 1 RMB
  MAX_POINTS_OFFSET_RATIO: 0.3, // Max 30% of order value
  SIGN_IN_POINTS: 10
};