import { NextResponse } from "next/server";
import { deleteEvent, updateEvent, getEventById } from "@/lib/trivia-service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteEvent(id);
    return NextResponse.json({ success: true, message: "Evento eliminado correctamente" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar evento";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    await updateEvent(id, body);
    const updated = await getEventById(id);
    return NextResponse.json({ success: true, event: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar evento";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

