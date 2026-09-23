// ==UserScript==
// @name         Notificador de Nuevas Incidencias iTop
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Lanza una notificación cuando aparece una nueva incidencia en la lista
// @match        https://itsm.mecalux.com/pages/UI.php?c%5Bmenu%5D=Incident%3AIncidentsDispatchedToMyTeams  // <-- Cambia esto por la URL de tu iTop
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use me strict';

    // Intervalo de comprobación en milisegundos (ej. 30000 = 30 segundos)
    const INTERVALO_CHECK = 30000;

    function solicitarPermisoNotificaciones() {
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }

    function comprobarNuevasIncidencias() {
        // Busca el ID de la primera incidencia de la tabla (columna 'Incident')
        const primerIncidenteElem = document.querySelector('table tbody tr:first-child td a');

        if (!primerIncidenteElem) return;

        const idActual = primerIncidenteElem.innerText.trim();
        const ultimoId = localStorage.getItem('ultimo_id_incidencia');

        if (ultimoId && idActual !== ultimoId) {
            // Se detectó una nueva incidencia
            const tituloIncidencia = document.querySelector('table tbody tr:first-child td:nth-child(9)')?.innerText || '';

            // Notificación nativa del sistema/navegador
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("🚨 ¡Nueva Incidencia Detectada!", {
                    body: `${idActual}: ${tituloIncidencia}`,
                    icon: 'https://www.google.com/s2/favicons?domain=itop'
                });
            } else {
                alert(`🚨 ¡Nueva Incidencia Detectada!\n\nID: ${idActual}`);
            }
        }

        // Guardar el último ID registrado
        localStorage.setItem('ultimo_id_incidencia', idActual);
    }

    // Solicitar permiso de notificaciones al cargar
    solicitarPermisoNotificaciones();

    // Comprobar la primera vez
    setTimeout(comprobarNuevasIncidencias, 3000);

    // Refrescar la página o la tabla cada X tiempo
    setInterval(() => {
        // Si iTop tiene botón de refresco interno en la tabla (icono de recarga arriba a la derecha):
        const btnRefresco = document.querySelector('button.fa-sync, .fa-refresh, [title*="Refresh"]');
        if (btnRefresco) {
            btnRefresco.click();
            setTimeout(comprobarNuevasIncidencias, 2000);
        } else {
            // Si no hay botón de refresco AJAX, recargamos la página completa
            comprobarNuevasIncidencias();
            location.reload();
        }
    }, INTERVALO_CHECK);

})();// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      2026-09-23
// @description  try to take over the world!
// @author       You
// @match        https://itsm.mecalux.com/pages/UI.php?c%5Bmenu%5D=Incident%3AIncidentsDispatchedToMyTeams
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mecalux.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
})();