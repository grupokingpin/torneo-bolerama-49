/**
 * BOLERAMA COYOACAN • TORNEO 49 ANIVERSARIO 2026
 * TV Display & Data Engine (Rendereo Exacto 14 Columnas Individuales)
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

/* RENDER TV CUARTETAS */
function renderTableEquipos() {
  const tbody = document.getElementById('tbodyEquipos');
  if (!tbody) return;
  tbody.innerHTML = '';
  const equipos = tournamentData.equipos || [];

  equipos.forEach((eq, idx) => {
    let estado = idx === 0 ? '🏆 Sembrado #1' : idx === 1 ? '⭐ Sembrado #2' : '⚡ Clasificado';
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
      <td class="py-3 px-3 text-center text-xs font-black ${idx < 2 ? 'text-amber-400' : 'text-emerald-400'}">
        ${estado}
      </td>
    `;
    tbody.appendChild(row);
  });
}

/* RENDER TV INDIVIDUAL CAT 1 (14 COLUMNAS MAPEADAS EXACTAMENTE SIN COLUMNA EQUIPO) */
function renderTableCat1() {
  const tbody = document.getElementById('tbodyCat1');
  if (!tbody) return;
  tbody.innerHTML = '';

  (tournamentData.cat1 || []).forEach((j, idx) => {
    const l = j.lineas || {};
    // Promedio redondeado hacia abajo
    const promTruncado = Math.floor(Number(j.promedioTorneo || 0));

    const row = document.createElement('tr');
    row.className = 'bg-[#18233A] text-white text-lg font-bold hover:bg-[#1E2C4A] border-b border-brand-border';
    
    row.innerHTML = `
      <!-- 1. POS -->
      <td class="py-3 px-2 text-center font-black font-mono text-xl text-amber-400">${j.posicion || (idx + 1)}</td>
      
      <!-- 2. JUGADOR OFICIAL -->
      <td class="py-3 px-3 font-extrabold text-xl text-white whitespace-nowrap">${j.nombreJugador || '-'}</td>
      
      <!-- 3. HDCP -->
      <td class="py-3 px-2 text-center font-mono text-amber-300 font-black">+${j.hdcp || 0}</td>
      
      <!-- 4. PROMEDIO (Redondeado hacia abajo) -->
      <td class="py-3 px-2 text-center font-mono text-emerald-400 font-black text-xl">${promTruncado}</td>
      
      <!-- 5. L1 -->
      <td class="py-3 px-1 text-center font-mono text-gray-300">${l.l1 || '-'}</td>
      
      <!-- 6. L2 -->
      <td class="py-3 px-1 text-center font-mono text-gray-300">${l.l2 || '-'}</td>
      
      <!-- 7. L3 -->
      <td class="py-3 px-1 text-center font-mono text-gray-300">${l.l3 || '-'}</td>
      
      <!-- 8. L4 -->
      <td class="py-3 px-1 text-center font-mono text-gray-300">${l.l4 || '-'}</td>
      
      <!-- 9. L5 -->
      <td class="py-3 px-1 text-center font-mono text-gray-300">${l.l5 || '-'}</td>
      
      <!-- 10. L6 -->
      <td class="py-3 px-1 text-center font-mono text-gray-300">${l.l6 || '-'}</td>
      
      <!-- 11. L7 -->
      <td class="py-3 px-1 text-center font-mono text-gray-300">${l.l7 || '-'}</td>
      
      <!-- 12. L8 -->
      <td class="py-3 px-1 text-center font-mono text-gray-300">${l.l8 || '-'}</td>
      
      <!-- 13. TOTAL SCRATCH -->
      <td class="py-3 px-3 text-right font-mono font-extrabold text-gray-100">${Number(j.totScratch || 0).toLocaleString()}</td>
      
      <!-- 14. TOTAL GENERAL C/HDCP -->
      <td class="py-3 px-4 text-right font-mono font-black text-amber-400 text-2xl bg-amber-500/10">
        ${Number(j.totHdcp || 0).toLocaleString()}
      </td>
    `;
    tbody.appendChild(row);
  });
}

/* RENDER TV INDIVIDUAL CAT 2 (14 COLUMNAS MAPEADAS EXACTAMENTE SIN COLUMNA EQUIPO) */
function renderTableCat2() {
  const tbody = document.getElementById('tbodyCat2');
  if (!tbody) return;
  tbody.innerHTML = '';

  (tournamentData.cat2 || []).forEach((j, idx) => {
    const l = j.lineas || {};
    // Promedio redondeado hacia abajo
    const promTruncado = Math.floor(Number(j.promedioTorneo || 0));

    const row = document.createElement('tr');
    row.className = 'bg-[#18233A] text-white text-lg font-bold hover:bg-[#1E2C4A] border-b border-brand-border';
    
    row.innerHTML = `
      <!-- 1. POS -->
      <td class="py-3 px-2 text-center font-black font-mono text-xl text-amber-400">${j.posicion || (idx + 1)}</td>
      
      <!-- 2. JUGADOR OFICIAL -->
      <td class="py-3 px-3 font-extrabold text-xl text-white whitespace-nowrap">${j.nombreJugador || '-'}</td>
      
      <!-- 3. HDCP -->
      <td class="py-3 px-2 text-center font-mono text-amber-300 font-black">+${j.hdcp || 0}</td>
      
      <!-- 4. PROMEDIO (Redondeado hacia abajo) -->
      <td class="py-3 px-2 text-center font-mono text-emerald-400 font-black text-xl">${promTruncado}</td>
      
      <!-- 5. L1 -->
      <td class="py-3 px-1 text-center font-mono text-gray-300">${l.l1 || '-'}</td>
      
      <!-- 6. L2 -->
      <td class="py-3 px-1 text-center font-mono text-gray-300">${l.l2 || '-'}</td>
      
      <!-- 7. L3 -->
      <td class="py-3 px-1 text-center font-mono text-gray-300">${l.l3 || '-'}</td>
      
      <!-- 8. L4 -->
      <td class="py-3 px-1 text-center font-mono text-gray-300">${l.l4 || '-'}</td>
      
      <!-- 9. L5 -->
      <td class="py-3 px-1 text-center font-mono text-gray-300">${l.l5 || '-'}</td>
      
      <!-- 10. L6 -->
      <td class="py-3 px-1 text-center font-mono text-gray-300">${l.l6 || '-'}</td>
      
      <!-- 11. L7 -->
      <td class="py-3 px-1 text-center font-mono text-gray-300">${l.l7 || '-'}</td>
      
      <!-- 12. L8 -->
      <td class="py-3 px-1 text-center font-mono text-gray-300">${l.l8 || '-'}</td>
      
      <!-- 13. TOTAL SCRATCH -->
      <td class="py-3 px-3 text-right font-mono font-extrabold text-gray-100">${Number(j.totScratch || 0).toLocaleString()}</td>
      
      <!-- 14. TOTAL GENERAL C/HDCP -->
      <td class="py-3 px-4 text-right font-mono font-black text-amber-400 text-2xl bg-amber-500/10">
        ${Number(j.totHdcp || 0).toLocaleString()}
      </td>
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

function initCarousel() {
  setInterval(() => {
    if (isPaused) return;
    carouselTimer--;
    if (progressBar) progressBar.style.width = `${(carouselTimer / CAROUSEL_INTERVAL_SEC) * 100}%`;
    if (timerElem) timerElem.innerText = `00:${carouselTimer.toString().padStart(2, '0')}`;
    if (carouselTimer <= 0) {
      currentViewIndex = (currentViewIndex + 1) % views.length;
      switchView(views[currentViewIndex]);
      carouselTimer = CAROUSEL_INTERVAL_SEC;
      if (progressBar) progressBar.style.width = '100%';
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
        tab.className = 'px-4 py-2 rounded-lg font-display font-black uppercase text-sm bg-red-600 text-white';
      } else {
        el.classList.add('hidden');
        tab.className = 'px-4 py-2 rounded-lg font-display font-black uppercase text-sm bg-[#131B2E] text-gray-400 border border-brand-border';
      }
    }
  });

  const titles = { equipos: 'CUARTETAS (EQUIPOS)', cat1: 'INDIVIDUAL CATEGORÍA 1', cat2: 'INDIVIDUAL CATEGORÍA 2', premios: 'PREMIOS ESPECIALES', equipoDetail: 'FICHA POR EQUIPO' };
  if (currentViewBadge) currentViewBadge.innerText = titles[viewName] || viewName.toUpperCase();
}

function togglePauseCarousel() {
  isPaused = !isPaused;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function initCaptureModal() {
  const modal = document.getElementById('modalCapture');
  const btnOpen = document.getElementById('btnOpenCapture');
  const btnClose = document.getElementById('btnCloseCapture');
  
  if (btnOpen && modal) btnOpen.addEventListener('click', () => modal.classList.remove('hidden'));
  if (btnClose && modal) btnClose.addEventListener('click', () => modal.classList.add('hidden'));

  const selectTipo = document.getElementById('selectTipo');
  if (selectTipo) selectTipo.addEventListener('change', toggleCaptureFormType);
  
  const selectEq = document.getElementById('selectEquipo');
  if (selectEq) selectEq.addEventListener('change', renderCapturePlayerInputs);

  const formCap = document.getElementById('formCapture');
  if (formCap) {
    formCap.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitScoreCapture();
    });
  }
}

function toggleCaptureFormType() {
  const isBaker = document.getElementById('selectTipo').value === 'BAKER';
  const cLinea = document.getElementById('containerNumLinea');
  if (cLinea) cLinea.classList.toggle('hidden', isBaker);
  
  const cJug = document.getElementById('containerJugadores');
  if (cJug) cJug.classList.toggle('hidden', isBaker);
  
  const cBaker = document.getElementById('containerBakerInput');
  if (cBaker) cBaker.classList.toggle('hidden', !isBaker);

  const playerInputs = document.querySelectorAll('.inputScoreJugador');
  playerInputs.forEach(inp => isBaker ? inp.removeAttribute('required') : inp.setAttribute('required', 'true'));
  
  const bakerInput = document.getElementById('inputBakerScore');
  if (bakerInput) isBaker ? bakerInput.setAttribute('required', 'true') : bakerInput.removeAttribute('required');
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
  if (!container || !select) return;
  container.innerHTML = '';
  
  const numEq = Number(select.value);
  const eq = (tournamentData.equipos || []).find(e => e.numEquipo === numEq);
  if (!eq || !eq.jugadores) return;

  const isBaker = document.getElementById('selectTipo').value === 'BAKER';
  eq.jugadores.forEach((j, idx) => {
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between bg-[#0A0E17] border border-brand-border p-2 rounded-xl';
    div.innerHTML = `
      <div class="truncate mr-2">
        <p class="text-xs font-bold text-white truncate">${j.nombreJugador}</p>
        <span class="text-[10px] text-gray-400">HDCP: ${j.hdcp}</span>
      </div>
      <input type="number" min="0" max="300" ${isBaker ? '' : 'required'} placeholder="0" data-player-idx="${idx}" class="inputScoreJugador w-20 bg-[#131B2E] border border-brand-border rounded-lg px-2 py-1 text-center text-white font-mono font-bold text-lg">
    `;
    container.appendChild(div);
  });
}

async function submitScoreCapture() {
  const btn = document.getElementById('btnSubmitCapture');
  const feedback = document.getElementById('captureFeedback');
  if (btn) { btn.disabled = true; btn.innerText = 'Guardando...'; }

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
    const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
    const result = await res.json();
    if (feedback) feedback.classList.remove('hidden');
    if (result.status === 'success') {
      if (feedback) {
        feedback.className = 'text-center text-xs py-2 px-3 rounded-xl font-bold bg-emerald-950 text-emerald-300 border border-emerald-600';
        feedback.innerText = '✓ Guardado correctamente.';
      }
      await fetchTournamentData();
      setTimeout(() => {
        const modal = document.getElementById('modalCapture');
        if (modal) modal.classList.add('hidden');
        if (feedback) feedback.classList.add('hidden');
      }, 1200);
    } else {
      if (feedback) {
        feedback.className = 'text-center text-xs py-2 px-3 rounded-xl font-bold bg-red-950 text-red-300 border border-red-600';
        feedback.innerText = `Error: ${result.message}`;
      }
    }
  } catch (err) {
    if (feedback) {
      feedback.classList.remove('hidden');
      feedback.className = 'text-center text-xs py-2 px-3 rounded-xl font-bold bg-red-950 text-red-300 border border-red-600';
      feedback.innerText = 'Error al comunicar con la base de datos.';
    }
  } finally {
    if (btn) { btn.disabled = false; btn.innerText = 'Guardar y Sincronizar'; }
  }
}
