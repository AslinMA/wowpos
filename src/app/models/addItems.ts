export class addItems {
  id: number;
  date: string;
  category: string;
  brand: string;
  model: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  location: string;
  isActive?: boolean;

  constructor(
    id: number,
    date: string,
    category: string,
    brand: string,
    model: string,
    quantity: string | number,
    buyPrice: string | number,
    sellPrice: string | number,
    location: string,
    isActive: boolean = true
  ) {
    this.id = id;
    this.date = date;
    this.category = category;
    this.brand = brand;
    this.model = model;
    this.quantity = coerceNumber(quantity);
    this.buyPrice = coerceNumber(buyPrice);
    this.sellPrice = coerceNumber(sellPrice);
    this.location = location;
    this.isActive = isActive;
  }
}

function coerceNumber(v: string | number | null | undefined): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = Number((v ?? '').toString().replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}
