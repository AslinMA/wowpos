import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequementListComponent } from './requement-list.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('RequementListComponent', () => {
  let component: RequementListComponent;
  let fixture: ComponentFixture<RequementListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequementListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequementListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
