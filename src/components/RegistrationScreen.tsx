"use client";

import { useState } from "react";
import { Sparkles, Trophy, Clock, ArrowRight, Music, VolumeX, Zap } from "lucide-react";
import { sound } from "@/lib/sound";
import { Player } from "@/types/trivia";

interface RegistrationScreenProps {
  eventTitle: string;
  birthdayPerson: string;
  onRegistered: (player: Player) => void;
}

const AVATAR_OPTIONS = ["🥳", "🕺", "💃", "👑", "🚀", "🎸", "🍕", "🎂", "🦁", "🦄", "🕶️", "🥂"];

export default function RegistrationScreen({
  eventTitle,
  birthdayPerson,
  onRegistered,
}: RegistrationScreenProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🥳");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  const handleToggleSound = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      sound.playCorrect();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();

    if (!cleanFirst) {
      setErrorMessage("Por favor ingresá tu nombre");
      return;
    }
    if (!cleanLast) {
      setErrorMessage("Por favor ingresá tu apellido");
      return;
    }

    setIsLoading(true);
    sound.playTick();

    try {
      const res = await fetch("/api/players/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: cleanFirst,
          lastName: cleanLast,
          avatar: selectedAvatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo registrar el jugador");
      }

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("trivia_current_player_id", data.player.id);
      }

      sound.playCorrect();
      onRegistered(data.player);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error de conexión";
      setErrorMessage(msg);
      sound.playWrong();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-3.5 py-3 h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between shrink-0">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30">
          <Sparkles className="w-3 h-3 text-pink-400 animate-spin" /> En Vivo
        </span>

        <button
          onClick={handleToggleSound}
          type="button"
          aria-label={isMuted ? "Activar sonido" : "Silenciar"}
          className="p-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Music className="w-4 h-4 text-emerald-400" />}
        </button>
      </header>

      {/* Main Content Area (Strictly Fits in Viewport) */}
      <div className="flex-1 flex flex-col justify-center min-h-0 py-1.5 space-y-2.5 sm:space-y-3">
        {/* Event Header Banner */}
        <div className="text-center shrink-0">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-amber-500/20 border border-white/10 shadow-lg shadow-purple-500/20 mb-1">
            <span className="text-3xl animate-bounce" role="img" aria-label="avatar">
              {selectedAvatar}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-pink-400 via-purple-300 to-amber-300 bg-clip-text text-transparent truncate px-2">
            {eventTitle || "Trivia de Fiesta"}
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            ¿Cuánto conocés a <strong className="text-amber-300">{birthdayPerson || "el anfitrión"}</strong>?
          </p>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 shrink-0">
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              <strong>10s</strong> por pregunta
            </span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span className="truncate">
              <strong>Tiempo</strong> desempata
            </span>
          </div>
        </div>

        {/* Registration Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3.5 shadow-2xl flex flex-col space-y-2.5 shrink-0"
        >
          {/* Avatar Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              Elegí tu Avatar:
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setSelectedAvatar(emoji);
                    sound.playTick();
                  }}
                  className={`text-xl p-1 sm:p-1.5 rounded-xl transition-all duration-150 flex items-center justify-center ${
                    selectedAvatar === emoji
                      ? "bg-purple-600/50 border-2 border-purple-400 shadow-md shadow-purple-500/30 scale-105"
                      : "bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* First Name & Last Name (Side-by-side to save vertical space) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="regFirstName" className="block text-[11px] font-bold text-slate-400 mb-1">
                Nombre
              </label>
              <input
                id="regFirstName"
                type="text"
                required
                placeholder="Ej: Lucía"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-all"
              />
            </div>

            <div>
              <label htmlFor="regLastName" className="block text-[11px] font-bold text-slate-400 mb-1">
                Apellido
              </label>
              <input
                id="regLastName"
                type="text"
                required
                placeholder="Ej: Gómez"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-all"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-medium animate-shake">
              {errorMessage}
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl font-black text-white bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:via-purple-700 hover:to-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base mt-1"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Cargando...
              </span>
            ) : (
              <>
                <span>¡Entrar a la Trivia!</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Instructions */}
      <footer className="text-center shrink-0 pt-1 text-slate-500 text-[11px]">
        Sin login • 10 segundos por pregunta • Ranking en vivo
      </footer>
    </div>
  );
}
