/* ============================================================
   KAI INTEL — R&D Intelligence Dashboard
   Two domains: Craft Competitors + Joystick Market
   ============================================================ */

'use strict';

let state = {
  competitors: [],
  intelFeed: [],
  patents: [],
  joysticks: [],
  controls: [],
  activeDomain: 'craft',
  activeSection: { craft: 'craft-overview', joystick: 'joy-overview' },
  threatFilter: 'all',
  joyFilter: 'all'
};

// ─── Boot ─────────────────────────────────────
async function init() {
  try {
    const [competitors, intelFeed, patents, joysticks, controls] = await Promise.all([
      fetchJSON('./data/competitors.json'),
      fetchJSON('./data/intel-feed.json'),
      fetchJSON('./data/patents.json'),
      fetchJSON('./data/joysticks.json'),
      fetchJSON('./data/competitor-controls.json')
    ]);

    state.competitors = competitors;
    state.intelFeed = intelFeed;
    state.patents = patents;
    state.joysticks = joysticks;
    state.controls = controls;

    setLastUpdated();
    renderAll();
    setupDomainSelector();
    setupNavs();
    setupFilters();
    setupJoyFilters();
  } catch (err) {
    console.error('Failed to load data:', err);
    document.getElementById('app-error').style.display = 'block';
  }
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

function setLastUpdated() {
  const el = document.getElementById('last-updated');
  if (el) el.textContent = 'Updated ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Domain Selector ──────────────────────────
function setupDomainSelector() {
  document.querySelectorAll('.section-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const domain = btn.dataset.domain;
      state.activeDomain = domain;
      document.querySelectorAll('.section-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.domain').forEach(d => d.style.display = d.id === `domain-${domain}` ? 'block' : 'none');
    });
  });
}

// ─── Nav ──────────────────────────────────────
function setupNavs() {
  document.querySelectorAll('.domain-nav .nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const sectionId = tab.dataset.section;
      const domain = sectionId.startsWith('craft') ? 'craft' : 'joystick';
      const nav = tab.closest('.domain-nav');
      nav.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t === tab));
      const domainEl = tab.closest('.domain');
      domainEl.querySelectorAll('.section').forEach(s => s.classList.toggle('active', s.id === `section-${sectionId}`));
      state.activeSection[domain] = sectionId;
    });
  });
}

// ─── Render ───────────────────────────────────
function renderAll() {
  renderCraftOverview();
  renderCompetitors();
  renderIntelFeed();
  renderPatents();
  renderControls();
  renderComparisonTable();
  renderJoyOverview();
  renderJoyProducts();
  renderJoyComparison();
  updateCounts();
}

// ─── Craft Overview ───────────────────────────
function renderCraftOverview() {
  const high = state.competitors.filter(c => c.threatLevel === 'HIGH').length;
  const med = state.competitors.filter(c => c.threatLevel === 'MEDIUM').length;
  const low = state.competitors.filter(c => c.threatLevel === 'LOW').length;

  setEl('stat-high', high);
  setEl('stat-med', med);
  setEl('stat-low', low);
  setEl('stat-total', state.competitors.length);
  setEl('stat-intel', state.intelFeed.length);
  setEl('stat-patents', state.patents.length);

  const topThreats = state.competitors.filter(c => c.threatLevel === 'HIGH' || c.threatLevel === 'MEDIUM');
  const overviewCards = document.getElementById('overview-competitors');
  if (overviewCards) overviewCards.innerHTML = topThreats.map(renderCompetitorCard).join('');

  const recentIntel = document.getElementById('overview-intel');
  if (recentIntel) recentIntel.innerHTML = state.intelFeed.slice(0, 4).map(renderIntelItem).join('');
}

// ─── Competitor Cards ─────────────────────────
function renderCompetitorCard(c) {
  const linksHtml = c.website ? `<a href="${esc(c.website)}" target="_blank" class="link-btn">↗ Site</a>` : '';
  const newsLink = c.mediaLinks && c.mediaLinks.length > 0
    ? `<a href="${esc(c.mediaLinks[0])}" target="_blank" class="link-btn">📰 News</a>` : '';

  return `
    <div class="competitor-card threat-${esc(c.threatLevel)}">
      <div class="card-header">
        <div class="card-company">
          <div class="company-name">${esc(c.company)}</div>
          <div class="company-location">📍 ${esc(c.location)}</div>
        </div>
        <div class="threat-badge ${esc(c.threatLevel)}">${threatIcon(c.threatLevel)} ${esc(c.threatLevel)}</div>
      </div>
      <div class="card-product">
        <div class="product-name">${esc(c.product)}</div>
        <div class="product-tagline">${esc(c.tagline)}</div>
      </div>
      <div class="card-specs">
        <div class="spec-item"><div class="spec-value ${!c.passengers ? 'na' : ''}">${c.passengers ?? '—'}</div><div class="spec-label">Passengers</div></div>
        <div class="spec-item"><div class="spec-value ${!c.topSpeed ? 'na' : ''}">${c.topSpeed ?? '—'}</div><div class="spec-label">Top Speed</div></div>
        <div class="spec-item"><div class="spec-value ${!c.range ? 'na' : ''}">${c.range ? c.range.split(' ')[0] + ' ' + (c.range.split(' ')[1] || '') : '—'}</div><div class="spec-label">Range</div></div>
      </div>
      <div class="card-body">
        <div class="card-price"><span class="price-label">Price:</span><span class="price-value">${esc(c.price ?? 'TBD')}</span></div>
        ${c.fundingStatus ? `<div class="card-funding"><div class="funding-dot"></div><div class="funding-text">${esc(c.fundingStatus)}</div></div>` : ''}
        <div class="threat-reason ${esc(c.threatLevel)}">${esc(c.threatReason)}</div>
        ${c.latestNews ? `<div style="font-size:12px; color:var(--text-muted); margin-top:4px;">🕐 ${esc(c.latestNews)}</div>` : ''}
      </div>
      <div class="card-footer">
        <div class="card-tags">${(c.tags || []).slice(0, 4).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <div class="card-links">${linksHtml}${newsLink}</div>
      </div>
    </div>`;
}

function renderCompetitors() {
  const grid = document.getElementById('competitors-grid');
  if (!grid) return;
  const filtered = state.threatFilter === 'all' ? state.competitors : state.competitors.filter(c => c.threatLevel === state.threatFilter);
  grid.innerHTML = filtered.length ? filtered.map(renderCompetitorCard).join('') : `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">No competitors match this filter.</div></div>`;
}

// ─── Intel Feed ───────────────────────────────
function renderIntelItem(item) {
  const sourceHtml = item.url
    ? `<a href="${esc(item.url)}" target="_blank" style="color:var(--accent-blue); text-decoration:none; font-size:11px;">↗ ${esc(item.source)}</a>`
    : `<span style="font-size:11px; color:var(--text-muted);">${esc(item.source)}</span>`;
  return `
    <div class="intel-item">
      <div class="intel-priority ${esc(item.priority)}"></div>
      <div class="intel-content">
        <div class="intel-date">${esc(item.date)}</div>
        <div class="intel-title">${esc(item.title)}</div>
        <div class="intel-summary">${esc(item.summary)}</div>
      </div>
      <div class="intel-meta">
        <div class="priority-label ${esc(item.priority)}">${esc(item.priority)}</div>
        <div class="intel-tags">${sourceHtml}</div>
        <div class="intel-tags" style="margin-top:4px;">${(item.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      </div>
    </div>`;
}

function renderIntelFeed() {
  const feed = document.getElementById('intel-feed');
  if (!feed) return;
  const sorted = [...state.intelFeed].sort((a, b) => b.date.localeCompare(a.date));
  feed.innerHTML = sorted.map(renderIntelItem).join('');
}

// ─── Patents ──────────────────────────────────
function renderPatents() {
  const list = document.getElementById('patents-list');
  if (!list) return;
  list.innerHTML = state.patents.map(p => {
    const relLvl = p.relevance.startsWith('HIGH') ? 'HIGH' : p.relevance.startsWith('MEDIUM') ? 'MEDIUM' : 'LOW';
    return `
      <div class="patent-card">
        <div>
          <div class="patent-title">${esc(p.title)}</div>
          <div class="patent-assignee">Assignee: ${esc(p.assignee)}</div>
          <div class="patent-desc">${esc(p.description)}</div>
          <div class="patent-relevance"><strong style="color:var(--text-primary);">Relevance:</strong><br>${esc(p.relevance)}</div>
          <div class="patent-footer">${(p.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        </div>
        <div class="patent-meta">
          ${p.number ? `<div class="patent-number">${esc(p.number)}</div>` : ''}
          <div class="patent-status ${esc(p.status.split('(')[0].trim())}">${esc(p.status)}</div>
          <div class="patent-relevance-badge ${relLvl}" style="margin-top:6px;">${relLvl} relevance</div>
          ${p.url ? `<div style="margin-top:8px;"><a href="${esc(p.url)}" target="_blank" class="link-btn" style="font-size:10px;">↗ View</a></div>` : ''}
          ${p.filingDate ? `<div style="font-size:11px; color:var(--text-muted); margin-top:6px;">Filed: ${esc(p.filingDate)}</div>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ─── Craft Comparison ─────────────────────────
function renderComparisonTable() {
  const tbody = document.getElementById('comparison-tbody');
  if (!tbody) return;
  const sorted = [...state.competitors].sort((a, b) => ({ HIGH: 0, MEDIUM: 1, LOW: 2 }[a.threatLevel] ?? 3) - ({ HIGH: 0, MEDIUM: 1, LOW: 2 }[b.threatLevel] ?? 3));
  tbody.innerHTML = sorted.map(c => `
    <tr>
      <td class="table-company">${esc(c.company)}</td>
      <td class="table-product">${esc(c.product)}</td>
      <td class="table-mono">${c.passengers ?? '<span class="table-na">—</span>'}</td>
      <td class="table-mono">${c.topSpeed ? esc(c.topSpeed) : '<span class="table-na">—</span>'}</td>
      <td class="table-mono">${c.range ? esc(c.range) : '<span class="table-na">—</span>'}</td>
      <td>${c.price ? esc(c.price) : '<span class="table-na">—</span>'}</td>
      <td>${c.length ? esc(c.length) : '<span class="table-na">—</span>'}</td>
      <td class="table-threat"><span class="threat-dot ${esc(c.threatLevel)}">${esc(c.threatLevel)}</span></td>
    </tr>`).join('');
}

// ═══════════════════════════════════════════════
//  CONTROLS ANALYSIS
// ═══════════════════════════════════════════════

function renderControls() {
  const feed = document.getElementById('controls-feed');
  if (!feed) return;

  // Count control types
  const joystickUsers = state.controls.filter(c => c.controlType.toLowerCase().includes('joystick'));
  const wheelUsers = state.controls.filter(c => c.controlType.toLowerCase().includes('steering wheel'));
  const fbwUsers = state.controls.filter(c => c.controlType.toLowerCase().includes('fly-by-wire') || c.controlType.toLowerCase().includes('flight'));
  const otherUsers = state.controls.filter(c => c.controlType.toLowerCase().includes('yoke') || c.controlType.toLowerCase().includes('handle') || c.controlType.toLowerCase().includes('remote'));

  setEl('ctrl-joystick-count', joystickUsers.length);
  setEl('ctrl-wheel-count', wheelUsers.length);
  setEl('ctrl-fbw-count', fbwUsers.length);
  setEl('ctrl-other-count', otherUsers.length);
  setEl('count-controls', state.controls.length);

  // Sort: most relevant to Kai first
  const relevanceOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const sorted = [...state.controls].sort((a, b) => {
    const aRel = a.relevanceToKai.startsWith('MOST') ? -1 : a.relevanceToKai.startsWith('HIGH') ? 0 : a.relevanceToKai.startsWith('MEDIUM') ? 1 : 2;
    const bRel = b.relevanceToKai.startsWith('MOST') ? -1 : b.relevanceToKai.startsWith('HIGH') ? 0 : b.relevanceToKai.startsWith('MEDIUM') ? 1 : 2;
    return aRel - bRel;
  });

  feed.innerHTML = sorted.map(c => {
    const relColor = c.relevanceToKai.startsWith('MOST') ? 'var(--accent-red)' :
      c.relevanceToKai.startsWith('HIGH') ? 'var(--accent-orange)' :
      c.relevanceToKai.startsWith('MEDIUM') ? 'var(--accent-yellow)' : 'var(--text-muted)';

    const isJoystick = c.controlType.toLowerCase().includes('joystick');
    const typeIcon = isJoystick ? '🕹️' :
      c.controlType.toLowerCase().includes('yoke') ? '✈️' :
      c.controlType.toLowerCase().includes('wheel') ? '🎡' :
      c.controlType.toLowerCase().includes('handle') ? '🚲' :
      c.controlType.toLowerCase().includes('remote') ? '📡' : '⚙️';

    const imagesHtml = (c.images || []).map(img => `
      <div style="margin:12px 0;">
        <img src="${esc(img.url)}" alt="${esc(img.caption)}" style="max-width:100%; max-height:300px; border-radius:var(--radius-sm); border:1px solid var(--border); object-fit:cover;" onerror="this.parentElement.style.display='none'">
        <div style="font-size:11px; color:var(--text-muted); margin-top:4px; font-style:italic;">${esc(img.caption)}</div>
      </div>`).join('');

    const sourcesHtml = (c.sources || []).map(s => `<a href="${esc(s.url)}" target="_blank" class="link-btn" style="font-size:10px;">↗ ${esc(s.title)}</a>`).join(' ');

    const detailsHtml = (c.controlDetails || []).map(d => `<li style="font-size:12px; color:var(--text-secondary); margin-bottom:4px; padding-left:4px;">${esc(d)}</li>`).join('');

    return `
      <div class="control-card" style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); margin-bottom:20px; overflow:hidden; border-top:3px solid ${relColor};">
        
        <div style="padding:20px 24px 16px; display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap;">
          <div style="flex:1; min-width:250px;">
            <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.8px; margin-bottom:4px;">${esc(c.company)}</div>
            <div style="font-size:18px; font-weight:800; color:var(--text-primary); letter-spacing:-0.3px;">${esc(c.product)}</div>
          </div>
          <div style="display:flex; gap:8px; align-items:center; flex-shrink:0;">
            <span style="font-size:24px;">${typeIcon}</span>
            <div>
              <div style="font-size:13px; font-weight:700; color:var(--accent-blue);">${esc(c.controlType)}</div>
              <div style="font-size:10px; color:${relColor}; font-weight:600; margin-top:2px;">Relevance: ${esc(c.relevanceToKai.split('—')[0].trim())}</div>
            </div>
          </div>
        </div>

        <div style="padding:0 24px 16px;">
          <div style="font-size:14px; color:var(--text-primary); font-weight:600; line-height:1.5; margin-bottom:12px;">${esc(c.controlSummary)}</div>
        </div>

        ${imagesHtml ? `<div style="padding:0 24px;">${imagesHtml}</div>` : ''}

        <div style="padding:0 24px 16px;">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">

            <div style="background:rgba(0,0,0,0.15); border:1px solid var(--border); border-radius:var(--radius-sm); padding:14px;">
              <div style="font-size:11px; font-weight:700; color:var(--accent-blue); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">🏎️ Steering</div>
              <div style="font-size:12px; color:var(--text-secondary); line-height:1.6;">${esc(c.steeringMechanism)}</div>
            </div>

            <div style="background:rgba(0,0,0,0.15); border:1px solid var(--border); border-radius:var(--radius-sm); padding:14px;">
              <div style="font-size:11px; font-weight:700; color:var(--accent-green); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">⚡ Throttle</div>
              <div style="font-size:12px; color:var(--text-secondary); line-height:1.6;">${esc(c.throttleMechanism)}</div>
            </div>

            <div style="background:rgba(0,0,0,0.15); border:1px solid var(--border); border-radius:var(--radius-sm); padding:14px;">
              <div style="font-size:11px; font-weight:700; color:var(--accent-cyan); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">✈️ Flight Control</div>
              <div style="font-size:12px; color:var(--text-secondary); line-height:1.6;">${esc(c.flightControl)}</div>
            </div>

            ${c.joystickDetails ? `
            <div style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.25); border-radius:var(--radius-sm); padding:14px;">
              <div style="font-size:11px; font-weight:700; color:var(--accent-blue); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">🕹️ Joystick Details</div>
              <div style="font-size:12px; color:var(--text-secondary); line-height:1.6;">${esc(c.joystickDetails)}</div>
            </div>` : ''}
          </div>
        </div>

        <div style="padding:0 24px 16px;">
          <details style="cursor:pointer;">
            <summary style="font-size:12px; font-weight:600; color:var(--text-primary); padding:8px 0;">📋 Full Control Details (${c.controlDetails.length} points)</summary>
            <ul style="list-style:disc; padding-left:20px; margin-top:8px;">${detailsHtml}</ul>
          </details>
        </div>

        <div style="padding:0 24px 16px;">
          <div style="font-size:12px; color:var(--text-secondary); padding:10px 12px; background:rgba(255,255,255,0.02); border-left:3px solid ${relColor}; border-radius:0 var(--radius-sm) var(--radius-sm) 0; line-height:1.6;">
            <strong style="color:var(--text-primary);">Relevance to Kai Concepts:</strong> ${esc(c.relevanceToKai)}
          </div>
        </div>

        ${c.userExperience ? `
        <div style="padding:0 24px 16px;">
          <div style="font-size:12px; color:var(--text-secondary); line-height:1.6;">
            <strong style="color:var(--text-primary);">User Experience:</strong> ${esc(c.userExperience)}
          </div>
        </div>` : ''}

        <div style="padding:12px 24px; border-top:1px solid var(--border); display:flex; gap:6px; flex-wrap:wrap;">
          ${sourcesHtml}
        </div>
      </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════
//  JOYSTICK DOMAIN
// ═══════════════════════════════════════════════

function renderJoystickCard(j) {
  const statusColor = {
    'CURRENT': 'var(--accent-red)',
    'TOP CANDIDATE': 'var(--accent-green)',
    'CANDIDATE': 'var(--accent-yellow)',
    'PROTOTYPING': 'var(--accent-orange)',
    'INVESTIGATION': 'var(--accent-cyan)',
    'REFERENCE': 'var(--text-muted)'
  }[j.status] || 'var(--text-muted)';

  const suitColor = { HIGH: 'var(--accent-green)', MEDIUM: 'var(--accent-yellow)', LOW: 'var(--accent-red)' }[j.suitability] || 'var(--text-muted)';

  const thumbSrc = j.thumbnail || j.image;
  const imgHtml = thumbSrc ? `<div class="joy-image-wrap"><img src="${esc(thumbSrc)}" alt="${esc(j.name)}" class="joy-image" onerror="this.parentElement.style.display='none'"></div>` : '';

  const videosHtml = (j.videos && j.videos.length) ? `
    <div style="padding:0 20px 12px; display:flex; gap:6px; flex-wrap:wrap;">
      ${j.videos.map(v => `<a href="${esc(v.url)}" target="_blank" class="link-btn" style="font-size:10px; background:rgba(239,68,68,0.08); border-color:rgba(239,68,68,0.3); color:var(--accent-red);">▶ ${esc(v.title)}</a>`).join('')}
    </div>` : '';

  return `
    <div class="joystick-card" style="border-top:3px solid ${statusColor};">
      ${imgHtml}
      <div class="card-header" style="padding-top:${thumbSrc ? '12px' : '20px'};">
        <div class="card-company" style="flex:1;">
          <div class="company-name">${esc(j.name)}</div>
          <div class="company-location">🏭 ${esc(j.manufacturer)} · 📍 ${esc(j.country)}</div>
        </div>
        <div style="display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
          <span style="background:${statusColor}22; border:1px solid ${statusColor}55; color:${statusColor}; font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px;">${esc(j.status)}</span>
          <span style="font-size:10px; color:${suitColor}; font-weight:600;">Suitability: ${esc(j.suitability)}</span>
        </div>
      </div>

      <div style="padding:0 20px 12px;">
        <div style="font-size:12px; color:var(--text-secondary); line-height:1.5;">${esc(j.statusNote)}</div>
      </div>

      <div class="card-specs" style="grid-template-columns:repeat(2, 1fr);">
        <div class="spec-item"><div class="spec-value" style="font-size:12px;">${esc(j.axes)}</div><div class="spec-label">Axes</div></div>
        <div class="spec-item"><div class="spec-value" style="font-size:12px;">${esc(j.sensorType)}</div><div class="spec-label">Sensor</div></div>
        <div class="spec-item"><div class="spec-value" style="font-size:12px;">${esc(j.ipRating)}</div><div class="spec-label">IP Rating</div></div>
        <div class="spec-item"><div class="spec-value" style="font-size:12px; color:${j.hollowShaft === true ? 'var(--accent-green)' : j.hollowShaft === false ? 'var(--accent-red)' : 'var(--text-muted)'};">${j.hollowShaft === true ? '✅ Yes' : j.hollowShaft === false ? '❌ No' : '❓ Unknown'}</div><div class="spec-label">Hollow Shaft</div></div>
      </div>

      <div class="card-body">
        <div class="card-price"><span class="price-label">Price:</span><span class="price-value">${esc(j.price)}</span></div>
        ${j.output ? `<div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px;"><strong style="color:var(--text-primary);">Output:</strong> ${esc(j.output)}</div>` : ''}
        ${j.breakoutForce ? `<div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px;"><strong style="color:var(--text-primary);">Breakout Force:</strong> ${esc(j.breakoutForce)}</div>` : ''}

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px;">
          <div>
            <div style="font-size:10px; font-weight:700; color:var(--accent-green); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">✅ Pros</div>
            ${j.pros.slice(0, 4).map(p => `<div style="font-size:11px; color:var(--text-secondary); margin-bottom:3px; padding-left:8px; border-left:2px solid var(--accent-green)33;">${esc(p)}</div>`).join('')}
          </div>
          <div>
            <div style="font-size:10px; font-weight:700; color:var(--accent-red); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">⚠️ Cons</div>
            ${j.cons.slice(0, 4).map(c => `<div style="font-size:11px; color:var(--text-secondary); margin-bottom:3px; padding-left:8px; border-left:2px solid var(--accent-red)33;">${esc(c)}</div>`).join('')}
          </div>
        </div>

        <div class="threat-reason" style="margin-top:12px; border-left-color:${suitColor};">
          <strong style="color:var(--text-primary);">Assessment:</strong> ${esc(j.suitabilityReason)}
        </div>
      </div>

      ${videosHtml}
      <div class="card-footer">
        <div class="card-tags">${(j.tags || []).slice(0, 5).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <div class="card-links">
          ${j.website ? `<a href="${esc(j.website)}" target="_blank" class="link-btn">↗ Site</a>` : ''}
          ${j.datasheetUrl ? `<a href="${esc(j.datasheetUrl)}" target="_blank" class="link-btn">📄 Datasheet</a>` : ''}
        </div>
      </div>
    </div>`;
}

function renderJoyOverview() {
  const top = state.joysticks.filter(j => j.status === 'TOP CANDIDATE');
  const candidates = state.joysticks.filter(j => j.status === 'CANDIDATE' || j.status === 'PROTOTYPING');
  const refs = state.joysticks.filter(j => j.status === 'REFERENCE');

  setEl('stat-joy-top', top.length);
  setEl('stat-joy-candidate', candidates.length);
  setEl('stat-joy-ref', refs.length);
  setEl('stat-joy-total', state.joysticks.length);

  const grid = document.getElementById('joy-overview-grid');
  if (grid) {
    const featured = state.joysticks.filter(j => j.status === 'TOP CANDIDATE' || j.status === 'CANDIDATE' || j.status === 'CURRENT');
    grid.innerHTML = featured.map(renderJoystickCard).join('');
  }
}

function renderJoyProducts() {
  const grid = document.getElementById('joy-products-grid');
  if (!grid) return;
  const filtered = state.joyFilter === 'all' ? state.joysticks : state.joysticks.filter(j => j.status === state.joyFilter);
  grid.innerHTML = filtered.length ? filtered.map(renderJoystickCard).join('') : `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">No joysticks match this filter.</div></div>`;
}

function renderJoyComparison() {
  const tbody = document.getElementById('joy-comparison-tbody');
  if (!tbody) return;
  const order = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
  const sorted = [...state.joysticks].sort((a, b) => (order[a.suitability] ?? 3) - (order[b.suitability] ?? 3));
  tbody.innerHTML = sorted.map(j => {
    const suitColor = { HIGH: 'var(--accent-green)', MEDIUM: 'var(--accent-yellow)', LOW: 'var(--accent-red)' }[j.suitability] || 'var(--text-muted)';
    const shaftHtml = j.hollowShaft === true ? '<span style="color:var(--accent-green);">✅ Yes</span>'
      : j.hollowShaft === false ? '<span style="color:var(--accent-red);">❌ No</span>'
      : '<span class="table-na">❓</span>';
    return `
      <tr>
        <td style="font-weight:600; color:var(--text-primary); white-space:nowrap;">${esc(j.name)}</td>
        <td>${esc(j.manufacturer)}</td>
        <td style="font-size:12px;">${esc(j.axes)}</td>
        <td style="font-size:12px;">${esc(j.sensorType)}</td>
        <td style="font-size:12px;">${esc(j.output)}</td>
        <td style="font-size:12px;">${esc(j.ipRating)}</td>
        <td>${shaftHtml}</td>
        <td style="font-size:12px;">${esc(j.price)}</td>
        <td><span style="color:${suitColor}; font-weight:700; font-size:12px;">${esc(j.suitability)}</span></td>
      </tr>`;
  }).join('');
}

// ─── Filters ──────────────────────────────────
function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.threatFilter = btn.dataset.filter;
      renderCompetitors();
    });
  });
}

function setupJoyFilters() {
  document.querySelectorAll('.joy-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.joy-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.joyFilter = btn.dataset.joyfilter;
      renderJoyProducts();
    });
  });
}

// ─── Counts ───────────────────────────────────
function updateCounts() {
  setEl('count-competitors', state.competitors.length);
  setEl('count-intel', state.intelFeed.length);
  setEl('count-patents', state.patents.length);
  setEl('count-table', state.competitors.length);
  setEl('count-joysticks', state.joysticks.length);
}

// ─── Helpers ──────────────────────────────────
function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function threatIcon(level) {
  return level === 'HIGH' ? '🔴' : level === 'MEDIUM' ? '🟡' : '🟢';
}

document.addEventListener('DOMContentLoaded', init);
