# 🚂 Deploy en Railway - Guía Rápida

## 🎯 Pasos para Deployment

### 1. Crear cuenta en Railway
Ve a [railway.app](https://railway.app) y crea cuenta con GitHub.

---

### 2. Nuevo Proyecto
1. Click en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Autoriza Railway a acceder a tus repos
4. Selecciona **`InboxPaint`**

---

### 3. Configuración Automática
Railway detectará automáticamente:
- ✅ Proyecto Node.js
- ✅ Root directory: `retro_server`
- ✅ Start command: `npm start`
- ✅ Build command: `npm install`

Si necesitas ajustar:
- Click en **Settings** → **Root Directory** → `retro_server`
- **Start Command**: `npm start`
- **Build Command**: `npm install`

---

### 4. Variables de Entorno
En el dashboard de Railway:

1. Click en tu servicio
2. Ve a **Variables** tab
3. Click **"+ New Variable"**
4. Agrega:

```
OWNER_TOKEN = shimp2
NODE_ENV = production
PORT = 3000
```

💡 **Tip**: También puedes usar "RAW Editor" y pegar todo junto:
```
OWNER_TOKEN=shimp2
NODE_ENV=production
PORT=3000
```

---

### 5. Deploy
Railway hará deploy automáticamente. Verás:
- 🔨 Building...
- 🚀 Deploying...
- ✅ Success!

Tu app estará en algo como: `https://inboxpaint-production.up.railway.app`

---

## 🔧 Configuración de Persistencia

Railway automáticamente detecta que escribes archivos y crea almacenamiento persistente. No necesitas configurar nada extra.

Tus archivos persistirán en:
```
/app/retro_server/uploads/
/app/retro_server/profile/
/app/retro_server/db.json
```

---

## 💰 Monitorear Uso

### Ver consumo actual
1. Click en tu proyecto
2. Ve a **"Usage"** en el menú lateral
3. Verás:
   - 💵 Crédito usado: $X.XX / $5.00
   - ⏱️ Horas ejecutadas
   - 💾 Memoria usada
   - 📡 Tráfico de red

### Optimizar para ahorrar crédito

#### Opción 1: Sleep cuando no se usa (Recomendado)
```
Settings → Sleep → Enable
```
La app se dormirá después de 15 minutos de inactividad y despertará automáticamente cuando alguien la visite.

**Ahorro**: ~70% de crédito

#### Opción 2: Pausar manualmente
```
Service → ⋮ → Pause
```
Úsalo cuando no necesites la app por días.

**Ahorro**: 100% mientras está pausada

---

## 🌐 Dominio Personalizado

### Obtener tu URL de Railway
Tu app tiene una URL automática:
```
https://inboxpaint-production.up.railway.app
```

### Agregar dominio custom (opcional)
1. Settings → Networking → Custom Domain
2. Agrega tu dominio (ejemplo: `inbox.tudominio.com`)
3. Configura DNS según las instrucciones

---

## 🔄 Updates Automáticos

Cada vez que hagas `git push` a GitHub, Railway:
1. Detecta el cambio
2. Hace rebuild automáticamente
3. Despliega la nueva versión
4. **Sin downtime** (0 segundos offline)

---

## 📊 Logs en Tiempo Real

Para ver qué está pasando:
1. Click en tu servicio
2. Ve a **"Deployments"**
3. Click en el deployment activo
4. Verás logs en tiempo real

También puedes usar:
```bash
# Instalar Railway CLI (opcional)
npm i -g @railway/cli

# Ver logs
railway logs
```

---

## 🆘 Troubleshooting

### App no inicia
- Verifica variables de entorno (OWNER_TOKEN debe estar configurado)
- Revisa logs: debe decir "🚀 Retro Inbox running at..."

### No se guardan los archivos
- Railway detecta automáticamente escrituras en disco
- Verifica que las rutas sean relativas (`./uploads`, no `/uploads`)

### Excedí los $5
- La app se pausará automáticamente
- Se reinicia el 1ro del mes siguiente
- O agrega tarjeta para plan Developer

### Quiero cambiar el token
- Ve a Variables → edita OWNER_TOKEN
- Railway redeploys automáticamente

---

## ⚡ Comandos Rápidos del CLI (Opcional)

```bash
# Instalar CLI
npm i -g @railway/cli

# Login
railway login

# Link a tu proyecto
railway link

# Ver logs
railway logs

# Abrir en navegador
railway open

# Ver variables
railway variables

# Deploy manual
railway up
```

---

## 🎯 Acceder como Owner

Una vez deployado:
```
https://tu-app.up.railway.app?owner=shimp2
```

---

## 📝 Checklist Final

- [x] ✅ Repositorio en GitHub
- [x] ✅ Proyecto creado en Railway
- [x] ✅ Variables de entorno configuradas
- [x] ✅ Deploy exitoso
- [ ] ⏰ (Opcional) Sleep mode activado para ahorrar
- [ ] 🌐 (Opcional) Dominio custom configurado

---

## 💡 Tips Pro

1. **Monitorea tu uso semanalmente** para evitar sorpresas
2. **Activa sleep mode** si tu app no necesita estar 24/7
3. **Usa el crédito gratuito para múltiples proyectos** (se comparte entre todos)
4. **Habilita notificaciones** para saber cuando estás cerca del límite

---

¿Listo? Solo ve a [railway.app](https://railway.app) y sigue los pasos. Tu app estará viva en **menos de 5 minutos**! 🚀
