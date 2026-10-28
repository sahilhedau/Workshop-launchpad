/**
 * Workshop Launchpad - Main Application Logic
 * Full-Stack Growth Engineering, Attribution Tracking & Interactive Pacing Engine
 */

(function () {
  'use strict';

  // --- Campaign Constants (Aligned with 5-Slide Strategy) ---
  const CAMPAIGN_GOAL = 500;
  const TOTAL_DAYS = 7;
  const CAMPAIGN_BUDGET = 2000;
  const TARGET_PACING = [40, 120, 210, 300, 390, 450, 500];

  const CHANNEL_META = {
    wa: { name: 'WhatsApp Groups (Connectors)', baseShare: 250, color: 'var(--channel-wa)', class: 'wa' },
    club: { name: 'Clubs & Communities', baseShare: 140, color: 'var(--channel-club)', class: 'club' },
    ref: { name: 'Student Referrals (Viral Loop)', baseShare: 117, color: 'var(--channel-ref)', class: 'ref' },
    paid: { name: 'Paid Test Reserve (Contingency)', baseShare: 0, color: 'var(--channel-paid)', class: 'paid' }
  };

  // Base Demo State
  const DEFAULT_STATE = {
    day: 4,
    daily: [36, 68, 85, 73, 0, 0, 0],
    links: [
      { c: "ADI-7KQ", l: "Aditi Sharma (Campus Connector)", ch: "wa", k: "VNR VJIET Hyderabad", clicks: 325, n: 52, createdAt: "2026-10-25T09:15:00.000Z" },
      { c: "CHE-9PL", l: "Chetan Verma (Campus Connector)", ch: "wa", k: "Gokaraju Rangaraju IT", clicks: 280, n: 45, createdAt: "2026-10-25T10:00:00.000Z" },
      { c: "BHA-3MX", l: "Bhavna Patel (Campus Connector)", ch: "wa", k: "CBIT Hyderabad", clicks: 260, n: 41, createdAt: "2026-10-25T11:30:00.000Z" },
      { c: "COD-2RT", l: "CSE Coding Club & AI Circle", ch: "club", k: "VNR VJIET Hyderabad", clicks: 240, n: 38, createdAt: "2026-10-26T08:00:00.000Z" },
      { c: "GDS-8WN", l: "Google Developer Student Club", ch: "club", k: "Vasavi College of Engg", clicks: 210, n: 32, createdAt: "2026-10-26T09:30:00.000Z" },
      { c: "STU-4ZA", l: "Karthik Reddy (Peer Advocate)", ch: "ref", k: "CBIT Hyderabad", clicks: 120, n: 21, createdAt: "2026-10-27T12:00:00.000Z" },
      { c: "STU-6HB", l: "Sneha Kulkarni (Peer Advocate)", ch: "ref", k: "Gokaraju Rangaraju IT", clicks: 95, n: 18, createdAt: "2026-10-27T14:15:00.000Z" },
      { c: "STU-5DC", l: "Rahul Nair (Peer Advocate)", ch: "ref", k: "VNR VJIET Hyderabad", clicks: 80, n: 15, createdAt: "2026-10-27T16:45:00.000Z" }
    ],
    recentRegistrations: [
      { id: "REG-1049", code: "ADI-7KQ", connector: "Aditi Sharma", channel: "wa", college: "VNR VJIET", branch: "CSE Final Year", timestamp: "2026-10-28T16:42:00.000Z" },
      { id: "REG-1048", code: "COD-2RT", connector: "CSE Coding Club", channel: "club", college: "VNR VJIET", branch: "IT Final Year", timestamp: "2026-10-28T16:15:00.000Z" },
      { id: "REG-1047", code: "STU-4ZA", connector: "Karthik Reddy", channel: "ref", college: "CBIT", branch: "ECE Final Year", timestamp: "2026-10-28T15:50:00.000Z" },
      { id: "REG-1046", code: "CHE-9PL", connector: "Chetan Verma", channel: "wa", college: "Gokaraju Rangaraju IT", branch: "AI & DS Final Year", timestamp: "2026-10-28T15:10:00.000Z" }
    ]
  };

  // State Container
  let state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  let isLiveBackend = false;
  let currentFilter = 'all';
  let searchQuery = '';

  // DOM Helpers
  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  function isGitHubPagesDemo() {
    return window.location.hostname.endsWith('.github.io');
  }

  function getRegistrationUrl(params = {}) {
    const url = new URL('register.html', window.location.href);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    return url.href;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // --- Storage Service ---
  const StorageService = {
    async init() {
      if (!isGitHubPagesDemo()) {
        try {
          const res = await fetch('/api/state', { cache: 'no-cache' });
          if (res.ok) {
            const remoteState = await res.json();
            if (remoteState && remoteState.links) {
              state = remoteState;
              isLiveBackend = true;
              this.updateEnvBadge(true);
              return;
            }
          }
        } catch (e) {
          // Standalone or file:// mode
        }
      }

      // Fallback to localStorage
      isLiveBackend = false;
      this.updateEnvBadge(false);
      try {
        const local = localStorage.getItem('wl_state_v2');
        if (local) {
          state = JSON.parse(local);
        }
      } catch (e) {
        console.warn('LocalStorage error, using defaults:', e);
      }
      this.normalizeState();
    },

    updateEnvBadge(isLive) {
      const badge = $('env-badge');
      if (!badge) return;
      if (isLive) {
        badge.className = 'badge badge-live';
        badge.innerHTML = '● Live Backend Synced';
        badge.title = 'Connected to Node.js REST API with file persistence';
      } else {
        badge.className = 'badge badge-demo';
        badge.innerHTML = '● Standalone Mode (Demo)';
        badge.title = 'Running in browser localStorage mode';
      }
    },

    normalizeState() {
      if (!state.daily || !Array.isArray(state.daily)) {
        state.daily = [36, 68, 85, 73, 0, 0, 0];
      }
      while (state.daily.length < 7) state.daily.push(0);
      if (!state.links) state.links = [];
      if (!state.day) state.day = 4;
      if (!state.recentRegistrations) state.recentRegistrations = [];
    },

    async save() {
      this.normalizeState();
      try {
        localStorage.setItem('wl_state_v2', JSON.stringify(state));
      } catch (e) {}

      if (isLiveBackend) {
        // In backend mode, actions are already synced via endpoints
      }
    }
  };

  // --- Metrics Engine ---
  const MetricsEngine = {
    getTotalRegistrations() {
      return state.daily.reduce((sum, n) => sum + (Number(n) || 0), 0);
    },

    getChannelTotals() {
      const totals = { wa: 0, club: 0, ref: 0, paid: 0 };
      const clicks = { wa: 0, club: 0, ref: 0, paid: 0 };
      state.links.forEach(l => {
        if (totals[l.ch] !== undefined) {
          totals[l.ch] += (l.n || 0);
          clicks[l.ch] += (l.clicks || 0);
        }
      });
      return { totals, clicks };
    },

    getPacingMetrics() {
      const currentDay = Math.min(Math.max(1, state.day || 1), 7);
      const total = this.getTotalRegistrations();
      const targetForDay = TARGET_PACING[currentDay - 1];
      const delta = total - targetForDay;
      const pctGoal = Math.round((total / CAMPAIGN_GOAL) * 100);
      const pctTarget = targetForDay > 0 ? Math.round((total / targetForDay) * 100) : 100;
      const leftToGoal = Math.max(0, CAMPAIGN_GOAL - total);
      const daysRemaining = TOTAL_DAYS - currentDay;
      const requiredRunRate = daysRemaining > 0 ? Math.ceil(leftToGoal / daysRemaining) : leftToGoal;

      // Status Assessment
      let status = 'on_track';
      if (pctTarget < 90) {
        status = 'behind';
      } else if (pctTarget < 100) {
        status = 'caution';
      }

      // Unit Economics
      const currentCAC = total > 0 ? (CAMPAIGN_BUDGET / total).toFixed(2) : '0.00';
      const targetCAC = (CAMPAIGN_BUDGET / CAMPAIGN_GOAL).toFixed(2);

      // Viral Coefficient K = (referral regs / direct regs)
      const { totals } = this.getChannelTotals();
      const directRegs = (totals.wa || 0) + (totals.club || 0);
      const refRegs = totals.ref || 0;
      const viralRate = directRegs > 0 ? ((refRegs / directRegs) * 100).toFixed(1) : '0.0';
      const kFactor = directRegs > 0 ? (refRegs / directRegs).toFixed(2) : '0.00';

      return {
        currentDay,
        total,
        targetForDay,
        delta,
        pctGoal,
        pctTarget,
        leftToGoal,
        daysRemaining,
        requiredRunRate,
        status,
        currentCAC,
        targetCAC,
        refRegs,
        directRegs,
        viralRate,
        kFactor
      };
    }
  };

  // --- SVG Chart Renderer ---
  const ChartRenderer = {
    renderCumulativeChart() {
      const container = $('cumulative-chart');
      if (!container) return;

      const W = 700;
      const H = 220;
      const P_LEFT = 45;
      const P_RIGHT = 35;
      const P_TOP = 25;
      const P_BOTTOM = 35;

      const total = MetricsEngine.getTotalRegistrations();
      const maxY = Math.max(550, total + 40);

      const getX = i => P_LEFT + (i * (W - P_LEFT - P_RIGHT)) / 6;
      const getY = val => H - P_BOTTOM - (val * (H - P_TOP - P_BOTTOM)) / maxY;

      // Cumulative actual values up to current day
      let runningActual = 0;
      const actualPoints = [];
      for (let i = 0; i < state.day; i++) {
        runningActual += (state.daily[i] || 0);
        actualPoints.push({ x: getX(i), y: getY(runningActual), day: i + 1, val: runningActual });
      }

      // Build target path (dashed)
      const targetPath = TARGET_PACING.map((v, i) => `${i === 0 ? 'M' : 'L'}${getX(i).toFixed(1)},${getY(v).toFixed(1)}`).join(' ');

      // Build actual path
      let actualPath = '';
      if (actualPoints.length > 0) {
        actualPath = actualPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
      }

      // Target 500 line
      const target500Y = getY(500);

      // Grid Lines
      const gridLines = [100, 200, 300, 400, 500].map(v => {
        const y = getY(v);
        return `
          <line x1="${P_LEFT}" y1="${y}" x2="${W - P_RIGHT}" y2="${y}" stroke="var(--border-color)" stroke-dasharray="3 3" opacity="0.6" />
          <text x="${P_LEFT - 8}" y="${y + 4}" font-size="10" fill="var(--text-muted)" text-anchor="end">${v}</text>
        `;
      }).join('');

      // X-axis day markers
      const dayMarkers = TARGET_PACING.map((v, i) => {
        const x = getX(i);
        const isCurrent = (i + 1) === state.day;
        return `
          <text x="${x}" y="${H - 12}" font-size="${isCurrent ? '12' : '11'}" font-weight="${isCurrent ? '700' : '400'}" fill="${isCurrent ? 'var(--accent-primary)' : 'var(--text-muted)'}" text-anchor="middle">Day ${i + 1}</text>
          ${isCurrent ? `<circle cx="${x}" cy="${H - 24}" r="3" fill="var(--accent-primary)" />` : ''}
        `;
      }).join('');

      // Actual Points Dots
      const dots = actualPoints.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="5" fill="var(--accent-primary)" stroke="var(--bg-card)" stroke-width="2" class="chart-point" data-day="${p.day}" data-val="${p.val}">
          <title>Day ${p.day}: ${p.val} registrations</title>
        </circle>
      `).join('');

      container.innerHTML = `
        <svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img" aria-label="Actual vs Target cumulative registrations pacing curve">
          <defs>
            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--accent-primary)" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="var(--accent-primary)" stop-opacity="0.0"/>
            </linearGradient>
          </defs>
          ${gridLines}
          <line x1="${P_LEFT}" y1="${target500Y}" x2="${W - P_RIGHT}" y2="${target500Y}" stroke="var(--success)" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.8"/>
          <text x="${W - P_RIGHT}" y="${target500Y - 6}" font-size="10" font-weight="700" fill="var(--success)" text-anchor="end">GOAL 500</text>
          <path d="${targetPath}" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-dasharray="5 5" opacity="0.7"/>
          ${actualPath ? `<path d="${actualPath}" fill="none" stroke="var(--accent-primary)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
          ${dots}
          ${dayMarkers}
        </svg>
        <div class="chart-legend">
          <div class="legend-item"><div class="legend-dashed"></div><span>Planned Target (Pacing Schedule)</span></div>
          <div class="legend-item"><div class="legend-line" style="background: var(--accent-primary)"></div><span>Actual Cumulative Registrations</span></div>
          <div class="legend-item"><div class="legend-dashed" style="border-color: var(--success)"></div><span>Campaign Goal (500)</span></div>
        </div>
      `;
    },

    renderDailyBarChart() {
      const container = $('daily-bar-chart');
      if (!container) return;

      const W = 700;
      const H = 140;
      const P_LEFT = 40;
      const P_RIGHT = 30;
      const P_TOP = 20;
      const P_BOTTOM = 25;

      const maxDaily = Math.max(100, ...state.daily) + 15;
      const barWidth = 36;
      const getX = i => P_LEFT + (i * (W - P_LEFT - P_RIGHT)) / 6;
      const getY = val => H - P_BOTTOM - (val * (H - P_TOP - P_BOTTOM)) / maxDaily;

      const bars = state.daily.map((val, i) => {
        const x = getX(i) - barWidth / 2;
        const y = getY(val);
        const barHeight = Math.max(0, H - P_BOTTOM - y);
        const isCurrent = (i + 1) === state.day;
        const isFuture = (i + 1) > state.day;

        return `
          <g class="bar-group" data-day="${i + 1}">
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4"
                  fill="${isCurrent ? 'var(--accent-primary)' : isFuture ? 'var(--border-color)' : 'var(--accent-light)'}"
                  stroke="${isCurrent ? 'var(--accent-hover)' : 'var(--accent-border)'}" stroke-width="1">
              <title>Day ${i + 1}: ${val} registrations</title>
            </rect>
            <text x="${x + barWidth / 2}" y="${y - 4}" font-size="11" font-weight="700"
                  fill="${isCurrent ? 'var(--accent-primary)' : 'var(--text-secondary)'}" text-anchor="middle">
              ${val > 0 ? val : (isFuture ? '-' : '0')}
            </text>
            <text x="${x + barWidth / 2}" y="${H - 8}" font-size="10" fill="var(--text-muted)" text-anchor="middle">
              D${i + 1}
            </text>
          </g>
        `;
      }).join('');

      container.innerHTML = `
        <svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img" aria-label="Daily registrations bar chart">
          <line x1="${P_LEFT}" y1="${H - P_BOTTOM}" x2="${W - P_RIGHT}" y2="${H - P_BOTTOM}" stroke="var(--border-color)" />
          ${bars}
        </svg>
      `;
    }
  };

  // --- Link Studio Manager ---
  const LinkStudio = {
    init() {
      $('btn-generate-link')?.addEventListener('click', () => this.handleGenerate());
      $('msg-template-select')?.addEventListener('change', () => this.updateMessageTemplate());
      $('btn-copy-msg')?.addEventListener('click', () => this.copyToClipboard('out-message', 'WhatsApp message copied to clipboard!'));
      $('btn-copy-url')?.addEventListener('click', () => this.copyToClipboard('out-url', 'Tracked URL copied to clipboard!'));
      $('links-filter')?.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        this.renderLinksTable();
      });
      $('links-search')?.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        this.renderLinksTable();
      });
    },

    generateCode(label) {
      const clean = (label.replace(/[^a-zA-Z]/g, '').toUpperCase() + 'XXX').slice(0, 3);
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let suffix = '';
      for (let i = 0; i < 3; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `${clean}-${suffix}`;
    },

    async handleGenerate() {
      const label = $('in-label')?.value.trim();
      const channel = $('in-channel')?.value || 'wa';
      const college = $('in-college')?.value.trim() || 'General / Unspecified';
      const baseUrl = $('in-target-url')?.value.trim() || getRegistrationUrl();

      if (!label) {
        showToast('Please enter connector, club, or student name.', 'danger');
        $('in-label')?.focus();
        return;
      }

      // Check collision resistance
      let code = this.generateCode(label);
      let attempts = 0;
      while (state.links.some(l => l.c === code) && attempts < 50) {
        code = this.generateCode(label);
        attempts++;
      }

      const newLink = {
        c: code,
        l: label,
        ch: channel,
        k: college,
        clicks: 0,
        n: 0,
        createdAt: new Date().toISOString()
      };

      // If backend available, POST to API
      if (isLiveBackend) {
        try {
          const res = await fetch('/api/links', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label, channel, college, targetUrl: baseUrl })
          });
          if (res.ok) {
            const data = await res.json();
            newLink.c = data.code;
          }
        } catch (e) {}
      }

      state.links.unshift(newLink);
      StorageService.save();

      // Display ready output
      this.displayLinkOutput(newLink, baseUrl);
      this.renderLinksTable();
      UI.renderDashboard();
      showToast(`Tracked link created for ${label}!`, 'success');
    },

    displayLinkOutput(link, baseUrl) {
      const sep = baseUrl.includes('?') ? '&' : '?';
      const trackedUrl = `${baseUrl}${sep}ref=${encodeURIComponent(link.c)}&src=${encodeURIComponent(link.ch)}&utm_source=${link.ch}&utm_medium=referral&utm_campaign=ai_workshop_500`;

      $('out-code').textContent = link.c;
      $('out-url').value = trackedUrl;
      $('out-channel-badge').textContent = CHANNEL_META[link.ch].name;
      $('out-channel-badge').className = `badge badge-channel ${link.ch}`;

      // Update test link button
      const testBtn = $('btn-test-link');
      if (testBtn) {
        testBtn.onclick = () => window.open(trackedUrl, '_blank');
      }

      this.currentTrackedUrl = trackedUrl;
      this.currentConnectorName = link.l;
      this.updateMessageTemplate();

      $('link-output-card')?.classList.remove('hidden');
    },

    updateMessageTemplate() {
      const template = $('msg-template-select')?.value || 'placement';
      const url = this.currentTrackedUrl || getRegistrationUrl({ ref: 'DEMO' });
      const connector = this.currentConnectorName || 'Aditi';

      let msg = '';
      if (template === 'placement') {
        msg = `🚀 Final-years placement alert: Don't sit for AI interviews with an empty GitHub.\n\nJoin NxtWave's free live workshop: “Build Your First AI Project in 60 Minutes”. You leave with a working AI app to showcase on your resume.\n\n⚡ Hands-on code + free certificate.\nRegister in 30 seconds: ${url}`;
      } else if (template === 'club') {
        msg = `📢 Announcement for Coding & AI Enthusiasts:\n\nOur club is hosting an exclusive seat-reservation drive for NxtWave's “Build Your First AI Project in 60 Minutes”.\n\nBuild and deploy a real AI project live with top mentors. 100% free for college students.\n\nGrab your seat here: ${url}`;
      } else {
        msg = `Hey! I just reserved my seat for this free 60-minute workshop by NxtWave: “Build Your First AI Project in 60 Minutes”. You actually build a live AI project for your resume. Join with my invite link: ${url}`;
      }

      if ($('out-message')) {
        $('out-message').value = msg;
      }
      if ($('btn-open-wa')) {
        $('btn-open-wa').onclick = () => window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
      }
    },

    copyToClipboard(elementId, successMessage) {
      const el = $(elementId);
      if (!el) return;
      const text = el.value || el.textContent;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showToast(successMessage, 'success');
        }).catch(() => {
          this.fallbackCopy(el, successMessage);
        });
      } else {
        this.fallbackCopy(el, successMessage);
      }
    },

    fallbackCopy(el, successMessage) {
      try {
        el.select();
        document.execCommand('copy');
        showToast(successMessage, 'success');
      } catch (e) {
        showToast('Please select and copy manually.', 'warning');
      }
    },

    renderLinksTable() {
      const tbody = $('links-table-body');
      if (!tbody) return;

      let filtered = state.links.filter(l => {
        const matchesFilter = currentFilter === 'all' || l.ch === currentFilter;
        const matchesSearch = !searchQuery ||
          l.c.toLowerCase().includes(searchQuery) ||
          (l.l || '').toLowerCase().includes(searchQuery) ||
          (l.k || '').toLowerCase().includes(searchQuery);
        return matchesFilter && matchesSearch;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 24px; color: var(--text-muted);">No referral links found matching criteria.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map((l, idx) => {
        const cr = l.clicks > 0 ? ((l.n / l.clicks) * 100).toFixed(1) + '%' : '0.0%';
        const chInfo = CHANNEL_META[l.ch] || { name: l.ch, class: 'wa' };
        return `
          <tr>
            <td><code class="mono">${l.c}</code></td>
            <td><strong>${escapeHtml(l.l)}</strong></td>
            <td><span class="badge badge-channel ${chInfo.class}">${chInfo.name}</span></td>
            <td>${escapeHtml(l.k || '-')}</td>
            <td>${l.clicks || 0}</td>
            <td><strong>${l.n || 0}</strong></td>
            <td><span class="mono">${cr}</span></td>
            <td>
              <div style="display:flex; gap: 4px;">
                <button class="btn btn-secondary btn-sm" onclick="window.bumpCode('${l.c}', 1)" title="Simulate 1 registration">+1</button>
                <button class="btn btn-secondary btn-sm" onclick="window.bumpCode('${l.c}', 10)" title="Simulate 10 registrations">+10</button>
                <button class="btn btn-outline btn-sm" onclick="window.openTrackedLink('${l.c}', '${l.ch}')" title="Test landing page">Test</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  };

  // --- Funnel Model Calculator ---
  const FunnelModel = {
    init() {
      const inputs = ['f-r1', 'f-c1', 'f-r2', 'f-c2', 'f-r3', 'f-c3', 'f-paid-toggle', 'f-paid-cpl'];
      inputs.forEach(id => {
        $(id)?.addEventListener('input', () => this.recalculate());
      });
      $('btn-reset-funnel')?.addEventListener('click', () => this.resetBaseCase());
      this.recalculate();
    },

    recalculate() {
      const r1 = Math.max(0, Number($('f-r1')?.value) || 0);
      const c1 = Math.max(0, Number($('f-c1')?.value) || 0);
      const r2 = Math.max(0, Number($('f-r2')?.value) || 0);
      const c2 = Math.max(0, Number($('f-c2')?.value) || 0);
      const r3 = Math.max(0, Number($('f-r3')?.value) || 0);
      const c3 = Math.max(0, Number($('f-c3')?.value) || 0);

      const isPaid = $('f-paid-toggle')?.checked || false;
      const paidCpl = Math.max(1, Number($('f-paid-cpl')?.value) || 16);

      // Channel A (WhatsApp via Connectors)
      const o1 = Math.round((r1 * c1) / 100);
      // Channel B (Clubs and Communities)
      const o2 = Math.round((r2 * c2) / 100);

      // Direct Registrations (Wave 1)
      const wave1 = o1 + o2;

      // Channel C (Referral Loop)
      const sharers = (wave1 * r3) / 100;
      const o3 = Math.round(sharers * c3);

      // Viral Factor K = (Share Rate / 100) * Signups per Sharer
      const kFactor = ((r3 / 100) * c3).toFixed(2);

      // Contingency Paid Reserve (Slide 2 & 3: ₹800 budget)
      let oPaid = 0;
      if (isPaid) {
        oPaid = Math.round(800 / paidCpl);
      }

      const total = o1 + o2 + o3 + oPaid;
      const delta = total - CAMPAIGN_GOAL;

      // Update DOM
      if ($('f-o1')) $('f-o1').textContent = o1;
      if ($('f-o2')) $('f-o2').textContent = o2;
      if ($('f-o3')) $('f-o3').textContent = o3;
      if ($('f-wave1')) $('f-wave1').textContent = wave1;
      if ($('f-kfactor')) $('f-kfactor').textContent = kFactor;
      if ($('f-opaid')) $('f-opaid').textContent = oPaid;
      if ($('f-total')) $('f-total').textContent = total;

      const summaryCard = $('funnel-summary');
      if (summaryCard) {
        if (total >= CAMPAIGN_GOAL) {
          summaryCard.className = 'alert alert-success';
          summaryCard.innerHTML = `
            <div>
              <div class="alert-title">🎯 Funnel Goal Met: ${total} Registrations (+${delta} Buffer)</div>
              <div class="alert-body">
                Model delivers the 500-registration target. Base organic case: <strong>${o1} (WhatsApp) + ${o2} (Clubs) + ${o3} (Referrals) = ${o1 + o2 + o3}</strong>.
                ${isPaid ? ` Includes +${oPaid} from ₹800 paid test reserve.` : ' ₹800 paid reserve remains safely in bank.'}
              </div>
            </div>
          `;
        } else {
          summaryCard.className = 'alert alert-danger';
          summaryCard.innerHTML = `
            <div>
              <div class="alert-title">⚠️ Projected Shortfall: ${total} Registrations (Short by ${Math.abs(delta)})</div>
              <div class="alert-body">
                These assumptions fall short of the 500 goal. Recommended adjustments: Increase connector outreach reach, improve share rate above ${r3}%, or toggle the ₹800 paid test fallback.
              </div>
            </div>
          `;
        }
      }
    },

    resetBaseCase() {
      if ($('f-r1')) $('f-r1').value = 5000;
      if ($('f-c1')) $('f-c1').value = 5;
      if ($('f-r2')) $('f-r2').value = 3500;
      if ($('f-c2')) $('f-c2').value = 4;
      if ($('f-r3')) $('f-r3').value = 25;
      if ($('f-c3')) $('f-c3').value = 1.2;
      if ($('f-paid-toggle')) $('f-paid-toggle').checked = false;
      if ($('f-paid-cpl')) $('f-paid-cpl').value = 16;
      this.recalculate();
      showToast('Funnel assumptions reset to 507 base case!', 'info');
    }
  };

  // --- UI Controller ---
  const UI = {
    init() {
      // Tab Switching
      $$('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          const target = tab.dataset.target;
          this.switchTab(target);
        });
      });

      // Day Dropdown
      $('eval-day-select')?.addEventListener('change', (e) => {
        const newDay = parseInt(e.target.value, 10);
        this.setEvaluationDay(newDay);
      });

      // Theme Toggle
      $('theme-toggle')?.addEventListener('click', () => this.toggleTheme());

      // Scenario Presets
      $('scenario-select')?.addEventListener('change', (e) => {
        this.loadScenario(e.target.value);
      });

      // Reset Button
      $('btn-reset-data')?.addEventListener('click', () => {
        if (confirm('Reset demo data to Day 4 base scenario?')) {
          this.loadScenario('default');
        }
      });

      // Quick Simulation Modal triggers
      $('btn-quick-sim')?.addEventListener('click', () => {
        $('sim-modal')?.classList.add('active');
        this.populateSimModalConnectors();
      });

      $('btn-close-modal')?.addEventListener('click', () => {
        $('sim-modal')?.classList.remove('active');
      });

      $('sim-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSimSubmit();
      });

      // Export CSV
      $('btn-export-csv')?.addEventListener('click', () => {
        if (isLiveBackend) {
          window.location.href = '/api/export';
          return;
        }
        const rows = [
          ['Code', 'Connector', 'Channel', 'College', 'Clicks', 'Registrations'],
          ...state.links.map(link => [link.c, link.l, link.ch, link.k, link.clicks, link.n])
        ];
        const csv = rows.map(row =>
          row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')
        ).join('\r\n');
        const blobUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const download = document.createElement('a');
        download.href = blobUrl;
        download.download = 'workshop-launchpad.csv';
        download.click();
        URL.revokeObjectURL(blobUrl);
      });

      this.initTheme();
      this.renderDaySelect();
      this.renderDashboard();
    },

    switchTab(tabId) {
      $$('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.target === tabId));
      $$('.tab-content').forEach(s => s.classList.toggle('hidden', s.id !== tabId));

      if (tabId === 'tab-dashboard') {
        this.renderDashboard();
      } else if (tabId === 'tab-studio') {
        LinkStudio.renderLinksTable();
      } else if (tabId === 'tab-funnel') {
        FunnelModel.recalculate();
      }
    },

    toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('wl_theme', next);
      $('theme-toggle').textContent = next === 'dark' ? '🌙' : '☀️';
    },

    initTheme() {
      const saved = localStorage.getItem('wl_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', saved);
      if ($('theme-toggle')) {
        $('theme-toggle').textContent = saved === 'dark' ? '🌙' : '☀️';
      }
    },

    renderDaySelect() {
      const select = $('eval-day-select');
      if (!select) return;
      select.innerHTML = [1, 2, 3, 4, 5, 6, 7].map(d => `
        <option value="${d}" ${d === state.day ? 'selected' : ''}>Day ${d} of 7 (${TARGET_PACING[d - 1]} target)</option>
      `).join('');
    },

    async setEvaluationDay(d) {
      state.day = d;
      // Non-destructive day change: ensure array length is at least 7
      while (state.daily.length < 7) state.daily.push(0);

      if (isLiveBackend) {
        try {
          await fetch('/api/day', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ day: d })
          });
        } catch (e) {}
      }

      StorageService.save();
      this.renderDashboard();
      showToast(`Evaluation day set to Day ${d}`, 'info');
    },

    async loadScenario(scenario) {
      if (isLiveBackend) {
        try {
          const res = await fetch('/api/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenario })
          });
          if (res.ok) {
            const data = await res.json();
            state = data.state;
          }
        } catch (e) {}
      } else {
        if (scenario === 'on_track') {
          state.day = 4;
          state.daily = [45, 80, 95, 92, 0, 0, 0];
        } else if (scenario === 'behind') {
          state.day = 4;
          state.daily = [30, 55, 65, 70, 0, 0, 0];
        } else {
          state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        }
      }

      StorageService.save();
      this.renderDaySelect();
      this.renderDashboard();
      LinkStudio.renderLinksTable();
      showToast(`Loaded scenario: ${scenario}`, 'success');
    },

    renderDashboard() {
      const metrics = MetricsEngine.getPacingMetrics();
      const { totals, clicks } = MetricsEngine.getChannelTotals();

      // Update KPI Cards
      if ($('kpi-total-regs')) $('kpi-total-regs').textContent = metrics.total;
      if ($('kpi-goal-pct')) $('kpi-goal-pct').textContent = `${metrics.pctGoal}%`;
      if ($('kpi-pace-delta')) {
        const sign = metrics.delta >= 0 ? '+' : '';
        $('kpi-pace-delta').textContent = `${sign}${metrics.delta}`;
        $('kpi-pace-delta').className = `kpi-value ${metrics.delta >= 0 ? 'kpi-subtext positive' : 'kpi-subtext negative'}`;
      }
      if ($('kpi-pace-target-label')) {
        $('kpi-pace-target-label').textContent = `vs Day ${metrics.currentDay} target (${metrics.targetForDay})`;
      }
      if ($('kpi-run-rate')) {
        $('kpi-run-rate').textContent = metrics.daysRemaining > 0 ? `${metrics.requiredRunRate} / day` : 'Campaign Ended';
      }
      if ($('kpi-days-left')) {
        $('kpi-days-left').textContent = `${metrics.daysRemaining} days remaining`;
      }
      if ($('kpi-viral-rate')) {
        $('kpi-viral-rate').textContent = `${metrics.viralRate}% (K = ${metrics.kFactor})`;
      }
      if ($('kpi-cac')) {
        $('kpi-cac').textContent = `₹${metrics.currentCAC}`;
      }

      // Render Pacing Status & Fallback Contingency Banner
      this.renderPacingBanner(metrics);

      // Render SVG Charts
      ChartRenderer.renderCumulativeChart();
      ChartRenderer.renderDailyBarChart();

      // Render Channel Progress Bars
      this.renderChannelBreakdown(totals, clicks, metrics.total);

      // Render Referral Leaderboard
      this.renderLeaderboard();

      // Render Recent Registrations Feed
      this.renderRecentFeed();
    },

    renderPacingBanner(metrics) {
      const container = $('pacing-alert-container');
      if (!container) return;

      const d = metrics.currentDay;
      const r = metrics.pctTarget;

      let alertClass = 'alert-success';
      let title = `✅ On Track (${r}% of Day ${d} Target)`;
      let body = `Campaign pacing is healthy. Current run rate meets or exceeds the required pace. Action: Keep the daily 8 PM WhatsApp connector reminder cadence and protect the ₹800 paid test reserve.`;

      if (r < 90) {
        alertClass = 'alert-danger';
        title = `🚨 Critical Behind Pace (${r}% of Day ${d} Target - Gap of ${Math.abs(metrics.delta)})`;
        if (d <= 4) {
          body = `
            <strong>Contingency Triggers Activated (Slide 4 Strategy):</strong><br>
            1. <strong>Deploy ₹800 Paid Test Reserve:</strong> Run targeted Meta/Instagram ads to final-year B.Tech students in tier-2/3 colleges (est. 40-50 sign-ups).<br>
            2. <strong>Recruit 5 More Connectors:</strong> Immediately onboard connectors from colleges with zero current registrations.<br>
            3. <strong>Referral Nudge:</strong> Ping top-3 referrers on the leaderboard with spot prize incentives (₹300/₹200/₹100).
          `;
        } else {
          body = `
            <strong>Late-Campaign Contingency Triggers:</strong><br>
            1. <strong>Switch Messaging to Deadline Urgency:</strong> “Registrations close tonight · Final 30 seats”.<br>
            2. <strong>Direct 1-on-1 Connector Calls:</strong> Call top-converting connectors for one final evening broadcast.<br>
            3. <strong>Daily Referral Spot Prize:</strong> Award spot cash prizes today for anyone who brings 5 registrations.
          `;
        }
      } else if (r < 100) {
        alertClass = 'alert-warning';
        title = `⚠️ Slightly Behind Pace (${r}% of Day ${d} Target)`;
        body = `Campaign is slightly behind the planned trajectory. Send mid-week connector leaderboard updates to spur peer competition and push community announcements.`;
      }

      container.className = `alert ${alertClass}`;
      container.innerHTML = `
        <div>
          <div class="alert-title">${title}</div>
          <div class="alert-body">${body}</div>
        </div>
      `;
    },

    renderChannelBreakdown(totals, clicks, grandTotal) {
      const container = $('channel-breakdown-list');
      if (!container) return;

      const channels = ['wa', 'club', 'ref', 'paid'];
      container.innerHTML = channels.map(ch => {
        const info = CHANNEL_META[ch];
        const count = totals[ch] || 0;
        const clickCount = clicks[ch] || 0;
        const sharePct = grandTotal > 0 ? ((count / grandTotal) * 100).toFixed(1) : '0.0';
        const cr = clickCount > 0 ? ((count / clickCount) * 100).toFixed(1) + '%' : 'N/A';

        return `
          <div style="margin-bottom: 14px;">
            <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom: 4px;">
              <span><span class="badge badge-channel ${info.class}">${info.name}</span></span>
              <span><strong>${count}</strong> regs (${sharePct}%) · <small style="color:var(--text-muted)">${clickCount} clicks · ${cr} CR</small></span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width: ${sharePct}%; background: ${info.color};"></div>
            </div>
          </div>
        `;
      }).join('');
    },

    renderLeaderboard() {
      const container = $('leaderboard-list');
      if (!container) return;

      const sorted = [...state.links].sort((a, b) => (b.n || 0) - (a.n || 0)).slice(0, 8);

      if (sorted.length === 0) {
        container.innerHTML = `<div style="padding:16px; text-align:center; color:var(--text-muted);">No referral links active yet.</div>`;
        return;
      }

      container.innerHTML = sorted.map((l, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
        const chInfo = CHANNEL_META[l.ch] || { class: 'wa' };
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px 0; border-bottom: 1px solid var(--border-color);">
            <div style="display:flex; align-items:center; gap: 8px;">
              <span style="font-weight:700; width: 22px;">${medal}</span>
              <div>
                <div style="font-weight:600; font-size:13px;">${escapeHtml(l.l)} <code class="mono">${l.c}</code></div>
                <div style="font-size:11px; color:var(--text-muted);">${escapeHtml(l.k || '')}</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap: 8px;">
              <strong style="font-size: 15px;">${l.n || 0}</strong>
              <button class="btn btn-secondary btn-sm" onclick="window.bumpCode('${l.c}', 1)" title="Simulate 1 registration">+1</button>
              <button class="btn btn-secondary btn-sm" onclick="window.bumpCode('${l.c}', 10)" title="Simulate 10 registrations">+10</button>
            </div>
          </div>
        `;
      }).join('');
    },

    renderRecentFeed() {
      const container = $('recent-regs-feed');
      if (!container) return;

      const feed = state.recentRegistrations || [];
      if (feed.length === 0) {
        container.innerHTML = `<div style="padding:12px; color:var(--text-muted); font-size:12px;">No registrations recorded yet.</div>`;
        return;
      }

      container.innerHTML = feed.slice(0, 6).map(item => `
        <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); font-size: 12px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong>${escapeHtml(item.connector || item.code)}</strong> · <span style="color:var(--text-muted)">${escapeHtml(item.college || '')} (${escapeHtml(item.branch || '')})</span>
          </div>
          <div>
            <code class="mono">${item.code}</code>
          </div>
        </div>
      `).join('');
    },

    populateSimModalConnectors() {
      const select = $('sim-connector-select');
      if (!select) return;
      select.innerHTML = state.links.map(l => `
        <option value="${l.c}">${l.l} (${l.c} - ${CHANNEL_META[l.ch].name})</option>
      `).join('');
    },

    async handleSimSubmit() {
      const code = $('sim-connector-select')?.value;
      const count = parseInt($('sim-count')?.value, 10) || 1;
      const college = $('sim-college')?.value.trim() || 'Simulated College';
      const branch = $('sim-branch')?.value || 'CSE Final Year';

      $('sim-modal')?.classList.remove('active');

      if (isLiveBackend) {
        try {
          await fetch('/api/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, delta: count })
          });
          const res = await fetch('/api/state');
          if (res.ok) state = await res.json();
        } catch (e) {}
      } else {
        const link = state.links.find(l => l.c === code);
        if (link) {
          link.n = (link.n || 0) + count;
          link.clicks = (link.clicks || 0) + (count * 4);
        }
        const d = state.day || 4;
        state.daily[d - 1] = (state.daily[d - 1] || 0) + count;
        state.recentRegistrations.unshift({
          id: 'SIM-' + Math.floor(1000 + Math.random() * 9000),
          code: code,
          connector: link ? link.l : code,
          college: college,
          branch: branch,
          timestamp: new Date().toISOString()
        });
      }

      StorageService.save();
      this.renderDashboard();
      LinkStudio.renderLinksTable();
      showToast(`Added ${count} registration(s) attributed to ${code}!`, 'success');
    }
  };

  // Toast System
  function showToast(message, type = 'info') {
    let container = $('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'danger' ? 'alert-danger' : type === 'success' ? 'alert-success' : ''}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
  }

  // Window Global Handlers for In-Table Action Buttons
  window.bumpCode = async function (code, delta) {
    if (isLiveBackend) {
      try {
        await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, delta })
        });
        const res = await fetch('/api/state');
        if (res.ok) state = await res.json();
      } catch (e) {}
    } else {
      const link = state.links.find(l => l.c === code);
      if (link) {
        link.n = Math.max(0, (link.n || 0) + delta);
        link.clicks = Math.max(link.n, (link.clicks || 0) + delta * 4);
      }
      const d = state.day || 4;
      state.daily[d - 1] = Math.max(0, (state.daily[d - 1] || 0) + delta);
      state.recentRegistrations.unshift({
        id: 'SIM-' + Math.floor(1000 + Math.random() * 9000),
        code: code,
        connector: link ? link.l : code,
        college: link ? link.k : 'Demo College',
        branch: 'B.Tech Final Year',
        timestamp: new Date().toISOString()
      });
    }

    StorageService.save();
    UI.renderDashboard();
    LinkStudio.renderLinksTable();
    showToast(`Attributed +${delta} registrations to ${code}`, 'success');
  };

  window.openTrackedLink = function (code, channel) {
    const url = getRegistrationUrl({ ref: code, src: channel });
    window.open(url, '_blank');
  };

  // App Initialization
  document.addEventListener('DOMContentLoaded', async () => {
    await StorageService.init();
    UI.init();
    LinkStudio.init();
    FunnelModel.init();
  });

})();
