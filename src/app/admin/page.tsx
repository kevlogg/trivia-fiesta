"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { TriviaSettings, QuestionAdmin, TriviaEvent } from "@/types/trivia";
import {
  Settings,
  Tv,
  Smartphone,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  HelpCircle,
  Edit3,
  X,
  Check,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  QrCode,
  Download,
  Copy,
} from "lucide-react";

const OPTION_LETTERS = ["A", "B", "C", "D"];

function AdminContent() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("eventId");

  const [hasEvent, setHasEvent] = useState<boolean | null>(null);
  const [currentEvent, setCurrentEvent] = useState<TriviaEvent | null>(null);
  const [settings, setSettings] = useState<TriviaSettings>({
    birthdayPerson: "",
    eventTitle: "",
    questionTimerSeconds: 10,
  });
  const [questions, setQuestions] = useState<QuestionAdmin[]>([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState(false);
  const [isResettingGame, setIsResettingGame] = useState(false);
  const [showConfirmResetGame, setShowConfirmResetGame] = useState(false);
  const [showConfirmResetQuestions, setShowConfirmResetQuestions] = useState(false);
  const [isResettingQuestions, setIsResettingQuestions] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Question editing state
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>({
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
  });
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [questionSuccessMessage, setQuestionSuccessMessage] = useState("");
  const [questionErrorMessage, setQuestionErrorMessage] = useState("");

  const fetchAdminData = useCallback(async () => {
    try {
      const qUrl = eventIdParam ? `/api/admin/questions?eventId=${eventIdParam}` : "/api/admin/questions";
      const sUrl = eventIdParam ? `/api/settings?eventId=${eventIdParam}` : "/api/settings";

      const [settingsRes, questionsRes] = await Promise.all([
        fetch(sUrl),
        fetch(qUrl),
      ]);

      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        if (sData.hasActiveEvent && sData.event) {
          setHasEvent(true);
          setCurrentEvent(sData.event);
          setSettings(sData.settings);
        } else {
          setHasEvent(false);
        }
      }

      if (questionsRes.ok) {
        const qData = await questionsRes.json();
        setQuestions(qData.questions || []);
      }
    } catch (err) {
      console.error("Admin data fetch error:", err);
      setHasEvent(false);
    }
  }, [eventIdParam]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
    fetchAdminData();
  }, [fetchAdminData]);

  // Start editing a question
  const handleStartEdit = (q: QuestionAdmin) => {
    setEditingQuestionId(q.id);
    setEditDraft({
      question: q.question,
      options: [...q.options],
      correctIndex: q.correctIndex,
      explanation: q.explanation || "",
    });
    setQuestionSuccessMessage("");
    setQuestionErrorMessage("");
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setQuestionErrorMessage("");
  };

  // Save edited question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQuestionId === null) return;

    if (!editDraft.question.trim()) {
      setQuestionErrorMessage("El enunciado de la pregunta no puede estar vacío");
      return;
    }

    if (editDraft.options.some((o) => !o.trim())) {
      setQuestionErrorMessage("Todas las 4 opciones de respuesta deben tener texto");
      return;
    }

    setIsSavingQuestion(true);
    setQuestionErrorMessage("");
    setQuestionSuccessMessage("");

    try {
      const res = await fetch("/api/admin/questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingQuestionId,
          question: editDraft.question,
          options: editDraft.options,
          correctIndex: editDraft.correctIndex,
          explanation: editDraft.explanation,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al guardar pregunta");
      }

      // Update question in state
      setQuestions((prev) =>
        prev.map((q) => (q.id === editingQuestionId ? data.question : q))
      );
      setEditingQuestionId(null);
      setQuestionSuccessMessage(`¡Pregunta #${data.question.orderNum} actualizada con éxito!`);
      setTimeout(() => setQuestionSuccessMessage(""), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      setQuestionErrorMessage(msg);
    } finally {
      setIsSavingQuestion(false);
    }
  };

  // Save settings (event title, birthday person)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSavedSettingsSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          eventId: currentEvent?.id || eventIdParam,
        }),
      });

      if (res.ok) {
        setSavedSettingsSuccess(true);
        setTimeout(() => setSavedSettingsSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Reset all player scores
  const handleResetGame = async () => {
    setIsResettingGame(true);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirm: true,
          eventId: currentEvent?.id || eventIdParam,
        }),
      });

      if (res.ok) {
        setShowConfirmResetGame(false);
        alert("¡Todas las partidas y respuestas de este evento fueron reiniciadas con éxito!");
      }
    } catch (err) {
      console.error("Error resetting game:", err);
    } finally {
      setIsResettingGame(false);
    }
  };

  // Reset questions to defaults
  const handleResetQuestions = async () => {
    setIsResettingQuestions(true);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_default",
          eventId: currentEvent?.id || eventIdParam,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setQuestions(data.questions);
        setShowConfirmResetQuestions(false);
        setEditingQuestionId(null);
        setQuestionSuccessMessage("Preguntas restablecidas a la plantilla predeterminada");
        setTimeout(() => setQuestionSuccessMessage(""), 4000);
      }
    } catch (err) {
      console.error("Error resetting questions:", err);
    } finally {
      setIsResettingQuestions(false);
    }
  };

  // If no active event exists
  if (hasEvent === false) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4 text-3xl">
          🎪
        </div>
        <h1 className="text-2xl font-black text-white mb-2">No Hay Ningún Evento Activo</h1>
        <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
          Para editar preguntas o gestionar una trivia, debe haber un evento activo o tenés que abrir el enlace con el ID de tu evento.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/superadmin"
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ir al Panel SuperAdmin</span>
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
              <Settings className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              Panel del Organizador
            </span>
            {currentEvent && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                ● {currentEvent.title}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Configuración y Preguntas de la Fiesta
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Personalizá los nombres, preguntas y respuestas sobre el cumpleañero antes del juego.
          </p>
        </div>

        {/* Quick Nav Links */}
        <div className="flex items-center gap-2">
          <Link
            href="/tv"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Tv className="w-4 h-4 text-purple-400" />
            <span>Ver Pantalla TV</span>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Smartphone className="w-4 h-4 text-pink-400" />
            <span>Celular</span>
          </Link>
          <Link
            href="/superadmin"
            className="px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-500/40 hover:bg-purple-900/60 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>SuperAdmin</span>
          </Link>
        </div>
      </header>

      {/* Global Event Settings Form */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl mb-8">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span>Datos Generales del Evento</span>
        </h2>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nombre del Cumpleañero / Homenajeado
              </label>
              <input
                type="text"
                required
                value={settings.birthdayPerson}
                onChange={(e) =>
                  setSettings({ ...settings, birthdayPerson: e.target.value })
                }
                placeholder="Ej: Marcos, Sofía, Lucas..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Título del Evento
              </label>
              <input
                type="text"
                required
                value={settings.eventTitle}
                onChange={(e) =>
                  setSettings({ ...settings, eventTitle: e.target.value })
                }
                placeholder="Ej: 🎉 Cumpleaños de Marcos - 30 Años"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              ⚡ Temporizador: <strong>10 segundos</strong> estrictos por pregunta
            </span>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-[0.98] transition-all text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? "Guardando..." : "Guardar Nombres"}</span>
            </button>
          </div>

          {savedSettingsSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-bold animate-fadeIn">
              ✓ ¡Datos del evento actualizados con éxito!
            </div>
          )}
        </form>
      </div>

      {/* Unique Event QR Code Card */}
      {currentEvent && baseUrl && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0 border-4 border-purple-500/30">
              <Image
                src={`/api/qr?url=${encodeURIComponent(`${baseUrl}/?eventId=${currentEvent.id}`)}`}
                alt="QR Evento"
                width={140}
                height={140}
                className="w-32 h-32"
                unoptimized
              />
            </div>

            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-1">
                  <QrCode className="w-3 h-3" /> QR Exclusivo de este Evento
                </span>
                <h3 className="text-base font-black text-white">
                  Código QR para los Invitados
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Este código QR es único para este cumpleaños. Podés imprimirlo en tarjetas, mostrarlo en pantalla o compartir el enlace por WhatsApp.
                </p>
              </div>

              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-purple-300 break-all select-all">
                {`${baseUrl}/?eventId=${currentEvent.id}`}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                <a
                  href={`/api/qr?url=${encodeURIComponent(`${baseUrl}/?eventId=${currentEvent.id}`)}&download=true&filename=qr-${currentEvent.slug || currentEvent.id}.png`}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar QR (PNG)</span>
                </a>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(`${baseUrl}/?eventId=${currentEvent.id}`);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2500);
                    } catch {
                      alert(`${baseUrl}/?eventId=${currentEvent.id}`);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "¡Enlace Copiado!" : "Copiar Enlace"}</span>
                </button>

                <Link
                  href={`/tv?eventId=${currentEvent.id}`}
                  target="_blank"
                  className="px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Pantalla TV de este Evento</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Questions Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-400" />
              <span>Preguntas de la Trivia ({questions.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hacé click en &ldquo;Editar&rdquo; en cualquier tarjeta para cambiar la pregunta, las 4 opciones y la respuesta correcta.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {showConfirmResetQuestions ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetQuestions}
                  disabled={isResettingQuestions}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg transition-colors cursor-pointer"
                >
                  {isResettingQuestions ? "Restableciendo..." : "¿Confirmar restablecer?"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmResetQuestions(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmResetQuestions(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Restablecer plantilla inicial</span>
              </button>
            )}
          </div>
        </div>

        {/* Success message banner */}
        {questionSuccessMessage && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-bold animate-fadeIn">
            ✓ {questionSuccessMessage}
          </div>
        )}

        {/* Questions list */}
        <div className="space-y-4">
          {questions.map((q) => {
            const isEditing = editingQuestionId === q.id;

            if (isEditing) {
              return (
                <form
                  key={q.id}
                  onSubmit={handleSaveQuestion}
                  className="p-5 rounded-2xl bg-purple-950/30 border-2 border-purple-500/60 shadow-xl space-y-4 text-xs animate-fadeIn"
                >
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                    <span className="font-extrabold text-sm text-purple-300 flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-purple-400" />
                      <span>Editando Pregunta #{q.orderNum}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {questionErrorMessage && (
                    <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium animate-shake">
                      {questionErrorMessage}
                    </div>
                  )}

                  {/* Question Prompt */}
                  <div>
                    <label className="block font-bold text-slate-200 mb-1">
                      Enunciado de la Pregunta:
                    </label>
                    <input
                      type="text"
                      required
                      value={editDraft.question}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, question: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-purple-500/50 text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>

                  {/* 4 Options */}
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-200">
                      Opciones de Respuesta (marcá el botón verde para la correcta):
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {editDraft.options.map((opt, optIdx) => {
                        const letter = OPTION_LETTERS[optIdx] || `${optIdx + 1}`;
                        const isCorrect = editDraft.correctIndex === optIdx;

                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                              isCorrect
                                ? "bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10"
                                : "bg-slate-950 border-slate-700"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setEditDraft({ ...editDraft, correctIndex: optIdx })
                              }
                              className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                                isCorrect
                                  ? "bg-emerald-500 text-slate-950"
                                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                              }`}
                              title={isCorrect ? "Respuesta Correcta" : "Marcar como Correcta"}
                            >
                              {letter}
                            </button>

                            <input
                              type="text"
                              required
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...editDraft.options];
                                newOpts[optIdx] = e.target.value;
                                setEditDraft({ ...editDraft, options: newOpts });
                              }}
                              placeholder={`Opción ${letter}`}
                              className="w-full bg-transparent text-white text-xs focus:outline-none"
                            />

                            {isCorrect && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold shrink-0">
                                CORRECTA ⭐
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="block font-bold text-slate-200 mb-1">
                      Curiosidad / Explicación divertida (se muestra tras responder)
                    </label>
                    <input
                      type="text"
                      value={editDraft.explanation}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, explanation: e.target.value })
                      }
                      placeholder="Ej: ¡Las milanesas bien crocantes no se negocian jamás!"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-500/20">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingQuestion}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingQuestion ? "Guardando..." : "Guardar Pregunta"}</span>
                    </button>
                  </div>
                </form>
              );
            }

            // Read-Only Card with "Editar" button
            return (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2.5 transition-all hover:border-slate-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-900/50 text-purple-300 font-black flex items-center justify-center text-xs border border-purple-500/30">
                      #{q.orderNum}
                    </span>
                    <h3 className="font-bold text-sm text-white">{q.question}</h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartEdit(q)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                </div>

                {/* Options Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = oIdx === q.correctIndex;
                    const letter = OPTION_LETTERS[oIdx] || `${oIdx + 1}`;

                    return (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                          isCorrect
                            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200 font-bold"
                            : "bg-slate-900/40 border-slate-800 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`w-5 h-5 rounded font-black text-[10px] flex items-center justify-center shrink-0 ${
                              isCorrect
                                ? "bg-emerald-500 text-slate-950"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="truncate">{opt}</span>
                        </div>
                        {isCorrect && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-black shrink-0">
                            CORRECTA ⭐
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/80">
                    Curiosidad: {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Danger Zone: Reset test scores */}
      <div className="bg-rose-950/20 border border-rose-500/30 rounded-3xl p-6 shadow-xl mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Limpiar y Reiniciar Partidas</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Usá esta opción antes de que arranque la fiesta para borrar todos los jugadores de prueba y dejar el marcador en 0. Las preguntas editadas se conservan intactas.
            </p>
          </div>

          <div>
            {showConfirmResetGame ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetGame}
                  disabled={isResettingGame}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition-colors cursor-pointer"
                >
                  {isResettingGame ? "Borrando..." : "Confirmar Reinicio"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmResetGame(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmResetGame(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reiniciar Tabla y Jugadores</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
          Cargando panel de administración...
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
