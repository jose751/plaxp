# Aulas y Horarios - Análisis y Propuesta de Implementación

## 1. Contexto del Requerimiento

Se requiere agregar un sistema de gestión de **aulas** y **horarios** al módulo académico, permitiendo:

1. Gestionar aulas por empresa y sucursal
2. Asignar horarios a los cursos (día de la semana, duración, aula)
3. Control de conflictos: no permitir cursos en la misma aula/día/hora si hay solapamiento
4. El control de horarios solo aplica cuando el curso tiene `enableCompletion = true`

---

## 2. Modelo de Datos Propuesto

### 2.1 Tabla `aulas`

```sql
CREATE TABLE aulas (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    empresa_id      BIGINT NOT NULL,
    sucursal_id     BIGINT NOT NULL,
    nombre          VARCHAR(100) NOT NULL,
    capacidad_maxima INT NOT NULL DEFAULT 0,
    descripcion     TEXT NULL,
    activo          BOOLEAN DEFAULT TRUE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por      BIGINT NULL,
    modificado_por  BIGINT NULL,

    CONSTRAINT ux_aula_nombre UNIQUE (empresa_id, sucursal_id, nombre),
    INDEX idx_aula_sucursal (empresa_id, sucursal_id, activo)
);
```

**Notas:**
- `capacidad_maxima`: Número máximo de estudiantes que pueden estar en el aula
- Unique constraint por nombre dentro de la misma empresa/sucursal
- Multi-tenant: siempre filtrado por `empresa_id`

### 2.2 Tabla `cursos_horarios`

```sql
CREATE TABLE cursos_horarios (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    empresa_id      BIGINT NOT NULL,
    curso_id        BIGINT NOT NULL,
    aula_id         BIGINT NULL,              -- NULL = virtual sin aula física
    modalidad       ENUM('virtual', 'presencial') NOT NULL DEFAULT 'presencial',
    dia_semana      TINYINT NOT NULL,         -- 1=Lunes, 2=Martes, ..., 7=Domingo
    hora_inicio     TIME NOT NULL,
    duracion_minutos INT NOT NULL,            -- Duración en minutos
    capacidad_maxima INT NULL,                -- Override de capacidad (NULL = usa capacidad del aula)
    activo          BOOLEAN DEFAULT TRUE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por      BIGINT NULL,
    modificado_por  BIGINT NULL,

    -- Validaciones
    CONSTRAINT chk_dia_semana CHECK (dia_semana BETWEEN 1 AND 7),
    CONSTRAINT chk_duracion CHECK (duracion_minutos > 0 AND duracion_minutos <= 720),

    -- Índices para búsqueda de conflictos
    INDEX idx_horario_curso (empresa_id, curso_id, activo),
    INDEX idx_horario_aula_dia (empresa_id, aula_id, dia_semana, hora_inicio),

    -- FK
    CONSTRAINT fk_horario_curso FOREIGN KEY (curso_id) REFERENCES cursos(id),
    CONSTRAINT fk_horario_aula FOREIGN KEY (aula_id) REFERENCES aulas(id)
);
```

**Notas:**
- `dia_semana`: 1-7 (Lunes a Domingo), siguiendo el estándar ISO 8601
- `hora_inicio`: Hora de inicio de la clase (TIME)
- `duracion_minutos`: Duración en minutos (ej: 45, 60, 90, 120)
- `modalidad`:
  - `virtual`: No requiere aula física
  - `presencial`: Requiere aula física (aula_id obligatorio)
- `capacidad_maxima`: Permite override de la capacidad del aula para este horario específico

### 2.3 Prisma Schema

```prisma
model aulas {
  id               BigInt   @id @default(autoincrement())
  empresa_id       BigInt
  sucursal_id      BigInt
  nombre           String   @db.VarChar(100)
  capacidad_maxima Int      @default(0)
  descripcion      String?  @db.Text
  activo           Boolean  @default(true)
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt
  creado_por       BigInt?
  modificado_por   BigInt?

  @@unique([empresa_id, sucursal_id, nombre], name: "ux_aula_nombre")
  @@index([empresa_id, sucursal_id, activo], name: "idx_aula_sucursal")
}

model cursos_horarios {
  id               BigInt   @id @default(autoincrement())
  empresa_id       BigInt
  curso_id         BigInt
  aula_id          BigInt?
  modalidad        String   @default("presencial") @db.VarChar(20) // "virtual" | "presencial"
  dia_semana       Int      @db.TinyInt // 1-7
  hora_inicio      DateTime @db.Time(0)
  duracion_minutos Int
  capacidad_maxima Int?
  activo           Boolean  @default(true)
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt
  creado_por       BigInt?
  modificado_por   BigInt?

  @@index([empresa_id, curso_id, activo], name: "idx_horario_curso")
  @@index([empresa_id, aula_id, dia_semana, hora_inicio], name: "idx_horario_aula_dia")
}
```

---

## 3. Reglas de Negocio

### 3.1 Aulas

1. **Unicidad**: No pueden existir dos aulas con el mismo nombre en la misma sucursal
2. **Capacidad**: Debe ser >= 0 (0 = sin límite definido)
3. **Multi-tenant**: Siempre filtrado por `empresa_id`
4. **Soft delete**: Se usa campo `activo` en lugar de eliminar físicamente

### 3.2 Horarios

1. **Control de finalización**: El control de horarios y restricciones de conflictos **solo aplica** cuando el curso tiene `enableCompletion = true`
   - Si `enableCompletion = false`: No se requiere horario, no hay validaciones de conflicto
   - Si `enableCompletion = true`: Obligatorio definir horarios, se validan conflictos

2. **Modalidad virtual**:
   - No requiere `aula_id`
   - No genera conflictos de horario (múltiples cursos virtuales pueden estar al mismo tiempo)

3. **Modalidad presencial**:
   - Requiere `aula_id` obligatoriamente
   - Genera conflictos de horario con otros cursos presenciales en la misma aula

4. **Días de la semana**:
   ```
   1 = Lunes
   2 = Martes
   3 = Miércoles
   4 = Jueves
   5 = Viernes
   6 = Sábado
   7 = Domingo
   ```

5. **Validación de conflictos** (solo para presencial):
   - No puede haber dos cursos presenciales en la misma aula, el mismo día, con horarios que se solapen
   - El solapamiento se calcula así:
     ```
     hora_fin = hora_inicio + duracion_minutos

     Hay conflicto si:
     (nuevo_inicio < existente_fin) AND (nuevo_fin > existente_inicio)
     ```

6. **Capacidad**:
   - La capacidad efectiva del horario es:
     - `capacidad_maxima` del horario (si está definido)
     - O `capacidad_maxima` del aula
   - Se puede validar que el número de estudiantes inscritos no exceda esta capacidad

---

## 4. Algoritmo de Detección de Conflictos

```typescript
interface HorarioInput {
  aulaId: bigint;
  diaSemana: number; // 1-7
  horaInicio: Date;  // Solo se usa la parte de hora
  duracionMinutos: number;
}

async function tieneConflictoHorario(
  empresaId: bigint,
  horario: HorarioInput,
  excludeHorarioId?: bigint // Para actualización
): Promise<boolean> {

  // Si no hay aula (virtual), no hay conflicto
  if (!horario.aulaId) return false;

  // Calcular hora de fin
  const horaInicio = horario.horaInicio;
  const horaFin = addMinutes(horaInicio, horario.duracionMinutos);

  // Buscar horarios existentes en la misma aula y día
  const horariosExistentes = await prisma.cursos_horarios.findMany({
    where: {
      empresa_id: empresaId,
      aula_id: horario.aulaId,
      dia_semana: horario.diaSemana,
      activo: true,
      modalidad: 'presencial',
      id: excludeHorarioId ? { not: excludeHorarioId } : undefined,
      // El curso también debe estar activo y con enableCompletion
      curso: {
        estado: true,
        enable_completion: true
      }
    },
    select: {
      id: true,
      hora_inicio: true,
      duracion_minutos: true,
      curso: {
        select: { nombre: true }
      }
    }
  });

  // Verificar solapamiento
  for (const existente of horariosExistentes) {
    const existenteInicio = existente.hora_inicio;
    const existenteFin = addMinutes(existenteInicio, existente.duracion_minutos);

    // Hay conflicto si los rangos se solapan
    if (horaInicio < existenteFin && horaFin > existenteInicio) {
      return true; // Hay conflicto
    }
  }

  return false; // No hay conflicto
}
```

---

## 5. Estructura de Carpetas Propuesta

```
src/aplicaciones/academico/
├── aulas/
│   ├── dto/
│   │   └── aula.dto.ts
│   ├── entity/
│   │   └── aula.entity.ts
│   ├── schemas/
│   │   └── aula.schema.ts
│   ├── use-cases/
│   │   ├── crear.aula.UC.ts
│   │   ├── actualizar.aula.UC.ts
│   │   ├── listar.aulas.UC.ts
│   │   ├── obtener.aula.UC.ts
│   │   ├── activar.aula.UC.ts
│   │   ├── desactivar.aula.UC.ts
│   │   └── index.ts
│   ├── ports/
│   │   └── aula.repository.port.ts
│   └── infra/
│       ├── driven/
│       │   └── mysql.aula.repository.ts
│       └── driver/
│           ├── http.aula.adapter.ts
│           ├── composition.root.ts
│           └── index.ts
│
├── horarios/
│   ├── dto/
│   │   └── horario.dto.ts
│   ├── entity/
│   │   └── horario.entity.ts
│   ├── schemas/
│   │   └── horario.schema.ts
│   ├── use-cases/
│   │   ├── crear.horario.UC.ts
│   │   ├── actualizar.horario.UC.ts
│   │   ├── listar.horarios.UC.ts
│   │   ├── listar.horarios.curso.UC.ts
│   │   ├── listar.horarios.aula.UC.ts
│   │   ├── eliminar.horario.UC.ts
│   │   ├── verificar.conflicto.UC.ts
│   │   └── index.ts
│   ├── ports/
│   │   └── horario.repository.port.ts
│   └── infra/
│       ├── driven/
│       │   └── mysql.horario.repository.ts
│       └── driver/
│           ├── http.horario.adapter.ts
│           ├── composition.root.ts
│           └── index.ts
```

---

## 6. Endpoints API Propuestos

### 6.1 Aulas

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/aulas` | Crear aula |
| GET | `/api/aulas` | Listar aulas (filtros: sucursalId, q, activo) |
| GET | `/api/aulas/:id` | Obtener aula por ID |
| PUT | `/api/aulas/:id` | Actualizar aula |
| PATCH | `/api/aulas/:id/activar` | Activar aula |
| PATCH | `/api/aulas/:id/desactivar` | Desactivar aula |
| GET | `/api/aulas/:id/disponibilidad` | Ver horarios ocupados del aula |

### 6.2 Horarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/horarios` | Crear horario para curso |
| GET | `/api/horarios/curso/:cursoId` | Listar horarios de un curso |
| GET | `/api/horarios/aula/:aulaId` | Listar horarios de un aula |
| GET | `/api/horarios/:id` | Obtener horario por ID |
| PUT | `/api/horarios/:id` | Actualizar horario |
| DELETE | `/api/horarios/:id` | Eliminar horario |
| POST | `/api/horarios/verificar-conflicto` | Verificar si hay conflicto sin crear |

---

## 7. DTOs Propuestos

### 7.1 Aula DTOs

```typescript
// Crear Aula
interface CrearAulaDTO {
  sucursalId: bigint;
  nombre: string;
  capacidadMaxima?: number;  // default: 0
  descripcion?: string;
}

// Actualizar Aula
interface ActualizarAulaDTO {
  nombre?: string;
  capacidadMaxima?: number;
  descripcion?: string;
}

// Respuesta Aula
interface AulaDTO {
  id: bigint;
  empresaId: bigint;
  sucursalId: bigint;
  nombre: string;
  capacidadMaxima: number;
  descripcion: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Información calculada
  sucursalNombre?: string;
  horariosActivos?: number;
}

// Filtros
interface FiltrosAulasDTO {
  sucursalId?: bigint;
  q?: string;           // Búsqueda por nombre
  activo?: boolean;
  page?: number;
  limit?: number;
}
```

### 7.2 Horario DTOs

```typescript
// Enum
type Modalidad = 'virtual' | 'presencial';
type DiaSemana = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Crear Horario
interface CrearHorarioDTO {
  cursoId: bigint;
  aulaId?: bigint;           // Obligatorio si modalidad = 'presencial'
  modalidad: Modalidad;
  diaSemana: DiaSemana;
  horaInicio: string;        // "HH:mm" formato 24h
  duracionMinutos: number;
  capacidadMaxima?: number;  // Override opcional
}

// Actualizar Horario
interface ActualizarHorarioDTO {
  aulaId?: bigint;
  modalidad?: Modalidad;
  diaSemana?: DiaSemana;
  horaInicio?: string;
  duracionMinutos?: number;
  capacidadMaxima?: number;
}

// Respuesta Horario
interface HorarioDTO {
  id: bigint;
  empresaId: bigint;
  cursoId: bigint;
  aulaId: bigint | null;
  modalidad: Modalidad;
  diaSemana: DiaSemana;
  diaSemanaTexto: string;    // "Lunes", "Martes", etc.
  horaInicio: string;        // "HH:mm"
  horaFin: string;           // Calculado: horaInicio + duracionMinutos
  duracionMinutos: number;
  capacidadMaxima: number | null;
  capacidadEfectiva: number; // capacidadMaxima || aula.capacidadMaxima
  activo: boolean;
  // Relaciones
  cursoNombre?: string;
  aulaNombre?: string;
}

// Verificar Conflicto
interface VerificarConflictoDTO {
  cursoId?: bigint;          // Para excluir al actualizar
  aulaId: bigint;
  diaSemana: DiaSemana;
  horaInicio: string;
  duracionMinutos: number;
  excludeHorarioId?: bigint;
}

interface ConflictoResultadoDTO {
  tieneConflicto: boolean;
  conflictos?: {
    horarioId: bigint;
    cursoId: bigint;
    cursoNombre: string;
    horaInicio: string;
    horaFin: string;
  }[];
}
```

---

## 8. Casos de Uso Detallados

### 8.1 CrearHorarioUC

**Flujo:**
1. Validar que el curso existe y pertenece a la empresa
2. Validar que `enableCompletion = true` en el curso
3. Si `modalidad = 'presencial'`:
   - Validar que `aulaId` está presente
   - Validar que el aula existe, está activa y pertenece a la misma sucursal del curso
   - Verificar que no hay conflicto de horario
4. Crear el horario
5. Retornar el horario creado con información enriquecida

**Errores posibles:**
- `CURSO_NO_ENCONTRADO`: El curso no existe
- `CURSO_SIN_CONTROL_FINALIZACION`: El curso tiene `enableCompletion = false`
- `AULA_REQUERIDA_PRESENCIAL`: Modalidad presencial requiere aula
- `AULA_NO_ENCONTRADA`: El aula no existe
- `AULA_INACTIVA`: El aula está desactivada
- `AULA_SUCURSAL_DIFERENTE`: El aula pertenece a otra sucursal
- `CONFLICTO_HORARIO`: Ya existe un curso en esa aula/día/hora

### 8.2 ListarHorariosAulaUC

**Flujo:**
1. Validar que el aula existe
2. Obtener todos los horarios activos del aula
3. Agrupar por día de la semana
4. Ordenar por hora de inicio
5. Retornar matriz semanal con horarios

**Respuesta:**
```typescript
interface HorariosSemanaDTO {
  aulaId: bigint;
  aulaNombre: string;
  capacidadMaxima: number;
  horariosPorDia: {
    [dia: number]: HorarioDTO[];
  };
}
```

---

## 9. Integración con Cursos Existentes

### 9.1 Modificación a CrearCursoUC

Cuando `enableCompletion = true`:
- Opcionalmente aceptar horarios en la creación
- O bien, requerir que se agreguen horarios después

### 9.2 Modificación a ActualizarCursoUC

Cuando se cambia `enableCompletion`:
- De `false` a `true`: Advertir que se deben agregar horarios
- De `true` a `false`: Los horarios existentes se desactivan automáticamente

### 9.3 Nueva Validación en Inscripciones

Al inscribir estudiantes:
- Verificar que no se exceda `capacidadMaxima` del horario/aula
- Sumar estudiantes inscritos vs. capacidad efectiva

---

## 10. Consideraciones Adicionales

### 10.1 Zona Horaria
- Todas las horas se manejan en la zona horaria de la empresa/sucursal
- Considerar agregar campo `timezone` a `empresas` o `sucursales`

### 10.2 Fechas de Vigencia del Horario
Para mayor flexibilidad, se podría agregar:
```sql
fecha_inicio_vigencia DATE NULL,  -- NULL = desde siempre
fecha_fin_vigencia DATE NULL      -- NULL = indefinido
```

### 10.3 Horarios Recurrentes vs. Específicos
El modelo actual asume horarios recurrentes semanales. Para clases únicas:
- Opción A: Agregar campo `fecha_especifica DATE`
- Opción B: Manejar en un módulo separado de "calendario"

### 10.4 Sincronización con Moodle
- Los horarios **no se sincronizan** con Moodle (Moodle no tiene concepto de aulas físicas)
- Solo aplica a la gestión local del sistema

---

## 11. Migración de Datos

Si hay cursos existentes con `enableCompletion = true`:
1. Identificar cursos afectados
2. Crear aulas genéricas temporales
3. Migrar gradualmente

---

## 12. Plan de Implementación

### Fase 1: Infraestructura Base
1. Agregar modelos a Prisma schema
2. Crear migración de base de datos
3. Implementar módulo de Aulas (CRUD completo)

### Fase 2: Horarios Core
1. Implementar entidad y validaciones de Horario
2. Implementar algoritmo de detección de conflictos
3. Implementar CRUD de Horarios

### Fase 3: Integración
1. Integrar validaciones con módulo de Cursos
2. Integrar validaciones con módulo de Inscripciones
3. Agregar endpoints de disponibilidad

### Fase 4: UI/UX
1. Vista de calendario semanal por aula
2. Vista de horarios por curso
3. Alertas visuales de conflictos

---

## 13. Ejemplo de Uso

### Crear un aula:
```http
POST /api/aulas
{
  "sucursalId": 1,
  "nombre": "Aula 101",
  "capacidadMaxima": 30,
  "descripcion": "Aula principal del primer piso"
}
```

### Crear un horario:
```http
POST /api/horarios
{
  "cursoId": 1,
  "aulaId": 1,
  "modalidad": "presencial",
  "diaSemana": 1,
  "horaInicio": "08:00",
  "duracionMinutos": 90
}
```

### Verificar conflicto antes de crear:
```http
POST /api/horarios/verificar-conflicto
{
  "aulaId": 1,
  "diaSemana": 1,
  "horaInicio": "09:00",
  "duracionMinutos": 60
}

Response:
{
  "tieneConflicto": true,
  "conflictos": [
    {
      "horarioId": 1,
      "cursoId": 1,
      "cursoNombre": "Matemáticas Básicas",
      "horaInicio": "08:00",
      "horaFin": "09:30"
    }
  ]
}
```

---

## 14. Resumen Ejecutivo

| Aspecto | Decisión |
|---------|----------|
| **Control de horarios** | Solo cuando `enableCompletion = true` |
| **Modalidades** | Virtual (sin aula) y Presencial (con aula) |
| **Conflictos** | Solo para presencial, misma aula/día/solapamiento |
| **Días** | 1-7 (Lunes-Domingo, ISO 8601) |
| **Capacidad** | Override por horario, fallback a aula |
| **Sincronización Moodle** | No aplica (concepto local) |

Este diseño permite flexibilidad para cursos sin control de finalización (típicamente autoguiados) mientras mantiene un control estricto de recursos físicos para cursos con seguimiento de progreso.
