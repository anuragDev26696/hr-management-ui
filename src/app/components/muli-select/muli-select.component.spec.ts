import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MuliSelectComponent } from './muli-select.component';

describe('MuliSelectComponent', () => {
  let component: MuliSelectComponent;
  let fixture: ComponentFixture<MuliSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MuliSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MuliSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
