// ==UserScript==
// @name         ITSM – Pestaña [Attachments] en alerta si contiene (n)
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Añade “⚠️ ” y pinta en naranja la pestaña “Attachments” cuando tenga archivos adjuntos (ej. “Attachments (1)”).
// @author       Julian Villanueva
// @match        https://itsm.mecalux.com/pages/UI.php?operation=*&class=Incident&id=*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    const ALERT_COLOR = '#ff8400';
    const ALERT_PREFIX = '⚠️ ';
    const BIGGER_SIZE = '1.2em';
    const TARGET_TAB_ID = 'tab_AttachmentsTab';
    const TARGET_LABEL = 'attachments';

    function updateAttachmentsTab(tabLi) {
        const labelSpan = tabLi.querySelector('.ibo-tab-container--tab-toggler-label');
        if (!labelSpan) return;

        const rawText = labelSpan.textContent.replace(/^⚠️\s*/, '').trim();
        const isPlain = rawText.toLowerCase() === TARGET_LABEL;

        if (!isPlain && !tabLi.dataset.attachmentsTabAlert) {
            labelSpan.textContent = ALERT_PREFIX + rawText;
            Object.assign(labelSpan.style, {
                color: ALERT_COLOR,
                fontWeight: 'bold',
                fontSize: BIGGER_SIZE
            });
            tabLi.dataset.attachmentsTabAlert = 'true';
        } else if (isPlain && tabLi.dataset.attachmentsTabAlert) {
            labelSpan.textContent = rawText;
            labelSpan.style.color = '';
            labelSpan.style.fontWeight = '';
            labelSpan.style.fontSize = '';
            delete tabLi.dataset.attachmentsTabAlert;
        }
    }

    function scan(root = document.body) {
        const tab = root.querySelector(`[data-tab-id='${TARGET_TAB_ID}']`);
        if (tab) updateAttachmentsTab(tab);
    }

    scan();

    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            if (m.type === 'characterData' && m.target.parentElement) {
                const tabLi = m.target.parentElement.closest(`[data-tab-id='${TARGET_TAB_ID}']`);
                if (tabLi) updateAttachmentsTab(tabLi);
            }
            m.addedNodes.forEach(node => {
                if (node.nodeType !== Node.ELEMENT_NODE) return;
                if (node.matches?.(`[data-tab-id='${TARGET_TAB_ID}']`)) {
                    updateAttachmentsTab(node);
                } else {
                    scan(node);
                }
            });
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
})();
