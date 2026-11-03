import { NextResponse } from "next/server";
import {
  updateQuestion,
  resetQuestionsToDefault,
  getAllQuestionsAdmin,
  getActiveEvent,
  getEventById,
} from "@/lib/trivia-service";

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
      return NextResponse.json({ hasActiveEvent: false, questions: [] });
    }

    const questions = await getAllQuestionsAdmin(event.id);
    return NextResponse.json({ hasActiveEvent: true, event, questions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener preguntas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, question, options, correctIndex, explanation } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "Falta el ID de la pregunta" }, { status: 400 });
    }

    const updated = await updateQuestion(id, {
      question,
      options,
      correctIndex,
      explanation,
    });

    return NextResponse.json({ success: true, question: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar la pregunta";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, eventId } = body;

    if (action === "reset_default") {
      const questions = await resetQuestionsToDefault(eventId);
      return NextResponse.json({ success: true, questions });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al procesar acción";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
