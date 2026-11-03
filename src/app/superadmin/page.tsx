"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { TriviaEvent } from "@/types/trivia";
import {
  ShieldAlert,
  Plus,
  Tv,
  Users,
  HelpCircle,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  RotateCw,
  Sparkles,
  Lock,
  Radio,
} from "lucide-react";

const SUPERADMIN_SECRET = "fiesta2026"; // Master PIN for superadmin access

export default function SuperAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const [events, setEvents] = useState<TriviaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventBirthdayPerson, setNewEventBirthdayPerson] = useState("");
  const [newEventTimer, setNewEventTimer] = useState(10);
  const [activateImmediately, setActivateImmediately] = useState(true);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  // Check stored auth
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("trivia_superadmin_auth");
      if (saved === "true") {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === SUPERADMIN_SECRET) {
      setIsAuthenticated(true);
      setPinError(false);
      sessionStorage.setItem("trivia_superadmin_auth", "true");
    } else {
      setPinError(true);
    }
  };

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/superadmin/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
    }
  }, [isAuthenticated, fetchEvents]);

  const handleActivateEvent = async (eventId: string | null) => {
    try {
      const res = await fetch("/api/superadmin/events/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        setTimeout(() => setActionMessage(""), 4000);
        fetchEvents();
      }
    } catch (err) {
      console.error("Error activating event:", err);
    }
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!confirm(`¿Estás seguro de eliminar el evento "${title}" y todas sus preguntas y partidas?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/superadmin/events/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchEvents();
      }
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventBirthdayPerson.trim()) return;

    setIsSubmittingCreate(true);
    try {
      const res = await fetch("/api/superadmin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEventTitle,
          birthdayPerson: newEventBirthdayPerson,
          timerSeconds: newEventTimer,
          activateNow: activateImmediately,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewEventTitle("");
        setNewEventBirthdayPerson("");
        fetchEvents();
      }
    } catch (err) {
      console.error("Error creating event:", err);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const activeEvent = events.find((e) => e.status === "active");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-white">Panel SuperAdmin</h1>
          <p className="text-xs text-slate-400">
            Ingresá la clave de acceso de administración central.
          </p>

          <input
            type="password"
            autoFocus
            required
            placeholder="Clave maestra (ej: fiesta2026)"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          {pinError && (
            <p className="text-xs text-rose-400 font-bold">Clave incorrecta</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white shadow-lg transition-all cursor-pointer"
          >
            Acceder
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-pink-500" />
            <h1 className="text-2xl font-black bg-gradient-to-r from-pink-400 via-purple-400 to-amber-300 bg-clip-text text-transparent">
              Panel SuperAdmin - Gestión de Eventos
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Creá múltiples eventos, activá el evento en vivo o poné la pantalla en modo espera.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevo Evento</span>
          </button>

          <button
            onClick={fetchEvents}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="Recargar"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Action Notification */}
      {actionMessage && (
        <div className="mt-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Active Event Banner & Mode Switcher */}
      <div className="mt-6 p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              activeEvent ? "bg-emerald-500 animate-ping" : "bg-rose-500"
            }`}
          />
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Estado de Pantalla TV y Celulares
            </span>
            <div className="text-base font-extrabold text-white flex items-center gap-2">
              {activeEvent ? (
                <>
                  <span className="text-emerald-400">EN VIVO:</span>
                  <span>{activeEvent.title}</span>
                </>
              ) : (
                <span className="text-amber-400">
                  🔴 Modo Espera (Actualmente no hay ningún evento activo)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeEvent ? (
            <button
              onClick={() => handleActivateEvent(null)}
              className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              <span>Desactivar Todo (Modo Espera)</span>
            </button>
          ) : null}

          <Link
            href="/tv"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Tv className="w-4 h-4 text-purple-400" />
            <span>Ver Pantalla TV</span>
          </Link>
        </div>
      </div>

      {/* Events List */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400" />
            <span>Todos los Eventos ({events.length})</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Cargando eventos...
          </div>
        ) : events.length === 0 ? (
          <div className="p-10 text-center bg-slate-900/50 border border-slate-800 rounded-3xl">
            <p className="text-slate-400 text-sm">No hay eventos creados todavía.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-3 px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs"
            >
              Crear el primer evento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((evt) => {
              const isLive = evt.status === "active";

              return (
                <div
                  key={evt.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                    isLive
                      ? "bg-purple-950/40 border-purple-500/60 ring-2 ring-purple-500/30 shadow-xl"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isLive
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {isLive ? "🟢 EN VIVO AHORA" : "⚪ INACTIVO"}
                      </span>

                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(evt.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-white leading-snug">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-purple-300 mt-0.5 font-medium">
                      Homenajeado/a: <strong>{evt.birthdayPerson}</strong>
                    </p>

                    {/* Stats pills */}
                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {evt.playersCount || 0} jugadores
                      </span>
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                        {evt.questionsCount || 10} preguntas
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80 gap-2">
                    <div className="flex items-center gap-2">
                      {isLive ? (
                        <button
                          onClick={() => handleActivateEvent(null)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pausar</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateEvent(evt.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Activar en Vivo</span>
                        </button>
                      )}

                      <Link
                        href={`/admin?eventId=${evt.id}`}
                        target="_blank"
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        title="Abrir panel de organizador de este evento"
                      >
                        <span>Organizador</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>
                    </div>

                    <button
                      onClick={() => handleDeleteEvent(evt.id, evt.title)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Eliminar evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Crear Evento */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateEvent}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-fadeIn"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-black text-white">
                Crear Nuevo Evento de Trivia
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Cerrar ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Título del Evento
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 🎉 Cumple de 30 de Sofi"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nombre del Cumpleañero/a o Homenajeado/a
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Sofi"
                value={newEventBirthdayPerson}
                onChange={(e) => setNewEventBirthdayPerson(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Segundos por Pregunta
              </label>
              <input
                type="number"
                min={5}
                max={60}
                value={newEventTimer}
                onChange={(e) => setNewEventTimer(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={activateImmediately}
                onChange={(e) => setActivateImmediately(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <span className="text-xs text-slate-300 font-semibold">
                Activar este evento inmediatamente en vivo
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingCreate}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-xs shadow-lg"
              >
                {isSubmittingCreate ? "Creando..." : "Crear Evento"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
