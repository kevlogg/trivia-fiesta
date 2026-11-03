"use client";

import { useState } from "react";
import { Sparkles, Trophy, Clock, ArrowRight, Music, VolumeX } from "lucide-react";
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

      // Save to localStorage for convenience
      localStorage.setItem("trivia_current_player_id", data.player.id);

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
    <div className="w-full max-w-md mx-auto px-4 py-6 flex flex-col min-h-screen justify-between">
      {/* Top Header & Sound Toggle */}
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/30 backdrop-blur-sm animate-pulse">
          <Sparkles className="w-3.5 h-3.5" /> En Vivo
        </span>

        <button
          onClick={handleToggleSound}
          type="button"
          aria-label={isMuted ? "Activar sonido" : "Silenciar sonido"}
          className="p-2 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Music className="w-4 h-4 text-emerald-400" />}
        </button>
      </div>

      {/* Main Card */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-6">
          <div className="inline-block p-3 rounded-2xl bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-amber-500/20 border border-white/10 shadow-lg shadow-purple-500/10 mb-3">
            <span className="text-5xl block animate-bounce" role="img" aria-label="party">
              {selectedAvatar}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-400 via-purple-300 to-amber-300 bg-clip-text text-transparent">
            {eventTitle || "Trivia de Fiesta"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            ¿Cuánto sabés realmente sobre <span className="font-semibold text-slate-200">{birthdayPerson}</span>?
          </p>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-2 gap-2 mb-6 text-xs text-slate-300">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>10 Segundos</strong> por pregunta
            </span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
            <span>
              <strong>Podio al Instante</strong> con desempate
            </span>
          </div>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/80 backdrop-blur-md border border-slate-800/90 rounded-2xl p-5 shadow-2xl space-y-4"
        >
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Elegí tu Avatar Festivo
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setSelectedAvatar(emoji);
                    sound.playTick();
                  }}
                  className={`text-2xl p-2 rounded-xl transition-all duration-150 transform hover:scale-110 flex items-center justify-center ${
                    selectedAvatar === emoji
                      ? "bg-purple-600/40 border-2 border-purple-400 shadow-md shadow-purple-500/30 scale-105"
                      : "bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* First Name Input */}
          <div>
            <label htmlFor="firstName" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tu Nombre
            </label>
            <input
              id="firstName"
              type="text"
              autoFocus
              required
              placeholder="Ej: Lucía"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base transition-all"
            />
          </div>

          {/* Last Name Input */}
          <div>
            <label htmlFor="lastName" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tu Apellido
            </label>
            <input
              id="lastName"
              type="text"
              required
              placeholder="Ej: Gómez"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base transition-all"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium animate-shake">
              {errorMessage}
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:via-purple-700 hover:to-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed text-base mt-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Cargando trivia...
              </span>
            ) : (
              <>
                <span>¡Entrar a la Trivia!</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Instructions */}
      <footer className="text-center pt-4 text-slate-500 text-xs">
        Sin contraseñas ni registros • 100% en tiempo real
      </footer>
    </div>
  );
}
