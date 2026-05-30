/* ================================================================
   CyberCA Intelligence Platform — survey-builder.js
   Holds: built-in survey definitions · admin builder UI logic
   ================================================================ */

/* ── Built-in survey list (shown on index page fallback) ────────── */
const BUILT_IN_SURVEYS_LIST = [
  {
    id            : 'strategy2026',
    title         : 'Team Strategy 2026–2030',
    description   : 'Share your insights on client servicing, product opportunities, revenue goals, and long-term financial targets.',
    status        : 'active',
    questionCount : 5,
    createdAt     : Date.now()
  }
];

/* ── The 5 strategic question definitions ───────────────────────── */
const SURVEY_DEFINITIONS = {

  'strategy2026' : {
    id          : 'strategy2026',
    title       : 'Team Strategy 2026–2030',
    description : 'Share your insights on client servicing, product opportunities, revenue goals, and long-term financial targets.',
    status      : 'active',
    questions   : [

      /* ── Q1 ── Client Servicing Problems ─────────────────────── */
      {
        id              : 'q1_client_problems',
        order           : 1,
        type            : 'multiresponse',
        category        : 'Client Servicing',
        title           : 'Problems Faced in Client Servicing',
        prompt          : 'List all the problems, bottlenecks, inefficiencies, recurring issues, or frustrations you face in client servicing. Add as many entries as you need.',
        placeholder     : 'Describe a specific problem or challenge in detail…',
        hasVoice        : true,
        isRequired      : true,
        hasSeverity     : true,
        severityLevels  : ['low','medium','high','critical'],
        minEntries      : 1,
        maxEntries      : 20
      },

      /* ── Q2 ── Product / Service Opportunity ─────────────────── */
      {
        id          : 'q2_product_opportunity',
        order       : 2,
        type        : 'structured',
        category    : 'Product Opportunity',
        title       : 'Expertise-Based Product Opportunity',
        prompt      : 'What ONE product, service, system, or expertise-driven offering can you build and focus on as your scalable core "assembly line"? Fill in each field below.',
        hasVoice    : true,
        isRequired  : true,
        subfields   : [
          { id:'product_name',    label:'Product / Service Name',              type:'text',     placeholder:'e.g. GST Compliance Audit Package',                         required:true },
          { id:'target_audience', label:'Target Audience',                     type:'text',     placeholder:'e.g. SME manufacturers in Maharashtra'                              },
          { id:'pricing',         label:'Pricing Estimate per Engagement (₹)', type:'currency', placeholder:'0'                                                                  },
          { id:'scalability',     label:'Scalability Potential',               type:'textarea', placeholder:'How many clients can this serve per month without proportional effort increase?' },
          { id:'resources',       label:'Resources Required',                  type:'textarea', placeholder:'Team, tools, time, certifications or investments needed…'            },
          { id:'time_to_launch',  label:'Estimated Time to Launch',            type:'text',     placeholder:'e.g. 3 months'                                                      }
        ]
      },

      /* ── Q3 ── Revenue Goal 2026 ──────────────────────────────── */
      {
        id          : 'q3_revenue_2026',
        order       : 3,
        type        : 'structured',
        category    : 'Revenue Goal 2026',
        title       : 'Monthly Revenue Goal by End of 2026',
        prompt      : 'What monthly revenue do you want to consistently earn by December 2026? Fill in your target and supporting details.',
        hasVoice    : true,
        isRequired  : true,
        subfields   : [
          { id:'monthly_target',  label:'Monthly Revenue Target (₹)',     type:'currency', placeholder:'0',    required:true },
          { id:'current_revenue', label:'Current Monthly Revenue (₹)',    type:'currency', placeholder:'0'                  },
          { id:'milestone_mid',   label:'Mid-2026 Monthly Milestone (₹)', type:'currency', placeholder:'0'                  },
          { id:'milestone_end',   label:'End-2026 Monthly Milestone (₹)', type:'currency', placeholder:'0'                  },
          { id:'notes',           label:'Notes & Key Assumptions',        type:'textarea', placeholder:'What must change to reach this target? Key initiatives, new clients, practice areas…' }
        ]
      },

      /* ── Q4 ── Revenue Goal 2030 ──────────────────────────────── */
      {
        id              : 'q4_revenue_2030',
        order           : 4,
        type            : 'multiresponse',
        category        : 'Revenue Goal 2030',
        title           : 'Revenue Goal by End of 2030',
        prompt          : 'What revenue target do you want to achieve by December 2030? You can describe multiple strategic paths — add one entry per distinct strategy.',
        hasVoice        : true,
        isRequired      : true,
        hasSeverity     : false,
        multiLabel      : 'Strategic Path',
        subfields       : [
          { id:'annual_target',  label:'Annual Revenue Target (₹)',   type:'currency', placeholder:'0',   required:true },
          { id:'monthly_equiv',  label:'Monthly Equivalent (₹)',      type:'currency', placeholder:'0'                 },
          { id:'strategy_desc',  label:'How will you achieve this?',  type:'textarea', placeholder:'Practice areas, team size, geographies, service lines, partnerships…' }
        ]
      },

      /* ── Q5 ── Corpus Fund ────────────────────────────────────── */
      {
        id          : 'q5_corpus_fund',
        order       : 5,
        type        : 'structured',
        category    : 'Corpus Fund',
        title       : 'Ideal Corpus Fund',
        prompt      : 'What corpus fund or financial reserve would fully take care of you and your family — even if you stopped actively earning money tomorrow?',
        hasVoice    : true,
        isRequired  : true,
        subfields   : [
          { id:'corpus_total',    label:'Total Corpus Required (₹)',         type:'currency', placeholder:'0',    required:true },
          { id:'monthly_expense', label:'Expected Monthly Household Expense (₹)', type:'currency', placeholder:'0' },
          { id:'passive_income',  label:'Expected Passive Income per Month (₹)',  type:'currency', placeholder:'0' },
          { id:'inflation_rate',  label:'Assumed Inflation Rate (% per year)',     type:'number',   placeholder:'6'  },
          { id:'target_year',     label:'Target Year to Achieve Full Corpus',      type:'text',     placeholder:'e.g. 2035' },
          { id:'lifestyle',       label:'Lifestyle Description',                   type:'textarea', placeholder:'Describe expected lifestyle, travel, housing, and monthly expenses in retirement…' },
          { id:'family_resp',     label:'Family Responsibilities',                 type:'textarea', placeholder:"Children's education, dependent parents, major upcoming expenses, healthcare…" }
        ]
      }
    ]
  }
};

/* ================================================================
   ADMIN SURVEY BUILDER  — used only in admin.html
   ================================================================ */
const Builder = {

  /* Current survey being edited */
  _current : null,

  /* Load all surveys from storage + built-ins */
  loadAll () {
    const stored = Storage.get('cyberca_surveys') || [];
    const ids    = stored.map(s => s.id);
    /* Merge built-ins if not already present */
    BUILT_IN_SURVEYS_LIST.forEach(s => { if (!ids.includes(s.id)) stored.unshift(s); });
    return stored;
  },

  /* Get full survey definition (with questions) */
  getDefinition (id) {
    const custom = Storage.get(`survey_def_${id}`);
    if (custom) return custom;
    return SURVEY_DEFINITIONS[id] || null;
  },

  /* Save a survey definition locally */
  saveDefinition (def) {
    Storage.set(`survey_def_${def.id}`, def);
    /* Update the list */
    const list = Builder.loadAll();
    const idx  = list.findIndex(s => s.id === def.id);
    const meta = { id: def.id, title: def.title, description: def.description, status: def.status, questionCount: def.questions?.length || 0, createdAt: def.createdAt || Date.now() };
    if (idx >= 0) list[idx] = meta; else list.unshift(meta);
    Storage.set('cyberca_surveys', list);
  },

  /* Create a new blank survey */
  createNew () {
    return {
      id          : Links.generateId(),
      title       : 'Untitled Survey',
      description : '',
      status      : 'active',
      createdAt   : Date.now(),
      questions   : []
    };
  },

  /* Duplicate an existing survey */
  duplicate (id) {
    const src = Builder.getDefinition(id);
    if (!src) return null;
    const copy = JSON.parse(JSON.stringify(src));
    copy.id        = Links.generateId();
    copy.title     = copy.title + ' (Copy)';
    copy.createdAt = Date.now();
    Builder.saveDefinition(copy);
    return copy;
  },

  /* Delete a survey */
  delete (id) {
    const list = Builder.loadAll().filter(s => s.id !== id);
    Storage.set('cyberca_surveys', list);
    Storage.remove(`survey_def_${id}`);
  },

  /* Archive / restore */
  setStatus (id, status) {
    const list = Builder.loadAll();
    const s    = list.find(s => s.id === id);
    if (s) s.status = status;
    Storage.set('cyberca_surveys', list);
    const def = Builder.getDefinition(id);
    if (def) { def.status = status; Builder.saveDefinition(def); }
  },

  /* ── Render the survey list table ───────────────────────────── */
  renderSurveyList (containerId) {
    const el      = document.getElementById(containerId);
    if (!el) return;
    const surveys = Builder.loadAll();
    if (!surveys.length) {
      el.innerHTML = `<div class="empty"><div class="empty-icon">📋</div><h3>No surveys yet</h3><p>Click "New Survey" to create one.</p></div>`;
      return;
    }
    el.innerHTML = surveys.map(s => `
      <div class="survey-card" id="sc_${s.id}">
        <div class="flex-between mb-1">
          <span class="survey-card-title">${UI.esc(s.title)}</span>
          ${UI.statusBadge(s.status||'active')}
        </div>
        <p class="survey-card-meta">${s.questionCount||0} questions · Created ${UI.formatDate(s.createdAt||Date.now())}</p>
        <p class="text-sm text-muted mb-2">${UI.esc(s.description||'No description.')}</p>
        <div class="divider"></div>
        <div class="link-box mb-2">
          <span>${Links.forSurvey(s.id)}</span>
          <button class="btn btn-sm btn-outline" onclick="adminCopyLink('${s.id}')">Copy</button>
          <a href="${Links.whatsappHref(Links.forSurvey(s.id), s.title)}" target="_blank" class="btn btn-sm btn-primary">WhatsApp</a>
        </div>
        <div class="survey-card-actions">
          <button class="btn btn-sm btn-dark"    onclick="adminEditSurvey('${s.id}')">✏ Edit</button>
          <button class="btn btn-sm btn-outline" onclick="adminDuplicate('${s.id}')">⧉ Duplicate</button>
          <button class="btn btn-sm btn-ghost"   onclick="adminToggleStatus('${s.id}','${s.status||'active'}')">${s.status==='archived'?'↩ Restore':'📁 Archive'}</button>
          <a href="survey.html?id=${s.id}" target="_blank" class="btn btn-sm btn-ghost">▶ Preview</a>
          <button class="btn btn-sm btn-danger"  onclick="adminDeleteSurvey('${s.id}')">🗑 Delete</button>
        </div>
      </div>
    `).join('');
  },

  /* ── Render question editor for a survey ───────────────────── */
  renderQuestionEditor (surveyId, containerId) {
    const def = Builder.getDefinition(surveyId);
    const el  = document.getElementById(containerId);
    if (!def || !el) return;
    Builder._current = JSON.parse(JSON.stringify(def));

    el.innerHTML = `
      <div class="flex-between mb-3">
        <div>
          <input class="form-input" id="ed-title" value="${UI.esc(def.title)}" style="font-size:1.1rem;font-weight:700;max-width:400px;" placeholder="Survey title">
          <input class="form-input mt-1" id="ed-desc" value="${UI.esc(def.description||'')}" style="font-size:0.9rem;" placeholder="Survey description (optional)">
        </div>
        <div class="flex gap-sm">
          <button class="btn btn-dark" onclick="Builder._addQuestion()">+ Add Question</button>
          <button class="btn btn-primary" onclick="Builder._saveCurrent()">Save Survey</button>
        </div>
      </div>
      <div id="q-editor-list">
        ${(def.questions||[]).map((q,i) => Builder._renderQItem(q,i)).join('')}
      </div>
    `;
  },

  _renderQItem (q, idx) {
    const typeLabel = { multiresponse:'Multi-Response', structured:'Structured Fields', financial:'Financial' };
    return `
      <div class="question-item" id="qi_${q.id}">
        <div class="flex-between">
          <span class="question-number">${idx+1}</span>
          <div class="flex gap-sm">
            <span class="badge badge-teal">${typeLabel[q.type]||q.type}</span>
            <button class="btn-icon" title="Move up"    onclick="Builder._moveQ('${q.id}',-1)">↑</button>
            <button class="btn-icon" title="Move down"  onclick="Builder._moveQ('${q.id}',1)">↓</button>
            <button class="btn-icon btn-danger" title="Delete" onclick="Builder._deleteQ('${q.id}')">🗑</button>
          </div>
        </div>
        <p class="text-xs text-muted mt-1 mb-1">${UI.esc(q.category||'')}</p>
        <p style="font-weight:600;">${UI.esc(q.title)}</p>
        <p class="text-sm text-muted">${UI.esc(q.prompt)}</p>
        <div class="flex gap-sm mt-2">
          ${q.hasVoice   ? '<span class="badge badge-teal">🎤 Voice</span>' : ''}
          ${q.hasSeverity? '<span class="badge badge-warning">Severity</span>' : ''}
          ${q.isRequired ? '<span class="badge badge-danger">Required</span>' : ''}
        </div>
      </div>
    `;
  },

  _addQuestion () {
    if (!Builder._current) return;
    const q = {
      id         : 'q_' + Links.generateId(),
      order      : Builder._current.questions.length + 1,
      type       : 'structured',
      category   : 'New Section',
      title      : 'New Question',
      prompt     : 'Enter your question prompt here.',
      hasVoice   : true,
      isRequired : true,
      subfields  : [{ id:'answer', label:'Your Answer', type:'textarea', placeholder:'…' }]
    };
    Builder._current.questions.push(q);
    Builder.renderQuestionEditor(Builder._current.id, 'q-editor-list');
    Toast.success('Question added. Don\'t forget to save.');
  },

  _deleteQ (qid) {
    if (!Builder._current) return;
    Builder._current.questions = Builder._current.questions.filter(q => q.id !== qid);
    document.getElementById('qi_'+qid)?.remove();
    Toast.info('Question removed.');
  },

  _moveQ (qid, dir) {
    const qs = Builder._current?.questions;
    if (!qs) return;
    const i = qs.findIndex(q => q.id === qid);
    const j = i + dir;
    if (j < 0 || j >= qs.length) return;
    [qs[i], qs[j]] = [qs[j], qs[i]];
    qs.forEach((q,n) => q.order = n+1);
    const list = document.getElementById('q-editor-list');
    if (list) list.innerHTML = qs.map((q,n) => Builder._renderQItem(q,n)).join('');
  },

  _saveCurrent () {
    if (!Builder._current) return;
    Builder._current.title       = document.getElementById('ed-title')?.value || Builder._current.title;
    Builder._current.description = document.getElementById('ed-desc')?.value  || '';
    Builder.saveDefinition(Builder._current);
    Toast.success('Survey saved successfully.');
    /* Sync to Apps Script if configured */
    API.createSurvey(Builder._current).catch(() => {});
  }
};
