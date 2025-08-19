import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { SharedDataService } from '../shared-data.service';
import { addItems } from '../../models/addItems';
import { CommonModule } from '@angular/common';
import { sellDeatils } from '../../models/sellDeatils';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { sharedCartDataService } from '../SharedCartDataService';

@Component({
  selector: 'app-selling',
  imports: [FormsModule, CommonModule, HttpClientModule],
  templateUrl: './selling.component.html',
  styleUrl: './selling.component.css'
})
export class SellingComponent implements OnInit {

  public savedeatils: sellDeatils = new sellDeatils(0, "", "", "", "", "", "", 0, 0, "", "");
  cartItems: any[] = [];
  sellForm: FormGroup | undefined;
  public items: addItems = new addItems(0, "", "", "", "", "", "", "", "");
  public itemsArray: any[] = []; // Array to hold multiple items from shared service

  quantity: any;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private sharedService: SharedDataService,
    private sharedCartDataService: sharedCartDataService
  ) { }

  ngOnInit() {

    
    // Check if data is from shared service (array of items)
    let sharedData = this.sharedService.getData();

    if (sharedData) {
      // If it's an array, use it as itemsArray
      if (Array.isArray(sharedData)) {
        this.itemsArray = sharedData.map(item => ({
          ...item,
          sellQuantity: 1, // Default sell quantity
          discountPrice: 0 // Default discount
        }));
        console.log('Array data received:', this.itemsArray);
      } else {
        // If it's a single item, convert to array or use as single item
        this.items = sharedData;
        console.log('Single item data received:', sharedData);
      }
    }
   this.items.date = this.getTodayDate();
    // Also check cart data service
    let cartData = this.sharedCartDataService.getCartItems();
    if (cartData && cartData.length > 0) {
      this.itemsArray = cartData.map(item => ({
        ...item,
        sellQuantity: 1,
        discountPrice: 0
      }));
      console.log('Cart data received:', this.itemsArray);
    }
  }
  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = ('0' + (today.getMonth() + 1)).slice(-2); // months are zero indexed
    const day = ('0' + today.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  deatils = {
    date: '',
    name: '',
    phoneNumber: '',
    category: '',
    brand: '',
    model: '',
    quantity: 1,
    sellPrice: 0,
    discountPrice: 0,
    location: ''
  };

  showConfirmPopup = false;
  showReceipt = false;
  receiptData: any = {};

  onSubmit() {
    // Validate form
    if (this.validateForm()) {
      this.showConfirmPopup = true;
    }
  }

  validateForm(): boolean {
    // Check customer details
    if (!this.items.date || !this.deatils.name || !this.deatils.phoneNumber) {
      alert('Please fill all customer details');
      return false;
    }

    // If using array items (multiple items)
    if (this.itemsArray && this.itemsArray.length > 0) {
      for (let item of this.itemsArray) {
        if (!item.sellQuantity || item.sellQuantity <= 0 || item.sellQuantity > item.quantity) {
          alert(`Please enter valid sell quantity for ${item.brand} ${item.model}`);
          return false;
        }
      }
      return true;
    }

    // If using single item
    if (!this.items.category || !this.items.brand || !this.items.model ||
      !this.quantity || !this.items.sellPrice || !this.items.location) {
      alert('Please fill all required fields');
      return false;
    }
    return true;
  }

  confirmSale() {
    // Process the sale
    this.processSale();
    this.showConfirmPopup = false;
    this.showReceipt = true;
  }

  cancelSale() {
    this.showConfirmPopup = false;
  }

  processSale() {
    let receiptItems: any[] = [];
    let subtotal = 0;
    let totalDiscount = 0;

    // If we have multiple items from array
    if (this.itemsArray && this.itemsArray.length > 0) {
      receiptItems = this.itemsArray.map(item => {
        const sellQty = item.sellQuantity || 1;
        const unitPrice = +item.sellPrice;
        const discountPerUnit = item.discountPrice || 0;
        const itemTotal = (sellQty * unitPrice) - (sellQty * discountPerUnit);

        subtotal += sellQty * unitPrice;
        totalDiscount += sellQty * discountPerUnit;

        return {
          ...item,
          sellQuantity: sellQty,
          discountPrice: discountPerUnit,
          itemTotal: itemTotal
        };
      });
    } else {
      // Single item
      const sellQty = this.quantity || 1;
      const unitPrice = +this.items.sellPrice;
      const discountPerUnit = this.deatils.discountPrice || 0;
      const itemTotal = (sellQty * unitPrice) - (sellQty * discountPerUnit);

      subtotal = sellQty * unitPrice;
      totalDiscount = sellQty * discountPerUnit;

      receiptItems = [{
        ...this.items,
        sellQuantity: sellQty,
        discountPrice: discountPerUnit,
        itemTotal: itemTotal
      }];
    }

    const finalTotal = subtotal - totalDiscount;

    this.receiptData = {
      date: this.items.date,
      items: receiptItems,
      subtotal: subtotal,
      totalDiscount: totalDiscount,
      finalTotal: finalTotal,
      receiptNumber: this.generateReceiptNumber(),
      timestamp: new Date()
    };
  }

  // Helper methods for calculations in template
  calculateSubtotal(): number {
    let subtotal = 0;

    if (this.itemsArray && this.itemsArray.length > 0) {
      for (let item of this.itemsArray) {
        const sellQty = item.sellQuantity || 1;
        const unitPrice = +item.sellPrice || 0;
        subtotal += sellQty * unitPrice;
      }
    } else {
      const sellQty = this.quantity || 1;
      const unitPrice = +this.items.sellPrice || 0;
      subtotal = sellQty * unitPrice;
    }

    return subtotal;
  }

  calculateTotalDiscount(): number {
    let totalDiscount = 0;

    if (this.itemsArray && this.itemsArray.length > 0) {
      for (let item of this.itemsArray) {
        const sellQty = item.sellQuantity || 1;
        const discountPerUnit = item.discountPrice || 0;
        totalDiscount += sellQty * discountPerUnit;
      }
    } else {
      const sellQty = this.quantity || 1;
      const discountPerUnit = this.deatils.discountPrice || 0;
      totalDiscount = sellQty * discountPerUnit;
    }

    return totalDiscount;
  }

  calculateFinalTotal(): number {
    return this.calculateSubtotal() - this.calculateTotalDiscount();
  }

  generateReceiptNumber(): string {
    return 'RCP-' + Date.now().toString().slice(-8);
  }

  printReceipt() {
    // Add print styles to document
    const printStyles = `
      <style>
        @media print {
          body * { visibility: hidden; }
          #receiptContent, #receiptContent * { visibility: visible; }
          #receiptContent { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            background: white !important;
          }
          .bg-yellow-50 { background-color: #fefce8 !important; -webkit-print-color-adjust: exact; }
          .bg-yellow-100 { background-color: #fef3c7 !important; -webkit-print-color-adjust: exact; }
          .bg-gray-50 { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; }
          .text-yellow-500 { color: #eab308 !important; -webkit-print-color-adjust: exact; }
          .text-green-600 { color: #dc2626 !important; -webkit-print-color-adjust: exact; }
          .border-yellow-300 { border-color: #fde047 !important; }
          table { border-collapse: collapse !important; }
          th, td { border: 1px solid #000 !important; padding: 8px !important; }
        }
      </style>
    `;

    // Temporarily add styles for printing
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = printStyles;
    document.head.appendChild(styleSheet);

    // Print
    window.print();

    // Remove styles after printing
    setTimeout(() => {
      document.head.removeChild(styleSheet);
    }, 1000);

    // Save sales data to backend
    this.saveSalesData();
  }
  generateTransactionId(): string {
    // Generate a unique transaction ID based on timestamp and random number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `TXN-${timestamp}-${random}`;
  }
  saveSalesData() {
    const transactionId = this.generateTransactionId();

    if (this.itemsArray && this.itemsArray.length > 0) {
        const saleData = {
            name: this.deatils.name,
            phoneNumber: this.deatils.phoneNumber,
            date: this.receiptData.date,
            discountedPrice: this.calculateFinalTotal(),
            sellPrice: this.calculateSubtotal(),
            transactionId: transactionId,
            items: this.itemsArray.map(item => ({
                productId: item.id,
                category: item.category,
                brand: item.brand,
                model: item.model,
                quantity: item.sellQuantity,
                discountedPrice: item.discountPrice,
                sellPrice: item.sellPrice
            }))
        };

        this.http.post("http://localhost:8080/sale", saleData).subscribe({
            next: (res) => {
                alert("All sales completed successfully!");
                console.log("Sale response:", res);
            },
            error: (err) => {
                console.error("Error saving sale:", err);
                alert("Error occurred while saving sale data.");
            }
        });
    } else {
        // Single item sale fallback
        const saleData = {
            name: this.deatils.name,
            phoneNumber: this.deatils.phoneNumber,
            date: this.receiptData.date,
            discountedPrice: this.receiptData.totalDiscount,
            sellPrice: this.items.sellPrice,
            transactionId: transactionId,
            items: [
                {
                    productId: this.items.id,
                    category: this.items.category,
                    brand: this.items.brand,
                    model: this.items.model,
                    quantity: this.quantity,
                    discountedPrice: this.deatils.discountPrice,
                    sellPrice: this.items.sellPrice
                }
            ]
        };

        this.http.post("http://localhost:8080/sale", saleData).subscribe({
            next: (res) => {
                alert("Your selling was completed...!");
                console.log("this is ell dat of single dataset"+saleData);
                
                console.log("Sale response:", res);
            },
            error: (err) => {
                console.error("Error saving sale:", err);
                alert("Error occurred while saving sale data.");
            }
        });
    }
}


  closeReceipt() {
    this.showReceipt = false;
    this.resetForm();
  }

  resetForm() {
    this.deatils = {
      date: '',
      name: '',
      phoneNumber: '',
      category: '',
      brand: '',
      model: '',
      quantity: 1,
      sellPrice: 0,
      discountPrice: 0,
      location: ''
    };

    this.items = new addItems(0, "", "", "", "", "", "", "", "");
    this.itemsArray = [];
    this.quantity = null;
    this.receiptData = {};
  }
}