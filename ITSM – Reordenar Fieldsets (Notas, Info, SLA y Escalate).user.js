// ==UserScript==
// @name         ITSM – Reordenar Fieldsets (Notas, Info, SLA y Escalate)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Reordena dinámicamente los fieldsets para poner "More Information" antes de "Additional Notes" y "Escalate Details" antes de "SLA report".
// @author       Julian Villanueva
// @match        https://itsm.mecalux.com/pages/UI.php?operation=*&class=Incident&id=*
// @updateURL    https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-ReorderAddNotesAndMoreInfo.user.js
// @downloadURL  https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-ReorderAddNotesAndMoreInfo.user.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    /**
     * Busca un <fieldset> cuyo <legend> contenga exactamente el texto dado
     */
    function findFieldsetByLegendText(text) {
        const legends = document.querySelectorAll('fieldset .ibo-fieldset-legend');
        for (const legend of legends) {
            if (legend.textContent.trim() === text) {
                return legend.closest('fieldset');
            }
        }
        return null;
    }

    /**
     * Reordena dos fieldsets si ambos existen y no están ya en el orden deseado.
     * @param {string} firstLegend Texto del legend que debe ir DESPUÉS
     * @param {string} secondLegend Texto del legend que debe ir ANTES
     */
    function reorderPair(firstLegend, secondLegend) {
        const first = findFieldsetByLegendText(firstLegend);
        const second = findFieldsetByLegendText(secondLegend);

        if (!first || !second) {
            console.warn(`[Reorder] No se encontraron "${firstLegend}" o "${secondLegend}"`);
            return;
        }

        const parent = first.parentElement;
        if (parent && parent.contains(first) && parent.contains(second)) {
            // Solo reordenar si aún no están en orden
            if (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_PRECEDING) {
                return; // Ya está en el orden correcto
            }
            parent.insertBefore(second, first);
        }
    }

    /**
     * Ejecuta ambos reordenamientos
     */
    function reorderAll() {
        reorderPair('Additional Notes', 'More Information');
        reorderPair('SLA report', 'Escalate Details');
    }

    // Observador que vigila cambios dinámicos en la página
    const observer = new MutationObserver(() => reorderAll());
    observer.observe(document.body, { childList: true, subtree: true });

    // Primera ejecución al cargar la página
    reorderAll();
})();