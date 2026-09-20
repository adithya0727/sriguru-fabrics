export type Saree = {
  id: string;
  name: string;
  description: string;
  category: string;
  photos: string[];
  fabric: string | null;
  colors: string[];
  border: string | null;
  motifs: string[];
  tags: string[];
  has_blouse: boolean;
  occasion: string | null;
  cost_price: number | null;
  price: number;
  quantity_total: number;
  quantity_available: number;
  supplier: string | null;
  purchased_on: string | null;
  /** The bill this saree was bought on, when it was matched to one. */
  bill_id: string | null;
  /** The supplier's own wording for it on that bill, kept searchable so the
   *  words on the paper find the saree in the app. Family-only. */
  bill_item_name: string | null;
  low_confidence: string[];
  created_at: string;
  updated_at: string;
};

/** What a public page is allowed to know. No cost_price, no supplier. */
export type PublicSaree = Omit<
  Saree,
  | 'cost_price'
  | 'supplier'
  | 'purchased_on'
  | 'quantity_total'
  | 'low_confidence'
  | 'bill_id'
  | 'bill_item_name'
>;

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  area: string | null;
  notes: string | null;
  created_at: string;
};

export type SaleChannel = 'home' | 'stall' | 'whatsapp' | 'reseller' | 'other';

export type Sale = {
  id: string;
  saree_id: string;
  customer_id: string | null;
  quantity: number;
  /** The asking price at the time of sale. */
  unit_price: number;
  /** What was actually charged, after any discount. */
  final_unit_price: number | null;
  discount_percent: number;
  /** The receipt written for the customer. Often filled in later. */
  receipt_number: string | null;
  customer_name: string | null;
  unit_cost: number | null;
  channel: SaleChannel;
  notes: string | null;
  sold_at: string;
};

/** A row of the Sales Book: a sale, with the saree details joined on.
 *  Profit is derived by the database, never stored, so it cannot drift. */
export type SaleRow = Sale & {
  margin: number;
  saree_name: string;
  category: string;
  supplier: string | null;
};

/** Everything the photo tagger tries to work out from the images. */
export type TaggedAttributes = {
  name: string;
  description: string;
  category: string;
  fabric: string;
  colors: string[];
  border: string;
  motifs: string[];
  tags: string[];
  has_blouse: boolean;
  occasion: string;
  low_confidence: string[];
};
