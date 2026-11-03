import { NextResponse } from "next/server";
import { getAllEvents, createEvent } from "@/lib/trivia-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await getAllEvents();
    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener eventos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, birthdayPerson, timerSeconds, activateNow } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "El título del evento es obligatorio" }, { status: 400 });
    }
    if (!birthdayPerson || !birthdayPerson.trim()) {
      return NextResponse.json({ error: "El nombre del homenajeado/cumpleañero es obligatorio" }, { status: 400 });
    }

    const event = await createEvent({
      title,
      birthdayPerson,
      timerSeconds: timerSeconds ? Number(timerSeconds) : 10,
      activateNow: Boolean(activateNow),
    });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear evento";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
