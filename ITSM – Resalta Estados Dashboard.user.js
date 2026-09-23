// ==UserScript==
// @name         ITSM – Resalta Estados Dashboard
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Resalta en verde o naranja los estados en las tablas del dashboard de ITSM Mecalux para priorización visual rápida.
// @author       David
// @match        https://itsm.mecalux.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const GREEN_STATES = ['Assigned','New', 'Attended Assigned', 'Attended escalated TTM', 'Attended escalated TTR', 'Attended Redispatched', 'Dispatched', 'Escalated TTC', 'Escalated TTM', 'Escalated TTO', 'Escalated TTR', 'Mitigated Assigned', 'Mitigated escalated TTR', 'Mitigated Redispatched', 'Redispatched'];
    const ORANGE_STATES = ['Attended Pending', 'Mitigated Pending', 'Pending'];

    const GREEN_BG = '#008c07';
    const ORANGE_BG = '#ff8133';
    const WHITE = '#ffffff';

    function highlightStatusCells() {
        document.querySelectorAll('td').forEach(td => {
            const text = td.innerText.trim();
            if (GREEN_STATES.includes(text)) {
                td.style.color = GREEN_BG;
                td.style.fontWeight = 'bold';
            } else if (ORANGE_STATES.includes(text)) {
                td.style.color = ORANGE_BG;
                td.style.fontWeight = 'bold';
            }
        });
    }

    // Run initially
    highlightStatusCells();

    // Observe DOM changes for dashboards that reload dynamically
    const observer = new MutationObserver(() => {
        highlightStatusCells();
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();