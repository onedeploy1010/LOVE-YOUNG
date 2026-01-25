export type UserRole = 'MEMBER' | 'PARTNER' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: UserRole;
  points: number;
  phone?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: 'GIFT_BOX' | 'HEALTH' | 'LIFESTYLE';
  images: string[];
  features: string[];
}

export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  pointsUsed: number;
  status: OrderStatus;
  shippingAddress: string;
  contactPhone: string;
  createdAt: string;
  updatedAt: string;
}

export type RWALevel = 'ANGEL' | 'FOUNDER' | 'STRATEGIC';

export interface RWAPartner {
  id: string;
  userId: string;
  level: RWALevel;
  investmentAmount: number;
  shareRatio: number;
  totalDividends: number;
  joinedAt: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
}

export interface LYPointsTransaction {
  id: string;
  type: 'EARN' | 'SPEND' | 'REFUND';
  amount: number;
  description: string;
  createdAt: string;
}

export interface LYPoints {
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  history: LYPointsTransaction[];
}