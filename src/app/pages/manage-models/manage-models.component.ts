import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Model } from '../../models/model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-manage-models',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './manage-models.component.html',
  styleUrl: './manage-models.component.css'
})
export class ManageModelsComponent implements OnInit {

  models: Model[] = [];
  filteredModels: Model[] = [];

  currentModel: Model = new Model(null, '', '', '');
  isEditMode: boolean = false;

  brands: string[] = ['Apple', 'Samsung', 'Redmi', 'Nokia'];
  categories: string[] = ['Display', 'Temperd', 'Handfree', 'Mic', 'Charger'];

  searchTerm: string = '';
  filterBrand: string = '';
  filterCategory: string = '';

  private apiUrl = `${environment.apiUrl}/api/models`;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadModels();
  }

  loadModels() {
    this.http.get<Model[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.models = data;
        this.filteredModels = data;
        console.log('Models loaded:', data);
      },
      error: (err) => {
        console.error('Error loading models:', err);
        alert('Error loading models');
      }
    });
  }

  addModel() {
    if (!this.currentModel.brand || !this.currentModel.modelName || !this.currentModel.category) {
      alert('Please fill in all fields');
      return;
    }

    const payload = {
      brand: this.currentModel.brand,
      modelName: this.currentModel.modelName,
      category: this.currentModel.category
    };

    console.log('Sending model:', payload);

    this.http.post<Model>(this.apiUrl, payload).subscribe({
      next: () => {
        alert('Model added successfully!');
        this.loadModels();
        this.resetForm();
      },
      error: (err) => {
        console.error('Error adding model:', err);
        console.error('Error details:', err.error);
        alert('Error adding model: ' + (err.error?.message || err.message));
      }
    });
  }

  editModel(model: Model) {
    this.isEditMode = true;
    this.currentModel = { ...model };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateModel() {
    this.http.put<Model>(`${this.apiUrl}/${this.currentModel.id}`, this.currentModel).subscribe({
      next: () => {
        alert('Model updated successfully!');
        this.loadModels();
        this.resetForm();
      },
      error: (err) => {
        console.error('Error updating model:', err);
        alert('Error updating model');
      }
    });
  }

  deleteModel(id: number) {
    if (confirm('Are you sure you want to delete this model?')) {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe({
        next: () => {
          alert('Model deleted successfully!');
          this.loadModels();
        },
        error: (err) => {
          console.error('Error deleting model:', err);
          alert('Error deleting model');
        }
      });
    }
  }

  onSubmit() {
    if (this.isEditMode) {
      this.updateModel();
    } else {
      this.addModel();
    }
  }

  resetForm() {
    this.currentModel = new Model(null, '', '', '');
    this.isEditMode = false;
  }

  applyFilters() {
    this.filteredModels = this.models.filter(model => {
      const matchesSearch =
        !this.searchTerm ||
        model.modelName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        model.brand.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesBrand = !this.filterBrand || model.brand === this.filterBrand;
      const matchesCategory = !this.filterCategory || model.category === this.filterCategory;

      return matchesSearch && matchesBrand && matchesCategory;
    });
  }

  clearFilters() {
    this.searchTerm = '';
    this.filterBrand = '';
    this.filterCategory = '';
    this.filteredModels = this.models;
  }
}