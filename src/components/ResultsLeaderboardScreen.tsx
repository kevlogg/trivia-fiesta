"use client";

import { useState, useEffect } from "react";
import { Player } from "@/types/trivia";
import { fireCelebrationConfetti } from "@/lib/confetti";
import { sound } from "@/lib/sound";
import {
  Trophy,
  Clock,
  Zap,
  Share2,
  Tv,
  Check,
  UserPlus,
  Sparkles,
} from "lucide-react";

interface ResultsLeaderboardScreenProps {
  player: Player;
  onPlayAgain: () => void;
}

export default function ResultsLeaderboardScreen({
  player,
  onPlayAgain,
}: ResultsLeaderboardScreenProps) {
  const [currentPlayerStats, setCurrentPlayerStats] = useState<Player>(player);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    // Triumphant celebration fanfare & confetti
    fireCelebrationConfetti();
    sound.playFanfare();

    // Fetch freshest player stats
    const fetchMyStats = async () => {
      try {
        const res = await fetch(`/api/players/${player.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.player) {
            setCurrentPlayerStats(data.player);
          }
        }
      } catch (err) {
        console.error("Error fetching player stats:", err);
      }
    };

    fetchMyStats();
  }, [player.id]);

  const totalTimeSeconds = (currentPlayerStats.totalTimeMs / 1000).toFixed(2);

  // Performance message
  const getFeedbackMessage = (score: number) => {
    if (score >= 9) return "👑 ¡Nivel Leyenda! Sos quien mejor conoce al cumpleañero.";
    if (score >= 7) return "🔥 ¡Excelente puntuación! Gran memoria para las anécdotas.";
    if (score >= 5) return "🎉 ¡Muy bien jugado! Gran desempeño en la trivia.";
    return "😂 ¡Buen intento! A prestar más atención al cumpleañero.";
  };

  const handleShare = async () => {
    const text = `🎉 ¡Jugué a la Trivia de Fiesta! 
⭐ Mi Puntaje: ${currentPlayerStats.score}/10 aciertos
⏱️ Tiempo Total: ${totalTimeSeconds}s
¿Te animás a superarme en la fiesta? 🔥`;

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
    <div className="w-full max-w-md mx-auto px-3.5 py-4 h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between select-none">
      {/* Top Header */}
      <header className="text-center shrink-0">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md mb-1.5 animate-bounce">
          <Sparkles className="w-3.5 h-3.5" /> ¡Trivia Completada!
        </div>
        <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Tu Resultado Final
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {getFeedbackMessage(currentPlayerStats.score)}
        </p>
      </header>

      {/* Main Content Area (Strictly Fits in Viewport) */}
      <div className="flex-1 flex flex-col justify-center min-h-0 py-2 space-y-3">
        {/* Player Personal Score Card */}
        <div className="bg-gradient-to-b from-slate-900/95 to-purple-950/40 border border-purple-500/40 rounded-3xl p-4 shadow-2xl backdrop-blur-md shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 truncate">
              <span className="text-3xl p-1.5 rounded-2xl bg-purple-900/40 border border-purple-500/30 shadow-inner shrink-0">
                {currentPlayerStats.avatar}
              </span>
              <div className="truncate">
                <div className="text-base font-extrabold text-white truncate">
                  {currentPlayerStats.firstName} {currentPlayerStats.lastName}
                </div>
                <div className="text-[11px] text-purple-300 font-semibold">
                  Participante Registrado
                </div>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer shrink-0"
              title="Compartir resultado"
            >
              {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="text-xs">{copiedShare ? "Copiado" : "Compartir"}</span>
            </button>
          </div>

          {/* 2 Big Bold Metric Cards */}
          <div className="grid grid-cols-2 gap-2.5 text-center">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
              <span className="text-[11px] text-slate-400 font-semibold block mb-0.5">
                Respuestas Correctas
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                {currentPlayerStats.score}
                <span className="text-sm font-bold text-slate-500"> / 10</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
              <span className="text-[11px] text-slate-400 font-semibold block mb-0.5 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" /> Tiempo Total
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                {totalTimeSeconds}s
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-purple-500/20 text-center text-[10px] text-purple-300 font-medium">
            ⚡ Desempate automático: Mayor cantidad de aciertos ➔ Menor tiempo acumulado
          </div>
        </div>

        {/* TV Giant Screen Callout Box */}
        <div className="bg-slate-900/90 border-2 border-amber-500/40 rounded-3xl p-4 shadow-xl text-center space-y-1.5 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center mx-auto">
            <Tv className="w-5 h-5" />
          </div>

          <h2 className="text-sm sm:text-base font-black text-white">
            ¡Mirá la Pantalla Gigante de la Fiesta!
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
            El podio oficial de ganadores, las posiciones finales de todos los invitados y las respuestas correctas se muestran en la pantalla TV.
          </p>
        </div>
      </div>

      {/* Footer Action */}
      <footer className="shrink-0 space-y-2 pt-1">
        <button
          onClick={onPlayAgain}
          type="button"
          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
        >
          <UserPlus className="w-3.5 h-3.5 text-purple-400" />
          <span>Ingresar con otro jugador</span>
        </button>

        <p className="text-center text-[10px] text-slate-500">
          Sin contraseñas • 100% en tiempo real
        </p>
      </footer>
    </div>
  );
}
