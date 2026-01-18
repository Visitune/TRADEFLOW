import { MOCK_BATCHES, MOCK_INVOICES, MOCK_PARTNERS, MOCK_POS, MOCK_PRODUCTS, MOCK_SALES } from '../constants';
import { Batch, Invoice, Partner, Product, PurchaseOrder, SalesOrder } from '../types';

export const dataService = {
  getProducts: async (): Promise<Product[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_PRODUCTS), 500));
  },

  getPartners: async (): Promise<Partner[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_PARTNERS), 500));
  },

  getBatches: async (): Promise<Batch[]> => {
    const enrichedBatches = MOCK_BATCHES.map(b => ({
      ...b,
      product: MOCK_PRODUCTS.find(p => p.id === b.product_id)
    }));
    return new Promise((resolve) => setTimeout(() => resolve(enrichedBatches), 600));
  },

  getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    const enrichedPOs = MOCK_POS.map(po => ({
      ...po,
      supplier: MOCK_PARTNERS.find(p => p.id === po.supplier_id)
    }));
    return new Promise((resolve) => setTimeout(() => resolve(enrichedPOs), 500));
  },

  getSalesOrders: async (): Promise<SalesOrder[]> => {
    const enrichedSOs = MOCK_SALES.map(so => ({
      ...so,
      client: MOCK_PARTNERS.find(p => p.id === so.client_id)
    }));
    return new Promise((resolve) => setTimeout(() => resolve(enrichedSOs), 500));
  },

  getInvoices: async (): Promise<Invoice[]> => {
    const enrichedInvoices = MOCK_INVOICES.map(inv => ({
      ...inv,
      client: MOCK_PARTNERS.find(p => p.id === inv.client_id)
    }));
    return new Promise((resolve) => setTimeout(() => resolve(enrichedInvoices), 500));
  },

  getTraceability: async (batchInternalId: string) => {
    const batch = MOCK_BATCHES.find(b => b.internal_batch_number === batchInternalId);
    if (!batch) return null;
    
    const product = MOCK_PRODUCTS.find(p => p.id === batch.product_id);
    const po = MOCK_POS[0]; 
    const supplier = MOCK_PARTNERS.find(p => p.id === po?.supplier_id);
    
    return {
      batch,
      product,
      po,
      supplier,
      customers: [MOCK_PARTNERS.find(p => p.id === 'cli1')]
    };
  }
};