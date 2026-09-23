// ==UserScript==
// @name         ITSM – Incident Page Improvements
// @namespace    http://tampermonkey.net/
// @version      3.3
// @description  Script mejoras varias para la vista de incidencias en ITSM.
// @author       Julián Villanueva
// @match        https://itsm.mecalux.com/pages/UI.php?operation=details&class=Incident*
// @updateURL    https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-IncidentPageImprovements.user.js
// @downloadURL  https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-IncidentPageImprovements.user.js
// @grant        GM_setClipboard
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  const DEBUG = false;
  const TAG = '[ITSM Enhanced]';
  const log = (...a) => DEBUG && console.log(TAG, ...a);

  // Módulos habilitados
  const modulesEnabled = {
    usefulLinksModal: true,
    callerEnhancedInfo: true,
    orgEnhancedInfo: true
  };

  const moduleStates = {
    usefulLinksModal: false,
    callerEnhancedInfo: false,
    orgEnhancedInfo: false
  };

  let lastHref = location.href;
  let lastOrgRaw = null;

  // -------------------------------
  // 1. Estilos Globales (Corregidos)
  // -------------------------------
  function ensureGlobalStyles() {
    if (document.getElementById('itsm-enhanced-styles-v62')) return;
    const style = document.createElement('style');
    style.id = 'itsm-enhanced-styles-v62';
    style.textContent = `
      @keyframes spin {0%{transform:rotate(0)}100%{transform:rotate(360deg)}}

      /* Estilo Genérico (Para Transfer Status y Local Time) */
      .spin-icon::before {
        content:'⏳';
        display:inline-block;
        animation:spin 1s linear infinite;
        margin-right: 4px; /* Separación si hay texto al lado */
      }

      /* Estilo ESPECÍFICO para Caller Notification y Shortcuts (Botones circulares) */
      /* Esto asegura que el reloj se centre y no afecte a otros módulos */
      .caller-enhanced-group .spin-icon::before {
        display: block;
        font-size: 14px;
        line-height: 1;
        margin-right: 0;
      }

      /* Layout Helpers */
      .caller-enhanced-group { display: inline-flex; align-items: center; gap: 4px; margin-left: 8px; vertical-align: middle; }
      .master-container { position: relative; display: inline-flex; align-items: center; }

      /* Menú Flotante */
      .contact-menu {
        position: absolute; bottom: 130%; left: 50%; transform: translateX(-50%) scale(0.9);
        background: #ffffff; border-radius: 10px; box-shadow: 0 6px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);
        padding: 6px 10px; display: flex; gap: 8px; visibility: hidden; opacity: 0; z-index: 1000;
        transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); pointer-events: none;
      }
      .contact-menu.open { visibility: visible; opacity: 1; transform: translateX(-50%) scale(1); pointer-events: auto; }
      .contact-menu::after {
        content: ""; position: absolute; top: 100%; left: 50%; margin-left: -6px; border-width: 6px; border-style: solid;
        border-color: #ffffff transparent transparent transparent;
      }

      .master-btn.active { background: #464EB8 !important; color: white !important; }
      .local-time-badge { padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 700; margin-top: 4px; display: inline-block; vertical-align: middle; }
      .useful-links-btn { margin-top: 4px; }
    `;
    document.head.appendChild(style);
  }

  function stylePillCompact(btn) {
    Object.assign(btn.style, {
      display: 'inline-flex', alignItems: 'center', gap: '6px', height: '23px',
      padding: '0 10px', borderRadius: '6px', background: '#464EB8',
      color: '#ffffff', border: 'none', fontFamily: 'Segoe UI, sans-serif',
      fontSize: '12px', fontWeight: '600', marginLeft: '0px', cursor: 'pointer',
      boxShadow: 'inset 0 -1px 0 rgba(0,0,0,.18)'
    });
  }

  function createCircularBtn(emoji, title) {
    const btn = document.createElement('span');
    btn.textContent = emoji;
    btn.title = title;
    Object.assign(btn.style, {
      cursor: 'pointer', userSelect: 'none', fontSize: '15px',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '24px', height: '24px', borderRadius: '50%',
      boxShadow: '0 0 0 2px #ffffff, 0 2px 4px rgba(0,0,0,.15)',
      background: '#e5e7eb', transition: 'all .15s ease'
    });
    btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.1)');
    btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1.0)');
    return btn;
  }

  // -------------------------------
  // 2. Módulo: Caller Enhanced Info
  // -------------------------------
  async function moduleCallerEnhancedInfo() {
    const callerField = document.querySelector('[data-attribute-code="caller_id"]');
    if (!callerField || callerField.querySelector('.caller-enhanced-group')) return false;

    const valueContainer = callerField.querySelector('.ibo-field--value');
    const link = valueContainer?.querySelector('a.object-ref-link');
    if (!link) return false;

    if (/\beasy\s*monitor\b/i.test(link.textContent)) return true;

    const personId = callerField.getAttribute('data-value-raw') || new URL(link.href, location.origin).searchParams.get('id');
    if (!personId) return false;

    ensureGlobalStyles();

    const group = document.createElement('span');
    group.className = 'caller-enhanced-group';
    link.insertAdjacentElement('afterend', group);

    // 1. Campana Placeholder
    const bell = createCircularBtn('', 'Loading notification...');
    bell.classList.add('spin-icon');
    group.appendChild(bell);

    const masterContainer = document.createElement('span');
    masterContainer.className = 'master-container';
    group.appendChild(masterContainer);

    // 2. Botón Maestro Placeholder
    const masterBtn = createCircularBtn('', 'Loading contacts...');
    masterBtn.classList.add('master-btn', 'spin-icon');
    masterContainer.appendChild(masterBtn);

    const menu = document.createElement('div');
    menu.className = 'contact-menu';
    masterContainer.appendChild(menu);

    try {
      const res = await fetch(`/pages/UI.php?operation=details&class=Person&id=${encodeURIComponent(personId)}`);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const getVal = (codes, regex) => {
        for (const c of codes) {
          const n = doc.querySelector(`[data-attribute-code="${c}"] .ibo-field--value`);
          if (n?.textContent.trim()) return n.textContent.trim();
        }
        return Array.from(doc.querySelectorAll('[data-role="ibo-field"]'))
          .find(f => regex.test(f.querySelector('.ibo-field--label')?.textContent.toLowerCase() || ''))
          ?.querySelector('.ibo-field--value')?.textContent.trim() || '';
      };

      const data = {
        phone: getVal(['phone'], /(phone|tel[eé]fono)/),
        mobile: getVal(['mobile_phone', 'mobile'], /(mobile|m[oó]vil)/),
        email: getVal(['email'], /(email|correo)/),
        notif: getVal(['notification'], /(notification|notificaci[oó]n)/).toLowerCase()
      };

      // Actualizar Campana
      bell.classList.remove('spin-icon');
      const isYes = /^(yes|sí|si|true|1|enabled)$/.test(data.notif);
      const isNo = /^(no|false|0|disabled)$/.test(data.notif);
      bell.textContent = isYes ? '🔔' : (isNo ? '🔕' : '❔');
      bell.style.backgroundColor = isYes ? '#16a34a' : (isNo ? '#ef4444' : '#f59e0b');
      bell.style.color = 'white';
      bell.title = `Notifications: ${data.notif || 'Unknown'}`;

      // Actualizar Shortcuts
      const config = [{ k: 'phone', e: '☎️', l: 'Phone' }, { k: 'mobile', e: '📱', l: 'Mobile' }, { k: 'email', e: '✉️', l: 'Email' }];
      let hasData = false;

      config.forEach(item => {
        const val = data[item.k];
        if (val) {
          hasData = true;
          const btn = createCircularBtn(item.e, `Copy ${item.l}: ${val}`);
          btn.onclick = (e) => {
            e.stopPropagation();
            if (typeof GM_setClipboard !== 'undefined') GM_setClipboard(val);
            else navigator.clipboard.writeText(val);
            const old = btn.textContent; btn.textContent = '✅';
            setTimeout(() => { btn.textContent = old; menu.classList.remove('open'); masterBtn.classList.remove('active'); }, 700);
          };
          menu.appendChild(btn);
        }
      });

      masterBtn.classList.remove('spin-icon');
      if (hasData) {
        masterBtn.textContent = '📋';
        masterBtn.title = 'Show contact options';
        masterBtn.onclick = (e) => {
            e.stopPropagation();
            const isOpen = menu.classList.toggle('open');
            masterBtn.classList.toggle('active', isOpen);
        };
        document.addEventListener('click', () => { menu.classList.remove('open'); masterBtn.classList.remove('active'); });
      } else {
        masterBtn.style.display = 'none';
      }

    } catch (err) {
        bell.classList.remove('spin-icon');
        bell.textContent = '❌';
        masterBtn.style.display = 'none';
    }
    return true;
  }

  // -------------------------------
  // 3. Módulo: Org Enhanced Info (Transfer + Time)
  // -------------------------------
  async function moduleOrgEnhancedInfo() {
    const orgField = document.querySelector('[data-attribute-code="org_id"]');
    const callerField = document.querySelector('[data-attribute-code="caller_id"]');

    const hasTransfer = document.querySelector('[data-attribute-code="status_sw_custom"]');
    const hasTime = document.querySelector('.local-time-badge');
    if (!orgField || !callerField || (hasTransfer && hasTime)) return false;

    const orgId = orgField.getAttribute('data-value-raw');
    if (!orgId) return false;

    ensureGlobalStyles();

    let flag, wBadge, timeBadge;

    // UI Transfer
    if (!hasTransfer) {
        const newField = document.createElement('div');
        newField.className = 'ibo-field ibo-field-small';
        newField.setAttribute('data-attribute-code', 'status_sw_custom');
        newField.innerHTML = `<div class="ibo-field--label"><span>Transfer status</span></div><div class="ibo-field--value"></div>`;

        flag = document.createElement('span');
        flag.className = 'spin-icon';
        // Texto loading para que se vea bien con el spinner genérico
        flag.innerText = 'Loading...';
        Object.assign(flag.style, { padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', backgroundColor: '#ccc', color: 'black' });

        newField.querySelector('.ibo-field--value').appendChild(flag);
        orgField.insertAdjacentElement('afterend', newField);
    }

    // UI Time
    if (!hasTime) {
        const callerVal = callerField.querySelector('.ibo-field--value');
        timeBadge = document.createElement('span');
        timeBadge.className = 'local-time-badge spin-icon';
        // Texto loading para que ocupe espacio con spinner genérico
        timeBadge.innerText = '...';
        Object.assign(timeBadge.style, { backgroundColor: '#f3f2f1', color: '#333' });

        const br = document.createElement('br');
        br.className = 'local-time-br';
        callerVal.appendChild(br);
        callerVal.appendChild(timeBadge);
    }

    try {
        const res = await fetch(`https://itsm.mecalux.com/pages/UI.php?operation=details&class=Organization&id=${orgId}`);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // Logic Transfer
        if (flag) {
            flag.classList.remove('spin-icon');

            const parseItopDate = (s) => {
                if (!s) return new Date(NaN);
                const str = String(s).trim().replace('T', ' ').replace(/\.\d+$/, '');
                let m = /^(\d{4})[-\/](\d{2})[-\/](\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(str);
                if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4]||0, +m[5]||0, +m[6]||0);
                m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(str);
                if (m) return new Date(+m[3], +m[2] - 1, +m[1], +m[4]||0, +m[5]||0, +m[6]||0);
                return new Date(NaN);
            };

            const stNode = doc.querySelector('[data-attribute-code="status_sw"] .ibo-field--value') ||
                           Array.from(doc.querySelectorAll('.ibo-field')).find(f => /status\s*\(sw\)/i.test(f.textContent))?.querySelector('.ibo-field--value');
            const statusRaw = stNode ? stNode.textContent.trim().toLowerCase() : '';

            let lastDate = null;
            const entries = Array.from(doc.querySelectorAll('.ibo-activity-entry--information'));
            const changeEntry = entries.find(e => {
                const t = e.textContent.toLowerCase();
                return (t.includes('changed from') || t.includes('cambió de')) && (t.includes('to') || t.includes(' a '));
            });
            if (changeEntry) {
                const dtEl = changeEntry.querySelector('time, [data-raw-datetime], [datetime]');
                const rawDt = dtEl?.getAttribute('data-raw-datetime') || dtEl?.getAttribute('datetime') || dtEl?.textContent;
                lastDate = parseItopDate(rawDt);
            }

            if (!statusRaw) {
                flag.innerText = 'Unknown';
                flag.style.backgroundColor = '#6b7280'; flag.style.color = 'white';
            } else {
                const dStatus = statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1);
                const dDate = (lastDate && !isNaN(lastDate)) ? ` - ${lastDate.toLocaleDateString('en-GB')}` : '';
                flag.innerText = `${dStatus}${dDate}`;
                if (lastDate) flag.title = `Last change: ${lastDate.toLocaleString()}`;

                const colors = { 'operations': '#dc2626', 'reception': '#f59e0b', 'active': '#16a34a' };
                flag.style.backgroundColor = colors[statusRaw] || '#6b7280';
                flag.style.color = 'white';

                let inWarranty = (statusRaw === 'reception' || statusRaw === 'operations');
                if (!inWarranty && statusRaw === 'active' && lastDate && !isNaN(lastDate)) {
                    const sixM = new Date(); sixM.setMonth(sixM.getMonth() - 6);
                    inWarranty = lastDate >= sixM;
                }
                wBadge = document.createElement('span');
                wBadge.innerText = inWarranty ? 'Warranty' : 'No Warranty';
                Object.assign(wBadge.style, {
                    display: 'inline-block', padding: '2px 10px', borderRadius: '6px', fontSize: '13px',
                    fontWeight: '500', marginLeft: '0px', marginTop: '4px', color: 'white',
                    backgroundColor: inWarranty ? '#2563eb' : '#6b7280'
                });
                flag.after(document.createElement('br'), wBadge);
            }
        }

        // Logic Time
        if (timeBadge) {
            timeBadge.classList.remove('spin-icon');

            const f = Array.from(doc.querySelectorAll('.ibo-field')).find(f => /hora local|local time/i.test(f.textContent));
            const m = (f?.querySelector('.ibo-field--value')?.textContent.trim() || '').match(/(\d{2}):(\d{2})/);

            if (m) {
                const h = parseInt(m[1], 10);
                timeBadge.style.backgroundColor = (h >= 8 && h < 17) ? '#d1e7dd' : (h >= 22 || h < 6) ? '#f8d7da' : '#fff3cd';
                timeBadge.style.color = (h >= 8 && h < 17) ? '#0f5132' : (h >= 22 || h < 6) ? '#842029' : '#664d03';
                timeBadge.innerText = `🕒 Cliente : ${m[0]}`;
            } else {
                timeBadge.style.display = 'none';
                timeBadge.previousSibling.style.display = 'none';
            }
        }

    } catch (err) {
        if (flag) { flag.innerText = 'Error'; flag.classList.remove('spin-icon'); }
        if (timeBadge) { timeBadge.innerText = 'Err'; }
    }
    return true;
  }

  // -------------------------------
  // 4. Módulo: Useful Links Modal
  // -------------------------------
  function moduleUsefulLinksModal() {
    const orgField = document.querySelector('[data-attribute-code="org_id"]');
    if (!orgField || orgField.querySelector('.useful-links-btn')) return false;

    const orgId = orgField.getAttribute('data-value-raw');
    if (!orgId) return false;

    const container = orgField.querySelector('.ibo-field--value');

    const br = document.createElement('br');
    br.className = 'useful-links-br';

    const btn = document.createElement('button');
    btn.textContent = '🔗 Useful Links';
    btn.className = 'useful-links-btn';
    stylePillCompact(btn);

    btn.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      const links = [
                { name: "🔍 Known Errors", description: "Buscar Known Errors", url: `https://itsm.mecalux.com/pages/UI.php?operation=search&filter=%255B%2522SELECT+%2560KnownError%2560+FROM+KnownError+AS+%2560KnownError%2560+JOIN+Organization+AS+%2560Organization%2560+ON+%2560KnownError%2560.org_id+%253D+%2560Organization%2560.id+JOIN+Organization+AS+%2560Organization1%2560+ON+%2560Organization%2560.parent_id+BELOW+%2560Organization1%2560.id+WHERE+%2528%2560Organization1%2560.%2560id%2560+%253D+%2527${encodeURIComponent(orgId)}%2527%2529%2522%252C%255B%255D%252C%255B%255D%255D&c[menu]=SearchError&c[org_id]=` },
                { name: "🙋‍♂️ Contacts", description: "Contactos de la Organizacion", url: `https://itsm.mecalux.com/pages/UI.php?operation=search&filter=%255B%2522SELECT+%2560Contact%2560+FROM+Contact+AS+%2560Contact%2560+JOIN+Organization+AS+%2560Organization%2560+ON+%2560Contact%2560.org_id+%253D+%2560Organization%2560.id+JOIN+Organization+AS+%2560Organization1%2560+ON+%2560Organization%2560.parent_id+BELOW+%2560Organization1%2560.id+WHERE+%2528%2560Organization1%2560.%2560id%2560+%253D+%2527${encodeURIComponent(orgId)}%2527%2529%2522%252C%255B%255D%252C%255B%255D%255D&c[menu]=SearchContacts&c[org_id]=` },
                { name: "🔄 Changes", description: "Cambios aprobados", url: `https://itsm.mecalux.com/pages/UI.php?operation=search&filter=%255B%2522SELECT+%2560ApprovedChange%2560+FROM+ApprovedChange+AS+%2560ApprovedChange%2560+JOIN+Organization+AS+%2560Organization%2560+ON+%2560ApprovedChange%2560.org_id+%253D+%2560Organization%2560.id+JOIN+Organization+AS+%2560Organization1%2560+ON+%2560Organization%2560.parent_id+BELOW+%2560Organization1%2560.id+WHERE+%2528%2560Organization1%2560.%2560id%2560+%253D+%2527${encodeURIComponent(orgId)}%2527%2529%2522%252C%255B%255D%252C%255B%255D%255D&c[menu]=SearchChanges&c[org_id]=` },
                { name: "📊 EasyMonitor", description: "EasyMonitor checks", url: `https://itsm.mecalux.com/pages/UI.php?operation=search&filter=%255B%2522SELECT+%2560EM_CheckInstance%2560+FROM+EM_CheckInstance+AS+%2560EM_CheckInstance%2560+WHERE+%2528%2560EM_CheckInstance%2560.%2560org_id%2560+%253D+%2527${encodeURIComponent(orgId)}%2527%2529%2522%252C%255B%255D%252C%255B%255D%255D&c[menu]=EasyMonitor%3ASearchCheckInstance&c[org_id]=` },
                { name: "📖 Open Incidents", description: "Tickets en curso", url: `https://itsm.mecalux.com/pages/UI.php?operation=search&filter=%255B%2522SELECT+%2560Incident%2560+FROM+Incident+AS+%2560Incident%2560+JOIN+Organization+AS+%2560Organization%2560+ON+%2560Incident%2560.org_id+%253D+%2560Organization%2560.id+JOIN+Organization+AS+%2560Organization1%2560+ON+%2560Organization%2560.parent_id+BELOW+%2560Organization1%2560.id+WHERE+%2528%2528%2560Organization1%2560.%2560id%2560+%253D+%2527${encodeURIComponent(orgId)}%2527%2529+AND+%2528%2560Incident%2560.%2560status%2560+NOT+IN+%2528%2527closed%2527%252C+%2527rejected%2527%252C+%2527resolved%2527%2529%2529%2529%2522%252C%255B%255D%252C%255B%255D%255D&c[menu]=SearchIncidents&c[org_id]=` },
                { name: "📕 All Incidents", description: "Todos los tickets", url: `https://itsm.mecalux.com/pages/UI.php?operation=search&filter=%255B%2522SELECT+%2560Incident%2560+FROM+Incident+AS+%2560Incident%2560+JOIN+Organization+AS+%2560Organization%2560+ON+%2560Incident%2560.org_id+%253D+%2560Organization%2560.id+JOIN+Organization+AS+%2560Organization1%2560+ON+%2560Organization%2560.parent_id+BELOW+%2560Organization1%2560.id+WHERE+%2528%2560Organization1%2560.%2560id%2560+%253D+%2527${encodeURIComponent(orgId)}%2527%2529%2522%252C%255B%255D%252C%255B%255D%255D&c[menu]=SearchIncidents&c[org_id]=` },
                { name: "💽 CIs", description: "Todos los CIs", url: `https://itsm.mecalux.com/pages/UI.php?operation=search&filter=%255B%2522SELECT+%2560FunctionalCI%2560+FROM+FunctionalCI+AS+%2560FunctionalCI%2560+JOIN+Organization+AS+%2560Organization%2560+ON+%2560FunctionalCI%2560.org_id+%253D+%2560Organization%2560.id+JOIN+Organization+AS+%2560Organization1%2560+ON+%2560Organization%2560.parent_id+BELOW+%2560Organization1%2560.id+WHERE+%2528%2560Organization1%2560.%2560id%2560+%253D+%2527${encodeURIComponent(orgId)}%2527%2529%2522%252C%255B%255D%252C%255B%255D%255D&c[menu]=SearchCIs&c[org_id]=` }
            ];
      showModal(links);
    };

    container.appendChild(br);
    container.appendChild(btn);
    return true;
  }

  function showModal(links) {
    const existingModal = document.querySelector('#usefulLinksModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    Object.assign(modal.style, {
      position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
      background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: "1000000"
    });
    modal.id = 'usefulLinksModal';

    const modalContent = document.createElement('div');
    Object.assign(modalContent.style, {
      background: "#ffffff", padding: "20px", borderRadius: "6px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)", width: "500px",
      maxHeight: "80%", overflow: "auto", fontFamily: 'Segoe UI, sans-serif'
    });

    const title = document.createElement('h3');
    title.textContent = '🔗 Useful Links';
    title.style.marginTop = '0';
    modalContent.appendChild(title);

    const table = document.createElement("table");
    Object.assign(table.style, { width: "100%", borderCollapse: "collapse", fontSize: "15px", fontFamily: 'Segoe UI, sans-serif' });

    const headerRow = document.createElement("tr");
    ["Enlace", "Descripción"].forEach(text => {
      const th = document.createElement("th");
      Object.assign(th.style, { background: "#f3f2f1", fontWeight: "600", textAlign: "left", padding: "8px", borderBottom: "2px solid #e1dfdd" });
      th.textContent = text;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    links.forEach(link => {
      const row = document.createElement("tr");

      const nameTd = document.createElement("td");
      const a = document.createElement("a");
      a.href = link.url; a.target = "_blank"; a.textContent = link.name;
      Object.assign(a.style, { color: "#0078D7", fontWeight: "600", textDecoration: "none" });
      nameTd.appendChild(a);

      const descTd = document.createElement("td");
      descTd.textContent = link.description || "";

      [nameTd, descTd].forEach(td => Object.assign(td.style, { padding: "6px", borderBottom: "1px solid #e1dfdd" }));

      row.appendChild(nameTd);
      row.appendChild(descTd);
      table.appendChild(row);
    });

    modalContent.appendChild(table);

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "❌ Close";
    Object.assign(closeBtn.style, {
      background: "#f3f2f1", color: "#252423", border: "none", marginTop: "20px",
      padding: "6px 12px", borderRadius: "6px", cursor: "pointer", float: "right"
    });
    closeBtn.onclick = () => modal.remove();
    modalContent.appendChild(closeBtn);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  }

  // -------------------------------
  // Lifecycle
  // -------------------------------
  function runModules() {
    if (modulesEnabled.usefulLinksModal && !moduleStates.usefulLinksModal) moduleStates.usefulLinksModal = moduleUsefulLinksModal();
    if (modulesEnabled.callerEnhancedInfo && !moduleStates.callerEnhancedInfo) moduleStates.callerEnhancedInfo = moduleCallerEnhancedInfo();
    if (modulesEnabled.orgEnhancedInfo && !moduleStates.orgEnhancedInfo) moduleStates.orgEnhancedInfo = moduleOrgEnhancedInfo();
    return Object.entries(modulesEnabled).every(([k, v]) => !v || moduleStates[k]);
  }

  function reset() {
    Object.keys(moduleStates).forEach(k => moduleStates[k] = false);
    document.querySelectorAll('.caller-enhanced-group, [data-attribute-code="status_sw_custom"], .local-time-badge, .local-time-br, .useful-links-btn, .useful-links-br').forEach(n => n.remove());
  }

  let obs = new MutationObserver(() => { if (runModules()) obs.disconnect(); });
  const start = () => { obs.observe(document.body, { childList: true, subtree: true }); runModules(); };

  setInterval(() => {
    const currentOrg = document.querySelector('[data-attribute-code="org_id"]')?.getAttribute('data-value-raw');
    if (location.href !== lastHref || (currentOrg && currentOrg !== lastOrgRaw)) {
      lastHref = location.href; lastOrgRaw = currentOrg;
      reset(); start();
    }
  }, 1000);

  start();
})();