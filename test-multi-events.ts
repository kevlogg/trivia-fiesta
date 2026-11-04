import {
  createEvent,
  getAllEvents,
  getActiveEvent,
  getActiveEvents,
  setActiveEvent,
  setEventStatus,
  deactivateAllEvents,
  deleteEvent,
} from "./src/lib/trivia-service";

async function testMultiEvents() {
  console.log("==================================================");
  console.log("   PRUEBAS DE SISTEMA MULTI-EVENTO SIMULTÁNEO");
  console.log("==================================================");

  // 1. Create test Event 1 (active)
  const event1 = await createEvent({
    title: "Cumple de Sofía 30",
    birthdayPerson: "Sofía",
    timerSeconds: 15,
    status: "active",
  });
  console.log(`✓ 1. Evento 1 creado y activado: "${event1.title}" (${event1.id})`);

  // 2. Create test Event 2 (active) simultaneously!
  const event2 = await createEvent({
    title: "Casamiento Laura & Nico",
    birthdayPerson: "Laura y Nico",
    timerSeconds: 15,
    status: "active",
  });
  console.log(`✓ 2. Evento 2 creado y activado simultáneamente: "${event2.title}" (${event2.id})`);

  // 3. Verify BOTH events are active at the same time
  const activeEvents = await getActiveEvents();
  const event1IsActive = activeEvents.some((e) => e.id === event1.id);
  const event2IsActive = activeEvents.some((e) => e.id === event2.id);

  if (!event1IsActive || !event2IsActive) {
    throw new Error(
      `ERROR: Se esperaba que ambos eventos estuvieran activos simultáneamente (E1: ${event1IsActive}, E2: ${event2IsActive})`
    );
  }
  console.log(
    `✓ 3. Verificación de simultaneidad: Ambos eventos están EN VIVO a la vez (${activeEvents.length} eventos activos).`
  );

  // 4. Deactivate only Event 1, verify Event 2 remains active
  await setEventStatus(event1.id, "inactive");
  const activeAfterPause = await getActiveEvents();
  const e1Active = activeAfterPause.some((e) => e.id === event1.id);
  const e2Active = activeAfterPause.some((e) => e.id === event2.id);

  if (e1Active || !e2Active) {
    throw new Error("ERROR: Pausar Evento 1 afectó o no pausó correctamente.");
  }
  console.log(`✓ 4. Pausa individual: Evento 1 pausado mientras Evento 2 permanece EN VIVO.`);

  // 5. Reactivate Event 1
  await setEventStatus(event1.id, "active");
  const activeBothAgain = await getActiveEvents();
  if (
    !activeBothAgain.some((e) => e.id === event1.id) ||
    !activeBothAgain.some((e) => e.id === event2.id)
  ) {
    throw new Error("ERROR: Reactivación individual de Evento 1 falló.");
  }
  console.log(`✓ 5. Reactivación individual: Ambos vuelven a estar activos en paralelo.`);

  // 6. Test Deactivate All (Bulk Modo Espera)
  await deactivateAllEvents();
  const activeNone = await getActiveEvents();
  if (activeNone.length !== 0) {
    throw new Error(`Se esperaba que no hubiera ningún evento activo, pero hay ${activeNone.length}`);
  }
  console.log("✓ 6. Desactivación masiva: Todos los eventos puestos en Modo Espera con éxito.");

  // 7. Reactivate default event for regular usage
  const allEvents = await getAllEvents();
  const defaultEvent = allEvents.find((e) => e.id === "default-event");
  if (defaultEvent) {
    await setEventStatus(defaultEvent.id, "active");
    console.log("✓ 7. Evento predeterminado reactivado para la demo en producción.");
  }

  // 8. Cleanup created test events
  await deleteEvent(event1.id);
  await deleteEvent(event2.id);
  console.log("✓ 8. Limpieza de eventos de prueba completada.");

  console.log("\n🎉 ¡TODAS LAS PRUEBAS DE MULTI-EVENTO SIMULTÁNEO PASARON AL 100%! 🎉\n");
}

testMultiEvents().catch((err) => {
  console.error("Error en pruebas multi-evento:", err);
  process.exit(1);
});
