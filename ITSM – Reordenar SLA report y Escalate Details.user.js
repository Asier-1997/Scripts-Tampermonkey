// ==UserScript==
// @name         ITSM – Reordenar SLA report y Escalate Details
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Invierte el orden de “More Information” y “Additional Notes” usando los legend como referencia
// @author       Julian
// @match        https://itsm.mecalux.com/pages/UI.php?operation=*&class=Incident&id=*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    function findFieldsetByLegendText(text) {
        const legends = document.querySelectorAll('fieldset .ibo-fieldset-legend');
        for (const legend of legends) {
            if (legend.textContent.trim() === text) {
                return legend.closest('fieldset');
            }
        }
        return null;
    }

    function reorderSections() {
        const additionalNotes = findFieldsetByLegendText('SLA report');
        const moreInformation = findFieldsetByLegendText('Escalate Details');

        if (!additionalNotes || !moreInformation) {
            console.warn('[Reorder] No se encontraron ambos fieldsets');
            return;
        }

        const parent = additionalNotes.parentElement;

        if (parent && parent.contains(additionalNotes) && parent.contains(moreInformation)) {
            if (additionalNotes.compareDocumentPosition(moreInformation) & Node.DOCUMENT_POSITION_PRECEDING) {
                console.log('[Reorder] Ya están en el orden correcto');
                return;
            }

            parent.insertBefore(moreInformation, additionalNotes);
            console.log('[Reorder] Fieldsets reordenados');
        }
    }

    // Observa y reordena si hay cambios
    const observer = new MutationObserver(() => reorderSections());
    observer.observe(document.body, { childList: true, subtree: true });

    // Llamada inicial
    reorderSections();
})();
