// Enums mirroring database constraints
export enum UserRole {
  ADMIN = 'admin',
  BUYER = 'acheteur',
  WAREHOUSE = 'magasinier',
  SALES = 'commercial',
  ACCOUNTING = 'compta'
}

export enum PartnerType {
  SUPPLIER = 'fournisseur',
  CLIENT = 'client',
  FORWARDER = 'transitaire'
}

export enum POStatus {
  DRAFT = 'draft',
  ORDERED = 'ordered',
  IN_TRANSIT = 'in_transit',
  RECEIVED = 'received',
  PARTIAL = 'partial'
}

export enum SOStatus {
  BOOKING = 'booking',
  CONFIRMED = 'confirmed',
  BOL_GENERATED = 'bol_generated',
  SHIPPED = 'shipped',
  INVOICED = 'invoiced',
  PAID = 'paid'
}

export enum BatchStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  QUARANTINE = 'quarantine',
  CONSUMED = 'consumed'
}

// Interfaces
export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
}

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  address?: string;
  city?: string;
  postal_code?: string;
  country: string;
  currency: string;
}

export interface Product {
  id: string;
  sku: string; // Code Produit
  name: string; // Description
  description_fr?: string;
  brand?: string;
  category: string;
  unit: 'kg' | 'colis' | 'palette' | 'unite';
  format?: string;
  items_per_case?: number;
  unit_weight_kg: number;
  origin?: string;
  hs_code?: string;
  conservation: 'frais' | 'surgelé' | 'sec';
  min_stock_alert: number;
  // Costing Module Fields
  wholesale_price?: number;
  suggested_retail_price?: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier?: Partner;
  status: POStatus;
  incoterm?: string;
  order_date: string;
  expected_arrival?: string;
  total_fob: number;
  currency_rate: number;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  product_id: string;
  product?: Product;
  quantity_cases: number;
  price_unit: number;
}

export interface Batch {
  id: string;
  product_id: string;
  product?: Product;
  supplier_batch_number: string; // Lot Serial Numbers
  internal_batch_number: string;
  quantity_initial: number;
  quantity_current: number;
  dlc: string; // Expiration Date
  ddm?: string; // Best Before
  reception_date: string;
  landed_cost_unit: number; // Cost price per unit
  location_zone: string;
  status: BatchStatus;
}

export interface SalesOrder {
  id: string;
  so_number: string; // Booking Reference
  client_id: string;
  client?: Partner;
  status: SOStatus;
  order_date: string;
  total_amount: number;
  currency: string;
  invoice_number?: string;
  bol_url?: string;
  items?: SalesOrderItem[];
}

export interface SalesOrderItem {
  id: string;
  so_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  so_id: string;
  sales_order?: SalesOrder;
  client_id: string;
  client?: Partner;
  issue_date: string;
  due_date: string;
  amount: number;
  balance: number;
  status: 'unpaid' | 'partial' | 'paid';
}

export interface InventoryTransaction {
  id: string;
  batch_id: string;
  type: 'in' | 'out' | 'adjust' | 'loss';
  quantity: number;
  date: string;
  user_id: string;
}
