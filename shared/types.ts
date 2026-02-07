// User roles: user (default) -> member (bought product) -> partner (joined program) -> admin (db set)
export const userRoles = ["user", "member", "partner", "admin"] as const;
export type UserRoleType = (typeof userRoles)[number];

// User type for Supabase Auth
export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  profileImageUrl: string | null;
  role: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export type InsertUser = Omit<User, "id" | "createdAt" | "updatedAt">;

export interface Product {
  id: string;
  name: string;
  nameEn: string | null;
  description: string;
  price: number;
  priceUnit: string | null;
  image: string;
  category: string;
  featured: boolean | null;
  erpnextItemCode: string | null;
}

export type InsertProduct = Omit<Product, "id">;

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  message: string | null;
  createdAt: string | null;
}

export type InsertContactMessage = Omit<ContactMessage, "id" | "createdAt">;

export interface Testimonial {
  id: string;
  name: string;
  content: string;
  productType: string;
  avatar: string | null;
}

export type InsertTestimonial = Omit<Testimonial, "id">;

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  memberId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  status: string;
  totalAmount: number;
  items: string;
  packageType: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostcode: string | null;
  preferredDeliveryDate: string | null;
  trackingNumber: string | null;
  notes: string | null;
  source: string | null;
  erpnextId: string | null;
  metaOrderId: string | null;
  pointsEarned: number | null;
  pointsRedeemed: number | null;
  sourceChannel: string | null;
  whatsappConversationId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type InsertOrder = Omit<Order, "id" | "createdAt" | "updatedAt" | "sourceChannel" | "whatsappConversationId"> & {
  sourceChannel?: string | null;
  whatsappConversationId?: string | null;
};

export const orderStatusEnum = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof orderStatusEnum)[number];

// Malaysian states enum
export const malaysianStates = [
  "johor", "kedah", "kelantan", "melaka", "negeri_sembilan",
  "pahang", "penang", "perak", "perlis", "sabah", "sarawak",
  "selangor", "terengganu", "kuala_lumpur", "labuan", "putrajaya"
] as const;
export type MalaysianState = (typeof malaysianStates)[number];

export interface Member {
  id: string;
  userId: string | null;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  pointsBalance: number | null;
  preferredFlavor: string | null;
  preferredPackage: string | null;
  referralCode: string | null;
  referrerId: string | null;
  createdAt: string | null;
}

export type InsertMember = Omit<Member, "id" | "createdAt">;

export interface MemberAddress {
  id: string;
  memberId: string;
  label: string | null;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postcode: string;
  isDefault: boolean | null;
  createdAt: string | null;
}

export type InsertMemberAddress = Omit<MemberAddress, "id" | "createdAt">;

export interface PointsLedger {
  id: string;
  memberId: string;
  orderId: string | null;
  type: string;
  points: number;
  description: string | null;
  createdAt: string | null;
}

export type InsertPointsLedger = Omit<PointsLedger, "id" | "createdAt">;

export const pointsTypeEnum = ["earn", "redeem", "expire", "bonus"] as const;
export type PointsType = (typeof pointsTypeEnum)[number];

// ============ Business Partner System ============

export const partnerTierEnum = ["phase1", "phase2", "phase3"] as const;
export type PartnerTier = (typeof partnerTierEnum)[number];

export const partnerStatusEnum = ["pending", "active", "suspended", "expired"] as const;
export type PartnerStatus = (typeof partnerStatusEnum)[number];

export const userStateEnum = ["user", "member", "partner", "admin"] as const;
export type UserState = (typeof userStateEnum)[number];

export const userRoleEnum = ["member", "partner", "admin"] as const;
export type UserRole = (typeof userRoleEnum)[number];

export interface Partner {
  id: string;
  memberId: string;
  referralCode: string | null;
  tier: string;
  status: string;
  referrerId: string | null;
  lyBalance: number | null;
  cashWalletBalance: number | null;
  rwaTokens: number | null;
  totalSales: number | null;
  totalCashback: number | null;
  paymentAmount: number | null;
  paymentDate: string | null;
  paymentReference: string | null;
  packagesPurchased: number;
  totalBoxesProcessed: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export type InsertPartner = Omit<Partner, "id" | "createdAt" | "updatedAt">;

export interface LyPointsLedger {
  id: string;
  partnerId: string;
  type: string;
  points: number;
  referenceId: string | null;
  referenceType: string | null;
  tier: number | null;
  description: string | null;
  createdAt: string | null;
}

export type InsertLyPointsLedger = Omit<LyPointsLedger, "id" | "createdAt">;

export interface BonusPoolCycle {
  id: string;
  cycleNumber: number;
  startDate: string;
  endDate: string;
  totalSales: number | null;
  poolAmount: number | null;
  totalTokens: number | null;
  status: string;
  distributedAt: string | null;
  createdAt: string | null;
}

export type InsertBonusPoolCycle = Omit<BonusPoolCycle, "id" | "createdAt">;

export interface RwaTokenLedger {
  id: string;
  partnerId: string;
  cycleId: string;
  tokens: number;
  source: string;
  orderId: string | null;
  createdAt: string | null;
}

export type InsertRwaTokenLedger = Omit<RwaTokenLedger, "id" | "createdAt">;

export interface CashWalletLedger {
  id: string;
  partnerId: string;
  type: string;
  amount: number;
  referenceId: string | null;
  referenceType: string | null;
  status: string;
  description: string | null;
  createdAt: string | null;
}

export type InsertCashWalletLedger = Omit<CashWalletLedger, "id" | "createdAt">;

export interface WithdrawalRequest {
  id: string;
  partnerId: string;
  amount: number;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  status: string;
  processedBy: string | null;
  processedAt: string | null;
  notes: string | null;
  createdAt: string | null;
}

export type InsertWithdrawalRequest = Omit<WithdrawalRequest, "id" | "createdAt">;

// ============ ERP System ============

export interface Inventory {
  id: string;
  productId: string | null;
  sku: string;
  name: string;
  category: string;
  quantity: number | null;
  unit: string;
  minStock: number | null;
  costPrice: number | null;
  location: string | null;
  batchNumber: string | null;
  expiryDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type InsertInventory = Omit<Inventory, "id" | "createdAt" | "updatedAt">;

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string | null;
  supplierName: string;
  items: unknown;
  totalAmount: number;
  status: string;
  expectedDate: string | null;
  receivedDate: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type InsertPurchaseOrder = Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt">;

export const productionStatusEnum = ["planned", "material_prep", "cleaning", "cooking", "cold_storage", "inspection", "completed", "cancelled"] as const;
export type ProductionStatus = (typeof productionStatusEnum)[number];

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  productId: string | null;
  productName: string;
  plannedQuantity: number;
  actualQuantity: number | null;
  status: string;
  plannedDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  qualityCheckResult: string | null;
  qualityNotes: string | null;
  storageLocation: string | null;
  storageTemperature: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type InsertProductionBatch = Omit<ProductionBatch, "id" | "createdAt" | "updatedAt">;

export const productionStepTypeEnum = ["material_prep", "cleaning", "cooking", "cold_storage", "inspection"] as const;
export type ProductionStepType = (typeof productionStepTypeEnum)[number];

export interface ProductionStep {
  id: string;
  batchId: string;
  stepType: string;
  stepOrder: number;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  operatorId: string | null;
  operatorName: string | null;
  cleaningMethod: string | null;
  disinfectantUsed: string | null;
  cookingTemperature: string | null;
  cookingDuration: number | null;
  storageTemperature: string | null;
  storageLocation: string | null;
  inspectionItems: unknown | null;
  inspectionResult: string | null;
  notes: string | null;
  photos: unknown | null;
  createdAt: string | null;
}

export type InsertProductionStep = Omit<ProductionStep, "id" | "createdAt">;

export interface ProductionMaterial {
  id: string;
  batchId: string;
  inventoryId: string;
  materialName: string;
  plannedQuantity: number;
  actualQuantity: number | null;
  wastageQuantity: number | null;
  wastageReason: string | null;
  unit: string;
  unitCost: number | null;
  totalCost: number | null;
  extractedAt: string | null;
  extractedBy: string | null;
  inventoryLedgerId: string | null;
  notes: string | null;
  createdAt: string | null;
}

export type InsertProductionMaterial = Omit<ProductionMaterial, "id" | "createdAt">;

export interface HygieneInspection {
  id: string;
  inspectionDate: string;
  area: string;
  inspectorName: string;
  checkItems: unknown;
  overallResult: string;
  photos: unknown | null;
  notes: string | null;
  createdAt: string | null;
}

export type InsertHygieneInspection = Omit<HygieneInspection, "id" | "createdAt">;

export interface ColdChainShipment {
  id: string;
  orderId: string | null;
  trackingNumber: string;
  carrier: string;
  status: string;
  pickupTime: string | null;
  deliveredTime: string | null;
  temperatureLog: unknown | null;
  recipientName: string | null;
  recipientPhone: string | null;
  recipientAddress: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type InsertColdChainShipment = Omit<ColdChainShipment, "id" | "createdAt" | "updatedAt">;

export interface CostRecord {
  id: string;
  category: string;
  description: string;
  amount: number;
  referenceType: string | null;
  referenceId: string | null;
  recordDate: string;
  createdBy: string | null;
  createdAt: string | null;
}

export type InsertCostRecord = Omit<CostRecord, "id" | "createdAt">;

export interface Bill {
  id: string;
  billNumber: string;
  type: string;
  category: string;
  amount: number;
  description: string | null;
  dueDate: string | null;
  paidDate: string | null;
  status: string;
  referenceType: string | null;
  referenceId: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type InsertBill = Omit<Bill, "id" | "createdAt" | "updatedAt">;

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  category: string | null;
  notes: string | null;
  createdAt: string | null;
}

export type InsertSupplier = Omit<Supplier, "id" | "createdAt">;
