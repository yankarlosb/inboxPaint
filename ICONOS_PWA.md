# Guía para crear íconos PWA para InboxPaint

## Íconos necesarios:

Para que la PWA funcione correctamente, necesitas crear estos íconos:

### 1. icon-192.png (192x192px)
- Fondo negro (#0a0a0a)
- Logo/símbolo de InboxPaint en rojo (#ff0000)
- Estilo retro/horror

### 2. icon-512.png (512x512px)
- Mismo diseño que el de 192px pero en mayor resolución
- Fondo negro (#0a0a0a)
- Logo/símbolo en rojo (#ff0000)

## Opción rápida: Usar favicon existente

Si ya tienes un `favicon.ico`, puedes:

1. **Usar una herramienta online** como:
   - https://realfavicongenerator.net/
   - https://favicon.io/
   
2. **O crear manualmente con Paint/Photoshop**:
   - Crear imagen 512x512px con fondo negro
   - Agregar símbolo (ej: 📨, 🎨, o texto "IP")
   - Guardar como PNG
   - Redimensionar a 192x192px para el segundo ícono

## Opción simple: Placeholder

Mientras tanto, el sistema usará el `favicon.ico` existente.

Para producción, crea íconos profesionales para mejor apariencia.

## Ubicación de los archivos:
- `retro_server/public/icon-192.png`
- `retro_server/public/icon-512.png`
