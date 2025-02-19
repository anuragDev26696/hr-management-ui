import { AfterContentInit, Component, ContentChildren, ElementRef, HostBinding, Input, QueryList, Renderer2} from "@angular/core";

@Component({
  selector: "profile-image",
  standalone: false,
  template: ` @if(icon.trim() !== ''){
    <i [class]="icon" [style.font-size.px]="size"></i>
    } @else {
    <img [src]="bg" [alt]="alt" [width]="size" [height]="size" loading="lazy" fetchpriority="high" />
    }
    @if(showStatus){
      <span class="position-absolute status translate-middle p-1 bg-{{status}} border border-2 border-light rounded-circle">
        <span class="visually-hidden">New alerts</span>
      </span>
    }
    `,
  styleUrls: [],
})
export class ProfileImageComponent {
  @Input() size: number = 35;
  @Input() bg: string = "#fff";
  @Input() alt: string = "";
  @Input() shape: "circle" | "square" = "circle";
  @Input() fit: "cover" | "contain" = "cover";
  @Input() icon: string = "";
  @Input() showStatus: boolean = false;
  @Input() status: 'success' | 'danger' = 'success';

  @HostBinding("attr.shape") shapeAttr = this.shape;
  @HostBinding("attr.boxfit") objectFitStyle = this.fit;
  // @HostBinding("style.min-width") minWidth = `${this.size+1}px`;
  // @HostBinding("style.min-height") minHeight = `${this.size+1}px`;

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {
    renderer.addClass(elementRef.nativeElement, 'profile-image');
    // renderer.setStyle(elementRef.nativeElement, '--tile-avatar-shape', this.shape);
  }
}

// Profile Title Component
@Component({
  selector: "profile-title",
  standalone: false,
  template: `<ng-content></ng-content>`,
  styleUrls: [],
})
export class ProfileTitleComponent {
  constructor(private elementRef: ElementRef, private renderer: Renderer2) {
    renderer.addClass(elementRef.nativeElement, 'profile-title');
  }
}

// Profile Subtitle Component
@Component({
  selector: "profile-subtitle",
  standalone: false,
  template: `<ng-content></ng-content>`,
  styleUrls: [],
})
export class ProfileSubtitleComponent {
  constructor(private elementRef: ElementRef, private renderer: Renderer2) {
    renderer.addClass(elementRef.nativeElement, 'profile-subtitle');
  }
}

@Component({
  selector: "app-profile-tile",
  standalone: false,
  templateUrl: "./profile-tile.component.html",
  styleUrl: "./profile-tile.component.scss",
})
export class ProfileTileComponent implements AfterContentInit {
  @ContentChildren(ProfileImageComponent) profileImage!: QueryList<ProfileImageComponent>;
  @ContentChildren(ProfileTitleComponent) profileTitle!: QueryList<ProfileTitleComponent>;
  @ContentChildren(ProfileSubtitleComponent) profileSubtitle!: QueryList<ProfileSubtitleComponent>;
  
  constructor(private elementRef: ElementRef, private renderer: Renderer2) {
    renderer.addClass(elementRef.nativeElement, 'profile-tile');
  }

  ngAfterContentInit(): void {
    // console.log("Image", this.profileImage);
    // console.log("Title", this.profileTitle);
    // console.log("Subtitle", this.profileSubtitle);
  }
}
