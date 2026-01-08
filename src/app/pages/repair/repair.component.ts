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

  // Print Bill
  printBill(): void {
    setTimeout(() => {
      window.print();
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
