# 🚀 Deploy en Render + Supabase PostgreSQL

## ✅ Lo que incluye esta configuración:
- **Backend**: Node.js en Render (gratis)
- **Base de Datos**: PostgreSQL en Supabase (gratis, sin tarjeta)
- **Archivos**: Uploads almacenados en Render (persistentes en plan pago)

---

## 📋 Paso 1: Crear Base de Datos en Supabase

### 1.1 Registro
1. Ve a [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up con **GitHub** (no requiere tarjeta)

### 1.2 Crear Proyecto
1. Click "New Project"
2. Configuración:
   - **Name**: `inboxpaint`
   - **Database Password**: Crea una contraseña fuerte y **guárdala**
   - **Region**: `East US (N. Virginia)` (más cercano a Cuba)
   - **Pricing Plan**: Free (512MB, suficiente para tu proyecto)
3. Click "Create new project"
4. Espera 2-3 minutos mientras se crea

### 1.3 Obtener URL de Conexión
1. En tu proyecto de Supabase, ve a **Settings** (⚙️) → **Database**
2. Baja hasta **Connection string** → **URI**
3. Copia la URL, se verá así:
   ```
   postgresql://postgres.[REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
4. Reemplaza `[PASSWORD]` con la contraseña que creaste
5. Guarda esta URL completa

---

## 📋 Paso 2: Deploy en Render

### 2.1 Registro
1. Ve a [render.com](https://render.com)
2. Sign up con **GitHub** (no requiere tarjeta)
3. Autoriza Render a acceder a tus repos

### 2.2 Crear Web Service
1. Click "New +" → "Web Service"
2. Connect repository → Busca y selecciona `InboxPaint`
3. Configuración:
   - **Name**: `inboxpaint` (o el nombre que quieras)
   - **Region**: `Oregon (US West)` o el más cercano
   - **Branch**: `main`
   - **Root Directory**: `retro_server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### 2.3 Variables de Entorno
1. Baja hasta **Environment Variables**
2. Click "Add Environment Variable"
3. Agrega estas 3 variables:

```
OWNER_TOKEN = shimp2
NODE_ENV = production
DATABASE_URL = [TU_URL_DE_SUPABASE_AQUÍ]
```

**IMPORTANTE**: Pega la URL completa de Supabase que guardaste en el paso 1.3

### 2.4 Deploy
1. Click "Create Web Service"
2. Render comenzará a:
   - Clonar tu repositorio
   - Instalar dependencias (`npm install`)
   - Iniciar el servidor
3. Espera 3-5 minutos

### 2.5 Verificar
En los logs deberías ver:
```
✅ Base de datos inicializada
🚀 Retro Inbox running at http://localhost:10000
🔑 Owner token: shimp2
💾 Database: PostgreSQL
```

Tu app estará en: `https://inboxpaint.onrender.com` (o el nombre que elegiste)

---

## 🎯 Probar la Aplicación

### Como Usuario Anónimo
```
https://inboxpaint.onrender.com
```
Envía un mensaje de prueba con dibujo

### Como Owner
```
https://inboxpaint.onrender.com?owner=shimp2
```
- Verás el panel de administrador
- Tus mensajes recibidos
- Podrás editar tu perfil

---

## ⚠️ Limitaciones del Plan Gratuito

### Render Free:
- ✅ Backend funcionando 24/7
- ✅ HTTPS automático
- ✅ 750 horas/mes (suficiente para 1 app siempre activa)
- ❌ Se duerme después de 15 min de inactividad
- ❌ Tarda ~30 segundos en despertar
- ❌ **Archivos NO persisten** (uploads se borran al redeploy)

### Supabase Free:
- ✅ 512MB base de datos (más que suficiente)
- ✅ Persistencia total
- ✅ Backups automáticos
- ⚠️ Pausa después de 7 días de inactividad

---

## 💾 Solución para Uploads Persistentes

Como Render Free no persiste archivos, tienes 2 opciones:

### Opción A: Cloudinary (Recomendado, gratis)
1. Registro en [cloudinary.com](https://cloudinary.com) (sin tarjeta)
2. 25GB gratis de almacenamiento
3. Tendríamos que adaptar el código para subir a Cloudinary

### Opción B: Guardar en Base64 en PostgreSQL
- Los dibujos se guardan como texto en la base de datos
- Menos eficiente pero funciona
- Límite de 512MB total

### Opción C: Render Paid ($7/mes)
- Persistencia de disco incluida
- No se duerme
- Sin limitaciones

---

## 🔄 Updates Automáticos

Cada vez que hagas `git push` a GitHub:
1. Render detecta el cambio
2. Hace redeploy automáticamente
3. ~3 minutos de downtime durante deploy

---

## 🆘 Troubleshooting

### "Application failed to respond"
- Revisa que `DATABASE_URL` esté configurada correctamente
- Verifica los logs en Render dashboard

### "Connection refused" en Supabase
- Verifica que la contraseña en `DATABASE_URL` sea correcta
- Asegúrate de usar el puerto correcto (6543 para pooler)

### Uploads no se guardan
- **Normal** en Render Free
- Considera Cloudinary o guardar en base64

---

## 📊 Monitoreo

### Render Dashboard:
- Logs en tiempo real
- Métricas de CPU/RAM
- Eventos de deploy

### Supabase Dashboard:
- Table Editor (ver datos directamente)
- SQL Editor (queries personalizados)
- Database size

---

## 📱 PWA (Progressive Web App) - Instalación y Notificaciones

### ¿Qué incluye la PWA?

InboxPaint ahora es una **Progressive Web App** que permite:
- ✅ **Instalar la app** en móvil/PC (sin Play Store ni App Store)
- ✅ **Notificaciones push** incluso con la app cerrada
- ✅ **Funciona offline** (caché de recursos)
- ✅ **Ícono en pantalla de inicio** como app nativa
- ✅ **Sin barra del navegador** (pantalla completa)

### Cómo instalar la PWA:

#### En Android (Chrome/Edge):
1. Abre la web: `https://tu-app.onrender.com`
2. Chrome mostrará automáticamente "Agregar a pantalla de inicio"
3. O toca **⋮** (menú) → **Instalar aplicación**
4. La app aparecerá en tu pantalla de inicio

#### En iOS (Safari):
1. Abre la web en Safari
2. Toca el botón **Compartir** (📤)
3. Selecciona **"Añadir a inicio"**
4. Confirma el nombre y toca **"Añadir"**

#### En PC (Chrome/Edge):
1. Abre la web
2. En la barra de dirección verás un ícono **⊕** o **💾**
3. Click en "Instalar InboxPaint"
4. La app se abrirá en su propia ventana

### Notificaciones Push:

Una vez instalada la PWA:
1. Accede con `?owner=TU_TOKEN`
2. Click en el botón **🔔 NOTIFICATIONS**
3. Acepta el permiso del navegador
4. ¡Listo! Recibirás notificaciones incluso con la app cerrada

**Nota**: Las notificaciones funcionan en:
- ✅ Android (Chrome, Edge, Samsung Internet)
- ✅ Windows/Linux/Mac (Chrome, Edge)
- ❌ iOS/Safari (Apple no soporta notificaciones push en PWAs aún)

### Íconos de la App:

La PWA requiere íconos específicos. Crea:
- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)

Sugerencias de diseño:
- Fondo negro (`#0a0a0a`)
- Logo/símbolo rojo (`#ff0000`)
- Estilo retro/horror acorde a la estética

Puedes usar herramientas como:
- https://realfavicongenerator.net/
- https://favicon.io/

Coloca los íconos en `retro_server/public/`

### Archivos PWA incluidos:

- ✅ `/sw.js` - Service Worker (caché + notificaciones)
- ✅ `/manifest.json` - Configuración de la PWA
- ✅ Registro automático en `index.html`

---

¿Listo para deployar? Sigue los pasos en orden y tu app estará viva en **menos de 15 minutos**! 🎉

