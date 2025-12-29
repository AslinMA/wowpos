import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetProfitReportsComponent } from './net-profit-reports.component';

describe('NetProfitReportsComponent', () => {
  let component: NetProfitReportsComponent;
  let fixture: ComponentFixture<NetProfitReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetProfitReportsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NetProfitReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
