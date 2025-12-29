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
 isSidebarOpen = false; // Sidebar closed by default on mobile

 

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  // Close sidebar when clicking a link (mobile only)
  closeSidebarOnMobile() {
    if (window.innerWidth < 1024) {
      this.isSidebarOpen = false;
    }
  }

  goToAdmin() {
    // Add your login logic here (e.g., check credentials)

    // After successful login, navigate to dashboard
    this.router.navigate(['/admin']);
  }
  goToModels() {
    this.router.navigate(['/manage-models']);
  }
  goTologin() {
    this.router.navigate(['/login']);
  }
  goToSingUp() {
    this.router.navigate(['/singup']);
  }
    goToAddItems() {
    this.router.navigate(['/add-items']);
  }
   goToRequement() {
    this.router.navigate(['/requement']);
  }
  goToInventory() {
    this.router.navigate(['/inventory']);
  }
   goToSelling() {
    this.router.navigate(['/selling']);
  }
  goToNotification() {
    this.router.navigate(['/notification']);
  }
   goToDamage() {
    this.router.navigate(['/damage']);
  }
  goToReturn() {
    this.router.navigate(['/return']);
  }
    goToRepair() {
    this.router.navigate(['/repair']);
  }
}
