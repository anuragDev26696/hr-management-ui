import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegularizationsComponent } from './regularizations.component';

describe('RegularizationsComponent', () => {
  let component: RegularizationsComponent;
  let fixture: ComponentFixture<RegularizationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegularizationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegularizationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
