// ==UserScript==
// @name         ITSM – Resaltado FC, Mitigated y Escalated (Fusionado)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Resalta "No" en First Contact y Mitigated con 🔥, "Yes" en verde, y marca Escalated (Yes) en rojo con 🚨.
// @author       Julian Villanueva
// @match        https://itsm.mecalux.com/pages/UI.php?operation=*&class=Incident&id=*
// @updateURL    https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-FirstContactMitigAlerts.user.js
// @downloadURL  https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-FirstContactMitigAlerts.user.js
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    const ALERT_COLOR = '#FF0000';
    const OK_COLOR = '#008c07';
    const BIGGER_SIZE = '1.2em';
    const ICON_ALERT = '🔥';
    const ICON_OK = '✅';
    const ESCALATED_ICON = '🚨';

    function highlightFields(root = document.body) {
        // First Contact & Mitigated
        root.querySelectorAll("[data-attribute-code='first_contact'], [data-attribute-code='mitigated']").forEach(field => {
            const valueSpan = field.querySelector('.ibo-field--value span');
            const labelSpan = field.querySelector('.ibo-field--label span');
            if (!valueSpan || !labelSpan) return;

            const raw = (field.dataset.valueRaw || '').trim().toLowerCase();
            const txt = valueSpan.textContent.trim().toLowerCase();
            const cleanText = labelSpan.innerText.replace(/^🔥\s*|^✅\s*/g, '').trim();

            if ((raw === 'no' || txt === 'no') && !field.dataset.highlighted) {
                Object.assign(valueSpan.style, {
                    color: ALERT_COLOR,
                    fontWeight: 'bold',
                    fontSize: BIGGER_SIZE,
                    textDecoration: 'underline'
                });
                labelSpan.innerHTML = `
                    <span style="text-decoration: none; font-size: ${BIGGER_SIZE}">${ICON_ALERT}</span>
                    <span style="color: ${ALERT_COLOR}; font-weight: bold; font-size: ${BIGGER_SIZE}; text-decoration: underline">${cleanText}</span>
                `.trim();
                field.dataset.highlighted = 'true';
            } else if ((raw === 'yes' || txt === 'yes') && !field.dataset.highlighted) {
                Object.assign(valueSpan.style, {
                    color: OK_COLOR,
                    fontWeight: 'bold'
                });
                labelSpan.innerHTML = `
                    <span style="text-decoration: none; font-size: ${BIGGER_SIZE}">${ICON_OK}</span>
                    <span style="color: ${OK_COLOR}; font-weight: bold; font-size: ${BIGGER_SIZE}">${cleanText}</span>
                `.trim();
                field.dataset.highlighted = 'true';
            }
        });

        // Escalated Issue
        root.querySelectorAll("[data-attribute-label='Escalated Issue']").forEach(field => {
            const valueSpan = field.querySelector('.ibo-field--value span');
            const labelSpan = field.querySelector('.ibo-field--label span');
            if (!valueSpan || !labelSpan) return;

            const raw = (field.dataset.valueRaw || '').trim().toLowerCase();
            const txt = valueSpan.textContent.trim().toLowerCase();
            const cleanText = labelSpan.innerText.replace(/^🚨\s*/g, '').trim();

            if ((raw === 'yes' || txt === 'yes') && !field.dataset.highlighted) {
                Object.assign(valueSpan.style, {
                    color: ALERT_COLOR,
                    fontWeight: 'bold',
                    fontSize: BIGGER_SIZE,
                    textDecoration: 'underline'
                });
                labelSpan.innerHTML = `
                    <span style="text-decoration: none; font-size: ${BIGGER_SIZE}">${ESCALATED_ICON}</span>
                    <span style="color: ${ALERT_COLOR}; font-weight: bold; font-size: ${BIGGER_SIZE}; text-decoration: underline">${cleanText}</span>
                `.trim();
                field.dataset.highlighted = 'true';
            }
        });
    }

    // Inicializa y observa cambios dinámicos
    highlightFields();
    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            m.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    highlightFields(node);
                }
            });
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();