"use client";

import { useState, useEffect, useCallback } from "react";
import { Player, LeaderboardEntry, PlayerAnswerRecord } from "@/types/trivia";
import { fireCelebrationConfetti } from "@/lib/confetti";
import { sound } from "@/lib/sound";
import {
  Trophy,
  Clock,
  Zap,
  RotateCw,
  Share2,
  ChevronDown,
  ChevronUp,
  Crown,
  Medal,
  CheckCircle2,
  XCircle,
  Sparkles,
  UserPlus,
} from "lucide-react";

interface ResultsLeaderboardScreenProps {
  player: Player;
  onPlayAgain: () => void;
}

export default function ResultsLeaderboardScreen({
  player,
  onPlayAgain,
}: ResultsLeaderboardScreenProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentPlayerStats, setCurrentPlayerStats] = useState<Player>(player);
  const [answersList, setAnswersList] = useState<PlayerAnswerRecord[]>([]);
  const [showAnswersDetail, setShowAnswersDetail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedShare, setCopiedShare] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch updated leaderboard & player details
  const fetchLeaderboard = useCallback(async () => {
    try {
      const [lbRes, plRes] = await Promise.all([
        fetch("/api/leaderboard"),
        fetch(`/api/players/${player.id}`),
      ]);

      if (lbRes.ok) {
        const lbData = await lbRes.json();
        setLeaderboard(lbData.leaderboard || []);
      }

      if (plRes.ok) {
        const plData = await plRes.json();
        if (plData.player) {
          setCurrentPlayerStats(plData.player);
        }
        if (plData.answers) {
          setAnswersList(plData.answers);
        }
      }
    } catch (err) {
      console.error("Error fetching results:", err);
    } finally {
      setIsLoading(false);
    }
  }, [player.id]);

  useEffect(() => {
    // Triumphant celebration
    fireCelebrationConfetti();
    sound.playFanfare();

    fetchLeaderboard();

    // Auto refresh every 3.5s for live party ranking updates
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchLeaderboard();
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [fetchLeaderboard, autoRefresh]);

  // Find player's current rank in leaderboard
  const myEntry = leaderboard.find((p) => p.id === player.id);
  const myRank = myEntry?.rank ?? 1;

  // Format milliseconds into seconds string
  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(2);
  };

  const totalTimeSeconds = formatTime(currentPlayerStats.totalTimeMs);
  const avgTimeSeconds = formatTime(currentPlayerStats.totalTimeMs / Math.max(1, answersList.length || 10));

  // Top 3 Podium
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  // Performance message
  const getFeedbackMessage = (score: number) => {
    if (score >= 9) return "👑 ¡Nivel Leyenda! Sos quien mejor conoce al cumpleañero.";
    if (score >= 7) return "🔥 ¡Excelente puntuación! Gran memoria para las anécdotas.";
    if (score >= 5) return "🎉 ¡Muy bien jugado! Estás firme en el pelotón.";
    return "😂 ¡Buen intento! A prestar más atención al cumpleañero en la próxima.";
  };

  const handleShare = async () => {
    const text = `🎉 ¡Jugué a la Trivia de Fiesta! 
⭐ Mi Puntaje: ${currentPlayerStats.score}/10 correctas
⏱️ Tiempo Total: ${totalTimeSeconds}s
🏆 Mi Puesto: #${myRank} en el ranking
¿Te animás a superarme? 🔥`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Mi resultado en la Trivia de Fiesta",
          text,
          url: window.location.origin,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      alert(text);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 flex flex-col min-h-screen">
      {/* Header Banner */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md mb-2 animate-bounce">
          <Sparkles className="w-3.5 h-3.5" /> ¡Trivia Completada!
        </div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Podio y Ranking
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {getFeedbackMessage(currentPlayerStats.score)}
        </p>
      </div>

      {/* Player Personal Score Card */}
      <div className="bg-gradient-to-b from-slate-900/90 to-purple-950/40 border border-purple-500/30 rounded-3xl p-5 shadow-2xl mb-6 relative overflow-hidden backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl p-2 rounded-2xl bg-purple-900/40 border border-purple-500/30 shadow-inner">
              {currentPlayerStats.avatar}
            </span>
            <div>
              <div className="text-base font-extrabold text-white flex items-center gap-2">
                <span>{currentPlayerStats.firstName} {currentPlayerStats.lastName}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-500/40">
                  Vos
                </span>
              </div>
              <div className="text-xs text-purple-300 font-semibold flex items-center gap-1 mt-0.5">
                <Medal className="w-3.5 h-3.5 text-amber-400" />
                <span>Puesto #{myRank} en la tabla</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
            title="Compartir resultado"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{copiedShare ? "¡Copiado!" : "Compartir"}</span>
          </button>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block mb-1">Aciertos</span>
            <span className="text-xl font-black text-emerald-400">
              {currentPlayerStats.score}
              <span className="text-xs font-normal text-slate-500">/10</span>
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block mb-1 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" /> Total
            </span>
            <span className="text-lg font-black text-amber-300 font-mono">
              {totalTimeSeconds}s
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block mb-1 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" /> Promedio
            </span>
            <span className="text-lg font-black text-cyan-300 font-mono">
              {avgTimeSeconds}s
            </span>
          </div>
        </div>

        {/* Toggle Detailed Answers */}
        {answersList.length > 0 && (
          <div className="mt-4 pt-3 border-t border-purple-500/20">
            <button
              onClick={() => setShowAnswersDetail(!showAnswersDetail)}
              className="w-full flex items-center justify-between text-xs text-purple-300 hover:text-white font-bold cursor-pointer py-1"
            >
              <span>📋 Ver mis {answersList.length} respuestas detalladas</span>
              {showAnswersDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAnswersDetail && (
              <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                {answersList.map((ans, idx) => (
                  <div
                    key={ans.id}
                    className={`p-2.5 rounded-xl border ${
                      ans.isCorrect
                        ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
                        : "bg-rose-950/30 border-rose-500/30 text-rose-200"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="flex items-center gap-1.5 truncate max-w-[200px]">
                        {ans.isCorrect ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        )}
                        #{idx + 1}. {ans.questionText}
                      </span>
                      <span className="font-mono text-[10px] text-amber-300 font-semibold shrink-0">
                        ⚡ {(ans.timeSpentMs / 1000).toFixed(2)}s
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 pl-5">
                      {ans.selectedIndex !== null && ans.options[ans.selectedIndex] ? (
                        <span>Tu respuesta: <strong className="text-white">{ans.options[ans.selectedIndex]}</strong></span>
                      ) : (
                        <span className="text-rose-400 italic">No respondiste a tiempo</span>
                      )}
                      {!ans.isCorrect && (
                        <div className="text-emerald-400 font-semibold mt-0.5">
                          Correcta: {ans.options[ans.correctIndex]}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visual Top 3 Podium */}
      {leaderboard.length >= 2 && (
        <div className="mb-6">
          <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span>Podio de Ganadores</span>
          </div>

          <div className="grid grid-cols-3 gap-2 items-end pt-5 pb-2">
            {/* 2nd Place */}
            {top2 ? (
              <div className="flex flex-col items-center">
                <span className="text-3xl mb-1">{top2.avatar}</span>
                <span className="text-xs font-bold text-slate-200 text-center truncate w-full px-1">
                  {top2.firstName}
                </span>
                <span className="text-[10px] font-bold text-emerald-400">{top2.score} pts</span>
                <span className="text-[9px] font-mono text-amber-300">{formatTime(top2.totalTimeMs)}s</span>
                <div className="w-full h-20 bg-gradient-to-t from-slate-700 to-slate-500 rounded-t-xl flex flex-col items-center justify-center shadow-lg border-t-2 border-slate-300 mt-2">
                  <span className="text-2xl font-black text-slate-900">2</span>
                  <span className="text-[9px] uppercase font-bold text-slate-200">Plata</span>
                </div>
              </div>
            ) : <div />}

            {/* 1st Place */}
            {top1 ? (
              <div className="flex flex-col items-center">
                <Crown className="w-6 h-6 text-yellow-400 animate-bounce mb-0.5" />
                <span className="text-4xl mb-1">{top1.avatar}</span>
                <span className="text-xs font-black text-yellow-300 text-center truncate w-full px-1">
                  {top1.firstName}
                </span>
                <span className="text-[11px] font-black text-emerald-300">{top1.score} pts</span>
                <span className="text-[9px] font-mono text-amber-300 font-bold">{formatTime(top1.totalTimeMs)}s</span>
                <div className="w-full h-28 bg-gradient-to-t from-amber-600 to-yellow-400 rounded-t-xl flex flex-col items-center justify-center shadow-xl border-t-2 border-yellow-200 mt-2">
                  <span className="text-3xl font-black text-amber-950">1</span>
                  <span className="text-[10px] uppercase font-black text-amber-950">Oro</span>
                </div>
              </div>
            ) : <div />}

            {/* 3rd Place */}
            {top3 ? (
              <div className="flex flex-col items-center">
                <span className="text-3xl mb-1">{top3.avatar}</span>
                <span className="text-xs font-bold text-slate-200 text-center truncate w-full px-1">
                  {top3.firstName}
                </span>
                <span className="text-[10px] font-bold text-emerald-400">{top3.score} pts</span>
                <span className="text-[9px] font-mono text-amber-300">{formatTime(top3.totalTimeMs)}s</span>
                <div className="w-full h-16 bg-gradient-to-t from-amber-800 to-amber-600 rounded-t-xl flex flex-col items-center justify-center shadow-lg border-t-2 border-amber-400 mt-2">
                  <span className="text-2xl font-black text-amber-950">3</span>
                  <span className="text-[9px] uppercase font-bold text-amber-200">Bronce</span>
                </div>
              </div>
            ) : <div />}
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl flex-1 mb-5">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Tabla General</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {leaderboard.length} jugadores
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchLeaderboard();
                sound.playTick();
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Actualizar ranking"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-purple-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tie-breaker Rule Explanatory Banner */}
        <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-[11px] text-purple-300 leading-tight mb-3">
          ⚡ <strong>Regla de Desempate:</strong> A igual cantidad de respuestas correctas, gana quien acumuló <strong>menor tiempo total</strong> de respuesta.
        </div>

        {/* List of Players */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {leaderboard.map((entry) => {
            const isMe = entry.id === player.id;
            let rankBadge = (
              <span className="w-6 h-6 rounded-full bg-slate-800 font-bold text-xs text-slate-400 flex items-center justify-center">
                #{entry.rank}
              </span>
            );

            if (entry.rank === 1) {
              rankBadge = (
                <span className="w-6 h-6 rounded-full bg-yellow-400 font-black text-xs text-slate-950 flex items-center justify-center shadow-sm">
                  🥇
                </span>
              );
            } else if (entry.rank === 2) {
              rankBadge = (
                <span className="w-6 h-6 rounded-full bg-slate-300 font-black text-xs text-slate-950 flex items-center justify-center shadow-sm">
                  🥈
                </span>
              );
            } else if (entry.rank === 3) {
              rankBadge = (
                <span className="w-6 h-6 rounded-full bg-amber-600 font-black text-xs text-white flex items-center justify-center shadow-sm">
                  🥉
                </span>
              );
            }

            return (
              <div
                key={entry.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                  isMe
                    ? "bg-purple-950/60 border-purple-500/50 shadow-md shadow-purple-900/30 ring-1 ring-purple-400/30"
                    : "bg-slate-800/40 border-slate-800 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {rankBadge}
                  <span className="text-xl shrink-0">{entry.avatar}</span>
                  <div className="truncate">
                    <span className={`text-xs font-bold block truncate ${isMe ? "text-purple-200" : "text-slate-200"}`}>
                      {entry.firstName} {entry.lastName}
                    </span>
                    {isMe && (
                      <span className="text-[10px] text-purple-400 font-semibold">Tú</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div>
                    <span className="text-xs font-black text-emerald-400 block">
                      {entry.score} pts
                    </span>
                    <span className="text-[10px] font-mono text-amber-300 font-bold">
                      {formatTime(entry.totalTimeMs)}s
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={onPlayAgain}
          type="button"
          className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
        >
          <UserPlus className="w-4 h-4 text-purple-400" />
          <span>Ingresar con otro jugador</span>
        </button>
      </div>

      {/* Live Auto-Refresh Status Footer */}
      <footer className="text-center pt-3 text-[10px] text-slate-500 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
        <span>Actualización automática en vivo activa</span>
      </footer>
    </div>
  );
}

