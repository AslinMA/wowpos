import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { SharedDataService } from '../shared-data.service';
import { addItems } from '../../models/addItems';
import { CommonModule } from '@angular/common';
import { sellDeatils } from '../../models/sellDeatils';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { sharedCartDataService } from '../SharedCartDataService';
import { environment } from '../../../environments/environment';

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

  private esc(value: any): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private buildReceiptHtml(): string {
  const items = this.receiptData?.items || [];

  const itemsHtml = items.map((item: any) => `
    <tr>
      <td class="item">${this.esc(item.category)} ${this.esc(item.brand)} ${this.esc(item.model)}</td>
      <td class="qty">${Number(item.sellQuantity || 1)}</td>
      <td class="amt">Rs.${Number(item.itemTotal || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  const warrantyRow =
    this.selectedWarranty && this.selectedWarranty !== 'No Warranty'
      ? `<div class="row"><span>Warranty</span><span>${this.esc(this.selectedWarranty)}</span></div>`
      : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Sales Receipt</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }

    html, body {
      width: 80mm;
      margin: 0;
      padding: 0;
      background: #fff;
      color: #000;
      font-family: "Courier New", monospace, Arial, sans-serif;
    }

    body {
      display: flex;
      justify-content: center;
    }

    * {
      box-sizing: border-box;
    }

    .receipt {
      width: 68mm;
      padding: 3mm 0 2.5mm 0;
    }

    .center {
      text-align: center;
    }

    .header {
      margin-bottom: 1.5mm;
    }

    .logo {
      display: block;
      width: 11mm;
      height: 11mm;
      margin: 0 auto 1mm auto;
      object-fit: contain;
    }

    .brand {
      font-size: 15px;
      font-weight: 700;
      line-height: 1.1;
      margin: 0;
    }

    .sub {
      font-size: 10px;
      margin-top: 0.5mm;
      line-height: 1.2;
    }

    .title {
      font-size: 17px;
      font-weight: 700;
      letter-spacing: 0.4px;
      margin: 1.2mm 0 1mm 0;
      line-height: 1.1;
    }

    .meta {
      font-size: 10px;
      line-height: 1.3;
    }

    .divider {
      border-top: 1px dashed #000;
      margin: 2mm 0;
    }

    .section {
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 1mm;
      text-transform: uppercase;
    }

    .row {
      display: flex;
      justify-content: space-between;
      gap: 6mm;
      font-size: 11px;
      line-height: 1.45;
      margin: 0.8mm 0;
    }

    .row span:first-child {
      flex: 1;
    }

    .row span:last-child {
      min-width: 28mm;
      text-align: right;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin-top: 1mm;
    }

    th, td {
      font-size: 10px;
      padding: 1mm 0;
      vertical-align: top;
    }

    thead th {
      border-bottom: 1px dashed #000;
      font-weight: 700;
    }

    .item {
      width: 56%;
      text-align: left;
      word-break: break-word;
    }

    .qty {
      width: 12%;
      text-align: center;
    }

    .amt {
      width: 32%;
      text-align: right;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 1mm;
      font-size: 16px;
      font-weight: 700;
      line-height: 1.2;
    }

    .footer {
      margin-top: 2.5mm;
      text-align: center;
    }

    .thanks {
      font-size: 10px;
      font-weight: 700;
      line-height: 1.3;
    }

    .come,
    .wa {
      font-size: 10px;
      line-height: 1.3;
      margin-top: 0.8mm;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header center">
      <img src="/logo.jpg" class="logo" alt="Woow Mobile Logo" />
      <div class="brand">WoW Mobile</div>
      <div class="sub">Accessories Store</div>
      <div class="title">SALES RECEIPT</div>
      <div class="meta">${this.esc(new Date(this.receiptData.timestamp).toLocaleString())}</div>
      <div class="meta">Receipt No: ${this.esc(this.receiptData.receiptNumber)}</div>
    </div>

    <div class="divider"></div>

    <div class="section">Customer</div>
    <div class="row"><span>Name</span><span>${this.esc(this.deatils.name)}</span></div>
    <div class="row"><span>Phone</span><span>${this.esc(this.deatils.phoneNumber)}</span></div>
    <div class="row"><span>Date</span><span>${this.esc(this.receiptData.date)}</span></div>
    ${warrantyRow}

    <div class="divider"></div>

    <div class="section">Items</div>
    <table>
      <thead>
        <tr>
          <th class="item">Item</th>
          <th class="qty">Q</th>
          <th class="amt">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="divider"></div>

    <div class="row"><span>Subtotal</span><span>Rs.${Number(this.receiptData.subtotal || 0).toFixed(2)}</span></div>
    <div class="row"><span>Discount</span><span>Rs.${Number(this.receiptData.totalDiscount || 0).toFixed(2)}</span></div>

    <div class="total-row">
      <span>TOTAL</span>
      <span>Rs.${Number(this.receiptData.finalTotal || 0).toFixed(2)}</span>
    </div>

    <div class="divider"></div>

    <div class="footer">
      <div class="thanks">Thank you for visiting WoW Mobile</div>
      <div class="come">Come again!</div>
      <div class="wa">WhatsApp: 071-4567801/071-0539476</div>
    </div>
  </div>
</body>
</html>
  `;
}

  printReceipt() {
    const printWindow = window.open('', '_blank', 'width=400,height=700');

    if (!printWindow) {
      alert('Popup blocked. Please allow popups.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(this.buildReceiptHtml());
    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      this.saveSalesData();
    }, 500);
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

      this.http.post(`${environment.apiUrl}/api/sale`, saleData).subscribe({
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

      this.http.post(`${environment.apiUrl}/api/sale`, saleData).subscribe({
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
