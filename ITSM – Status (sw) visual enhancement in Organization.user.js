// ==UserScript==
// @name         ITSM – Status (sw) visual enhancement in Organization
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  Colorea y añade icono a Status (sw) solo en ORGANIZATION. Emoji se aplica al valor. Texto de etiqueta subrayado.
// @author       Julian
// @match        https://itsm.mecalux.com/pages/UI.php?operation=*&class=Organization&id=*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    const STATUS_STYLE = {
        'Active':     { color: '#2a9e00', icon: '✅' },
        'Reception':  { color: '#ff7300', icon: '⚠️' },
        'Operations': { color: '#ff0000', icon: '❗' }
    };

    const BIGGER_SIZE = '1.2em';

    function enhanceStatusSW(root = document.body) {
        const field = root.querySelector('[data-attribute-label="Status (sw)"]');
        if (!field) return;

        const valueSpan = field.querySelector('.ibo-field--value span');
        const labelSpan = field.querySelector('.ibo-field--label span');
        if (!valueSpan || !labelSpan) return;

        const rawText = valueSpan.textContent.trim();
        const config = STATUS_STYLE[rawText];

        if (!config || valueSpan.dataset.statusEnhanced) return;

        // Valor con emoji y color
        valueSpan.textContent = `${config.icon} ${rawText}`;
        Object.assign(valueSpan.style, {
            color: config.color,
            fontWeight: 'bold',
            fontSize: BIGGER_SIZE
        });

        // Etiqueta estilizada (sin emoji)
        const cleanLabel = labelSpan.textContent.replace(/^[❗⚠️✅]\s*/, '').trim();
        labelSpan.innerHTML = `
            <span style="color: ${config.color}; font-weight: bold; font-size: ${BIGGER_SIZE}; text-decoration: underline">${cleanLabel}</span>
        `.trim();

        valueSpan.dataset.statusEnhanced = 'true';
    }

    enhanceStatusSW();

    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            m.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    enhanceStatusSW(node);
                }
            });
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
