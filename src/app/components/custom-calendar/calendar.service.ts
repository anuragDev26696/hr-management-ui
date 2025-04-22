import { Injectable } from '@angular/core';
import { isSameDay, addDays, addWeeks, addMonths } from 'date-fns';
import { BehaviorSubject } from 'rxjs';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end?: Date;
  allDay?: boolean;
  color?: string;
  type?: string; // e.g. 'meeting', 'task', For filtering by event type
  recurrence?: 'daily' | 'weekly' | 'monthly' | null; // Optional recurrence rule
  showTimes: boolean;
  eventActions: (e: Event, event: CalendarEvent, action: calendarActions) => void;
  // deleteAction: (e: Event, event: CalendarEvent) => void;
  hideActions: boolean;
}
export type calendarActions = "Edit" | "View" | "Delete";

@Injectable({providedIn: 'root'})
export class CalendarService {
    private _events = new BehaviorSubject<CalendarEvent[]>([]);
    events$ = this._events.asObservable();

    // Your recurrence handling logic
    public getEventsForDate(date: Date, filterType: string[] = []): CalendarEvent[] {
        return this.events.flatMap(event => {
          const occurrences = event.recurrence
            ? this.generateRecurrences(event, date)
            : [event];
    
          return occurrences.filter(occ =>
            this.isSameDay(occ.start, date) &&
            (filterType.length === 0 || filterType.includes(occ.type ?? ''))
          );
        });
    }

    public generateRecurrences(event: CalendarEvent, rangeDate: Date): CalendarEvent[] {
        const occurrences = [];
        let current = new Date(event.start);
        const maxIterations = 50;

        for (let i = 0; i < maxIterations; i++) {
            if (current > rangeDate) break;

            occurrences.push({
            ...event,
            start: new Date(current),
            });

            current = event.recurrence === 'daily'
            ? addDays(current, 1)
            : event.recurrence === 'weekly'
            ? addWeeks(current, 1)
            : addMonths(current, 1);
        }

        return occurrences;
    }

    // 👉 Utility functions (or import from date-fns)
  public isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  }

  public addDays(date: Date, days: number): Date {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate;
  }

  public addWeeks(date: Date, weeks: number): Date {
    return this.addDays(date, weeks * 7);
  }

  public addMonths(date: Date, months: number): Date {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + months);
    return newDate;
  }


  get events(): CalendarEvent[] {
    return this._events.value;
  }

  addEvent(event: CalendarEvent) {
    this._events.next([...this.events, event]);
  }

  updateEvent(updated: CalendarEvent) {
    this._events.next(this.events.map(e => e.id === updated.id ? updated : e));
  }

  deleteEvent(id: string) {
    this._events.next(this.events.filter(e => e.id !== id));
  }

  filterEventsByType(type: string) {
    const filtered = this.events.filter(e => e.type === type);
    this._events.next(filtered);
  }

  setAllEvents(events: CalendarEvent[]) {
    this._events.next(events);
  }
}