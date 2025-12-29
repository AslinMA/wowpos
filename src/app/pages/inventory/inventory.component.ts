import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { addItems } from '../../models/addItems';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedDataService } from '../shared-data.service';
import { sharedCartDataService } from '../SharedCartDataService';

@Component({
  selector: 'app-inventory',
  imports: [FormsModule, HttpClientModule, CommonModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit {

  cartItems: any[] = [];

  items: addItems[] = [];

  products: addItems[] = [];
  filteredProducts: addItems[] = [];
  paginatedProducts: addItems[] = [];

  // Search functionality
  searchTerm: string = '';

  // Pagination variables
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;

  // Filter variables
  selectedBrands: string[] = [];
  availableBrands: string[] = [];

  // Dropdown states
  isFilterDropdownOpen: boolean = false;
  isActionsDropdownOpen: boolean = false;

  constructor(

    private http: HttpClient,
    private router: Router,
    private sharedService: SharedDataService,
    private sharedCartDataService:sharedCartDataService
  ) { }

  ngOnInit(): void {
    this.getProducts();
    this.cartItems = this.sharedCartDataService.getCartItems();
  }

  getProducts(): void {
    this.http.get<addItems[]>('/api/product')
      .subscribe(
        data => {
          this.products = data;

          this.filteredProducts = [...this.products];
          this.extractBrands();
          this.updatePagination();
        },
        error => {
          console.error("Error fetching products", error);
        }
      );
  }

  // Extract unique brands for filter
  extractBrands(): void {
    const brands = [...new Set(this.products.map(product => product.brand))];
    this.availableBrands = brands.filter(brand => brand); // Remove null/undefined values
  }

  // Search functionality
  onSearch(): void {
    this.currentPage = 1; // Reset to first page when searching
    this.applyFilters();
  }

  // Filter functionality
  onBrandFilterChange(brand: string, event: any): void {
    if (event.target.checked) {
      this.selectedBrands.push(brand);
    } else {
      this.selectedBrands = this.selectedBrands.filter(b => b !== brand);
    }
    this.currentPage = 1; // Reset to first page when filtering
    this.applyFilters();
  }

  // Apply all filters (search + brand filter)
  applyFilters(): void {
    let filtered = [...this.products];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.category?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        product.model?.toLowerCase().includes(searchLower) ||
        product.location?.toLowerCase().includes(searchLower)
      );
    }

    // Apply brand filter
    if (this.selectedBrands.length > 0) {
      filtered = filtered.filter(product =>
        this.selectedBrands.includes(product.brand)
      );
    }

    this.filteredProducts = filtered;
    this.updatePagination();
  }

  // Pagination functionality
  updatePagination(): void {
    this.totalItems = this.filteredProducts.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.updatePaginatedProducts();
  }

  updatePaginatedProducts(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  // Pagination controls
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedProducts();
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedProducts();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedProducts();
    }
  }

  // Get page numbers for pagination display
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  // Get current showing range
  getCurrentShowingRange(): { start: number, end: number } {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    return { start, end };
  }

  // Dropdown toggle functions
  toggleFilterDropdown(): void {
    this.isFilterDropdownOpen = !this.isFilterDropdownOpen;
    if (this.isFilterDropdownOpen) {
      this.isActionsDropdownOpen = false;
    }
  }

  toggleActionsDropdown(): void {
    this.isActionsDropdownOpen = !this.isActionsDropdownOpen;
    if (this.isActionsDropdownOpen) {
      this.isFilterDropdownOpen = false;
    }
  }

  // Close dropdowns when clicking outside
  closeDropdowns(): void {
    this.isFilterDropdownOpen = false;
    this.isActionsDropdownOpen = false;
  }

  // Check if brand is selected
  isBrandSelected(brand: string): boolean {
    return this.selectedBrands.includes(brand);
  }

  // Clear all filters
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedBrands = [];
    this.currentPage = 1;
    this.applyFilters();
  }

  goToAddItems(): void {
    this.router.navigate(['/add-items']);
  }

  goToSelling(items: addItems): void {
  if (items.quantity === 0) {
    alert('This item is out of stock and cannot be sold.');
    return;
  }
  
  if (items.quantity < 3) {
    const confirmed = window.confirm(`Warning: Only ${items.quantity} item(s) remaining. Do you want to proceed with the sale?`);
    if (!confirmed) {
      return;
    }
  }
  
  this.sharedService.setData(items);
  this.router.navigate(['/selling']);
}

  confirmAddToCart(item: addItems): void {
  if (item.quantity === 0) {
    alert('This item is out of stock and cannot be added to cart.');
    return;
  }
  
  if (item.quantity < 3) {
    const confirmed = window.confirm(`Warning: Only ${item.quantity} item(s) remaining. Do you want to add "${item.model}" to the cart?`);
    if (!confirmed) {
      return;
    }
  } else {
    const confirmed = window.confirm(`Do you want to add "${item.model}" to the cart?`);
    if (!confirmed) {
      return;
    }
  }
  
  this.sharedCartDataService.addToCart(item);
  const cartItems = this.sharedCartDataService.getCartItems();
  alert('Item added to cart!');
}
  goToCart(): void {
  this.router.navigate(['/cart']);  
}

openRestockPrompt(item: addItems): void {
  const input = window.prompt(
    `Enter quantity to add for "${item.model}" (current: ${item.quantity})`,
    '1'
  );
  if (!input) { return; }

  const qty = Number(input);
  if (isNaN(qty) || qty <= 0) {
    alert('Please enter a valid positive number.');
    return;
  }

  this.restockItem(item, qty);
}

restockItem(item: addItems, qty: number): void {
  this.http.post(`http://localhost:8080/api/product/${item.id}/restock?qty=${qty}`, {})
    .subscribe({
      next: () => {
        item.quantity = (item.quantity || 0) + qty;
        this.applyFilters();
        alert('Stock updated successfully.');
      },
      error: err => {
        console.error('Error restocking', err);
        alert(err.error?.message || 'Failed to restock item.');
      }
    });
}



}