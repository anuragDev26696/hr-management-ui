import { NgTemplateOutlet } from '@angular/common';
import { AfterContentInit, Component, ContentChildren, ElementRef, EventEmitter, forwardRef, HostListener, Input, Optional, Output, QueryList, Self, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { AbstractControl, ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';

@Component({
  selector: 'app-option',
  template: `
    <ng-template #tpl>
      <li class="dropdown-item d-flex align-items-center gap-2 overflow-hidden" [class.active]="focused || selected" [class.disabled]="disabled" (click)="handleClick()" [attr.aria-selected]="selected" role="option">
        @if (multiple) {
          <input type="checkbox" class="form-check-input mt-0" [id]="value" [checked]="selected" (click)="$event.stopPropagation()" [disabled]="disabled"/>
          <label [for]="value"><ng-content>{{label}}</ng-content></label>
        } @else {
          <ng-content></ng-content>
        }
      </li>
    </ng-template>
  `,
  styles: `
    :host{-moz-user-select: none; -webkit-user-select: none; user-select: none;}
    .dropdown-item.active, .dropdown-item:active { background-color: #4782da; }
    .dropdown-item.disabled { color: #ccc; pointer-events: none; }
  `,
})
export class AppOptionComponent {
  @Input() value: any;
  @Input() label: string = '';
  @Input() disabled: boolean = false;
  @Input() selected: boolean = false;
  @Input() focused: boolean = false;
  @ViewChild('tpl', { static: true }) templateRef!: TemplateRef<any>;

  @Output() select = new EventEmitter<void>();
  public multiple: boolean = false;

  constructor(public elementRef: ElementRef) {}

  handleClick() {
    if (!this.disabled) {
      this.selected = true;
      this.select.emit();
    }
  }
}

@Component({
  selector: 'app-muli-select',
  imports: [FormsModule, NgTemplateOutlet ],
  templateUrl: './muli-select.component.html',
  styleUrl: './muli-select.component.scss',
  // providers: [
  //   {
  //     provide: NG_VALUE_ACCESSOR,
  //     useExisting: forwardRef(() => MuliSelectComponent),
  //     multi: true,
  //   }
  // ]
})
export class MuliSelectComponent implements AfterContentInit, ControlValueAccessor {
  @ContentChildren(AppOptionComponent) options!: QueryList<AppOptionComponent>;
  @ViewChild('dropdownRoot') dropdownRoot!: ElementRef;
  @ViewChildren('optionRef') optionRefs!: QueryList<ElementRef>;

  @Input() placeholder: string = 'Select...';
  @Input() multiple: boolean = false;
  @Input() disabled: boolean = false;
  // @Input() class: string = "";
  @Input() errorMsg: string = "";
  @Output() onsearch: EventEmitter<string> = new EventEmitter<string>();
  @Output() selectionChange: EventEmitter<string[]> = new EventEmitter<string[]>();

  public dropdownOpen = false;
  public selectedValues: any[] = [];
  private previousSelection: any[] = [];
  public autoPosition: 'top' | 'bottom' = 'bottom';
  public searchText: string = '';
  filteredOptions: AppOptionComponent[] = [];
  public focusedIndex: number = -1;

  constructor(@Optional() @Self() public ngControl: NgControl){
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }
  private get control(): AbstractControl | null {
    return this.ngControl?.control || null;
  }
  public get statusClass(): string {
    if (!this.control) return '';
    if (this.control.valid) return 'is-valid';
    if (this.control.touched && this.control.invalid) return 'is-invalid';
    return '';
  }

  private onChange = (value: any) => {};
  private onTouched = () => {};

  ngAfterContentInit() {
    this.updateOptionStates();
    this.listenToOptionClicks();
    this.filteredOptions = this.options.toArray(); // ← Ensure filteredOptions has all items initially
    // Pass `multiple` into each option
    this.options.forEach(option => {
      option.multiple = this.multiple;
    });
    this.options.changes.subscribe(() => {
      this.filteredOptions = this.options.toArray();
      this.options.forEach(option => {
        option.multiple = this.multiple;
      });
      this.updateFilteredOptions();
      this.listenToOptionClicks();
    })
    this.setAutoPosition();
  }

  updateFilteredOptions() {
    const term = this.searchText.toLowerCase().trim();
    this.filteredOptions = this.options.filter(opt =>
      opt.label.toLowerCase().includes(term)
    );

    this.updateOptionStates();
    this.onsearch.emit(this.searchText);
  }

  updateOptionStates() {
    if (!this.options) return; // <-- safely exit if options are not initialized yet

    // Update selection for all options
    this.options.forEach(opt => {
      opt.selected = this.selectedValues.includes(opt.value);
      opt.focused = false; // Reset all
    });
  
    // Only mark focused option within filtered ones
    if (this.focusedIndex >= 0 && this.focusedIndex < this.filteredOptions.length) {
      this.filteredOptions[this.focusedIndex].focused = true;
    }

    // ✅ Emit only if selection actually changed
    if (!this.arraysEqual(this.previousSelection, this.selectedValues)) {
      this.previousSelection = [...this.selectedValues];
      this.selectionChange.emit(this.selectedValues);
    }
  }
  
  // Helper
  private arraysEqual(arr1: any[], arr2: any[]) {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, i) => val === arr2[i]);
  }
  private listenToOptionClicks() {
    this.options.forEach(option => {
      option.select.subscribe(() => this.toggleOption(option));
    });
  }  

  onSearchChange(term: string) {
    this.updateFilteredOptions();
  }

  writeValue(value: any): void {
    this.selectedValues = Array.isArray(value) ? value : [value];
    this.previousSelection = [...this.selectedValues]; // Prevent triggering emit
    this.updateOptionStates();
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
    this.focusedIndex = -1;
    this.searchText = '';
    this.updateFilteredOptions();
    this.setAutoPosition();
  }

  toggleOption(option: AppOptionComponent): void {
    const idx = this.selectedValues.indexOf(option.value);
    if (idx > -1) {
      this.selectedValues.splice(idx, 1);
    } else {
      if (!this.multiple) {
        this.selectedValues = [option.value];
        this.dropdownOpen = false;
      } else {
        this.selectedValues.push(option.value);
      }
    }
    this.onChange(this.selectedValues);
    this.updateOptionStates();
  }

  selectAll(): void {
    this.selectedValues = this.filteredOptions.filter(o => !o.disabled).map(o => o.value);
    this.onChange(this.selectedValues);
    this.updateOptionStates();
  }

  clearAll(): void {
    this.selectedValues = [];
    this.onChange(this.selectedValues);
    this.updateOptionStates();
  }

  @HostListener('keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (!this.dropdownOpen || this.filteredOptions.length < 1) return;

    const count = this.filteredOptions.length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex = (this.focusedIndex + 1) % count;
        this.scrollToFocused();
        this.updateOptionStates();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex = (this.focusedIndex - 1 + count) % count;
        this.scrollToFocused();
        this.updateOptionStates();
        break;
      case 'Enter':
        event.preventDefault();
        const focusedOption = this.filteredOptions[this.focusedIndex];
        if (focusedOption) this.toggleOption(focusedOption);
        break;
      case 'Escape':
        event.preventDefault();
        this.dropdownOpen = false;
        this.focusedIndex = -1;
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const clickedInside = this.dropdownRoot.nativeElement.contains(event.target);
    if (!clickedInside && this.dropdownOpen) {
      this.dropdownOpen = false;
      this.searchText = ''; // Clear the search input
    }
  }


  protected scrollToFocused() {
    const option = this.filteredOptions[this.focusedIndex];
    if (option && option.elementRef) {
      option.elementRef.nativeElement.scrollIntoView({ block: 'nearest' });
    }
  }

  public get selectedLabels(): string[] {
    return this.options
      ? this.options
          .filter(option => this.selectedValues.includes(option.value))
          .map(option => option.label || option.elementRef.nativeElement.textContent.trim())
      : [];
  }

  scrollToFocusedOption() {
    if (this.optionRefs && this.focusedIndex >= 0) {
      const el = this.optionRefs.toArray()[this.focusedIndex];
      el?.nativeElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }
  
  private setAutoPosition() {
    setTimeout(() => {
      if (!this.dropdownRoot) return;
      const rect = this.dropdownRoot.nativeElement.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - rect.bottom;
      this.autoPosition = spaceBelow < 200 ? 'top' : 'bottom';
    }, 0);
  }
}
