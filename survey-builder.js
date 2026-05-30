/* ================================================================
   CyberCA Intelligence Platform — survey-builder.js  v1.1
   Fixed: Q4 simplified, redundant fields removed, admin bug fixed
   ================================================================ */

/* ── Built-in survey list ───────────────────────────────────────── */
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

      /* ── Q1 — Client Servicing Problems (multi-response + severity) ── */
      {
        id             : 'q1_client_problems',
        order          : 1,
        type           : 'multiresponse',
        category       : 'Client Servicing',
        title          : 'Problems Faced in Client Servicing',
        prompt         : 'List all the problems, bottlenecks, inefficiencies, recurring issues, or frustrations you face in client servicing. Add as many entries as you need — one problem per entry.',
        placeholder    : 'Describe a specific problem or challenge in detail…',
        hasVoice       : true,
        isRequired     : true,
        hasSeverity    : true,
        severityLevels : ['low','medium','high','critical'],
        minEntries     : 1,
        maxEntries     : 20
      },

      /* ── Q2 — Product / Service Opportunity (structured, single response) ── */
      {
        id         : 'q2_product_opportunity',
        order      : 2,
        type       : 'structured',
        category   : 'Product Opportunity',
        title      : 'Expertise-Based Product Opportunity',
        prompt     : 'What ONE product, service, system, or expertise-driven offering can you build and focus on as your scalable core "assembly line"? Fill in each field below.',
        hasVoice   : true,
        isRequired : true,
        subfields  : [
          { id:'product_name',    label:'Product / Service Name',              type:'text',     placeholder:'e.g. GST Compliance Audit Package',                                    required:true },
          { id:'target_audience', label:'Target Audience',                     type:'text',     placeholder:'e.g. SME manufacturers in Maharashtra'                                        },
          { id:'pricing',         label:'Pricing per Engagement (₹)',          type:'currency', placeholder:'0'                                                                            },
          { id:'scalability',     label:'Scalability Potential',               type:'textarea', placeholder:'How many clients can this serve per month without proportional effort increase?' },
          { id:'resources',       label:'Resources Required to Launch',        type:'textarea', placeholder:'Team, tools, certifications, or investments needed…'                          },
          { id:'time_to_launch',  label:'Estimated Time to Launch',            type:'text',     placeholder:'e.g. 3 months'                                                                }
        ]
      },

      /* ── Q3 — Revenue Goal 2026 (structured, single response) ── */
      {
        id         : 'q3_revenue_2026',
        order      : 3,
        type       : 'structured',
        category   : 'Revenue Goal 2026',
        title      : 'Monthly Revenue Goal by End of 2026',
        prompt     : 'What monthly revenue do you want to consistently earn by December 2026?',
        hasVoice   : true,
        isRequired : true,
        subfields  : [
          { id:'monthly_target',  label:'Monthly Revenue Target by Dec 2026 (₹)', type:'currency', placeholder:'0',   required:true },
          { id:'current_revenue', label:'Current Monthly Revenue (₹)',             type:'currency', placeholder:'0'                 },
          { id:'gap',             label:'Gap to Bridge (₹ per month)',             type:'currency', placeholder:'Will be calculated'  },
          { id:'notes',           label:'Key Actions to Reach This Target',        type:'textarea', placeholder:'What must change? New clients, new services, team additions, practice areas…' }
        ]
      },

      /* ── Q4 — Revenue Goal 2030 (structured, single response — NO multi-response) ── */
      {
        id         : 'q4_revenue_2030',
        order      : 4,
        type       : 'structured',
        category   : 'Revenue Goal 2030',
        title      : 'Revenue Goal by End of 2030',
        prompt     : 'What annual revenue target do you want to achieve by December 2030? Describe your strategy for getting there.',
        hasVoice   : true,
        isRequired : true,
        subfields  : [
          { id:'annual_target',   label:'Annual Revenue Target by Dec 2030 (₹)',  type:'currency', placeholder:'0',   required:true },
          { id:'current_annual',  label:'Approximate Current Annual Revenue (₹)', type:'currency', placeholder:'0'                 },
          { id:'strategy_desc',   label:'How will you achieve this target?',      type:'textarea', placeholder:'Practice areas, team size, geographies, service lines, partnerships, technology…' },
          { id:'biggest_risk',    label:'Biggest Risk or Obstacle',               type:'textarea', placeholder:'What could prevent you from reaching this goal?'                               }
        ]
      },

      /* ── Q5 — Corpus Fund (structured, single response) ── */
      {
        id         : 'q5_corpus_fund',
        order      : 5,
        type       : 'structured',
        category   : 'Corpus Fund',
        title      : 'Ideal Corpus Fund',
        prompt     : 'What corpus fund or financial reserve would fully take care of you and your family — even if you stopped actively earning money tomorrow?',
        hasVoice   : true,
        isRequired : true,
        subfields  : [
          { id:'corpus_total',    label:'Total Corpus Required (₹)',               type:'currency', placeholder:'0',  required:true },
          { id:'monthly_expense', label:'Expected Monthly Household Expenses (₹)', type:'currency', placeholder:'0'               },
          { id:'passive_income',  label:'Expected Passive Income per Month (₹)',   type:'currency', placeholder:'0'               },
          { id:'inflation_rate',  label:'Assumed Annual Inflation Rate (%)',        type:'number',   placeholder:'6'               },
          { id:'target_year',     label:'Year by Which You Want Full Corpus',      type:'text',     placeholder:'e.g. 2035'       },
          { id:'lifestyle',       label:'Lifestyle & Monthly Expense Assumptions', type:'textarea', placeholder:'Housing, travel, healthcare, children\'s education, holidays…'                },
          { id:'family_resp',     label:'Family Responsibilities to Factor In',    type:'textarea', placeholder:'Dependent parents, children\'s higher education, weddings, medical needs…'    }
        ]
      }
    ]
  }
};

/* ================================================================
   ADMIN SURVEY BUILDER
   ================================================================ */
const Builder = {

  _current : null,

  loadAll () {
    const stored = Storage.get('cyberca_surveys') || [];
    const ids    = stored.map(s => s.id);
    BUILT_IN_SURVEYS_LIST.forEach(s => { if (!ids.includes(s.id)) stored.unshift(s); });
    return stored;
  },

  getDefinition (id) {
    const custom = Storage.get('survey_def_' + id);
    if (custom) return custom;
    return SURVEY_DEFINITIONS[id] || null;
  },

  saveDefinition (def) {
    Storage.set('survey_def_' + def.id, def);
    const list = Builder.loadAll();
    const idx  = list.findIndex(s => s.id === def.id);
    const meta = {
      id            : def.id,
      title         : def.title,
      description   : def.description,
      status        : def.status,
      questionCount : def.questions ? def.questions.length : 0,
      createdAt     : def.createdAt || Date.now()
    };
    if (idx >= 0) list[idx] = meta; else list.unshift(meta);
    Storage.set('cyberca_surveys', list);
  },

  createNew () {
    return {
      id          : Links.generateId(),
      title       : 'New Survey',
      description : '',
      status      : 'active',
      createdAt   : Date.now(),
      questions   : []
    };
  },

  duplicate (id) {
    const src = Builder.getDefinition(id);
    if (!src) return null;
    const copy    = JSON.parse(JSON.stringify(src));
    copy.id       = Links.generateId();
    copy.title    = copy.title + ' (Copy)';
    copy.createdAt = Date.now();
    Builder.saveDefinition(copy);
    return copy;
  },

  delete (id) {
    const list = Builder.loadAll().filter(s => s.id !== id);
    Storage.set('cyberca_surveys', list);
    Storage.remove('survey_def_' + id);
  },

  setStatus (id, status) {
    const list = Builder.loadAll();
    const s    = list.find(s => s.id === id);
    if (s) s.status = status;
    Storage.set('cyberca_surveys', list);
    const def = Builder.getDefinition(id);
    if (def) { def.status = status; Builder.saveDefinition(def); }
  },

  /* ── Render survey list cards ─────────────────────────────────── */
  renderSurveyList (containerId) {
    const el      = document.getElementById(containerId);
    if (!el) return;
    const surveys = Builder.loadAll();
    if (!surveys.length) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">📋</div><h3>No surveys yet</h3><p>Click "New Survey" to create one.</p></div>';
      return;
    }
    el.innerHTML = surveys.map(function(s) {
      return '<div class="survey-card" id="sc_' + s.id + '">' +
        '<div class="flex-between" style="align-items:flex-start;margin-bottom:8px;">' +
          '<span class="survey-card-title">' + UI.esc(s.title) + '</span>' +
          UI.statusBadge(s.status || 'active') +
        '</div>' +
        '<p class="survey-card-meta">' + (s.questionCount || 0) + ' questions · Created ' + UI.formatDate(s.createdAt || Date.now()) + '</p>' +
        '<p class="text-sm text-muted" style="margin-bottom:1rem;">' + UI.esc(s.description || 'No description.') + '</p>' +
        '<div class="divider"></div>' +
        '<div class="link-box mb-2"><span>' + Links.forSurvey(s.id) + '</span>' +
          '<button class="btn btn-sm btn-outline" onclick="adminCopyLink(\'' + s.id + '\')">Copy</button>' +
          '<a href="' + Links.whatsappHref(Links.forSurvey(s.id), s.title) + '" target="_blank" class="btn btn-sm btn-primary">WhatsApp</a>' +
        '</div>' +
        '<div class="survey-card-actions">' +
          '<button class="btn btn-sm btn-dark" onclick="adminEditSurvey(\'' + s.id + '\')">✏ Edit Questions</button>' +
          '<button class="btn btn-sm btn-outline" onclick="adminDuplicate(\'' + s.id + '\')">⧉ Duplicate</button>' +
          '<button class="btn btn-sm btn-ghost" onclick="adminToggleStatus(\'' + s.id + '\',\'' + (s.status || 'active') + '\')">' + (s.status === 'archived' ? '↩ Restore' : '📁 Archive') + '</button>' +
          '<a href="survey.html?id=' + s.id + '" target="_blank" class="btn btn-sm btn-ghost">▶ Preview</a>' +
          '<button class="btn btn-sm btn-danger" onclick="adminDeleteSurvey(\'' + s.id + '\')">🗑 Delete</button>' +
        '</div></div>';
    }).join('');
  },

  /* ── Render question editor ───────────────────────────────────── */
  renderQuestionEditor (surveyId, containerId) {
    const def = Builder.getDefinition(surveyId);
    const el  = document.getElementById(containerId);
    if (!def || !el) return;
    Builder._current = JSON.parse(JSON.stringify(def));

    /* Header: title + description inputs + action buttons */
    var header = '<div class="card mb-3">' +
      '<div class="flex-between" style="flex-wrap:wrap;gap:1rem;">' +
        '<div style="flex:1;min-width:200px;">' +
          '<div class="form-group">' +
            '<label class="form-label">Survey Title</label>' +
            '<input class="form-input" id="ed-title" value="' + UI.esc(def.title) + '" placeholder="Survey title">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">Survey Description</label>' +
            '<input class="form-input" id="ed-desc" value="' + UI.esc(def.description || '') + '" placeholder="Brief description (optional)">' +
          '</div>' +
        '</div>' +
        '<div class="flex gap-sm" style="align-self:flex-start;flex-shrink:0;">' +
          '<button class="btn btn-dark" onclick="Builder._addNewQuestion()">+ Add Question</button>' +
          '<button class="btn btn-primary" onclick="Builder._saveCurrent()">💾 Save Survey</button>' +
        '</div>' +
      '</div>' +
    '</div>';

    /* Question list */
    var qList = '<div id="q-editor-list">' +
      (def.questions || []).map(function(q, i) { return Builder._renderQItem(q, i); }).join('') +
    '</div>';

    el.innerHTML = header + qList;
  },

  /* ── Render a single question card in the editor ─────────────── */
  _renderQItem (q, idx) {
    var typeLabels = {
      multiresponse : 'Multi-Response',
      structured    : 'Structured Fields'
    };
    var subfieldSummary = '';
    if (q.subfields && q.subfields.length) {
      subfieldSummary = '<p class="text-xs text-muted mt-1">Fields: ' +
        q.subfields.map(function(sf) { return sf.label; }).join(' · ') +
        '</p>';
    }
    return '<div class="question-item" id="qi_' + q.id + '">' +
      '<div class="flex-between">' +
        '<span class="question-number">' + (idx + 1) + '</span>' +
        '<div class="flex gap-sm">' +
          '<span class="badge badge-teal">' + (typeLabels[q.type] || q.type) + '</span>' +
          '<button class="btn-icon" title="Move up"   onclick="Builder._moveQ(\'' + q.id + '\',-1)">↑</button>' +
          '<button class="btn-icon" title="Move down" onclick="Builder._moveQ(\'' + q.id + '\',1)">↓</button>' +
          '<button class="btn-icon" style="color:var(--color-danger);border-color:#fecaca;" title="Delete" onclick="Builder._deleteQ(\'' + q.id + '\')">🗑</button>' +
        '</div>' +
      '</div>' +
      '<p class="text-xs" style="color:var(--color-accent);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-top:8px;">' + UI.esc(q.category || '') + '</p>' +
      '<p style="font-weight:600;margin-top:4px;">' + UI.esc(q.title) + '</p>' +
      '<p class="text-sm text-muted">' + UI.esc(q.prompt) + '</p>' +
      subfieldSummary +
      '<div class="flex gap-sm mt-2">' +
        (q.hasVoice    ? '<span class="badge badge-teal">🎤 Voice</span>'        : '') +
        (q.hasSeverity ? '<span class="badge badge-warning">Severity</span>'     : '') +
        (q.isRequired  ? '<span class="badge badge-danger">Required</span>'      : '') +
        (q.type === 'multiresponse' ? '<span class="badge badge-gray">Multi-entry</span>' : '') +
      '</div>' +
    '</div>';
  },

  /* ── Add a new blank question (FIX: only updates q-editor-list) ── */
  _addNewQuestion () {
    if (!Builder._current) return;
    var q = {
      id         : 'q_' + Links.generateId(),
      order      : Builder._current.questions.length + 1,
      type       : 'structured',
      category   : 'New Section',
      title      : 'New Question',
      prompt     : 'Enter your question prompt here.',
      hasVoice   : true,
      isRequired : true,
      subfields  : [
        { id:'answer', label:'Your Answer', type:'textarea', placeholder:'Type your response here…' }
      ]
    };
    Builder._current.questions.push(q);
    /* Only update the question list — do NOT re-render the whole editor */
    var listEl = document.getElementById('q-editor-list');
    if (listEl) {
      listEl.innerHTML = Builder._current.questions.map(function(q, i) {
        return Builder._renderQItem(q, i);
      }).join('');
    }
    Toast.success('New question added. Click "Save Survey" to save it.');
  },

  _deleteQ (qid) {
    if (!Builder._current) return;
    Builder._current.questions = Builder._current.questions.filter(function(q) { return q.id !== qid; });
    var listEl = document.getElementById('q-editor-list');
    if (listEl) {
      listEl.innerHTML = Builder._current.questions.map(function(q, i) {
        return Builder._renderQItem(q, i);
      }).join('');
    }
    Toast.info('Question removed. Click "Save Survey" to save changes.');
  },

  _moveQ (qid, dir) {
    var qs = Builder._current && Builder._current.questions;
    if (!qs) return;
    var i = qs.findIndex(function(q) { return q.id === qid; });
    var j = i + dir;
    if (j < 0 || j >= qs.length) return;
    var temp = qs[i]; qs[i] = qs[j]; qs[j] = temp;
    qs.forEach(function(q, n) { q.order = n + 1; });
    var listEl = document.getElementById('q-editor-list');
    if (listEl) {
      listEl.innerHTML = qs.map(function(q, n) { return Builder._renderQItem(q, n); }).join('');
    }
  },

  _saveCurrent () {
    if (!Builder._current) return;
    var titleEl = document.getElementById('ed-title');
    var descEl  = document.getElementById('ed-desc');
    if (titleEl) Builder._current.title       = titleEl.value || Builder._current.title;
    if (descEl)  Builder._current.description = descEl.value  || '';
    Builder.saveDefinition(Builder._current);
    Toast.success('Survey saved successfully.');
    API.createSurvey(Builder._current).catch(function() {});
  }
};
