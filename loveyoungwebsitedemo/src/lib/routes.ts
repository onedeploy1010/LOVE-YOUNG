export const ROUTE_PATHS = {
  HOME: '/',
  BRAND: '/brand',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  RWA_PLAN: '/rwa',
  MEMBER_CENTER: '/member',
  ORDER_SYSTEM: '/order',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ORDER_HISTORY: '/member/orders',
  POINTS_CENTER: '/member/points',
  PARTNER_PANEL: '/member/partner'
} as const;

const routes = [
  { path: ROUTE_PATHS.HOME, name: '首页' },
  { path: ROUTE_PATHS.BRAND, name: '关于品牌' },
  { path: ROUTE_PATHS.PRODUCTS, name: '礼盒商城' },
  { path: ROUTE_PATHS.RWA_PLAN, name: '联合经营人' },
  { path: ROUTE_PATHS.MEMBER_CENTER, name: '会员中心' }
];

export default routes;