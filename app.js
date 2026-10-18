/**
 * BOLERAMA COYOACAN • TORNEO 49 ANIVERSARIO 2026
 * Frontend App & Real-Time TV Engine
 */

// TU URL DE IMPLEMENTACIÓN DE APPS SCRIPT:
const API_URL = 'https://script.google.com/macros/s/AKfycbzSsYtxcfCJcxTyat3z6jvd5iYilXxPB8lOc5EgIoVdu8J41BM8u_FMnCie61k1IpWm/exec';

// Configuración de carrusel (120 segundos = 2 minutos)
const CAROUSEL_INTERVAL_SEC = 120;
let carouselTimer = CAROUSEL_INTERVAL_SEC;
let isPaused = false;
let currentViewIndex = 0;
const views = ['equipos', 'cat1', 'cat2'];

// Estado global de datos en memoria
let tournamentData = {
  equipos: [],
  cat1: [],
  cat2: [],
  stats: {},
  premios: {},
  perfectGames: []
};

// Elementos DOM
const timerElem = document.getElementById('carouselTimer');
const progressBar = document.getElementById('carouselProgressBar');
const currentViewBadge = document.getElementById('currentViewBadge');

/**
 * INICIALIZACIÓN
 */
document.addEventListener('DOMContentLoaded', () => {
  fetchTournamentData();
  initCarousel();
  initCaptureModal();

  // Botón manual de refresco
  document.getElementById('btnManualRefresh').addEventListener('click', () => {
    fetchTournamentData(true);
  });

  // Botón de pausa carrusel
  document.getElementById('btnPauseCarousel').addEventListener('click', togglePauseCarousel);
});

/**
 * CONSULTA A LA API DE APPS SCRIPT
 */
async function fetchTournamentData(manual = false) {
  const spinner = document.getElementById('refreshSpinner');
  if (spinner) spinner.classList.add('animate-spin');

  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (data.status === 'success') {
      tournamentData = data;
      renderAll();
      populateCaptureSelects();
    } else {
      console.error('Error reportado por API:', data.message);
    }
  } catch (err) {
    console.error('Error de conexión con la hoja:', err);
  } finally {
    if (spinner) spinner.classList.remove('animate-spin');
  }
}

/**
 * RENDERIZADO GLOBAL DE COMPONENTES
 */
function renderAll() {
  renderKPIs();
  renderPerfectGameAlert();
  renderTableEquipos();
  renderTableCat1();
  renderTableCat2();
}

/**
 * RENDER: TARJETAS KPI SUPERIORES
 */
function renderKPIs() {
  const stats = tournamentData.stats || {};
  const premios = tournamentData.premios || {};

  document.getElementById('kpiPromedioGeneral').innerText = stats.promedioGeneral || '0.0';
  document.getElementById('kpiTotalPinos').innerText = Number(stats.totalPinos || 0).toLocaleString();
  document.getElementById('kpiTotalLineas').innerText = Number(stats.totalLineas || 0).toLocaleString();

  // Tiro Mayor Equipo (Combinado de jornadas)
  const tiroEq = (premios.tiroMayorEquipoVie && premios.tiroMayorEquipoVie.maxTiroVieHdcp >= (premios.tiroMayorEquipoSab ? premios.tiroMayorEquipoSab.maxTiroSabHdcp : 0))
    ? { score: premios.tiroMayorEquipoVie.maxTiroVieHdcp, team: premios.tiroMayorEquipoVie.nombreEquipo }
    : (premios.tiroMayorEquipoSab ? { score: premios.tiroMayorEquipoSab.maxTiroSabHdcp, team: premios.tiroMayorEquipoSab.nombreEquipo } : { score: 0, team: '-' });

  document.getElementById('kpiTiroMayorEqScore').innerText = tiroEq.score;
  document.getElementById('kpiTiroMayorEqName').innerText = tiroEq.team;

  // Serie Mayor Equipo
  const serieEq = (premios.serieMayorEquipoVie && premios.serieMayorEquipoVie.serieVieHdcp >= (premios.serieMayorEquipoSab ? premios.serieMayorEquipoSab.serieSabHdcp : 0))
    ? { score: premios.serieMayorEquipoVie.serieVieHdcp, team: premios.serieMayorEquipoVie.nombreEquipo }
    : (premios.serieMayorEquipoSab ? { score: premios.serieMayorEquipoSab.serieSabHdcp, team: premios.serieMayorEquipoSab.nombreEquipo } : { score: 0, team: '-' });

  document.getElementById('kpiSerieMayorEqScore').innerText = serieEq.score;
  document.getElementById('kpiSerieMayorEqName').innerText = serieEq.team;

  // Tiro Mayor Individual
  const tiroInd = (premios.tiroMayorIndVie && premios.tiroMayorIndVie.maxTiroVieHdcp >= (premios.tiroMayorIndSab ? premios.tiroMayorIndSab.maxTiroSabHdcp : 0))
    ? { score: premios.tiroMayorIndVie.maxTiroVieHdcp, player: premios.tiroMayorIndVie.nombreJugador }
    : (premios.tiroMayorIndSab ? { score: premios.tiroMayorIndSab.maxTiroSabHdcp, player: premios.tiroMayorIndSab.nombreJugador } : { score: 0, player: '-' });

  document.getElementById('kpiTiroMayorIndScore').innerText = tiroInd.score;
  document.getElementById('kpiTiroMayorIndName').innerText = tiroInd.player;

  // Serie Mayor Individual
  const serieInd = (premios.serieMayorIndVie && premios.serieMayorIndVie.serieVieHdcp >= (premios.serieMayorIndSab ? premios.serieMayorIndSab.serieSabHdcp : 0))
    ? { score: premios.serieMayorIndVie.serieVieHdcp, player: premios.serieMayorIndVie.nombreJugador }
    : (premios.serieMayorIndSab ? { score: premios.serieMayorIndSab.serieSabHdcp, player: premios.serieMayorIndSab.nombreJugador } : { score: 0, player: '-' });

  document.getElementById('kpiSerieMayorIndScore').innerText = serieInd.score;
  document.getElementById('kpiSerieMayorIndName').innerText = serieInd.player;
}

/**
 * RENDER: ALERTA DE JUEGO PERFECTO (300)
 */
function renderPerfectGameAlert() {
  const alertBox = document.getElementById('perfectGameAlert');
  if (tournamentData.perfectGames && tournamentData.perfectGames.length > 0) {
    const pg = tournamentData.perfectGames[0];
    document.getElementById('perfectGamePlayer').innerText = pg.jugador;
    document.getElementById('perfectGameTeam').innerText = pg.equipo;
    document.getElementById('perfectGameLine').innerText = `${pg.linea} (${pg.dia})`;
    alertBox.classList.remove('hidden');
  } else {
    alertBox.classList.add('hidden');
  }
}

/**
 * RENDER: TABLA CUARTETAS
 */
function renderTableEquipos() {
  const tbody = document.getElementById('tbodyEquipos');
  tbody.innerHTML = '';
  const equipos = tournamentData.equipos || [];
  const topLeaderScore = equipos.length > 0 ? equipos[0].granTotHdcp : 0;

  equipos.forEach((eq, idx) => {
    const isQualifying = idx < 16; // Zona de clasificación a Finales Baker
    const diff = topLeaderScore > 0 ? (topLeaderScore - eq.granTotHdcp) : 0;

    // Sumar hándicaps de jugadores para obtener el hándicap total por línea de la cuarteta
    const hdcpEquipo = eq.jugadores ? eq.jugadores.reduce((sum, j) => sum + (j.hdcp || 0), 0) : 0;

    const row = document.createElement('tr');
    row.className = `hover:bg-brand-border/40 transition ${isQualifying ? 'bg-red-950/10' : ''}`;
    row.innerHTML = `
      <td class="py-3 px-4 text-center font-bold font-mono ${idx === 0 ? 'text-amber-400 text-base' : idx < 3 ? 'text-white' : 'text-gray-400'}">
        ${eq.posicion}
      </td>
      <td class="py-3 px-4 font-semibold text-white">
        <div class="flex items-center space-x-2">
          ${isQualifying ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>' : ''}
          <span>${eq.nombreEquipo}</span>
        </div>
      </td>
      <td class="py-3 px-4 text-center font-mono text-amber-300 font-semibold">+${hdcpEquipo}</td>
      <td class="py-3 px-4 text-center font-mono text-gray-300">${eq.bakerVie || '-'}</td>
      <td class="py-3 px-4 text-center font-mono text-gray-300">${eq.bakerSab || '-'}</td>
      <td class="py-3 px-4 text-right font-mono text-gray-400">${Number(eq.scratchVie || 0).toLocaleString()}</td>
      <td class="py-3 px-4 text-right font-mono text-gray-400">${Number(eq.scratchSab || 0).toLocaleString()}</td>
      <td class="py-3 px-4 text-right font-mono text-gray-200">${Number(eq.granTotScratch || 0).toLocaleString()}</td>
      <td class="py-3 px-6 text-right font-mono font-extrabold text-amber-400 text-base bg-amber-500/5">
        ${Number(eq.granTotHdcp || 0).toLocaleString()}
      </td>
      <td class="py-3 px-4 text-center font-mono text-xs ${diff === 0 ? 'text-emerald-400 font-bold' : 'text-gray-400'}">
        ${diff === 0 ? 'LÍDER' : `-${diff}`}
      </td>
    `;
    tbody.appendChild(row);
  });
}

/**
 * RENDER: TABLA INDIVIDUAL CAT 1
 */
function renderTableCat1() {
  const tbody = document.getElementById('tbodyCat1');
  tbody.innerHTML = '';
  (tournamentData.cat1 || []).forEach(j => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-brand-border/40 transition';
    row.innerHTML = `
      <td class="py-3 px-4 text-center font-bold font-mono ${j.posicion <= 3 ? 'text-amber-400' : 'text-gray-400'}">${j.posicion}</td>
      <td class="py-3 px-4 font-semibold text-white">${j.nombreJugador}</td>
      <td class="py-3 px-4 text-gray-300">${j.nombreEquipo}</td>
      <td class="py-3 px-4 text-center font-mono text-gray-400">${j.hdcp}</td>
      <td class="py-3 px-4 text-right font-mono text-gray-300">${j.subVie || 0}</td>
      <td class="py-3 px-4 text-right font-mono text-gray-300">${j.subSab || 0}</td>
      <td class="py-3 px-4 text-right font-mono text-gray-200">${j.totScratch || 0}</td>
      <td class="py-3 px-4 text-center font-mono text-emerald-400 font-semibold">${j.promedioTorneo}</td>
      <td class="py-3 px-6 text-right font-mono font-bold text-amber-400 text-base bg-amber-500/5">${j.totHdcp || 0}</td>
    `;
    tbody.appendChild(row);
  });
}

/**
 * RENDER: TABLA INDIVIDUAL CAT 2
 */
function renderTableCat2() {
  const tbody = document.getElementById('tbodyCat2');
  tbody.innerHTML = '';
  (tournamentData.cat2 || []).forEach(j => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-brand-border/40 transition';
    row.innerHTML = `
      <td class="py-3 px-4 text-center font-bold font-mono ${j.posicion <= 3 ? 'text-amber-400' : 'text-gray-400'}">${j.posicion}</td>
      <td class="py-3 px-4 font-semibold text-white">${j.nombreJugador}</td>
      <td class="py-3 px-4 text-gray-300">${j.nombreEquipo}</td>
      <td class="py-3 px-4 text-center font-mono text-gray-400">${j.hdcp}</td>
      <td class="py-3 px-4 text-right font-mono text-gray-300">${j.subVie || 0}</td>
      <td class="py-3 px-4 text-right font-mono text-gray-300">${j.subSab || 0}</td>
      <td class="py-3 px-4 text-right font-mono text-gray-200">${j.totScratch || 0}</td>
      <td class="py-3 px-4 text-center font-mono text-emerald-400 font-semibold">${j.promedioTorneo}</td>
      <td class="py-3 px-6 text-right font-mono font-bold text-amber-400 text-base bg-amber-500/5">${j.totHdcp || 0}</td>
    `;
    tbody.appendChild(row);
  });
}

/**
 * CARRUSEL AUTOMÁTICO (2 MINUTOS POR PANTALLA)
 */
function initCarousel() {
  setInterval(() => {
    if (isPaused) return;

    carouselTimer--;
    const progressPercent = (carouselTimer / CAROUSEL_INTERVAL_SEC) * 100;
    progressBar.style.width = `${progressPercent}%`;

    const mins = Math.floor(carouselTimer / 60);
    const secs = carouselTimer % 60;
    timerElem.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (carouselTimer <= 0) {
      currentViewIndex = (currentViewIndex + 1) % views.length;
      switchView(views[currentViewIndex]);
      carouselTimer = CAROUSEL_INTERVAL_SEC;
      progressBar.style.width = '100%';
      // Cada rotación completa se sincronizan los datos en segundo plano
      if (currentViewIndex === 0) fetchTournamentData();
    }
  }, 1000);
}

function switchView(viewName) {
  views.forEach(v => {
    const el = document.getElementById(`view${capitalize(v)}`);
    const tab = document.getElementById(`tab${capitalize(v)}`);
    if (v === viewName) {
      el.classList.remove('hidden');
      tab.className = 'px-5 py-2.5 rounded-xl font-display font-bold tracking-wider uppercase text-sm transition bg-red-600 text-white shadow-lg';
    } else {
      el.classList.add('hidden');
      tab.className = 'px-5 py-2.5 rounded-xl font-display font-bold tracking-wider uppercase text-sm transition bg-brand-card text-gray-400 hover:text-white border border-brand-border';
    }
  });

  const titles = {
    equipos: 'CUARTETAS (EQUIPOS)',
    cat1: 'INDIVIDUAL CATEGORÍA 1',
    cat2: 'INDIVIDUAL CATEGORÍA 2'
  };
  currentViewBadge.innerText = titles[viewName] || viewName.toUpperCase();
}

function togglePauseCarousel() {
  isPaused = !isPaused;
  const btn = document.getElementById('btnPauseCarousel');
  if (isPaused) {
    btn.classList.add('bg-amber-600/30', 'text-amber-400', 'border-amber-500');
  } else {
    btn.classList.remove('bg-amber-600/30', 'text-amber-400', 'border-amber-500');
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * MODAL DE CAPTURA RÁPIDA (MESA / PISTAS)
 */
function initCaptureModal() {
  const modal = document.getElementById('modalCapture');
  document.getElementById('btnOpenCapture').addEventListener('click', () => modal.classList.remove('hidden'));
  document.getElementById('btnCloseCapture').addEventListener('click', () => modal.classList.add('hidden'));

  const selectTipo = document.getElementById('selectTipo');
  selectTipo.addEventListener('change', () => {
    const isBaker = selectTipo.value === 'BAKER';
    document.getElementById('containerNumLinea').classList.toggle('hidden', isBaker);
    document.getElementById('containerJugadores').classList.toggle('hidden', isBaker);
    document.getElementById('containerBakerInput').classList.toggle('hidden', !isBaker);
  });

  document.getElementById('selectEquipo').addEventListener('change', renderCapturePlayerInputs);

  document.getElementById('formCapture').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitScoreCapture();
  });
}

function populateCaptureSelects() {
  const select = document.getElementById('selectEquipo');
  if (!select) return;
  select.innerHTML = '';

  (tournamentData.equipos || []).forEach(eq => {
    const opt = document.createElement('option');
    opt.value = eq.numEquipo;
    opt.innerText = `Equipo ${eq.numEquipo}: ${eq.nombreEquipo}`;
    select.appendChild(opt);
  });

  renderCapturePlayerInputs();
}

function renderCapturePlayerInputs() {
  const select = document.getElementById('selectEquipo');
  const container = document.getElementById('inputsJugadoresList');
  container.innerHTML = '';

  const numEq = Number(select.value);
  const eq = (tournamentData.equipos || []).find(e => e.numEquipo === numEq);

  if (!eq || !eq.jugadores) return;

  eq.jugadores.forEach((j, idx) => {
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between bg-[#0E1420] border border-brand-border p-2.5 rounded-xl';
    div.innerHTML = `
      <div class="truncate mr-2">
        <p class="text-sm font-semibold text-white truncate">${j.nombreJugador}</p>
        <span class="text-[10px] text-gray-400">HDCP: ${j.hdcp} | ${j.categoria}</span>
      </div>
      <input type="number" min="0" max="300" required placeholder="0" data-player-idx="${idx}" class="inputScoreJugador w-20 bg-brand-card border border-brand-border rounded-lg px-2 py-1.5 text-center text-white font-mono font-bold text-lg focus:outline-none focus:border-red-500">
    `;
    container.appendChild(div);
  });
}

async function submitScoreCapture() {
  const btn = document.getElementById('btnSubmitCapture');
  const feedback = document.getElementById('captureFeedback');
  btn.disabled = true;
  btn.innerText = 'Guardando...';

  const pin = document.getElementById('inputPin').value;
  const numEquipo = Number(document.getElementById('selectEquipo').value);
  const sesion = document.getElementById('selectSesion').value;
  const tipo = document.getElementById('selectTipo').value;
  const numLinea = Number(document.getElementById('selectNumLinea').value);

  let payload = { pin, numEquipo, sesion, tipo };

  if (tipo === 'BAKER') {
    payload.score = Number(document.getElementById('inputBakerScore').value);
  } else {
    payload.numLinea = numLinea;
    const inputs = document.querySelectorAll('.inputScoreJugador');
    payload.scores = Array.from(inputs).map(inp => Number(inp.value) || 0);
  }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    feedback.classList.remove('hidden');
    if (result.status === 'success') {
      feedback.className = 'text-center text-xs py-2 px-3 rounded-xl font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-600';
      feedback.innerText = '✓ Guardado exitosamente. Sincronizando pantallas...';
      await fetchTournamentData();
      setTimeout(() => {
        document.getElementById('modalCapture').classList.add('hidden');
        feedback.classList.add('hidden');
      }, 1500);
    } else {
      feedback.className = 'text-center text-xs py-2 px-3 rounded-xl font-semibold bg-red-950/80 text-red-300 border border-red-600';
      feedback.innerText = `Error: ${result.message}`;
    }
  } catch (err) {
    feedback.classList.remove('hidden');
    feedback.className = 'text-center text-xs py-2 px-3 rounded-xl font-semibold bg-red-950/80 text-red-300 border border-red-600';
    feedback.innerText = 'Error al comunicar con Google Sheets.';
  } finally {
    btn.disabled = false;
    btn.innerText = 'Guardar y Sincronizar';
  }
}
