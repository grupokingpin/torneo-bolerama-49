/**
 * BOLERAMA COYOACAN • TORNEO 49 Aniversario 2026
 * TV Display & Data Engine (Alineación Pases 300/800 Corregida)
 */

const API_URL = 'https://script.google.com/macros/s/AKfycbzSsYtxcfCJcxTyat3z6jvd5iYilXxPB8lOc5EgIoVdu8J41BM8u_FMnCie61k1IpWm/exec';

let tournamentData = { equipos: [], cat1: [], cat2: [], stats: {}, premios: {}, tableroPremios: null, perfectGames: [] };

const currentViewBadge = document.getElementById('currentViewBadge');

document.addEventListener('DOMContentLoaded', () => {
  fetchTournamentData();
  initCaptureModal();

  const refreshBtn = document.getElementById('btnManualRefresh');
  if (refreshBtn) refreshBtn.addEventListener('click', () => fetchTournamentData(true));

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
  try { renderTableroPremiosDinamico(); } catch(e) { console.error('Error Premios:', e); }
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

/**
 * CINTILLO AMARILLO SUPERIOR (REGLA ESTRICTA):
 * SOLO se muestra si en la hoja de Captura se registró un tiro de 300 real (perfectGames.length > 0).
 */
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

/* RENDER CUARTETAS CON REGLA TOP 28 CLASIFICADOS */
function renderTableEquipos() {
  const tbody = document.getElementById('tbodyEquipos');
  if (!tbody) return;
  tbody.innerHTML = '';
  const equipos = tournamentData.equipos || [];

  equipos.forEach((eq, idx) => {
    const pos = eq.posicion || (idx + 1);
    let estado = '';
    let estadoColor = '';

    if (pos === 1) {
      estado = '🏆 Sembrado #1';
      estadoColor = 'text-amber-400 font-black';
    } else if (pos === 2) {
      estado = '⭐ Sembrado #2';
      estadoColor = 'text-amber-300 font-black';
    } else if (pos <= 28) {
      estado = '⚡ Clasificado';
      estadoColor = 'text-emerald-400 font-bold';
    } else {
      estado = 'Sin clasificar';
      estadoColor = 'text-gray-500 font-normal';
    }

    const row = document.createElement('tr');
    row.className = 'bg-[#18233A] text-white text-lg font-bold hover:bg-[#1E2C4A] border-b border-brand-border';
    
    row.innerHTML = `
      <td class="py-3 px-2 text-center font-black font-mono text-xl text-amber-400">${pos}</td>
      <td class="py-3 px-3 font-extrabold text-xl text-white whitespace-nowrap">${eq.nombreEquipo || '-'}</td>
      <td class="py-3 px-2 text-right font-mono text-gray-300">${Number(eq.scratchVie || 0).toLocaleString()}</td>
      <td class="py-3 px-2 text-center font-mono text-amber-300 font-black">${eq.bakerVie || '-'}</td>
      <td class="py-3 px-3 text-right font-mono font-extrabold text-gray-100">${Number(eq.totVieHdcp || 0).toLocaleString()}</td>
      <td class="py-3 px-2 text-right font-mono text-gray-300">${Number(eq.scratchSab || 0).toLocaleString()}</td>
      <td class="py-3 px-2 text-center font-mono text-amber-300 font-black">${eq.bakerSab || '-'}</td>
      <td class="py-3 px-3 text-right font-mono font-extrabold text-gray-100">${Number(eq.totSabHdcp || 0).toLocaleString()}</td>
      <td class="py-3 px-4 text-right font-mono font-black text-amber-400 text-2xl bg-amber-500/10">
        ${Number(eq.granTotHdcp || 0).toLocaleString()}
      </td>
      <td class="py-3 px-3 text-center text-xs whitespace-nowrap ${estadoColor}">
        ${estado}
      </td>
    `;
    tbody.appendChild(row);
  });
}

/* RENDER INDIVIDUAL CAT 1 */
function renderTableCat1() {
  const tbody = document.getElementById('tbodyCat1');
  if (!tbody) return;
  tbody.innerHTML = '';

  (tournamentData.cat1 || []).forEach((j, idx) => {
    const l = j.lineas || {};
    const promTruncado = Math.floor(Number(j.promedioTorneo || 0));
    const pos = j.posicion || (idx + 1);

    let estatusBuffet = '';
    let estatusColor = '';
    if (pos <= 16) {
      estatusBuffet = '🎯 Elige Rival (Top 16)';
      estatusColor = 'text-amber-400 font-black';
    } else if (pos <= 32) {
      estatusBuffet = '✅ Clasificado Final';
      estatusColor = 'text-emerald-400 font-bold';
    } else {
      estatusBuffet = 'Sin clasificar';
      estatusColor = 'text-gray-500 font-normal';
    }

    const row = document.createElement('tr');
    row.className = 'bg-[#18233A] text-white font-bold hover:bg-[#1E2C4A] border-b border-brand-border';
    
    row.innerHTML = `
      <td class="py-2.5 px-2 text-center font-black font-mono text-lg text-amber-400">${pos}</td>
      <td class="py-2.5 px-2 font-extrabold text-base text-white whitespace-nowrap max-w-[210px] truncate" title="${j.nombreJugador}">
        ${j.nombreJugador || '-'}
      </td>
      <td class="py-2.5 px-2 text-center font-mono text-amber-300 font-black text-base whitespace-nowrap">+${j.hdcp || 0}</td>
      <td class="py-2.5 px-2 text-center font-mono text-emerald-400 font-black text-lg whitespace-nowrap">${promTruncado}</td>
      <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${l.l1 || '-'}</td>
      <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${l.l2 || '-'}</td>
      <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${l.l3 || '-'}</td>
      <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${l.l4 || '-'}</td>
      <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${l.l5 || '-'}</td>
      <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${l.l6 || '-'}</td>
      <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${l.l7 || '-'}</td>
      <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${l.l8 || '-'}</td>
      <td class="py-2.5 px-2.5 text-right font-mono font-extrabold text-gray-100 text-base whitespace-nowrap">${Number(j.totScratch || 0).toLocaleString()}</td>
      <td class="py-2.5 px-3 text-right font-mono font-black text-amber-400 text-xl bg-amber-500/10 whitespace-nowrap">
        ${Number(j.totHdcp || 0).toLocaleString()}
      </td>
      <td class="py-2.5 px-3 text-center text-xs whitespace-nowrap ${estatusColor}">
        ${estatusBuffet}
      </td>
    `;
    tbody.appendChild(row);
  });
}

/* RENDER INDIVIDUAL CAT 2 */
function renderTableCat2() {
  const tbody = document.getElementById('tbodyCat2');
  if (!tbody) return;
  tbody.innerHTML = '';

  (tournamentData.cat2 || []).forEach((j, idx) => {
    const l = j.lineas || {};
    const promTruncado = Math.floor(Number(j.promedioTorneo || 0));
    const pos = j.posicion || (idx + 1);

    let estatusBuffet = '';
    let estatusColor = '';
    if (pos <= 16) {
      estatusBuffet = '🎯 Elige Rival (Top 16)';
      estatusColor = 'text-amber-400 font-black';
    } else if (pos <= 32) {
      estatusBuffet = '✅ Clasificado Final';
      estatusColor = 'text-emerald-400 font-bold';
    } else {
      estatusBuffet = 'Sin clasificar';
      estatusColor = 'text-gray-500 font-normal';
    }

    const row = document.createElement('tr');
    row.className = 'bg-[#18233A] text-white font-bold hover:bg-[#1E2C4A] border-b border-brand-border';
    
    row.innerHTML = `
      <td class="py-2.5 px-2 text-center font-black font-mono text-lg text-amber-400">${pos}</td>
      <td class="py-2.5 px-2 font-extrabold text-base text-white whitespace-nowrap max-w-[210px] truncate" title="${j.nombreJugador}">
        ${j.nombreJugador || '-'}
      </td>
      <td class="py-2.5 px-2 text-center font-mono text-amber-300 font-black text-base whitespace-nowrap">+${j.hdcp || 0}</td>
      <td class="py-2.5 px-2 text-center font-mono text-emerald-400 font-black text-lg whitespace-nowrap">${promTruncado}</td>
      <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${l.l1 || '-'}</td>
      <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${l.l2 || '-'}</td>
      <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${l.l3 || '-'}</td>
      <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${l.l4 || '-'}</td>
      <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${l.l5 || '-'}</td>
      <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${l.l6 || '-'}</td>
      <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${l.l7 || '-'}</td>
      <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${l.l8 || '-'}</td>
      <td class="py-2.5 px-2.5 text-right font-mono font-extrabold text-gray-100 text-base whitespace-nowrap">${Number(j.totScratch || 0).toLocaleString()}</td>
      <td class="py-2.5 px-3 text-right font-mono font-black text-amber-400 text-xl bg-amber-500/10 whitespace-nowrap">
        ${Number(j.totHdcp || 0).toLocaleString()}
      </td>
      <td class="py-2.5 px-3 text-center text-xs whitespace-nowrap ${estatusColor}">
        ${estatusBuffet}
      </td>
    `;
    tbody.appendChild(row);
  });
}

/* RENDER TABLERO OFICIAL DE PREMIOS (100% DINÁMICO DE GOOGLE SHEETS) */
function renderTableroPremiosDinamico() {
  const container = document.getElementById('containerTableroPremiosDinamico');
  if (!container) return;

  const tp = tournamentData.tableroPremios;
  if (!tp) {
    container.innerHTML = '<p class="text-gray-400 p-6 text-center">Cargando premios oficiales desde Google Sheets...</p>';
    return;
  }

  const eq = tp.equipos || {};
  const c1 = tp.cat1 || {};
  const c2 = tp.cat2 || {};
  const jp = tp.juegoPerfecto || {};
  const pases = tp.pases || {};

  // Formato Ganador 300
  const tieneGanador = jp.jugador && jp.jugador.trim() !== '' && !jp.jugador.toLowerCase().includes('pendiente') && !jp.jugador.toLowerCase().includes('concepto');
  const ganador300Texto = tieneGanador
    ? `<span class="text-emerald-400 underline font-extrabold text-2xl">${jp.jugador}</span> • <span class="text-gray-200 font-bold text-xl">${jp.equipo || 'Bolerama Coyoacan'}</span>`
    : `<span class="text-gray-400 italic">Disponible (Pendiente de Tirada)</span>`;

  // Helper para dibujar filas del Podio de 4 columnas (Posición, Ganador, Serie, Premio)
  const renderPodioRow = (item, defaultConcepto, defaultPremio) => {
    const conc = item?.concepto || defaultConcepto;
    const gan = item?.ganador ? `<span class="text-emerald-400 font-bold">${item.ganador}</span>` : '<span class="text-gray-500 font-normal">-</span>';
    const sc = item?.score ? `<span class="font-mono text-gray-200 font-bold">${Number(item.score).toLocaleString()}</span>` : '<span class="text-gray-500">-</span>';
    const pr = item?.premio || defaultPremio;
    return `
      <tr>
        <td class="py-2 px-1 text-white font-medium whitespace-nowrap">${conc}</td>
        <td class="py-2 px-2 truncate max-w-[120px]">${gan}</td>
        <td class="py-2 px-1 text-center">${sc}</td>
        <td class="py-2 px-1 text-right text-amber-400 font-mono font-bold text-sm whitespace-nowrap">${pr}</td>
      </tr>
    `;
  };

  container.innerHTML = `
    <!-- ENCABEZADO OFICIAL DE BOLSA -->
    <div class="bg-[#131B2E] border border-brand-border rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <div class="flex items-center space-x-2">
          <span class="text-xs uppercase tracking-widest font-black text-amber-400">CONVOCATORIA OFICIAL</span>
          <span class="text-xs text-gray-400">• Control de Premiación en Efectivo</span>
        </div>
        <h2 class="text-2xl md:text-3xl font-display font-black uppercase text-white tracking-wide mt-1">
          Tablero Oficial de Premiación
        </h2>
      </div>
      <div class="flex items-center gap-3 bg-[#0A0E17] border border-amber-500/40 px-5 py-3 rounded-2xl">
        <span class="text-xs font-bold text-gray-300 uppercase">Bolsa Oficial Convocatoria:</span>
        <span class="text-2xl md:text-3xl font-mono font-black text-amber-400">${tp.bolsaConvocatoria || '$680,000 MXN'}</span>
      </div>
    </div>

    <!-- SECCIÓN 1: CUARTETAS, CAT 1, CAT 2 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
      
      <!-- CUARTETAS -->
      <div class="bg-[#131B2E] border border-brand-border rounded-2xl p-4 shadow-xl flex flex-col justify-between">
        <div>
          <div class="border-b border-brand-border pb-2.5 mb-3">
            <h3 class="text-base font-display font-black uppercase text-amber-400 flex items-center space-x-2">
              <span>🏆</span>
              <span>Premiación Equipos (Cuartetas)</span>
            </h3>
          </div>
          
          <!-- Podio Cuartetas (C6:D9) -->
          <table class="w-full text-left text-xs mb-4">
            <thead class="bg-[#0A0E17] text-gray-400 uppercase font-mono border-b border-brand-border/60">
              <tr>
                <th class="py-2 px-1">Posición</th>
                <th class="py-2 px-2">Equipo Ganador</th>
                <th class="py-2 px-1 text-center">Serie</th>
                <th class="py-2 px-1 text-right">Premio</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-border/40 font-bold">
              ${renderPodioRow(eq.lugar1, '1er Lugar (Campeón)', '$165,000')}
              ${renderPodioRow(eq.lugar2, '2ndo Lugar (Subcampeón)', '$120,000')}
              ${renderPodioRow(eq.lugar3, '3er Lugar', '$85,000')}
              ${renderPodioRow(eq.lugar4, '4to Lugar', '$40,000')}
            </tbody>
          </table>

          <!-- Mini-tabla Premios Especiales Cuartetas -->
          <div class="bg-[#0A0E17] border border-brand-border rounded-xl p-3 mb-2">
            <p class="text-[11px] font-black uppercase tracking-wider text-red-400 mb-2">Premios Especiales c/HDCP</p>
            <table class="w-full text-left text-xs">
              <tbody class="divide-y divide-brand-border/30">
                <tr>
                  <td class="py-1.5 text-gray-400 font-medium whitespace-nowrap">Tiro Mayor Vie:</td>
                  <td class="py-1.5 px-2 text-emerald-400 font-bold truncate max-w-[110px]" title="${eq.tiroVie?.equipo}">${eq.tiroVie?.equipo}</td>
                  <td class="py-1.5 px-1 text-center font-mono text-gray-200">(${eq.tiroVie?.score})</td>
                  <td class="py-1.5 text-right font-mono text-amber-400 font-bold">${eq.tiroVie?.premio}</td>
                </tr>
                <tr>
                  <td class="py-1.5 text-gray-400 font-medium whitespace-nowrap">Tiro Mayor Sáb:</td>
                  <td class="py-1.5 px-2 text-emerald-400 font-bold truncate max-w-[110px]" title="${eq.tiroSab?.equipo}">${eq.tiroSab?.equipo}</td>
                  <td class="py-1.5 px-1 text-center font-mono text-gray-200">(${eq.tiroSab?.score})</td>
                  <td class="py-1.5 text-right font-mono text-amber-400 font-bold">${eq.tiroSab?.premio}</td>
                </tr>
                <tr>
                  <td class="py-1.5 text-gray-400 font-medium whitespace-nowrap">Serie Mayor Vie:</td>
                  <td class="py-1.5 px-2 text-emerald-400 font-bold truncate max-w-[110px]" title="${eq.serieVie?.equipo}">${eq.serieVie?.equipo}</td>
                  <td class="py-1.5 px-1 text-center font-mono text-gray-200">(${eq.serieVie?.score})</td>
                  <td class="py-1.5 text-right font-mono text-amber-400 font-bold">${eq.serieVie?.premio}</td>
                </tr>
                <tr>
                  <td class="py-1.5 text-gray-400 font-medium whitespace-nowrap">Serie Mayor Sáb:</td>
                  <td class="py-1.5 px-2 text-emerald-400 font-bold truncate max-w-[110px]" title="${eq.serieSab?.equipo}">${eq.serieSab?.equipo}</td>
                  <td class="py-1.5 px-1 text-center font-mono text-gray-200">(${eq.serieSab?.score})</td>
                  <td class="py-1.5 text-right font-mono text-amber-400 font-bold">${eq.serieSab?.premio}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="border-t border-brand-border pt-2 flex justify-between items-center text-xs font-black">
          <span class="text-gray-400 uppercase">Subtotal Equipos:</span>
          <span class="text-amber-400 font-mono text-base">${eq.subtotal}</span>
        </div>
      </div>

      <!-- CAT 1 -->
      <div class="bg-[#131B2E] border border-brand-border rounded-2xl p-4 shadow-xl flex flex-col justify-between">
        <div>
          <div class="border-b border-brand-border pb-2.5 mb-3">
            <h3 class="text-base font-display font-black uppercase text-amber-400 flex items-center space-x-2">
              <span>🥇</span>
              <span>Individual Cat 1 (191 a 220)</span>
            </h3>
          </div>
          
          <!-- Podio Cat 1 (H6:I9) -->
          <table class="w-full text-left text-xs mb-4">
            <thead class="bg-[#0A0E17] text-gray-400 uppercase font-mono border-b border-brand-border/60">
              <tr>
                <th class="py-2 px-1">Posición</th>
                <th class="py-2 px-2">Jugador Ganador</th>
                <th class="py-2 px-1 text-center">Serie</th>
                <th class="py-2 px-1 text-right">Premio</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-border/40 font-bold">
              ${renderPodioRow(c1.lugar1, '1er Lugar (Campeón)', '$38,000')}
              ${renderPodioRow(c1.lugar2, '2ndo Lugar (Subcampeón)', '$30,000')}
              ${renderPodioRow(c1.lugar3, '3er Lugar', '$20,000')}
              ${renderPodioRow(c1.lugar4, '4to Lugar', '$10,000')}
            </tbody>
          </table>

          <!-- Mini-tabla Premios Especiales Cat 1 -->
          <div class="bg-[#0A0E17] border border-brand-border rounded-xl p-3 mb-2">
            <p class="text-[11px] font-black uppercase tracking-wider text-amber-400 mb-2">Premios Especiales c/HDCP</p>
            <table class="w-full text-left text-xs">
              <tbody class="divide-y divide-brand-border/30">
                <tr>
                  <td class="py-1.5 text-gray-400 font-medium whitespace-nowrap">Tiro Mayor Vie:</td>
                  <td class="py-1.5 px-2 text-emerald-400 font-bold truncate max-w-[110px]" title="${c1.tiroVie?.jugador}">${c1.tiroVie?.jugador}</td>
                  <td class="py-1.5 px-1 text-center font-mono text-gray-200">(${c1.tiroVie?.score})</td>
                  <td class="py-1.5 text-right font-mono text-amber-400 font-bold">${c1.tiroVie?.premio}</td>
                </tr>
                <tr>
                  <td class="py-1.5 text-gray-400 font-medium whitespace-nowrap">Tiro Mayor Sáb:</td>
                  <td class="py-1.5 px-2 text-emerald-400 font-bold truncate max-w-[110px]" title="${c1.tiroSab?.jugador}">${c1.tiroSab?.jugador}</td>
                  <td class="py-1.5 px-1 text-center font-mono text-gray-200">(${c1.tiroSab?.score})</td>
                  <td class="py-1.5 text-right font-mono text-amber-400 font-bold">${c1.tiroSab?.premio}</td>
                </tr>
                <tr>
                  <td class="py-1.5 text-gray-400 font-medium whitespace-nowrap">Serie Mayor Vie:</td>
                  <td class="py-1.5 px-2 text-emerald-400 font-bold truncate max-w-[110px]" title="${c1.serieVie?.jugador}">${c1.serieVie?.jugador}</td>
                  <td class="py-1.5 px-1 text-center font-mono text-gray-200">(${c1.serieVie?.score})</td>
                  <td class="py-1.5 text-right font-mono text-amber-400 font-bold">${c1.serieVie?.premio}</td>
                </tr>
                <tr>
                  <td class="py-1.5 text-gray-400 font-medium whitespace-nowrap">Serie Mayor Sáb:</td>
                  <td class="py-1.5 px-2 text-emerald-400 font-bold truncate max-w-[110px]" title="${c1.serieSab?.jugador}">${c1.serieSab?.jugador}</td>
                  <td class="py-1.5 px-1 text-center font-mono text-gray-200">(${c1.serieSab?.score})</td>
                  <td class="py-1.5 text-right font-mono text-amber-400 font-bold">${c1.serieSab?.premio}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="border-t border-brand-border pt-2 flex justify-between items-center text-xs font-black">
          <span class="text-gray-400 uppercase">Subtotal Cat 1:</span>
          <span class="text-amber-400 font-mono text-base">${c1.subtotal}</span>
        </div>
      </div>

      <!-- CAT 2 -->
      <div class="bg-[#131B2E] border border-brand-border rounded-2xl p-4 shadow-xl flex flex-col justify-between">
        <div>
          <div class="border-b border-brand-border pb-2.5 mb-3">
            <h3 class="text-base font-display font-black uppercase text-amber-400 flex items-center space-x-2">
              <span>🥇</span>
              <span>Individual Cat 2 (160 a 190)</span>
            </h3>
          </div>
          
          <!-- Podio Cat 2 (M6:N9) -->
          <table class="w-full text-left text-xs mb-4">
            <thead class="bg-[#0A0E17] text-gray-400 uppercase font-mono border-b border-brand-border/60">
              <tr>
                <th class="py-2 px-1">Posición</th>
                <th class="py-2 px-2">Jugador Ganador</th>
                <th class="py-2 px-1 text-center">Serie</th>
                <th class="py-2 px-1 text-right">Premio</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-border/40 font-bold">
              ${renderPodioRow(c2.lugar1, '1er Lugar (Campeón)', '$38,000')}
              ${renderPodioRow(c2.lugar2, '2ndo Lugar (Subcampeón)', '$30,000')}
              ${renderPodioRow(c2.lugar3, '3er Lugar', '$20,000')}
              ${renderPodioRow(c2.lugar4, '4to Lugar', '$10,000')}
            </tbody>
          </table>

          <!-- Mini-tabla Premios Especiales Cat 2 -->
          <div class="bg-[#0A0E17] border border-brand-border rounded-xl p-3 mb-2">
            <p class="text-[11px] font-black uppercase tracking-wider text-amber-400 mb-2">Premios Especiales c/HDCP</p>
            <table class="w-full text-left text-xs">
              <tbody class="divide-y divide-brand-border/30">
                <tr>
                  <td class="py-1.5 text-gray-400 font-medium whitespace-nowrap">Tiro Mayor Vie:</td>
                  <td class="py-1.5 px-2 text-emerald-400 font-bold truncate max-w-[110px]" title="${c2.tiroVie?.jugador}">${c2.tiroVie?.jugador}</td>
                  <td class="py-1.5 px-1 text-center font-mono text-gray-200">(${c2.tiroVie?.score})</td>
                  <td class="py-1.5 text-right font-mono text-amber-400 font-bold">${c2.tiroVie?.premio}</td>
                </tr>
                <tr>
                  <td class="py-1.5 text-gray-400 font-medium whitespace-nowrap">Tiro Mayor Sáb:</td>
                  <td class="py-1.5 px-2 text-emerald-400 font-bold truncate max-w-[110px]" title="${c2.tiroSab?.jugador}">${c2.tiroSab?.jugador}</td>
                  <td class="py-1.5 px-1 text-center font-mono text-gray-200">(${c2.tiroSab?.score})</td>
                  <td class="py-1.5 text-right font-mono text-amber-400 font-bold">${c2.tiroSab?.premio}</td>
                </tr>
                <tr>
                  <td class="py-1.5 text-gray-400 font-medium whitespace-nowrap">Serie Mayor Vie:</td>
                  <td class="py-1.5 px-2 text-emerald-400 font-bold truncate max-w-[110px]" title="${c2.serieVie?.jugador}">${c2.serieVie?.jugador}</td>
                  <td class="py-1.5 px-1 text-center font-mono text-gray-200">(${c2.serieVie?.score})</td>
                  <td class="py-1.5 text-right font-mono text-amber-400 font-bold">${c2.serieVie?.premio}</td>
                </tr>
                <tr>
                  <td class="py-1.5 text-gray-400 font-medium whitespace-nowrap">Serie Mayor Sáb:</td>
                  <td class="py-1.5 px-2 text-emerald-400 font-bold truncate max-w-[110px]" title="${c2.serieSab?.jugador}">${c2.serieSab?.jugador}</td>
                  <td class="py-1.5 px-1 text-center font-mono text-gray-200">(${c2.serieSab?.score})</td>
                  <td class="py-1.5 text-right font-mono text-amber-400 font-bold">${c2.serieSab?.premio}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="border-t border-brand-border pt-2 flex justify-between items-center text-xs font-black">
          <span class="text-gray-400 uppercase">Subtotal Cat 2:</span>
          <span class="text-amber-400 font-mono text-base">${c2.subtotal}</span>
        </div>
      </div>

    </div>

    <!-- SECCIÓN 2: BONO AL JUEGO PERFECTO (300) - LECTURA DIRECTA DE LA CELDA AMARILLA -->
    <div class="bg-gradient-to-r from-amber-950/40 via-[#131B2E] to-amber-950/40 border-2 border-amber-500/50 rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
      <div class="flex items-center space-x-4">
        <div class="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center font-display text-3xl font-black text-black shadow-lg">
          300
        </div>
        <div>
          <span class="text-xs font-black uppercase text-amber-400 tracking-wider">PREMIO AL PRIMER JUEGO PERFECTO (LÍNEA 300 SCRATCH)</span>
          <h3 class="text-xl md:text-2xl font-black text-white mt-0.5">
            Ganador: ${ganador300Texto}
          </h3>
          <p class="text-xs text-gray-400 mt-1">${jp.dia ? `Registrado • ${jp.dia}` : 'Pendiente de Registro en Ronda Oficial'}</p>
        </div>
      </div>
      <div class="text-center md:text-right bg-[#0A0E17] border border-amber-500/40 px-6 py-3 rounded-2xl">
        <span class="text-[11px] font-bold text-gray-400 uppercase">Bolsa Entregada</span>
        <p class="text-3xl font-mono font-black text-amber-400">${jp.premio}</p>
      </div>
    </div>

    <!-- SECCIÓN 3: CLASIFICADOS AL TORNEO DEL 300 / 800 (DICIEMBRE 2026) -->
    <div class="bg-[#131B2E] border border-brand-border rounded-2xl p-5 shadow-2xl">
      <div class="border-b border-brand-border pb-3 mb-4">
        <h3 class="text-lg font-display font-black uppercase text-cyan-400 flex items-center space-x-2">
          <span>🎟️</span>
          <span>Clasificados al Torneo del 300 / 800 (Diciembre 2026 — Bolerama Coyoacán)</span>
        </h3>
        <p class="text-xs text-gray-400 mt-0.5">
          * Convocatoria Oficial: Los 4 integrantes del equipo campeón y los 2 campeones individuales obtienen su pase directo.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <!-- Cuarteta Campeona -->
        <div class="bg-[#0A0E17] border border-brand-border rounded-xl p-3.5 flex flex-col justify-between">
          <span class="text-[11px] font-black uppercase text-amber-400 mb-2">Cuarteta Campeona: ${pases.nombreCuarteta || 'DIRAC TEAM'}</span>
          <div class="space-y-1.5 text-gray-300 font-semibold">
            <p>• Titular 1: <strong class="text-emerald-400 text-sm">${pases.cuarteta?.[0] || 'Ricardo Arrioja'}</strong></p>
            <p>• Titular 2: <strong class="text-emerald-400 text-sm">${pases.cuarteta?.[1] || 'Gerardo Arrioja'}</strong></p>
            <p>• Titular 3: <strong class="text-emerald-400 text-sm">${pases.cuarteta?.[2] || 'Rodrigo Martin del Campo'}</strong></p>
            <p>• Titular 4: <strong class="text-emerald-400 text-sm">${pases.cuarteta?.[3] || 'Jose Corpeño'}</strong></p>
          </div>
          <span class="text-[10px] text-gray-400 border-t border-brand-border/60 pt-2 mt-2">Sede: Bolerama Coyoacán • Dic 2026</span>
        </div>

        <!-- Campeón Individual Cat 1 -->
        <div class="bg-[#0A0E17] border border-brand-border rounded-xl p-3.5 flex flex-col justify-between">
          <span class="text-[11px] font-black uppercase text-emerald-400 mb-2">Campeón Individual Cat 1 (191-220)</span>
          <div class="space-y-1 text-gray-300 font-semibold">
            <p class="text-xs text-gray-400">Jugador Ganador:</p>
            <p class="text-base font-black text-emerald-400">${pases.cat1?.jugador || 'Gerardo Arrioja'}</p>
            <p class="text-gray-300 text-xs mt-1">Categoría: ${pases.cat1?.categoria || 'Categoría 1 (191 a 220)'}</p>
            <p class="text-amber-400 font-bold mt-1">Pase Oficial: ${pases.cat1?.pase || 'Clasificado Oficial al 300/800'}</p>
          </div>
          <span class="text-[10px] text-gray-400 border-t border-brand-border/60 pt-2 mt-2">Sede: Bolerama Coyoacán • Dic 2026</span>
        </div>

        <!-- Campeón Individual Cat 2 -->
        <div class="bg-[#0A0E17] border border-brand-border rounded-xl p-3.5 flex flex-col justify-between">
          <span class="text-[11px] font-black uppercase text-emerald-400 mb-2">Campeón Individual Cat 2 (160-190)</span>
          <div class="space-y-1 text-gray-300 font-semibold">
            <p class="text-xs text-gray-400">Jugador Ganador:</p>
            <p class="text-base font-black text-emerald-400">${pases.cat2?.jugador || 'Jorge Frausto Garduño'}</p>
            <p class="text-gray-300 text-xs mt-1">Categoría: ${pases.cat2?.categoria || 'Categoría 2 (160 a 190)'}</p>
            <p class="text-amber-400 font-bold mt-1">Pase Oficial: ${pases.cat2?.pase || 'Clasificado Oficial al 300/800'}</p>
          </div>
          <span class="text-[10px] text-gray-400 border-t border-brand-border/60 pt-2 mt-2">Sede: Bolerama Coyoacán • Dic 2026</span>
        </div>
      </div>
    </div>
  `;
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
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0A0E17] p-3 rounded-xl border border-brand-border">
        <div><span class="text-[11px] text-gray-400 font-bold uppercase">Posición</span><p class="text-2xl font-black text-amber-400">#${eq.posicion}</p></div>
        <div><span class="text-[11px] text-gray-400 font-bold uppercase">HDCP Equipo</span><p class="text-2xl font-black text-white">+${eq.hdcpEquipo}</p></div>
        <div><span class="text-[11px] text-gray-400 font-bold uppercase">HDCP Baker</span><p class="text-2xl font-black text-white">+${eq.hdcpBaker}</p></div>
        <div><span class="text-[11px] text-gray-400 font-bold uppercase">Total c/HDCP</span><p class="text-2xl font-black text-emerald-400">${Number(eq.granTotHdcp).toLocaleString()}</p></div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-[#0A0E17] text-gray-300 font-mono text-xs uppercase border-b border-brand-border">
            <tr>
              <th class="py-2.5 px-2 font-black whitespace-nowrap">JUGADOR</th>
              <th class="py-2.5 px-1.5 text-center font-black">L1</th>
              <th class="py-2.5 px-1.5 text-center font-black">L2</th>
              <th class="py-2.5 px-1.5 text-center font-black">L3</th>
              <th class="py-2.5 px-1.5 text-center font-black">L4</th>
              <th class="py-2.5 px-1.5 text-center font-black">L5</th>
              <th class="py-2.5 px-1.5 text-center font-black">L6</th>
              <th class="py-2.5 px-1.5 text-center font-black">L7</th>
              <th class="py-2.5 px-1.5 text-center font-black">L8</th>
              <th class="py-2.5 px-3 text-right text-amber-400 font-black whitespace-nowrap">TOTAL C/HDCP</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-border/40 font-bold">
            ${(eq.jugadores || []).map(j => `
              <tr class="hover:bg-[#1E2C4A]">
                <td class="py-2.5 px-2 text-white font-extrabold whitespace-nowrap max-w-[200px] truncate" title="${j.nombreJugador}">
                  ${j.nombreJugador}
                </td>
                <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${j.lineas?.l1 || 0}</td>
                <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${j.lineas?.l2 || 0}</td>
                <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${j.lineas?.l3 || 0}</td>
                <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${j.lineas?.l4 || 0}</td>
                <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${j.lineas?.l5 || 0}</td>
                <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${j.lineas?.l6 || 0}</td>
                <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${j.lineas?.l7 || 0}</td>
                <td class="py-2.5 px-1.5 text-center font-mono text-gray-300 text-sm">${j.lineas?.l8 || 0}</td>
                <td class="py-2.5 px-3 text-right text-amber-400 font-mono text-lg font-black whitespace-nowrap bg-amber-500/5">
                  ${Number(j.totHdcp || 0).toLocaleString()}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
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

  const titles = {
    equipos: 'CUARTETAS (EQUIPOS)',
    cat1: 'INDIVIDUAL CATEGORÍA 1',
    cat2: 'INDIVIDUAL CATEGORÍA 2',
    premios: 'TABLERO DE PREMIACIÓN',
    equipoDetail: 'FICHA X EQUIPO'
  };
  if (currentViewBadge) currentViewBadge.innerText = titles[viewName] || viewName.toUpperCase();
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
