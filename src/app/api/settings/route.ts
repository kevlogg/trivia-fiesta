import { NextResponse } from "next/server";
import { getSettings, updateSettings, getAllQuestionsAdmin } from "@/lib/trivia-service";

export async function GET() {
  try {
    const settings = await getSettings();
    const questions = await getAllQuestionsAdmin();
    return NextResponse.json({ settings, questions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener configuración";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { birthdayPerson, eventTitle, questionTimerSeconds } = body;

    await updateSettings({
      birthdayPerson,
      eventTitle,
      questionTimerSeconds: questionTimerSeconds ? Number(questionTimerSeconds) : undefined,
    });

    const updated = await getSettings();
    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar configuración";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
