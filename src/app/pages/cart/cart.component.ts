import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { addItems } from '../../models/addItems';
import { SharedDataService } from '../shared-data.service';
import { sharedCartDataService } from '../SharedCartDataService';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart',
  imports: [FormsModule, CommonModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems: addItems[] = [];

  constructor(
    private sharedCartDataService: sharedCartDataService,
    private router: Router,
    private sharedService: SharedDataService,
  ) { }

  ngOnInit(): void {
    this.cartItems = this.sharedCartDataService.getCartItems();
  }

  sellCartItems(): void {
    // For now, send first item to selling, or pass array if your selling page accepts bulk
    // Update this to pass all data if needed
    const cartItems = this.sharedCartDataService.getCartItems();
    this.sharedService.setData(cartItems);
    this.router.navigate(['/selling'], { state: { items: this.cartItems } });
  }

  clearCart(): void {
    this.sharedCartDataService.clearCart();
    this.cartItems = [];
  }
}
