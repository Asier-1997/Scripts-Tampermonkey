// ==UserScript==
// @name         ITSM – Pestaña [Child incidents] en alerta si contiene (n)
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Añade “⚠️ ” y pinta en naranja la pestaña “Child incidents” cuando tenga valor extra (ej. “Child incidents (2)”) y restaura al volver a cero.
// @author       Julian
// @match        https://itsm.mecalux.com/pages/UI.php?operation=*&class=Incident&id=*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    const ALERT_COLOR = '#ff8400';
    const ALERT_PREFIX = '⚠️ ';
    const BIGGER_SIZE = '1.2em';
    const TARGET_TAB_ID = 'tab_ClassIncidentAttributechild_incidents_list';
    const TARGET_LABEL = 'child incidents';

    function updateChildIncidentsTab(tabLi) {
        const labelSpan = tabLi.querySelector('.ibo-tab-container--tab-toggler-label');
        if (!labelSpan) return;

        const rawText = labelSpan.textContent.replace(/^⚠️\s*/, '').trim();
        const isPlain = rawText.toLowerCase() === TARGET_LABEL;

        if (!isPlain && !tabLi.dataset.childIncidentsTabAlert) {
            labelSpan.textContent = ALERT_PREFIX + rawText;
            Object.assign(labelSpan.style, {
                color: ALERT_COLOR,
                fontWeight: 'bold',
                fontSize: BIGGER_SIZE
            });
            tabLi.dataset.childIncidentsTabAlert = 'true';
        } else if (isPlain && tabLi.dataset.childIncidentsTabAlert) {
            labelSpan.textContent = rawText;
            labelSpan.style.color = '';
            labelSpan.style.fontWeight = '';
            labelSpan.style.fontSize = '';
            delete tabLi.dataset.childIncidentsTabAlert;
        }
    }

    function scan(root = document.body) {
        const tab = root.querySelector(`[data-tab-id='${TARGET_TAB_ID}']`);
        if (tab) updateChildIncidentsTab(tab);
    }

    scan();

    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            if (m.type === 'characterData' && m.target.parentElement) {
                const tabLi = m.target.parentElement.closest(`[data-tab-id='${TARGET_TAB_ID}']`);
                if (tabLi) updateChildIncidentsTab(tabLi);
            }
            m.addedNodes.forEach(node => {
                if (node.nodeType !== Node.ELEMENT_NODE) return;
                if (node.matches?.(`[data-tab-id='${TARGET_TAB_ID}']`)) {
                    updateChildIncidentsTab(node);
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
