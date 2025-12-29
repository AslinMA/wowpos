import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface NetProfitSummary {
  fromDate: string;
  toDate: string;
  salesNet: number;
  salesCOGS: number;
  salesProfit: number;
  repairRevenue: number;
  repairPartsCost: number;
  repairPartsRevenue: number;
  repairLaborRevenue: number;
  repairPartsProfit: number;
  repairProfit: number;
  damageLoss: number;
  returnLoss: number;
  totalLoss: number;
  grossProfit: number;
  trueNetProfit: number;
  lossPctOfSales: number;
}

@Component({
  selector: 'app-net-profit-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './net-profit-reports.component.html',
  styleUrls: ['./net-profit-reports.component.css']
})
export class NetProfitReportsComponent implements OnInit {
  fromDate = '';
  toDate = '';
  loading = false;
  error = '';
  summary: NetProfitSummary | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.loading = true;
    this.error = '';
    this.summary = null;

    let url = 'http://localhost:8080/api/reports/net-profit';
    if (this.fromDate && this.toDate) {
      url += `?from=${this.fromDate}&to=${this.toDate}`;
    }

    this.http.get<NetProfitSummary>(url).subscribe({
      next: (data) => {
        this.summary = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load net profit summary';
        this.loading = false;
      }
    });
  }
}
