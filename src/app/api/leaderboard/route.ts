import { NextResponse } from "next/server";
import { getLeaderboard, getActiveEvent, getEventById } from "@/lib/trivia-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventIdParam = searchParams.get("eventId");

    let event = null;
    if (eventIdParam) {
      event = await getEventById(eventIdParam);
    } else {
      event = await getActiveEvent();
    }

    if (!event) {
      return NextResponse.json({
        hasActiveEvent: false,
        leaderboard: [],
        stats: { totalPlayers: 0, finishedCount: 0, topScore: 0 },
      });
    }

    const leaderboard = await getLeaderboard(event.id);
    const finishedPlayers = leaderboard.filter((p) => p.isFinished);
    const totalPlayers = leaderboard.length;
    const topScore = finishedPlayers.length > 0 ? finishedPlayers[0].score : 0;

    return NextResponse.json({
      hasActiveEvent: true,
      event,
      leaderboard,
      stats: {
        totalPlayers,
        finishedCount: finishedPlayers.length,
        topScore,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener el ranking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
