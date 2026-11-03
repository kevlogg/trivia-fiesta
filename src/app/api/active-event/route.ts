import { NextResponse } from "next/server";
import { getActiveEvent } from "@/lib/trivia-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const activeEvent = await getActiveEvent();
    return NextResponse.json({
      hasActiveEvent: activeEvent !== null,
      activeEvent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener evento activo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
