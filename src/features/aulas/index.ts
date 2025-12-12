// Export pages
export { AulasPage } from './pages/AulasPage';
export { ViewAulaPage } from './pages/ViewAulaPage';

// Export components
export { AulaSelect } from './components/AulaSelect';
export { AulaModal } from './components/AulaModal';
export { ViewAulaModal } from './components/ViewAulaModal';

// Export types
export type { Aula, ListarAulasParams, CrearAulaData, ActualizarAulaData } from './types/aula.types';

// Export API functions
export {
  listarAulasApi,
  obtenerAulasPorSucursalApi,
  obtenerTodasAulasApi,
  crearAulaApi,
  obtenerAulaPorIdApi,
  actualizarAulaApi,
  activarAulaApi,
  desactivarAulaApi,
} from './api/aulasApi';
