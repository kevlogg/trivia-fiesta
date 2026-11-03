import { NextResponse } from "next/server";
import { getClientQuestions, getSettings } from "@/lib/trivia-service";

export async function GET() {
  try {
    const questions = await getClientQuestions();
    const settings = await getSettings();

    return NextResponse.json({
      questions,
      settings,
      totalQuestions: questions.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener preguntas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
