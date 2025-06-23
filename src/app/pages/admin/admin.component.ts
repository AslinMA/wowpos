import { Component, OnInit } from '@angular/core';
import { sellDeatils } from '../../models/sellDeatils';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData } from 'chart.js';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {



  totals: { [product: string]: number } = {};

  dattoDaytotalsByCatogory: { [product: string]: number } = {};

  totalAmmuntOfDayByDay: { [product: string]: number } = {};


  // Data properties
  salesDetails: sellDeatils[] = [];
  filteredSalesDetails: sellDeatils[] = [];
  paginatedSalesDetails: sellDeatils[] = [];

  // Search and filter properties
  todayRevenue:number=0;
  searchTerm: string = '';
  selectedBrands: string[] = [];
  selectedCategories: string[] = [];
  selectedModels: string[] = [];
  selectedDateRange = { start: '', end: '' };
  selectedPriceRange = { min: 0, max: 999999 };

  // Available filter options
  availableBrands: string[] = [];
  availableCategories: string[] = [];
  availableModels: string[] = [];

  // Dropdown states
  isActionsDropdownOpen = false;
  isBrandFilterDropdownOpen = false;
  isCategoryFilterDropdownOpen = false;
  isModelFilterDropdownOpen = false;
  isDateFilterDropdownOpen = false;
  isPriceFilterDropdownOpen = false;

  // Pagination properties
  currentSalesPage = 1;
  itemsPerPage = 10;
  totalSalesItems = 0;
  totalSalesPages = 0;

  public chartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  public chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false  // Hide legend (small colored box with label)
      }
    }
  };

  public chartType: 'bar' = 'bar';

  constructor(

    private http: HttpClient,

  ) { }



  ngOnInit(): void {
    this.loadSalesDetails();
    this.updateFilterOptions();
    this.applyFilters();


  }

  // Load sales data (replace with your actual data service)
  loadSalesDetails(): void {
    // Sample data - replace with your actual data loading logic
    this.http.get<sellDeatils[]>("http://localhost:8080/saler-retrive")
      .subscribe(
        data => {
          this.salesDetails = data;
          console.log(this.salesDetails);

          this.applyFilters();
          this.updateFilterOptions();
          this.updatePagination();

          this.totals = this.getTotalSoldByProduct();
          console.log(JSON.stringify(this.totals, null, 2));
          console.log(this.totals['Display']);

          const todaySalesByProduct = this.getTodaySalesByProduct();
          console.log('Today\'s sales by product:', todaySalesByProduct);

          this.totalAmmuntOfDayByDay = this.getTotalAmmountOfDayByDay();
          console.log(JSON.stringify(this.totalAmmuntOfDayByDay, null, 2));
          const labels = Object.keys(this.totalAmmuntOfDayByDay);
          const dataOfChart = labels.map(date => this.totalAmmuntOfDayByDay[date]);

          this.chartData = {
            labels,
            datasets: [
              { data: dataOfChart, label: 'sale' }
            ]
          };
          
        },
        error => {
          console.error("Error fetching products", error);
        }
      );
  }

  // Update available filter options based on current data
  updateFilterOptions(): void {
    this.availableBrands = [...new Set(this.salesDetails.map(item => item.brand).filter(brand => brand))];
    this.availableCategories = [...new Set(this.salesDetails.map(item => item.category).filter(category => category))];
    this.availableModels = [...new Set(this.salesDetails.map(item => item.model).filter(model => model))];
  }

  // Search functionality
  onSearch(): void {
    this.applyFilters();
  }

  // Apply all filters
  applyFilters(): void {
    this.filteredSalesDetails = this.salesDetails.filter(sale => {
      // Search filter
      const searchMatch = !this.searchTerm ||
        sale.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        sale.category.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        sale.brand.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        sale.model.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        sale.transactionId.toLowerCase().includes(this.searchTerm.toLowerCase());

      // Brand filter
      const brandMatch = this.selectedBrands.length === 0 || this.selectedBrands.includes(sale.brand);

      // Category filter
      const categoryMatch = this.selectedCategories.length === 0 || this.selectedCategories.includes(sale.category);

      // Model filter
      const modelMatch = this.selectedModels.length === 0 || this.selectedModels.includes(sale.model);

      // Date filter
      const dateMatch = this.isDateInRange(sale.date);

      // Price filter
      const priceMatch = this.isPriceInRange(parseFloat(sale.sellPrice));

      return searchMatch && brandMatch && categoryMatch && modelMatch && dateMatch && priceMatch;
    });

    this.totalSalesItems = this.filteredSalesDetails.length;
    this.totalSalesPages = Math.ceil(this.totalSalesItems / this.itemsPerPage);
    this.currentSalesPage = 1;
    this.updatePagination();
  }

  // Date range filter helper
  isDateInRange(dateString: string): boolean {
    if (!this.selectedDateRange.start && !this.selectedDateRange.end) {
      return true;
    }

    const saleDate = new Date(dateString);
    const startDate = this.selectedDateRange.start ? new Date(this.selectedDateRange.start) : null;
    const endDate = this.selectedDateRange.end ? new Date(this.selectedDateRange.end) : null;

    if (startDate && saleDate < startDate) {
      return false;
    }
    if (endDate && saleDate > endDate) {
      return false;
    }
    return true;
  }

  // Price range filter helper
  isPriceInRange(price: number): boolean {
    return price >= this.selectedPriceRange.min && price <= this.selectedPriceRange.max;
  }

  // Brand filter methods
  isBrandSelected(brand: string): boolean {
    return this.selectedBrands.includes(brand);
  }

  onBrandFilterChange(brand: string, event: any): void {
    if (event.target.checked) {
      this.selectedBrands.push(brand);
    } else {
      this.selectedBrands = this.selectedBrands.filter(b => b !== brand);
    }
    this.applyFilters();
  }

  // Category filter methods
  isCategorySelected(category: string): boolean {
    return this.selectedCategories.includes(category);
  }

  onCategoryFilterChange(category: string, event: any): void {
    if (event.target.checked) {
      this.selectedCategories.push(category);
    } else {
      this.selectedCategories = this.selectedCategories.filter(c => c !== category);
    }
    this.applyFilters();
  }

  // Model filter methods
  isModelSelected(model: string): boolean {
    return this.selectedModels.includes(model);
  }

  onModelFilterChange(model: string, event: any): void {
    if (event.target.checked) {
      this.selectedModels.push(model);
    } else {
      this.selectedModels = this.selectedModels.filter(m => m !== model);
    }
    this.applyFilters();
  }

  // Date filter methods
  applyDateFilter(): void {
    this.applyFilters();
  }

  clearDateFilter(): void {
    this.selectedDateRange = { start: '', end: '' };
    this.applyFilters();
  }

  // Price filter methods
  applyPriceFilter(): void {
    this.applyFilters();
  }

  clearPriceFilter(): void {
    this.selectedPriceRange = { min: 0, max: 999999 };
    this.applyFilters();
  }

  // Clear all filters
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedBrands = [];
    this.selectedCategories = [];
    this.selectedModels = [];
    this.selectedDateRange = { start: '', end: '' };
    this.selectedPriceRange = { min: 0, max: 999999 };
    this.applyFilters();
  }

  // Dropdown toggle methods
  toggleActionsDropdown(): void {
    this.isActionsDropdownOpen = !this.isActionsDropdownOpen;
  }

  toggleBrandFilterDropdown(): void {
    this.isBrandFilterDropdownOpen = !this.isBrandFilterDropdownOpen;
  }

  toggleCategoryFilterDropdown(): void {
    this.isCategoryFilterDropdownOpen = !this.isCategoryFilterDropdownOpen;
  }

  toggleModelFilterDropdown(): void {
    this.isModelFilterDropdownOpen = !this.isModelFilterDropdownOpen;
  }

  toggleDateFilterDropdown(): void {
    this.isDateFilterDropdownOpen = !this.isDateFilterDropdownOpen;
  }

  togglePriceFilterDropdown(): void {
    this.isPriceFilterDropdownOpen = !this.isPriceFilterDropdownOpen;
  }

  closeDropdowns(): void {
    this.isActionsDropdownOpen = false;
    this.isBrandFilterDropdownOpen = false;
    this.isCategoryFilterDropdownOpen = false;
    this.isModelFilterDropdownOpen = false;
    this.isDateFilterDropdownOpen = false;
    this.isPriceFilterDropdownOpen = false;
  }

  // Pagination methods
  updatePagination(): void {
    const startIndex = (this.currentSalesPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedSalesDetails = this.filteredSalesDetails.slice(startIndex, endIndex);
  }

  goToSalesPage(page: number): void {
    this.currentSalesPage = page;
    this.updatePagination();
  }

  goToPreviousSalesPage(): void {
    if (this.currentSalesPage > 1) {
      this.currentSalesPage--;
      this.updatePagination();
    }
  }

  goToNextSalesPage(): void {
    if (this.currentSalesPage < this.totalSalesPages) {
      this.currentSalesPage++;
      this.updatePagination();
    }
  }

  getSalesPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (this.totalSalesPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalSalesPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, this.currentSalesPage - 2);
      const endPage = Math.min(this.totalSalesPages, startPage + maxPagesToShow - 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  getCurrentSalesShowingRange(): { start: number, end: number } {
    const start = (this.currentSalesPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentSalesPage * this.itemsPerPage, this.totalSalesItems);
    return { start, end };
  }

  // Utility methods
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  exportSalesData(): void {
    // Implement export functionality (CSV, Excel, etc.)
    console.log('Exporting sales data...');
    // You can implement CSV export, PDF generation, etc. here
  }
  // Returns a map: { [productName: string]: totalQuantitySold }
  getTotalSoldByProduct(): { [product: string]: number } {

    this.salesDetails.forEach(sale => {
      // You can use sale.name, sale.model, or sale.category as the key
      const key = sale.category; // or sale.model, or sale.category
      if (!this.totals[key]) {
        this.totals[key] = 0;
      }
      this.totals[key] += Number(sale.quantity);
    });
    return this.totals;
  }
  // Returns a map: { [date: string]: totalQuantitySold }
  getTodaySalesByProduct(): { [product: string]: number } {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;


    this.salesDetails.forEach(sale => {
      const saleDate = sale.date.split('T')[0];
      if (saleDate === todayStr) {
        const productName = sale.category; // Adjust property name as per your model
        if (!this.dattoDaytotalsByCatogory[productName]) {
          this.dattoDaytotalsByCatogory[productName] = 0;
        }
        this.dattoDaytotalsByCatogory[productName] += Number(sale.quantity);
        this.todayRevenue=this.todayRevenue+Number(sale.discountedPrice);//today total revenue
           console.log("today"+this.todayRevenue);
           
      }
    });

    return this.dattoDaytotalsByCatogory;
  }

  getTotalAmmountOfDayByDay(): { [product: string]: number } {

    this.salesDetails.forEach(sale => {
      // You can use sale.name, sale.model, or sale.category as the key
      const key = sale.date; // or sale.model, or sale.category
      if (!this.totalAmmuntOfDayByDay[key]) {
        this.totalAmmuntOfDayByDay[key] = 0;
      }
      this.totalAmmuntOfDayByDay[key] += Number(sale.discountedPrice);
    });
    return this.totalAmmuntOfDayByDay;
  }

}
