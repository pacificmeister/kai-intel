/* KAI INTEL — Hub Page */
'use strict';

async function fetchJSON(url, fallback) {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback !== undefined ? fallback : [];
    return res.json();
  } catch (e) { return fallback !== undefined ? fallback : []; }
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

async function init() {
  const [competitors, intelFeed, patents, joysticks] = await Promise.all([
    fetchJSON('./data/competitors.json'),
    fetchJSON('./data/intel-feed.json'),
    fetchJSON('./data/patents.json'),
    fetchJSON('./data/joysticks.json')
  ]);

  // Craft stats
  const high = competitors.filter(c => c.threatLevel === 'HIGH').length;
  const med = competitors.filter(c => c.threatLevel === 'MEDIUM').length;
  const low = competitors.filter(c => c.threatLevel === 'LOW').length;
  setEl('hub-craft-high', high);
  setEl('hub-craft-med', med);
  setEl('hub-craft-low', low);
  setEl('hub-craft-total', competitors.length);
  setEl('hub-craft-intel', intelFeed.length);
  setEl('hub-craft-patents', patents.length);

  // Joystick stats
  const top = joysticks.filter(j => j.status === 'TOP CANDIDATE' || j.status === '🔬 ACTIVE EVALUATION').length;
  const cand = joysticks.filter(j => j.status === 'CANDIDATE').length;
  const ref = joysticks.filter(j => j.status === 'REFERENCE').length;
  setEl('hub-joy-top', top);
  setEl('hub-joy-candidates', cand);
  setEl('hub-joy-ref', ref);
  setEl('hub-joy-total', joysticks.length);

  // Updated date
  const upd = document.getElementById('last-updated');
  if (upd) upd.textContent = 'Updated ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

document.addEventListener('DOMContentLoaded', init);
