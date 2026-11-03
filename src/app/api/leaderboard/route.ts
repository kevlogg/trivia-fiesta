import { NextResponse } from "next/server";
import { getLeaderboard, getSettings } from "@/lib/trivia-service";

export async function GET() {
  try {
    const leaderboard = await getLeaderboard();
    const settings = await getSettings();

    const finishedPlayers = leaderboard.filter((p) => p.isFinished);
    const totalPlayers = leaderboard.length;
    const topScore = finishedPlayers.length > 0 ? finishedPlayers[0].score : 0;

    return NextResponse.json({
      leaderboard,
      settings,
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
