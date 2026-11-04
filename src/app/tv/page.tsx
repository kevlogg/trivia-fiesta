"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LeaderboardEntry, TriviaSettings, TriviaEvent, QuestionAdmin } from "@/types/trivia";
import {
  Trophy,
  Crown,
  Sparkles,
  Users,
  RotateCw,
  QrCode,
  Radio,
  Clock,
  ShieldCheck,
  Eye,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Presentation,
  AlertTriangle,
  X,
  ArrowLeft,
} from "lucide-react";

const OPTION_LETTERS = ["A", "B", "C", "D"];

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

  // Answers Reveal State
  const [viewMode, setViewMode] = useState<"LEADERBOARD" | "REVEAL_ANSWERS">("LEADERBOARD");
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [questions, setQuestions] = useState<QuestionAdmin[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [presentationLayout, setPresentationLayout] = useState<"SLIDES" | "GRID">("SLIDES");

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

  // Load questions for the answers reveal
  const handleConfirmReveal = async () => {
    setShowConfirmModal(false);
    setIsLoadingQuestions(true);
    try {
      const targetId = activeEvent?.id || eventIdParam;
      const url = targetId
        ? `/api/tv/questions?eventId=${encodeURIComponent(targetId)}`
        : "/api/tv/questions";

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        setCurrentSlideIndex(0);
        setViewMode("REVEAL_ANSWERS");
      }
    } catch (err) {
      console.error("Error loading questions for TV reveal:", err);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Keyboard navigation for presentation slides (Left / Right Arrow)
  useEffect(() => {
    if (viewMode !== "REVEAL_ANSWERS") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        setCurrentSlideIndex((prev) => (prev < questions.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Escape") {
        setViewMode("LEADERBOARD");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, questions.length]);

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
  const currentSlide = questions[currentSlideIndex];

  // 2. ANSWERS REVEAL MODE (ON-DEMAND TV PRESENTATION)
  if (viewMode === "REVEAL_ANSWERS" && questions.length > 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10 flex flex-col justify-between select-none relative">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-pink-500 shadow-xl shadow-amber-500/20">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-1">
                ⭐ REVELACIÓN DE RESPUESTAS OFICIALES
              </span>
              <h1 className="text-2xl md:text-4xl font-black text-white">
                {settings.eventTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View layout toggle */}
            <div className="flex items-center rounded-2xl bg-slate-900 border border-slate-800 p-1">
              <button
                type="button"
                onClick={() => setPresentationLayout("SLIDES")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  presentationLayout === "SLIDES"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>Paso a Paso</span>
              </button>
              <button
                type="button"
                onClick={() => setPresentationLayout("GRID")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  presentationLayout === "GRID"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Ver Todas (10)</span>
              </button>
            </div>

            {/* Back to Leaderboard button */}
            <button
              type="button"
              onClick={() => setViewMode("LEADERBOARD")}
              className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-purple-400" />
              <span>Volver al Podio</span>
            </button>
          </div>
        </header>

        {/* Slide By Slide Presentation Mode */}
        {presentationLayout === "SLIDES" && currentSlide && (
          <div className="flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full my-auto space-y-6">
            {/* Question Quick Numbers Pill Bar */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`w-9 h-9 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    currentSlideIndex === idx
                      ? "bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-yellow-500/30 scale-110"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Question Display Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-purple-400">
                  Pregunta #{currentSlideIndex + 1} de {questions.length}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Usá las flechas ⬅ ➡ del teclado para cambiar de diapositiva
                </span>
              </div>

              {/* Big Question Prompt */}
              <h2 className="text-2xl md:text-4xl font-black text-white text-center leading-snug my-4">
                {currentSlide.question}
              </h2>

              {/* 4 Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {currentSlide.options.map((option, optIdx) => {
                  const letter = OPTION_LETTERS[optIdx] || `${optIdx + 1}`;
                  const isCorrect = currentSlide.correctIndex === optIdx;

                  if (isCorrect) {
                    return (
                      <div
                        key={optIdx}
                        className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border-2 border-emerald-400 text-white shadow-2xl shadow-emerald-500/20 flex items-center justify-between gap-3 transform scale-[1.02] transition-all"
                      >
                        <div className="flex items-center gap-3.5">
                          <span className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black text-base flex items-center justify-center shrink-0 shadow-md">
                            {letter}
                          </span>
                          <span className="text-lg md:text-xl font-black text-emerald-200">
                            {option}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400 font-black text-xs shrink-0 animate-bounce">
                          <Crown className="w-3.5 h-3.5 text-yellow-300" /> ¡CORRECTA!
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={optIdx}
                      className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-slate-400 opacity-50 flex items-center gap-3.5"
                    >
                      <span className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 font-bold text-sm flex items-center justify-center shrink-0">
                        {letter}
                      </span>
                      <span className="text-base font-semibold">{option}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Slide Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={currentSlideIndex === 0}
                onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <span className="text-xs font-mono text-slate-400 font-bold">
                {currentSlideIndex + 1} / {questions.length}
              </span>

              <button
                type="button"
                disabled={currentSlideIndex === questions.length - 1}
                onClick={() => setCurrentSlideIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg transition-colors"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Grid Mode: All 10 questions together */}
        {presentationLayout === "GRID" && (
          <div className="flex-1 overflow-y-auto max-w-6xl mx-auto w-full my-4 pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map((q) => {
                const correctOption = q.options[q.correctIndex];
                const correctLetter = OPTION_LETTERS[q.correctIndex] || `${q.correctIndex + 1}`;

                return (
                  <div
                    key={q.id}
                    className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-purple-900/50 text-purple-300 font-black text-xs flex items-center justify-center shrink-0 border border-purple-500/30">
                        #{q.orderNum}
                      </span>
                      <h3 className="text-sm md:text-base font-bold text-white leading-snug">
                        {q.question}
                      </h3>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0">
                          {correctLetter}
                        </span>
                        <span className="font-bold">{correctOption}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        CORRECTA ⭐
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-slate-500 pt-4 border-t border-slate-800">
          Modo Presentación de Respuestas • Trivia de Fiesta en Vivo
        </footer>
      </div>
    );
  }

  // 3. TV ACTIVE EVENT SCREEN: QR Code + Live Leaderboard & Podium
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

        <div className="flex items-center gap-4">
          {/* New "Mostrar Respuestas Correctas" Button */}
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-slate-950 font-black text-xs md:text-sm flex items-center gap-2 shadow-xl shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-950" />
            <span>Mostrar Respuestas Correctas</span>
          </button>

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
            <li>3️⃣ ¡Tenés 15 segundos por pregunta! El tiempo desempata.</li>
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

      {/* Confirmation Modal to avoid errors */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
            </div>

            <h3 className="text-xl font-black text-white">
              ¿Mostrar las Respuestas Correctas en la Pantalla Gigante?
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Esta acción cambiará la pantalla TV a modo presentación y revelará la solución oficial y las anécdotas de las 10 preguntas a todos los invitados del salón.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmReveal}
                disabled={isLoadingQuestions}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoadingQuestions ? "Cargando preguntas..." : "Sí, Revelar Respuestas"}
              </button>
            </div>
          </div>
        </div>
      )}

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
