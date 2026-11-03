import { NextResponse } from "next/server";
import { getActiveEvent, getEventById, updateEvent, getAllQuestionsAdmin } from "@/lib/trivia-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventIdParam = searchParams.get("eventId");

    const targetEvent = eventIdParam ? await getEventById(eventIdParam) : await getActiveEvent();
    if (!targetEvent) {
      return NextResponse.json({ hasActiveEvent: false });
    }
    const questions = await getAllQuestionsAdmin(targetEvent.id);
    return NextResponse.json({
      hasActiveEvent: true,
      event: targetEvent,
      settings: {
        birthdayPerson: targetEvent.birthdayPerson,
        eventTitle: targetEvent.title,
        questionTimerSeconds: targetEvent.timerSeconds,
      },
      questions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener configuración";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { birthdayPerson, eventTitle, questionTimerSeconds, eventId } = body;

    let targetEventId = eventId;
    if (!targetEventId) {
      const active = await getActiveEvent();
      if (!active) throw new Error("No hay evento activo");
      targetEventId = active.id;
    }

    await updateEvent(targetEventId, {
      title: eventTitle,
      birthdayPerson,
      timerSeconds: questionTimerSeconds ? Number(questionTimerSeconds) : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar configuración";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
