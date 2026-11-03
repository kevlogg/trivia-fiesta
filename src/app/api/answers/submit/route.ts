import { NextResponse } from "next/server";
import { submitAnswer } from "@/lib/trivia-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { playerId, questionId, selectedIndex, timeSpentMs } = body;

    if (!playerId) {
      return NextResponse.json({ error: "Falta el ID del jugador" }, { status: 400 });
    }

    if (typeof questionId !== "number") {
      return NextResponse.json({ error: "Falta el ID de la pregunta" }, { status: 400 });
    }

    const result = await submitAnswer({
      playerId,
      questionId,
      selectedIndex: typeof selectedIndex === "number" ? selectedIndex : null,
      timeSpentMs: typeof timeSpentMs === "number" ? timeSpentMs : 10000,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al registrar respuesta";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
