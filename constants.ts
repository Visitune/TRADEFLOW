import { Batch, BatchStatus, Invoice, Partner, PartnerType, POStatus, Product, PurchaseOrder, SalesOrder, SOStatus, UserRole } from './types';

// Real Products from Dataset with Price List info
export const MOCK_PRODUCTS: Product[] = [
  { 
    id: 'p1', sku: 'PISE 1', name: 'Pistachio Spreadable Cream - PLASTIQUE 1 KG', description_fr: 'CRÈME À TARTINER PISTACHE',
    brand: 'Chocorotto', category: 'Cream', unit: 'colis', format: '1000 g (cs 2)', items_per_case: 2,
    unit_weight_kg: 2, origin: 'Italy', hs_code: '1806909099', conservation: 'sec', min_stock_alert: 10,
    wholesale_price: 32.50, suggested_retail_price: 45.00
  },
  { 
    id: 'p2', sku: 'CRM02', name: 'Pistachio Spreadable Cream', description_fr: 'CRÈME À TARTINER PISTACHE',
    brand: 'Casa Folino', category: 'Cream', unit: 'colis', format: '220 g (cs 12)', items_per_case: 12,
    unit_weight_kg: 2.64, origin: 'Italy', hs_code: '1806909099', conservation: 'sec', min_stock_alert: 20,
    wholesale_price: 72.00, suggested_retail_price: 95.00
  },
  { 
    id: 'p3', sku: 'CRM13', name: 'White Chocolate Spreadable Cream', description_fr: 'CREME CHOCOLAT BLANC',
    brand: 'Casa Folino', category: 'Cream', unit: 'colis', format: '220 g (cs 12)', items_per_case: 12,
    unit_weight_kg: 2.64, origin: 'Italy', hs_code: '', conservation: 'sec', min_stock_alert: 20,
    wholesale_price: 70.00, suggested_retail_price: 90.00
  },
  // Added from OCR (Corilu Hazelnuts)
  {
    id: 'p_hazelnut_180', sku: 'PAS180', name: '100% Piemonte IGP Hazelnut Paste', description_fr: 'Pâte Noisette IGP',
    brand: 'Corilu', category: 'Nuts', unit: 'colis', format: '6 x 180 GR', items_per_case: 6,
    unit_weight_kg: 1.08, origin: 'Italy', conservation: 'sec', min_stock_alert: 5,
    wholesale_price: 18.00, suggested_retail_price: 25.00
  },
  {
    id: 'p_hazelnut_spread', sku: 'CFON212', name: 'Dairy Free Dark Hazelnut Spread', description_fr: 'Tartinade Noisette Noir',
    brand: 'Corilu', category: 'Cream', unit: 'colis', format: '6 x 212 GR', items_per_case: 6,
    unit_weight_kg: 1.27, origin: 'Italy', conservation: 'sec', min_stock_alert: 5,
    wholesale_price: 20.00, suggested_retail_price: 28.00
  },
  // Added from OCR (Honey)
  {
    id: 'p_honey_truffle', sku: 'MIE52', name: 'Honey with Truffle', description_fr: 'Miel à la Truffe',
    brand: 'Casa Folino', category: 'Honey', unit: 'colis', format: '12 x 250 GR', items_per_case: 12,
    unit_weight_kg: 3, origin: 'Italy', conservation: 'sec', min_stock_alert: 10,
    wholesale_price: 60.00, suggested_retail_price: 85.00
  },
  // Added from OCR (Cheese/Dairy - Invoice 202490)
  {
    id: 'p_mozza', sku: 'PR04', name: 'Mozzarella di Bufflone DOP 100gr', description_fr: 'Mozzarella di Bufflone',
    brand: 'Jusami', category: 'Dairy', unit: 'colis', format: 'Caisse 15', items_per_case: 15,
    unit_weight_kg: 1.5, origin: 'Italy', conservation: 'frais', min_stock_alert: 5,
    wholesale_price: 76.50, suggested_retail_price: 105.00
  },
  {
    id: 'p_burrata', sku: 'MA22', name: 'Burrata [sans tête] 100gr Coupelle', description_fr: 'Burrata',
    brand: 'Jusami', category: 'Dairy', unit: 'colis', format: 'Caisse 15', items_per_case: 15,
    unit_weight_kg: 1.5, origin: 'Italy', conservation: 'frais', min_stock_alert: 5,
    wholesale_price: 71.25, suggested_retail_price: 99.00
  }
];

// Real Partners
export const MOCK_PARTNERS: Partner[] = [
  { id: 'sup1', name: 'Casa Folino Srl', type: PartnerType.SUPPLIER, country: 'Italy', currency: 'EUR' },
  { id: 'sup2', name: 'Corilu', type: PartnerType.SUPPLIER, country: 'Italy', currency: 'EUR' },
  { id: 'cli1', name: 'Maison(House)', type: PartnerType.CLIENT, country: 'Canada', currency: 'CAD', city: 'Quebec' },
  { id: 'cli2', name: 'Les Saveurs Il Giretto', type: PartnerType.CLIENT, country: 'Canada', currency: 'CAD', address: '2841 Avenue Des Aristocrates', city: 'Laval, Québec', postal_code: 'H7E 0H3' },
  { id: 'cli3', name: 'Eataly Toronto LP', type: PartnerType.CLIENT, country: 'Canada', currency: 'CAD', address: '43 West 23rd Street 7 th Floor', city: 'New York, NY', postal_code: '10010' }, 
  { id: 'cli4', name: 'Fruiterie Milano', type: PartnerType.CLIENT, country: 'Canada', currency: 'CAD', address: '6862 St. Laurent', city: 'Montreal, Quebec', postal_code: 'H2S 3C7' },
];

// Purchase Orders (Aggregated from IDPO lines)
export const MOCK_POS: PurchaseOrder[] = [
  {
    id: 'po-32215', po_number: '32215', supplier_id: 'sup1', status: POStatus.RECEIVED,
    order_date: '2025-10-01', total_fob: 4500, currency_rate: 1.10, incoterm: 'EXW',
    items: [
      { id: 'IDPO001', po_id: 'po-32215', product_id: 'p1', quantity_cases: 2, price_unit: 22.50 }
    ]
  },
  {
    id: 'po-32216', po_number: '32216', supplier_id: 'sup1', status: POStatus.ORDERED,
    order_date: '2025-06-26', total_fob: 120, currency_rate: 1.10, incoterm: 'EXW',
    items: [
      { id: 'IDPO002', po_id: 'po-32216', product_id: 'p2', quantity_cases: 2, price_unit: 60.00 }
    ]
  },
  {
    id: 'po-32218', po_number: '32218', supplier_id: 'sup1', status: POStatus.PARTIAL,
    order_date: '2025-06-26', total_fob: 1400, currency_rate: 1.10, incoterm: 'EXW',
    items: [
      { id: 'IDPO004', po_id: 'po-32218', product_id: 'p4', quantity_cases: 2, price_unit: 60 }, // Almond
      { id: 'IDPO005', po_id: 'po-32218', product_id: 'p5', quantity_cases: 2, price_unit: 60 }, // Dark Choc
    ]
  },
  // New PO for Corilu products
  {
    id: 'po-121329', po_number: '121329', supplier_id: 'sup2', status: POStatus.IN_TRANSIT,
    order_date: '2025-11-12', total_fob: 850, currency_rate: 1.10, incoterm: 'EXW',
    expected_arrival: '2025-12-11',
    items: [
      { id: 'pol-1', po_id: 'po-121329', product_id: 'p_hazelnut_180', quantity_cases: 10, price_unit: 15.00 },
      { id: 'pol-2', po_id: 'po-121329', product_id: 'p_hazelnut_spread', quantity_cases: 10, price_unit: 18.00 }
    ]
  }
];

// Batches derived from Received PO items
export const MOCK_BATCHES: Batch[] = [
  { 
    id: 'b1', product_id: 'p1', supplier_batch_number: 'LOT-32215-01', internal_batch_number: 'INT-25-001', 
    quantity_initial: 2, quantity_current: 2, dlc: '2026-10-01', reception_date: '2025-10-01', 
    landed_cost_unit: 24.50, location_zone: 'A-01', status: BatchStatus.AVAILABLE 
  },
  { 
    id: 'b2', product_id: 'p3', supplier_batch_number: 'LOT-32217-03', internal_batch_number: 'INT-25-003', 
    quantity_initial: 2, quantity_current: 1, dlc: '2026-06-26', reception_date: '2025-06-26', 
    landed_cost_unit: 65.00, location_zone: 'B-02', status: BatchStatus.AVAILABLE 
  },
  // Added Burrata stock
  { 
    id: 'b3', product_id: 'p_burrata', supplier_batch_number: 'LOT-FR-99', internal_batch_number: 'INT-25-099', 
    quantity_initial: 10, quantity_current: 5, dlc: '2025-12-25', reception_date: '2025-12-10', 
    landed_cost_unit: 65.00, location_zone: 'FRIDGE-01', status: BatchStatus.AVAILABLE 
  }
];

// Sales Orders (Bookings)
export const MOCK_SALES: SalesOrder[] = [
  {
    id: 'so-1', so_number: 'BK-2025-889', client_id: 'cli2', status: SOStatus.INVOICED,
    order_date: '2025-06-30', total_amount: 540, currency: 'CAD', invoice_number: 'INV-2025-001',
    items: [
      { id: 'si-1', so_id: 'so-1', product_id: 'p1', quantity: 10, unit_price: 54.00 }
    ]
  },
  {
    id: 'so-2', so_number: 'BK-2025-890', client_id: 'cli3', status: SOStatus.BOL_GENERATED,
    order_date: '2025-07-15', total_amount: 1200, currency: 'CAD',
    items: [
       { id: 'si-2', so_id: 'so-2', product_id: 'p2', quantity: 15, unit_price: 80.00 }
    ]
  },
  // Invoice 202490
  {
    id: 'so-202490', so_number: 'BK-999', client_id: 'cli2', status: SOStatus.INVOICED,
    order_date: '2025-12-16', total_amount: 356.50, currency: 'CAD', invoice_number: '202490',
    items: [
      { id: 'si-202490-1', so_id: 'so-202490', product_id: 'p_mozza', quantity: 1, unit_price: 76.50 },
      { id: 'si-202490-2', so_id: 'so-202490', product_id: 'p_burrata', quantity: 2, unit_price: 71.25 }
    ]
  }
];

// Mock Invoices (AR Aging)
export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv-1', invoice_number: '202448', client_id: 'cli4', so_id: 'so-old-1',
    issue_date: '2025-10-02', due_date: '2025-11-02', amount: 1212.00, balance: 1212.00, status: 'unpaid'
  },
  {
    id: 'inv-2', invoice_number: '202449', client_id: 'cli2', so_id: 'so-old-2',
    issue_date: '2025-10-10', due_date: '2025-11-10', amount: 498.00, balance: 498.00, status: 'unpaid'
  },
  {
    id: 'inv-3', invoice_number: '202450', client_id: 'cli3', so_id: 'so-old-3',
    issue_date: '2025-10-15', due_date: '2025-11-15', amount: 442.65, balance: 442.65, status: 'unpaid'
  },
  {
    id: 'inv-202490', invoice_number: '202490', client_id: 'cli2', so_id: 'so-202490',
    issue_date: '2025-12-16', due_date: '2026-01-15', amount: 356.50, balance: 356.50, status: 'unpaid'
  }
];