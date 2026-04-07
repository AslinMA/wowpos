import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Product {
  id: number;
  category: string;
  brand: string;
  model: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
}

interface RepairPart {
  partId?: number;
  partName: string;
  partCategory: string;
  partBrand: string;
  partModel: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

interface Repair {
  repairId?: number;
  customerName: string;
  customerPhone: string;
  deviceBrand: string;
  deviceModel: string;
  issueDescription: string;
  laborCharge: number;
  totalCost: number;
  status: string;
  repairDate?: string;
  completedDate?: string;
  createdAt?: string;
  updatedAt?: string;
  parts?: RepairPart[];
}

@Component({
  selector: 'app-repair',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './repair.component.html',
})
export class RepairComponent implements OnInit {
  // View modes
  currentView: 'create' | 'search' | 'details' = 'create';

  // Create Repair Form
  customerName: string = '';
  customerPhone: string = '';
  deviceBrand: string = '';
  deviceModel: string = '';
  issueDescription: string = '';
  laborCharge: number = 0;

  // Parts Management
  products: Product[] = [];
  selectedProductId: number | null = null;
  partQuantity: number = 1;
  addedParts: RepairPart[] = [];

  // Search & View
  searchRepairCode: string = '';
  repairRecords: Repair[] = [];
  selectedRepair: Repair | null = null;

  // Pagination
  page = 1;
  pageSize = 10;

  // Update During Repair
  additionalIssues: string = '';
  additionalLaborCharge: number = 0;
  partDiscount: number = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadRepairRecords();
  }

  loadProducts(): void {
    this.http.get<Product[]>(`${environment.apiUrl}/api/product`).subscribe({
      next: (data) => {
        this.products = data;
      },
      error: (e) => console.error('Failed to load products', e),
    });
  }

  loadRepairRecords(): void {
    this.http.get<Repair[]>(`${environment.apiUrl}/api/repair`).subscribe({
      next: (data) => {
        this.repairRecords = data;
      },
      error: (e) => console.error('Failed to load repair records', e),
    });
  }

  // Add Part to New Repair
  addPart(): void {
    const product = this.products.find((p) => p.id === Number(this.selectedProductId));
    if (!product) {
      alert('Please select a part');
      return;
    }

    if (this.partQuantity > product.quantity) {
      alert('Not enough stock available!');
      return;
    }

    const subtotal = this.partQuantity * product.sellPrice;
    const total = subtotal - this.partDiscount;

    const existingPart = this.addedParts.find(
      (p) => p.partBrand === product.brand && p.partModel === product.model
    );

    if (existingPart) {
      existingPart.quantity += this.partQuantity;
      existingPart.discount += this.partDiscount;
      const newSubtotal = existingPart.quantity * existingPart.unitPrice;
      existingPart.totalPrice = newSubtotal - existingPart.discount;
    } else {
      this.addedParts.push({
        partName: `${product.brand} ${product.model}`,
        partCategory: product.category,
        partBrand: product.brand,
        partModel: product.model,
        quantity: this.partQuantity,
        unitPrice: product.sellPrice,
        discount: this.partDiscount,
        totalPrice: total,
      });
    }

    // Reset part form
    this.selectedProductId = null;
    this.partQuantity = 1;
    this.partDiscount = 0;
  }

  // Add More Parts to Existing Repair (During Progress)
  addMoreParts(): void {
    if (!this.selectedRepair) return;

    const product = this.products.find((p) => p.id === Number(this.selectedProductId));
    if (!product) {
      alert('Please select a part');
      return;
    }

    if (this.partQuantity > product.quantity) {
      alert('Not enough stock available!');
      return;
    }

    const subtotal = this.partQuantity * product.sellPrice;
    const total = subtotal - this.partDiscount;

    const newPart: RepairPart = {
      partName: `${product.brand} ${product.model}`,
      partCategory: product.category,
      partBrand: product.brand,
      partModel: product.model,
      quantity: this.partQuantity,
      unitPrice: product.sellPrice,
      discount: this.partDiscount,
      totalPrice: total,
    };

    const updateData = {
      parts: [newPart],
    };

    console.log('Adding part to repair:', updateData);

    this.http.put<Repair>(`${environment.apiUrl}/api/repair/${this.selectedRepair.repairId}`, updateData).subscribe({
      next: (response) => {
        alert('Part added successfully!');
        this.selectedRepair = response;
        this.selectedProductId = null;
        this.partQuantity = 1;
        this.partDiscount = 0;
        this.loadProducts();
        this.loadRepairRecords();
      },
      error: (e) => {
        console.error('Failed to add part', e);
        alert('Failed to add part: ' + (e.error?.error || e.message));
      },
    });
  }

  // Update Labor Charge and Issues
  updateRepairDetails(): void {
    if (!this.selectedRepair) return;

    if (!this.additionalIssues && this.additionalLaborCharge <= 0) {
      alert('Please add additional issues or labor charge');
      return;
    }

    const updateData: any = {};

    if (this.additionalIssues.trim()) {
      updateData.issueDescription = this.additionalIssues.trim();
    }

    if (this.additionalLaborCharge > 0) {
      updateData.laborCharge = (this.selectedRepair.laborCharge || 0) + this.additionalLaborCharge;
    }

    console.log('Updating repair details:', updateData);

    this.http.put<Repair>(`${environment.apiUrl}/api/repair/${this.selectedRepair.repairId}`, updateData).subscribe({
      next: (response) => {
        alert('Repair updated successfully!');
        this.selectedRepair = response;
        this.additionalIssues = '';
        this.additionalLaborCharge = 0;
        this.loadRepairRecords();
      },
      error: (e) => {
        console.error('Failed to update repair', e);
        alert('Failed to update repair: ' + (e.error?.error || e.message));
      },
    });
  }

  removePart(index: number): void {
    this.addedParts.splice(index, 1);
  }

  calculatePartsTotal(): number {
    return this.addedParts.reduce((sum, part) => sum + part.totalPrice, 0);
  }

  calculateTotalRepairCost(): number {
    return this.calculatePartsTotal() + this.laborCharge;
  }

  // Create New Repair
  createRepair(): void {
    if (!this.customerName || !this.customerPhone || !this.deviceModel || !this.issueDescription) {
      alert('Please fill all required fields');
      return;
    }

    const repair: Repair = {
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      deviceBrand: this.deviceBrand,
      deviceModel: this.deviceModel,
      issueDescription: this.issueDescription,
      laborCharge: this.laborCharge,
      totalCost: this.calculateTotalRepairCost(),
      status: 'Pending',
      parts: this.addedParts,
    };

    console.log('Creating repair:', repair);

    this.http.post<Repair>(`${environment.apiUrl}/api/repair`, repair).subscribe({
      next: (response) => {
        alert(`Repair created successfully! Repair ID: REP-${response.repairId}`);
        this.selectedRepair = response;
        this.currentView = 'details';
        this.printBill();
        this.resetForm();
        this.loadProducts();
        this.loadRepairRecords();
      },
      error: (e) => {
        console.error('Failed to create repair', e);
        console.error('Error details:', e.error);
        alert('Failed to create repair: ' + (e.error?.error || e.message));
      },
    });
  }

  resetForm(): void {
    this.customerName = '';
    this.customerPhone = '';
    this.deviceBrand = '';
    this.deviceModel = '';
    this.issueDescription = '';
    this.laborCharge = 0;
    this.addedParts = [];
    this.selectedProductId = null;
    this.partDiscount = 0;
    this.additionalIssues = '';
    this.additionalLaborCharge = 0;
  }

  // Search Repair by ID, Phone, or Name
  searchRepair(): void {
    if (!this.searchRepairCode.trim()) {
      alert('Please enter Repair ID, Phone Number, or Customer Name');
      return;
    }

    console.log('🔍 Searching for:', this.searchRepairCode);

    this.http
      .get<any>(`${environment.apiUrl}/api/repair/search?query=${encodeURIComponent(this.searchRepairCode)}`)
      .subscribe({
        next: (data) => {
          console.log('Search results:', data);

          if (Array.isArray(data) && data.length > 1) {
            this.repairRecords = data;
            this.page = 1;
            alert(`Found ${data.length} repairs. Check the table below.`);
          } else if (Array.isArray(data) && data.length === 1) {
            this.selectedRepair = data[0];
            this.currentView = 'details';
          } else if (!Array.isArray(data)) {
            this.selectedRepair = data;
            this.currentView = 'details';
          }
        },
        error: (e) => {
          console.error('Repair not found', e);
          alert('No repairs found for: ' + this.searchRepairCode);
        },
      });
  }

  // View Repair Details
  viewRepair(repair: Repair): void {
    this.selectedRepair = repair;
    this.currentView = 'details';
  }

  // Update Repair Status
  updateStatus(newStatus: string): void {
    if (!this.selectedRepair) return;

    const update = {
      status: newStatus,
    };

    this.http.patch(`${environment.apiUrl}/api/repair/${this.selectedRepair.repairId}/status`, update).subscribe({
      next: () => {
        alert('Status updated successfully!');
        if (this.selectedRepair) {
          this.selectedRepair.status = newStatus;
          if (newStatus === 'Completed') {
            this.selectedRepair.completedDate = new Date().toISOString();
          }
        }
        this.loadRepairRecords();
      },
      error: (e) => {
        console.error('Failed to update status', e);
        alert('Failed to update status');
      },
    });
  }

  calculateRepairTotal(repair: Repair): number {
    if (!repair.parts) return repair.laborCharge || 0;
    const partsTotal = repair.parts.reduce((sum, part) => sum + part.totalPrice, 0);
    return partsTotal + (repair.laborCharge || 0);
  }

  private esc(value: any): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

private buildRepairBillHtml(): string {
  const repair = this.selectedRepair;
  if (!repair) return '';

  const parts = repair.parts || [];

  const partsHtml = parts.map((part: any) => `
    <tr>
      <td class="left part">${this.esc(part.partBrand)} ${this.esc(part.partModel)}</td>
      <td class="center qty">${Number(part.quantity || 0)}</td>
      <td class="right amt">Rs.${Number(part.totalPrice || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  const laborRow = Number(repair.laborCharge || 0) > 0
    ? `
      <div class="row">
        <span>Labor</span>
        <span>Rs.${Number(repair.laborCharge || 0).toFixed(2)}</span>
      </div>
    `
    : '';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Repair Bill</title>
    <style>
      @page {
        size: 80mm 127mm;
        margin: 0;
      }

      html, body {
        width: 80mm;
        height: 127mm;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: #fff;
        color: #000;
        font-family: monospace, Arial, sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      .receipt {
        width: 80mm;
        height: 127mm;
        padding: 4mm;
        overflow: hidden;
      }

      .center { text-align: center; }
      .left { text-align: left; }
      .right { text-align: right; }

      .brand {
        font-size: 20px;
        font-weight: 700;
        line-height: 1.1;
        margin-top: 1mm;
      }

      .sub {
        font-size: 10px;
        line-height: 1.3;
      }

      .title {
        font-size: 16px;
        font-weight: 700;
        margin: 3mm 0 2mm 0;
      }

      .divider {
        border-top: 1px dashed #000;
        margin: 2.5mm 0;
      }

      .row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        font-size: 10px;
        line-height: 1.4;
        margin: 1mm 0;
      }

      .section {
        font-size: 11px;
        font-weight: 700;
        margin-bottom: 1mm;
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

      th {
        border-bottom: 1px dashed #000;
      }

      .part {
        width: 58%;
        word-break: break-word;
      }

      .qty {
        width: 12%;
      }

      .amt {
        width: 30%;
      }

      .grand {
        font-size: 15px;
        font-weight: 700;
        margin-top: 2mm;
      }

      .footer {
        margin-top: 3mm;
        text-align: center;
        font-size: 10px;
        line-height: 1.3;
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="center">
        <div class="brand">WoW Mobile</div>
        <div class="sub">Phone Repair Service</div>
        <div class="sub">071-0539476</div>
        <div class="sub">Pitigala, Sri Lanka</div>
      </div>

      <div class="divider"></div>

      <div class="center title">REPAIR BILL</div>

      <div class="row">
        <span>Repair ID</span>
        <span>REP-${this.esc(repair.repairId)}</span>
      </div>
      <div class="row">
        <span>Date</span>
        <span>${this.esc(new Date(repair.repairDate || repair.createdAt || new Date()).toLocaleString())}</span>
      </div>
      <div class="row">
        <span>Status</span>
        <span>${this.esc(repair.status)}</span>
      </div>

      <div class="divider"></div>

      <div class="section">Customer</div>
      <div class="row">
        <span>Name</span>
        <span>${this.esc(repair.customerName)}</span>
      </div>
      <div class="row">
        <span>Phone</span>
        <span>${this.esc(repair.customerPhone)}</span>
      </div>

      <div class="divider"></div>

      <div class="section">Device</div>
      <div class="row">
        <span>Model</span>
        <span>${this.esc(repair.deviceBrand)} ${this.esc(repair.deviceModel)}</span>
      </div>
      <div class="row">
        <span>Issue</span>
        <span>${this.esc(repair.issueDescription)}</span>
      </div>

      <div class="divider"></div>

      <div class="section">Parts</div>
      <table>
        <thead>
          <tr>
            <th class="left part">Part</th>
            <th class="center qty">Q</th>
            <th class="right amt">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${partsHtml || `
            <tr>
              <td class="left part">No parts</td>
              <td class="center qty">-</td>
              <td class="right amt">Rs.0.00</td>
            </tr>
          `}
        </tbody>
      </table>

      <div class="divider"></div>

      ${laborRow}
      <div class="row grand">
        <span>TOTAL</span>
        <span>Rs.${Number(repair.totalCost || this.calculateRepairTotal(repair) || 0).toFixed(2)}</span>
      </div>

      <div class="divider"></div>

      <div class="footer">
        Thank you for choosing<br>
        WoW Mobile
      </div>
    </div>
  </body>
  </html>
  `;
}

printBill(): void {
  if (!this.selectedRepair) {
    alert('No repair selected');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=420,height=720');

  if (!printWindow) {
    alert('Popup blocked. Please allow popups.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(this.buildRepairBillHtml());
  printWindow.document.close();

  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}

  // Pagination
  pagedRecords(): Repair[] {
    const start = (this.page - 1) * this.pageSize;
    return this.repairRecords.slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.repairRecords.length / this.pageSize));
  }

  prevPage(): void {
    this.page = Math.max(1, this.page - 1);
  }

  nextPage(): void {
    this.page = Math.min(this.totalPages(), this.page + 1);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  switchView(view: 'create' | 'search' | 'details'): void {
    this.currentView = view;
    this.additionalIssues = '';
    this.additionalLaborCharge = 0;
    if (view === 'search') {
      this.loadRepairRecords();
    }
  }
}
