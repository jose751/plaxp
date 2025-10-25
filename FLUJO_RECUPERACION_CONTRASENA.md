# Flujo de Recuperación de Contraseña - Plaxp

## 🔄 Diagrama de Flujo Completo

```
1. PasswordRecoveryPage (/)
   ├─ Usuario ingresa email
   ├─ Click "Enviar código"
   ├─ API: POST /seguridad/solicitar-recuperacion-contrasena
   │  └─ Body: { correo: "user@example.com" }
   ├─ Backend responde con token en la cookie (set-cookie header)
   ├─ Frontend guarda:
   │  ├─ Cookie: recovery_email (1 día)
   │  └─ Cookie: recovery_token (15 min) - SI el backend lo envía en data.token
   └─ Redirige a → /verify-code

2. VerifyCodePage (/verify-code)
   ├─ Usuario ingresa código de 6 dígitos
   ├─ Click automático al completar
   ├─ API: POST /seguridad/validar-codigo-recuperacion
   │  ├─ Body: { codigo: "123456" }
   │  └─ Headers: Cookies automáticas (credentials: 'include')
   ├─ Backend valida token desde cookies
   ├─ Responde: { success: true, message: "...", data: null }
   ├─ Context guarda: verifiedCode = "123456"
   └─ Redirige a → /reset-password

3. ResetPasswordPage (/reset-password)
   ├─ Usuario ingresa nueva contraseña (2 veces)
   ├─ Validación de fortaleza en tiempo real
   ├─ Click "Restablecer Contraseña"
   ├─ API: POST /seguridad/cambiar-contrasena
   │  ├─ Body: { nueva_contrasena: "NewPass123!" }
   │  └─ Headers: Cookies automáticas (credentials: 'include')
   ├─ Backend valida token desde cookies
   ├─ Responde: { success: true, message: "...", data: null }
   ├─ Limpia todas las cookies de recuperación
   └─ Redirige a → / (Login)
```

## 🍪 Gestión de Cookies

### Cookies Utilizadas

| Cookie | Duración | Propósito | Cuándo se establece |
|--------|----------|-----------|---------------------|
| `recovery_email` | 1 día | Almacenar email para recuperación | Al solicitar código |
| `recovery_token` | 15 min | Token de autenticación del flujo | Al solicitar código (si backend lo envía) |

### Configuración de Cookies

```typescript
{
  expires: 1,           // 1 día para email, 15 min para token
  path: '/',
  secure: true,         // Solo HTTPS
  sameSite: 'Strict'    // Protección CSRF
}
```

### Envío Automático

Todas las peticiones incluyen `credentials: 'include'` para enviar cookies automáticamente:

```typescript
fetch(url, {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify(data),
  credentials: 'include' // ← CRÍTICO
})
```

## 🔐 Endpoints de la API

### 1. Solicitar Recuperación
```http
POST /seguridad/solicitar-recuperacion-contrasena
Content-Type: application/json

{
  "correo": "usuario@example.com"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Código enviado correctamente",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // OPCIONAL
  }
}
```

**Nota:** El backend DEBE establecer la cookie `recovery_token` en el header Set-Cookie, o enviarlo en `data.token`.

---

### 2. Validar Código
```http
POST /seguridad/validar-codigo-recuperacion
Content-Type: application/json
Cookie: recovery_token=...; recovery_email=...

{
  "codigo": "123456"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Código de recuperación válido",
  "data": null
}
```

**Nota:** El backend lee el token desde las cookies enviadas automáticamente.

---

### 3. Cambiar Contraseña
```http
POST /seguridad/cambiar-contrasena
Content-Type: application/json
Cookie: recovery_token=...; recovery_email=...

{
  "nueva_contrasena": "NewPassword123!"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Contraseña restablecida correctamente",
  "data": null
}
```

**Nota:** El backend lee el token desde las cookies para autenticar la operación.

## 🛡️ Protecciones y Validaciones

### Navegación entre Pantallas

| Página | Prerequisito | Redirige si no cumple |
|--------|--------------|----------------------|
| `/password-recovery` | Ninguno | - |
| `/verify-code` | `emailSent === true` | → `/password-recovery` |
| `/reset-password` | `verifiedCode !== null` | → `/password-recovery` |

### Validación de Contraseña

```typescript
// Requisitos mínimos (meetsMinimumRequirements)
✓ Mínimo 8 caracteres
✓ Al menos una letra (a-z o A-Z)
✓ Al menos un número (0-9)

// Fortaleza (0-4)
0 = Muy débil (< 8 caracteres)
1 = Débil (8+ caracteres)
2 = Regular (12+ caracteres)
3 = Buena (incluye mayúsculas y minúsculas)
4 = Excelente (incluye caracteres especiales)
```

## 🐛 Debugging

### Logs Implementados

1. **En ResetPasswordCard.tsx** (antes de enviar):
```javascript
console.log('🔐 Cookies antes de resetear contraseña:', {
  email: RecoveryCookies.getRecoveryEmail(),
  token: RecoveryCookies.getRecoveryToken(),
  verifiedCode,
});
```

2. **En PasswordRecoveryContext.tsx** (al resetear):
```javascript
console.log('🔐 Estado antes de resetear contraseña:', {
  verifiedCode,
  email,
  recoveryEmail: RecoveryCookies.getRecoveryEmail(),
  recoveryToken: RecoveryCookies.getRecoveryToken(),
});
console.log('🔐 Respuesta de restablecer contraseña:', response);
```

3. **En apiService.ts** (todas las peticiones):
```javascript
console.log('📡 API Request:', {
  method,
  endpoint,
  url,
  data,
  headers,
  cookies: document.cookie,
});
console.log('📡 API Response:', {
  endpoint,
  status,
  statusText,
  ok,
});
```

### Verificar el Flujo Completo

Abre las DevTools (F12) y revisa:

1. **Network Tab**: Verifica que las cookies se envíen en cada request
   - Busca el header `Cookie:` en la petición
   - Verifica el header `Set-Cookie:` en la respuesta del primer endpoint

2. **Application Tab → Cookies**: Verifica que las cookies estén presentes
   - `recovery_email` debe tener el email correcto
   - `recovery_token` debe tener el token del backend

3. **Console Tab**: Revisa los logs para rastrear el flujo:
   - 🔐 = Logs de autenticación/cookies
   - 📡 = Logs de peticiones HTTP
   - ✅ = Operación exitosa
   - ❌ = Error

## ⚠️ Problema Actual: "Recurso no encontrado"

### Error Reportado
Al intentar cambiar la contraseña, el backend responde: **"recurso no encontrado"**

### Posibles Causas

1. **Endpoint incorrecto**:
   - Actual: `POST /seguridad/cambiar-contrasena`
   - ¿Debería ser?: `POST /seguridad/restablecer-contrasena`

2. **Parámetro incorrecto**:
   - Actual: `{ nueva_contrasena: "..." }`
   - ¿Backend espera?: `{ nuevaContrasena: "..." }` o `{ password: "..." }`

3. **Token no se envía**:
   - Verificar que `credentials: 'include'` esté en la petición
   - Verificar que la cookie no haya expirado (15 min)
   - Verificar que el dominio de la cookie coincida

4. **Backend no lee cookies**:
   - El backend debe leer el token desde `req.cookies.recovery_token`
   - Debe tener middleware de cookies (express: `cookie-parser`)

### Cómo Verificar

1. Abrir DevTools → Network
2. Intentar cambiar contraseña
3. Click en la petición `cambiar-contrasena`
4. Revisar:
   - **Request Headers**: ¿Está el header `Cookie:`?
   - **Request Payload**: ¿El body es correcto?
   - **Response**: ¿Qué dice exactamente el error?

## ✅ Checklist de Verificación

- [ ] El backend establece `recovery_token` como cookie en `/solicitar-recuperacion-contrasena`
- [ ] El frontend guarda `recovery_email` en las cookies
- [ ] El frontend envía cookies automáticamente con `credentials: 'include'`
- [ ] El endpoint `/seguridad/cambiar-contrasena` existe en el backend
- [ ] El parámetro `nueva_contrasena` es el correcto
- [ ] El backend lee el token desde las cookies
- [ ] Las cookies no han expirado (15 min para token)
- [ ] El dominio/path de las cookies coincide con la URL de la API
- [ ] Las cookies se limpian correctamente al finalizar o cancelar

## 🔄 Limpieza de Cookies

### Cuándo se limpian

1. **Al completar el flujo exitosamente**: Después de cambiar contraseña
2. **Al hacer click en "Volver a intentar"**: En VerifyCodeCard
3. **Al llamar `resetFlow()`**: Desde el contexto

### Código de Limpieza

```typescript
RecoveryCookies.clearRecoveryCookies();
// Elimina: recovery_email y recovery_token
```

## 📝 Notas Importantes

1. **Las cookies se envían automáticamente**: No es necesario agregarlas manualmente al header
2. **El token tiene vida corta**: 15 minutos desde que se solicita el código
3. **El flujo es lineal**: No se puede saltar pasos (email → código → contraseña)
4. **El backend es la autoridad**: El frontend solo muestra lo que el backend responde
5. **Los errores se propagan**: Se muestra el mensaje exacto del backend al usuario
