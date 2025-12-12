// Export pages
export { HorariosPage } from './pages/HorariosPage';
export { HorariosCalendarioPage } from './pages/HorariosCalendarioPage';
export { CreateEditHorarioPage } from './pages/CreateEditHorarioPage';
export { ViewHorarioPage } from './pages/ViewHorarioPage';

// Export components
export { DiaSelect } from './components/DiaSelect';
export { TimeInput } from './components/TimeInput';
export { DuracionSelect } from './components/DuracionSelect';
export { ModalidadSelect } from './components/ModalidadSelect';
export { WeeklySchedule } from './components/WeeklySchedule';
export { ConflictAlert } from './components/ConflictAlert';
export { HorariosCursoManager } from './components/HorariosCursoManager';
export { HorariosFormSection, type HorarioLocal } from './components/HorariosFormSection';

// Export types
export type {
  Horario,
  DiaSemana,
  Modalidad,
  ListarHorariosParams,
  CrearHorarioData,
  ActualizarHorarioData,
  Conflicto,
  HorariosSemana,
} from './types/horario.types';
export { DIAS_SEMANA } from './types/horario.types';

// Export API functions
export {
  listarHorariosApi,
  crearHorarioApi,
  obtenerHorarioPorIdApi,
  actualizarHorarioApi,
  eliminarHorarioApi,
  listarHorariosCursoApi,
  listarHorariosSucursalApi,
  listarHorariosAulaApi,
  verificarConflictoApi,
} from './api/horariosApi';
