"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { TriviaSettings, QuestionAdmin, LeaderboardEntry } from "@/types/trivia";
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
} from "lucide-react";

export default function AdminPage() {
  const [settings, setSettings] = useState<TriviaSettings>({
    birthdayPerson: "",
    eventTitle: "",
    questionTimerSeconds: 10,
  });
  const [questions, setQuestions] = useState<QuestionAdmin[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const fetchAdminData = useCallback(async () => {
    try {
      const [settingsRes, lbRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/leaderboard"),
      ]);

      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        setSettings(sData.settings);
        setQuestions(sData.questions || []);
      }

      if (lbRes.ok) {
        const lbData = await lbRes.json();
        setLeaderboard(lbData.leaderboard || []);
      }
    } catch (err) {
      console.error("Admin data fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetGame = async () => {
    setIsResetting(true);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });

      if (res.ok) {
        setShowConfirmReset(false);
        fetchAdminData();
        alert("¡Todas las partidas y respuestas de prueba fueron eliminadas con éxito!");
      }
    } catch (err) {
      console.error("Error resetting game:", err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 max-w-4xl mx-auto">
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
            Configurá los nombres, verificá las preguntas y reiniciá partidas antes de la fiesta.
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
            <span>Pantalla TV / Proyector</span>
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
            {savedSuccess && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> ¡Guardado correctamente!
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Danger Zone: Reset test scores */}
      <div className="mt-8 bg-rose-950/20 border border-rose-500/30 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Limpiar y Reiniciar Partidas</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Usá esta opción antes de que arranque la fiesta para borrar todos los jugadores de prueba y dejar el marcador en 0. Las preguntas se conservan intactas.
            </p>
          </div>

          <div>
            {showConfirmReset ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetGame}
                  disabled={isResetting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition-colors cursor-pointer"
                >
                  {isResetting ? "Borrando..." : "Confirmar Reinicio"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reiniciar Tabla y Jugadores</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Questions Preview */}
      <div className="mt-8 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">
              Preguntas de la Trivia ({questions.length})
            </h2>
          </div>
          <button
            onClick={fetchAdminData}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Recargar"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span className="text-purple-300">#{q.orderNum}. {q.question}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {q.options.map((opt, oIdx) => {
                  const isCorrect = oIdx === q.correctIndex;
                  return (
                    <div
                      key={oIdx}
                      className={`p-2 rounded-xl border flex items-center justify-between ${
                        isCorrect
                          ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200 font-bold"
                          : "bg-slate-900/40 border-slate-800 text-slate-400"
                      }`}
                    >
                      <span>{opt}</span>
                      {isCorrect && <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded font-black">CORRECTA</span>}
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
          ))}
        </div>
      </div>
    </div>
  );
}

