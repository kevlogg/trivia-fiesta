"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import RegistrationScreen from "@/components/RegistrationScreen";
import TriviaGameScreen from "@/components/TriviaGameScreen";
import ResultsLeaderboardScreen from "@/components/ResultsLeaderboardScreen";
import { Player, QuestionClient, TriviaSettings, TriviaEvent } from "@/types/trivia";
import { Sparkles, Radio, PartyPopper, RefreshCw } from "lucide-react";

type GamePhase = "LOADING" | "NO_EVENT" | "REGISTRATION" | "PLAYING" | "RESULTS";

function HomeContent() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("eventId") || searchParams.get("e");

  const [phase, setPhase] = useState<GamePhase>("LOADING");
  const [activeEvent, setActiveEvent] = useState<TriviaEvent | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [questions, setQuestions] = useState<QuestionClient[]>([]);
  const [initialQuestionIndex, setInitialQuestionIndex] = useState<number>(0);
  const [settings, setSettings] = useState<TriviaSettings>({
    birthdayPerson: "el Cumpleañero",
    eventTitle: "🎉 Trivia de Cumpleaños",
    questionTimerSeconds: 10,
  });

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load event, questions, settings, and player session
  const initApp = useCallback(async () => {
    try {
      const qUrl = eventIdParam
        ? `/api/questions?eventId=${encodeURIComponent(eventIdParam)}`
        : "/api/questions";

      const res = await fetch(qUrl);
      if (!res.ok) {
        throw new Error("No se pudieron cargar las preguntas");
      }
      const data = await res.json();

      // Check if event exists and is active
      if (!data.hasActiveEvent || !data.event) {
        setPhase("NO_EVENT");
        setActiveEvent(null);
        return;
      }

      const currentEvent: TriviaEvent = data.event;
      setActiveEvent(currentEvent);

      // If the event itself is inactive
      if (currentEvent.status === "inactive") {
        setPhase("NO_EVENT");
        return;
      }

      const qList: QuestionClient[] = data.questions || [];
      setQuestions(qList);
      setSettings({
        birthdayPerson: currentEvent.birthdayPerson,
        eventTitle: currentEvent.title,
        questionTimerSeconds: currentEvent.timerSeconds || 10,
      });

      // Check if player has an existing session in localStorage
      const savedPlayerId =
        typeof window !== "undefined"
          ? localStorage.getItem("trivia_current_player_id")
          : null;

      if (savedPlayerId) {
        try {
          const playerRes = await fetch(`/api/players/${savedPlayerId}`);
          if (playerRes.ok) {
            const playerData = await playerRes.json();
            const p: Player = playerData.player;

            // Check that the player belongs to this exact event
            if (p && p.eventId === currentEvent.id) {
              setPlayer(p);
              const answers: { questionId: number }[] = playerData.answers || [];

              // If player finished or answered all questions -> RESULTS
              if (p.isFinished || (qList.length > 0 && answers.length >= qList.length)) {
                setPhase("RESULTS");
                return;
              }

              // Find index of first unanswered question
              const answeredIds = new Set(answers.map((a) => a.questionId));
              const nextIdx = qList.findIndex((q) => !answeredIds.has(q.id));

              if (nextIdx === -1) {
                setPhase("RESULTS");
                return;
              }

              setInitialQuestionIndex(nextIdx);
              setPhase("PLAYING");
              return;
            } else {
              // Player was registered for an older event: reset stored id
              if (typeof window !== "undefined") {
                localStorage.removeItem("trivia_current_player_id");
              }
            }
          }
        } catch (playerErr) {
          console.error("Error restoring player session:", playerErr);
        }
      }

      setPhase("REGISTRATION");
    } catch (err) {
      console.error("Initialization error:", err);
      setPhase("NO_EVENT");
    }
  }, [eventIdParam]);

  useEffect(() => {
    initApp();
  }, [initApp]);

  // Polling when in NO_EVENT mode: auto-detects when event is activated
  useEffect(() => {
    if (phase === "NO_EVENT") {
      pollTimerRef.current = setInterval(async () => {
        try {
          const checkUrl = eventIdParam
            ? `/api/questions?eventId=${encodeURIComponent(eventIdParam)}`
            : "/api/active-event";

          const res = await fetch(checkUrl);
          if (res.ok) {
            const data = await res.json();
            if (data.hasActiveEvent && (data.event || data.activeEvent)) {
              const evt = data.event || data.activeEvent;
              if (evt.status === "active") {
                initApp();
              }
            }
          }
        } catch {
          // ignore network hiccups
        }
      }, 2500);

      return () => {
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
      };
    }
  }, [phase, eventIdParam, initApp]);

  // When player completes registration
  const handleRegistered = (newPlayer: Player) => {
    setPlayer(newPlayer);
    setInitialQuestionIndex(0);
    setPhase("PLAYING");
  };

  // When player finishes question 10
  const handleGameFinished = () => {
    setPhase("RESULTS");
  };

  // When player updates score
  const handlePlayerScoreUpdate = (newScore: number, totalTimeMs: number) => {
    setPlayer((prev) => (prev ? { ...prev, score: newScore, totalTimeMs } : null));
  };

  // Reset to registration for a new player
  const handlePlayAgain = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("trivia_current_player_id");
    }
    setPlayer(null);
    setInitialQuestionIndex(0);
    setPhase("REGISTRATION");
  };

  if (phase === "LOADING") {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-500/20 mb-4 animate-pulse">
          <Sparkles className="w-8 h-8 text-white animate-spin" />
        </div>
        <h2 className="text-xl font-black text-white">Preparando la Fiesta...</h2>
        <p className="text-slate-400 text-xs mt-1">Conectando con la trivia en vivo</p>
      </div>
    );
  }

  // WAITING SCREEN: When no event is currently active or event is paused
  if (phase === "NO_EVENT") {
    return (
      <div className="h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between p-4 max-w-md mx-auto text-center select-none">
        {/* Top Header */}
        <header className="flex items-center justify-center shrink-0 pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" /> En Espera
          </span>
        </header>

        {/* Center Card */}
        <div className="flex-1 flex flex-col justify-center items-center my-auto px-2">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-amber-500/20 border border-purple-500/30 flex items-center justify-center shadow-2xl mb-4 relative">
            <span className="text-4xl animate-bounce">🎈</span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
            </span>
          </div>

          <h1 className="text-2xl font-black bg-gradient-to-r from-pink-400 via-purple-300 to-amber-300 bg-clip-text text-transparent mb-2">
            {activeEvent ? activeEvent.title : "¡Todo Listo para la Fiesta!"}
          </h1>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-2 mb-3">
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              {activeEvent
                ? `La trivia de ${activeEvent.birthdayPerson} todavía no ha comenzado.`
                : "Actualmente no hay ninguna trivia en curso."}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mantené esta pantalla abierta en tu celular. En cuanto el anfitrión dé inicio al juego desde la pantalla central, la trivia comenzará automáticamente acá sin necesidad de recargar.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-[11px] font-semibold text-purple-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Sincronizando en tiempo real...</span>
          </div>
        </div>

        {/* Bottom Refresh Option */}
        <footer className="shrink-0 pb-2">
          <button
            onClick={() => initApp()}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Comprobar manualmente</span>
          </button>
        </footer>
      </div>
    );
  }

  if (phase === "REGISTRATION") {
    return (
      <RegistrationScreen
        eventTitle={settings.eventTitle}
        birthdayPerson={settings.birthdayPerson}
        eventId={activeEvent?.id}
        onRegistered={handleRegistered}
      />
    );
  }

  if (phase === "PLAYING" && player && questions.length > 0) {
    return (
      <TriviaGameScreen
        player={player}
        questions={questions}
        initialQuestionIndex={initialQuestionIndex}
        onGameFinished={handleGameFinished}
        onPlayerScoreUpdate={handlePlayerScoreUpdate}
      />
    );
  }

  if (phase === "RESULTS" && player) {
    return (
      <ResultsLeaderboardScreen
        player={player}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return null;
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="h-[100dvh] flex items-center justify-center text-slate-400 text-sm">
          Cargando trivia...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
