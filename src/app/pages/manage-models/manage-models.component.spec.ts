import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageModelsComponent } from './manage-models.component';

describe('ManageModelsComponent', () => {
  let component: ManageModelsComponent;
  let fixture: ComponentFixture<ManageModelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageModelsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
