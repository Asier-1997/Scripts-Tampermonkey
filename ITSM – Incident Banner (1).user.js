// ==UserScript==
// @name         ITSM – Incident Banner
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Banner con checks (Mitigated, First Contact, Escalated y Target Date). Mitigated en naranja con severidad si es NO y Low/Medium, rojo si NO con severidad alta, verde si YES.
// @author       Julian Villanueva
// @match        https://itsm.mecalux.com/pages/UI.php?operation=*&class=Incident&id=*
// @updateURL    https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-Banner.user.js
// @downloadURL  https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-Banner.user.js
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const COLORS = {
        red: '#ff0000',
        green: '#008c07',
        orange: '#ff8400',
        bgGradient: 'linear-gradient(to right, #f9f9f9, #ececec)'
    };
    const STYLES = {
        empty: { color: COLORS.red, emoji: '❌', text: 'Sin fecha', ok: false },
        expired: { color: COLORS.orange, emoji: '⏳', text: 'Caducado', ok: false },
        valid: { color: COLORS.green, emoji: '✅', text: '', ok: true }
    };
    const BIGGER_SIZE = '1.1em';

    // Utilidades ------------------------------------------------------------
    function getFieldValue(attrCode, byLabel = false) {
        const selector = byLabel
            ? `[data-attribute-label='${attrCode}'] .ibo-field--value span`
            : `[data-attribute-code='${attrCode}'] .ibo-field--value span`;
        const field = document.querySelector(selector);
        return field ? field.textContent.trim() : '';
    }

    function getSeverityText() {
        const badge = document.querySelector("[data-attribute-code='priority'] .ibo-field-badge--label");
        return badge ? badge.textContent.trim() : '';
    }

    // *** NUEVO *** ---------------------------------------------------------
    // Devuelve true solo si Service y Service subcategory son Telemaintenance
    function isTelemaintenance() {
        const service = getFieldValue('service_id').toLowerCase();
        const subcat  = getFieldValue('servicesubcategory_id').toLowerCase();
        return service === 'telemaintenance' && subcat === 'telemaintenance';
    }

    // Creación de bloques ----------------------------------------------------
    function createBlock(label, color, emoji, text = '') {
        const div = document.createElement('div');
        div.style.cssText = `
            border: 1px solid ${color};
            color: ${color};
            padding: 3px 8px;
            border-radius: 5px;
            background: #fff;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 5px;
        `;
        div.textContent = `${label}: ${emoji}${text ? ' ' + text : ''}`;
        return div;
    }

    function getTargetDateStatus() {
        const field = document.querySelector("[data-attribute-code='target_date']");
        if (!field) return { node: null, ok: false };

        const rawDate = (field.dataset.valueRaw || '').trim();
        const labelSpan = field.querySelector('.ibo-field--label span');
        const valueDiv = field.querySelector('.ibo-field--value');

        let styleConfig = STYLES.valid;
        let displayText = '';

        function styleField(color, emoji, text, ok) {
            labelSpan.innerHTML = `
                <span style="font-size:${BIGGER_SIZE}">${emoji}</span>
                <span style="color:${color}; font-weight:bold; font-size:${BIGGER_SIZE}; margin-left:5px;">Target date</span>
            `.trim();
            Object.assign(valueDiv.style, {
                color,
                fontWeight: 'bold',
                fontSize: BIGGER_SIZE,
                textDecoration: 'underline'
            });
            displayText = text;
            styleConfig = { color, emoji, text, ok };
        }

        if (!rawDate) {
            styleField(COLORS.red, '❌', 'Sin fecha', false);
        } else {
            const targetDate = new Date(rawDate);
            const now = new Date();
            if (targetDate < now) {
                styleField(COLORS.orange, '⏳', 'Caducado', false);
            } else {
                styleField(COLORS.green, '✅', rawDate, true);
            }
        }

        const text = styleConfig.text ? styleConfig.text : rawDate;
        const node = createBlock('Target Date', styleConfig.color, styleConfig.emoji, text);
        return { node, ok: styleConfig.ok };
    }

    function getActionPlanStatus() {
        const field = document.querySelector("[data-attribute-code='action_plan']");
        if (!field) return { node: null, ok: false };

        const html = field.querySelector('.ibo-is-html-content');
        const text = html ? html.innerText.replace(/\u200B/g, '').trim() : '';
        const hasMedia = html && html.querySelector('img, video, iframe, embed') !== null;
        const empty = (!text && !hasMedia);

        if (empty) {
            return { node: createBlock('Action Plan', COLORS.red, '❌', 'Vacío'), ok: false };
        }
        return { node: createBlock('Action Plan', COLORS.green, '✅'), ok: true };
    }

    // Recolección de estados -------------------------------------------------
    function collectStatuses() {
        const firstContact   = getFieldValue('first_contact').toLowerCase();
        const mitigated      = getFieldValue('mitigated').toLowerCase();
        const escalated      = getFieldValue('Escalated Issue', true).toLowerCase();
        const severityRaw    = getSeverityText();
        const severityLower  = severityRaw.toLowerCase();

        const firstContactOk = firstContact === 'yes';
        const escalatedYes   = escalated === 'yes';

        const okItems  = [];
        const nokItems = [];

        if (mitigated === 'yes') {
            okItems.push(createBlock('Mitigated', COLORS.green, '✅'));
        } else if (severityLower.includes('low') || severityLower.includes('medium')) {
            nokItems.push(createBlock('Mitigated', COLORS.orange, '⏳', `NO (${severityRaw})`));
        } else {
            nokItems.push(createBlock('Mitigated', COLORS.red, '❌', 'NO'));
        }

        firstContactOk
            ? okItems.push(createBlock('First Contact', COLORS.green, '✅'))
            : nokItems.push(createBlock('First Contact', COLORS.red, '❌'));

        escalatedYes
            ? nokItems.push(createBlock('Escalated', COLORS.red, '🔥'))
            : okItems.push(createBlock('Escalated', COLORS.green, '👍'));

        const targetStatus      = getTargetDateStatus();
        targetStatus.ok ? okItems.push(targetStatus.node) : nokItems.push(targetStatus.node);

        const actionPlanStatus  = getActionPlanStatus();
        actionPlanStatus.ok ? okItems.push(actionPlanStatus.node) : nokItems.push(actionPlanStatus.node);

        return { okItems, nokItems, escalatedYes };
    }

    // Construcción del banner ----------------------------------------------
    function buildBanner(okItems, nokItems, escalatedYes) {
        const banner = document.createElement('div');
        banner.id = 'custom-panel-banner';
        banner.style.cssText = `
            background: ${COLORS.bgGradient};
            border: ${escalatedYes ? `3px solid ${COLORS.red}` : '2px solid #ccc'};
            padding: 10px 15px;
            margin-bottom: 12px;
            border-radius: 8px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            align-items: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        `;
        [...okItems, ...nokItems].forEach(node => node && banner.appendChild(node));
        return banner;
    }

    // Inserción del banner ---------------------------------------------------
    function insertBanner() {
        // Solo continuar si es Telemaintenance
        if (!isTelemaintenance()) return;

        const container = document.querySelector("div.ibo-object-details[data-object-class='Incident']");
        if (!container || document.querySelector('#custom-panel-banner')) return;

        const sentinel = container.querySelector("[data-role='ibo-panel--header--sticky-sentinel-top']");
        if (!sentinel) return;

        const { okItems, nokItems, escalatedYes } = collectStatuses();
        const banner = buildBanner(okItems, nokItems, escalatedYes);

        sentinel.parentNode.insertBefore(banner, sentinel);
    }

    // Lanzamos después de un pequeño delay para asegurarnos de que el DOM esté listo
    setTimeout(insertBanner, 1);
})();