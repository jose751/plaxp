import { useState, useRef, useEffect } from 'react';
import { HiChevronLeft, HiChevronRight, HiCalendar } from 'react-icons/hi';

// ==================== DATE PICKER ====================

interface DatePickerProps {
  value: string; // formato YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  minDate?: string;
  accentColor?: 'orange' | 'yellow' | 'primary' | 'blue';
}

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const getAccentClasses = (color: string) => {
  switch (color) {
    case 'orange':
      return {
        selected: 'bg-orange-500 text-white',
        hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/30',
        today: 'ring-orange-500',
        quickBtn: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
      };
    case 'yellow':
      return {
        selected: 'bg-yellow-500 text-white',
        hover: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
        today: 'ring-yellow-500',
        quickBtn: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
      };
    case 'blue':
      return {
        selected: 'bg-blue-500 text-white',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
        today: 'ring-blue-500',
        quickBtn: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      };
    default:
      return {
        selected: 'bg-primary text-white',
        hover: 'hover:bg-primary/10',
        today: 'ring-primary',
        quickBtn: 'border-primary bg-primary/10 text-primary',
      };
  }
};

export const DatePicker = ({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  minDate: _minDate,
  accentColor = 'primary',
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value + 'T00:00:00');
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const accent = getAccentClasses(accentColor);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dateStr = newDate.toISOString().split('T')[0];
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleQuickSelect = (daysFromToday: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    const dateStr = date.toISOString().split('T')[0];
    onChange(dateStr);
    setIsOpen(false);
  };

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()];
    return `${dayOfWeek}, ${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
  };

  const isToday = (day: number) => {
    return (
      viewDate.getFullYear() === today.getFullYear() &&
      viewDate.getMonth() === today.getMonth() &&
      day === today.getDate()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      viewDate.getFullYear() === selectedDate.getFullYear() &&
      viewDate.getMonth() === selectedDate.getMonth() &&
      day === selectedDate.getDate()
    );
  };

  const days = getDaysInMonth(viewDate);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
      >
        <span className={value ? '' : 'text-neutral-400'}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <HiCalendar className="w-5 h-5 text-neutral-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-72 bg-white dark:bg-dark-card border border-neutral-200 dark:border-dark-border rounded-xl shadow-xl p-4">
          {/* Quick select */}
          <div className="flex gap-2 mb-4">
            {[
              { label: 'Hoy', days: 0 },
              { label: 'Mañana', days: 1 },
              { label: '+7 días', days: 7 },
            ].map(({ label, days }) => {
              const targetDate = new Date();
              targetDate.setDate(targetDate.getDate() + days);
              const isActive = value === targetDate.toISOString().split('T')[0];
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleQuickSelect(days)}
                  className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-all font-medium ${
                    isActive
                      ? accent.quickBtn
                      : 'border-neutral-200 dark:border-dark-border text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-hover transition-colors"
            >
              <HiChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-hover transition-colors"
            >
              <HiChevronRight className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div key={index} className="aspect-square">
                {day !== null && (
                  <button
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    className={`w-full h-full flex items-center justify-center text-sm rounded-lg transition-all ${
                      isSelected(day)
                        ? accent.selected
                        : isToday(day)
                        ? `ring-2 ${accent.today} ring-inset text-neutral-900 dark:text-neutral-100 ${accent.hover}`
                        : `text-neutral-700 dark:text-neutral-300 ${accent.hover}`
                    }`}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== TIME PICKER ====================

interface TimePickerProps {
  value: string; // formato HH:mm
  onChange: (time: string) => void;
  placeholder?: string;
  accentColor?: 'orange' | 'yellow' | 'primary' | 'blue';
}

export const TimePicker = ({
  value,
  onChange,
  placeholder: _placeholder = 'Seleccionar hora',
  accentColor = 'primary',
}: TimePickerProps) => {
  const accent = getAccentClasses(accentColor);

  // Estado local para permitir edición libre
  const [hourInput, setHourInput] = useState('');
  const [minuteInput, setMinuteInput] = useState('');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [initialized, setInitialized] = useState(false);

  // Convertir hora 24h a 12h con período
  const get12HourFormat = (hour24: number) => {
    const p = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    return { hour12, period: p as 'AM' | 'PM' };
  };

  // Convertir hora 12h a 24h
  const to24Hour = (hour12: number, p: 'AM' | 'PM') => {
    if (p === 'AM') {
      return hour12 === 12 ? 0 : hour12;
    } else {
      return hour12 === 12 ? 12 : hour12 + 12;
    }
  };

  // Inicializar desde value
  useEffect(() => {
    if (value && !initialized) {
      const [h24, m] = value.split(':').map(Number);
      const { hour12, period: p } = get12HourFormat(h24);
      setHourInput(String(hour12));
      setMinuteInput(String(m).padStart(2, '0'));
      setPeriod(p);
      setInitialized(true);
    }
  }, [value, initialized]);

  // Actualizar el valor cuando cambian los inputs (solo si son válidos)
  const updateValue = (h: string, m: string, p: 'AM' | 'PM') => {
    const hour = parseInt(h);
    const minute = parseInt(m);

    if (!isNaN(hour) && hour >= 1 && hour <= 12 && !isNaN(minute) && minute >= 0 && minute <= 59) {
      const hour24 = to24Hour(hour, p);
      const timeStr = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      onChange(timeStr);
    } else if (h === '' && m === '') {
      // Si ambos están vacíos, limpiar el valor
      onChange('');
    }
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setHourInput(val);
    updateValue(val, minuteInput, period);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMinuteInput(val);
    updateValue(hourInput, val, period);
  };

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    setPeriod(newPeriod);
    updateValue(hourInput, minuteInput, newPeriod);
  };

  return (
    <div className="flex items-center gap-1">
      {/* Input Hora */}
      <input
        type="text"
        value={hourInput}
        onChange={handleHourChange}
        placeholder="12"
        maxLength={2}
        className="w-12 px-2 py-2.5 text-center text-sm font-medium border border-neutral-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />

      <span className="text-lg font-bold text-neutral-400">:</span>

      {/* Input Minutos */}
      <input
        type="text"
        value={minuteInput}
        onChange={handleMinuteChange}
        placeholder="00"
        maxLength={2}
        className="w-12 px-2 py-2.5 text-center text-sm font-medium border border-neutral-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />

      {/* Selector AM/PM */}
      <div className="flex rounded-lg overflow-hidden border border-neutral-300 dark:border-dark-border">
        <button
          type="button"
          onClick={() => handlePeriodChange('AM')}
          className={`px-3 py-2.5 text-xs font-bold transition-all ${
            period === 'AM'
              ? accent.selected
              : 'bg-white dark:bg-dark-bg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover'
          }`}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => handlePeriodChange('PM')}
          className={`px-3 py-2.5 text-xs font-bold transition-all border-l border-neutral-300 dark:border-dark-border ${
            period === 'PM'
              ? accent.selected
              : 'bg-white dark:bg-dark-bg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover'
          }`}
        >
          PM
        </button>
      </div>
    </div>
  );
};

// ==================== DURATION PICKER ====================

interface DurationPickerProps {
  value: number; // minutos
  onChange: (minutes: number) => void;
  accentColor?: 'orange' | 'yellow' | 'primary' | 'blue';
}

const DURATIONS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '1 hora', minutes: 60 },
  { label: '1.5 hrs', minutes: 90 },
  { label: '2 horas', minutes: 120 },
];

export const DurationPicker = ({
  value,
  onChange,
  accentColor = 'primary',
}: DurationPickerProps) => {
  const accent = getAccentClasses(accentColor);

  return (
    <div className="flex flex-wrap gap-2">
      {DURATIONS.map(({ label, minutes }) => (
        <button
          key={minutes}
          type="button"
          onClick={() => onChange(minutes)}
          className={`px-3 py-1.5 text-xs rounded-lg border transition-all font-medium ${
            value === minutes
              ? accent.quickBtn
              : 'border-neutral-200 dark:border-dark-border text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default { DatePicker, TimePicker, DurationPicker };
