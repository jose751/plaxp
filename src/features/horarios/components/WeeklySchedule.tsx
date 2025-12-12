import React from 'react';
import type { Horario, DiaSemana } from '../types/horario.types';

interface WeeklyScheduleProps {
  horariosPorDia: { [dia: number]: Horario[] };
  aulaNombre?: string;
  onHorarioClick?: (horario: Horario) => void;
  showCursoName?: boolean;
  emptyMessage?: string;
  weekStart?: Date; // Lunes de la semana a mostrar
}

const HORAS = Array.from({ length: 15 }, (_, i) => i + 7);

const DIAS: Record<DiaSemana, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const calcularPosicion = (horaInicio: string, duracionMinutos: number) => {
  const inicioMinutos = timeToMinutes(horaInicio);
  const inicioHora = Math.floor(inicioMinutos / 60);
  const minutosEnHora = inicioMinutos % 60;
  const topPercent = ((inicioHora - 7) * 60 + minutosEnHora) / (15 * 60) * 100;
  const heightPercent = duracionMinutos / (15 * 60) * 100;
  return { top: `${topPercent}%`, height: `${Math.max(heightPercent, 2.5)}%` };
};

const getDateForDay = (dia: DiaSemana, weekStart?: Date): number => {
  if (weekStart) {
    const targetDate = new Date(weekStart);
    targetDate.setDate(weekStart.getDate() + (dia - 1));
    return targetDate.getDate();
  }
  // Fallback: semana actual
  const today = new Date();
  const currentDay = today.getDay() || 7;
  const diff = dia - currentDay;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);
  return targetDate.getDate();
};

const isToday = (dia: DiaSemana, weekStart?: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (weekStart) {
    const targetDate = new Date(weekStart);
    targetDate.setDate(weekStart.getDate() + (dia - 1));
    targetDate.setHours(0, 0, 0, 0);
    return targetDate.getTime() === today.getTime();
  }

  const todayDia = today.getDay() || 7;
  return dia === todayDia;
};

// Colores para diferenciar horarios (paleta basada en primary #6a48bf)
const COLORES = [
  { bg: 'bg-[#6a48bf] dark:bg-[#7c5cd4]', border: 'border-[#5a3aa8]', text: 'text-white', subtext: 'text-white/80' },
  { bg: 'bg-[#48a0bf] dark:bg-[#5cb8d4]', border: 'border-[#3a8ba8]', text: 'text-white', subtext: 'text-white/80' },
  { bg: 'bg-[#bf6a48] dark:bg-[#d47c5c]', border: 'border-[#a85a3a]', text: 'text-white', subtext: 'text-white/80' },
  { bg: 'bg-[#48bf6a] dark:bg-[#5cd47c]', border: 'border-[#3aa85a]', text: 'text-white', subtext: 'text-white/80' },
  { bg: 'bg-[#bf48a0] dark:bg-[#d45cb8]', border: 'border-[#a83a8b]', text: 'text-white', subtext: 'text-white/80' },
  { bg: 'bg-[#a0bf48] dark:bg-[#b8d45c]', border: 'border-[#8ba83a]', text: 'text-white', subtext: 'text-white/80' },
  { bg: 'bg-[#4868bf] dark:bg-[#5c7cd4]', border: 'border-[#3a58a8]', text: 'text-white', subtext: 'text-white/80' },
  { bg: 'bg-[#bf4868] dark:bg-[#d45c7c]', border: 'border-[#a83a58]', text: 'text-white', subtext: 'text-white/80' },
];

const getColorByCursoId = (cursoId: string) => {
  let hash = 0;
  for (let i = 0; i < cursoId.length; i++) {
    hash = cursoId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORES[Math.abs(hash) % COLORES.length];
};

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
  horariosPorDia,
  aulaNombre,
  onHorarioClick,
  showCursoName = true,
  emptyMessage = 'No hay horarios asignados',
  weekStart,
}) => {
  const tieneHorarios = Object.values(horariosPorDia).some(arr => arr.length > 0);

  if (!tieneHorarios) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-10 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border overflow-hidden">
      {/* Header del aula */}
      {aulaNombre && (
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
              {aulaNombre}
            </h3>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-dark-hover px-2 py-1 rounded-full">
              {Object.values(horariosPorDia).flat().length} clases
            </span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header días */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-hover/50">
            <div className="p-3" />
            {([1, 2, 3, 4, 5, 6, 7] as DiaSemana[]).map((dia) => {
              const isTodayDay = isToday(dia, weekStart);
              const dateNum = getDateForDay(dia, weekStart);

              return (
                <div
                  key={dia}
                  className={`p-3 text-center border-l border-neutral-200 dark:border-dark-border ${
                    isTodayDay ? 'bg-violet-50 dark:bg-violet-900/20' : ''
                  }`}
                >
                  <div className={`text-xs font-medium ${
                    isTodayDay
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}>
                    {DIAS[dia]}
                  </div>
                  <div className={`text-lg font-semibold mt-0.5 ${
                    isTodayDay
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-neutral-800 dark:text-neutral-200'
                  }`}>
                    {dateNum}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grilla */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)] relative" style={{ height: '560px' }}>
            {/* Columna horas */}
            <div className="relative bg-neutral-50 dark:bg-dark-hover/30">
              {HORAS.map((hora, index) => (
                <div
                  key={hora}
                  className="absolute w-full text-right pr-2 -translate-y-1/2"
                  style={{ top: `${(index / 15) * 100}%` }}
                >
                  <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
                    {hora}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Columnas días */}
            {([1, 2, 3, 4, 5, 6, 7] as DiaSemana[]).map((dia) => {
              const isTodayDay = isToday(dia, weekStart);

              return (
                <div
                  key={dia}
                  className={`relative border-l border-neutral-200 dark:border-dark-border ${
                    isTodayDay ? 'bg-violet-50/40 dark:bg-violet-900/10' : ''
                  }`}
                >
                  {/* Líneas de hora */}
                  {HORAS.map((hora, index) => (
                    <div
                      key={hora}
                      className="absolute w-full border-t border-neutral-100 dark:border-dark-border/50"
                      style={{ top: `${(index / 15) * 100}%` }}
                    />
                  ))}

                  {/* Bloques de eventos */}
                  {(horariosPorDia[dia] || []).map((horario) => {
                    const { top, height } = calcularPosicion(horario.horaInicio, horario.duracionMinutos);
                    const heightNum = parseFloat(height);
                    const color = getColorByCursoId(horario.cursoId);

                    return (
                      <div
                        key={horario.id}
                        onClick={() => onHorarioClick?.(horario)}
                        className={`absolute left-1 right-1 rounded-md ${color.bg} border-l-[3px] ${color.border} cursor-pointer hover:brightness-95 dark:hover:brightness-110 transition-all overflow-hidden`}
                        style={{ top, height, minHeight: '24px' }}
                        title={`${horario.cursoNombre || 'Curso'}\n${horario.horaInicio} - ${horario.horaFin}`}
                      >
                        <div className="px-2 h-full flex flex-col justify-center">
                          {showCursoName && (
                            <div className={`text-xs font-semibold ${color.text} truncate leading-tight`}>
                              {horario.cursoNombre || 'Curso'}
                            </div>
                          )}
                          {heightNum > 5 && (
                            <div className={`text-[10px] ${color.subtext} truncate`}>
                              {horario.horaInicio} - {horario.horaFin}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
