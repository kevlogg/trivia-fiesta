import { NextResponse } from "next/server";
import { getActiveEvent, getActiveEvents, getEventById } from "@/lib/trivia-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventIdParam = searchParams.get("eventId");

    if (eventIdParam) {
      const event = await getEventById(eventIdParam);
      const isActive = event !== null && event.status === "active";
      return NextResponse.json({
        hasActiveEvent: isActive,
        activeEvent: event,
      });
    }

    const activeEvents = await getActiveEvents();
    const activeEvent = await getActiveEvent();

    return NextResponse.json({
      hasActiveEvent: activeEvent !== null,
      activeEvent,
      activeEvents,
      activeCount: activeEvents.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener evento activo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

