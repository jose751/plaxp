import PaginatedDataTable, {
  type PaginatedResponse,
  type ColumnDefinition,
  type BaseItem,
  type StatusOption
} from '../../../shared/components/PaginatedDataTable';

// Interfaz de Usuario
interface User extends BaseItem {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  estado: string;
  ultimoAcceso: string;
}

// Datos falsos de usuarios
const FAKE_USERS: User[] = Array.from({ length: 50 }, (_, i) => ({
  id: `${i + 1}`,
  nombre: [
    'Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 'Luis Rodríguez',
    'Carmen Sánchez', 'José Fernández', 'Laura González', 'Miguel Torres', 'Isabel Ramírez',
    'Francisco Flores', 'Patricia Jiménez', 'Antonio Morales', 'Rosa Ruiz', 'Manuel Romero',
    'Teresa Díaz', 'Pedro Vargas', 'Cristina Castro', 'Javier Ortiz', 'Marta Rubio'
  ][i % 20],
  correo: `usuario${i + 1}@plaxp.com`,
  rol: ['Administrador', 'Profesor', 'Estudiante', 'Coordinador'][i % 4],
  estado: i % 5 === 0 ? 'Inactivo' : 'Activo',
  ultimoAcceso: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString('es-ES'),
}));

// Definir columnas
const columns: ColumnDefinition<User>[] = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'correo', header: 'Correo Electrónico' },
  { key: 'rol', header: 'Rol' },
  { key: 'estado', header: 'Estado' },
  { key: 'ultimoAcceso', header: 'Último Acceso' },
];

// Definir opciones de estado
const statusOptions: StatusOption[] = [
  { label: 'Activo', value: 'activo', color: 'green' },
  { label: 'Inactivo', value: 'inactivo', color: 'red' },
];

// Función mock para simular llamada al API
const fetchUsers = async (
  page: number,
  limit: number,
  query: string,
  status?: string
): Promise<PaginatedResponse<User>> => {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 500));

  // Filtrar por búsqueda
  let filteredUsers = FAKE_USERS;
  if (query) {
    const lowerQuery = query.toLowerCase();
    filteredUsers = filteredUsers.filter(
      user =>
        user.nombre.toLowerCase().includes(lowerQuery) ||
        user.correo.toLowerCase().includes(lowerQuery) ||
        user.rol.toLowerCase().includes(lowerQuery)
    );
  }

  // Filtrar por estado
  if (status) {
    filteredUsers = filteredUsers.filter(
      user => user.estado.toLowerCase() === status.toLowerCase()
    );
  }

  // Paginar
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedData = filteredUsers.slice(start, end);

  return {
    data: paginatedData,
    total: filteredUsers.length,
    page,
    limit,
  };
};

// Componente principal
export const UsersPage = () => {
  const handleRowClick = (user: User) => {
    alert(`Usuario seleccionado:\n\nNombre: ${user.nombre}\nCorreo: ${user.correo}\nRol: ${user.rol}`);
  };

  const handleCreateNew = () => {
    alert('Abrir formulario para crear nuevo usuario');
  };

  return (
    <PaginatedDataTable
      title="Gestión de Usuarios"
      columns={columns}
      fetchDataFunction={fetchUsers}
      onRowClick={handleRowClick}
      onCreateNew={handleCreateNew}
      statusOptions={statusOptions}
    />
  );
};
