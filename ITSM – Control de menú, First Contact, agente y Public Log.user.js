// ==UserScript==
// @name         ITSM – Control de menú, First Contact, agente y Public Log
// @namespace    http://tampermonkey.net/
// @version      2.6
// @description  Bloquea acciones si First Contact está en NO (menús, pluma en Public Log), muestra botón rojo solo si hay agente, y añade popups de confirmación.
// @author       Julian Villanueva
// @match        https://itsm.mecalux.com/pages/UI.php?operation=*&class=Incident&id=*
// @updateURL    https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-FirstContactControl.user.js
// @downloadURL  https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-FirstContactControl.user.js
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // -------------------------------
    // Logger
    // -------------------------------
    const DEBUG = true;
    const TAG = '[ITSM FC Control]';
    const log = (...a) => DEBUG && console.log(TAG, ...a);
    const warn = (...a) => DEBUG && console.warn(TAG, ...a);

    // -------------------------------
    // Config
    // -------------------------------
    const Config = {
        ALLOWED_OPTIONS: [
            'first contact','de-escalate','dispatch to a team','assign customer communication agent',
            're-assign','assign','reject','re-open','close this request',
        ],
        SELECTORS: {
            firstContactField: "[data-attribute-code='first_contact']",
            agentField: "[data-attribute-code='agent_id']",
            transitionsMenu: "[id^='ibo-transition-actions-popover']",
            transitionItem: "[data-role='ibo-popover-menu--item']",
            actionsToolbar: "[id^='ibo-actions-toolbar']",
            firstContactActionLink: "[data-uid='ev_first_contact']",
            modifyButton: "#UIMenuModify",
            publicLogPen: "#ibo-activity-panel--add-caselog-entry-button",
            activeLogTab: ".ibo-activity-panel--tab-toggler.ibo-is-active",
            markAsResolvedItem: "[data-uid='ev_resolve']",
            activityPanel: "#ibo-activity-panel",
            parentChangeField: "[data-attribute-code='parent_change_id']",
            callerField: "[data-attribute-code='caller_id']",
        },
        IDS: { quickFirstContactBtn: 'quick-first-contact' },
        REQUIRED_TAG: "[TAG:SOLINITSITU]",
        PARENT_CLASSES: ['NormalChange','EmergencyChange'],
    };

    // -------------------------------
    // Utils
    // -------------------------------
    const U = {
        toLowerTrim(s){ return (s || '').trim().toLowerCase(); },
        qs(sel, root=document){ try{ return root.querySelector(sel); } catch { return null; } },
        qsa(sel, root=document){ try{ return Array.from(root.querySelectorAll(sel)); } catch { return []; } },
        hasRequiredTag(tag){
            const ok = !!(document.body && document.body.innerText && document.body.innerHTML.includes(tag));
            log('Required tag', tag, ok ? 'FOUND' : 'MISSING');
            return ok;
        },
    };

    // -------------------------------
    // Estado
    // -------------------------------
    const State = {
        isFirstContactNo(){
            const field = U.qs(Config.SELECTORS.firstContactField);
            const val = U.toLowerTrim(field?.dataset.valueRaw || '');
            return val === 'no';
        },
        hasAgentAssigned(){
            const field = U.qs(Config.SELECTORS.agentField);
            if (!field) return false;
            if (field.querySelector("a[href*='Person'], a[href*='Contact']")) return true;
            const raw = U.toLowerTrim(field.dataset.valueRaw || '');
            const text = U.toLowerTrim(field.textContent || '');
            const bads = new Set(['', 'undefined', 'null', '—', '-', '–']);
            if (/^\d+$/.test(raw)) return parseInt(raw, 10) > 0;
            return !(bads.has(raw) || bads.has(text));
        },

        /**
     * Devuelve { id, klass? } del Parent Change si existe.
     * klass puede ser 'NormalChange' o 'EmergencyChange'. Si no se puede saber, queda null.
     * Si el valor es '' | undefined | null | 0 | — | - | – → devuelve null.
     */
        getParentChangeRef(){
            const el = U.qs(Config.SELECTORS.parentChangeField);
            if (!el) return null;

            const BAD = new Set(['', 'undefined', 'null', '0', '—', '-', '–']);

            // 1) dataset.valueRaw
            const raw = (el.dataset?.valueRaw || '').trim().toLowerCase();
            if (BAD.has(raw)) return null;
            let id = /^\d+$/.test(raw) ? raw : '';

            // 2) enlace a Change
            const link = el.querySelector('a[href*="class=NormalChange"], a[href*="class=EmergencyChange"], a[href*="class=Change"]');
            if (link) {
                const href = link.getAttribute('href') || '';
                const mId = href.match(/[?&]id=(\d+)/);
                const mCl = href.match(/[?&]class=([A-Za-z]+)/);
                if (mId) id = id || mId[1];
                const klass = (mCl ? mCl[1] : '').trim();
                if (id) return { id, klass: klass || null };
            }

            // 3) texto visible (id simple)
            const txt = (el.textContent || '').trim().toLowerCase();
            if (!BAD.has(txt) && /^\d+$/.test(txt)) return { id: txt, klass: null };

            return id ? { id, klass: null } : null;
        },
        isCallerEasyMonitor(){
            const el = U.qs(Config.SELECTORS.callerField);
            if (!el) return false;
            const txt = U.toLowerTrim(el.textContent);
            // Cubrimos variaciones de espaciado según se parsee el DOM
            return txt.includes('easy monitor') || txt.includes('easymonitor');
        },
        hasZeroContacts(){
            // 1. Apuntamos a la cabecera de pestañas (ajusta la clase según el DOM real de iTop/ITSM si es necesario)
            const tabsContainer = U.qs('.ibo-activity-panel--tabs, .ui-tabs-nav, [role="tablist"], .ibo-object-details--tabs');
            const root = tabsContainer || document; // Fallback al documento entero si no encuentra el contenedor

            // 2. Buscamos solo dentro de esa zona
            const tabs = U.qsa("a, span, [role='tab']", root);
            return !tabs.some(el => {
                const txt = U.toLowerTrim(el.textContent);
                return txt.includes('contacts') || txt.includes('contactos');
            });
        }
    };

    // -------------------------------
    // UI (confirm modal)
    // -------------------------------
    const UI = {
        confirm(message, onConfirm, onCancel){
            const overlay = document.createElement('div');
            overlay.style.cssText = `
        position: fixed; inset: 0;
        background-color: rgba(0,0,0,0.4);
        z-index: 9999; display:flex; justify-content:center; align-items:center;
        font-family: Arial, sans-serif;`;
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');

            const modal = document.createElement('div');
            modal.style.cssText = `
        background:#fff; border:1px solid #ccc; border-radius:4px;
        box-shadow:0 2px 10px rgba(0,0,0,0.2);
        width:420px; max-width:90%;
        display:flex; flex-direction:column; overflow:hidden;`;

            const header = document.createElement('div');
            header.style.cssText = `background:#4a4a4a;color:#fff;padding:10px;font-weight:bold;text-align:center;font-size:14px;`;
            header.textContent = 'Confirmation required';

            const content = document.createElement('div');
            content.style.cssText = `padding:20px;text-align:center;color:#333;font-size:13px;line-height:1.5;`;
            content.innerHTML = message;

            const footer = document.createElement('div');
            footer.style.cssText = `display:flex;justify-content:center;gap:15px;padding:10px 0 15px;`;

            const mkBtn = (txt, color, cb) => {
                const b = document.createElement('button');
                b.textContent = txt;
                b.style.cssText = `
          background:#fff;color:${color};
          border:1px solid ${color}; border-radius:3px;
          padding:6px 16px; cursor:pointer; font-size:13px;
          transition:all .12s ease-in-out;`;
                b.addEventListener('mouseenter', () => { b.style.background = color; b.style.color = '#fff'; });
                b.addEventListener('mouseleave', () => { b.style.background = '#fff'; b.style.color = color; });
                b.onclick = () => { if (document.body.contains(overlay)) document.body.removeChild(overlay); cb && cb(); };
                return b;
            };

            const confirmBtn = mkBtn('Confirm', '#28a745', onConfirm);
            const cancelBtn  = mkBtn('Cancel', '#dc3545', onCancel);
            footer.appendChild(confirmBtn);
            footer.appendChild(cancelBtn);

            modal.appendChild(header);
            modal.appendChild(content);
            modal.appendChild(footer);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            confirmBtn.focus();
            overlay.addEventListener('keydown', (ev) => {
                if (ev.key === 'Escape') cancelBtn.click();
                if (ev.key === 'Enter')  confirmBtn.click();
            });
        },

        alert(message, onClose){
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed; inset: 0;
                background-color: rgba(0,0,0,0.5);
                z-index: 9999; display:flex; justify-content:center; align-items:center;
                font-family: Arial, sans-serif;`;
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');

            const modal = document.createElement('div');
            modal.style.cssText = `
                background:#fff; border:1px solid #ccc; border-radius:4px;
                box-shadow:0 4px 15px rgba(0,0,0,0.3);
                width:420px; max-width:90%;
                display:flex; flex-direction:column; overflow:hidden;`;

            const header = document.createElement('div');
            // Cabecera roja para indicar bloqueo estricto
            header.style.cssText = `background:#dc3545;color:#fff;padding:10px;font-weight:bold;text-align:center;font-size:14px;`;
            header.textContent = 'Action Blocked';

            const content = document.createElement('div');
            content.style.cssText = `padding:20px;text-align:center;color:#333;font-size:13px;line-height:1.5;`;
            content.innerHTML = message;

            const footer = document.createElement('div');
            footer.style.cssText = `display:flex;justify-content:center;padding:10px 0 15px;`;

            const okBtn = document.createElement('button');
            okBtn.textContent = 'Cerrar';
            okBtn.style.cssText = `
                background:#fff;color:#dc3545;
                border:1px solid #dc3545; border-radius:3px;
                padding:6px 24px; cursor:pointer; font-size:13px; font-weight:bold;
                transition:all .12s ease-in-out;`;
            okBtn.addEventListener('mouseenter', () => { okBtn.style.background = '#dc3545'; okBtn.style.color = '#fff'; });
            okBtn.addEventListener('mouseleave', () => { okBtn.style.background = '#fff'; okBtn.style.color = '#dc3545'; });
            okBtn.onclick = () => { if (document.body.contains(overlay)) document.body.removeChild(overlay); onClose && onClose(); };

            footer.appendChild(okBtn);
            modal.appendChild(header);
            modal.appendChild(content);
            modal.appendChild(footer);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            okBtn.focus();
            overlay.addEventListener('keydown', (ev) => {
                if (ev.key === 'Escape' || ev.key === 'Enter') okBtn.click();
            });
        }
    };

// -------------------------------
    // Data Fetcher Parent Change (Con Trazas)
    // -------------------------------
    function readStatusFromDoc(doc){
        // Va directo al grano usando el elemento real del DOM de la vista de Change
        const labelNode = doc.querySelector("[data-role='ibo-object-details--status-label'], .ibo-object-details--status-label");
        if (labelNode && labelNode.textContent) {
            return labelNode.textContent.toLowerCase().trim(); // Devolverá "closed"
        }

        // Fallback por si acaso fallara el primero
        const attributeNode = doc.querySelector("[data-attribute-code='status']");
        if (attributeNode) {
            return (attributeNode.textContent || '').toLowerCase().trim();
        }

        return '';
    }

    async function fetchParentChangeStatus(klass, id){
        const url = `https://itsm.mecalux.com/pages/UI.php?operation=details&class=${klass}&id=${id}&`;
        log(`Petición HTTP GET iniciada para clase [${klass}] e ID [${id}]`);

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: function(response) {
                    log(`Respuesta HTTP recibida para [${klass}-${id}]. Status Code: ${response.status}`);

                    if (response.status >= 200 && response.status < 300) {
                        if (!response.responseText) {
                            warn(`Respuesta vacía para [${klass}-${id}]`);
                            return resolve('');
                        }
                        const doc = new DOMParser().parseFromString(response.responseText, 'text/html');
                        const status = readStatusFromDoc(doc);
                        resolve(status);
                    } else {
                        reject(new Error(`Parent fetch failed: HTTP ${response.status}`));
                    }
                },
                onerror: function(err) {
                    warn(`Error de red en GM_xmlhttpRequest para [${klass}-${id}]`, err);
                    reject(err);
                }
            });
        });
    }

    async function fetchParentChangeStatusAuto(id, klassHint=null){
        console.group(`%c[ITSM] Ciclo Automático Buscar Estado Cambio ID: ${id}`, 'color: #ff9800; font-weight: bold;');

        const order = klassHint
        ? [klassHint, ...Config.PARENT_CLASSES.filter(k => k !== klassHint)]
        : [...Config.PARENT_CLASSES];

        log('Orden de clases a evaluar:', order);

        for (const k of order) {
            try {
                log(`Probando clase: ${k}...`);
                const status = await fetchParentChangeStatus(k, id);
                log(`Resultado de evaluar [${k}]: Estado devuelto -> "${status}"`);

                if (status) {
                    log(`%c[ÉXITO] Estado "${status}" encontrado usando clase [${k}]`, 'color: #4caf50; font-weight: bold;');
                    console.groupEnd();
                    return { status, klass: k };
                }
            } catch (e) {
                warn(`Excepción capturada buscando con clase [${k}]`, e);
            }
        }

        warn(`%c[FALLO TOTAL] No se pudo recuperar el estado para el ID ${id} con ninguna clase.`, 'color: #f44336; font-weight: bold;');
        console.groupEnd();
        return { status: '', klass: order[0] || 'NormalChange' };
    }

    // -------------------------------
    // Actions
    // -------------------------------
    const Actions = {
        syncTransitionMenu(){
            const menu = U.qs(Config.SELECTORS.transitionsMenu);
            if (!menu) return;

            if (!State.isFirstContactNo()){
                U.qsa(`${Config.SELECTORS.transitionItem}[data-fc-disabled='1']`, menu).forEach((opt) => {
                    opt.style.pointerEvents=''; opt.style.opacity=''; opt.style.textDecoration=''; opt.style.color='';
                    if (opt.getAttribute('title') === 'Disabled: First Contact not completed') opt.removeAttribute('title');
                    opt.removeAttribute('data-fc-disabled');
                });
                return;
            }

            U.qsa(Config.SELECTORS.transitionItem, menu).forEach((opt) => {
                const text = (opt.textContent || '').trim().toLowerCase();
                const allowed = Config.ALLOWED_OPTIONS.some((s) => text.includes(s));
                if (!allowed) {
                    opt.style.pointerEvents='none'; opt.style.opacity='0.5'; opt.style.textDecoration='line-through'; opt.style.color='#888';
                    opt.title='Disabled: First Contact not completed'; opt.setAttribute('data-fc-disabled','1');
                }
            });
        },

        ensureFirstContactButton(){
            if (!State.isFirstContactNo() || !State.hasAgentAssigned()) return;
            const toolbar = U.qs(Config.SELECTORS.actionsToolbar);
            if (!toolbar || toolbar.querySelector('#' + Config.IDS.quickFirstContactBtn)) return;

            const firstContactLink = U.qs(Config.SELECTORS.firstContactActionLink);
            if (!firstContactLink) return;

            const btn = document.createElement('button');
            btn.id = Config.IDS.quickFirstContactBtn;
            btn.textContent = 'First Contact';
            btn.style.cssText = `
        margin-left:8px;background:#dc3545;color:#fff;
        border:none;border-radius:3px;padding:6px 12px;
        cursor:pointer;font-size:13px;font-weight:bold;
        transition:filter .12s ease-in-out, background .12s ease-in-out;`;
            btn.addEventListener('mouseenter', () => { btn.style.background = '#bb2d3b'; });
            btn.addEventListener('mouseleave', () => { btn.style.background = '#dc3545'; });

            btn.onclick = () => {
                firstContactLink.click();
            };

            toolbar.insertBefore(btn, toolbar.firstChild);
        },
    };

    // -------------------------------
    // Hooks
    // -------------------------------
    const Hooks = {
        hookFirstContact(){
            const fcLink = U.qs(Config.SELECTORS.firstContactActionLink);
            if (!fcLink || fcLink.dataset.fcWatcher) return;

            const onFcClick = (e) => {
                if (State.isCallerEasyMonitor() && State.hasZeroContacts()) {
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    UI.alert(
                        "⚠️ <strong>Contact Required</strong><br><br>The Caller is <strong>Easy Monitor</strong>, but no Customer Contact has been added.<br>You <strong>must</strong> add a contact in the <strong>Contacts</strong> tab before making the First Contact.",
                        () => log('First Contact blocked: Missing Contact in Easy Monitor')
                    );
                }
            };

            fcLink.addEventListener('click', onFcClick);
            fcLink.dataset.fcWatcher = '1';
        },
        hookClickWithConfirm(el, guardFn, message, flagName){
            if (!el || el.dataset[flagName]) return;
            const handler = (e) => {
                if (!guardFn()) return;
                e.preventDefault(); e.stopImmediatePropagation();
                UI.confirm(message,
                           () => { el.removeEventListener('click', handler); el.click(); setTimeout(() => el.addEventListener('click', handler), 0); },
                           () => log('Action cancelled by user'));
            };
            el.addEventListener('click', handler);
            el.dataset[flagName] = '1';
        },

        hookModify(){
            const modifyBtn = U.qs(Config.SELECTORS.modifyButton);
            Hooks.hookClickWithConfirm(
                modifyBtn,
                () => State.isFirstContactNo(),
                "The <strong>First Contact</strong> is still pending.<br>Do you confirm you want to continue?",
                'fcHooked'
            );
        },

        hookPublicLogPen(){
            const penBtn = U.qs(Config.SELECTORS.publicLogPen);
            if (!penBtn || penBtn.dataset.logWatcher) return;
            const handleClick = (e) => {
                const activeTab = U.qs(Config.SELECTORS.activeLogTab);
                const isPublic = activeTab?.dataset.caselogAttributeCode === 'public_log';
                if (State.isFirstContactNo() && isPublic) {
                    e.preventDefault(); e.stopImmediatePropagation();
                    UI.confirm(
                        "You cannot write in the <strong>Public Log</strong> without marking First Contact first.<br>Do you confirm you want to continue?",
                        () => { penBtn.removeEventListener('click', handleClick); penBtn.click(); setTimeout(() => penBtn.addEventListener('click', handleClick), 0); },
                        () => log('Public Log entry cancelled by user')
                    );
                }
            };
            penBtn.addEventListener('click', handleClick);
            penBtn.dataset.logWatcher = '1';
        },

        hookMarkAsResolved(){
            const resolveItem = U.qs(Config.SELECTORS.markAsResolvedItem);
            if (!resolveItem || resolveItem.dataset.resolveWatcher) return;

            const onResolveClick = async (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();

                const issues = [];

                // 1) Tag de solución
                const hasTag = U.hasRequiredTag(Config.REQUIRED_TAG) || (U.qs(Config.SELECTORS.activityPanel)?.innerText.includes(Config.REQUIRED_TAG));
                if (!hasTag) issues.push("⚠️ <strong>Solution log not found</strong> in the case log");

                // 2) Parent Change (NormalChange o EmergencyChange)
                const ref = State.getParentChangeRef();
                if (ref?.id) {
                    try {
                        const { status, klass } = await fetchParentChangeStatusAuto(ref.id, ref.klass);
                        const finished = /^(finished|terminado|closed|cerrado|implemented|implementado|validated|validado)$/i.test(status || '');
                        if (!finished) {
                            issues.push(`⚠️ Parent Change <strong>${ref.id}</strong> <em>(${klass})</em> is in status <strong>${status || '(unknown)'}</strong>`);
                        }
                    } catch (err) {
                        warn('Parent Change status check failed:', err);
                        issues.push("⚠️ Could not verify the status of the Parent Change");
                    }
                } else {
                    log('Parent Change is undefined/empty → skipping parent check');
                }

                // Confirm/Proceed
                const proceed = () => {
                    resolveItem.removeEventListener('click', onResolveClick);
                    resolveItem.click();
                    setTimeout(() => resolveItem.addEventListener('click', onResolveClick), 0);
                };

                if (issues.length > 0) {
                    UI.confirm(issues.join("<br>") + "<br><br>Do you confirm you want to continue?", proceed, () => log('Resolution cancelled by user'));
                } else {
                    proceed();
                }
            };

            resolveItem.addEventListener('click', onResolveClick);
            resolveItem.dataset.resolveWatcher = '1';
        },
    };

    // -------------------------------
    // Orchestrator
    // -------------------------------
    const Orchestrator = {
        refreshAll(){
            Actions.syncTransitionMenu();
            Actions.ensureFirstContactButton();
            Hooks.hookFirstContact();
            Hooks.hookModify();
            Hooks.hookPublicLogPen();
            Hooks.hookMarkAsResolved();
        },
        start(){
            let timeoutId = null;
            const schedule = () => {
                if (timeoutId) clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    Orchestrator.refreshAll();
                }, 150);
            };
            const obs = new MutationObserver(schedule);
            obs.observe(document.body, { childList: true, subtree: true });
            Orchestrator.refreshAll();
        },
    };

    // Boot
    Orchestrator.start();
})();