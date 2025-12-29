// Unify both "type" and "value" uses by making sellDeatils a class.
// This keeps your existing `new sellDeatils(...)` working.

export class sellDeatils {
  date?: string;            // ISO string
  transactionId?: string;
  name?: string;
  phoneNumber?: string;

  id?: number;     
           // product id or line id
  category?: string;
  brand?: string;
  model?: string;

  quantity?: number;        // numeric
  discountedPrice?: number; // numeric (preferred if present)
  sellPrice?: number;       // numeric (fallback field in some data)
  location?: string;        // present in some flows

  constructor(...args: any[]) {
    // Support object initializer: new sellDeatils({ ... })
    if (args.length === 1 && args[0] && typeof args[0] === 'object') {
      Object.assign(this, normalize(args[0]));
      return;
    }
    // Legacy positional usage: try to map common orders safely.
    // We'll accept up to 11 args and coerce types.
    const [
      id,
      category,
      brand,
      model,
      quantity,
      sellPrice,
      discountedPrice,
      date,
      transactionId,
      name,
      phoneNumber
    ] = args;

    if (id !== undefined) this.id = toNum(id);
    if (category !== undefined) this.category = String(category ?? '');
    if (brand !== undefined) this.brand = String(brand ?? '');
    if (model !== undefined) this.model = String(model ?? '');
    if (quantity !== undefined) this.quantity = toNum(quantity);
    if (sellPrice !== undefined) this.sellPrice = toNum(sellPrice);
    if (discountedPrice !== undefined) this.discountedPrice = toNum(discountedPrice);
    if (date !== undefined) this.date = String(date ?? '');
    if (transactionId !== undefined) this.transactionId = String(transactionId ?? '');
    if (name !== undefined) this.name = String(name ?? '');
    if (phoneNumber !== undefined) this.phoneNumber = String(phoneNumber ?? '');
  }
}

// Keep these helpers/classes you’re already importing elsewhere.
export class SaleItem {
  productId: number;
  category: string;
  brand: string;
  model: string;
  quantity: number;
  sellPrice: number;
  discountedPrice?: number;

  constructor(
    productId: number,
    category: string,
    brand: string,
    model: string,
    quantity: string | number,
    sellPrice: string | number,
    discountedPrice?: string | number
  ) {
    this.productId = productId;
    this.category = category;
    this.brand = brand;
    this.model = model;
    this.quantity = toNum(quantity);
    this.sellPrice = toNum(sellPrice);
    this.discountedPrice = discountedPrice !== undefined ? toNum(discountedPrice) : undefined;
  }
}

export class Sale {
  transactionId: string;
  name: string;
  phoneNumber: string;
  date?: string;
  items: SaleItem[];

  constructor(
    transactionId: string,
    name: string,
    phoneNumber: string,
    items: SaleItem[],
    date?: string
  ) {
    this.transactionId = transactionId;
    this.name = name;
    this.phoneNumber = phoneNumber;
    this.items = items;
    this.date = date;
  }
}

function toNum(v: string | number | null | undefined): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = Number((v ?? '').toString().replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

function normalize(obj: any): any {
  const o = { ...obj };
  if (o.quantity !== undefined) o.quantity = toNum(o.quantity);
  if (o.discountedPrice !== undefined) o.discountedPrice = toNum(o.discountedPrice);
  if (o.sellPrice !== undefined) o.sellPrice = toNum(o.sellPrice);
  return o;
}
