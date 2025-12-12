import React from 'react';
import type { Horario, DiaSemana } from '../types/horario.types';
import type { Aula } from '../../aulas/types/aula.types';

interface MultiDayScheduleProps {
  aulas: Aula[];
  horarios: Horario[];
  weekStart: Date;
  dias: DiaSemana[]; // Días a mostrar (ej: [1,2,3,4,5] para días de semana)
  onHorarioClick?: (horario: Horario) => void;
  aulaColores: { [aulaId: string]: { bg: string; light: string; border: string; text: string } };
  titulo?: string;
}

const HORAS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 - 21:00

const DIAS_NOMBRES: Record<DiaSemana, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
  7: 'Dom',
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

const getDateForDay = (dia: DiaSemana, weekStart: Date): Date => {
  const targetDate = new Date(weekStart);
  targetDate.setDate(weekStart.getDate() + (dia - 1));
  return targetDate;
};

const isToday = (dia: DiaSemana, weekStart: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = getDateForDay(dia, weekStart);
  targetDate.setHours(0, 0, 0, 0);
  return targetDate.getTime() === today.getTime();
};

export const MultiDaySchedule: React.FC<MultiDayScheduleProps> = ({
  aulas,
  horarios,
  weekStart,
  dias,
  onHorarioClick,
  aulaColores,
  titulo,
}) => {
  // Filtrar horarios por los días seleccionados y aulas
  const horariosFiltered = horarios.filter(h =>
    dias.includes(h.diaSemana as DiaSemana) &&
    h.aulaId &&
    aulas.some(a => a.id === h.aulaId)
  );

  // Agrupar por aula y día
  const horariosPorAulaYDia: {
    [aulaId: string]: {
      [dia: number]: Horario[]
    }
  } = {};

  aulas.forEach(aula => {
    horariosPorAulaYDia[aula.id] = {};
    dias.forEach(dia => {
      horariosPorAulaYDia[aula.id][dia] = horariosFiltered.filter(
        h => h.aulaId === aula.id && h.diaSemana === dia
      );
    });
  });

  if (aulas.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-10 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Selecciona al menos un aula para ver los horarios</p>
      </div>
    );
  }

  const totalClases = horariosFiltered.length;

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border overflow-hidden">
      {/* Header */}
      {titulo && (
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-hover/50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
              {titulo}
            </h3>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-dark-hover px-2 py-1 rounded-full">
              {totalClases} {totalClases === 1 ? 'clase' : 'clases'}
            </span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <div style={{ minWidth: `${Math.max(700, 56 + aulas.length * dias.length * 100)}px` }}>
          {/* Header con Aulas y Días */}
          <div className="border-b border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-hover/50">
            {/* Fila de Aulas */}
            <div
              className="grid"
              style={{ gridTemplateColumns: `56px repeat(${aulas.length}, 1fr)` }}
            >
              <div className="p-2" />
              {aulas.map((aula) => {
                const color = aulaColores[aula.id];
                return (
                  <div
                    key={aula.id}
                    className="p-2 text-center border-l border-neutral-200 dark:border-dark-border"
                    style={{ gridColumn: `span 1` }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${color?.bg || 'bg-neutral-400'}`} />
                      <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                        {aula.nombre}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Fila de Días por cada Aula */}
            <div
              className="grid border-t border-neutral-100 dark:border-dark-border/50"
              style={{ gridTemplateColumns: `56px repeat(${aulas.length * dias.length}, 1fr)` }}
            >
              <div className="p-1" />
              {aulas.map((aula) => (
                dias.map((dia) => {
                  const isTodayDay = isToday(dia, weekStart);
                  const dateNum = getDateForDay(dia, weekStart).getDate();
                  return (
                    <div
                      key={`${aula.id}-${dia}`}
                      className={`p-1.5 text-center border-l border-neutral-100 dark:border-dark-border/50 ${
                        isTodayDay ? 'bg-violet-50 dark:bg-violet-900/20' : ''
                      }`}
                    >
                      <div className={`text-[10px] font-medium ${
                        isTodayDay
                          ? 'text-violet-600 dark:text-violet-400'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}>
                        {DIAS_NOMBRES[dia]}
                      </div>
                      <div className={`text-sm font-semibold ${
                        isTodayDay
                          ? 'text-violet-600 dark:text-violet-400'
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`}>
                        {dateNum}
                      </div>
                    </div>
                  );
                })
              ))}
            </div>
          </div>

          {/* Grilla */}
          <div
            className="grid relative"
            style={{
              gridTemplateColumns: `56px repeat(${aulas.length * dias.length}, 1fr)`,
              height: '560px'
            }}
          >
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

            {/* Columnas por aula y día */}
            {aulas.map((aula) => (
              dias.map((dia) => {
                const color = aulaColores[aula.id];
                const horariosDelDia = horariosPorAulaYDia[aula.id]?.[dia] || [];
                const isTodayDay = isToday(dia, weekStart);

                return (
                  <div
                    key={`${aula.id}-${dia}`}
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
                    {horariosDelDia.map((horario) => {
                      const { top, height } = calcularPosicion(horario.horaInicio, horario.duracionMinutos);
                      const heightNum = parseFloat(height);

                      return (
                        <div
                          key={horario.id}
                          onClick={() => onHorarioClick?.(horario)}
                          className={`absolute left-0.5 right-0.5 rounded-md ${color?.bg || 'bg-violet-500'} border-l-2 ${color?.border || 'border-violet-600'} cursor-pointer hover:brightness-95 dark:hover:brightness-110 transition-all overflow-hidden shadow-sm`}
                          style={{ top, height, minHeight: '20px' }}
                          title={`${horario.cursoNombre || 'Curso'}\n${horario.horaInicio} - ${horario.horaFin}`}
                        >
                          <div className="px-1 py-0.5 h-full flex flex-col justify-center">
                            <div className="text-[10px] font-semibold text-white truncate leading-tight">
                              {horario.cursoNombre || 'Curso'}
                            </div>
                            {heightNum > 4 && (
                              <div className="text-[9px] text-white/80 truncate">
                                {horario.horaInicio}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            ))}
          </div>
        </div>
      </div>

      {totalClases === 0 && (
        <div className="p-8 text-center border-t border-neutral-200 dark:border-dark-border">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No hay clases programadas
          </p>
        </div>
      )}
    </div>
  );
};
