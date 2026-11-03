"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { TriviaSettings, QuestionAdmin } from "@/types/trivia";
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
} from "lucide-react";

const OPTION_LETTERS = ["A", "B", "C", "D"];

export default function AdminPage() {
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
      const [settingsRes, questionsRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/admin/questions"),
      ]);

      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        setSettings(sData.settings);
      }

      if (questionsRes.ok) {
        const qData = await questionsRes.json();
        setQuestions(qData.questions || []);
      }
    } catch (err) {
      console.error("Admin data fetch error:", err);
    }
  }, []);

  useEffect(() => {
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
        body: JSON.stringify(settings),
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
        body: JSON.stringify({ confirm: true }),
      });

      if (res.ok) {
        setShowConfirmResetGame(false);
        alert("¡Todas las partidas y respuestas de prueba fueron eliminadas con éxito!");
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
        body: JSON.stringify({ action: "reset_default" }),
      });

      const data = await res.json();
      if (res.ok) {
        setQuestions(data.questions || []);
        setShowConfirmResetQuestions(false);
        setEditingQuestionId(null);
        setQuestionSuccessMessage("¡Las 10 preguntas por defecto fueron restablecidas!");
        setTimeout(() => setQuestionSuccessMessage(""), 4000);
      }
    } catch (err) {
      console.error("Error resetting questions:", err);
    } finally {
      setIsResettingQuestions(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Panel del Anfitrión / Cumpleañero
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Editá las preguntas y respuestas, configurá los nombres y administrá la fiesta.
          </p>
        </div>

        {/* Quick Link Navigation */}
        <div className="flex items-center gap-2">
          <Link
            href="/tv"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-purple-600/30 border border-purple-500/50 text-purple-200 text-xs font-bold hover:bg-purple-600/50 flex items-center gap-1.5 transition-colors"
          >
            <Tv className="w-4 h-4" />
            <span>Pantalla TV / QR</span>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Smartphone className="w-4 h-4" />
            <span>Ver Modo Celular</span>
          </Link>
        </div>
      </div>

      {/* Settings Form */}
      <div className="mt-8 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Save className="w-4 h-4 text-emerald-400" />
          <span>Datos del Evento</span>
        </h2>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre del Cumpleañero/a
              </label>
              <input
                type="text"
                value={settings.birthdayPerson}
                onChange={(e) => setSettings({ ...settings, birthdayPerson: e.target.value })}
                placeholder="Ej: Martín, Sofi, Lucas"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Título del Evento
              </label>
              <input
                type="text"
                value={settings.eventTitle}
                onChange={(e) => setSettings({ ...settings, eventTitle: e.target.value })}
                placeholder="Ej: 🎉 ¡Cumple de 30 de Martín!"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSettingsSuccess && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> ¡Guardado correctamente!
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingSettings ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Interactive Questions & Answers Editor Section */}
      <div className="mt-8 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                Editar Preguntas y Respuestas ({questions.length})
              </h2>
              <p className="text-xs text-slate-400">
                Hacé clic en &quot;Editar&quot; en cualquier pregunta para modificar el texto, las 4 opciones o la opción correcta.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showConfirmResetQuestions ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetQuestions}
                  disabled={isResettingQuestions}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  {isResettingQuestions ? "Restableciendo..." : "Confirmar Restablecer"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmResetQuestions(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmResetQuestions(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Restablecer preguntas predeterminadas"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Restablecer Predeterminadas</span>
              </button>
            )}

            <button
              onClick={fetchAdminData}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Recargar preguntas"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Success / Error Banners for Questions */}
        {questionSuccessMessage && (
          <div className="my-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{questionSuccessMessage}</span>
          </div>
        )}

        {/* Question Cards / Forms List */}
        <div className="mt-6 space-y-4">
          {questions.map((q) => {
            const isEditing = editingQuestionId === q.id;

            if (isEditing) {
              return (
                <form
                  key={q.id}
                  onSubmit={handleSaveQuestion}
                  className="p-5 rounded-2xl bg-purple-950/30 border-2 border-purple-500/60 text-xs space-y-4 shadow-2xl animate-fadeIn"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-purple-500/30">
                    <span className="font-extrabold text-sm text-purple-300 flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4" />
                      Editando Pregunta #{q.orderNum}
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {questionErrorMessage && (
                    <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                      {questionErrorMessage}
                    </div>
                  )}

                  {/* Question Text Input */}
                  <div>
                    <label className="block font-bold text-slate-200 mb-1">
                      Enunciado de la Pregunta
                    </label>
                    <input
                      type="text"
                      required
                      value={editDraft.question}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, question: e.target.value })
                      }
                      placeholder="Ej: ¿Cuál es su comida favorita?"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* 4 Options with Radio Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block font-bold text-slate-200">
                        Opciones de Respuesta
                      </label>
                      <span className="text-[11px] text-amber-300 font-semibold">
                        💡 Hacé clic en &quot;Marcar Correcta&quot; para definir la respuesta ganadora
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {editDraft.options.map((optText, oIdx) => {
                        const isCorrect = editDraft.correctIndex === oIdx;
                        const letter = OPTION_LETTERS[oIdx] || `${oIdx + 1}`;

                        return (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center gap-2 ${
                              isCorrect
                                ? "bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/40"
                                : "bg-slate-900/60 border-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center ${
                                  isCorrect
                                    ? "bg-emerald-500 text-slate-950"
                                    : "bg-slate-800 text-slate-300"
                                }`}
                              >
                                {letter}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  setEditDraft({ ...editDraft, correctIndex: oIdx })
                                }
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                  isCorrect
                                    ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/60 shadow-sm"
                                    : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                                }`}
                              >
                                {isCorrect ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Correcta ⭐</span>
                                  </>
                                ) : (
                                  <span>Marcar Correcta</span>
                                )}
                              </button>
                            </div>

                            <input
                              type="text"
                              required
                              value={optText}
                              onChange={(e) => {
                                const newOpts = [...editDraft.options];
                                newOpts[oIdx] = e.target.value;
                                setEditDraft({ ...editDraft, options: newOpts });
                              }}
                              placeholder={`Opción ${letter}`}
                              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanation Input */}
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
      <div className="mt-8 bg-rose-950/20 border border-rose-500/30 rounded-3xl p-6 shadow-xl mb-12">
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
