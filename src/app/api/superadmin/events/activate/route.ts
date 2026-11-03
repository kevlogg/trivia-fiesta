import { NextResponse } from "next/server";
import { setActiveEvent, getActiveEvent } from "@/lib/trivia-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId } = body;

    // eventId can be string or null/"none" to deactivate all
    await setActiveEvent(eventId || null);

    const active = await getActiveEvent();
    return NextResponse.json({
      success: true,
      activeEvent: active,
      message: active ? `Evento "${active.title}" activado` : "Todos los eventos fueron desactivados (Modo Espera)",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al activar evento";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
