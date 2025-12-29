import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

type Band = 'CRITICAL' | 'WARN' | 'INFO' | 'LOW';

interface LowStockItem {
  id: number;
  category: string;
  brand: string;
  model: string;
  quantity: number;   // parsed on backend
  band: Band;         // computed band
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification.component.html',
})
export class NotificationComponent implements OnInit {
  constructor(private http: HttpClient, private router: Router) { }

  all: LowStockItem[] = [];
  visible: LowStockItem[] = [];

  // default: show only qty < 3
  filterMode: 'critical' | 'upto5' | 'upto10' | 'upto15' | 'all' = 'critical';

  ngOnInit(): void {
    // fetch all bands up to 15; backend returns band per item
    this.http.get<LowStockItem[]>('/api/notifications/low-stock?max=15').subscribe({
      next: (rows) => { this.all = rows || []; this.applyFilter(); },
      error: (e) => { console.error('low-stock fetch failed', e); this.all = []; this.applyFilter(); }
    });
  }

  applyFilter(): void {
    const map = {
      critical: (r: LowStockItem) => r.band === 'CRITICAL',        // <3
      upto5: (r: LowStockItem) => r.quantity <= 5,
      upto10: (r: LowStockItem) => r.quantity <= 10,
      upto15: (r: LowStockItem) => r.quantity <= 15,
      all: (_: LowStockItem) => true,
    };
    this.visible = (this.all || []).filter(map[this.filterMode]);
  }
  
  // Theme colors per band (matching your alert palette)
  colorClasses(band: Band) {
    switch (band) {
      case 'CRITICAL': return 'text-red-800 border-red-300 bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800';
      case 'WARN': return 'text-yellow-800 border-yellow-300 bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 dark:border-yellow-800';
      case 'INFO': return 'text-blue-800 border-blue-300 bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-800';
      case 'LOW': return 'text-green-800 border-green-300 bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:border-green-800';
    }
  }

  badgeClasses(band: Band) {
    switch (band) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border border-red-200';
      case 'WARN': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'INFO': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'LOW': return 'bg-green-100 text-green-800 border border-green-200';
    }
  }

  dismiss(item: LowStockItem): void {
    this.visible = this.visible.filter(i => i.id !== item.id);
  }

  goToInventory(item: LowStockItem): void {
    this.router.navigate(['/inventory'], { queryParams: { search: `${item.brand} ${item.model}` } });
  }

  goToAddStock(item: LowStockItem): void {
    this.router.navigate(['/add-items'], { queryParams: { brand: item.brand, model: item.model } });
  }
}
