import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { addItems } from '../../models/addItems';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-items',
  standalone: true,
  imports: [FormsModule, HttpClientModule, CommonModule],
  templateUrl: './add-items.component.html',
  styleUrl: './add-items.component.css'
})
export class AddItemsComponent implements OnInit {

  public items: addItems = new addItems(0, "", "", "", "", "", "", "", "");

  // Dynamic dropdown data
  categories: string[] = [];
  brands: string[] = [];
  models: string[] = [];
  locations: string[] = [];

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.loadCategories();
    this.loadBrands();
    this.loadLocations();
  }

  // Load categories from backend
  loadCategories() {
    this.http.get<string[]>('/api/categories').subscribe({
      next: (data) => {
        this.categories = data;
        console.log('Categories loaded:', data);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  // Load brands from backend
  loadBrands() {
    this.http.get<string[]>('/api/brands').subscribe({
      next: (data) => {
        this.brands = data;
        console.log('Brands loaded:', data);
      },
      error: (err) => {
        console.error('Error loading brands:', err);
      }
    });
  }

  // Load locations from backend
  loadLocations() {
    this.http.get<string[]>('/api/locations').subscribe({
      next: (data) => {
        this.locations = data;
        console.log('Locations loaded:', data);
      },
      error: (err) => {
        console.error('Error loading locations:', err);
      }
    });
  }

  // When category changes, clear brand and model
  onCategoryChange() {
    this.items.brand = '';
    this.items.model = '';
    this.models = [];
    console.log('Category changed to:', this.items.category);
  }

  // When brand changes, load models for that brand
  onBrandChange() {
    this.items.model = ''; // Clear model selection
    
    if (this.items.brand) {
      this.loadModelsByBrand(this.items.brand);
    } else {
      this.models = [];
    }
  }

  // Load models filtered by brand
  loadModelsByBrand(brand: string) {
    this.http.get<string[]>(`/api/models-by-brand?brand=${brand}`).subscribe({
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

  // Submit form
  addItems() {
    // Validation
    if (
      !this.items.date ||
      !this.items.category ||
      !this.items.brand ||
      !this.items.model ||
      !this.items.quantity ||
      !this.items.buyPrice ||
      !this.items.sellPrice ||
      !this.items.location
    ) {
      alert("Please fill in all fields before submitting.");
      return;
    }

    // Submit to backend
    this.http.post('/api/product', this.items).subscribe({
      next: (res) => {
        alert("Your Item Was Added Successfully!");
        // Reset form
        this.items = new addItems(0, "", "", "", "", "", "", "", "");
        this.models = [];
      },
      error: (err) => {
        console.error('Error adding item:', err);
        alert("Error adding item. Please try again.");
      }
    });
  }
}
