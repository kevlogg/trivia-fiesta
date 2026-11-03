import { NextResponse } from "next/server";
import { getPlayer, getPlayerAnswers } from "@/lib/trivia-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const player = await getPlayer(id);
    if (!player) {
      return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
    }

    const answers = await getPlayerAnswers(id);

    return NextResponse.json({ player, answers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener jugador";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
