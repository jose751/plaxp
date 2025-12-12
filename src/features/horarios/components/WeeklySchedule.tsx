import React from 'react';
import type { Horario, DiaSemana } from '../types/horario.types';
import { calcularDisponibilidad, type DisponibilidadTipo } from '../types/horario.types';

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

// Colores de disponibilidad para el card completo
const DISPONIBILIDAD_COLORES: Record<DisponibilidadTipo, { bg: string; border: string; text: string; subtext: string }> = {
  disponible: { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-500', text: 'text-green-800 dark:text-green-200', subtext: 'text-green-600 dark:text-green-300' },
  parcial: { bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-500', text: 'text-blue-800 dark:text-blue-200', subtext: 'text-blue-600 dark:text-blue-300' },
  casiLleno: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', border: 'border-yellow-500', text: 'text-yellow-800 dark:text-yellow-200', subtext: 'text-yellow-600 dark:text-yellow-300' },
  lleno: { bg: 'bg-red-100 dark:bg-red-900/40', border: 'border-red-500', text: 'text-red-800 dark:text-red-200', subtext: 'text-red-600 dark:text-red-300' },
  sinLimite: { bg: 'bg-neutral-100 dark:bg-neutral-800', border: 'border-neutral-400', text: 'text-neutral-800 dark:text-neutral-200', subtext: 'text-neutral-600 dark:text-neutral-400' },
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
                    const disponibilidad = calcularDisponibilidad(horario.cursoCapacidadMaxima, horario.estudiantesMatriculados);
                    const color = DISPONIBILIDAD_COLORES[disponibilidad];
                    const matriculados = horario.estudiantesMatriculados || 0;
                    const capacidad = horario.cursoCapacidadMaxima;

                    return (
                      <div
                        key={horario.id}
                        onClick={() => onHorarioClick?.(horario)}
                        className={`absolute left-1 right-1 rounded-md ${color.bg} ${color.border} border-l-4 cursor-pointer hover:shadow-md transition-all overflow-hidden group`}
                        style={{ top, height, minHeight: '24px' }}
                        title={`${horario.cursoNombre || 'Curso'}\n${horario.horaInicio} - ${horario.horaFin}\n${capacidad ? `Cupos: ${matriculados}/${capacidad}` : 'Sin límite'}`}
                      >
                        <div className="px-2 py-1 h-full flex flex-col justify-center">
                          {showCursoName && (
                            <div className={`text-xs font-semibold ${color.text} truncate leading-tight`}>
                              {horario.cursoNombre || 'Curso'}
                            </div>
                          )}
                          {heightNum > 5 && (
                            <div className={`text-[10px] ${color.subtext} truncate flex items-center gap-1`}>
                              <span>{horario.horaInicio} - {horario.horaFin}</span>
                              {capacidad && (
                                <span className="font-medium">• {matriculados}/{capacidad}</span>
                              )}
                            </div>
                          )}
                          {heightNum <= 5 && heightNum > 3 && capacidad && (
                            <div className={`text-[10px] ${color.subtext} font-medium`}>
                              {matriculados}/{capacidad}
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
