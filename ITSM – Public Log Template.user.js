// ==UserScript==
// @name         ITSM – Public Log Template
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Botón para insertar plantilla en el log público con slider ES/EN y control de placeholder para CKEditor 5. Incluye soporte para First Contact y FOLD/UNFOLD.
// @match        https://itsm.mecalux.com/pages/UI.php?operation=details&class=Incident&id=*
// @match        https://itsm.mecalux.com/pages/UI.php?stimulus=ev_first_contact&class=Incident&operation=stimulus&id=*
// @updateURL    https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-PublicLogEnhancements.user.js
// @downloadURL  https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-PublicLogEnhancements.user.js
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    /*********************************
    * Logger
    *********************************/
    const LOG = {
        L: (...a) => console.log('[ITSM-PUBLICLOG]', ...a),
        W: (...a) => console.warn('[ITSM-PUBLICLOG]', ...a),
        E: (...a) => console.error('[ITSM-PUBLICLOG]', ...a),
    };

    /*********************************
    * Config
    *********************************/
    const LANG_KEY = 'itsm_publiclog_lang'; // 'es' | 'en'

    // Selectores Public Log
    const PUBLIC_WRAP_SEL = '[data-attribute-code="public_log"]';
    const EXTRA_ACTIONS_SEL = '.ibo-caselog-entry-form--action-buttons--extra-actions';
    const MAIN_ACTIONS_SEL = '.ibo-caselog-entry-form--action-buttons--main-actions';

    // Selectores First Contact
    const FC_FIELD_SEL = '[data-attribute-code="first_contact_reason"]';
    const FC_CONTROLS_CLASS = 'itsm-firstcontact-controls';

    // Plantillas ES/EN
    const TPL = {
        es: `
<p><strong><u>Contacto</u></strong>:</p>
<p>&nbsp;</p>
<p><strong><u>Motivo de la llamada</u></strong>:</p>
<p>&nbsp;</p>
<p><strong><u>Resumen de la llamada</u></strong>:</p>
<p>&nbsp;</p>
`.trim(),
        en: `
<p><u><strong>Contact</strong></u>:</p>
<p>&nbsp;</p>
<p><u><strong>Call Reason</strong></u>:</p>
<p>&nbsp;</p>
<p><u><strong>Call Summary</strong></u>:</p>
<p>&nbsp;</p>
`.trim()
    };

    /*********************************
    * Utils (Adaptados a CKE5)
    *********************************/
    const U = {
        getLang() {
            const saved = localStorage.getItem(LANG_KEY);
            return (saved === 'en' || saved === 'es') ? saved : 'es';
        },
        setLang(lang) {
            const v = (lang === 'en' || lang === 'es') ? lang : 'es';
            localStorage.setItem(LANG_KEY, v);
            return v;
        },
        isVisible: (el) => !!(el && el.offsetParent),
        isFirstContactPage() {
            const qs = new URLSearchParams(location.search);
            return qs.get('stimulus') === 'ev_first_contact' && qs.get('operation') === 'stimulus';
        },
        isEmptyHtml(s) {
            const t = (s || '')
                .replace(/<p>\s*&nbsp;\s*<\/p>/gi, '')
                .replace(/&nbsp;/gi, ' ')
                .replace(/<[^>]+>/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            return t.length === 0;
        },

        /**
         * Obtiene la instancia activa de CKE5 para el Log Público.
         */
        getActivePublicEditor() {
            const wrap = document.querySelector(PUBLIC_WRAP_SEL);
            if (!wrap) return null;
            const editable = wrap.querySelector('.ck-editor__editable');
            return editable?.ckeditorInstance || null;
        },

        /**
         * Obtiene la instancia CKE5 para un campo específico (ej: first_contact_reason).
         */
        getEditorFromField(attcode) {
            const field = document.querySelector(`[data-attribute-code="${attcode}"]`);
            if (!field) return null;
            const editable = field.querySelector('.ck-editor__editable');
            return editable?.ckeditorInstance || null;
        },

        /**
         * Inserta HTML en el editor CKE5 gestionando el reemplazo de placeholder.
         */
        insertTemplate(ed, html, asPlaceholder) {
            if (!ed) return;
            if (asPlaceholder) {
                ed.setData(html);
                U.markAsPlaceholder(ed, html);
            } else {
                const current = ed.getData() || '';
                ed.setData(current + html);
                U.clearPlaceholderFlags(ed);
            }
        },

        markAsPlaceholder(ed, html) {
            ed.__itsm_pub_isPlaceholder = true;
            ed.__itsm_pub_placeholderHTML = (html || '').trim();
            ed.__itsm_pub_userEdited = false;

            if (!ed.__itsm_pub_bounded) {
                ed.model.document.on('change:data', () => U.placeholderChangeWatcher(ed));
                ed.__itsm_pub_bounded = true;
            }
        },

        clearPlaceholderFlags(ed) {
            ed.__itsm_pub_isPlaceholder = false;
            ed.__itsm_pub_placeholderHTML = '';
            ed.__itsm_pub_userEdited = true;
        },

        placeholderChangeWatcher(ed) {
            try {
                const now = (ed.getData() || '').trim();
                const ref = (ed.__itsm_pub_placeholderHTML || '').trim();
                if (ed.__itsm_pub_isPlaceholder && now && now !== ref) {
                    ed.__itsm_pub_isPlaceholder = false;
                    ed.__itsm_pub_userEdited = true;
                }
            } catch { }
        },

        debounce: (fn, wait = 120) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); }; }
    };

    /*********************************
    * UI CONTROLS (reutilizable)
    *********************************/
    function buildControls(getTargetEditorFn) {
        const box = document.createElement('div');
        box.className = 'itsm-publiclog-controls';
        box.style.display = 'inline-flex';
        box.style.alignItems = 'center';
        box.style.gap = '10px';
        box.style.margin = '4px 0 8px 0';

        // Slider ES / EN
        const sliderWrap = document.createElement('label');
        sliderWrap.className = 'itsm-lang-switch';
        sliderWrap.title = 'Cambiar idioma ES/EN';
        sliderWrap.style.display = 'inline-flex';
        sliderWrap.style.alignItems = 'center';
        sliderWrap.style.gap = '8px';
        sliderWrap.style.cursor = 'pointer';
        sliderWrap.style.userSelect = 'none';

        function makeFlag(code, alt) {
            const img = document.createElement('img');
            img.src = `https://flagcdn.com/w20/${code}.png`;
            img.alt = alt;
            img.style.width = '20px';
            img.style.height = '14px';
            img.style.border = '1px solid rgba(0,0,0,0.15)';
            img.style.borderRadius = '2px';
            img.style.display = 'block';
            return img;
        }

        const esSpan = makeFlag('es', 'Spanish');
        const enSpan = makeFlag('gb', 'English');

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'itsm-lang-checkbox';
        input.style.display = 'none';
        input.setAttribute('aria-label', 'Language switch ES/EN');

        const track = document.createElement('span');
        track.className = 'itsm-lang-track';

        sliderWrap.append(esSpan, input, track, enSpan);
        input.checked = (U.getLang() === 'en');
        input.addEventListener('change', () => {
            const lang = U.setLang(input.checked ? 'en' : 'es');
            LOG.L('Idioma cambiado a', lang);
        });

        // Botón insertar
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ibo-button ibo-is-regular';
        btn.textContent = 'Insert Call Template';
        btn.title = 'Insert call template';
        btn.style.height = '28px';
        btn.style.cursor = 'pointer';

        btn.addEventListener('click', (e) => {
            const ed = getTargetEditorFn();
            if (!ed) return;
            const lang = U.getLang();
            const html = TPL[lang] || TPL.es;

            const current = (ed.getData() || '');
            const isEmpty = U.isEmptyHtml(current);
            const isPlaceholder = !!ed.__itsm_pub_isPlaceholder;

            // Reemplaza (placeholder) si está vacío, es placeholder o si se pulsa con ALT
            const asPlaceholder = isEmpty || isPlaceholder || e.altKey === true;
            U.insertTemplate(ed, html, asPlaceholder);
        });

        box.append(sliderWrap, btn);
        return box;
    }

    /*********************************
    * Inyección de controles
    *********************************/
    function injectControlsPublicLog() {
        const wrap = document.querySelector(PUBLIC_WRAP_SEL);
        if (!wrap) return;
        if (wrap.querySelector('.itsm-publiclog-controls')) return;

        const host = wrap.querySelector(EXTRA_ACTIONS_SEL) || wrap.querySelector(MAIN_ACTIONS_SEL);
        if (!host) return;

        const controls = buildControls(() => U.getActivePublicEditor());
        host.appendChild(controls);
        LOG.L('Controles Public Log insertados.');
    }

    function injectControlsFirstContact() {
        const field = document.querySelector(FC_FIELD_SEL);
        if (!field) return;
        if (field.querySelector(`.${FC_CONTROLS_CLASS}`)) return;

        const label = field.querySelector('.ibo-field--label');
        if (!label) return;

        const wrapper = document.createElement('div');
        wrapper.className = FC_CONTROLS_CLASS;

        const controls = buildControls(() => U.getEditorFromField('first_contact_reason'));
        wrapper.appendChild(controls);

        label.parentNode.insertBefore(wrapper, label);
        LOG.L('Controles First Contact insertados sobre el label.');
    }

    /*********************************
    * Module: publicForm (folding)
    *********************************/
    const publicForm = (() => {
        const FORM_COLLAPSE_KEY = (id = 'unknown') => `itsm_publog_form_collapsed:${id}`;

        function getTicketId() {
            try { return new URLSearchParams(location.search).get('id') || 'unknown'; }
            catch { return 'unknown'; }
        }

        function toggle(form, id) {
            const now = form.dataset.formCollapsed === '1' ? '0' : '1';
            form.setAttribute('data-form-collapsed', now);
            localStorage.setItem(FORM_COLLAPSE_KEY(id), now);
        }

        function makeCollapsible() {
            const form = document.querySelector(`form.ibo-caselog-entry-form${PUBLIC_WRAP_SEL}`);
            if (!form) return;

            const ticketId = getTicketId();
            if (!form.__itsm_formCollapseInit) {
                const saved = localStorage.getItem(FORM_COLLAPSE_KEY(ticketId));
                if (saved === '1') form.setAttribute('data-form-collapsed', '1');
            }

            const textInput = form.querySelector('.ibo-caselog-entry-form--text-input');
            if (textInput) {
                let bar = form.querySelector('.itsm-publog-toggle-bar');
                if (!bar) {
                    bar = document.createElement('div');
                    bar.className = 'itsm-publog-toggle-bar';
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'itsm-publog-toggle';
                    const setLabel = () => btn.textContent = form.dataset.formCollapsed === '1' ? 'UNFOLD' : 'FOLD';
                    setLabel();
                    btn.addEventListener('click', (e) => { e.preventDefault(); toggle(form, ticketId); setLabel(); });
                    bar.appendChild(btn);
                    textInput.insertAdjacentElement('afterend', bar);
                } else {
                    const btn = bar.querySelector('.itsm-publog-toggle');
                    if (btn) btn.textContent = form.dataset.formCollapsed === '1' ? 'UNFOLD' : 'FOLD';
                }
            }

            form.__itsm_formCollapseInit = true;
        }

        return { makeCollapsible: U.debounce(makeCollapsible, 80) };
    })();

    /*********************************
    * Estilos (slider + folding)
    *********************************/
    function injectCSS() {
        const css = `
.itsm-publiclog-controls .itsm-lang-track {
  position: relative;
  width: 40px;
  height: 20px;
  border-radius: 999px;
  background: #cfd8dc;
  display: inline-block;
  transition: background .2s ease;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.08);
}
.itsm-publiclog-controls .itsm-lang-track::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform .2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,.25);
}
.itsm-publiclog-controls .itsm-lang-checkbox:checked + .itsm-lang-track {
  background: #90caf9;
}
.itsm-publiclog-controls .itsm-lang-checkbox:checked + .itsm-lang-track::after {
  transform: translateX(20px);
}
.itsm-publiclog-controls .ibo-button {
  padding: 4px 10px;
}
.itsm-publiclog-controls .itsm-lang-switch span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
/* Public Log – plegado */
[data-attribute-code="public_log"] .ibo-caselog-entry-form--actions{position:relative}
[data-attribute-code="public_log"] .itsm-publog-toggle-bar{display:flex;align-items:center;justify-content:center;padding:6px 0;background:#f5f5f5;border-top:1px solid #ccc}
[data-attribute-code="public_log"] .itsm-publog-toggle{background:linear-gradient(to bottom,#fff,#e6e6e6);border:1px solid #888;border-radius:4px;padding:4px 12px;font-size:12px;font-weight:bold;color:#333;cursor:pointer;transition:all .2s}
[data-attribute-code="public_log"] .itsm-publog-toggle:hover{background:linear-gradient(to bottom,#f9f9f9,#dcdcdc);border-color:#555}
[data-attribute-code="public_log"][data-form-collapsed="1"] .ibo-caselog-entry-form--text-input,
[data-attribute-code="public_log"][data-form-collapsed="1"] .ibo-caselog-entry-form--extra-inputs,
[data-attribute-code="public_log"][data-form-collapsed="1"] .ibo-caselog-entry-form--lock-indicator,
[data-attribute-code="public_log"][data-form-collapsed="1"] .ibo-caselog-entry-form--action-buttons--main-actions{display:none!important}
`;
        const st = document.createElement('style');
        st.textContent = css;
        document.head.appendChild(st);
    }

    /*********************************
    * CKEditor 5 Binding
    *********************************/
    function bindEditors() {
        if (U.isFirstContactPage()) {
            injectControlsFirstContact();
        } else {
            injectControlsPublicLog();
            publicForm.makeCollapsible();
        }

        // Inicializar flags limpios si la instancia de CKE5 ya está montada y vacía
        const ed = U.isFirstContactPage() ? U.getEditorFromField('first_contact_reason') : U.getActivePublicEditor();
        if (ed && U.isEmptyHtml(ed.getData())) {
            ed.__itsm_pub_isPlaceholder = false;
            ed.__itsm_pub_placeholderHTML = '';
            ed.__itsm_pub_userEdited = false;
        }
    }

    /*********************************
    * Observers (CKE5 DOM detection)
    *********************************/
    const obs = new MutationObserver((muts) => {
        let shouldCheck = false;
        for (const m of muts) {
            for (const n of m.addedNodes) {
                if (n.nodeType !== 1) continue;
                if (
                    n.classList?.contains('ck-editor') ||
                    n.querySelector?.('.ck-editor__editable') ||
                    n.matches?.(PUBLIC_WRAP_SEL) ||
                    n.querySelector?.(PUBLIC_WRAP_SEL) ||
                    n.matches?.(FC_FIELD_SEL) ||
                    n.querySelector?.(FC_FIELD_SEL)
                ) { shouldCheck = true; break; }
            }
            if (shouldCheck) break;
        }
        if (shouldCheck) bindEditors();
    });

    /*********************************
    * Boot
    *********************************/
    function boot() {
        injectCSS();
        obs.observe(document.body, { childList: true, subtree: true });
        bindEditors();
        LOG.L('Public Log Template (Slider ES/EN) + First Contact UI + FOLD feature listo para CKE5.');
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();