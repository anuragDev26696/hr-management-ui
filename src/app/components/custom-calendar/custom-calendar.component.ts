import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarEvent, CalendarService } from './calendar.service';
import { addDays, addMonths, addWeeks, eachDayOfInterval, endOfDay, endOfMonth, endOfWeek, isAfter, isSameDay, isSameMonth, isSameYear, startOfMonth, startOfWeek, subDays, subMonths, subWeeks } from 'date-fns';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

type ViewMode = 'month' | 'week' | 'day';

@Component({
  selector: 'app-custom-calendar',
  imports: [DatePipe, FormsModule, TitleCasePipe],
  templateUrl: './custom-calendar.component.html',
  styleUrl: './custom-calendar.component.scss'
})
export class CustomCalendarComponent implements OnInit, OnChanges {
  @Input() calendarDate: Date = new Date();
  @Output() public dateEvent: EventEmitter<Date> = new EventEmitter();
  @Output() public monthChange: EventEmitter<Date> = new EventEmitter();
  currentView: ViewMode = 'month';
  today: Date = new Date();
  selectedDate: Date = new Date();
  prevDate: Date = new Date();
  days: Date[] = [];
  expandedDate: Date | null = null;
  weeks: Date[][] = [];
  events: CalendarEvent[] = [];
  filteredEvents: CalendarEvent[] = [];
  viewModes: Array<ViewMode> = ['month', 'week'];
  activeFilter: string = '';

  constructor(private calendarService: CalendarService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['calendarDate'] && !changes['calendarDate'].firstChange) {
      const newDate = new Date(this.calendarDate);
      if (this.selectedDate.toDateString() !== newDate.toDateString()) {
        this.selectedDate = newDate;
        this.generateCalendarDays();
      }
    }
  }

  ngOnInit() {
    // if(this.calendarDate.trim() =="")
      this.generateCalendarDays();
    this.calendarService.events$.subscribe(events => {
      this.events = events;
      this.filteredEvents = this.applyRecurring(events);
    });
  }

  changeView(mode: ViewMode) {
    this.currentView = mode;
    this.generateCalendarDays();
  }

  // generateCalendarDays() {
  //   let start: Date, end: Date;

  //   if (this.currentView === 'month') {
  //     start = startOfWeek(startOfMonth(this.selectedDate));
  //     end = endOfWeek(endOfMonth(this.selectedDate));
  //   } else if (this.currentView === 'week') {
  //     start = startOfWeek(this.selectedDate);
  //     end = endOfWeek(this.selectedDate);
  //   } else {
  //     start = this.selectedDate;
  //     end = this.selectedDate;
  //   }

  //   this.days = eachDayOfInterval({ start, end });
  // }
  generateCalendarDays() {
    let start: Date, end: Date;
    if (this.currentView === 'month') {
      start = startOfWeek(startOfMonth(this.selectedDate), { weekStartsOn: 0 });
      end = endOfWeek(endOfMonth(this.selectedDate), { weekStartsOn: 0 });
    } else if (this.currentView === 'week') {
      start = startOfWeek(this.selectedDate, { weekStartsOn: 0 });
      end = endOfWeek(this.selectedDate, { weekStartsOn: 0 });
    } else {
      start = this.selectedDate;
      end = this.selectedDate;
    }
  
    // Flat list of days
    this.days = eachDayOfInterval({ start, end });
  
    // Group into weeks only for 'month' and 'week' views
    if (this.currentView === 'month' || this.currentView === 'week') {
      this.weeks = [];
      for (let i = 0; i < this.days.length; i += 7) {
        this.weeks.push(this.days.slice(i, i + 7));
      }
    } else {
      this.weeks = []; // clear weeks for 'day' view
    }
  }
  

  selectDate(event: Event, day: Date) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if(!event.isTrusted) return;
    this.selectedDate = day;
    if(!isSameDay(this.prevDate, this.selectedDate)){
      this.dateEvent.emit(this.selectedDate);
    }
    this.prevDate = this.selectedDate;
    this.toggleExpand(day);
  }

  createEvent(event: Event, day: Date) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if(!event.isTrusted) return;
    const newEvent: CalendarEvent = {
      id: this.generateId(),
      title: 'New Event',
      start: day,
      color: '#3f51b5',
      type: 'default',
      recurrence: null,
      showTimes: true,
      eventActions: ()=>{},
      hideActions: true,
    };
    this.calendarService.addEvent(newEvent);
  }

  applyRecurring(events: CalendarEvent[]): CalendarEvent[] {
    const result = [...events];

    for (const e of events) {
      if (e.recurrence === 'daily') {
        for (let i = 1; i < 7; i++) {
          const clone = { ...e, id: this.generateId(), start: new Date(e.start) };
          clone.start.setDate(clone.start.getDate() + i);
          result.push(clone);
        }
      }
    }

    return result;
  }

  filterByType(type: string) {
    this.activeFilter = type;
    if (type) {
      this.filteredEvents = this.events.filter(e => e.type === type);
    } else {
      this.filteredEvents = this.applyRecurring(this.events);
    }
  }

  openEditModal(event: CalendarEvent) {
    const newTitle = prompt('Edit event title', event.title);
    if (newTitle !== null) {
      this.calendarService.updateEvent({ ...event, title: newTitle });
    }
  }

  public prev(event: Event): void {
    if(!event.isTrusted) return;
    event.preventDefault();
    event.stopPropagation();
    // Subtract days from the selected date based on the current view
    this.selectedDate = this.currentView === 'month'
      ? subMonths(this.selectedDate, 1)
      : subWeeks(this.selectedDate, 1);
  
    // Generate the calendar days again
    this.generateCalendarDays();
    const emitDate = this.currentView === 'month'
      ? startOfMonth(this.selectedDate)
      : startOfWeek(this.selectedDate, { weekStartsOn: 0 });

    this.monthChange.emit(emitDate);
    this.dateEvent.emit(this.selectedDate);
  }
  
  public next(event: Event): void {
    if(!event.isTrusted) return;
    event.preventDefault();
    event.stopPropagation();
    // Add days to the selected date based on the current view
    this.selectedDate = this.currentView === 'month'
      ? addMonths(this.selectedDate, 1)
      : addWeeks(this.selectedDate, 1);
  
    // Generate the calendar days again
    this.generateCalendarDays();
    const emitDate = this.currentView === 'month'
      ? startOfMonth(this.selectedDate)
      : startOfWeek(this.selectedDate, { weekStartsOn: 0 });

    this.monthChange.emit(emitDate);
    this.dateEvent.emit(this.selectedDate);
  }

  reset() {
    this.selectedDate = new Date();
    this.generateCalendarDays();
  }

  private generateId = () => `event-${Math.random().toString(36).substring(2, 9)}`;

  public trackDay(day: Date): string {
    return `${day.getMonth()}_${day.getDate()}`;
  }
  public isToday = (dateStr: Date): boolean  => isSameDay(dateStr, this.today) && isSameYear(dateStr, this.today) && isSameMonth(dateStr, this.today);
  public isSelected = (dateStr: Date): boolean  => isSameDay(dateStr, this.selectedDate) && isSameYear(dateStr, this.selectedDate) && isSameMonth(dateStr, this.selectedDate);


  toggleExpand(day: Date) {
    if(this.expandedDate == null){
      this.expandedDate = day;
      return;
    }
    const isSame = this.expandedDate?.toDateString() === day.toDateString();
    this.expandedDate = isSame ? null : day;
  }
  
  isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }
  public isExpanded(week: Date[]): boolean {
    return week.some(day => this.expandedDate && isSameDay(day, this.expandedDate))
  }
  public isFromOtherMonth(day: Date): boolean {
    return !isSameMonth(day, this.selectedDate) || !isSameYear(day, this.selectedDate);
  }
  public isFutureDate(day: Date): boolean {
    return isAfter(endOfDay(day), endOfDay(this.today));
  }
  public get isCurrentMonth(): boolean {
    return isSameMonth(this.selectedDate, this.today) && isSameYear(this.selectedDate, this.today);
  }
  public hasEventsOnDate(date: Date): boolean {
    return this.filteredEvents.some(e => this.isSameDay(e.start, date));
  }
  public eventArray(date: Date): Array<{id: string, color: string}> {
    return this.filteredEvents.filter(e => this.isSameDay(e.start, date)).map((e, index) => ({id: `${e.id}_dot_${index}`, color: e.color || '#ddd'}));
  }
  public get expandedFilter(): Array<CalendarEvent> {
    return this.filteredEvents.filter(e => this.expandedDate != null ? this.isSameDay(e.start, this.expandedDate) : e);
  }
}
