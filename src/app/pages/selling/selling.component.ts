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
  public itemsArray: any[] = [];

  quantity: any;

  // ✅ WARRANTY PROPERTIES
  selectedWarranty: string = 'No Warranty';
  warrantyOptions: string[] = [
    'No Warranty',
    '1 Month',
    '3 Months',
    '1 Year'
  ];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private sharedService: SharedDataService,
    private sharedCartDataService: sharedCartDataService
  ) { }

  ngOnInit() {
    let sharedData = this.sharedService.getData();

    if (sharedData) {
      if (Array.isArray(sharedData)) {
        this.itemsArray = sharedData.map(item => ({
          ...item,
          sellQuantity: 1,
          discountPrice: 0
        }));
        console.log('Array data received:', this.itemsArray);
      } else {
        this.items = sharedData;
        console.log('Single item data received:', sharedData);
      }
    }
    this.items.date = this.getTodayDate();
    
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
    const month = ('0' + (today.getMonth() + 1)).slice(-2);
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
    if (this.validateForm()) {
      this.showConfirmPopup = true;
    }
  }

  validateForm(): boolean {
    if (!this.items.date || !this.deatils.name || !this.deatils.phoneNumber) {
      alert('Please fill all customer details');
      return false;
    }

    if (this.itemsArray && this.itemsArray.length > 0) {
      for (let item of this.itemsArray) {
        if (!item.sellQuantity || item.sellQuantity <= 0 || item.sellQuantity > item.quantity) {
          alert(`Please enter valid sell quantity for ${item.brand} ${item.model}`);
          return false;
        }
      }
      return true;
    }

    if (!this.items.category || !this.items.brand || !this.items.model ||
      !this.quantity || !this.items.sellPrice || !this.items.location) {
      alert('Please fill all required fields');
      return false;
    }
    return true;
  }

  confirmSale() {
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

    if (this.itemsArray && this.itemsArray.length > 0) {
      receiptItems = this.itemsArray.map(item => {
        const sellQty = Number(item.sellQuantity) || 1;
        const unitPrice = Number(item.sellPrice) || 0;
        const discountPerUnit = Number(item.discountPrice) || 0;
        
        const itemSubtotal = sellQty * unitPrice;
        const itemDiscount = sellQty * discountPerUnit;
        const itemTotal = itemSubtotal - itemDiscount;

        subtotal += itemSubtotal;
        totalDiscount += itemDiscount;

        return {
          ...item,
          sellQuantity: sellQty,
          discountPrice: discountPerUnit,
          itemTotal: itemTotal
        };
      });
    } else {
      const sellQty = Number(this.quantity) || 1;
      const unitPrice = Number(this.items.sellPrice) || 0;
      const discountPerUnit = Number(this.deatils.discountPrice) || 0;
      
      const itemSubtotal = sellQty * unitPrice;
      const itemDiscount = sellQty * discountPerUnit;
      const itemTotal = itemSubtotal - itemDiscount;

      subtotal = itemSubtotal;
      totalDiscount = itemDiscount;

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

  calculateSubtotal(): number {
    let subtotal = 0;

    if (this.itemsArray && this.itemsArray.length > 0) {
      for (let item of this.itemsArray) {
        const sellQty = Number(item.sellQuantity) || 1;
        const unitPrice = Number(item.sellPrice) || 0;
        subtotal += sellQty * unitPrice;
      }
    } else {
      const sellQty = Number(this.quantity) || 1;
      const unitPrice = Number(this.items.sellPrice) || 0;
      subtotal = sellQty * unitPrice;
    }

    return subtotal;
  }

  calculateTotalDiscount(): number {
    let totalDiscount = 0;

    if (this.itemsArray && this.itemsArray.length > 0) {
      for (let item of this.itemsArray) {
        const sellQty = Number(item.sellQuantity) || 1;
        const discountPerUnit = Number(item.discountPrice) || 0;
        totalDiscount += sellQty * discountPerUnit;
      }
    } else {
      const sellQty = Number(this.quantity) || 1;
      const discountPerUnit = Number(this.deatils.discountPrice) || 0;
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

    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = printStyles;
    document.head.appendChild(styleSheet);

    window.print();

    setTimeout(() => {
      document.head.removeChild(styleSheet);
    }, 1000);

    this.saveSalesData();
  }

  generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `TXN-${timestamp}-${random}`;
  }

  // ✅ FIXED saveSalesData() METHOD
  saveSalesData() {
    const transactionId = this.generateTransactionId();

    if (this.itemsArray && this.itemsArray.length > 0) {
        const saleData = {
            name: this.deatils.name,
            phoneNumber: this.deatils.phoneNumber,
            date: this.items.date,
            transactionId: transactionId,
            warrantyPeriod: this.selectedWarranty,
            items: this.itemsArray.map(item => {
                const sellQty = Number(item.sellQuantity) || 1;
                const unitPrice = Number(item.sellPrice) || 0;
                const discountPerUnit = Number(item.discountPrice) || 0;
                
                // Final price after discount per unit
                const finalPricePerItem = unitPrice - discountPerUnit;

                return {
                    productId: item.id,
                    category: item.category,
                    brand: item.brand,
                    model: item.model,
                    quantity: sellQty,
                    sellPrice: unitPrice,
                    discountedPrice: finalPricePerItem
                };
            })
        };

        console.log("💾 Sending sale data:", JSON.stringify(saleData, null, 2));

        this.http.post('http://localhost:8080/api/sale', saleData).subscribe({
            next: (res) => {
              console.log("saleData.date", saleData.date);
              console.log("saleData.date", saleData.items);
              console.log("", saleData.date);
              console.log("", saleData.date);
              console.log("", saleData.date);
              console.log("", saleData.date);
              console.log("", saleData.date);
              console.log("", saleData.date);
              console.log("", saleData.date);
                console.log("✅ Sale saved successfully:", res);

                alert("All sales completed successfully!");
            },
            error: (err) => {
                console.error("❌ Full error:", err);
                console.error("Status:", err.status);
                console.error("Message:", err.error);
                alert("Error occurred while saving sale data. Check browser console (F12).");
            }
        });
    } else {
        // Single item sale
        const sellQty = Number(this.quantity) || 1;
        const unitPrice = Number(this.items.sellPrice) || 0;
        const discountPerUnit = Number(this.deatils.discountPrice) || 0;
        const finalPricePerItem = unitPrice - discountPerUnit;

        const saleData = {
            name: this.deatils.name,
            phoneNumber: this.deatils.phoneNumber,
            date: this.items.date,
            transactionId: transactionId,
            warrantyPeriod: this.selectedWarranty,
            items: [{
                productId: this.items.id,
                category: this.items.category,
                brand: this.items.brand,
                model: this.items.model,
                quantity: sellQty,
                sellPrice: unitPrice,
                discountedPrice: finalPricePerItem
            }]
        };

        console.log("💾 Sending single sale data:", JSON.stringify(saleData, null, 2));

        this.http.post("http://localhost:8080/api/sale", saleData).subscribe({
            next: (res) => {
                console.log("✅ Sale saved successfully:", res);
                alert("Your selling was completed...!");
            },
            error: (err) => {
                console.error("❌ Full error:", err);
                console.error("Status:", err.status);
                console.error("Message:", err.error);
                alert("Error occurred while saving sale data. Check browser console (F12).");
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
    this.selectedWarranty = 'No Warranty';
  }
}
