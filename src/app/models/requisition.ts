export interface RequirementLineDTO {
  date: string;        // ISO yyyy-MM-dd from your form
  category: string;
  brand: string;
  model: string;
  quantity: number;
  price?: number | null;
  notes?: string | null;
}

export interface RequisitionCreateDTO {
  requireDate: string;           // header date (you can use first line’s date)
  items: RequirementLineDTO[];
}
