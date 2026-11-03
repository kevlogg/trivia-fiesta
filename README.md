# 🎉 Trivia de Fiesta - Web App Interactiva

Aplicación web ultra fluida, mobile-first y en tiempo real tipo "Trivia de Fiesta" para escanear mediante código QR en cumpleaños y celebraciones. No requiere login ni autenticación, permitiendo que cualquier invitado participe en segundos.

---

## 🚀 Inicio Rápido

1. **Abrir la terminal en la carpeta:**
   ```bash
   cd c:\development\trivia-fiesta
   ```

2. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:3000`.

3. **Para jugar desde celulares en la fiesta:**
   - Conectá tu celular a la misma red WiFi que tu computadora.
   - En la computadora ejecutá `ipconfig` para conocer tu IP local (ejemplo: `192.168.1.50`).
   - Iniciá Next.js escuchando en tu red:
     ```bash
     npm run dev -- -H 0.0.0.0
     ```
   - Abrí en tu TV o computadora `http://<tu-ip>:3000/tv` y todos los invitados podrán escanear el código QR directamente desde la pantalla.

---

## 📱 Pantallas y Rutas del Sistema

| Ruta | Nombre | Descripción |
| :--- | :--- | :--- |
| **`/`** | **Experiencia del Jugador (Mobile-First)** | Registro rápido (Nombre, Apellido, Avatar), juego de 10 preguntas con temporizador estricto de 10s, y podio final. |
| **`/tv`** | **Modo Pantalla Gigante / TV / Proyector** | Diseñado para la televisión del salón. Muestra el código QR dinámico de alta resolución y el podio Top 3 en vivo actualizándose automáticamente cada 3 segundos. |
| **`/admin`** | **Panel del Anfitrión** | Permite cambiar el nombre del cumpleañero, el título del evento, auditar las 10 preguntas y reiniciar el ranking antes de que empiece la fiesta. |

---

## ⚡ Reglas de Juego y Sistema de Desempate

1. **Temporizador Estricto:** Cada pregunta dispone de **10.0 segundos**.
   - Verde (>5s) ➔ Ámbar (2.5s - 5s) ➔ Rojo pulsante (<2.5s con tics de advertencia sonoros).
   - Si el tiempo llega a `0.0s`, se califica automáticamente como no respondida / incorrecta y avanza a la siguiente pregunta.
2. **Medición en Milisegundos:** Se registra con `performance.now()` la cantidad exacta de milisegundos que el invitado tardó en presionar la opción.
3. **Criterio de Desempate:**
   - **Primer criterio:** Mayor cantidad de respuestas correctas (`score DESC`).
   - **Segundo criterio (Desempate):** Menor tiempo total acumulado sumando todas las preguntas (`total_time_ms ASC`).

---

## 💾 Base de Datos y Persistencia

Utiliza **SQLite** integrado de alto rendimiento con modo WAL (`better-sqlite3` en `data/trivia.db`):
- `players`: Datos de cada invitado (ID UUID, Nombre, Apellido, Avatar, Score, Tiempo acumulado en ms, Estado finalizado).
- `questions`: 10 preguntas festivas preconfiguradas con opciones, explicaciones y curiosidades.
- `player_answers`: Registro de auditoría por pregunta con la opción elegida, si fue correcta y los milisegundos exactos de respuesta.
- `settings`: Configuración del evento en tiempo real.

---

## 🧪 Pruebas Automatizadas

Podés verificar el funcionamiento y el sistema de desempate en cualquier momento:
```bash
npm test
```
Este test simula partidas completas con mediciones en milisegundos y corrobora la posición del podio.
