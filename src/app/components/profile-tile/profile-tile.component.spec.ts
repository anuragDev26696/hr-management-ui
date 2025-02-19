import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileTileComponent } from './profile-tile.component';

describe('ProfileTileComponent', () => {
  let component: ProfileTileComponent;
  let fixture: ComponentFixture<ProfileTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileTileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
