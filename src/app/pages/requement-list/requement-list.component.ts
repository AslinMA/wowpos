import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface Requirement {
  id?: number;           // returned by backend, used for delete
  date: string;          // yyyy-MM-dd
  category: string;
  brand: string;
  model: string;
  quantity: number;
  price?: number | null;
  notes?: string | null;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Component({
  selector: 'app-requement-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './requement-list.component.html',
  styleUrls: ['./requement-list.component.css']
})
export class RequementListComponent implements OnInit {

  
  constructor(private http: HttpClient) {}

  items: Requirement[] = [];

  // bindable form model (keep strings for inputs, cast on save)
  form = {
    date: '',
    category: '',
    brand: '',
    model: '',
    quantity: '',
    price: '',
    notes: ''
  };

  saving = false;
  loading = false;

  ngOnInit(): void {
    this.loadFromServer();
  }

  addItem(): void {
    const qty = Number(this.form.quantity);
    const price = this.form.price ? Number(this.form.price) : null;

    if (!this.form.date || !this.form.category || !this.form.brand || !this.form.model || !qty || qty <= 0) {
      alert('Fill required fields correctly (quantity must be > 0)');
      return;
    }

    // Build payload that matches backend entity: RequirementItemEntity
    const payload: Requirement = {
      date: this.form.date,
      category: this.form.category.trim(),
      brand: this.form.brand.trim(),
      model: this.form.model.trim(),
      quantity: qty,
      price,
      notes: this.form.notes?.trim() || null
    };

    this.saving = true;
    this.http.post<Requirement>('/api/requirement', payload).subscribe({
      next: (saved) => {
        this.saving = false;
        alert('Your item was added!');
        // add/refresh UI
        this.items.unshift(saved); // saved contains id from backend
        this.form = { date: '', category: '', brand: '', model: '', quantity: '', price: '', notes: '' };
      },
      error: (e) => {
        this.saving = false;
        console.error(e);
        alert('Save failed');
      }
    });
  }

  loadFromServer(page = 0): void {
    this.loading = true;
    this.http.get<PageResponse<Requirement>>(`/api/requirement/items?page=${page}&size=50`).subscribe({
      next: (res) => {
        this.loading = false;
        this.items = res.content;
      },
      error: (e) => {
        this.loading = false;
        console.error(e);
        alert('Load failed');
      }
    });
  }

  remove(i: number): void {
    const row = this.items[i];
    if (!row?.id) { // unsaved optimistic row
      this.items.splice(i, 1);
      return;
    }
    this.http.delete(`/api/requirement/items/${row.id}`).subscribe({
      next: () => this.items.splice(i, 1),
      error: (e) => {
        console.error(e);
        alert('Delete failed');
      }
    });
  }

  trackByIndex = (idx: number) => idx;
}
