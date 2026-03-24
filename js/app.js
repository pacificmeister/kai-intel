/* ============================================================
   KAI INTEL — Dashboard App
   Loads data from JSON, renders UI
   ============================================================ */

'use strict';

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
let state = {
  competitors: [],
  intelFeed: [],
  patents: [],
  activeSection: 'overview',
  threatFilter: 'all'
};

// ─────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────
async function init() {
  try {
    const [competitors, intelFeed, patents] = await Promise.all([
      fetchJSON('./data/competitors.json'),
      fetchJSON('./data/intel-feed.json'),
      fetchJSON('./data/patents.json')
    ]);

    state.competitors = competitors;
    state.intelFeed = intelFeed;
    state.patents = patents;

    setLastUpdated();
    renderAll();
    setupNav();
    setupFilters();

    // Show default section
    showSection('overview');
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

// ─────────────────────────────────────────────
// Timestamp
// ─────────────────────────────────────────────
function setLastUpdated() {
  const el = document.getElementById('last-updated');
  if (el) {
    const now = new Date();
    el.textContent = 'Updated ' + now.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }
}

// ─────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────
function setupNav() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const section = tab.dataset.section;
      showSection(section);
    });
  });
}

function showSection(name) {
  state.activeSection = name;

  // Update tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.section === name);
  });

  // Show/hide sections
  document.querySelectorAll('.section').forEach(sec => {
    sec.classList.toggle('active', sec.id === `section-${name}`);
  });
}

// ─────────────────────────────────────────────
// Render All
// ─────────────────────────────────────────────
function renderAll() {
  renderOverview();
  renderCompetitors();
  renderIntelFeed();
  renderPatents();
  renderComparisonTable();
  updateCounts();
}

// ─────────────────────────────────────────────
// Overview
// ─────────────────────────────────────────────
function renderOverview() {
  const high = state.competitors.filter(c => c.threatLevel === 'HIGH').length;
  const med = state.competitors.filter(c => c.threatLevel === 'MEDIUM').length;
  const low = state.competitors.filter(c => c.threatLevel === 'LOW').length;

  setEl('stat-high', high);
  setEl('stat-med', med);
  setEl('stat-low', low);
  setEl('stat-total', state.competitors.length);
  setEl('stat-intel', state.intelFeed.length);
  setEl('stat-patents', state.patents.length);

  // Render top threats in overview
  const topThreats = state.competitors.filter(c => c.threatLevel === 'HIGH' || c.threatLevel === 'MEDIUM');
  const overviewCards = document.getElementById('overview-competitors');
  if (overviewCards) {
    overviewCards.innerHTML = topThreats.map(renderCompetitorCard).join('');
  }

  // Recent intel
  const recentIntel = document.getElementById('overview-intel');
  if (recentIntel) {
    const recent = state.intelFeed.slice(0, 4);
    recentIntel.innerHTML = recent.map(renderIntelItem).join('');
  }
}

// ─────────────────────────────────────────────
// Competitor Cards
// ─────────────────────────────────────────────
function renderCompetitorCard(c) {
  const specsHtml = `
    <div class="spec-item">
      <div class="spec-value ${!c.passengers ? 'na' : ''}">${c.passengers ?? '—'}</div>
      <div class="spec-label">Passengers</div>
    </div>
    <div class="spec-item">
      <div class="spec-value ${!c.topSpeed ? 'na' : ''}">${c.topSpeed ?? '—'}</div>
      <div class="spec-label">Top Speed</div>
    </div>
    <div class="spec-item">
      <div class="spec-value ${!c.range ? 'na' : ''}">${c.range ? c.range.split(' ')[0] + (c.range.includes('nmi') ? ' nmi' : (c.range.includes('mi') ? ' mi' : (c.range.includes('km') ? ' km' : (c.range.includes('hr') ? '' : '')))) : '—'}</div>
      <div class="spec-label">Range</div>
    </div>
  `;

  const linksHtml = c.website ? `<a href="${escHtml(c.website)}" target="_blank" class="link-btn">↗ Site</a>` : '';
  const newsLink = c.mediaLinks && c.mediaLinks.length > 0
    ? `<a href="${escHtml(c.mediaLinks[0])}" target="_blank" class="link-btn">📰 News</a>`
    : '';

  return `
    <div class="competitor-card threat-${escHtml(c.threatLevel)}">
      <div class="card-header">
        <div class="card-company">
          <div class="company-name">${escHtml(c.company)}</div>
          <div class="company-location">📍 ${escHtml(c.location)}</div>
        </div>
        <div class="threat-badge ${escHtml(c.threatLevel)}">
          ${threatIcon(c.threatLevel)} ${escHtml(c.threatLevel)}
        </div>
      </div>
      <div class="card-product">
        <div class="product-name">${escHtml(c.product)}</div>
        <div class="product-tagline">${escHtml(c.tagline)}</div>
      </div>
      <div class="card-specs">
        ${specsHtml}
      </div>
      <div class="card-body">
        <div class="card-price">
          <span class="price-label">Price:</span>
          <span class="price-value">${escHtml(c.price ?? 'TBD')}</span>
        </div>
        ${c.fundingStatus ? `<div class="card-funding"><div class="funding-dot"></div><div class="funding-text">${escHtml(c.fundingStatus)}</div></div>` : ''}
        <div class="threat-reason ${escHtml(c.threatLevel)}">${escHtml(c.threatReason)}</div>
        ${c.latestNews ? `<div style="font-size:12px; color:var(--text-muted); margin-top:4px;">🕐 ${escHtml(c.latestNews)}</div>` : ''}
      </div>
      <div class="card-footer">
        <div class="card-tags">
          ${(c.tags || []).slice(0, 4).map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}
        </div>
        <div class="card-links">
          ${linksHtml}
          ${newsLink}
        </div>
      </div>
    </div>
  `;
}

function renderCompetitors() {
  const grid = document.getElementById('competitors-grid');
  if (!grid) return;

  const filtered = state.threatFilter === 'all'
    ? state.competitors
    : state.competitors.filter(c => c.threatLevel === state.threatFilter);

  grid.innerHTML = filtered.length
    ? filtered.map(renderCompetitorCard).join('')
    : `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">No competitors match this filter.</div></div>`;
}

// ─────────────────────────────────────────────
// Intel Feed
// ─────────────────────────────────────────────
function renderIntelItem(item) {
  const sourceHtml = item.url
    ? `<a href="${escHtml(item.url)}" target="_blank" style="color:var(--accent-blue); text-decoration:none; font-size:11px;">↗ ${escHtml(item.source)}</a>`
    : `<span style="font-size:11px; color:var(--text-muted);">${escHtml(item.source)}</span>`;

  return `
    <div class="intel-item">
      <div class="intel-priority ${escHtml(item.priority)}"></div>
      <div class="intel-content">
        <div class="intel-date">${escHtml(item.date)}</div>
        <div class="intel-title">${escHtml(item.title)}</div>
        <div class="intel-summary">${escHtml(item.summary)}</div>
      </div>
      <div class="intel-meta">
        <div class="priority-label ${escHtml(item.priority)}">${escHtml(item.priority)}</div>
        <div class="intel-tags">
          ${sourceHtml}
        </div>
        <div class="intel-tags" style="margin-top:4px;">
          ${(item.tags || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderIntelFeed() {
  const feed = document.getElementById('intel-feed');
  if (!feed) return;

  const sorted = [...state.intelFeed].sort((a, b) => b.date.localeCompare(a.date));
  feed.innerHTML = sorted.map(renderIntelItem).join('');
}

// ─────────────────────────────────────────────
// Patents
// ─────────────────────────────────────────────
function renderPatents() {
  const list = document.getElementById('patents-list');
  if (!list) return;

  list.innerHTML = state.patents.map(p => {
    const relevanceLevel = p.relevance.startsWith('HIGH') ? 'HIGH'
      : p.relevance.startsWith('MEDIUM') ? 'MEDIUM' : 'LOW';

    const statusClean = p.status.replace(/[^a-zA-Z]/g, '').replace('Granted', 'Granted');

    return `
      <div class="patent-card">
        <div>
          <div class="patent-title">${escHtml(p.title)}</div>
          <div class="patent-assignee">Assignee: ${escHtml(p.assignee)}</div>
          <div class="patent-desc">${escHtml(p.description)}</div>
          <div class="patent-relevance">
            <strong style="color:var(--text-primary);">Relevance to Kai Concepts:</strong><br>
            ${escHtml(p.relevance)}
          </div>
          <div class="patent-footer">
            ${(p.tags || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}
          </div>
        </div>
        <div class="patent-meta">
          ${p.number ? `<div class="patent-number">${escHtml(p.number)}</div>` : ''}
          <div class="patent-status ${escHtml(p.status.split('(')[0].trim())}">${escHtml(p.status)}</div>
          <div class="patent-relevance-badge ${relevanceLevel}" style="margin-top:6px;">${relevanceLevel} relevance</div>
          ${p.url ? `<div style="margin-top:8px;"><a href="${escHtml(p.url)}" target="_blank" class="link-btn" style="font-size:10px;">↗ View</a></div>` : ''}
          ${p.country ? `<div style="margin-top:6px; font-size:11px; color:var(--text-muted);">📍 ${escHtml(p.country)}</div>` : ''}
          ${p.filingDate ? `<div style="font-size:11px; color:var(--text-muted);">Filed: ${escHtml(p.filingDate)}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// ─────────────────────────────────────────────
// Comparison Table
// ─────────────────────────────────────────────
function renderComparisonTable() {
  const tbody = document.getElementById('comparison-tbody');
  if (!tbody) return;

  const sorted = [...state.competitors].sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return (order[a.threatLevel] ?? 3) - (order[b.threatLevel] ?? 3);
  });

  tbody.innerHTML = sorted.map(c => {
    const rangeDisplay = c.range ? c.range : '<span class="table-na">—</span>';
    const priceDisplay = c.price ?? '<span class="table-na">—</span>';
    const weightDisplay = c.weight ?? '<span class="table-na">—</span>';
    const lengthDisplay = c.length ?? '<span class="table-na">—</span>';

    return `
      <tr>
        <td class="table-company">${escHtml(c.company)}</td>
        <td class="table-product">${escHtml(c.product)}</td>
        <td class="table-mono">${c.passengers ?? '<span class="table-na">—</span>'}</td>
        <td class="table-mono">${c.topSpeed ? escHtml(c.topSpeed) : '<span class="table-na">—</span>'}</td>
        <td class="table-mono">${c.range ? escHtml(c.range) : '<span class="table-na">—</span>'}</td>
        <td>${c.price ? escHtml(c.price) : '<span class="table-na">—</span>'}</td>
        <td>${c.length ? escHtml(c.length) : '<span class="table-na">—</span>'}</td>
        <td class="table-threat"><span class="threat-dot ${escHtml(c.threatLevel)}">${escHtml(c.threatLevel)}</span></td>
      </tr>
    `;
  }).join('');
}

// ─────────────────────────────────────────────
// Filters
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Update badge counts
// ─────────────────────────────────────────────
function updateCounts() {
  setEl('count-competitors', state.competitors.length);
  setEl('count-intel', state.intelFeed.length);
  setEl('count-patents', state.patents.length);
  setEl('count-table', state.competitors.length);
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function threatIcon(level) {
  return level === 'HIGH' ? '🔴' : level === 'MEDIUM' ? '🟡' : '🟢';
}

// ─────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
