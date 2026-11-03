import {
  createEvent,
  getAllEvents,
  getActiveEvent,
  setActiveEvent,
  deleteEvent,
} from "./src/lib/trivia-service";

async function testMultiEvents() {
  console.log("==================================================");
  console.log("   PRUEBAS DE SISTEMA MULTI-EVENTO & ESPERA");
  console.log("==================================================");

  // 1. Create a test event
  const event1 = await createEvent({
    title: "Cumple de Sofía 30",
    birthdayPerson: "Sofía",
    timerSeconds: 10,
    status: "active",
  });
  console.log(`✓ 1. Evento 1 creado y activado: "${event1.title}" (${event1.id})`);

  // 2. Verify active event
  const active1 = await getActiveEvent();
  if (!active1 || active1.id !== event1.id) {
    throw new Error(`Se esperaba evento activo ${event1.id}, pero se obtuvo ${active1?.id}`);
  }
  console.log(`✓ 2. Verificación de evento activo: "${active1.title}" está en vivo.`);

  // 3. Create a second event (inactive)
  const event2 = await createEvent({
    title: "Casamiento Laura & Nico",
    birthdayPerson: "Laura y Nico",
    timerSeconds: 10,
    status: "inactive",
  });
  console.log(`✓ 3. Evento 2 creado (inactivo): "${event2.title}" (${event2.id})`);

  // 4. Test Deactivate All (Pantalla de Espera / Modo Espera)
  await setActiveEvent(null);
  const activeNone = await getActiveEvent();
  if (activeNone !== null) {
    throw new Error("Se esperaba que no hubiera ningún evento activo");
  }
  console.log("✓ 4. Desactivación completa: Modo espera de TV y Celulares activado exitosamente.");

  // 5. Switch active event to event2
  await setActiveEvent(event2.id);
  const active2 = await getActiveEvent();
  if (!active2 || active2.id !== event2.id) {
    throw new Error(`Se esperaba que el evento activo fuera ${event2.id}`);
  }
  console.log(`✓ 5. Conmutación de evento en vivo: "${active2.title}" ahora está activo.`);

  // 6. Reactivate default event for regular usage
  const allEvents = await getAllEvents();
  const defaultEvent = allEvents.find((e) => e.id === "default-event");
  if (defaultEvent) {
    await setActiveEvent(defaultEvent.id);
    console.log("✓ 6. Evento predeterminado reactivado para la demo en producción.");
  }

  // Cleanup created test events
  await deleteEvent(event1.id);
  await deleteEvent(event2.id);
  console.log("✓ 7. Limpieza de eventos de prueba completada.");

  console.log("\n🎉 ¡TODAS LAS PRUEBAS DE MULTI-EVENTO PASARON AL 100%! 🎉\n");
}

testMultiEvents().catch((err) => {
  console.error("Error en pruebas multi-evento:", err);
  process.exit(1);
});
