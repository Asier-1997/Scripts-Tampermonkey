// ==UserScript==
// @name         Notificador de Nuevas Incidencias ITSM
// @namespace    http://tampermonkey.net/
// @author       Asier
// @version      1.0.6
// @description  Notifica la nueva incidencia mostrando Organización y Título.
// @match        https://itsm.mecalux.com/pages/UI.php*
// @updateURL    https://raw.githubusercontent.com/Asier-1997/Scripts-Tampermonkey/main/Notificar_Nuevas_Incidencias.user.js
// @downloadURL  https://raw.githubusercontent.com/Asier-1997/Scripts-Tampermonkey/main/Notificar_Nuevas_Incidencias.user.js
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';

    function esPaginaCorrecta() {
        return document.title.toLowerCase().includes('open incidents dispatched to one of my teams');
    }

    if (!esPaginaCorrecta()) return;

    console.log("🚀 Notificador iTop 1.0.5: Activado en la vista de incidencias.");

    const INTERVALO_CHECK = 30000;

    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }

    function lanzarNotificacion(organizacion, titulo) {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(organizacion, {
                body: titulo,
                icon: 'https://www.google.com/s2/favicons?domain=itsm.mecalux.com',
                requireInteraction: true
            });
        } else {
            alert(`🚨 ¡Nueva Incidencia!\n\n${organizacion}\n${titulo}`);
        }
    }

    function comprobarStartdate() {
        const primeraFila = document.querySelector('table tbody tr:first-child');
        if (!primeraFila) return;

        const elemId = primeraFila.querySelector('td a');
        if (!elemId) return;
        const idActual = elemId.innerText.trim();

        const celdas = primeraFila.querySelectorAll('td');
        let fechaTexto = '';

        celdas.forEach(celda => {
            const txt = celda.innerText.trim();
            if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(txt)) {
                fechaTexto = txt;
            }
        });

        if (!fechaTexto) return;

        const fechaInicio = new Date(fechaTexto.replace(' ', 'T'));
        const horaActual = new Date();
        const diferenciaSegundos = (horaActual.getTime() - fechaInicio.getTime()) / 1000;

        const ultimoNotificado = localStorage.getItem('ultima_incidencia_notificada');

        if (diferenciaSegundos >= 0 && diferenciaSegundos <= 180) {
            if (ultimoNotificado !== idActual) {
                localStorage.setItem('ultima_incidencia_notificada', idActual);
                
                // Mapeo exacto según tu tabla
                const organizacion = celdas[1]?.innerText.trim() || 'Organización no especificada';
                const titulo = celdas[9]?.innerText.trim() || 'Sin título';
                
                lanzarNotificacion(organizacion, titulo);
            }
        }
    }

    setTimeout(comprobarStartdate, 2000);

    setInterval(() => {
        if (!esPaginaCorrecta()) return;

        const btnRefresco = document.querySelector('button.fa-sync, .fa-refresh, [title*="Refresh"]');
        if (btnRefresco) {
            btnRefresco.click();
            setTimeout(comprobarStartdate, 2000);
        } else {
            comprobarStartdate();
            location.reload();
        }
    }, INTERVALO_CHECK);

})();