import { NextResponse } from "next/server";
import { resetGame } from "@/lib/trivia-service";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.confirm !== true) {
      return NextResponse.json(
        { error: "Confirmación requerida para reiniciar las partidas" },
        { status: 400 }
      );
    }

    await resetGame();
    return NextResponse.json({ success: true, message: "Todas las partidas fueron reiniciadas" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al reiniciar partidas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
