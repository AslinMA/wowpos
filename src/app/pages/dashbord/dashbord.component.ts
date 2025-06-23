import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashbord',
  imports: [],
  templateUrl: './dashbord.component.html',
  styleUrl: './dashbord.component.css'
})
export class DashbordComponent {
 constructor(private router: Router) {}

  goToAdmin() {
    // Add your login logic here (e.g., check credentials)

    // After successful login, navigate to dashboard
    this.router.navigate(['/admin']);
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
}
