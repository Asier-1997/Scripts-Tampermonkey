// ==UserScript==
// @name         ITSM – Resalta estados en MAIN View
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Colorea en negrita los estados detectados por clase ibo-dm-enum--Incident-status* según su valor textual
// @author       Julian Villanueva
// @match        https://itsm.mecalux.com/*
// @exclude      https://itsm.mecalux.com/pages/UI.php?*&class=Incident*
// @updateURL    https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-EnhanceStatusOnDashboard.user.js
// @downloadURL  https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-EnhanceStatusOnDashboard.user.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
    /* --------------------------------------------------
       LISTAS DE ESTADOS
    -------------------------------------------------- */
    const ADVANCE_STATES = [
        'New', 'Assigned', 'Dispatched', 'Attended Assigned', 'Attended escalated TTR', 'Attended escalated TTM','Mitigated Assigned', 'Attended Redispatched', 'Mitigated Redispatched',
        'Escalated TTC', 'Escalated TTM', 'Escalated TTO', 'Escalated TTR','Redispatched'
    ];

    const PENDING_STATES = [
        'Pending', 'Attended Pending', 'Mitigated Pending'
    ];

    /* --------------------------------------------------
       ESTILOS POR ESTADO
    -------------------------------------------------- */
    const STYLES = {
        advance  : { bg: '#28a745', txt: '#fff'}, // verde
        pending  : { bg: '#fd7e14', txt: '#fff'}, // naranja
        resolved : { bg: '#e9ecef', txt: '#0066ba'}, // gris + verde
        closed   : { bg: '#e9ecef', txt: '#000'}, // gris + negro
        rejected : { bg: '#e9ecef', txt: '#b83280'} // gris + morado claro
    };

    /* --------------------------------------------------
       APLICA ESTILO SEGÚN ESTADO
    -------------------------------------------------- */
    function colorBadge(badge) {
        const label = badge.querySelector('.ibo-field-badge--label') || badge;
        const txt   = label.textContent.trim();

        let style;
        if      (ADVANCE_STATES.includes(txt)) style = STYLES.advance;
        else if (PENDING_STATES.includes(txt)) style = STYLES.pending;
        else if (txt === 'Resolved')            style = STYLES.resolved;
        else if (txt === 'Closed')              style = STYLES.closed;
        else if (txt === 'Rejected')            style = STYLES.rejected;
        else                                    return;

        label.style.cssText = `
            background:${style.bg};
            color:${style.txt};
            padding:2px 6px;
            border-radius:4px;
            font-weight:bold;
        `;
    }

    /* --------------------------------------------------
       RECORRIDO PRINCIPAL
    -------------------------------------------------- */
    function applyStatusStyling(root = document.body) {
        root.querySelectorAll(
            '[class*="ibo-dm-enum--Incident-status"]:not([data-colored])'
        ).forEach(el => {
            colorBadge(el);
            el.dataset.colored = '1';
        });
    }

    /* --------------------------------------------------
       INICIAL + OBSERVADOR
    -------------------------------------------------- */
    applyStatusStyling();

    new MutationObserver(muts => muts.forEach(m =>
        m.addedNodes.forEach(n => (n.nodeType === 1) && applyStatusStyling(n))
    )).observe(document.body, { childList:true, subtree:true });
})();