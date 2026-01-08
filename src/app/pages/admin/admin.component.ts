import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

// keep your original model import
import { sellDeatils } from '../../models/sellDeatils';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface WeeklyPoint { date: string; revenue: number; items: number; }
interface WeeklyTotal { 
  totalRevenue: number; 
  totalItems: number; 
  growthPercentage: number;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  // --- Top KPIs ---
  totalSalesThisWeek: number = 0;  // NEW: Weekly revenue from backend
  weeklyGrowth: number = 0;         // NEW: Week-over-week growth %
  totalSales: number = 0;           // count of orders/rows (or sum of quantities if you prefer)
  totalRevenue: number = 0;         // Rs. sum of discountedPrice
  profitMargin: number = 28;        // placeholder until COGS available
  todayRevenue: number = 0;

  // --- Cards data (keep names to match your template) ---
  totals: { [product: string]: number } = {};              // all-time by category (qty)
  dattoDaytotalsByCatogory: { [product: string]: number } = {}; // today by category (qty)
  totalAmmuntOfDayByDay: { [date: string]: number } = {}; // daily revenue time series

  // --- Tables state ---
  salesDetails: sellDeatils[] = [];
  filteredSalesDetails: sellDeatils[] = [];
  paginatedSalesDetails: sellDeatils[] = [];

  // --- Filters ---
  searchTerm: string = '';
  selectedBrands: string[] = [];
  selectedCategories: string[] = [];
  selectedModels: string[] = [];
  selectedDateRange = { start: '', end: '' };
  selectedPriceRange = { min: 0, max: 999999 };

  availableBrands: string[] = [];
  availableCategories: string[] = [];
  availableModels: string[] = [];

  // --- Dropdowns ---
  isActionsDropdownOpen = false;
  isBrandFilterDropdownOpen = false;
  isCategoryFilterDropdownOpen = false;
  isModelFilterDropdownOpen = false;
  isDateFilterDropdownOpen = false;
  isPriceFilterDropdownOpen = false;

  // --- Pagination ---
  currentSalesPage = 1;
  itemsPerPage = 10;
  totalSalesItems = 0;
  totalSalesPages = 0;
  

  // --- Daily Sales Chart (LINE) ---
public dailySalesChartData: ChartData<'line'> = {
  labels: [],
  datasets: []
};

public dailySalesChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += 'Rs. ' + context.parsed.y.toLocaleString();
          }
          return label;
        }
      }
    }
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: 'Date'
      },
      grid: {
        display: false
      }
    },
    y: {
      display: true,
      title: {
        display: true,
        text: 'Revenue (Rs.)'
      },
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return 'Rs. ' + value.toLocaleString();
        }
      }
    }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  }
};

  // --- Top Sales Chart (BAR) ---
public chartType: 'bar' = 'bar';
public chartData: ChartData<'bar'> = { labels: [], datasets: [] };
public chartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { x: { ticks: { autoSkip: true } }, y: { beginAtZero: true } }
};


  // --- Sales Report (shown when toggled) ---
  showSalesReport: boolean = false;
  salesChartData: ChartData<'line'> = { labels: [], datasets: [] };
  salesChartOptions: ChartOptions<'line'> = { responsive: true, maintainAspectRatio: false };
  categorySalesData: ChartData<'bar'> = { labels: [], datasets: [] };
  categorySalesOptions: ChartOptions<'bar'> = { responsive: true, maintainAspectRatio: false };
  productPerformanceData: ChartData<'radar'> = { labels: [], datasets: [] };
  productPerformanceOptions: ChartOptions<'radar'> = { responsive: true, maintainAspectRatio: false };

  constructor(private http: HttpClient, public router: Router) {}

  // ---------------- Lifecycle ---------------- //
  ngOnInit(): void {
    this.loadSalesDetails();
    this.loadWeeklySales();     // fills the top bar chart from backend
    this.loadWeeklyTotal();      // NEW: loads weekly total revenue & growth
  }

  // ---------------- Data Fetch ---------------- //
  private loadWeeklySales(): void {
    this.http.get<WeeklyPoint[]>(`${environment.apiUrl}/api/admin/metrics/weekly-sales`).subscribe({
      next: (rows) => {
        const labels = (rows || []).map(r => r.date);
        const data = (rows || []).map(r => r.revenue);
        this.chartData = { labels, datasets: [{ data, label: 'Revenue' }] };
      },
      error: (e) => {
        console.warn('weekly-sales failed; falling back to local compute', e);
        this.buildTopChartFromLocalIfNeeded();
      }
    });
  }

  // NEW: Load weekly total from backend
  private loadWeeklyTotal(): void {
    this.http.get<WeeklyTotal>(`${environment.apiUrl}/api/admin/metrics/weekly-sales`).subscribe({
      next: (data) => {
        this.totalSalesThisWeek = data.totalRevenue || 0;
        this.weeklyGrowth = data.growthPercentage || 0;
        console.log('Weekly total:', data);
      },
      error: (err) => {
        console.error('Error loading weekly total:', err);
        this.totalSalesThisWeek = 0;
        this.weeklyGrowth = 0;
      }
    });
  }

  loadSalesDetails(): void {
    this.http.get<sellDeatils[]>(`${environment.apiUrl}/api/saler-retrive`).subscribe({
      next: (data) => {
       this.salesDetails = (data || []);
        this.recomputeAll();
      },
      error: (err) => {
        console.error('Error fetching sales', err);
        this.salesDetails = [];
        this.recomputeAll();
      },
    });
  }

  // Recompute everything when raw data or filters change
  private recomputeAll(): void {
    this.updateFilterOptions();
    this.applyFilters();
    this.computeKPIsAndSeries();
    this.updatePagination();
    this.buildTopChartFromLocalIfNeeded();
  }

  addNewStock(): void { this.router.navigate(['/add-items']); }
  goToSalesReports(): void { this.router.navigate(['/sales-reports']); }
  goToNotification(): void { this.router.navigate(['/notification']); }

  // ---------------- Filters ---------------- //
  updateFilterOptions(): void {
    const uniq = (arr: (string | undefined | null)[]) => Array.from(new Set(arr.filter((v): v is string => !!v)));
    this.availableBrands = uniq(this.salesDetails.map((x) => x.brand));
    this.availableCategories = uniq(this.salesDetails.map((x) => x.category));
    this.availableModels = uniq(this.salesDetails.map((x) => x.model));
  }

  onSearch(): void { this.applyFilters(); }
  applyDateFilter(): void { this.applyFilters(); }
  clearDateFilter(): void { this.selectedDateRange = { start: '', end: '' }; this.applyFilters(); }
  applyPriceFilter(): void { this.applyFilters(); }
  clearPriceFilter(): void { this.selectedPriceRange = { min: 0, max: 999999 }; this.applyFilters(); }
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedBrands = [];
    this.selectedCategories = [];
    this.selectedModels = [];
    this.selectedDateRange = { start: '', end: '' };
    this.selectedPriceRange = { min: 0, max: 999999 };
    this.applyFilters();
  }

  isBrandSelected(brand: string): boolean { return this.selectedBrands.includes(brand); }
  onBrandFilterChange(brand: string, ev: any): void {
    this.selectedBrands = ev?.target?.checked
      ? [...this.selectedBrands, brand]
      : this.selectedBrands.filter((b) => b !== brand);
    this.applyFilters();
  }

  isCategorySelected(category: string): boolean { return this.selectedCategories.includes(category); }
  onCategoryFilterChange(category: string, ev: any): void {
    this.selectedCategories = ev?.target?.checked
      ? [...this.selectedCategories, category]
      : this.selectedCategories.filter((c) => c !== category);
    this.applyFilters();
  }

  isModelSelected(model: string): boolean { return this.selectedModels.includes(model); }
  onModelFilterChange(model: string, ev: any): void {
    this.selectedModels = ev?.target?.checked
      ? [...this.selectedModels, model]
      : this.selectedModels.filter((m) => m !== model);
    this.applyFilters();
  }

  private isDateInRange(dateString: string): boolean {
    if (!this.selectedDateRange.start && !this.selectedDateRange.end) return true;
    const saleDate = new Date(dateString);
    const start = this.selectedDateRange.start ? new Date(this.selectedDateRange.start) : null;
    const end = this.selectedDateRange.end ? new Date(this.selectedDateRange.end) : null;
    if (start && saleDate < start) return false;
    if (end && saleDate > end) return false;
    return true;
  }

  private isPriceInRange(price: number): boolean {
    return price >= this.selectedPriceRange.min && price <= this.selectedPriceRange.max;
  }

  applyFilters(): void {
    const q = (this.searchTerm || '').toLowerCase().trim();
    this.filteredSalesDetails = this.salesDetails.filter((sale) => {
      const name = (sale.name || '').toLowerCase();
      const category = (sale.category || '').toLowerCase();
      const brand = (sale.brand || '').toLowerCase();
      const model = (sale.model || '').toLowerCase();
      const txn = (sale.transactionId || '').toLowerCase();

      const searchMatch = !q || name.includes(q) || category.includes(q) || brand.includes(q) || model.includes(q) || txn.includes(q);
      const brandMatch = this.selectedBrands.length === 0 || (sale.brand && this.selectedBrands.includes(sale.brand));
      const categoryMatch = this.selectedCategories.length === 0 || (sale.category && this.selectedCategories.includes(sale.category));
      const modelMatch = this.selectedModels.length === 0 || (sale.model && this.selectedModels.includes(sale.model));
      const dateMatch = sale.date ? this.isDateInRange(sale.date) : true;
      const priceNum = sale.discountedPrice ?? (sale as any).sellPrice ?? 0;
      const priceMatch = this.isPriceInRange(Number(priceNum));

      return searchMatch && brandMatch && categoryMatch && modelMatch && dateMatch && priceMatch;
    });

    this.totalSalesItems = this.filteredSalesDetails.length;
    this.totalSalesPages = Math.ceil(this.totalSalesItems / this.itemsPerPage) || 1;
    this.currentSalesPage = 1;
    this.updatePagination();
  }

  // ---------------- KPIs + Series ---------------- //
 private computeKPIsAndSeries(): void {
  // reset
  this.totals = {};
  this.dattoDaytotalsByCatogory = {};
  this.totalAmmuntOfDayByDay = {};
  this.todayRevenue = 0;

  const todayStr = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
  let totalRevenue = 0;

  console.log('=== Computing KPIs ===');
  console.log('Total sales records:', this.salesDetails.length);

  for (const sale of this.salesDetails) {
    // FIX: Parse strings to numbers properly
    const qty = Number(sale.quantity) || 0;
    const discountedPrice = Number(sale.discountedPrice) || 0;
    const sellPrice = Number(sale.sellPrice) || 0;
    
    // Use discountedPrice if available, otherwise sellPrice
    const pricePerUnit = discountedPrice > 0 ? discountedPrice : sellPrice;
    
    // Calculate total revenue for this sale (price * quantity)
    const saleRevenue = pricePerUnit * qty;
    
    const category = sale.category || 'Unknown';

    console.log(`Sale: ${sale.name}, Price: ${pricePerUnit}, Qty: ${qty}, Revenue: ${saleRevenue}`);

    // all-time by category (qty)
    this.totals[category] = (this.totals[category] || 0) + qty;

    // today by category (qty) + today revenue
    const saleDateStr = (sale.date || '').split('T')[0];
    if (saleDateStr === todayStr) {
      this.dattoDaytotalsByCatogory[category] = (this.dattoDaytotalsByCatogory[category] || 0) + qty;
      this.todayRevenue += saleRevenue;
    }

    // day-by-day revenue series
    const key = sale.date ? new Date(sale.date).toISOString().slice(0, 10) : 'Unknown';
    this.totalAmmuntOfDayByDay[key] = (this.totalAmmuntOfDayByDay[key] || 0) + saleRevenue;

    totalRevenue += saleRevenue;
  }

  // Set top KPIs
  this.totalRevenue = totalRevenue;
  this.totalSales = this.salesDetails.length; // or sum of qty if preferred
  
  console.log('=== Final KPIs ===');
  console.log('Total Revenue:', this.totalRevenue);
  console.log('Today Revenue:', this.todayRevenue);
  console.log('Total Sales:', this.totalSales);
}


  // If weekly API failed, build the chart from locally computed series
// Build both charts from locally computed series
private buildTopChartFromLocalIfNeeded(): void {
  if ((this.chartData.labels?.length || 0) > 0) {
    // Weekly chart already filled by API
  } else {
    // Fallback: build from local data
    const labels = Object.keys(this.totalAmmuntOfDayByDay).sort((a, b) => a.localeCompare(b));
    const dataOfChart = labels.map((d) => this.totalAmmuntOfDayByDay[d]);
    this.chartData = { labels, datasets: [{ data: dataOfChart, label: 'Revenue' }] };
  }

  // Always build daily sales chart from local data
  this.buildDailySalesChart();
}

// NEW METHOD: Build daily sales chart
private buildDailySalesChart(): void {
  // Get last 7 days
  const today = new Date();
  const last7Days: string[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    last7Days.push(date.toISOString().slice(0, 10));
  }

  // Prepare data for each day
  const revenueData: number[] = [];
  const itemsData: number[] = [];
  const labels: string[] = [];

  for (const dateStr of last7Days) {
    const revenue = this.totalAmmuntOfDayByDay[dateStr] || 0;
    
    // Count items sold on this day
    let itemCount = 0;
    for (const sale of this.salesDetails) {
      const saleDateStr = (sale.date || '').split('T')[0];
      if (saleDateStr === dateStr) {
        itemCount += Number(sale.quantity || 0);
      }
    }

    revenueData.push(revenue);
    itemsData.push(itemCount);
    
    // Format date for display (e.g., "Dec 1")
    const date = new Date(dateStr);
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    labels.push(formatted);
  }

  // Build chart data
  this.dailySalesChartData = {
    labels: labels,
    datasets: [
      {
        label: 'Revenue (Rs.)',
        data: revenueData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        yAxisID: 'y'
      },
      {
        label: 'Items Sold',
        data: itemsData,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        yAxisID: 'y1'
      }
    ]
  };

  // Update options to support dual Y-axis
  this.dailySalesChartOptions = {
    ...this.dailySalesChartOptions,
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date'
        },
        grid: {
          display: false
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Revenue (Rs.)'
        },
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return 'Rs. ' + value.toLocaleString();
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Items Sold'
        },
        beginAtZero: true,
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  console.log('Daily sales chart built:', this.dailySalesChartData);
}


  // ---------------- Sales Report toggle + charts ---------------- //
  viewSalesReport(): void {
    this.showSalesReport = !this.showSalesReport;
    if (!this.showSalesReport) return;

    // Line: revenue over time (filtered dataset)
    const byDate: Record<string, number> = {};
    for (const s of this.filteredSalesDetails) {
      const k = s.date ? new Date(s.date).toISOString().slice(0, 10) : 'Unknown';
      const rev = Number(s.discountedPrice ?? (s as any).sellPrice ?? 0);
      byDate[k] = (byDate[k] || 0) + rev;
    }
    const dates = Object.keys(byDate).sort();
    this.salesChartData = {
      labels: dates,
      datasets: [{ label: 'Revenue (Rs.)', data: dates.map((d) => byDate[d]), borderWidth: 2, fill: false }]
    };

    // Bar: category-wise revenue
    const byCat: Record<string, number> = {};
    for (const s of this.filteredSalesDetails) {
      const cat = s.category || 'Unknown';
      const rev = Number(s.discountedPrice ?? (s as any).sellPrice ?? 0);
      byCat[cat] = (byCat[cat] || 0) + rev;
    }
    const cats = Object.keys(byCat);
    this.categorySalesData = { labels: cats, datasets: [{ label: 'Category Sales (Rs.)', data: cats.map((c) => byCat[c]) }] };

    // Radar: quantity by category
    const byCatQty: Record<string, number> = {};
    for (const s of this.filteredSalesDetails) {
      const cat = s.category || 'Unknown';
      const qty = Number(s.quantity || 0);
      byCatQty[cat] = (byCatQty[cat] || 0) + qty;
    }
    const rcats = Object.keys(byCatQty);
    this.productPerformanceData = { labels: rcats, datasets: [{ label: 'Product Performance', data: rcats.map((c) => byCatQty[c]) }] };
  }

  // ---------------- Dropdowns ---------------- //
  toggleActionsDropdown(): void { this.isActionsDropdownOpen = !this.isActionsDropdownOpen; }
  toggleBrandFilterDropdown(): void { this.isBrandFilterDropdownOpen = !this.isBrandFilterDropdownOpen; }
  toggleCategoryFilterDropdown(): void { this.isCategoryFilterDropdownOpen = !this.isCategoryFilterDropdownOpen; }
  toggleModelFilterDropdown(): void { this.isModelFilterDropdownOpen = !this.isModelFilterDropdownOpen; }
  toggleDateFilterDropdown(): void { this.isDateFilterDropdownOpen = !this.isDateFilterDropdownOpen; }
  togglePriceFilterDropdown(): void { this.isPriceFilterDropdownOpen = !this.isPriceFilterDropdownOpen; }
  closeDropdowns(): void {
    this.isActionsDropdownOpen = false;
    this.isBrandFilterDropdownOpen = false;
    this.isCategoryFilterDropdownOpen = false;
    this.isModelFilterDropdownOpen = false;
    this.isDateFilterDropdownOpen = false;
    this.isPriceFilterDropdownOpen = false;
  }

  // ---------------- Pagination ---------------- //
  updatePagination(): void {
    const start = (this.currentSalesPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedSalesDetails = this.filteredSalesDetails.slice(start, end);
  }
  goToSalesPage(page: number): void { this.currentSalesPage = page; this.updatePagination(); }
  goToPreviousSalesPage(): void { if (this.currentSalesPage > 1) { this.currentSalesPage--; this.updatePagination(); } }
  goToNextSalesPage(): void { if (this.currentSalesPage < this.totalSalesPages) { this.currentSalesPage++; this.updatePagination(); } }
  getSalesPageNumbers(): number[] {
    const max = 5, pages: number[] = [];
    const total = this.totalSalesPages;
    if (total <= max) { for (let i = 1; i <= total; i++) pages.push(i); return pages; }
    const start = Math.max(1, this.currentSalesPage - 2);
    const end = Math.min(total, start + max - 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }
  getCurrentSalesShowingRange(): { start: number; end: number } {
    const start = (this.currentSalesPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentSalesPage * this.itemsPerPage, this.totalSalesItems);
    return { start, end };
  }

  // ---------------- Utils ---------------- //
  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  exportSalesData(): void {
    // Export *filtered* rows as CSV
    const rows = this.filteredSalesDetails;
    if (!rows.length) { console.warn('No data to export'); return; }

    const headers = [
      'date', 'transactionId', 'name', 'phoneNumber', 'id', 'category', 'brand', 'model', 'quantity', 'discountedPrice'
    ];

    const csv = [headers.join(',')]
      .concat(
        rows.map(r => [
          r.date ?? '',
          r.transactionId ?? '',
          r.name ?? '',
          r.phoneNumber ?? '',
          r.id ?? '',
          r.category ?? '',
          r.brand ?? '',
          r.model ?? '',
          String(r.quantity ?? 0),
          String(r.discountedPrice ?? (r as any).sellPrice ?? 0)
        ].map(v => String(v).replace(/,/g, ' ')).join(','))
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
