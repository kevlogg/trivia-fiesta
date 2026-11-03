import { NextResponse } from "next/server";
import { getClientQuestions, getActiveEvent, getEventById } from "@/lib/trivia-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventIdParam = searchParams.get("eventId");

    let event = null;
    if (eventIdParam) {
      event = await getEventById(eventIdParam);
    } else {
      event = await getActiveEvent();
    }

    if (!event) {
      return NextResponse.json({
        hasActiveEvent: false,
        questions: [],
        totalQuestions: 0,
      });
    }

    const questions = await getClientQuestions(event.id);

    return NextResponse.json({
      hasActiveEvent: true,
      event,
      questions,
      totalQuestions: questions.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener preguntas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
