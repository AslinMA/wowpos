import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type Band = 'CRITICAL' | 'WARN' | 'INFO' | 'LOW';

interface LowStockItem {
  id: number;
  category: string;
  brand: string;
  model: string;
  quantity: number;
  band: Band;
}

@Component({
  selector: 'app-dashbord',
  imports: [CommonModule],
  templateUrl: './dashbord.component.html',
  styleUrl: './dashbord.component.css'
})
export class DashbordComponent implements OnInit {

  constructor(private router: Router, private http: HttpClient) {}

  isSidebarOpen = false;
  notificationCount = 0;

  private apiUrl = `${environment.apiUrl}/api`;

  ngOnInit(): void {
    this.loadNotificationCount();
  }

  loadNotificationCount(): void {
    this.http.get<LowStockItem[]>(`${this.apiUrl}/notifications/low-stock?max=15`).subscribe({
      next: (rows) => {
        const items = rows || [];
        this.notificationCount = items.filter(item => item.quantity <= 5).length;
      },
      error: (err) => {
        console.error('Failed to load notification count', err);
        this.notificationCount = 0;
      }
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebarOnMobile() {
    if (window.innerWidth < 1024) {
      this.isSidebarOpen = false;
    }
  }

  goToAdmin() {
    this.closeSidebarOnMobile();
    this.router.navigate(['/admin']);
  }

  goToModels() {
    this.closeSidebarOnMobile();
    this.router.navigate(['/manage-models']);
  }

  goTologin() {
    this.closeSidebarOnMobile();
    this.router.navigate(['/login']);
  }

  goToSingUp() {
    this.closeSidebarOnMobile();
    this.router.navigate(['/singup']);
  }

  goToAddItems() {
    this.closeSidebarOnMobile();
    this.router.navigate(['/add-items']);
  }

  goToRequement() {
    this.closeSidebarOnMobile();
    this.router.navigate(['/requement']);
  }

  goToInventory() {
    this.closeSidebarOnMobile();
    this.router.navigate(['/inventory']);
  }

  goToSelling() {
    this.closeSidebarOnMobile();
    this.router.navigate(['/selling']);
  }

  goToNotification() {
    this.closeSidebarOnMobile();
    this.router.navigate(['/notification']);
  }

  goToDamage() {
    this.closeSidebarOnMobile();
    this.router.navigate(['/damage']);
  }

  goToReturn() {
    this.closeSidebarOnMobile();
    this.router.navigate(['/return']);
  }

  goToRepair() {
    this.closeSidebarOnMobile();
    this.router.navigate(['/repair']);
  }
}