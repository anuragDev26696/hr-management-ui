import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeFormat'
})
export class HourMinutePipe implements PipeTransform {

  transform(value: number): string {
    if (isNaN(value) || value < 0) return '0 minutes';

    const hours = Math.floor(value / 60);
    const minutes = value % 60;

    const hourPart = hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : '';
    const minutePart = minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : '';

    if (hourPart && minutePart) return `${hourPart}, ${minutePart}`;
    return hourPart || minutePart || '0 minutes';
  }

}
