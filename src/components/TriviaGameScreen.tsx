"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { QuestionClient, Player, SubmitAnswerResponse } from "@/types/trivia";
import { sound } from "@/lib/sound";
import { fireMiniConfetti } from "@/lib/confetti";
import { CheckCircle2, XCircle, Clock, VolumeX, Music, Zap, ArrowRight } from "lucide-react";

interface TriviaGameScreenProps {
  player: Player;
  questions: QuestionClient[];
  onGameFinished: () => void;
  onPlayerScoreUpdate?: (newScore: number, totalTimeMs: number) => void;
}

const TOTAL_QUESTION_TIME_SEC = 10;
const OPTION_LETTERS = ["A", "B", "C", "D"];

export default function TriviaGameScreen({
  player,
  questions,
  onGameFinished,
  onPlayerScoreUpdate,
}: TriviaGameScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState<number>(TOTAL_QUESTION_TIME_SEC);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<SubmitAnswerResponse | null>(null);
  const [elapsedTimeDisplay, setElapsedTimeDisplay] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentScore, setCurrentScore] = useState<number>(player.score || 0);
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  const currentQuestion = questions[currentIndex];
  const startTimeRef = useRef<number>(0);
  const timerFrameRef = useRef<number | null>(null);
  const autoNextTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickSecondRef = useRef<number>(10);

  const handleToggleSound = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  // Main selection handler
  const handleSelectOption = useCallback(
    async (optionIndex: number | null, forcedTimeMs?: number) => {
      if (isAnswerSubmitted || isSubmitting) return;

      // Immediately freeze timer
      if (timerFrameRef.current) {
        cancelAnimationFrame(timerFrameRef.current);
        timerFrameRef.current = null;
      }

      setIsAnswerSubmitted(true);
      setIsSubmitting(true);
      setSelectedOption(optionIndex);

      // Measure exact time
      const now = performance.now();
      const elapsedRaw = forcedTimeMs !== undefined ? forcedTimeMs : now - startTimeRef.current;
      const elapsedMs = Math.max(0, Math.min(TOTAL_QUESTION_TIME_SEC * 1000, Math.round(elapsedRaw)));
      setElapsedTimeDisplay(elapsedMs);

      try {
        const res = await fetch("/api/answers/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: player.id,
            questionId: currentQuestion.id,
            selectedIndex: optionIndex,
            timeSpentMs: elapsedMs,
          }),
        });

        const data: SubmitAnswerResponse = await res.json();
        setLastResult(data);

        if (data.isCorrect) {
          sound.playCorrect();
          fireMiniConfetti();
          setCurrentScore((prev) => prev + 1);
        } else if (optionIndex === null) {
          sound.playTimeout();
        } else {
          sound.playWrong();
        }

        if (onPlayerScoreUpdate) {
          onPlayerScoreUpdate(data.currentScore, data.totalTimeMs);
        }

        // Auto advance after 1.4 seconds
        autoNextTimeoutRef.current = setTimeout(() => {
          advanceToNext(data.isFinished);
        }, 1400);
      } catch (err) {
        console.error("Error submitting answer:", err);
        // Fallback advance
        autoNextTimeoutRef.current = setTimeout(() => {
          advanceToNext(currentIndex + 1 >= questions.length);
        }, 1400);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isAnswerSubmitted, isSubmitting, player.id, currentQuestion, currentIndex, questions.length, onPlayerScoreUpdate]
  );

  // Advance question or finish
  const advanceToNext = useCallback(
    (isFinishedOverride?: boolean) => {
      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
        autoNextTimeoutRef.current = null;
      }

      const willFinish = isFinishedOverride !== undefined ? isFinishedOverride : currentIndex + 1 >= questions.length;

      if (willFinish) {
        onGameFinished();
      } else {
        setSelectedOption(null);
        setIsAnswerSubmitted(false);
        setLastResult(null);
        setElapsedTimeDisplay(null);
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [currentIndex, questions.length, onGameFinished]
  );

  // Initialize and run high-resolution timer for each question
  useEffect(() => {
    setIsAnswerSubmitted(false);
    setSelectedOption(null);
    setLastResult(null);
    setElapsedTimeDisplay(null);
    setRemainingTime(TOTAL_QUESTION_TIME_SEC);
    lastTickSecondRef.current = TOTAL_QUESTION_TIME_SEC;

    startTimeRef.current = performance.now();

    const tick = () => {
      const now = performance.now();
      const elapsedSec = (now - startTimeRef.current) / 1000;
      const left = Math.max(0, TOTAL_QUESTION_TIME_SEC - elapsedSec);
      setRemainingTime(left);

      // Sound ticks
      const currentCeilSec = Math.ceil(left);
      if (currentCeilSec < lastTickSecondRef.current && currentCeilSec > 0) {
        lastTickSecondRef.current = currentCeilSec;
        if (currentCeilSec <= 3) {
          sound.playUrgentTick();
        } else {
          sound.playTick();
        }
      }

      if (left <= 0) {
        // Strict 10-second timeout
        handleSelectOption(null, TOTAL_QUESTION_TIME_SEC * 1000);
      } else {
        timerFrameRef.current = requestAnimationFrame(tick);
      }
    };

    timerFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerFrameRef.current) {
        cancelAnimationFrame(timerFrameRef.current);
      }
      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
      }
    };
  }, [currentIndex, handleSelectOption]);

  // Color dynamics for timer
  const timerPercentage = Math.max(0, Math.min(100, (remainingTime / TOTAL_QUESTION_TIME_SEC) * 100));
  const isUrgent = remainingTime <= 3.0;
  const isWarning = remainingTime <= 5.0 && !isUrgent;

  const timerColorClass = isUrgent
    ? "text-rose-400 bg-rose-500/20 border-rose-500 animate-pulse"
    : isWarning
    ? "text-amber-400 bg-amber-500/10 border-amber-500"
    : "text-emerald-400 bg-emerald-500/10 border-emerald-500";

  const barColorClass = isUrgent
    ? "bg-gradient-to-r from-rose-500 to-red-600 shadow-lg shadow-rose-500/50"
    : isWarning
    ? "bg-gradient-to-r from-amber-400 to-orange-500"
    : "bg-gradient-to-r from-emerald-400 to-teal-500";

  return (
    <div className="w-full max-w-md mx-auto px-4 py-5 flex flex-col min-h-screen justify-between">
      {/* Top Bar: Progress, Score & Sound */}
      <div>
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-xl">{player.avatar}</span>
            <span className="font-bold text-slate-200 truncate max-w-[120px]">
              {player.firstName} {player.lastName[0]}.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Score Pill */}
            <div className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 font-extrabold flex items-center gap-1 shadow-sm">
              <span>⭐</span>
              <span>{currentScore} pts</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              type="button"
              className="p-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
              aria-label={isMuted ? "Activar sonido" : "Silenciar"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Music className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Progress Bar of Questions */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-semibold">
          <span>Pregunta {currentIndex + 1} de {questions.length}</span>
          <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 rounded-full"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Strict 10s Timer Banner */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Clock className={`w-4 h-4 ${isUrgent ? "text-rose-400 animate-spin" : "text-amber-400"}`} />
              <span>Tiempo Restante:</span>
            </div>

            {/* Number with 1 decimal */}
            <div
              className={`px-3 py-0.5 rounded-lg border font-mono font-black text-sm tracking-wider transition-all ${timerColorClass}`}
            >
              {remainingTime.toFixed(1)}s
            </div>
          </div>

          {/* Smooth dynamic bar */}
          <div className="w-full h-2.5 bg-slate-800/90 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-75 ${barColorClass}`}
              style={{ width: `${timerPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 flex flex-col justify-center my-2">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          {/* Subtle party neon glow at the top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500" />

          <h2 className="text-xl font-bold text-white leading-snug mb-5 pt-2 text-center">
            {currentQuestion.question}
          </h2>

          {/* Options Grid */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const letter = OPTION_LETTERS[idx] || `${idx + 1}`;
              const isSelected = selectedOption === idx;
              const hasResult = lastResult !== null;
              const isThisCorrect = hasResult && lastResult.correctIndex === idx;
              const isThisWrongSelected = hasResult && isSelected && !lastResult.isCorrect;

              let btnStyle = "bg-slate-800/70 border-slate-700/80 text-slate-100 hover:bg-slate-800 hover:border-purple-500/50 active:scale-[0.98]";

              if (hasResult) {
                if (isThisCorrect) {
                  btnStyle = "bg-emerald-500/20 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/50 scale-[1.02] shadow-lg shadow-emerald-500/20";
                } else if (isThisWrongSelected) {
                  btnStyle = "bg-rose-500/20 border-rose-500 text-rose-200 ring-2 ring-rose-500/40 animate-shake";
                } else {
                  btnStyle = "bg-slate-800/30 border-slate-800/40 text-slate-500 opacity-60";
                }
              } else if (isSelected) {
                btnStyle = "bg-purple-600/30 border-purple-400 text-white scale-[1.01]";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswerSubmitted}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-center gap-3.5 cursor-pointer disabled:cursor-default ${btnStyle}`}
                >
                  <span
                    className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 transition-colors ${
                      hasResult && isThisCorrect
                        ? "bg-emerald-500 text-slate-950 font-black"
                        : hasResult && isThisWrongSelected
                        ? "bg-rose-500 text-white"
                        : "bg-slate-700/80 text-slate-300"
                    }`}
                  >
                    {letter}
                  </span>

                  <span className="text-sm font-semibold flex-1 leading-snug">
                    {option}
                  </span>

                  {hasResult && isThisCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
                  )}
                  {hasResult && isThisWrongSelected && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Instant Feedback Card with Milliseconds */}
          {lastResult && (
            <div className="mt-4 pt-3 border-t border-slate-800 animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {lastResult.isCorrect ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      🎯 ¡CORRECTO!
                    </span>
                  ) : selectedOption === null ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      ⏱️ TIEMPO AGOTADO
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      ❌ ¡CASI!
                    </span>
                  )}
                </div>

                {elapsedTimeDisplay !== null && (
                  <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
                    <Zap className="w-3 h-3 text-amber-400" />
                    {(elapsedTimeDisplay / 1000).toFixed(2)}s
                  </span>
                )}
              </div>

              {lastResult.explanation && (
                <p className="text-xs text-slate-300 italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  {lastResult.explanation}
                </p>
              )}

              {/* Fast Forward Button */}
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => advanceToNext(lastResult.isFinished)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="text-center text-slate-500 text-xs py-1">
        ⚡ La velocidad desempata en el ranking final
      </div>
    </div>
  );
}

