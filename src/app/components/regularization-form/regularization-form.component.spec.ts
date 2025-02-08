import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegularizationFormComponent } from './regularization-form.component';

describe('RegularizationFormComponent', () => {
  let component: RegularizationFormComponent;
  let fixture: ComponentFixture<RegularizationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegularizationFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegularizationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
