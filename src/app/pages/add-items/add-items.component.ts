import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { addItems } from '../../models/addItems';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

@Component({
  selector: 'app-add-items',
  standalone: true,
  imports: [FormsModule, HttpClientModule, CommonModule],
  templateUrl: './add-items.component.html',
  styleUrl: './add-items.component.css'
})
export class AddItemsComponent implements OnInit, OnDestroy {

  public items: addItems = new addItems(0, '', '', '', '', '', '', '', '');

  categories: string[] = [];
  brands: string[] = [];
  models: string[] = [];
  locations: string[] = [];

  scannedCode: string = '';
  scannerActive: boolean = false;
  scannerError: string = '';

  private html5QrCode: Html5Qrcode | null = null;
  private readonly scannerElementId = 'reader';

  constructor(private http: HttpClient) { }

  ngOnInit() {
      this.items.date = this.getTodayDate();
    this.loadCategories();
    this.loadBrands();
    this.loadLocations();
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

moveFocusById(event: Event, fieldId: string): void {
  event.preventDefault();

  const field = document.getElementById(fieldId) as HTMLElement | null;
  if (!field) return;

  field.focus();

  if (field instanceof HTMLInputElement) {
    setTimeout(() => field.select(), 0);
  }
}

  loadCategories() {
    this.http.get<string[]>(`${environment.apiUrl}/api/categories`).subscribe({
      next: (data) => {
        this.categories = data;
        console.log('Categories loaded:', data);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  loadBrands() {
    this.http.get<string[]>(`${environment.apiUrl}/api/brands`).subscribe({
      next: (data) => {
        this.brands = data;
        console.log('Brands loaded:', data);
      },
      error: (err) => {
        console.error('Error loading brands:', err);
      }
    });
  }

  loadLocations() {
    this.http.get<string[]>(`${environment.apiUrl}/api/locations`).subscribe({
      next: (data) => {
        this.locations = data;
        console.log('Locations loaded:', data);
      },
      error: (err) => {
        console.error('Error loading locations:', err);
      }
    });
  }

  onCategoryChange() {
    this.items.brand = '';
    this.items.model = '';
    this.models = [];
    console.log('Category changed to:', this.items.category);
  }

  onBrandChange() {
    this.items.model = '';

    if (this.items.brand) {
      this.loadModelsByBrand(this.items.brand);
    } else {
      this.models = [];
    }
  }

  loadModelsByBrand(brand: string) {
    const params = new HttpParams().set('brand', brand);

    this.http.get<string[]>(`${environment.apiUrl}/api/models-by-brand`, { params }).subscribe({
      next: (data) => {
        this.models = data;
        console.log(`Models loaded for ${brand}:`, data);
      },
      error: (err) => {
        console.error('Error loading models:', err);
        this.models = [];
      }
    });
  }

  async startScanner() {
    this.scannerError = '';
    this.scannedCode = '';

    if (this.scannerActive) {
      return;
    }

    try {
      this.scannerActive = true;

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        this.scannerError = 'No camera found on this device.';
        this.scannerActive = false;
        return;
      }

      this.html5QrCode = new Html5Qrcode(this.scannerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE
        ],
        verbose: false
      });

      await this.html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 140 },
          aspectRatio: 1.777
        },
        async (decodedText: string) => {
          this.scannedCode = decodedText;
          this.items.model = decodedText;
          await this.stopScanner();
        },
        () => { }
      );
    } catch (error) {
      console.error('Scanner start error:', error);
      this.scannerError = 'Unable to start camera scanner. Please allow camera access and try again.';
      this.scannerActive = false;
    }
  }

  async stopScanner() {
    try {
      if (this.html5QrCode && this.scannerActive) {
        await this.html5QrCode.stop();
        await this.html5QrCode.clear();
      }
    } catch (error) {
      console.error('Scanner stop error:', error);
    } finally {
      this.html5QrCode = null;
      this.scannerActive = false;
    }
  }

  useScannedCodeForModel() {
    if (this.scannedCode) {
      this.items.model = this.scannedCode;
    }
  }

  addItems() {
    if (
      !this.items.date ||
      !this.items.category ||
      !this.items.brand ||
      !this.items.model ||
      this.items.quantity <= 0 ||
      this.items.buyPrice < 0 ||
      this.items.sellPrice < 0 ||
      !this.items.location
    ) {
      alert('Please fill in all fields correctly before submitting.');
      return;
    }

    this.http.post(`${environment.apiUrl}/api/product`, this.items).subscribe({
      next: () => {
        alert('Your Item Was Added Successfully!');
        this.items = new addItems(0, '', '', '', '', '', '', '', '');
        this.models = [];
        this.scannedCode = '';
      },
      error: (err) => {
        console.error('Error adding item:', err);
        alert('Error adding item. Please try again.');
      }
    });
  }

}