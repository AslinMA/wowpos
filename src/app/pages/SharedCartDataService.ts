import { Injectable } from '@angular/core';
import { addItems } from '../models/addItems';

@Injectable({
  providedIn: 'root'
})

export class sharedCartDataService {
    public cartItems: addItems[] = [];

    setData(data: addItems) {
        this.cartItems = [data];
    }

    addToCart(item: addItems): void {
        this.cartItems.push(item);
    }

    getCartItems(): addItems[] {
        return this.cartItems;
    }

    clearCart(): void {
        this.cartItems = [];
    }
}