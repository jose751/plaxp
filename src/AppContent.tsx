import { Routes, Route } from 'react-router-dom';
import { LoginPage, PasswordRecoveryPage, VerifyCodePage, ResetPasswordPage } from './features/security';
import { DashboardPage } from './features/dashboard';
import { UsersPage, CreateEditUserPage, ViewUserPage } from './features/users';
import { RolesPage, CreateEditRolPage, ViewRolPage } from './features/roles';
import { EstudiantesPage, ViewEstudiantePage, CreateEditEstudiantePage, ImportEstudiantesPage } from './features/estudiantes';
import { CursosPage, CreateEditCursoPage, ViewCursoPage, VerGrupoCursoPage } from './features/cursos';
import { CategoriasPage, CreateEditCategoriaPage, ViewCategoriaPage } from './features/categorias';
import { ProfesoresPage, CreateEditProfesorPage, ViewProfesorPage } from './features/profesores';
import { SucursalesPage, CreateEditSucursalPage, ViewSucursalPage } from './features/sucursales';
import { PeriodosLectivosPage, CreateEditPeriodoLectivoPage, ViewPeriodoLectivoPage } from './features/periodosLectivos';
import { PlanesPagoPage, CreateEditPlanPagoPage, ViewPlanPagoPage } from './features/planesPago';
import { MatriculasPagosPage, ViewMatriculaPagoPage, PrintReciboPage } from './features/matriculasPagos';
import { MatriculasPage, ViewMatriculaPage, CreateMatriculaPage } from './features/matriculas';
import { CrmTableroPage, CrmEtapasPage, LeadsPage, LeadDetailPage, CalendarioPage } from './features/crm';
import { ReportesPage } from './features/reportes';
import { LandingPage } from './features/homePage/pages/LandingPage';
import { DemoPage } from './features/homePage/pages/DemoPage';
import { DemoSchedulePage } from './features/homePage/pages/DemoSchedulePage';
import { MainLayout } from './shared/layouts/MainLayout';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { PublicRoute } from './shared/components/PublicRoute';
import { NotFoundPage } from './shared/pages';

export const AppContent = () => {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/schedule-demo" element={<DemoSchedulePage />} />
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/password-recovery" element={
        <PublicRoute>
          <PasswordRecoveryPage />
        </PublicRoute>
      } />
      <Route path="/verify-code" element={
        <PublicRoute>
          <VerifyCodePage />
        </PublicRoute>
      } />
      <Route path="/reset-password" element={
        <PublicRoute>
          <ResetPasswordPage />
        </PublicRoute>
      } />

      {/* Rutas protegidas */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <MainLayout>
            <DashboardPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/usuarios" element={
        <ProtectedRoute>
          <MainLayout>
            <UsersPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/usuarios/create" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateEditUserPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/usuarios/edit/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateEditUserPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/usuarios/view/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <ViewUserPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/roles" element={
        <ProtectedRoute>
          <MainLayout>
            <RolesPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/roles/create" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateEditRolPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/roles/edit/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateEditRolPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/roles/view/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <ViewRolPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/estudiantes" element={
        <ProtectedRoute>
          <MainLayout>
            <EstudiantesPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/estudiantes/create" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateEditEstudiantePage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/estudiantes/edit/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateEditEstudiantePage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/estudiantes/view/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <ViewEstudiantePage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/estudiantes/import" element={
        <ProtectedRoute>
          <MainLayout>
            <ImportEstudiantesPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/cursos" element={
        <ProtectedRoute>
          <MainLayout>
            <CursosPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/cursos/create" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateEditCursoPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/cursos/edit/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateEditCursoPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/cursos/view/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <ViewCursoPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/cursos/grupo/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <VerGrupoCursoPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/categorias" element={
        <ProtectedRoute>
          <MainLayout>
            <CategoriasPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/categorias/create" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateEditCategoriaPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/categorias/edit/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateEditCategoriaPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/categorias/view/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <ViewCategoriaPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      {/* Rutas de Profesores */}
      <Route path="/profesores" element={
        <ProtectedRoute>
          <MainLayout>
            <ProfesoresPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/profesores/create" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateEditProfesorPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/profesores/edit/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateEditProfesorPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/profesores/view/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <ViewProfesorPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      {/* Rutas de Sucursales */}
      <Route path="/sucursales" element={
        <ProtectedRoute>
          <MainLayout>
            <SucursalesPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/sucursales/create" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateEditSucursalPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/sucursales/edit/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateEditSucursalPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/sucursales/view/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <ViewSucursalPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      {/* Rutas de Periodos Lectivos */}
      <Route path="/periodos-lectivos" element={
        <ProtectedRoute>
          <MainLayout>
            <PeriodosLectivosPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/periodos-lectivos/create" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateEditPeriodoLectivoPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/periodos-lectivos/edit/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateEditPeriodoLectivoPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/periodos-lectivos/view/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <ViewPeriodoLectivoPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      {/* Rutas de Planes de Pago */}
      <Route path="/planes-pago" element={
        <ProtectedRoute>
          <MainLayout>
            <PlanesPagoPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/planes-pago/create" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateEditPlanPagoPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/planes-pago/edit/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateEditPlanPagoPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/planes-pago/view/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <ViewPlanPagoPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      {/* Rutas de Matrículas */}
      <Route path="/matriculas" element={
        <ProtectedRoute>
          <MainLayout>
            <MatriculasPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/matriculas/create" element={
        <ProtectedRoute>
          <MainLayout>
            <CreateMatriculaPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/matriculas/view/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <ViewMatriculaPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      {/* Rutas de Pagos de Matrículas (solo lectura) */}
      <Route path="/pagos" element={
        <ProtectedRoute>
          <MainLayout>
            <MatriculasPagosPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/pagos/view/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <ViewMatriculaPagoPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/pagos/recibo/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <PrintReciboPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      {/* Rutas de CRM Pipeline */}
      <Route path="/crm" element={
        <ProtectedRoute>
          <MainLayout>
            <CrmTableroPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/crm/etapas" element={
        <ProtectedRoute>
          <MainLayout>
            <CrmEtapasPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      {/* Rutas de Leads CRM */}
      <Route path="/crm/leads" element={
        <ProtectedRoute>
          <MainLayout>
            <LeadsPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/crm/leads/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <LeadDetailPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      {/* Calendario CRM */}
      <Route path="/crm/calendario" element={
        <ProtectedRoute>
          <MainLayout>
            <CalendarioPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      {/* Reportes Financieros */}
      <Route path="/reportes" element={
        <ProtectedRoute>
          <MainLayout>
            <ReportesPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      {/* Ruta 404 - debe ir al final */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
