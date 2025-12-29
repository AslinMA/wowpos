import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Sale {
  transactionId: string;
  customerName: string;
  customerPhone: string;
  saleDate: string;
  category: string;
  brand: string;
  model: string;
  quantity: number;
  sellPrice: number;
  warrantyPeriod: string;
}

interface Product {
  id: number;
  category: string;
  brand: string;
  model: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
}

interface ReturnRecord {
  returnId?: number;
  returnDate: string;
  saleTransactionId: string;
  originalSaleDate: string;
  customerName: string;
  customerPhone: string;
  
  returnedCategory: string;
  returnedBrand: string;
  returnedModel: string;
  returnedQuantity: number;
  
  replacementProductId: number;
  replacementCategory: string;
  replacementBrand: string;
  replacementModel: string;
  
  warrantyPeriod: string;
  withinWarranty: boolean;
  claimType: string;
  lossAmount: number;
  
  notes: string;
}

@Component({
  selector: 'app-return',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './return.component.html',
})
export class ReturnComponent implements OnInit {
  // Search
  searchTransactionId: string = '';
  selectedSale: Sale | null = null;
  warrantyStatus: { valid: boolean; daysRemaining: number; message: string } | null = null;

  // Products for replacement
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedReplacementId: number | null = null;

  // Return form
  claimType: string = 'Supplier Claim';
  notes: string = '';

  // Return records
  returnRecords: ReturnRecord[] = [];

  // Pagination
  page = 1;
  pageSize = 10;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadReturnRecords();
  }

  loadProducts(): void {
    this.http.get<Product[]>('/api/product').subscribe({
      next: (data) => {
        this.products = data;
      },
      error: (e) => console.error('Failed to load products', e),
    });
  }

  loadReturnRecords(): void {
    this.http.get<ReturnRecord[]>('/api/return').subscribe({
      next: (data) => {
        this.returnRecords = data;
      },
      error: (e) => console.error('Failed to load return records', e),
    });
  }

searchSale(): void {
  if (!this.searchTransactionId.trim()) {
    alert('Please enter Phone Number, Name, or Transaction ID');
    return;
  }

  console.log('🔍 Searching for:', this.searchTransactionId);

  // Use new search endpoint
  this.http.get<any>(`/api/sale/search?query=${encodeURIComponent(this.searchTransactionId)}`).subscribe({
    next: (data) => {
      console.log('Search results:', data);
      
      // If multiple results, show selection dialog
      if (Array.isArray(data) && data.length > 1) {
        this.handleMultipleResults(data);
      } else if (Array.isArray(data) && data.length === 1) {
        // Single result
        this.selectedSale = data[0];
        this.checkWarranty();
        this.filterReplacementProducts();
      } else if (!Array.isArray(data)) {
        // Single sale object (from old endpoint)
        this.selectedSale = data;
        this.checkWarranty();
        this.filterReplacementProducts();
      }
    },
    error: (e) => {
      console.error('Sale not found', e);
      alert('No sales found for: ' + this.searchTransactionId);
      this.selectedSale = null;
      this.warrantyStatus = null;
    },
  });
}

// Handle multiple search results
handleMultipleResults(sales: Sale[]): void {
  let message = 'Multiple sales found. Select one:\n\n';
  
  sales.forEach((sale, index) => {
    message += `${index + 1}. ${sale.transactionId}\n`;
    message += `   Customer: ${sale.customerName}\n`;
    message += `   Product: ${sale.brand} ${sale.model}\n`;
    message += `   Date: ${new Date(sale.saleDate).toLocaleDateString()}\n\n`;
  });
  
  const selection = prompt(message + 'Enter number (1-' + sales.length + '):');
  
  if (selection) {
    const index = parseInt(selection) - 1;
    if (index >= 0 && index < sales.length) {
      this.selectedSale = sales[index];
      this.checkWarranty();
      this.filterReplacementProducts();
    } else {
      alert('Invalid selection');
    }
  }
}


  checkWarranty(): void {
    if (!this.selectedSale) return;

    const saleDate = new Date(this.selectedSale.saleDate);
    const today = new Date();
    const daysSinceSale = Math.floor((today.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));

    let warrantyDays = 0;
    switch (this.selectedSale.warrantyPeriod) {
      case '1 Month':
        warrantyDays = 30;
        break;
      case '3 Months':
        warrantyDays = 90;
        break;
      case '1 Year':
        warrantyDays = 365;
        break;
      case 'No Warranty':
      default:
        warrantyDays = 0;
        break;
    }

    const daysRemaining = warrantyDays - daysSinceSale;
    const valid = daysRemaining > 0;

    this.warrantyStatus = {
      valid,
      daysRemaining: Math.max(0, daysRemaining),
      message: valid
        ? `✅ Valid - ${daysRemaining} days remaining`
        : warrantyDays === 0
        ? '❌ No Warranty'
        : `❌ Expired ${Math.abs(daysRemaining)} days ago`,
    };
  }

  filterReplacementProducts(): void {
    if (!this.selectedSale) {
      this.filteredProducts = [];
      return;
    }

    // Filter products matching same category, brand, model
    this.filteredProducts = this.products.filter(
      (p) =>
        p.category === this.selectedSale!.category &&
        p.brand === this.selectedSale!.brand &&
        p.model === this.selectedSale!.model &&
        p.quantity > 0
    );
  }

  calculateLoss(): number {
    if (!this.selectedSale || this.claimType === 'Supplier Claim') return 0;

    const product = this.products.find((p) => p.id === this.selectedReplacementId);
    if (!product) return 0;

    return product.buyPrice * this.selectedSale.quantity;
  }

  submitReturn(): void {
    if (!this.selectedSale) {
      alert('Please search and select a sale transaction');
      return;
    }

    if (!this.warrantyStatus?.valid) {
      const confirm = window.confirm(
        'This item is not within warranty period. Do you still want to process the return?'
      );
      if (!confirm) return;
    }

    if (!this.selectedReplacementId) {
      alert('Please select a replacement product');
      return;
    }

    const replacement = this.products.find((p) => p.id === this.selectedReplacementId);
    if (!replacement) {
      alert('Invalid replacement product');
      return;
    }

    const returnRecord: ReturnRecord = {
      returnDate: new Date().toISOString(),
      saleTransactionId: this.selectedSale.transactionId,
      originalSaleDate: this.selectedSale.saleDate,
      customerName: this.selectedSale.customerName,
      customerPhone: this.selectedSale.customerPhone,

      returnedCategory: this.selectedSale.category,
      returnedBrand: this.selectedSale.brand,
      returnedModel: this.selectedSale.model,
      returnedQuantity: this.selectedSale.quantity,

      replacementProductId: replacement.id,
      replacementCategory: replacement.category,
      replacementBrand: replacement.brand,
      replacementModel: replacement.model,

      warrantyPeriod: this.selectedSale.warrantyPeriod,
      withinWarranty: this.warrantyStatus?.valid || false,
      claimType: this.claimType,
      lossAmount: this.calculateLoss(),

      notes: this.notes,
    };

    this.http.post('/api/return', returnRecord).subscribe({
      next: () => {
        alert('Return processed successfully!');
        this.resetForm();
        this.loadProducts();
        this.loadReturnRecords();
      },
      error: (e) => {
        console.error('Failed to process return', e);
        alert('Failed to process return');
      },
    });
  }

  resetForm(): void {
    this.searchTransactionId = '';
    this.selectedSale = null;
    this.warrantyStatus = null;
    this.selectedReplacementId = null;
    this.filteredProducts = [];
    this.claimType = 'Supplier Claim';
    this.notes = '';
  }

  // Pagination
  pagedRecords(): ReturnRecord[] {
    const start = (this.page - 1) * this.pageSize;
    return this.returnRecords.slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.returnRecords.length / this.pageSize));
  }

  prevPage(): void {
    this.page = Math.max(1, this.page - 1);
  }

  nextPage(): void {
    this.page = Math.min(this.totalPages(), this.page + 1);
  }

  getTotalLoss(): number {
    return this.returnRecords.reduce((sum, r) => sum + r.lossAmount, 0);
  }

  getSupplierClaims(): number {
    return this.returnRecords.filter((r) => r.claimType === 'Supplier Claim').length;
  }

  getMyLosses(): number {
    return this.returnRecords.filter((r) => r.claimType === 'My Loss').length;
  }
}
