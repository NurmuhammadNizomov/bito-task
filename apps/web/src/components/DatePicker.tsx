import { DatePicker, Portal } from '@chakra-ui/react';
import { CalendarDate, type DateValue } from '@internationalized/date';
import { FiCalendar } from 'react-icons/fi';

export interface DatePickerFieldProps {
  value?: Date;
  onChange?: (date: Date) => void;
  label?: string;
  placeholder?: string;
  min?: Date;
  max?: Date;
}

function toCalendarDate(d: Date): CalendarDate {
  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function toJSDate(cd: DateValue): Date {
  return new Date(cd.year, cd.month - 1, cd.day);
}

export function DatePickerField({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  min,
  max,
}: DatePickerFieldProps) {
  return (
    <DatePicker.Root
      selectionMode="single"
      value={value ? [toCalendarDate(value)] : undefined}
      onValueChange={(details) => {
        if (details.value[0]) {
          onChange?.(toJSDate(details.value[0]));
        }
      }}
      min={min ? toCalendarDate(min) : undefined}
      max={max ? toCalendarDate(max) : undefined}
    >
      {label && <DatePicker.Label>{label}</DatePicker.Label>}
      <DatePicker.Control>
        <DatePicker.Input placeholder={placeholder} />
        <DatePicker.IndicatorGroup>
          <DatePicker.Trigger>
            <FiCalendar />
          </DatePicker.Trigger>
        </DatePicker.IndicatorGroup>
      </DatePicker.Control>
      <Portal>
        <DatePicker.Positioner>
          <DatePicker.Content>
            <DatePicker.View view="day">
              <DatePicker.Header />
              <DatePicker.DayTable />
            </DatePicker.View>
            <DatePicker.View view="month">
              <DatePicker.Header />
              <DatePicker.MonthTable />
            </DatePicker.View>
            <DatePicker.View view="year">
              <DatePicker.Header />
              <DatePicker.YearTable />
            </DatePicker.View>
          </DatePicker.Content>
        </DatePicker.Positioner>
      </Portal>
    </DatePicker.Root>
  );
}
