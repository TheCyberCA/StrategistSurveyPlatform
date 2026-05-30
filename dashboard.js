/* ================================================================
   CyberCA Intelligence Platform — dashboard.js
   Analytics: loads responses, builds all Chart.js visualisations
   ================================================================ */

'use strict';

/* ── Chart defaults ─────────────────────────────────────────────── */
Chart.defaults.font.family  = "'Outfit', sans-serif";
Chart.defaults.font.size    = 13;
Chart.defaults.color        = '#5eaaa5';
Chart.defaults.plugins.legend.labels.boxWidth = 12;

const TEAL   = ['#0f4c4c','#0d9488','#14b8a6','#5eead4','#99f6e4','#ccfbf1'];
const SWATCH = ['#0d9488','#d97706','#dc2626','#16a34a','#7c3aed','#0f766e'];

/* ── Active charts registry (for destroy on refresh) ───────────── */
const Charts = {};

function destroyChart (id) {
  if (Charts[id]) { Charts[id].destroy(); delete Charts[id]; }
}

/* ================================================================
   LOAD ALL RESPONSES
   Pulls from localStorage (offline) + Apps Script (online)
   ================================================================ */
async function loadAllResponses (surveyId) {
  let responses = [];

  /* 1. Local responses (always available) */
  const keys = Object.keys(localStorage).filter(k => k.startsWith(`resp_${surveyId}_`));
  keys.forEach(k => {
    const r = Storage.get(k);
    if (Array.isArray(r)) responses = responses.concat(r);
  });

  /* 2. Server responses (if connected) */
  try {
    const res = await API.getResponses(surveyId);
    if (res.responses?.length) {
      responses = responses.concat(res.responses);
    }
  } catch (e) { /* offline — use local only */ }

  /* Deduplicate by timestamp + userId */
  const seen = new Set();
  responses = responses.filter(r => {
    const key = `${r.userId}_${r.timestamp}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });

  return responses;
}

/* ================================================================
   OVERVIEW STATS
   ================================================================ */
function renderOverview (responses, surveyId) {
  const unique   = new Set(responses.map(r => r.userId)).size;
  const survey   = Builder.getDefinition(surveyId);
  const qCount   = survey?.questions?.length || 5;
  const complete = responses.filter(r => {
    const qIds = new Set(r.responses?.map(x => x.questionId) || []);
    return qIds.size >= qCount;
  }).length;
  const compRate = unique ? Math.round((complete / unique) * 100) : 0;

  document.getElementById('stat-respondents').textContent  = unique;
  document.getElementById('stat-responses').textContent    = responses.length;
  document.getElementById('stat-completion').textContent   = compRate + '%';
  document.getElementById('stat-survey-name').textContent  = survey?.title || '—';
}

/* ================================================================
   Q1  — Client Servicing Problems
   ================================================================ */
function renderClientProblems (responses) {
  /* Collect all severity counts */
  const sevCount = { low:0, medium:0, high:0, critical:0 };
  const allTexts = [];

  responses.forEach(r => {
    (r.responses || []).filter(x => x.questionId === 'q1_client_problems').forEach(row => {
      if (row.severity) sevCount[row.severity] = (sevCount[row.severity]||0) + 1;
      if (row.text && row.text.trim()) allTexts.push(row.text.trim());
    });
  });

  /* Severity doughnut */
  destroyChart('sev-chart');
  const sevCtx = document.getElementById('sev-chart')?.getContext('2d');
  if (sevCtx && Object.values(sevCount).some(v => v > 0)) {
    Charts['sev-chart'] = new Chart(sevCtx, {
      type : 'doughnut',
      data : {
        labels   : ['Low','Medium','High','Critical'],
        datasets : [{ data: [sevCount.low, sevCount.medium, sevCount.high, sevCount.critical],
          backgroundColor: ['#16a34a','#d97706','#dc2626','#042f2e'],
          borderWidth: 0, hoverOffset: 6 }]
      },
      options : { responsive:true, cutout:'65%',
        plugins:{ legend:{ position:'bottom' } } }
    });
  } else if (sevCtx) {
    sevCtx.canvas.parentElement.innerHTML += '<p class="text-muted text-sm text-center mt-2">No data yet.</p>';
  }

  /* Word/phrase frequency (simple) */
  const freq = {};
  allTexts.forEach(t => {
    t.toLowerCase().replace(/[^a-z\s]/g,'').split(/\s+/).filter(w => w.length > 4).forEach(w => {
      freq[w] = (freq[w] || 0) + 1;
    });
  });
  const top = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10);

  destroyChart('keywords-chart');
  const kwCtx = document.getElementById('keywords-chart')?.getContext('2d');
  if (kwCtx && top.length) {
    Charts['keywords-chart'] = new Chart(kwCtx, {
      type : 'bar',
      data : {
        labels   : top.map(([w]) => w),
        datasets : [{ label:'Frequency', data: top.map(([,c]) => c),
          backgroundColor: TEAL[1], borderRadius: 6, borderSkipped: false }]
      },
      options : { indexAxis:'y', responsive:true,
        plugins:{ legend:{ display:false } },
        scales : { x:{ ticks:{ stepSize:1 }, grid:{ color:'#ccfbf1' } },
                   y:{ grid:{ display:false } } } }
    });
  }

  /* Problem list */
  const listEl = document.getElementById('problems-list');
  if (listEl) {
    if (!allTexts.length) { listEl.innerHTML = '<p class="text-muted text-sm">No responses yet.</p>'; return; }
    const sevColors = { low:'badge-success', medium:'badge-warning', high:'badge-danger', critical:'badge-teal' };
    const items = responses.flatMap(r =>
      (r.responses||[]).filter(x=>x.questionId==='q1_client_problems').map(row => ({
        text: row.text, sev: row.severity, user: r.userName || r.userId
      }))
    ).filter(x => x.text);
    listEl.innerHTML = items.map(x => `
      <div style="padding:0.75rem 0; border-bottom:1px solid var(--color-border-soft);">
        <div class="flex gap-sm" style="margin-bottom:4px; align-items:center;">
          <span class="badge ${sevColors[x.sev]||'badge-gray'}">${x.sev||'—'}</span>
          <span class="text-xs text-muted">${UI.esc(x.user)}</span>
        </div>
        <p class="text-sm">${UI.esc(x.text)}</p>
      </div>
    `).join('');
  }
}

/* ================================================================
   Q2  — Product Opportunity
   ================================================================ */
function renderProductOpportunity (responses) {
  const el = document.getElementById('products-list');
  if (!el) return;

  const items = responses.flatMap(r => {
    const row = (r.responses||[]).find(x => x.questionId==='q2_product_opportunity');
    if (!row) return [];
    return [{
      name     : row.product_name || '—',
      audience : row.target_audience || '—',
      pricing  : row.pricing || '—',
      user     : r.userName || r.userId
    }];
  });

  if (!items.length) { el.innerHTML = '<p class="text-muted text-sm">No responses yet.</p>'; return; }

  el.innerHTML = items.map(x => `
    <div class="card mb-2">
      <div class="flex-between mb-1">
        <p style="font-weight:700; font-size:1rem;">${UI.esc(x.name)}</p>
        <span class="badge badge-teal">${UI.esc(x.user)}</span>
      </div>
      <p class="text-sm text-muted">Target: ${UI.esc(x.audience)}</p>
      ${x.pricing && x.pricing !== '—' ? `<p class="text-sm">Pricing: ${UI.formatINR(x.pricing)} per engagement</p>` : ''}
    </div>
  `).join('');
}

/* ================================================================
   Q3 + Q4  — Revenue Goals
   ================================================================ */
function renderRevenueGoals (responses) {
  const goals2026 = [], goals2030 = [];

  responses.forEach(r => {
    (r.responses||[]).forEach(row => {
      if (row.questionId === 'q3_revenue_2026' && row.monthly_target)
        goals2026.push({ val: parseFloat(row.monthly_target)||0, user: r.userName||r.userId });
      if (row.questionId === 'q4_revenue_2030' && row.annual_target)
        goals2030.push({ val: parseFloat(row.annual_target)||0, user: r.userName||r.userId });
    });
  });

  /* 2026 bar chart */
  destroyChart('rev2026-chart');
  const ctx26 = document.getElementById('rev2026-chart')?.getContext('2d');
  if (ctx26 && goals2026.length) {
    Charts['rev2026-chart'] = new Chart(ctx26, {
      type : 'bar',
      data : {
        labels   : goals2026.map(g => g.user.split('@')[0]),
        datasets : [{ label:'Monthly Target (₹)', data: goals2026.map(g => g.val),
          backgroundColor: TEAL[1], borderRadius: 8, borderSkipped: false }]
      },
      options : { responsive:true,
        plugins:{ legend:{ display:false },
          tooltip:{ callbacks:{ label: ctx => ' ₹' + ctx.raw.toLocaleString('en-IN') } } },
        scales : { y:{ ticks:{ callback: v => '₹'+v.toLocaleString('en-IN') }, grid:{ color:'#ccfbf1' } },
                   x:{ grid:{ display:false } } } }
    });
  }

  /* 2030 bar chart */
  destroyChart('rev2030-chart');
  const ctx30 = document.getElementById('rev2030-chart')?.getContext('2d');
  if (ctx30 && goals2030.length) {
    Charts['rev2030-chart'] = new Chart(ctx30, {
      type : 'bar',
      data : {
        labels   : goals2030.map(g => g.user.split('@')[0]),
        datasets : [{ label:'Annual Target (₹)', data: goals2030.map(g => g.val),
          backgroundColor: TEAL[0], borderRadius: 8, borderSkipped: false }]
      },
      options : { responsive:true,
        plugins:{ legend:{ display:false },
          tooltip:{ callbacks:{ label: ctx => ' ₹' + ctx.raw.toLocaleString('en-IN') } } },
        scales : { y:{ ticks:{ callback: v => '₹'+v.toLocaleString('en-IN') }, grid:{ color:'#ccfbf1' } },
                   x:{ grid:{ display:false } } } }
    });
  }

  /* Summary stats */
  const avg26 = goals2026.length ? Math.round(goals2026.reduce((s,g)=>s+g.val,0)/goals2026.length) : 0;
  const max26 = goals2026.length ? Math.max(...goals2026.map(g=>g.val)) : 0;
  const avg30 = goals2030.length ? Math.round(goals2030.reduce((s,g)=>s+g.val,0)/goals2030.length) : 0;

  const statsEl = document.getElementById('revenue-stats');
  if (statsEl) statsEl.innerHTML = `
    <div class="stat-card">
      <p class="stat-label">Avg Monthly Goal 2026</p>
      <p class="stat-value">${goals2026.length ? UI.formatINR(avg26) : '—'}</p>
    </div>
    <div class="stat-card">
      <p class="stat-label">Highest Monthly Goal 2026</p>
      <p class="stat-value">${goals2026.length ? UI.formatINR(max26) : '—'}</p>
    </div>
    <div class="stat-card">
      <p class="stat-label">Avg Annual Goal 2030</p>
      <p class="stat-value">${goals2030.length ? UI.formatINR(avg30) : '—'}</p>
    </div>
    <div class="stat-card">
      <p class="stat-label">Team Members Responded</p>
      <p class="stat-value stat-accent">${new Set(responses.map(r=>r.userId)).size}</p>
    </div>
  `;
}

/* ================================================================
   Q5  — Corpus Fund
   ================================================================ */
function renderCorpus (responses) {
  const items = responses.flatMap(r => {
    const row = (r.responses||[]).find(x => x.questionId==='q5_corpus_fund');
    if (!row) return [];
    return [{ corpus: parseFloat(row.corpus_total)||0, passive: parseFloat(row.passive_income)||0, year: row.target_year||'—', user: r.userName||r.userId }];
  }).filter(x => x.corpus > 0);

  destroyChart('corpus-chart');
  const ctx = document.getElementById('corpus-chart')?.getContext('2d');
  if (ctx && items.length) {
    Charts['corpus-chart'] = new Chart(ctx, {
      type : 'bar',
      data : {
        labels   : items.map(i => i.user.split('@')[0]),
        datasets : [
          { label:'Corpus Required (₹)', data: items.map(i => i.corpus),  backgroundColor: TEAL[0], borderRadius:6, borderSkipped:false },
          { label:'Monthly Passive Income (₹ × 12)', data: items.map(i => i.passive*12), backgroundColor: TEAL[2], borderRadius:6, borderSkipped:false }
        ]
      },
      options : { responsive:true,
        plugins:{ tooltip:{ callbacks:{ label: ctx => ` ${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}` } } },
        scales : { y:{ ticks:{ callback: v => '₹'+v.toLocaleString('en-IN') }, grid:{ color:'#ccfbf1' } },
                   x:{ grid:{ display:false } } } }
    });
  }

  const el = document.getElementById('corpus-list');
  if (el) {
    el.innerHTML = !items.length ? '<p class="text-muted text-sm">No responses yet.</p>'
      : items.map(x => `
          <div style="padding:0.75rem 0; border-bottom:1px solid var(--color-border-soft);">
            <div class="flex-between">
              <span class="text-sm fw-600">${UI.esc(x.user)}</span>
              <span class="badge badge-teal">Target: ${UI.esc(x.year)}</span>
            </div>
            <p class="text-sm">Corpus: <strong>${UI.formatINR(x.corpus)}</strong>
              · Passive income: ${UI.formatINR(x.passive)}/mo</p>
          </div>`).join('');
  }
}

/* ================================================================
   MASTER RENDER  —  called from dashboard.html after load
   ================================================================ */
async function renderDashboard (surveyId) {
  document.getElementById('dash-loading')?.classList.remove('hidden');
  document.getElementById('dash-content')?.classList.add('hidden');

  const responses = await loadAllResponses(surveyId);

  renderOverview(responses, surveyId);
  renderClientProblems(responses);
  renderProductOpportunity(responses);
  renderRevenueGoals(responses);
  renderCorpus(responses);

  document.getElementById('dash-loading')?.classList.add('hidden');
  document.getElementById('dash-content')?.classList.remove('hidden');

  if (!responses.length) Toast.info('No responses yet. Share the survey link with your team to collect data.');
}
