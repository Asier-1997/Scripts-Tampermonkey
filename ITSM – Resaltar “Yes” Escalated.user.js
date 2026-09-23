// ==UserScript==
// @name         ITSM – Resaltar “Yes” Escalated
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Pinta en rojo, negrita, subrayado y más grande la etiqueta y el “No” de Escalated
// @author       Julian Villanueva
// @match        https://itsm.mecalux.com/pages/UI.php?operation=*&class=Incident&id=*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    const ALERT_COLOR = '#FF0000';
    const OK_COLOR = '#008c07';
    const BIGGER_SIZE = '1.2em';
    const ICON_ALERT = '🚨';

    function highlightNo(root = document.body) {
        const selector =
            "[data-attribute-label='Escalated Issue']";

        root.querySelectorAll(selector).forEach(field => {
            const valueSpan = field.querySelector('.ibo-field--value span');
            const labelSpan = field.querySelector('.ibo-field--label span');
            if (!valueSpan || !labelSpan) return;

            const raw = (field.dataset.valueRaw || '').trim().toLowerCase();
            const txt = valueSpan.textContent.trim().toLowerCase();

            const cleanText = labelSpan.innerText.replace(/^🚨\s*/g, '').trim();

            if ((raw === 'yes' || txt === 'yes') && !field.dataset.noHighlighted) {
                /* Valor “No” */
                Object.assign(valueSpan.style, {
                    color: ALERT_COLOR,
                    fontWeight: 'bold',
                    fontSize: BIGGER_SIZE,
                    textDecoration: 'underline'
                });

                // Etiqueta con 🔥
                labelSpan.innerHTML = `
                    <span style="text-decoration: none; font-size: ${BIGGER_SIZE}">${ICON_ALERT}</span>
                    <span style="color: ${ALERT_COLOR}; font-weight: bold; font-size: ${BIGGER_SIZE}; text-decoration: underline">${cleanText}</span>
                `.trim();

                /* Etiqueta */
                Object.assign(labelSpan.style, {
                    color: ALERT_COLOR,
                    fontWeight: 'bold',
                    fontSize: BIGGER_SIZE,
                });

                field.dataset.noHighlighted = 'true';
            }
        });
    }

    highlightNo();

    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            m.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    highlightNo(node);
                }
            });
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
