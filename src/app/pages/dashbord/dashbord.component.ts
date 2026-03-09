import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashbord',
  imports: [CommonModule],
  templateUrl: './dashbord.component.html',
  styleUrl: './dashbord.component.css'
})
export class DashbordComponent {

  constructor(private router: Router) {}

  isSidebarOpen = false;

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