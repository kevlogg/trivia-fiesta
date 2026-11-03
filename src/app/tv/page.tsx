"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LeaderboardEntry, TriviaSettings, TriviaEvent } from "@/types/trivia";
import { Trophy, Crown, Sparkles, Users, RotateCw, QrCode, Radio, Clock, ShieldCheck } from "lucide-react";

function TvContent() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("eventId") || searchParams.get("e");

  const [hasActiveEvent, setHasActiveEvent] = useState<boolean | null>(null);
  const [activeEvent, setActiveEvent] = useState<TriviaEvent | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [settings, setSettings] = useState<TriviaSettings>({
    birthdayPerson: "el Cumpleañero",
    eventTitle: "🎉 Trivia de Cumpleaños",
    questionTimerSeconds: 10,
  });
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTvData = useCallback(async () => {
    try {
      const qUrl = eventIdParam
        ? `/api/leaderboard?eventId=${encodeURIComponent(eventIdParam)}`
        : "/api/leaderboard";

      const res = await fetch(qUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.hasActiveEvent && data.event) {
          setHasActiveEvent(true);
          setActiveEvent(data.event);
          setLeaderboard(data.leaderboard || []);
          setSettings({
            birthdayPerson: data.event.birthdayPerson,
            eventTitle: data.event.title,
            questionTimerSeconds: data.event.timerSeconds || 10,
          });
        } else {
          setHasActiveEvent(false);
          setActiveEvent(null);
          setLeaderboard([]);
        }
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("TV data fetch error:", err);
    }
  }, [eventIdParam]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.origin);
    }
    fetchTvData();
    pollTimerRef.current = setInterval(fetchTvData, 2500);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchTvData]);

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  const formatSec = (ms: number) => (ms / 1000).toFixed(2);

  // 1. TV WAITING SCREEN: When no event is active
  if (hasActiveEvent === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 flex flex-col justify-between select-none relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-amber-500 shadow-xl shadow-purple-500/20">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-pink-400 via-purple-300 to-amber-300 bg-clip-text text-transparent">
                TRIVIA DE FIESTA
              </h1>
              <p className="text-slate-400 text-xs md:text-sm">Pantalla de Proyección en Vivo</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-xs text-purple-300 font-bold animate-pulse">
            <Radio className="w-4 h-4 text-purple-400" />
            <span>Sistema en Espera</span>
          </div>
        </header>

        {/* Central Display */}
        <main className="flex-1 flex flex-col items-center justify-center text-center my-12 max-w-3xl mx-auto">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-pink-500/20 via-purple-600/20 to-amber-500/20 border border-purple-500/30 flex items-center justify-center shadow-2xl shadow-purple-500/20 mb-6 relative">
            <span className="text-6xl animate-bounce">🎉</span>
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-500"></span>
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
            Preparando la Próxima Fiesta
          </h2>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md space-y-3 mb-6">
            <p className="text-base md:text-lg text-slate-200 font-semibold leading-relaxed">
              Actualmente no hay ninguna trivia de fiesta en curso.
            </p>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              El código QR interactivo para que los invitados jueguen desde sus celulares y el podio de posiciones en tiempo real se mostrarán automáticamente en esta pantalla cuando el organizador active el evento.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Sincronizando automáticamente cada 2.5s</span>
          </div>
        </main>

        {/* Footer */}
        <footer className="flex items-center justify-between text-xs text-slate-500 pt-5 border-t border-slate-800">
          <span>⚡ Antigravity Trivia Engine • Modo Pantalla TV</span>
          <div className="flex items-center gap-4">
            <Link
              href="/superadmin"
              className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 transition-colors font-semibold"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Panel SuperAdmin</span>
            </Link>
            <span className="flex items-center gap-1">
              <RotateCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>{lastUpdated.toLocaleTimeString()}</span>
            </span>
          </div>
        </footer>
      </div>
    );
  }

  // Target QR URL: explicitly encodes the event ID so this QR is 100% unique to this event!
  const qrEventUrl = activeEvent ? `${currentUrl}/?eventId=${activeEvent.id}` : currentUrl;

  // 2. TV ACTIVE EVENT SCREEN: QR Code + Live Leaderboard & Podium
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10 flex flex-col justify-between select-none">
      {/* Top Banner */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-amber-500 shadow-xl shadow-purple-500/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-pink-400 via-purple-300 to-amber-300 bg-clip-text text-transparent">
              {settings.eventTitle}
            </h1>
            <p className="text-slate-400 text-sm md:text-base mt-1">
              ¿Quién conoce mejor a <strong className="text-amber-300">{settings.birthdayPerson}</strong>?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 shadow-inner">
            <Users className="w-5 h-5 text-purple-400" />
            <span className="text-base font-extrabold">{leaderboard.length}</span>
            <span className="text-xs text-slate-400">Participantes</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold text-emerald-400">En Vivo</span>
          </div>
        </div>
      </header>

      {/* Main Grid: QR Left + Podium & Ranking Right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: QR Code & Instructions (4 cols) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-md text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 mb-3">
            <QrCode className="w-4 h-4" /> ¡ESCANEÁ PARA JUGAR!
          </span>

          {/* Dynamic QR Code for this specific event */}
          <div className="p-4 bg-white rounded-3xl shadow-2xl mb-4 border-4 border-purple-500/40 transform hover:scale-105 transition-all">
            {currentUrl && (
              <Image
                src={`/api/qr?url=${encodeURIComponent(qrEventUrl)}`}
                alt="QR Code Trivia"
                width={220}
                height={220}
                className="w-52 h-52 md:w-60 md:h-60"
                unoptimized
              />
            )}
          </div>

          <p className="font-mono text-xs text-purple-300 font-bold bg-purple-950/50 px-3 py-1.5 rounded-xl border border-purple-500/20 mb-3 break-all">
            {qrEventUrl}
          </p>

          <ol className="text-left text-xs text-slate-400 space-y-1.5 font-medium">
            <li>1️⃣ Abrí la cámara de tu celular y apuntá al QR.</li>
            <li>2️⃣ Ingresá tu nombre y apellido (¡sin registro!).</li>
            <li>3️⃣ ¡Tenés 10 segundos por pregunta! El tiempo desempata.</li>
          </ol>
        </div>

        {/* Right Column: Giant Podium & Leaderboard (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between h-full space-y-6">
          {/* Top 3 Podium */}
          {leaderboard.length > 0 ? (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <h2 className="text-lg font-black tracking-wider uppercase text-yellow-300">
                  Podio de la Fiesta
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-4 items-end pt-8 pb-2">
                {/* 2nd Place */}
                {top2 ? (
                  <div className="flex flex-col items-center">
                    <span className="text-5xl mb-2">{top2.avatar}</span>
                    <span className="text-base font-extrabold text-slate-200 truncate max-w-full">
                      {top2.firstName} {top2.lastName}
                    </span>
                    <span className="text-sm font-black text-emerald-400">{top2.score} pts</span>
                    <span className="text-xs font-mono text-amber-300 font-bold">{formatSec(top2.totalTimeMs)}s</span>
                    <div className="w-full h-28 bg-gradient-to-t from-slate-700 to-slate-500 rounded-t-2xl flex flex-col items-center justify-center shadow-xl border-t-4 border-slate-300 mt-3">
                      <span className="text-4xl font-black text-slate-900">2</span>
                      <span className="text-xs uppercase font-extrabold text-slate-200">Plata</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center opacity-30">
                    <div className="w-full h-28 border-2 border-dashed border-slate-700 rounded-t-2xl flex items-center justify-center text-xs text-slate-500">
                      Esperando #2
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {top1 ? (
                  <div className="flex flex-col items-center">
                    <Crown className="w-10 h-10 text-yellow-400 animate-bounce mb-1" />
                    <span className="text-6xl mb-2">{top1.avatar}</span>
                    <span className="text-lg font-black text-yellow-300 truncate max-w-full">
                      {top1.firstName} {top1.lastName}
                    </span>
                    <span className="text-base font-black text-emerald-300">{top1.score} pts</span>
                    <span className="text-xs font-mono text-amber-300 font-black">{formatSec(top1.totalTimeMs)}s</span>
                    <div className="w-full h-40 bg-gradient-to-t from-amber-600 via-yellow-500 to-yellow-300 rounded-t-2xl flex flex-col items-center justify-center shadow-2xl border-t-4 border-white mt-3">
                      <span className="text-5xl font-black text-amber-950">1</span>
                      <span className="text-sm uppercase font-black text-amber-950">¡Líder de Oro!</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center opacity-30">
                    <div className="w-full h-40 border-2 border-dashed border-slate-700 rounded-t-2xl flex items-center justify-center text-xs text-slate-500">
                      Esperando #1
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {top3 ? (
                  <div className="flex flex-col items-center">
                    <span className="text-5xl mb-2">{top3.avatar}</span>
                    <span className="text-base font-extrabold text-slate-200 truncate max-w-full">
                      {top3.firstName} {top3.lastName}
                    </span>
                    <span className="text-sm font-black text-emerald-400">{top3.score} pts</span>
                    <span className="text-xs font-mono text-amber-300 font-bold">{formatSec(top3.totalTimeMs)}s</span>
                    <div className="w-full h-24 bg-gradient-to-t from-amber-800 to-amber-600 rounded-t-2xl flex flex-col items-center justify-center shadow-xl border-t-4 border-amber-400 mt-3">
                      <span className="text-4xl font-black text-amber-950">3</span>
                      <span className="text-xs uppercase font-extrabold text-amber-200">Bronce</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center opacity-30">
                    <div className="w-full h-24 border-2 border-dashed border-slate-700 rounded-t-2xl flex items-center justify-center text-xs text-slate-500">
                      Esperando #3
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-3xl">
              <span className="text-5xl block mb-3 animate-pulse">🎯</span>
              <h3 className="text-xl font-bold text-slate-300">¡Todavía no hay jugadores registrados!</h3>
              <p className="text-slate-500 text-sm mt-1">Escaneá el código QR en pantalla para ser el primero en inaugurar el podio.</p>
            </div>
          )}

          {/* Rest of Leaderboard (Positions 4+) */}
          {leaderboard.length > 3 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Resto de la tabla de posiciones:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {leaderboard.slice(3).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-[10px]">
                        #{entry.rank}
                      </span>
                      <span className="text-lg">{entry.avatar}</span>
                      <span className="font-bold text-slate-200 truncate">
                        {entry.firstName} {entry.lastName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-emerald-400 mr-2">{entry.score} pts</span>
                      <span className="font-mono text-amber-300 text-[11px] font-bold">{formatSec(entry.totalTimeMs)}s</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <footer className="flex items-center justify-between text-xs text-slate-500 pt-6 border-t border-slate-800 mt-6">
        <span>⚡ Sistema de Desempate Automático: Mayor puntaje ➔ Menor tiempo total acumulado (exactitud en milisegundos)</span>
        <span className="flex items-center gap-1">
          <RotateCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
          Actualizado {lastUpdated.toLocaleTimeString()}
        </span>
      </footer>
    </div>
  );
}

export default function TvScreenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
          Cargando pantalla de TV...
        </div>
      }
    >
      <TvContent />
    </Suspense>
  );
}
