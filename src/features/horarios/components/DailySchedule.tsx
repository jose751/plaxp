import React from 'react';
import type { Horario } from '../types/horario.types';
import { calcularDisponibilidad, type DisponibilidadTipo } from '../types/horario.types';
import type { Aula } from '../../aulas/types/aula.types';

// Colores de disponibilidad para el card completo
const DISPONIBILIDAD_COLORES: Record<DisponibilidadTipo, { bg: string; border: string; text: string; subtext: string }> = {
  disponible: { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-500', text: 'text-green-800 dark:text-green-200', subtext: 'text-green-600 dark:text-green-300' },
  parcial: { bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-500', text: 'text-blue-800 dark:text-blue-200', subtext: 'text-blue-600 dark:text-blue-300' },
  casiLleno: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', border: 'border-yellow-500', text: 'text-yellow-800 dark:text-yellow-200', subtext: 'text-yellow-600 dark:text-yellow-300' },
  lleno: { bg: 'bg-red-100 dark:bg-red-900/40', border: 'border-red-500', text: 'text-red-800 dark:text-red-200', subtext: 'text-red-600 dark:text-red-300' },
  sinLimite: { bg: 'bg-neutral-100 dark:bg-neutral-800', border: 'border-neutral-400', text: 'text-neutral-800 dark:text-neutral-200', subtext: 'text-neutral-600 dark:text-neutral-400' },
};

interface DailyScheduleProps {
  aulas: Aula[];
  horarios: Horario[];
  selectedDate: Date;
  onHorarioClick?: (horario: Horario) => void;
  aulaColores: { [aulaId: string]: { bg: string; light: string; border: string; text: string } };
}

const HORAS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 - 21:00

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

const formatDateHeader = (date: Date): string => {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${dias[date.getDay()]} ${date.getDate()} de ${meses[date.getMonth()]}`;
};

// Obtener el día de la semana (1=Lunes, 7=Domingo)
const getDiaSemana = (date: Date): number => {
  const day = date.getDay();
  return day === 0 ? 7 : day;
};

export const DailySchedule: React.FC<DailyScheduleProps> = ({
  aulas,
  horarios,
  selectedDate,
  onHorarioClick,
  aulaColores,
}) => {
  const diaSemana = getDiaSemana(selectedDate);

  // Filtrar horarios del día seleccionado
  const horariosDelDia = horarios.filter(h => h.diaSemana === diaSemana);

  // Agrupar horarios por aula
  const horariosPorAula: { [aulaId: string]: Horario[] } = {};
  aulas.forEach(aula => {
    horariosPorAula[aula.id] = horariosDelDia.filter(h => h.aulaId === aula.id);
  });

  const tieneHorarios = horariosDelDia.length > 0;

  if (aulas.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-10 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Selecciona al menos un aula para ver los horarios</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border overflow-hidden">
      {/* Header con fecha */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-hover/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            {formatDateHeader(selectedDate)}
          </h3>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-dark-hover px-2 py-1 rounded-full">
            {horariosDelDia.length} {horariosDelDia.length === 1 ? 'clase' : 'clases'}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: `${Math.max(600, 56 + aulas.length * 150)}px` }}>
          {/* Header aulas */}
          <div
            className="grid border-b border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-hover/50"
            style={{ gridTemplateColumns: `56px repeat(${aulas.length}, 1fr)` }}
          >
            <div className="p-3" />
            {aulas.map((aula) => {
              const color = aulaColores[aula.id];
              const horariosAula = horariosPorAula[aula.id] || [];

              return (
                <div
                  key={aula.id}
                  className="p-3 text-center border-l border-neutral-200 dark:border-dark-border"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color?.bg || 'bg-neutral-400'}`} />
                    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                      {aula.nombre}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {horariosAula.length} {horariosAula.length === 1 ? 'clase' : 'clases'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grilla */}
          <div
            className="grid relative"
            style={{
              gridTemplateColumns: `56px repeat(${aulas.length}, 1fr)`,
              height: '600px'
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

            {/* Columnas por aula */}
            {aulas.map((aula) => {
              const horariosAula = horariosPorAula[aula.id] || [];

              return (
                <div
                  key={aula.id}
                  className="relative border-l border-neutral-200 dark:border-dark-border"
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
                  {horariosAula.map((horario) => {
                    const { top, height } = calcularPosicion(horario.horaInicio, horario.duracionMinutos);
                    const heightNum = parseFloat(height);
                    const disponibilidad = calcularDisponibilidad(horario.cursoCapacidadMaxima, horario.estudiantesMatriculados);
                    const dispColor = DISPONIBILIDAD_COLORES[disponibilidad];
                    const matriculados = horario.estudiantesMatriculados || 0;
                    const capacidad = horario.cursoCapacidadMaxima;

                    return (
                      <div
                        key={horario.id}
                        onClick={() => onHorarioClick?.(horario)}
                        className={`absolute left-1 right-1 rounded-md ${dispColor.bg} ${dispColor.border} border-l-4 cursor-pointer hover:shadow-md transition-all overflow-hidden`}
                        style={{ top, height, minHeight: '28px' }}
                        title={`${horario.cursoNombre || 'Curso'}\n${horario.horaInicio} - ${horario.horaFin}\n${capacidad ? `Cupos: ${matriculados}/${capacidad}` : 'Sin límite'}`}
                      >
                        <div className="px-2 py-1 h-full flex flex-col justify-center">
                          <div className={`text-xs font-semibold ${dispColor.text} truncate leading-tight`}>
                            {horario.cursoNombre || 'Curso'}
                          </div>
                          {heightNum > 4 && (
                            <div className={`text-[10px] ${dispColor.subtext} truncate flex items-center gap-1`}>
                              <span>{horario.horaInicio} - {horario.horaFin}</span>
                              {capacidad && (
                                <span className="font-medium">• {matriculados}/{capacidad}</span>
                              )}
                            </div>
                          )}
                          {heightNum <= 4 && capacidad && (
                            <div className={`text-[10px] ${dispColor.subtext} font-medium`}>
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

      {!tieneHorarios && (
        <div className="p-8 text-center border-t border-neutral-200 dark:border-dark-border">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No hay clases programadas para este día
          </p>
        </div>
      )}
    </div>
  );
};
