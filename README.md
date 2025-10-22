# 🎨 InboxPaint

**Mensajes Anónimos con Estética Horror Retro**

InboxPaint es una aplicación web de mensajería anónima con la capacidad única de enviar dibujos personalizados.
![Version](https://img.shields.io/badge/version-1.0.0-red.svg)
![License](https://img.shields.io/badge/license-MIT-darkred.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-darkgreen.svg)

---

## ✨ Características

### 📬 Mensajería Anónima
- **Envío de mensajes sin registro**: Los usuarios pueden enviar mensajes anónimos sin necesidad de crear cuenta
- **Canvas de dibujo integrado**: Adjunta dibujos personalizados a tus mensajes
- **Nicknames opcionales**: Identifícate con un apodo o mantente completamente anónimo

### 🎨 Canvas de Dibujo
- **Herramientas de dibujo**: Pincel, borrador, paleta de colores completa
- **Control de tamaño**: Ajusta el grosor del pincel con slider
- **Sistema de deshacer**: Revierte trazos uno por uno
- **Limpiar canvas**: Borra todo y empieza de nuevo
- **Modo fullscreen** (solo desktop): Pantalla completa con herramientas avanzadas
  - Formas geométricas (línea, rectángulo, círculo)
  - Herramienta de relleno
  - Sistema de redo/undo avanzado
  - Paleta de colores expandida

### 👤 Panel de Administrador
Accede con `?owner=owner123` para:
- **Ver todos los mensajes recibidos**: Bandeja de entrada completa
- **Marcar como leído**: Organiza los mensajes
- **Descargar dibujos**: Guarda las imágenes enviadas
- **Gestionar perfil público**: Actualiza nombre, bio, avatar y enlace web
- **Actualización en tiempo real**: Polling cada 10 segundos

### 🎭 Estética Horror Retro
- **Tema visual único**: Inspirado en interfaces antiguas de MS-DOS con toques de horror
- **Animaciones atmosféricas**:
  - Efecto de escaneo CRT
  - Parpadeo (flicker) en textos
  - Elementos flotantes animados (👁, 🕷, 🩸)
  - Glitch effects sutiles
- **Iconos terroríficos**: `▶` y `█` con animaciones personalizadas
- **Paleta de colores oscura**: Negros profundos con rojos intensos

---

## 🚀 Instalación y Uso

### Requisitos Previos
- **Node.js** >= 14.0.0
- **npm** o **yarn**

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/yankarlosb/InboxPaint.git

# Navegar al directorio del servidor
cd InboxPaint/retro_server

# Instalar dependencias
npm install

# Iniciar el servidor
npm start
```

El servidor se iniciará en `http://localhost:3000`

### Configuración

#### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
OWNER_TOKEN=tu_token_secreto_aqui
PORT=3000
```

- **OWNER_TOKEN**: Token secreto para acceder al panel de administrador (cambia `tu_token_secreto_aqui` por tu token)
- **PORT**: Puerto donde correrá el servidor (por defecto: 3000)

Para acceder como propietario, usa: `http://localhost:3000?owner=tu_token_secreto_aqui`

#### Configuración del Servidor

El archivo `server.js` lee automáticamente las variables del archivo `.env`:
- **Puerto**: Configurable desde `PORT` en `.env`
- **CORS**: Habilitado para desarrollo local
- **Almacenamiento**: JSON files en `/uploads` y `/profile`
- **Token de Owner**: Se carga dinámicamente desde el servidor

---

## 📁 Estructura del Proyecto

```
InboxPaint/
├── README.md
├── .env                         # Variables de entorno (NO subir a git)
└── retro_server/
    ├── server.js                 # Servidor Express
    ├── package.json              # Dependencias
    ├── db.json                   # Base de datos de mensajes
    ├── profile/
    │   └── owner.json           # Perfil del propietario
    ├── uploads/                 # Dibujos subidos
    └── public/
        ├── index.html           # Estructura HTML (82 líneas)
        ├── css/
        │   └── styles.css       # Estilos completos (1,257 líneas)
        └── js/
            └── app.js           # Lógica de aplicación (1,428 líneas)
```

---

## 🎨 Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica
- **CSS3**: 
  - Variables CSS personalizadas
  - Keyframe animations (8 animaciones únicas)
  - Responsive design (mobile-first)
  - Media queries optimizadas
- **JavaScript Vanilla**: Sin frameworks
  - Canvas API para dibujo
  - Fetch API para backend
  - LocalStorage como fallback
  - Event handling optimizado
- **Tailwind CDN**: Utilidades CSS

### Backend
- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web minimalista
- **Multer**: Manejo de uploads de imágenes
- **CORS**: Cross-Origin Resource Sharing
- **File System (fs)**: Almacenamiento en JSON

---

## 📱 Optimizaciones Móviles

InboxPaint está completamente optimizado para dispositivos móviles:

### Performance
- **Throttling de eventos táctiles**: 60fps para dibujo suave
- **Canvas optimizado**: `desynchronized: true` para menor latencia
- **Animaciones reducidas**: Efectos costosos deshabilitados en móvil
- **RequestAnimationFrame**: Redraws sincronizados con refresh rate

### UX/UI
- **Touch targets**: Mínimo 44px (recomendación iOS)
- **Viewport optimizado**: Prevención de zoom accidental
- **Canvas táctil**: Detección precisa de coordenadas
- **Controles adaptables**: Layout responsive en todos los breakpoints
- **Slider optimizado**: Tamaño visual pequeño, área táctil grande

### Breakpoints
- **Desktop**: > 768px - Experiencia completa con fullscreen
- **Tablet**: 481px - 768px - Canvas optimizado, controles ajustados
- **Mobile**: < 480px - Layout vertical, texto más grande

---

## 🔒 Seguridad y Privacidad

### Token de Propietario
- El token se configura en el archivo `.env` (variable `OWNER_TOKEN`)
- El frontend obtiene el token automáticamente desde el servidor
- Se almacena en localStorage para sesiones persistentes
- **IMPORTANTE**: Nunca subas el archivo `.env` a repositorios públicos

### Validaciones
- Límite de tamaño en uploads de imágenes
- Sanitización de HTML en mensajes
- CORS configurado para dominios permitidos

### Privacidad
- **Mensajes anónimos**: No se requiere información personal
- **Sin tracking**: No hay cookies de terceros ni analytics
- **Datos locales**: Fallback a localStorage si no hay backend

---

## 🛠️ API Endpoints

### Configuración
```javascript
// Obtener configuración del servidor (incluye owner token)
GET /api/config
Response: { ownerToken: "tu_token_secreto_aqui" }
```

### Mensajes
```javascript
// Obtener todos los mensajes (requiere owner token)
GET /api/messages
Headers: { 'x-owner-token': 'tu_token_secreto_aqui' }

// Enviar mensaje
POST /api/messages
Body: { text, nick, drawing }

// Marcar como leído
POST /api/messages/:id/read
Headers: { 'x-owner-token': 'tu_token_secreto_aqui' }
```

### Perfil
```javascript
// Obtener perfil público
GET /api/profile

// Actualizar perfil (requiere owner token)
POST /api/profile
Headers: { 'x-owner-token': 'tu_token_secreto_aqui' }
Body: { name, bio, web, avatar }
```

---

## 🎯 Funcionalidades Técnicas Destacadas

### Canvas con Context2D Optimizado
```javascript
const ctx = canvas.getContext('2d', {
  alpha: false,        // Sin canal alpha = más rápido
  desynchronized: true // No espera VSync = menos lag
});
```

### Sistema de Undo/Redo
- Almacena cada trazo en un array de strokes
- Permite deshacer múltiples veces
- Redibuja el canvas completo desde el historial

### Gestión de Estado
- Dual storage: Backend + LocalStorage fallback
- Sincronización automática cada 10 segundos
- Event storage para notificaciones cross-tab

### Responsive Canvas Rotation
En móviles, el canvas en fullscreen rota 90° para aprovechar el espacio:
```javascript
// Transform coordinates: rotate -90° around center
fsCanvas.style.transform = 'rotate(90deg)';
```

---

## 🐛 Problemas Conocidos y Soluciones

### Fullscreen en Móviles
❌ **Deshabilitado**: El botón de fullscreen está oculto en dispositivos móviles
✅ **Razón**: Mejor experiencia con canvas normal en pantallas pequeñas

### Animaciones en Dispositivos de Gama Baja
✅ **Optimizado**: Efectos costosos (blur, shadows múltiples) deshabilitados automáticamente en móviles

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👨‍💻 Autor

**Yan Carlos**
- GitHub: [@yankarlosb](https://github.com/yankarlosb)

---

## 🙏 Contribuciones

¡Las contribuciones son bienvenidas! Si encuentras un bug o tienes una sugerencia:

1. Fork el proyecto
2. Crea tu Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al Branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Changelog

### v1.0.0 (2025-10-22)
- ✨ Lanzamiento inicial
- 🎨 Sistema completo de canvas con dibujo
- 📬 Mensajería anónima funcional
- 🎭 Tema horror retro implementado
- 📱 Optimizaciones móviles completas
- ⚡ Performance mejorado con throttling
- 🔧 Corrección de bugs en modales
- 🧹 CSS limpiado y optimizado

---

## 🔮 Roadmap Futuro

- [ ] Sistema de reacciones a mensajes
- [ ] Exportar/importar mensajes
- [ ] Temas alternativos (cyberpunk, vaporwave)
- [ ] Autenticación opcional con cuentas
- [ ] Notificaciones push
- [ ] Modo oscuro/claro toggle
- [ ] Soporte multilenguaje (i18n)
- [ ] Base de datos real (MongoDB/PostgreSQL)

---

<div align="center">

**¿Te gusta InboxPaint?** ⭐ Dale una estrella al repo!

Made with 💀 and ❤️

</div>
