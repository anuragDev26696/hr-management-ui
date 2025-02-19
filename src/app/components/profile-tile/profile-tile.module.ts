import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileImageComponent, ProfileSubtitleComponent, ProfileTileComponent, ProfileTitleComponent } from './profile-tile.component';



@NgModule({
  declarations: [
    ProfileImageComponent,
    ProfileTileComponent,
    ProfileSubtitleComponent,
    ProfileTitleComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ProfileImageComponent,
    ProfileTileComponent,
    ProfileSubtitleComponent,
    ProfileTitleComponent
  ]
})
export class ProfileTileModule { }
