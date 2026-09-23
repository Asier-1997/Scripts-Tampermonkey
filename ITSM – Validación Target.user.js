// ==UserScript==
// @name         ITSM – Validación Target
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Emoji y colores para Target date.
// @author       Julian
// @match        https://itsm.mecalux.com/pages/UI.php?operation=*&class=Incident&id=*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    const STYLES = {
        empty: {
            color: '#FF0000',
            emoji: '❌'
        },
        expired: {
            color: '#ff8400',
            emoji: '⏳'
        },
        valid: {
            color: '#008c07',
            emoji: '✅'
        }
    };

    const BIGGER_SIZE = '1.2em';

    function applyStyle(span, color, emoji, text) {
        span.innerHTML = `
            <span style="font-size: ${BIGGER_SIZE};">${emoji}</span>
            <span style="color: ${color}; font-weight: bold; font-size: ${BIGGER_SIZE}; text-decoration: underline; margin-left: 5px;">${text}</span>
        `.trim();
    }

    function highlightTargetDate(root = document.body) {
        const field = root.querySelector("[data-attribute-code='target_date']");
        if (!field) return;

        const labelSpan = field.querySelector('.ibo-field--label span');
        const valueDiv = field.querySelector('.ibo-field--value');

        if (!labelSpan || !valueDiv) return;

        const rawDate = (field.dataset.valueRaw || '').trim();
        const labelText = 'Target date';

        if (!rawDate) {
            const { color, emoji } = STYLES.empty;
            applyStyle(labelSpan, color, emoji, labelText);
            valueDiv.style.color = color;
            valueDiv.style.fontWeight = 'bold';
            valueDiv.style.fontSize = BIGGER_SIZE;
            valueDiv.style.textDecoration = 'underline';
            return;
        }

        const targetDate = new Date(rawDate);
        const now = new Date();

        if (targetDate < now) {
            const { color, emoji } = STYLES.expired;
            applyStyle(labelSpan, color, emoji, labelText);
            valueDiv.style.color = color;
            valueDiv.style.fontWeight = 'bold';
            valueDiv.style.fontSize = BIGGER_SIZE;
            valueDiv.style.textDecoration = 'underline';
        } else {
            const { color, emoji } = STYLES.valid;
            applyStyle(labelSpan, color, emoji, labelText);
            valueDiv.style.color = color;
            valueDiv.style.fontWeight = 'bold';
            valueDiv.style.fontSize = BIGGER_SIZE;
            valueDiv.style.textDecoration = 'none';
        }
    }

    highlightTargetDate();

    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            m.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    highlightTargetDate(node);
                }
            });
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
