// ==UserScript==
// @name         ITSM – Alerta ACTION PLAN ❌ o ✅
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Muestra ❌ si el campo Action Plan está vacío y ✅ si tiene contenido. Estilos aplicados según el estado, sin logs de depuración.
// @author       Julian Villanueva
// @match        https://itsm.mecalux.com/pages/UI.php?operation=*&class=Incident&id=*
// @updateURL    https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-ActionPlanAlert.user.js
// @downloadURL  https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-ActionPlanAlert.user.js
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    const TARGET_LABELS = ['Action Plan'];
    const ALERT_ICON = '❌';
    const OK_ICON = '✅';
    const ALERT_COLOR = '#FF0000';
    const OK_COLOR = '#008c07';
    const BIGGER_SIZE = '1.2em';

    function getHtmlContainer(field) {
        return field.querySelector('.ibo-is-html-content');
    }

    function isHtmlEmpty(html) {
        if (!html) return true;
        const text = html.innerText.replace(/\u200B/g, '').trim();
        const hasMedia = html.querySelector('img, video, iframe, embed') !== null;
        return text === '' && !hasMedia;
    }

    function updateFieldAlert(field) {
        const labelSpan = field.querySelector('.ibo-field--label span');
        const html = getHtmlContainer(field);
        if (!labelSpan || !html) return;

        const baseText = labelSpan.innerText.replace(/^(❌|✅)\s*/, '').trim();
        const empty = isHtmlEmpty(html);

        if (empty) {
            labelSpan.innerHTML = `
                <span style="text-decoration: none; font-size: ${BIGGER_SIZE}">${ALERT_ICON}</span>
                <span style="color: ${ALERT_COLOR}; font-weight: bold; font-size: ${BIGGER_SIZE}; text-decoration: underline">${baseText}</span>
            `.trim();
            field.dataset.htmlAlerted = 'true';
        } else {
            labelSpan.innerHTML = `
                <span style="text-decoration: none; font-size: ${BIGGER_SIZE}">${OK_ICON}</span>
                <span style="color: ${OK_COLOR}; font-weight: bold; font-size: ${BIGGER_SIZE}">${baseText}</span>
            `.trim();
            field.dataset.htmlAlerted = 'true';
        }
    }

    function watchHtmlField(field) {
        const html = getHtmlContainer(field);
        if (!html || field.dataset.htmlWatcher) return;

        updateFieldAlert(field);

        const mo = new MutationObserver(() => {
            updateFieldAlert(field);
        });

        mo.observe(html, { childList: true, subtree: true, characterData: true });
        field.dataset.htmlWatcher = 'true';
    }

    function scan(root = document.body) {
        root.querySelectorAll('.ibo-field').forEach(field => {
            const label = field.querySelector('.ibo-field--label span');
            if (!label) return;

            const labelText = label.textContent.trim().toLowerCase();
            if (TARGET_LABELS.some(t => t.toLowerCase() === labelText)) {
                watchHtmlField(field);
            }
        });
    }

    scan();

    const globalObserver = new MutationObserver(muts => {
        muts.forEach(m => {
            m.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    scan(node);
                }
            });
        });
    });

    globalObserver.observe(document.body, { childList: true, subtree: true });
})();