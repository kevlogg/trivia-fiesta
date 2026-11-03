import { NextResponse } from "next/server";
import { registerPlayer } from "@/lib/trivia-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, avatar, eventId } = body;

    if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
      return NextResponse.json(
        { error: "Por favor ingresá tu nombre" },
        { status: 400 }
      );
    }

    if (!lastName || typeof lastName !== "string" || !lastName.trim()) {
      return NextResponse.json(
        { error: "Por favor ingresá tu apellido" },
        { status: 400 }
      );
    }

    const player = await registerPlayer(firstName, lastName, avatar || "🥳", eventId);
    return NextResponse.json({ player }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al registrar jugador";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
