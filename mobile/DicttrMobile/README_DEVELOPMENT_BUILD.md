# Configuración de Development Build

## Problema Resuelto

La app estaba mostrando una pantalla de selección de development server al iniciar el development build. Esto se debía a que:

1. **expo-dev-client** estaba instalado y configurado
2. **developmentClient: true** en eas.json para builds de desarrollo
3. La configuración intentaba detectar automáticamente el servidor

## Solución Implementada

### 1. Configuración de EAS
- **developmentClient: false** en [`eas.json`](eas.json:7) para builds de desarrollo
- Se añadió variable de entorno `API_BASE_URL` para forzar el servidor de producción

### 2. Configuración de API
- **Siempre usar servidor de producción** en [`services/config.ts`](services/config.ts)
- Se eliminó la lógica de detección automática de servidor
- La app ahora siempre apunta a `https://studyscribe.zingyzong.com/api`

### 3. Variables de Entorno
- Se crearon archivos `.env.development` y `.env.production`
- Ambos configurados para usar el servidor de producción

## Cómo Construir

### Development Build (Sin Selección de Servidor)
```bash
cd mobile/DicttrMobile
eas build --profile development
```

### Production Build
```bash
cd mobile/DicttrMobile
eas build --profile production
```

## Comportamiento Esperado

- **Development Build**: Se inicia directamente sin pantalla de selección de servidor
- **Production Build**: Funciona normalmente con el servidor de producción
- **Todas las builds**: Usan `https://studyscribe.zingyzong.com/api`

## Notas Importantes

- La app ya no mostrará la pantalla de selección de development server
- Todas las peticiones API van directamente al servidor de producción
- Si necesitas desarrollo local, modifica manualmente `services/config.ts`