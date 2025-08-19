import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartData, ChartOptions } from 'chart.js';

// Matches org.kmaihome.pos.models.saleDetailsForDisaply
interface BackendSaleRow {
  id?: number;
  saleId?: number;
  transactionId?: string;
  name?: string;
  phoneNumber?: string;
  date: string;
  discountedPrice?: string;
  sellPrice?: string;
  category?: string;
  brand?: string;
  model?: string;
  quantity?: string;
}

// Normalized row
interface Row {
  date: string;              // yyyy-MM-dd
  transactionId: string;
  name: string;
  phoneNumber: string;
  category: string;
  brand: string;
  model: string;
  qty: number;
  sell: number;
  discounted: number;
  net: number;               // (discounted || sell)
  gross: number;             // sell
  discountAmt: number;       // sell - discounted (if discounted present)
}

@Component({
  selector: 'app-sales-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './sales-reports.component.html',
})
export class SalesReportsComponent implements OnInit {
  constructor(private http: HttpClient) { }

  // Filters
  fromDate = '';
  toDate = '';
  categories: string[] = [];
  brands: string[] = [];
  models: string[] = [];
  search = '';

  // Facets from data
  allCategories: string[] = [];
  allBrands: string[] = [];
  allModels: string[] = [];

  // Data
  raw: BackendSaleRow[] = [];
  rows: Row[] = [];

  // Paging & sorting
  page = 1;
  pageSize = 10;
  sortKey: keyof Row | 'margin' = 'date';
  sortDir: 'asc' | 'desc' = 'desc';

  // KPIs
  grossSales = 0;
  netSales = 0;
  totalOrders = 0;
  unitsSold = 0;
  discounts = 0;
  taxes = 0;          // not provided yet
  aov = 0;
  grossMarginPct = 0; // requires COGS
  netProfit = 0;      // requires COGS/expenses

  // Charts
  revenueOverTimeData: ChartData<'line'> = { labels: [], datasets: [] };
  revenueOverTimeOptions: ChartOptions<'line'> = { responsive: true, maintainAspectRatio: false };

  unitsOverTimeData: ChartData<'line'> = { labels: [], datasets: [] };
  unitsOverTimeOptions: ChartOptions<'line'> = { responsive: true, maintainAspectRatio: false };

  categoryMixData: ChartData<'bar'> = { labels: [], datasets: [] };
  categoryMixOptions: ChartOptions<'bar'> = { responsive: true, maintainAspectRatio: false };

  brandMixData: ChartData<'bar'> = { labels: [], datasets: [] };
  brandMixOptions: ChartOptions<'bar'> = { responsive: true, maintainAspectRatio: false };

  ngOnInit(): void {
    this.fetch();
  }

  // ===== Backend =====
  fetch(): void {
    this.http.get<BackendSaleRow[]>('http://localhost:8080/saler-retrive').subscribe({
      next: (data) => {
        this.raw = data || [];
        this.rows = this.normalize(this.raw);
        this.buildFacets(this.rows);
        this.setPreset('last30'); // default
        this.applyAll();
      },
      error: (e) => {
        console.error('Failed to load /saler-retrive', e);
        this.raw = [];
        this.rows = [];
        this.buildFacets([]);
        this.applyAll();
      },
    });
  }

  normalize(list: BackendSaleRow[]): Row[] {
    const toNum = (v?: string) => {
      if (v == null) return 0;
      const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
      return isNaN(n) ? 0 : n;
    };
    const toDateStr = (v?: string) => {
      if (!v) return '';
      const d = new Date(v);
      if (isNaN(d.getTime())) return (v.split('T')[0] || v);
      return d.toISOString().slice(0, 10);
    };

    return (list || []).map((r) => {
      const qty = toNum(r.quantity);
      const sell = toNum(r.sellPrice);
      const disc = toNum(r.discountedPrice);
      const net = disc > 0 ? disc : sell;
      const gross = sell;
      const discountAmt = disc > 0 ? Math.max(0, sell - disc) : 0;

      return {
        date: toDateStr(r.date),
        transactionId: r.transactionId || '',
        name: r.name || '',
        phoneNumber: r.phoneNumber || '',
        category: r.category || 'Unknown',
        brand: r.brand || 'Unknown',
        model: r.model || 'Unknown',
        qty,
        sell,
        discounted: disc,
        net,
        gross,
        discountAmt,
      };
    });
  }

  buildFacets(rows: Row[]): void {
    const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));
    this.allCategories = uniq(rows.map((r) => r.category));
    this.allBrands = uniq(rows.map((r) => r.brand));
    this.allModels = uniq(rows.map((r) => r.model));
  }

  // ===== Presets =====
  setPreset(range: 'today' | 'yesterday' | 'last7' | 'last30' | 'mtd' | 'ytd'): void {
    const today = new Date();
    const to = new Date(today);
    const from = new Date(today);
    if (range === 'today') { }
    if (range === 'yesterday') { from.setDate(today.getDate() - 1); to.setDate(today.getDate() - 1); }
    if (range === 'last7') { from.setDate(today.getDate() - 6); }
    if (range === 'last30') { from.setDate(today.getDate() - 29); }
    if (range === 'mtd') { from.setDate(1); }
    if (range === 'ytd') { from.setMonth(0, 1); }
    this.fromDate = from.toISOString().slice(0, 10);
    this.toDate = to.toISOString().slice(0, 10);
  }

  // ===== Apply/Filter/Sort/Page =====
  applyAll(): void {
    this.sortKey = 'date';
    this.sortDir = 'desc';
    this.computeKPIs();
    this.buildCharts();
    this.page = 1;
  }
  // sales-reports.component.ts
  prevPage(): void {
    this.page = Math.max(1, this.page - 1);
  }

  nextPage(): void {
    this.page = Math.min(this.totalPages(), this.page + 1);
  }



  filteredRows(): Row[] {
    let list = [...this.rows];

    // date
    if (this.fromDate) list = list.filter(r => r.date >= this.fromDate);
    if (this.toDate) list = list.filter(r => r.date <= this.toDate);

    // facets
    if (this.categories.length) list = list.filter(r => this.categories.includes(r.category));
    if (this.brands.length) list = list.filter(r => this.brands.includes(r.brand));
    if (this.models.length) list = list.filter(r => this.models.includes(r.model));

    // search
    const q = this.search.trim().toLowerCase();
    if (q) list = list.filter(r => (
      r.name.toLowerCase().includes(q) ||
      r.transactionId.toLowerCase().includes(q) ||
      r.brand.toLowerCase().includes(q) ||
      r.model.toLowerCase().includes(q)
    ));

    // sort
    list.sort((a, b) => {
      const av = (this.sortKey === 'margin') ? (a.net) : (a[this.sortKey] as any);
      const bv = (this.sortKey === 'margin') ? (b.net) : (b[this.sortKey] as any);
      if (av < bv) return this.sortDir === 'asc' ? -1 : 1;
      if (av > bv) return this.sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }

  pagedRows(): Row[] {
    const list = this.filteredRows();
    const start = (this.page - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRows().length / this.pageSize));
  }

  changeSort(key: keyof Row | 'margin') {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'desc';
    }
  }

  clearFilters(): void {
    this.fromDate = this.toDate = '';
    this.categories = [];
    this.brands = [];
    this.models = [];
    this.search = '';
    this.applyAll();
  }

  // ===== KPIs =====
  private computeKPIs(): void {
    const list = this.filteredRows();
    this.totalOrders = list.length;
    this.unitsSold = list.reduce((s, r) => s + (r.qty || 0), 0);
    this.grossSales = list.reduce((s, r) => s + r.gross, 0);
    this.netSales = list.reduce((s, r) => s + r.net, 0);
    this.discounts = list.reduce((s, r) => s + r.discountAmt, 0);
    // taxes, margin%, profit to be wired when backend provides fields
    this.aov = this.totalOrders ? Math.round((this.netSales / this.totalOrders) * 100) / 100 : 0;
  }

  // ===== Charts =====
  private buildCharts(): void {
    const list = this.filteredRows();

    // by date
    const byDate: Record<string, { net: number; qty: number; }> = {};
    for (const r of list) {
      byDate[r.date] = byDate[r.date] || { net: 0, qty: 0 };
      byDate[r.date].net += r.net;
      byDate[r.date].qty += r.qty;
    }
    const dates = Object.keys(byDate).sort();
    this.revenueOverTimeData = {
      labels: dates,
      datasets: [{ label: 'Revenue (Rs.)', data: dates.map(d => byDate[d].net), borderWidth: 2, fill: false }]
    };
    this.unitsOverTimeData = {
      labels: dates,
      datasets: [{ label: 'Units', data: dates.map(d => byDate[d].qty), borderWidth: 2, fill: false }]
    };

    // category mix (net)
    const byCat: Record<string, number> = {};
    for (const r of list) byCat[r.category] = (byCat[r.category] || 0) + r.net;
    const cats = Object.keys(byCat);
    this.categoryMixData = { labels: cats, datasets: [{ label: 'By Category (Net)', data: cats.map(c => byCat[c]) }] };

    // brand mix (net)
    const byBrand: Record<string, number> = {};
    for (const r of list) byBrand[r.brand] = (byBrand[r.brand] || 0) + r.net;
    const brs = Object.keys(byBrand);
    this.brandMixData = { labels: brs, datasets: [{ label: 'By Brand (Net)', data: brs.map(b => byBrand[b]) }] };
  }

  // ===== Export / Print =====
  exportCSV(): void {
    const list = this.filteredRows();
    const headers = ['date', 'transactionId', 'name', 'phoneNumber', 'category', 'brand', 'model', 'qty', 'sell', 'discounted', 'net', 'gross', 'discountAmt'];
    const content = [headers.join(',')]
      .concat(list.map(r =>
        [r.date, r.transactionId, r.name, r.phoneNumber, r.category, r.brand, r.model, r.qty, r.sell, r.discounted, r.net, r.gross, r.discountAmt]
          .map(v => String(v).replace(/,/g, ' ')).join(',')
      ))
      .join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  printPage(): void { window.print(); }
}
