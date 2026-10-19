/**
 * BOLERAMA COYOACAN • TORNEO 49 ANIVERSARIO 2026
 * TV Display & Data Engine (Ajuste de Columnas Cuartetas)
 */

const API_URL = 'https://script.google.com/macros/s/AKfycbzSsYtxcfCJcxTyat3z6jvd5iYilXxPB8lOc5EgIoVdu8J41BM8u_FMnCie61k1IpWm/exec';

const CAROUSEL_INTERVAL_SEC = 30;
let carouselTimer = CAROUSEL_INTERVAL_SEC;
let isPaused = false;
let currentViewIndex = 0;
const views = ['equipos', 'cat1', 'cat2'];

let tournamentData = { equipos: [], cat1: [], cat2: [], stats: {}, premios: {}, perfectGames: [] };

const timerElem = document.getElementById('carouselTimer');
const progressBar = document.getElementById('carouselProgressBar');
const currentViewBadge = document.getElementById('currentViewBadge');

document.addEventListener('DOMContentLoaded', () => {
  fetchTournamentData();
  initCarousel();
  initCaptureModal();

  const refreshBtn = document.getElementById('btnManualRefresh');
  if (refreshBtn) refreshBtn.addEventListener('click', () => fetchTournamentData(true));
  
  const pauseBtn = document.getElementById('btnPauseCarousel');
  if (pauseBtn) pauseBtn.addEventListener('click', togglePauseCarousel);

  const detailSelect = document.getElementById('selectDetailEquipo');
  if (detailSelect) detailSelect.addEventListener('change', renderEquipoDetailContent);
});

async function fetchTournamentData(manual = false) {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (data.status === 'success') {
      tournamentData = data;
      renderAll();
      populateCaptureSelects();
      populateDetailSelect();
    }
  } catch (err) {
    console.error('Error al conectar con Google Sheets:', err);
  }
}

function renderAll() {
  try { renderKPIs(); } catch(e) { console.error('Error KPI:', e); }
  try { renderPerfectGameAlert(); } catch(e) { console.error('Error Alert:', e); }
  try { renderTableEquipos(); } catch(e) { console.error('Error Equipos:', e); }
  try { renderTableCat1(); } catch(e) { console.error('Error Cat1:', e); }
  try { renderTableCat2(); } catch(e) { console.error('Error Cat2:', e); }
  try { renderPremiosGrid(); } catch(e) { console.error('Error Premios:', e); }
  try { renderEquipoDetailContent(); } catch(e) { console.error('Error Detail:', e); }
}

function renderKPIs() {
  const stats = tournamentData.stats || {};
  const premios = tournamentData.premios || {};

  const elemProm = document.getElementById('kpiPromedioGeneral');
  if (elemProm) elemProm.innerText = stats.promedioGeneral || '0.0';

  const elemPinos = document.getElementById('kpiTotalPinos');
  if (elemPinos) elemPinos.innerText = Number(stats.totalPinos || 0).toLocaleString();

  const tiroEq = premios.tiroMayorEquipoVie || { maxTiroVieHdcp: 0, nombreEquipo: '-' };
  const elemTiroEqScore = document.getElementById('kpiTiroMayorEqScore');
  if (elemTiroEqScore) elemTiroEqScore.innerText = tiroEq.maxTiroVieHdcp || 0;
  const elemTiroEqName = document.getElementById('kpiTiroMayorEqName');
  if (elemTiroEqName) elemTiroEqName.innerText = tiroEq.nombreEquipo || '-';

  const serieEq = premios.serieMayorEquipoVie || { serieVieHdcp: 0, nombreEquipo: '-' };
  const elemSerieEqScore = document.getElementById('kpiSerieMayorEqScore');
  if (elemSerieEqScore) elemSerieEqScore.innerText = serieEq.serieVieHdcp || 0;
  const elemSerieEqName = document.getElementById('kpiSerieMayorEqName');
  if (elemSerieEqName) elemSerieEqName.innerText = serieEq.nombreEquipo || '-';

  const tiroInd = premios.tiroMayorIndVie || { maxTiroVieHdcp: 0, nombreJugador: '-' };
  const elemTiroIndScore = document.getElementById('kpiTiroMayorIndScore');
  if (elemTiroIndScore) elemTiroIndScore.innerText = tiroInd.maxTiroVieHdcp || 0;
  const elemTiroIndName = document.getElementById('kpiTiroMayorIndName');
  if (elemTiroIndName) elemTiroIndName.innerText = tiroInd.nombreJugador || '-';

  const serieInd = premios.serieMayorIndVie || { serieVieHdcp: 0, nombreJugador: '-' };
  const elemSerieIndScore = document.getElementById('kpiSerieMayorIndScore');
  if (elemSerieIndScore) elemSerieIndScore.innerText = serieInd.serieVieHdcp || 0;
  const elemSerieIndName = document.getElementById('kpiSerieMayorIndName');
  if (elemSerieIndName) elemSerieIndName.innerText = serieInd.nombreJugador || '-';
}

function renderPerfectGameAlert() {
  const alertBox = document.getElementById('perfectGameAlert');
  if (!alertBox) return;
  if (tournamentData.perfectGames && tournamentData.perfectGames.length > 0) {
    const pg = tournamentData.perfectGames[0];
    const elemP = document.getElementById('perfectGamePlayer');
    if (elemP) elemP.innerText = pg.jugador;
    const elemT = document.getElementById('perfectGameTeam');
    if (elemT) elemT.innerText = pg.equipo;
    const elemL = document.getElementById('perfectGameLine');
    if (elemL) elemL.innerText = `${pg.linea} (${pg.dia})`;
    alertBox.classList.remove('hidden');
  } else {
    alertBox.classList.add('hidden');
  }
}

/* RENDER TV CUARTETAS (CON DESGLOSE DE ENCABEZADOS EXACTO) */
function renderTableEquipos() {
  const tbody = document.getElementById('tbodyEquipos');
  if (!tbody) return;
  tbody.innerHTML = '';
  const equipos = tournamentData.equipos || [];

  equipos.forEach((eq, idx) => {
    const row = document.createElement('tr');
    row.className = 'bg-[#18233A] text-white text-lg font-bold hover:bg-[#1E2C4A] border-b border-brand-border';
    
    row.innerHTML = `
      <td class="py-3 px-2 text-center font-black font-mono text-xl text-amber-400">${eq.posicion || (idx + 1)}</td>
      <td class="py-3 px-3 font-extrabold text-xl text-white whitespace-nowrap">${eq.nombreEquipo || '-'}</td>
      <td class="py-3 px-2 text-center font-mono text-amber-300 font-black">+${eq.hdcpEquipo || 0}</td>
      <td class="py-3 px-2 text-center font-mono text-amber-400 font-black">+${eq.hdcpBaker || 0}</td>
      <td class="py-3 px-2 text-right font-mono text-gray-300">${Number(eq.scratchVie || 0).toLocaleString()}</td>
      <td class="py-3 px-2 text-center font-mono text-amber-300 font-black">${eq.bakerVie || '-'}</td>
      <td class="py-3 px-3 text-right font-mono font-extrabold text-gray-100">${Number(eq.totVieHdcp || 0).toLocaleString()}</td>
      <td class="py-3 px-2 text-right font-mono text-gray-300">${Number(eq.scratchSab || 0).toLocaleString()}</td>
      <td class="py-3 px-2 text-center font-mono text-amber-300 font-black">${eq.bakerSab || '-'}</td>
      <td class="py-3 px-3 text-right font-mono font-extrabold text-gray-100">${Number(eq.totSabHdcp || 0).toLocaleString()}</td>
      <td class="py-3 px-4 text-right font-mono font-black text-amber-400 text-2xl bg-amber-500/10">
        ${Number(eq.granTotHdcp || 0).toLocaleString()}
      </td>
    `;
    tbody.appendChild(row);
  });
}

/* RENDER TV CAT 1 */
function renderTableCat1() {
  const tbody = document.getElementById('tbodyCat1');
  if (!tbody) return;
  tbody.innerHTML = '';
  (tournamentData.cat1 || []).forEach((j, idx) => {
    const row = document.createElement('tr');
    row.className = 'bg-[#18233A] text-white text-xl font-bold hover:bg-[#1E2C4A] border-b border-brand-border';
    row.innerHTML = `
      <td class="py-4 px-3 text-center font-black font-mono text-2xl text-amber-400">${j.posicion || (idx + 1)}</td>
      <td class="py-4 px-3 font-extrabold text-2xl text-white">${j.nombreJugador || '-'}</td>
      <td class="py-4 px-3 text-base text-gray-300 font-semibold">${j.nombreEquipo || '-'}</td>
      <td class="py-4 px-2 text-center font-mono text-emerald-400 font-black">${j.promedioTorneo || '0'}</td>
      <td class="py-4 px-2 text-center font-mono text-amber-300 font-black">+${j.hdcp || 0}</td>
      <td class="py-4 px-3 text-right font-mono text-gray-300">${j.totScratch || 0}</td>
      <td class="py-4 px-4 text-right font-mono font-black text-amber-400 text-3xl bg-amber-500/10">${j.totHdcp || 0}</td>
    `;
    tbody.appendChild(row);
  });
}

/* RENDER TV CAT 2 */
function renderTableCat2() {
  const tbody = document.getElementById('tbodyCat2');
  if (!tbody) return;
  tbody.innerHTML = '';
  (tournamentData.cat2 || []).forEach((j, idx) => {
    const row = document.createElement('tr');
    row.className = 'bg-[#18233A] text-white text-xl font-bold hover:bg-[#1E2C4A] border-b border-brand-border';
    row.innerHTML = `
      <td class="py-4 px-3 text-center font-black font-mono text-2xl text-amber-400">${j.posicion || (idx + 1)}</td>
      <td class="py-4 px-3 font-extrabold text-2xl text-white">${j.nombreJugador || '-'}</td>
      <td class="py-4 px-3 text-base text-gray-300 font-semibold">${j.nombreEquipo || '-'}</td>
      <td class="py-4 px-2 text-center font-mono text-emerald-400 font-black">${j.promedioTorneo || '0'}</td>
      <td class="py-4 px-2 text-center font-mono text-amber-300 font-black">+${j.hdcp || 0}</td>
      <td class="py-4 px-3 text-right font-mono text-gray-300">${j.totScratch || 0}</td>
      <td class="py-4 px-4 text-right font-mono font-black text-amber-400 text-3xl bg-amber-500/10">${j.totHdcp || 0}</td>
    `;
    tbody.appendChild(row);
  });
}

function renderPremiosGrid() {
  const container = document.getElementById('containerPremiosGrid');
  if (!container) return;
  const p = tournamentData.premios || {};
  const cards = [
    { title: '🥇 Tiro Mayor Equipo', score: p.tiroMayorEquipoVie?.maxTiroVieHdcp, name: p.tiroMayorEquipoVie?.nombreEquipo },
    { title: '🏆 Serie Mayor Equipo', score: p.serieMayorEquipoVie?.serieVieHdcp, name: p.serieMayorEquipoVie?.nombreEquipo },
    { title: '⭐ Tiro Mayor Ind', score: p.tiroMayorIndVie?.maxTiroVieHdcp, name: p.tiroMayorIndVie?.nombreJugador },
    { title: '👑 Serie Mayor Ind', score: p.serieMayorIndVie?.serieVieHdcp, name: p.serieMayorIndVie?.nombreJugador }
  ];
  container.innerHTML = cards.map(c => `
    <div class="bg-[#0A0E17] border border-amber-500/40 p-5 rounded-2xl flex flex-col justify-between">
      <span class="text-xs uppercase font-black text-amber-400">${c.title}</span>
      <div class="my-3">
        <span class="text-4xl font-display font-black text-white">${c.score || 0}</span>
        <p class="text-lg font-black text-amber-300 mt-1 truncate">${c.name || '-'}</p>
      </div>
    </div>
  `).join('');
}

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
  if (!eq) return;

  container.innerHTML = `
    <div class="space-y-4 text-white">
      <div class="grid grid-cols-4 gap-4 bg-[#0A0E17] p-4 rounded-xl border border-brand-border">
        <div><span class="text-xs text-gray-400">Posición</span><p class="text-2xl font-black text-amber-400">#${eq.posicion}</p></div>
        <div><span class="text-xs text-gray-400">HDCP Equipo</span><p class="text-2xl font-black text-white">+${eq.hdcpEquipo}</p></div>
        <div><span class="text-xs text-gray-400">HDCP Baker</span><p class="text-2xl font-black text-white">+${eq.hdcpBaker}</p></div>
        <div><span class="text-xs text-gray-400">Total c/HDCP</span><p class="text-2xl font-black text-emerald-400">${Number(eq.granTotHdcp).toLocaleString()}</p></div>
      </div>
      <table class="w-full text-left text-base">
        <thead class="bg-[#0A0E17] text-gray-400 font-mono text-xs uppercase">
          <tr>
            <th class="py-2 px-3">Jugador</th>
            <th class="py-2 px-2 text-center">Cat</th>
            <th class="py-2 px-2 text-center">HDCP</th>
            <th class="py-2 px-2 text-center">L1</th><th class="py-2 px-2 text-center">L2</th><th class="py-2 px-2 text-center">L3</th><th class="py-2 px-2 text-center">L4</th>
            <th class="py-2 px-2 text-center">L5</th><th class="py-2 px-2 text-center">L6</th><th class="py-2 px-2 text-center">L7</th><th class="py-2 px-2 text-center">L8</th>
            <th class="py-2 px-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-brand-border/40 font-bold">
          ${(eq.jugadores || []).map(j => `
            <tr>
              <td class="py-3 px-3 text-white">${j.nombreJugador}</td>
              <td class="py-3 px-2 text-center text-xs text-gray-400">${j.categoria}</td>
              <td class="py-3 px-2 text-center text-amber-300">+${j.hdcp}</td>
              <td class="py-3 px-2 text-center">${j.lineas?.l1 || 0}</td><td class="py-3 px-2 text-center">${j.lineas?.l2 || 0}</td>
              <td class="py-3 px-2 text-center">${j.lineas?.l3 || 0}</td><td class="py-3 px-2 text-center">${j.lineas?.l4 || 0}</td>
              <td class="py-3 px-2 text-center">${j.lineas?.l5 || 0}</td><td class="py-3 px-2 text-center">${j.lineas?.l6 || 0}</td>
              <td class="py-3 px-2 text-center">${j.lineas?.l7 || 0}</td><td class="py-3 px-2 text-center">${j.lineas?.l8 || 0}</td>
              <td class="py-3 px-3 text-right text-amber-400 font-mono text-xl">${j.totHdcp}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
