// ==UserScript==
// @name         Notificador de Nuevas Incidencias ITSM
// @namespace    http://tampermonkey.net/
// @author       Asier
// @version      1.0.2
// @description  Lanza una notificación emergente cuando aparece una nueva incidencia en ITSM
// @match        https://itsm.mecalux.com/pages/UI.php*
// @updateURL    https://raw.githubusercontent.com/Asier-1997/Scripts-Tampermonkey/main/Notificar_Nuevas_Incidencias.user.js
// @downloadURL  https://raw.githubusercontent.com/Asier-1997/Scripts-Tampermonkey/main/Notificar_Nuevas_Incidencias.user.js
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';

    // Función para verificar si estamos en la vista de incidencias por el título de la página
    function esPaginaCorrecta() {
        return document.title.toLowerCase().includes('open incidents dispatched to one of my teams');
    }

    // Si no estamos en esa vista exacta, detiene la ejecución del script aquí
    if (!esPaginaCorrecta()) {
        return;
    }

    console.log("🚀 Notificador iTop: Activado en la vista de incidencias del equipo.");

    // Intervalo de comprobación en milisegundos (30000 = 30 segundos)
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
                    icon: 'https://www.google.com/s2/favicons?domain=itsm.mecalux.com'
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

    // Comprobar la primera vez tras 3 segundos
    setTimeout(comprobarNuevasIncidencias, 3000);

    // Refrescar únicamente cuando sigamos en esta pantalla
    setInterval(() => {
        // Si te has movido a otra pestaña dentro de iTop (como un ticket individual), no refresca
        if (!esPaginaCorrecta()) {
            return;
        }

        console.log("⏱️ iTop Notifier: Ejecutando comprobación...");

        const btnRefresco = document.querySelector('button.fa-sync, .fa-refresh, [title*="Refresh"]');
        if (btnRefresco) {
            btnRefresco.click();
            setTimeout(comprobarNuevasIncidencias, 2000);
        } else {
            comprobarNuevasIncidencias();
            location.reload();
        }
    }, INTERVALO_CHECK);

})();