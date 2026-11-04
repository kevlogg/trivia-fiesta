import { NextResponse } from "next/server";
import {
  setEventStatus,
  deactivateAllEvents,
  getActiveEvent,
  getActiveEvents,
  getEventById,
} from "@/lib/trivia-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, status, deactivateAll } = body;

    // Bulk action: deactivate all events into waiting mode
    if (deactivateAll || eventId === null || eventId === "none") {
      await deactivateAllEvents();
      return NextResponse.json({
        success: true,
        message: "Todos los eventos fueron puestos en Modo Espera",
        activeEvents: [],
      });
    }

    if (!eventId) {
      return NextResponse.json(
        { error: "Se requiere eventId para cambiar el estado" },
        { status: 400 }
      );
    }

    const current = await getEventById(eventId);
    if (!current) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    // Determine target status
    const targetStatus =
      status === "active" || status === "inactive"
        ? status
        : current.status === "active"
        ? "inactive"
        : "active";

    await setEventStatus(eventId, targetStatus);
    const updated = await getEventById(eventId);
    const allActive = await getActiveEvents();

    return NextResponse.json({
      success: true,
      event: updated,
      activeEvents: allActive,
      message:
        targetStatus === "active"
          ? `Evento "${updated?.title}" activado en vivo (pueden convivir múltiples eventos)`
          : `Evento "${updated?.title}" pausado`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar estado del evento";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

