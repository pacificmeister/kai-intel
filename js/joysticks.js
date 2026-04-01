/* KAI INTEL — Joystick Market Page */
'use strict';

let state = {
  joysticks: [],
  teardowns: [],
  wireReduction: null,
  circuitDesign: null,
  activeSection: 'joy-overview',
  joyFilter: 'candidates'
};

async function fetchJSON(url, fallback) {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback !== undefined ? fallback : [];
    return res.json();
  } catch (e) { return fallback !== undefined ? fallback : []; }
}

function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

async function init() {
  try {
    const [joysticks, teardowns, wireReduction, circuitDesign] = await Promise.all([
      fetchJSON('../data/joysticks.json'),
      fetchJSON('../data/teardowns.json'),
      fetchJSON('../data/wire-reduction.json', null),
      fetchJSON('../data/circuit-design.json', null)
    ]);
    state.joysticks = joysticks;
    state.teardowns = teardowns;
    state.wireReduction = wireReduction;
    state.circuitDesign = circuitDesign;

    const upd = document.getElementById('last-updated');
    if (upd) upd.textContent = 'Updated ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    renderAll();
    setupNavs();
    setupJoyFilters();
  } catch (err) {
    console.error('Failed to load data:', err);
    const errEl = document.getElementById('app-error');
    if (errEl) errEl.style.display = 'block';
  }
}

function setupNavs() {
  document.querySelectorAll('.domain-nav .nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const sectionId = tab.dataset.section;
      document.querySelectorAll('.domain-nav .nav-tab').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.section').forEach(s => s.classList.toggle('active', s.id === 'section-' + sectionId));
      state.activeSection = sectionId;
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

function renderAll() {
  renderJoyOverview();
  renderJoyProducts();
  renderWireReduction();
  renderTeardowns();
  renderJoyComparison();
  setEl('count-joysticks', state.joysticks.length);
  setEl('count-teardowns', state.teardowns.length);
}

// ─── Joystick Card ────────────────────────────
function renderJoystickCard(j) {
  const statusColor = {
    'CURRENT': 'var(--accent-red)',
    '✅ CURRENTLY IN USE': 'var(--accent-blue)',
    '🛒 PURCHASED FOR EVALUATION': 'var(--accent-green)',
    'TOP CANDIDATE': 'var(--accent-green)',
    '🔬 ACTIVE EVALUATION': 'var(--accent-green)',
    '🔬 SAMPLE REQUESTED': 'var(--accent-green)',
    'CANDIDATE': 'var(--accent-yellow)',
    'PROTOTYPING': 'var(--accent-orange)',
    'INVESTIGATION': 'var(--accent-cyan)',
    '❌ UNSUITABLE': 'var(--accent-red)',
    'REFERENCE': 'var(--text-muted)'
  }[j.status] || 'var(--text-muted)';

  const suitColor = { HIGH: 'var(--accent-green)', MEDIUM: 'var(--accent-yellow)', LOW: 'var(--accent-red)', UNSUITABLE: 'var(--accent-red)' }[j.suitability] || 'var(--text-muted)';
  const thumbSrc = j.thumbnail || j.image || '';
  const initials = (j.manufacturer || '').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const videosHtml = (j.videos && j.videos.length) ? `<div style="padding:0 20px 12px; display:flex; gap:6px; flex-wrap:wrap;">${j.videos.map(v => `<a href="${esc(v.url)}" target="_blank" class="link-btn" style="font-size:10px; background:rgba(239,68,68,0.08); border-color:rgba(239,68,68,0.3); color:var(--accent-red);">▶ ${esc(v.title)}</a>`).join('')}</div>` : '';

  return `
    <div class="joystick-card" style="border-top:3px solid ${statusColor};">
      <div class="card-header" style="padding-top:20px; display:flex; gap:14px; align-items:flex-start;">
        <div style="flex-shrink:0; width:100px; height:100px; border-radius:10px; overflow:hidden; background:rgba(255,255,255,0.06); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; position:relative;">${thumbSrc ? `<img src="${esc(thumbSrc)}" alt="${esc(j.name)}" referrerpolicy="no-referrer" crossorigin="anonymous" style="width:100%; height:100%; object-fit:contain; padding:6px; position:relative; z-index:1;" onerror="this.style.display='none'">` : ''}<span style="font-size:28px; font-weight:800; color:var(--text-muted); opacity:0.4; position:absolute;">${initials}</span></div>
        <div class="card-company" style="flex:1;">
          <div class="company-name">${esc(j.name)}</div>
          <div class="company-location">🏭 ${esc(j.manufacturer)} · 📍 ${esc(j.country)}</div>
        </div>
        <div style="display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
          <span style="background:${statusColor}22; border:1px solid ${statusColor}55; color:${statusColor}; font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px;">${esc(j.status)}</span>
          <span style="font-size:10px; color:${suitColor}; font-weight:600;">Suitability: ${esc(j.suitability)}</span>
        </div>
      </div>
      <div style="padding:0 20px 12px;"><div style="font-size:12px; color:var(--text-secondary); line-height:1.5;">${esc(j.statusNote)}</div></div>
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
  const inuse = state.joysticks.filter(j => j.status === '✅ CURRENTLY IN USE');
  const purchased = state.joysticks.filter(j => j.status === '🛒 PURCHASED FOR EVALUATION');
  const requested = state.joysticks.filter(j => j.status === '🔬 SAMPLE REQUESTED' || j.status === '🔬 ACTIVE EVALUATION');
  const candidates = state.joysticks.filter(j => j.status === 'CANDIDATE');
  setEl('stat-joy-inuse', inuse.length);
  setEl('stat-joy-purchased', purchased.length);
  setEl('stat-joy-requested', requested.length);
  setEl('stat-joy-candidate', candidates.length);
  setEl('stat-joy-total', state.joysticks.length);

  const grid = document.getElementById('joy-overview-grid');
  if (grid) {
    const candidateStatuses = ['✅ CURRENTLY IN USE', '🛒 PURCHASED FOR EVALUATION', '🔬 SAMPLE REQUESTED', '🔬 ACTIVE EVALUATION', 'CANDIDATE'];
    const featured = state.joysticks.filter(j => candidateStatuses.includes(j.status));
    grid.innerHTML = featured.map(renderJoystickCard).join('');
  }
}

function renderJoyProducts() {
  const grid = document.getElementById('joy-products-grid');
  if (!grid) return;
  const candidateStatuses = ['✅ CURRENTLY IN USE', '🛒 PURCHASED FOR EVALUATION', '🔬 SAMPLE REQUESTED', 'CANDIDATE', '🔬 ACTIVE EVALUATION'];
  const filtered = state.joyFilter === 'all' ? state.joysticks : state.joyFilter === 'candidates' ? state.joysticks.filter(j => candidateStatuses.includes(j.status)) : state.joysticks.filter(j => j.status === state.joyFilter);
  grid.innerHTML = filtered.length ? filtered.map(renderJoystickCard).join('') : '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">No joysticks match this filter.</div></div>';
}

// ─── Wire Reduction (large render) ───────────
function renderCircuitDesign() {
  const cd = state.circuitDesign;
  if (!cd) return '';
  const pinoutRows = cd.schematic.gripSide.mcu.pinout.map(p => `<tr><td style="font-family:var(--font-mono); font-weight:700; color:var(--accent-cyan); text-align:center;">${p.pin}</td><td style="font-weight:600; color:var(--text-primary);">${esc(p.name)}</td><td style="color:var(--text-secondary);">${esc(p.function)}</td><td style="color:var(--text-muted); font-size:11px;">${esc(p.connection)}</td></tr>`).join('');
  const passivesHtml = cd.schematic.gripSide.passives.map(p => `<div style="font-size:11px; color:var(--text-secondary); margin-bottom:4px; padding-left:8px; border-left:2px solid var(--accent-cyan)33;"><strong style="color:var(--accent-blue);">${esc(p.part)}</strong> — ${esc(p.function)}</div>`).join('');
  const shaftWires = cd.schematic.shaftWiring.wires.map(w => `<div style="display:flex; gap:10px; align-items:center; margin-bottom:6px;"><span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:${w.color === 'Red' ? '#ef4444' : w.color === 'Black' ? '#333' : '#eab308'}; border:1px solid var(--border);"></span><span style="font-size:13px; font-weight:600; color:var(--text-primary); min-width:80px;">Wire ${w.wire}</span><span style="font-size:13px; color:var(--accent-cyan); font-family:var(--font-mono);">${esc(w.signal)}</span><span style="font-size:11px; color:var(--text-muted);">${esc(w.gauge)}</span></div>`).join('');
  const testSteps = cd.testing.breadboardPrototype.steps.map(s => `<div style="font-size:12px; color:var(--text-secondary); margin-bottom:4px; padding-left:8px; border-left:2px solid var(--accent-green)33;">${esc(s)}</div>`).join('');
  const risks = Object.values(cd.riskMitigation).map(r => `<div style="background:rgba(0,0,0,0.15); border:1px solid var(--border); border-radius:var(--radius-sm); padding:12px; margin-bottom:8px;"><div style="font-size:12px; font-weight:600; color:var(--accent-red);">⚠️ ${esc(r.risk)}</div><div style="font-size:11px; color:var(--text-secondary); margin-top:4px;">✅ ${esc(r.mitigation)}</div></div>`).join('');
  return `
    <div style="margin-top:40px; padding-top:24px; border-top:2px solid var(--accent-blue);">
      <div style="font-size:22px; font-weight:800; color:var(--accent-blue); margin-bottom:6px;">📐 Full Circuit Design: ${esc(cd.title)}</div>
      <div style="font-size:13px; color:var(--text-secondary); margin-bottom:24px;">${esc(cd.overview)}</div>
      <div style="background:#0d1117; border:1px solid var(--border); border-radius:var(--radius); padding:20px; margin-bottom:24px; overflow-x:auto;">
        <div style="font-size:11px; font-weight:700; color:var(--accent-green); margin-bottom:12px;">📋 SCHEMATIC</div>
        <pre style="font-family:var(--font-mono); font-size:11px; color:var(--accent-green); line-height:1.4; white-space:pre; margin:0;">${esc(cd.asciiSchematic)}</pre>
      </div>
      <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:20px; margin-bottom:24px;">
        <div style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:4px;">🔌 ATtiny85 Pinout (${esc(cd.schematic.gripSide.mcu.package)})</div>
        <div style="font-size:11px; color:var(--text-muted); margin-bottom:12px;">${esc(cd.schematic.gripSide.mcu.part)} · ${esc(cd.schematic.gripSide.mcu.voltage)} · ${esc(cd.schematic.gripSide.mcu.clock)} · ${esc(cd.schematic.gripSide.mcu.cost)}</div>
        <div class="table-wrapper"><table class="comparison-table" style="font-size:12px;"><thead><tr><th>Pin</th><th>Name</th><th>Function</th><th>Connection</th></tr></thead><tbody>${pinoutRows}</tbody></table></div>
      </div>
      <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:20px; margin-bottom:24px;">
        <div style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:12px;">🔧 Passive Components (Total BOM: ${esc(cd.schematic.gripSide.totalBOM)})</div>
        ${passivesHtml}
        <div style="font-size:12px; color:var(--text-muted); margin-top:12px;">Board: ${esc(cd.schematic.gripSide.boardDimensions)}</div>
      </div>
      <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:20px; margin-bottom:24px;">
        <div style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:12px;">🔌 Through-Shaft Wiring (3 Wires)</div>
        ${shaftWires}
        <div style="font-size:12px; color:var(--text-muted); margin-top:12px; padding:8px; background:rgba(0,0,0,0.15); border-radius:var(--radius-sm);">${esc(cd.schematic.shaftWiring.recommendedProtocol)}</div>
      </div>
      <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:20px; margin-bottom:24px;">
        <div style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:12px;">💻 Firmware (Ready to Flash)</div>
        <details style="margin-bottom:16px;"><summary style="font-size:13px; font-weight:600; color:var(--accent-blue); cursor:pointer; padding:8px 0;">ATtiny85 Grip Firmware (I2C Slave) — ${esc(cd.firmware.gripFirmware.flashUsage)}</summary><pre style="background:#0d1117; border:1px solid var(--border); border-radius:var(--radius-sm); padding:16px; margin-top:8px; font-family:var(--font-mono); font-size:11px; color:var(--accent-green); overflow-x:auto; white-space:pre; line-height:1.5;">${esc(cd.firmware.gripFirmware.code)}</pre></details>
        <details style="margin-bottom:16px;"><summary style="font-size:13px; font-weight:600; color:var(--accent-yellow); cursor:pointer; padding:8px 0;">Alternative: ATtiny85 UART Firmware</summary><pre style="background:#0d1117; border:1px solid var(--border); border-radius:var(--radius-sm); padding:16px; margin-top:8px; font-family:var(--font-mono); font-size:11px; color:var(--accent-green); overflow-x:auto; white-space:pre; line-height:1.5;">${esc(cd.firmware.gripFirmware.codeUART)}</pre></details>
        <details><summary style="font-size:13px; font-weight:600; color:var(--accent-cyan); cursor:pointer; padding:8px 0;">Teensy 4.1 Integration Code — ~${esc(cd.firmware.teensyFirmware.linesOfCodeChange)}</summary><pre style="background:#0d1117; border:1px solid var(--border); border-radius:var(--radius-sm); padding:16px; margin-top:8px; font-family:var(--font-mono); font-size:11px; color:var(--accent-green); overflow-x:auto; white-space:pre; line-height:1.5;">${esc(cd.firmware.teensyFirmware.codeI2C)}</pre></details>
      </div>
      <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:20px; margin-bottom:24px;">
        <div style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:12px;">🧪 Testing Plan</div>
        <div style="font-size:13px; font-weight:600; color:var(--accent-green); margin-bottom:8px;">Step 1: Breadboard Validation (${esc(cd.testing.breadboardPrototype.time)})</div>
        ${testSteps}
        <div style="font-size:11px; font-weight:700; color:var(--text-primary); margin-top:12px; margin-bottom:6px;">✅ Success Criteria:</div>
        ${cd.testing.breadboardPrototype.successCriteria.map(c => `<div style="font-size:11px; color:var(--accent-green); margin-bottom:3px;">• ${esc(c)}</div>`).join('')}
      </div>
      <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:20px;">
        <div style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:12px;">🛡️ Risk Mitigation</div>
        ${risks}
      </div>
    </div>`;
}

function renderWireReduction() {
  const el = document.getElementById('wirereduction-content');
  if (!el || !state.wireReduction) return;
  const wr = state.wireReduction;
  const approachCards = wr.approaches.map(a => {
    const diffColor = a.difficulty === 'LOW' ? 'var(--accent-green)' : a.difficulty === 'MEDIUM' ? 'var(--accent-yellow)' : a.difficulty === 'LOW-MEDIUM' ? 'var(--accent-green)' : 'var(--accent-orange)';
    const isBest = wr.recommendation.bestOption.includes(a.name.split(':')[0]);
    return `
      <div style="background:var(--bg-card); border:1px solid ${isBest ? 'var(--accent-green)' : 'var(--border)'}; border-radius:var(--radius); padding:20px 24px; margin-bottom:16px; ${isBest ? 'border-width:2px; box-shadow:0 0 20px rgba(16,185,129,0.1);' : ''}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; margin-bottom:12px;">
          <div>
            <div style="font-size:16px; font-weight:700; color:var(--text-primary);">${esc(a.name)}</div>
            <div style="display:flex; gap:8px; margin-top:6px; flex-wrap:wrap;">
              <span style="font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; background:${diffColor}22; border:1px solid ${diffColor}55; color:${diffColor}; text-transform:uppercase;">${esc(a.difficulty)} difficulty</span>
              <span style="font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; background:var(--accent-cyan)22; border:1px solid var(--accent-cyan)55; color:var(--accent-cyan);">${a.wireCount} wires</span>
              <span style="font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; background:var(--accent-yellow)22; border:1px solid var(--accent-yellow)55; color:var(--accent-yellow);">~${esc(a.cost)}</span>
              ${isBest ? '<span style="font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; background:var(--accent-green)22; border:1px solid var(--accent-green)55; color:var(--accent-green);">⭐ RECOMMENDED</span>' : ''}
            </div>
          </div>
          <div style="font-size:28px; font-weight:800; color:var(--accent-cyan); font-family:var(--font-mono);">${a.wireCount}</div>
        </div>
        <div style="font-size:13px; color:var(--text-secondary); line-height:1.6; margin-bottom:12px;">${esc(a.description)}</div>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:12px;"><strong style="color:var(--text-primary);">Wire breakdown:</strong> ${esc(a.wireBreakdown)}</div>
        ${a.circuitDesign ? `<details style="margin-bottom:12px;"><summary style="font-size:12px; font-weight:600; color:var(--accent-blue); cursor:pointer; padding:6px 0;">📐 Circuit Design Details</summary><div style="margin-top:8px; padding:12px; background:rgba(0,0,0,0.2); border-radius:var(--radius-sm);"><div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px;"><strong style="color:var(--text-primary);">Board size:</strong> ${esc(a.circuitDesign.totalBoardSize)}</div><div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px;"><strong style="color:var(--text-primary);">BOM cost:</strong> ${esc(a.circuitDesign.totalCost)}</div><div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px;"><strong style="color:var(--text-primary);">Protocol:</strong> ${esc(a.circuitDesign.protocol)}</div><div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px;"><strong style="color:var(--text-primary);">Data rate:</strong> ${esc(a.circuitDesign.dataRate)}</div><div style="font-size:11px; font-weight:700; color:var(--text-primary); margin-top:12px; margin-bottom:6px;">Components:</div>${a.circuitDesign.components.map(c => `<div style="font-size:11px; color:var(--text-secondary); margin-bottom:4px; padding-left:8px; border-left:2px solid var(--border);"><strong style="color:var(--accent-blue);">${esc(c.part)}</strong> — ${esc(c.role)} <span style="color:var(--text-muted);">(${esc(c.size)}, ${esc(c.cost)})</span></div>`).join('')}</div></details>` : ''}
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div><div style="font-size:10px; font-weight:700; color:var(--accent-green); text-transform:uppercase; margin-bottom:4px;">✅ Pros</div>${a.pros.slice(0, 5).map(p => `<div style="font-size:11px; color:var(--text-secondary); margin-bottom:3px; padding-left:6px; border-left:2px solid var(--accent-green)33;">${esc(p)}</div>`).join('')}</div>
          <div><div style="font-size:10px; font-weight:700; color:var(--accent-red); text-transform:uppercase; margin-bottom:4px;">⚠️ Cons</div>${a.cons.slice(0, 5).map(c => `<div style="font-size:11px; color:var(--text-secondary); margin-bottom:3px; padding-left:6px; border-left:2px solid var(--accent-red)33;">${esc(c)}</div>`).join('')}</div>
        </div>
        <div style="font-size:12px; color:var(--text-secondary); margin-top:12px; padding:8px 12px; background:rgba(255,255,255,0.02); border-left:3px solid ${diffColor}; border-radius:0 var(--radius-sm) var(--radius-sm) 0;"><strong style="color:var(--text-primary);">Feasibility:</strong> ${esc(a.feasibility)}</div>
      </div>`;
  }).join('');

  const protoSteps = wr.recommendation.quickPrototype.steps.map(s => `<div style="font-size:12px; color:var(--text-secondary); margin-bottom:6px; padding-left:8px; border-left:2px solid var(--accent-green)33;">${esc(s)}</div>`).join('');
  const protoParts = wr.recommendation.quickPrototype.parts.map(p => `<span class="tag" style="margin-right:4px; margin-bottom:4px;">${esc(p)}</span>`).join('');

  el.innerHTML = `
    <div class="market-gap" style="margin-top:0; margin-bottom:24px;"><div class="gap-icon">🔌</div><div><div class="gap-title">The Problem: 6 Wires, Only Room for 3</div><div class="gap-text">${esc(wr.problem.summary)}</div></div></div>
    <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3); border-radius:var(--radius); padding:20px; margin-bottom:24px;">
      <div style="font-size:14px; font-weight:700; color:var(--accent-green); margin-bottom:8px;">💡 Key Melexis Insight</div>
      <div style="font-size:13px; color:var(--text-secondary); line-height:1.6;">${esc(wr.melexisInfo.spiCapability)}</div>
      <div style="font-size:13px; color:var(--text-primary); line-height:1.6; margin-top:8px; font-weight:600;">${esc(wr.melexisInfo.keyInsight)}</div>
    </div>
    <div style="display:flex; gap:16px; margin-bottom:32px; flex-wrap:wrap;">
      <div style="flex:1; min-width:140px; background:var(--bg-card); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius); padding:20px; text-align:center;"><div style="font-size:36px; font-weight:800; color:var(--accent-red); font-family:var(--font-mono);">6</div><div style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">Current Wires</div></div>
      <div style="display:flex; align-items:center; font-size:24px; color:var(--text-muted);">→</div>
      <div style="flex:1; min-width:140px; background:var(--bg-card); border:1px solid rgba(16,185,129,0.3); border-radius:var(--radius); padding:20px; text-align:center;"><div style="font-size:36px; font-weight:800; color:var(--accent-green); font-family:var(--font-mono);">3</div><div style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">Target Wires</div></div>
      <div style="display:flex; align-items:center; font-size:24px; color:var(--text-muted);">=</div>
      <div style="flex:1; min-width:140px; background:var(--bg-card); border:1px solid rgba(59,130,246,0.3); border-radius:var(--radius); padding:20px; text-align:center;"><div style="font-size:36px; font-weight:800; color:var(--accent-blue); font-family:var(--font-mono);">✓</div><div style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">Reuse Existing HF55 Path</div></div>
    </div>
    <div style="font-size:18px; font-weight:700; color:var(--text-primary); margin-bottom:16px;">📋 5 Approaches Evaluated</div>
    ${approachCards}
    <div style="background:linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(59,130,246,0.05) 100%); border:1px solid rgba(16,185,129,0.3); border-radius:var(--radius); padding:24px; margin-top:32px;">
      <div style="font-size:16px; font-weight:700; color:var(--accent-green); margin-bottom:6px;">⚡ Quick Prototype Plan (${esc(wr.recommendation.quickPrototype.timeEstimate)})</div>
      <div style="font-size:13px; color:var(--text-secondary); margin-bottom:16px;">${esc(wr.recommendation.reason)}</div>
      <div style="font-size:11px; font-weight:700; color:var(--text-primary); margin-bottom:8px;">Parts needed:</div>
      <div style="margin-bottom:16px; display:flex; flex-wrap:wrap; gap:4px;">${protoParts}</div>
      <div style="font-size:11px; font-weight:700; color:var(--text-primary); margin-bottom:8px;">Steps:</div>
      ${protoSteps}
      <div style="font-size:12px; color:var(--text-muted); margin-top:12px; font-style:italic;">Fallback: ${esc(wr.recommendation.alternativeIfI2CFailsDueToEMI)}</div>
    </div>
    ${renderCircuitDesign()}`;
}

function renderTeardowns() {
  const feed = document.getElementById('teardowns-feed');
  if (!feed) return;
  feed.innerHTML = state.teardowns.map(t => {
    const typeColor = t.type === 'TEARDOWN' || t.type === 'TEARDOWN VIDEO' ? 'var(--accent-red)' : t.type === 'TECHNICAL REFERENCE' ? 'var(--accent-blue)' : t.type === 'NOTE' ? 'var(--accent-orange)' : 'var(--text-muted)';
    const typeIcon = t.type === 'TEARDOWN VIDEO' ? '▶️' : t.type === 'TEARDOWN' ? '🔧' : t.type === 'TECHNICAL REFERENCE' ? '📖' : t.type === 'NOTE' ? '📝' : '📄';
    const findingsHtml = (t.findings || []).map(f => `<li style="font-size:12px; color:var(--text-secondary); margin-bottom:6px; padding-left:4px; line-height:1.5;">${esc(f)}</li>`).join('');
    return `
      <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); margin-bottom:16px; overflow:hidden; border-left:4px solid ${typeColor};">
        <div style="padding:20px 24px 12px; display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap;">
          <div style="flex:1; min-width:250px;">
            <div style="display:flex; gap:8px; align-items:center; margin-bottom:6px;">
              <span style="font-size:18px;">${typeIcon}</span>
              <span style="font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; background:${typeColor}22; border:1px solid ${typeColor}55; color:${typeColor}; text-transform:uppercase; letter-spacing:0.5px;">${esc(t.type)}</span>
              <span style="font-size:11px; color:var(--text-muted);">via ${esc(t.source)}</span>
            </div>
            <div style="font-size:16px; font-weight:700; color:var(--text-primary);">${esc(t.title)}</div>
          </div>
          ${t.url ? `<a href="${esc(t.url)}" target="_blank" class="link-btn">↗ View Source</a>` : ''}
        </div>
        <div style="padding:0 24px 16px;"><div style="font-size:13px; color:var(--text-secondary); line-height:1.6;">${esc(t.description)}</div></div>
        <div style="padding:0 24px 16px;"><div style="font-size:11px; font-weight:700; color:var(--text-primary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">🔍 Key Findings</div><ul style="list-style:disc; padding-left:20px; margin:0;">${findingsHtml}</ul></div>
        <div style="padding:0 24px 16px;"><div style="font-size:12px; color:var(--text-secondary); padding:10px 12px; background:rgba(59,130,246,0.05); border-left:3px solid var(--accent-blue); border-radius:0 var(--radius-sm) var(--radius-sm) 0; line-height:1.6;"><strong style="color:var(--accent-blue);">Relevance to ThumbJoy:</strong> ${esc(t.relevanceToThumbJoy)}</div></div>
        <div style="padding:8px 24px 16px; display:flex; gap:4px; flex-wrap:wrap;">${(t.tags || []).map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
      </div>`;
  }).join('');
}

function renderJoyComparison() {
  const tbody = document.getElementById('joy-comparison-tbody');
  if (!tbody) return;
  const order = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2, 'UNSUITABLE': 3 };
  const sorted = [...state.joysticks].sort((a, b) => (order[a.suitability] ?? 3) - (order[b.suitability] ?? 3));
  tbody.innerHTML = sorted.map(j => {
    const suitColor = { HIGH: 'var(--accent-green)', MEDIUM: 'var(--accent-yellow)', LOW: 'var(--accent-red)', UNSUITABLE: 'var(--accent-red)' }[j.suitability] || 'var(--text-muted)';
    const shaftHtml = j.hollowShaft === true ? '<span style="color:var(--accent-green);">✅ Yes</span>' : j.hollowShaft === false ? '<span style="color:var(--accent-red);">❌ No</span>' : '<span class="table-na">❓</span>';
    return `<tr><td style="font-weight:600; color:var(--text-primary); white-space:nowrap;">${esc(j.name)}</td><td>${esc(j.manufacturer)}</td><td style="font-size:12px;">${esc(j.axes)}</td><td style="font-size:12px;">${esc(j.sensorType)}</td><td style="font-size:12px;">${esc(j.output)}</td><td style="font-size:12px;">${esc(j.ipRating)}</td><td>${shaftHtml}</td><td style="font-size:12px;">${esc(j.price)}</td><td><span style="color:${suitColor}; font-weight:700; font-size:12px;">${esc(j.suitability)}</span></td></tr>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', init);
