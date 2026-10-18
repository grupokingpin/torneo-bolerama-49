/**
 * BOLERAMA COYOACAN • TORNEO 49 ANIVERSARIO 2026
 * Frontend App & Real-Time TV Engine
 */

// URL DE TU API DE GOOGLE APPS SCRIPT
const API_URL = 'https://script.google.com/macros/s/AKfycbzSsYtxcfCJcxTyat3z6jvd5iYilXxPB8lOc5EgIoVdu8J41BM8u_FMnCie61k1IpWm/exec';

// Configuración del Carrusel (30 segundos por pantalla)
const CAROUSEL_INTERVAL_SEC = 30;
let carouselTimer = CAROUSEL_INTERVAL_SEC;
let isPaused = false;
let currentViewIndex = 0;
const views = ['equipos', 'cat1', 'cat2'];

// Estado global de datos
let tournamentData = {
  equipos: [],
  cat1: [],
  cat2: [],
  stats: {},
  premios: {},
  perfectGames: []
};

// Control de tiempo para animación del cintillo 300 (10 minutos de animación inicial)
let bannerTimerSeconds = 600; 

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
  init300BannerController();

  document.getElementById('btnManualRefresh').addEventListener('click', () => {
    fetchTournamentData(true);
  });

  document.getElementById('btnPauseCarousel').addEventListener('click', togglePauseCarousel);

  // Evento del selector de Ficha x Equipo (QR)
  const detailSelect = document.getElementById('selectDetailEquipo');
  if (detailSelect) {
    detailSelect.addEventListener('change', renderEquipoDetailContent);
  }
});

/**
 * CONSULTA A LA API EN GOOGLE SHEETS
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
      populateDetailSelect();
    } else {
      console.error('Error reportado por API:', data.message);
    }
  } catch (err) {
    console.error('Error de conexión con Google Sheets:', err);
  } finally {
    if (spinner) spinner.classList.remove('animate-spin');
  }
}

/**
 * RENDERIZADO GLOBAL
 */
function renderAll() {
  renderKPIs();
  renderPerfectGameAlert();
  renderTableEquipos();
  renderTableCat1();
  renderTableCat2();
  renderPremiosGrid();
  renderEquipoDetailContent();
}

/**
 * RENDER: TARJETAS KPI
 */
function renderKPIs() {
  const stats = tournamentData.stats || {};
  const premios = tournamentData.premios || {};

  document.getElementById('kpiPromedioGeneral').innerText = stats.promedioGeneral || '0.0';
  document.getElementById('kpiTotalPinos').innerText = Number(stats.totalPinos || 0).toLocaleString();
  document.getElementById('kpiTotalLineas').innerText = Number(stats.totalLineas || 0).toLocaleString();

  // Tiro Mayor Equipo
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
 * CINTILLO 300: Animación de 10 minutos iniciales y luego pausa
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

function init300BannerController() {
  setInterval(() => {
    if (bannerTimerSeconds > 0) {
      bannerTimerSeconds--;
      if (bannerTimerSeconds === 0) {
        const alertBox = document.getElementById('perfectGameAlert');
        if (alertBox) {
          alertBox.classList.remove('banner-300-active'); // Pausa la animación parpadeante
        }
      }
    }
  }, 1000);
}

/**
 * RENDER: TABLA CUARTETAS (CON DESGLOSE Y RESALTADO DE TOP 5 PARA TV)
 */
function renderTableEquipos() {
  const tbody = document.getElementById('tbodyEquipos');
  tbody.innerHTML = '';
  const equipos = tournamentData.equipos || [];

  equipos.forEach((eq, idx) => {
    const isTop5 = idx < 5; // Resaltado especial para Top 5 en TV
    const isQualifying = idx < 16;

    // Calcular promedio general del equipo
    const promEq = eq.jugadores ? (eq.jugadores.reduce((s, j) => s + Number(j.promedioTorneo || 0), 0) / (eq.jugadores.length || 1)).toFixed(1) : '0.0';

    // Estado Finales Baker (Columna N)
    let estadoBaker = 'En Juego';
    if (idx === 0) estadoBaker = '🏆 Sembrado #1 (2 BYEs)';
    else if (idx === 1) estadoBaker = '⭐ Sembrado #2 (1 BYE)';
    else if (idx < 16) estadoBaker = '⚡ Clasificado Baker';

    const row = document.createElement('tr');
    row.className = `transition ${isTop5 ? 'bg-red-950/30 font-bold text-white text-lg border-l-4 border-amber-400' : 'hover:bg-brand-border/30 text-gray-300'}`;
    
    row.innerHTML = `
      <td class="py-3 px-3 text-center font-black font-mono ${idx === 0 ? 'text-amber-400 text-xl' : idx < 3 ? 'text-amber-300 text-lg' : 'text-gray-400'}">
        ${eq.posicion}
      </td>
      <td class="py-3 px-3 font-extrabold ${isTop5 ? 'text-white' : 'text-gray-200'}">
        <div class="flex items-center space-x-2">
          ${isTop5 ? '<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>' : isQualifying ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>' : ''}
          <span>${eq.nombreEquipo}</span>
        </div>
      </td>
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${promEq}</td>
      <td class="py-3 px-2 text-center font-mono text-amber-300 font-bold">+${eq.hdcpEquipo || 0}</td>
      <td class="py-3 px-2 text-center font-mono text-amber-400 font-bold">+${eq.hdcpBaker || 0}</td>

      <!-- Viernes -->
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${eq.lineasEquipoVie ? eq.lineasEquipoVie[0] || '-' : '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${eq.lineasEquipoVie ? eq.lineasEquipoVie[1] || '-' : '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${eq.lineasEquipoVie ? eq.lineasEquipoVie[2] || '-' : '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${eq.lineasEquipoVie ? eq.lineasEquipoVie[3] || '-' : '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-amber-300 font-bold">${eq.bakerVie || '-'}</td>
      <td class="py-3 px-3 text-right font-mono font-bold text-gray-200">${Number(eq.totVieHdcp || 0).toLocaleString()}</td>

      <!-- Sábado -->
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${eq.lineasEquipoSab ? eq.lineasEquipoSab[0] || '-' : '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${eq.lineasEquipoSab ? eq.lineasEquipoSab[1] || '-' : '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${eq.lineasEquipoSab ? eq.lineasEquipoSab[2] || '-' : '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${eq.lineasEquipoSab ? eq.lineasEquipoSab[3] || '-' : '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-amber-300 font-bold">${eq.bakerSab || '-'}</td>
      <td class="py-3 px-3 text-right font-mono font-bold text-gray-200">${Number(eq.totSabHdcp || 0).toLocaleString()}</td>

      <!-- Gran Total -->
      <td class="py-3 px-4 text-right font-mono font-black text-amber-400 ${isTop5 ? 'text-2xl' : 'text-xl'} bg-amber-500/10">
        ${Number(eq.granTotHdcp || 0).toLocaleString()}
      </td>

      <!-- Estado Finales -->
      <td class="py-3 px-3 text-center text-xs font-bold ${idx < 2 ? 'text-amber-400' : 'text-emerald-400'}">
        ${estadoBaker}
      </td>
    `;
    tbody.appendChild(row);
  });
}

/**
 * RENDER: INDIVIDUAL CATEGORÍA 1 (CON DESGLOSE Y TOP 5 EN GRANDE)
 */
function renderTableCat1() {
  const tbody = document.getElementById('tbodyCat1');
  tbody.innerHTML = '';
  (tournamentData.cat1 || []).forEach((j, idx) => {
    const isTop5 = idx < 5;
    const l = j.lineas || {};

    const row = document.createElement('tr');
    row.className = `transition ${isTop5 ? 'bg-red-950/30 font-bold text-white text-base border-l-4 border-amber-400' : 'hover:bg-brand-border/30 text-gray-300'}`;
    row.innerHTML = `
      <td class="py-3 px-3 text-center font-black font-mono ${idx === 0 ? 'text-amber-400 text-lg' : idx < 3 ? 'text-amber-300' : 'text-gray-400'}">${j.posicion}</td>
      <td class="py-3 px-3 font-extrabold ${isTop5 ? 'text-white' : 'text-gray-200'}">${j.nombreJugador}</td>
      <td class="py-3 px-3 text-xs text-gray-400 truncate max-w-[140px]">${j.nombreEquipo}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-emerald-400 font-bold">${j.promedioTorneo}</td>
      <td class="py-3 px-2 text-center font-mono text-amber-300 font-bold">+${j.hdcp}</td>

      <!-- Viernes -->
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${l.l1 || '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${l.l2 || '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${l.l3 || '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${l.l4 || '-'}</td>
      <td class="py-3 px-3 text-right font-mono font-bold text-gray-200">${j.subVie || 0}</td>

      <!-- Sábado -->
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${l.l5 || '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${l.l6 || '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${l.l7 || '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${l.l8 || '-'}</td>
      <td class="py-3 px-3 text-right font-mono font-bold text-gray-200">${j.subSab || 0}</td>

      <td class="py-3 px-4 text-right font-mono font-black text-amber-400 ${isTop5 ? 'text-xl' : 'text-lg'} bg-amber-500/10">${j.totHdcp || 0}</td>
    `;
    tbody.appendChild(row);
  });
}

/**
 * RENDER: INDIVIDUAL CATEGORÍA 2 (CON DESGLOSE Y TOP 5 EN GRANDE)
 */
function renderTableCat2() {
  const tbody = document.getElementById('tbodyCat2');
  tbody.innerHTML = '';
  (tournamentData.cat2 || []).forEach((j, idx) => {
    const isTop5 = idx < 5;
    const l = j.lineas || {};

    const row = document.createElement('tr');
    row.className = `transition ${isTop5 ? 'bg-red-950/30 font-bold text-white text-base border-l-4 border-amber-400' : 'hover:bg-brand-border/30 text-gray-300'}`;
    row.innerHTML = `
      <td class="py-3 px-3 text-center font-black font-mono ${idx === 0 ? 'text-amber-400 text-lg' : idx < 3 ? 'text-amber-300' : 'text-gray-400'}">${j.posicion}</td>
      <td class="py-3 px-3 font-extrabold ${isTop5 ? 'text-white' : 'text-gray-200'}">${j.nombreJugador}</td>
      <td class="py-3 px-3 text-xs text-gray-400 truncate max-w-[140px]">${j.nombreEquipo}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-emerald-400 font-bold">${j.promedioTorneo}</td>
      <td class="py-3 px-2 text-center font-mono text-amber-300 font-bold">+${j.hdcp}</td>

      <!-- Viernes -->
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${l.l1 || '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${l.l2 || '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${l.l3 || '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${l.l4 || '-'}</td>
      <td class="py-3 px-3 text-right font-mono font-bold text-gray-200">${j.subVie || 0}</td>

      <!-- Sábado -->
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${l.l5 || '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${l.l6 || '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${l.l7 || '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-xs text-gray-400">${l.l8 || '-'}</td>
      <td class="py-3 px-3 text-right font-mono font-bold text-gray-200">${j.subSab || 0}</td>

      <td class="py-3 px-4 text-right font-mono font-black text-amber-400 ${isTop5 ? 'text-xl' : 'text-lg'} bg-amber-500/10">${j.totHdcp || 0}</td>
    `;
    tbody.appendChild(row);
  });
}

/**
 * RENDER: PREMIOS ESPECIALES (MÓVILES / QR)
 */
function renderPremiosGrid() {
  const container = document.getElementById('containerPremiosGrid');
  if (!container) return;

  const p = tournamentData.premios || {};

  const cards = [
    { title: '🥇 Tiro Mayor Equipo (Vie)', score: p.tiroMayorEquipoVie?.maxTiroVieHdcp, name: p.tiroMayorEquipoVie?.nombreEquipo, sub: 'Puntaje c/Handicap' },
    { title: '🥇 Tiro Mayor Equipo (Sáb)', score: p.tiroMayorEquipoSab?.maxTiroSabHdcp, name: p.tiroMayorEquipoSab?.nombreEquipo, sub: 'Puntaje c/Handicap' },
    { title: '🏆 Serie Mayor Equipo (Vie)', score: p.serieMayorEquipoVie?.serieVieHdcp, name: p.serieMayorEquipoVie?.nombreEquipo, sub: 'Serie c/Handicap' },
    { title: '🏆 Serie Mayor Equipo (Sáb)', score: p.serieMayorEquipoSab?.serieSabHdcp, name: p.serieMayorEquipoSab?.nombreEquipo, sub: 'Serie c/Handicap' },
    { title: '⭐ Tiro Mayor Ind. (Vie)', score: p.tiroMayorIndVie?.maxTiroVieHdcp, name: p.tiroMayorIndVie?.nombreJugador, sub: 'Individual c/HDCP' },
    { title: '⭐ Tiro Mayor Ind. (Sáb)', score: p.tiroMayorIndSab?.maxTiroSabHdcp, name: p.tiroMayorIndSab?.nombreJugador, sub: 'Individual c/HDCP' },
    { title: '👑 Serie Mayor Ind. (Vie)', score: p.serieMayorIndVie?.serieVieHdcp, name: p.serieMayorIndVie?.nombreJugador, sub: '4 Líneas c/HDCP' },
    { title: '👑 Serie Mayor Ind. (Sáb)', score: p.serieMayorIndSab?.serieSabHdcp, name: p.serieMayorIndSab?.nombreJugador, sub: '4 Líneas c/HDCP' }
  ];

  container.innerHTML = cards.map(c => `
    <div class="bg-[#0D131F] border border-amber-500/30 p-4 rounded-2xl shadow-xl flex flex-col justify-between">
      <span class="text-xs uppercase tracking-wider font-extrabold text-amber-400">${c.title}</span>
      <div class="my-3">
        <span class="text-3xl font-display font-black text-white">${c.score || 0}</span>
        <p class="text-sm font-bold text-gray-200 mt-1 truncate">${c.name || '-'}</p>
      </div>
      <span class="text-[10px] text-gray-400 border-t border-brand-border pt-2">${c.sub}</span>
    </div>
  `).join('');
}

/**
 * RENDER: FICHA INTERACTIVA POR EQUIPO (MÓVILES / QR)
 */
function populateDetailSelect() {
  const select = document.getElementById('selectDetailEquipo');
  if (!select) return;
  select.innerHTML = '';

  (tournamentData.equipos || []).forEach(eq => {
    const opt = document.createElement('option');
    opt.value = eq.numEquipo;
    opt.innerText = `Equipo ${eq.numEquipo}: ${eq.nombreEquipo}`;
    select.appendChild(opt);
  });
}

function renderEquipoDetailContent() {
  const container = document.getElementById('containerEquipoDetailContent');
  const select = document.getElementById('selectDetailEquipo');
  if (!container || !select) return;

  const numEq = Number(select.value) || 1;
  const eq = (tournamentData.equipos || []).find(e => e.numEquipo === numEq);

  if (!eq) {
    container.innerHTML = '<p class="text-gray-400">Selecciona un equipo de la lista.</p>';
    return;
  }

  container.innerHTML = `
    <div class="space-y-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#0D131F] p-4 rounded-2xl border border-brand-border">
        <div><span class="text-xs text-gray-400">Posición Actual</span><p class="text-2xl font-black text-amber-400">#${eq.posicion}</p></div>
        <div><span class="text-xs text-gray-400">HDCP Equipo</span><p class="text-2xl font-black text-white">+${eq.hdcpEquipo}</p></div>
        <div><span class="text-xs text-gray-400">HDCP Baker (30%)</span><p class="text-2xl font-black text-white">+${eq.hdcpBaker}</p></div>
        <div><span class="text-xs text-gray-400">Gran Total c/HDCP</span><p class="text-2xl font-black text-emerald-400">${Number(eq.granTotHdcp).toLocaleString()}</p></div>
      </div>

      <div class="overflow-x-auto">
        <h3 class="text-lg font-black text-white uppercase mb-2">Desglose Jugadores</h3>
        <table class="w-full text-left text-sm">
          <thead class="bg-[#0D131F] text-gray-400 text-xs uppercase font-mono">
            <tr>
              <th class="py-2 px-3">Jugador</th>
              <th class="py-2 px-2 text-center">Cat</th>
              <th class="py-2 px-2 text-center">HDCP</th>
              <th class="py-2 px-2 text-center">L1</th>
              <th class="py-2 px-2 text-center">L2</th>
              <th class="py-2 px-2 text-center">L3</th>
              <th class="py-2 px-2 text-center">L4</th>
              <th class="py-2 px-2 text-center">L5</th>
              <th class="py-2 px-2 text-center">L6</th>
              <th class="py-2 px-2 text-center">L7</th>
              <th class="py-2 px-2 text-center">L8</th>
              <th class="py-2 px-3 text-right">Total c/HDCP</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-border/40 font-medium">
            ${(eq.jugadores || []).map(j => `
              <tr>
                <td class="py-2.5 px-3 font-bold text-white">${j.nombreJugador}</td>
                <td class="py-2.5 px-2 text-center text-xs text-gray-400">${j.categoria}</td>
                <td class="py-2.5 px-2 text-center font-mono text-amber-300">+${j.hdcp}</td>
                <td class="py-2.5 px-2 text-center font-mono">${j.lineas?.l1 || 0}</td>
                <td class="py-2.5 px-2 text-center font-mono">${j.lineas?.l2 || 0}</td>
                <td class="py-2.5 px-2 text-center font-mono">${j.lineas?.l3 || 0}</td>
                <td class="py-2.5 px-2 text-center font-mono">${j.lineas?.l4 || 0}</td>
                <td class="py-2.5 px-2 text-center font-mono">${j.lineas?.l5 || 0}</td>
                <td class="py-2.5 px-2 text-center font-mono">${j.lineas?.l6 || 0}</td>
                <td class="py-2.5 px-2 text-center font-mono">${j.lineas?.l7 || 0}</td>
                <td class="py-2.5 px-2 text-center font-mono">${j.lineas?.l8 || 0}</td>
                <td class="py-2.5 px-3 text-right font-mono font-bold text-amber-400">${j.totHdcp}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * CARRUSEL AUTOMÁTICO DE 30 SEGUNDOS
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
      if (currentViewIndex === 0) fetchTournamentData();
    }
  }, 1000);
}

function switchView(viewName) {
  const allViews = ['equipos', 'cat1', 'cat2', 'premios', 'equipoDetail'];
  allViews.forEach(v => {
    const el = document.getElementById(`view${capitalize(v)}`);
    const tab = document.getElementById(`tab${capitalize(v)}`);
    if (el && tab) {
      if (v === viewName) {
        el.classList.remove('hidden');
        tab.className = 'px-5 py-2.5 rounded-xl font-display font-black tracking-wider uppercase text-base transition bg-red-600 text-white shadow-lg';
      } else {
        el.classList.add('hidden');
        tab.className = 'px-5 py-2.5 rounded-xl font-display font-black tracking-wider uppercase text-base transition bg-brand-card text-gray-400 hover:text-white border border-brand-border';
      }
    }
  });

  const titles = {
    equipos: 'CUARTETAS (EQUIPOS)',
    cat1: 'INDIVIDUAL CATEGORÍA 1',
    cat2: 'INDIVIDUAL CATEGORÍA 2',
    premios: 'PREMIOS ESPECIALES',
    equipoDetail: 'FICHA POR EQUIPO'
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
  selectTipo.addEventListener('change', toggleCaptureFormType);

  document.getElementById('selectEquipo').addEventListener('change', renderCapturePlayerInputs);

  document.getElementById('formCapture').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitScoreCapture();
  });
}

function toggleCaptureFormType() {
  const isBaker = document.getElementById('selectTipo').value === 'BAKER';
  document.getElementById('containerNumLinea').classList.toggle('hidden', isBaker);
  document.getElementById('containerJugadores').classList.toggle('hidden', isBaker);
  document.getElementById('containerBakerInput').classList.toggle('hidden', !isBaker);

  const playerInputs = document.querySelectorAll('.inputScoreJugador');
  playerInputs.forEach(inp => {
    if (isBaker) {
      inp.removeAttribute('required');
    } else {
      inp.setAttribute('required', 'true');
    }
  });

  const bakerInput = document.getElementById('inputBakerScore');
  if (isBaker) {
    bakerInput.setAttribute('required', 'true');
  } else {
    bakerInput.removeAttribute('required');
  }
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

  const isBaker = document.getElementById('selectTipo').value === 'BAKER';

  eq.jugadores.forEach((j, idx) => {
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between bg-[#0D131F] border border-brand-border p-2.5 rounded-xl';
    div.innerHTML = `
      <div class="truncate mr-2">
        <p class="text-sm font-semibold text-white truncate">${j.nombreJugador}</p>
        <span class="text-[10px] text-gray-400">HDCP: ${j.hdcp} | ${j.categoria}</span>
      </div>
      <input type="number" min="0" max="300" ${isBaker ? '' : 'required'} placeholder="0" data-player-idx="${idx}" class="inputScoreJugador w-20 bg-brand-card border border-brand-border rounded-lg px-2 py-1.5 text-center text-white font-mono font-bold text-lg focus:outline-none focus:border-red-500">
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
      feedback.className = 'text-center text-xs py-2 px-3 rounded-xl font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600';
      feedback.innerText = '✓ Guardado exitosamente. Sincronizando pantallas...';
      await fetchTournamentData();
      setTimeout(() => {
        document.getElementById('modalCapture').classList.add('hidden');
        feedback.classList.add('hidden');
      }, 1500);
    } else {
      feedback.className = 'text-center text-xs py-2 px-3 rounded-xl font-bold bg-red-950/80 text-red-300 border border-red-600';
      feedback.innerText = `Error: ${result.message}`;
    }
  } catch (err) {
    feedback.classList.remove('hidden');
    feedback.className = 'text-center text-xs py-2 px-3 rounded-xl font-bold bg-red-950/80 text-red-300 border border-red-600';
    feedback.innerText = 'Error al comunicar con Google Sheets.';
  } finally {
    btn.disabled = false;
    btn.innerText = 'Guardar y Sincronizar';
  }
}
