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
  unit_price: number;
  unit_cost: number | null;
  channel: SaleChannel;
  notes: string | null;
  sold_at: string;
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
