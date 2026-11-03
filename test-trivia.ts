import {
  registerPlayer,
  getClientQuestions,
  submitAnswer,
  getLeaderboard,
  getPlayerAnswers,
  resetGame,
  getSettings,
} from "./src/lib/trivia-service";

async function runTests() {
  console.log("==================================================");
  console.log("    TRIVIA DE FIESTA - SUITE DE PRUEBAS AUTOMÁTICA");
  console.log("==================================================");

  // 1. Reset
  await resetGame();
  console.log("✓ 1. Base de datos reseteada correctamente.");

  // 2. Settings check
  const settings = await getSettings();
  console.log(`✓ 2. Configuración cargada: Cumpleañero = "${settings.birthdayPerson}", Temporizador = ${settings.questionTimerSeconds}s`);

  // 3. Questions check
  const questions = await getClientQuestions();
  console.log(`✓ 3. Preguntas cargadas: ${questions.length} preguntas disponibles.`);
  if (questions.length !== 10) {
    throw new Error(`Se esperaban 10 preguntas, se encontraron ${questions.length}`);
  }

  // Ensure correct_index is NOT leaked to clients
  if ("correctIndex" in questions[0] || "correct_index" in (questions[0] as unknown as Record<string, unknown>)) {
    throw new Error("ERROR DE SEGURIDAD: correct_index está expuesto en getClientQuestions()");
  }
  console.log("✓ 4. Verificación de seguridad: correct_index oculto al cliente.");

  // 4. Register two players: Camila (rápida) and Lucas (lento)
  const camila = await registerPlayer("Camila", "Sánchez", "💃");
  const lucas = await registerPlayer("Lucas", "García", "🕺");
  console.log(`✓ 5. Jugadores registrados: Camila (${camila.id}) y Lucas (${lucas.id})`);

  // 5. Simulate answers with exact millisecond timings
  console.log("\n▶ Simulando respuestas de los 10 turnos...");

  for (let i = 0; i < questions.length; i++) {
    const qId = questions[i].id;
    const isCorrectTurn = i < 8;
    const choice = isCorrectTurn ? 0 : 1;

    // Camila answers fast: 1400ms + i*40ms
    const camilaTime = 1400 + i * 40;
    await submitAnswer({
      playerId: camila.id,
      questionId: qId,
      selectedIndex: choice,
      timeSpentMs: camilaTime,
    });

    // Lucas answers slower: 4800ms + i*120ms
    const lucasTime = 4800 + i * 120;
    await submitAnswer({
      playerId: lucas.id,
      questionId: qId,
      selectedIndex: choice,
      timeSpentMs: lucasTime,
    });
  }

  // 6. Verify answers audit
  const camilaAnswers = await getPlayerAnswers(camila.id);
  console.log(`✓ 6. Auditoría: Camila tiene ${camilaAnswers.length} respuestas registradas en la BD.`);

  // 7. Check Leaderboard and Tie-Breaker
  const leaderboard = await getLeaderboard();
  console.log("\n--------------------------------------------------");
  console.log("       TABLA DE POSICIONES Y PODIO (RANKING)");
  console.log("--------------------------------------------------");
  leaderboard.forEach((entry) => {
    console.log(
      `#${entry.rank} ${entry.avatar} ${entry.firstName} ${entry.lastName} | ` +
        `Puntaje: ${entry.score}/10 | Tiempo Total: ${(entry.totalTimeMs / 1000).toFixed(2)}s | Finalizado: ${entry.isFinished}`
    );
  });
  console.log("--------------------------------------------------");

  // Validations:
  if (leaderboard[0].score !== 8 || leaderboard[1].score !== 8) {
    throw new Error(`Puntaje incorrecto: se esperaban 8 puntos`);
  }

  if (leaderboard[0].firstName !== "Camila") {
    throw new Error(
      `Fallo en sistema de desempate: Se esperaba a Camila en puesto 1 por menor tiempo, pero quedó ${leaderboard[0].firstName}`
    );
  }

  if (leaderboard[0].totalTimeMs >= leaderboard[1].totalTimeMs) {
    throw new Error("El tiempo de #1 debe ser menor que el de #2");
  }

  console.log("\n🎉 ¡TODAS LAS VALIDACIONES PASARON EXITOSAMENTE AL 100%! 🎉");
  console.log("El desempate por milisegundos y la persistencia en LibSQL funcionan con precisión milimétrica.\n");

  // Clean DB
  await resetGame();
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
