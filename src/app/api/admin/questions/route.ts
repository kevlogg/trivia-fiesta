import { NextResponse } from "next/server";
import { updateQuestion, resetQuestionsToDefault, getAllQuestionsAdmin } from "@/lib/trivia-service";

export async function GET() {
  try {
    const questions = await getAllQuestionsAdmin();
    return NextResponse.json({ questions });
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
    if (body.action === "reset_default") {
      const questions = await resetQuestionsToDefault();
      return NextResponse.json({ success: true, questions });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al procesar acción";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
