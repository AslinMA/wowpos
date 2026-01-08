import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Product {
  id: number;
  category: string;
  brand: string;
  model: string;
  quantity: number;
  buyPrice: number;
}

interface Damage {
  damageId?: number;
  damageDate: string;
  productId: number;
  category: string;
  brand: string;
  model: string;
  quantity: number;
  damageType: string;
 damageReason: string; 
  buyPrice: number;
  lossAmount: number;
}

@Component({
  selector: 'app-damage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './damage.component.html',
})
export class DamageComponent implements OnInit {
  // Form data
  selectedProductId: number | null = null;
  quantity: number = 1;
  damageType: string = 'Broken Screen';
  description: string = '';

  // Product list
  products: Product[] = [];
  selectedProduct: Product | null = null;

  // Damage records
  damageRecords: Damage[] = [];

  // Pagination
  page = 1;
  pageSize = 10;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadDamageRecords();
  }

  loadProducts(): void {
    this.http.get<Product[]>('/api/product').subscribe({
      next: (data) => {
        this.products = data;
      },
      error: (e) => console.error('Failed to load products', e),
    });
  }

  loadDamageRecords(): void {
    this.http.get<Damage[]>('/api/damage').subscribe({
      next: (data) => {
        this.damageRecords = data;
      },
      error: (e) => console.error('Failed to load damage records', e),
    });
  }

  onProductChange(): void {
    this.selectedProduct = this.products.find(
      (p) => p.id === Number(this.selectedProductId)
    ) || null;
  }

  calculateLoss(): number {
    if (!this.selectedProduct) return 0;
    return this.selectedProduct.buyPrice * this.quantity;
  }

  submitDamage(): void {
    if (!this.selectedProduct) {
      alert('Please select a product');
      return;
    }

    if (this.quantity > this.selectedProduct.quantity) {
      alert('Quantity exceeds available stock!');
      return;
    }

    const damage: Damage = {
      damageDate: new Date().toISOString(),
      productId: this.selectedProduct.id,
      category: this.selectedProduct.category,
      brand: this.selectedProduct.brand,
      model: this.selectedProduct.model,
      quantity: this.quantity,
      damageType: this.damageType,
      damageReason: this.description,
      buyPrice: this.selectedProduct.buyPrice,
      lossAmount: this.calculateLoss(),
    };

    this.http.post(`${environment.apiUrl}/api/damage`, damage).subscribe({
  next: () => {
    alert('Damage recorded successfully!');
    this.resetForm();
    this.loadProducts();
    this.loadDamageRecords();
  },
  error: (e) => {
    console.error('Full error object:', e);
    console.error('Error status:', e.status);
    console.error('Error message:', e.error);
    alert('Failed to record damage: ' + (e.error?.error || e.message));
  },
});

  }

  resetForm(): void {
    this.selectedProductId = null;
    this.selectedProduct = null;
    this.quantity = 1;
    this.damageType = 'Broken Screen';
    this.description = '';
  }

  pagedRecords(): Damage[] {
    const start = (this.page - 1) * this.pageSize;
    return this.damageRecords.slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.damageRecords.length / this.pageSize));
  }

  prevPage(): void {
    this.page = Math.max(1, this.page - 1);
  }

  nextPage(): void {
    this.page = Math.min(this.totalPages(), this.page + 1);
  }

  getTotalLoss(): number {
    return this.damageRecords.reduce((sum, r) => sum + r.lossAmount, 0);
  }
}
