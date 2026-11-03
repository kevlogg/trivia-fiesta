"use client";

import { useEffect, useState, useCallback } from "react";
import RegistrationScreen from "@/components/RegistrationScreen";
import TriviaGameScreen from "@/components/TriviaGameScreen";
import ResultsLeaderboardScreen from "@/components/ResultsLeaderboardScreen";
import { Player, QuestionClient, TriviaSettings } from "@/types/trivia";
import { Sparkles } from "lucide-react";

type GamePhase = "LOADING" | "REGISTRATION" | "PLAYING" | "RESULTS";

export default function HomePage() {
  const [phase, setPhase] = useState<GamePhase>("LOADING");
  const [player, setPlayer] = useState<Player | null>(null);
  const [questions, setQuestions] = useState<QuestionClient[]>([]);
  const [initialQuestionIndex, setInitialQuestionIndex] = useState<number>(0);
  const [settings, setSettings] = useState<TriviaSettings>({
    birthdayPerson: "el Cumpleañero",
    eventTitle: "🎉 Trivia de Cumpleaños",
    questionTimerSeconds: 10,
  });

  // Load initial questions, settings and check existing session
  const initApp = useCallback(async () => {
    try {
      const res = await fetch("/api/questions");
      if (!res.ok) {
        throw new Error("No se pudieron cargar las preguntas");
      }
      const data = await res.json();
      const qList: QuestionClient[] = data.questions || [];
      setQuestions(qList);
      if (data.settings) {
        setSettings(data.settings);
      }

      // Check if player has an existing session in localStorage
      const savedPlayerId =
        typeof window !== "undefined"
          ? localStorage.getItem("trivia_current_player_id")
          : null;

      if (savedPlayerId) {
        const playerRes = await fetch(`/api/players/${savedPlayerId}`);
        if (playerRes.ok) {
          const playerData = await playerRes.json();
          if (playerData.player) {
            setPlayer(playerData.player);
            const answers: { questionId: number }[] = playerData.answers || [];

            // If player finished or answered all questions -> jump directly to RESULTS
            if (playerData.player.isFinished || answers.length >= qList.length) {
              setPhase("RESULTS");
              return;
            }

            // Find the index of the first question not yet answered
            const answeredIds = new Set(answers.map((a) => a.questionId));
            const nextIdx = qList.findIndex((q) => !answeredIds.has(q.id));

            if (nextIdx === -1) {
              setPhase("RESULTS");
              return;
            }

            setInitialQuestionIndex(nextIdx);
            setPhase("PLAYING");
            return;
          }
        }
      }

      setPhase("REGISTRATION");
    } catch (err) {
      console.error("Initialization error:", err);
      setPhase("REGISTRATION");
    }
  }, []);

  useEffect(() => {
    initApp();
  }, [initApp]);

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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-500/20 mb-4 animate-pulse">
          <Sparkles className="w-8 h-8 text-white animate-spin" />
        </div>
        <h2 className="text-xl font-black text-white">Preparando la Fiesta...</h2>
        <p className="text-slate-400 text-xs mt-1">Cargando preguntas y ranking</p>
      </div>
    );
  }

  if (phase === "REGISTRATION") {
    return (
      <RegistrationScreen
        eventTitle={settings.eventTitle}
        birthdayPerson={settings.birthdayPerson}
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
