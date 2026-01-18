// Enhanced Costing Module - Inspired by "projet JOS.pdf"
// Implements: FOB Cost + Charges + FX → Landed Cost → Wholesale → Retail

export interface CostBreakdown {
  // Base Costs
  fob_cost: number;                    // FOB (Free On Board) from supplier
  freight_cost: number;                // Shipping/Transport
  insurance_cost: number;              // Insurance
  customs_duty_cost: number;           // Customs & Duties
  other_charges: number;               // Misc charges
  
  // Foreign Exchange
  fx_rate: number;                     // Exchange rate (e.g., EUR to CAD)
  supplier_currency: string;           // EUR, USD, etc.
  local_currency: string;              // CAD
  
  // Calculated Fields
  total_charges: number;               // Sum of all charges
  landed_cost_foreign: number;         // In supplier currency
  landed_cost_local: number;           // In local currency (final)
  
  // Pricing
  wholesale_margin_pct: number;        // e.g., 25%
  wholesale_price: number;             // Calculated
  retail_margin_pct: number;           // e.g., 40%
  suggested_retail_price: number;      // Calculated
}

/**
 * Calculate Landed Cost from FOB and all charges
 * Formula: (FOB + Freight + Insurance + Customs + Other) × FX Rate
 */
export function calculateLandedCost(
  fob: number,
  freight: number,
  insurance: number,
  customs: number,
  other: number,
  fxRate: number
): number {
  const totalForeign = fob + freight + insurance + customs + other;
  return totalForeign * fxRate;
}

/**
 * Calculate Wholesale Price from Landed Cost
 * Formula: Landed Cost × (1 + Margin %)
 */
export function calculateWholesalePrice(
  landedCost: number,
  marginPct: number
): number {
  return landedCost * (1 + marginPct / 100);
}

/**
 * Calculate Suggested Retail Price from Wholesale
 * Formula: Wholesale × (1 + Margin %)
 */
export function calculateRetailPrice(
  wholesalePrice: number,
  marginPct: number
): number {
  return wholesalePrice * (1 + marginPct / 100);
}

/**
 * Complete Costing Calculation
 * Returns full breakdown with all calculated fields
 */
export function calculateFullCosting(
  fob: number,
  freight: number,
  insurance: number,
  customs: number,
  other: number,
  fxRate: number,
  supplierCurrency: string,
  localCurrency: string,
  wholesaleMarginPct: number,
  retailMarginPct: number
): CostBreakdown {
  const totalCharges = freight + insurance + customs + other;
  const landedCostForeign = fob + totalCharges;
  const landedCostLocal = landedCostForeign * fxRate;
  const wholesalePrice = calculateWholesalePrice(landedCostLocal, wholesaleMarginPct);
  const suggestedRetailPrice = calculateRetailPrice(wholesalePrice, retailMarginPct);

  return {
    fob_cost: fob,
    freight_cost: freight,
    insurance_cost: insurance,
    customs_duty_cost: customs,
    other_charges: other,
    fx_rate: fxRate,
    supplier_currency: supplierCurrency,
    local_currency: localCurrency,
    total_charges: totalCharges,
    landed_cost_foreign: landedCostForeign,
    landed_cost_local: landedCostLocal,
    wholesale_margin_pct: wholesaleMarginPct,
    wholesale_price: wholesalePrice,
    retail_margin_pct: retailMarginPct,
    suggested_retail_price: suggestedRetailPrice
  };
}

/**
 * Calculate Gross Profit Percentage
 * Formula: ((Selling Price - Cost) / Selling Price) × 100
 */
export function calculateGrossProfitPct(
  sellingPrice: number,
  cost: number
): number {
  if (sellingPrice === 0) return 0;
  return ((sellingPrice - cost) / sellingPrice) * 100;
}

/**
 * Example Usage:
 * 
 * const costing = calculateFullCosting(
 *   100,    // FOB: 100 EUR
 *   20,     // Freight: 20 EUR
 *   5,      // Insurance: 5 EUR
 *   15,     // Customs: 15 EUR
 *   10,     // Other: 10 EUR
 *   1.45,   // FX Rate: 1 EUR = 1.45 CAD
 *   'EUR',
 *   'CAD',
 *   25,     // Wholesale margin: 25%
 *   40      // Retail margin: 40%
 * );
 * 
 * Result:
 * - Landed Cost: 217.50 CAD
 * - Wholesale: 271.88 CAD
 * - Retail: 380.63 CAD
 */

// ===== INTEGRATION WITH EXISTING TYPES =====

import { Product, PurchaseOrderItem } from './types';

/**
 * Enhanced Product interface with costing breakdown
 */
export interface ProductWithCosting extends Product {
  costing?: CostBreakdown;
}

/**
 * Enhanced PO Item with individual costing
 */
export interface POItemWithCosting extends PurchaseOrderItem {
  costing?: CostBreakdown;
}

/**
 * Apply costing to a product based on PO item data
 */
export function applyProductCosting(
  product: Product,
  poItem: PurchaseOrderItem,
  freight: number,
  insurance: number,
  customs: number,
  other: number,
  fxRate: number,
  supplierCurrency: string,
  localCurrency: string,
  wholesaleMarginPct: number = 25,
  retailMarginPct: number = 40
): ProductWithCosting {
  const costing = calculateFullCosting(
    poItem.price_unit,
    freight / (poItem.quantity_cases || 1), // Distribute freight per case
    insurance / (poItem.quantity_cases || 1),
    customs / (poItem.quantity_cases || 1),
    other / (poItem.quantity_cases || 1),
    fxRate,
    supplierCurrency,
    localCurrency,
    wholesaleMarginPct,
    retailMarginPct
  );

  return {
    ...product,
    wholesale_price: costing.wholesale_price,
    suggested_retail_price: costing.suggested_retail_price,
    costing
  };
}

/**
 * Batch update products with costing from a PO
 */
export function batchUpdateProductCosting(
  products: Product[],
  poItems: PurchaseOrderItem[],
  totalFreight: number,
  totalInsurance: number,
  totalCustoms: number,
  totalOther: number,
  fxRate: number,
  supplierCurrency: string,
  localCurrency: string
): ProductWithCosting[] {
  const totalItems = poItems.reduce((sum, item) => sum + (item.quantity_cases || 0), 0);
  
  return products.map(product => {
    const poItem = poItems.find(item => item.product_id === product.id);
    if (!poItem) return { ...product };

    const itemShare = (poItem.quantity_cases || 0) / totalItems;
    
    return applyProductCosting(
      product,
      poItem,
      totalFreight * itemShare,
      totalInsurance * itemShare,
      totalCustoms * itemShare,
      totalOther * itemShare,
      fxRate,
      supplierCurrency,
      localCurrency
    );
  });
}

// ===== VALIDATION HELPERS =====

export function validateCosting(costing: Partial<CostBreakdown>): string[] {
  const errors: string[] = [];

  if (!costing.fob_cost || costing.fob_cost <= 0) {
    errors.push('FOB cost must be greater than 0');
  }

  if (!costing.fx_rate || costing.fx_rate <= 0) {
    errors.push('FX rate must be greater than 0');
  }

  if (costing.wholesale_margin_pct !== undefined && costing.wholesale_margin_pct < 0) {
    errors.push('Wholesale margin cannot be negative');
  }

  if (costing.retail_margin_pct !== undefined && costing.retail_margin_pct < 0) {
    errors.push('Retail margin cannot be negative');
  }

  return errors;
}

// ===== FORMATTING HELPERS =====

export function formatCurrency(
  amount: number,
  currency: string = 'CAD',
  locale: string = 'en-CA'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}
