import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DamageComponent } from './damage.component';

describe('DamageComponent', () => {
  let component: DamageComponent;
  let fixture: ComponentFixture<DamageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DamageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DamageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
