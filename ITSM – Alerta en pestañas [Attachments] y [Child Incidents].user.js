// ==UserScript==
// @name         ITSM – Alerta en pestañas [Attachments] y [Child Incidents]
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Añade “⚠️” y resalta en naranja las pestañas "Attachments" y "Child incidents" si tienen un contador (ej. "Attachments (2)"), restaurando al volver a cero.
// @author       Julian Villanueva
// @match        https://itsm.mecalux.com/pages/UI.php?operation=*&class=*
// @updateURL    https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-TabsAlert.user.js
// @downloadURL  https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-TabsAlert.user.js
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    const ALERT_COLOR = '#ff8400';
    const ALERT_PREFIX = '⚠️ ';
    const BIGGER_SIZE = '1.2em';

    // Lista de pestañas a monitorizar (puedes añadir más si lo necesitas)
    const TABS_TO_MONITOR = [
        { id: 'tab_AttachmentsTab', label: 'attachments' },
        { id: 'tab_ClassIncidentAttributechild_incidents_list', label: 'child incidents' }
    ];

    function updateTab(tabLi, targetLabel, datasetKey) {
        const labelSpan = tabLi.querySelector('.ibo-tab-container--tab-toggler-label');
        if (!labelSpan) return;

        const rawText = labelSpan.textContent.replace(/^⚠️\s*/, '').trim();
        const isPlain = rawText.toLowerCase() === targetLabel;

        if (!isPlain && !tabLi.dataset[datasetKey]) {
            // Si hay contador, aplicar alerta
            labelSpan.textContent = ALERT_PREFIX + rawText;
            Object.assign(labelSpan.style, {
                color: ALERT_COLOR,
                fontWeight: 'bold',
                fontSize: BIGGER_SIZE
            });
            tabLi.dataset[datasetKey] = 'true';
        } else if (isPlain && tabLi.dataset[datasetKey]) {
            // Si ya no hay contador, restaurar estilo
            labelSpan.textContent = rawText;
            labelSpan.style.color = '';
            labelSpan.style.fontWeight = '';
            labelSpan.style.fontSize = '';
            delete tabLi.dataset[datasetKey];
        }
    }

    function scan(root = document.body) {
        TABS_TO_MONITOR.forEach(tab => {
            const tabElement = root.querySelector(`[data-tab-id='${tab.id}']`);
            if (tabElement) {
                updateTab(tabElement, tab.label, `alert${tab.id}`);
            }
        });
    }

    scan();

    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            if (m.type === 'characterData' && m.target.parentElement) {
                const tabLi = m.target.parentElement.closest('[data-tab-id]');
                if (tabLi) {
                    const tabConfig = TABS_TO_MONITOR.find(t => tabLi.matches(`[data-tab-id='${t.id}']`));
                    if (tabConfig) {
                        updateTab(tabLi, tabConfig.label, `alert${tabConfig.id}`);
                    }
                }
            }
            m.addedNodes.forEach(node => {
                if (node.nodeType !== Node.ELEMENT_NODE) return;
                const tabConfig = TABS_TO_MONITOR.find(t => node.matches?.(`[data-tab-id='${t.id}']`));
                if (tabConfig) {
                    updateTab(node, tabConfig.label, `alert${tabConfig.id}`);
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