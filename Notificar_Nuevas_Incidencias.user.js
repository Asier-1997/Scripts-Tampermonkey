// ==UserScript==
// @name         Notificador de Nuevas Incidencias ITSM
// @namespace    http://tampermonkey.net/
// @author       Asier
// @version      1.0.3
// @description  Notifica si la primera incidencia de la lista tiene una Start Date muy reciente respecto a la hora actual.
// @match        https://itsm.mecalux.com/pages/UI.php*
// @updateURL    https://raw.githubusercontent.com/Asier-1997/Scripts-Tampermonkey/Notificar_Nuevas_Incidencias.user.js
// @downloadURL  https://raw.githubusercontent.com/Asier-1997/Scripts-Tampermonkey/Notificar_Nuevas_Incidencias.user.js
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';

    // 1. Verificar si estamos en la vista correcta por el título de la pestaña
    function esPaginaCorrecta() {
        return document.title.toLowerCase().includes('open incidents dispatched to one of my teams');
    }

    if (!esPaginaCorrecta()) {
        return;
    }

    console.log("🚀 Notificador iTop 1.0.3: Activado en la vista de incidencias.");

    const INTERVALO_CHECK = 30000; // 30 segundos

    // Solicitar permiso de notificaciones nativas del navegador
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }

    function lanzarNotificacion(idIncidencia, textoInfo) {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("🚨 ¡Nueva Incidencia Creada!", {
                body: `${idIncidencia}: ${textoInfo}`,
                icon: 'https://www.google.com/s2/favicons?domain=itsm.mecalux.com',
                requireInteraction: true // Mantiene la notificación en pantalla hasta que hagas clic
            });
        } else {
            alert(`🚨 ¡Nueva Incidencia Creada!\n\n${idIncidencia}: ${textoInfo}`);
        }
    }

    function comprobarStartdate() {
        // Seleccionamos la primera fila de la tabla de incidencias
        const primeraFila = document.querySelector('table tbody tr:first-child');
        if (!primeraFila) return;

        // Extraer el ID de la incidencia (columna Incident)
        const elemId = primeraFila.querySelector('td a');
        if (!elemId) return;
        const idActual = elemId.innerText.trim();

        // Extraer el texto de la columna 'Start date' (normalmente es la 3ª columna)
        // Búsqueda flexible de la celda que contiene el formato de fecha 'YYYY-MM-DD HH:MM:SS'
        const celdas = primeraFila.querySelectorAll('td');
        let fechaTexto = '';

        celdas.forEach(celda => {
            const txt = celda.innerText.trim();
            if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(txt)) {
                fechaTexto = txt;
            }
        });

        if (!fechaTexto) {
            console.log("⚠️ No se encontró la columna 'Start date' con formato de fecha en la primera fila.");
            return;
        }

        // Convertir la cadena 'YYYY-MM-DD HH:MM:SS' a un objeto Date de JS
        // Reemplazamos espacio por 'T' para asegurar compatibilidad ISO (ej: 2026-09-24T16:29:49)
        const fechaInicio = new Date(fechaTexto.replace(' ', 'T'));
        const horaActual = new Date();

        // Diferencia en segundos entre la hora actual y la fecha de la incidencia
        const diferenciaSegundos = (horaActual.getTime() - fechaInicio.getTime()) / 1000;

        console.log(`🔍 Primera incidencia: ${idActual} | Start date: ${fechaTexto} | Antigüedad: ${Math.round(diferenciaSegundos)} seg.`);

        // Comprobación: Si la Start Date es muy reciente (creada en los últimos 180 segundos / 3 minutos)
        // y NO hemos notificado ya esta misma incidencia en este navegador:
        const ultimoNotificado = localStorage.getItem('ultima_incidencia_notificada');

        if (diferenciaSegundos >= 0 && diferenciaSegundos <= 180) {
            if (ultimoNotificado !== idActual) {
                // Registrar para no repetir notificación
                localStorage.setItem('ultima_incidencia_notificada', idActual);
                
                // Obtener organización/servicio o resumen para la alerta si existe
                const servicio = celdas[7]?.innerText.trim() || 'Ver detalles en iTop';
                
                lanzarNotificacion(idActual, `Start Date: ${fechaTexto} (${servicio})`);
            }
        }
    }

    // Comprobar la primera vez tras 2 segundos de carga
    setTimeout(comprobarStartdate, 2000);

    // Bucle principal cada 30 segundos
    setInterval(() => {
        if (!esPaginaCorrecta()) return;

        console.log("⏱️ iTop Notifier: Refrescando vista...");

        // Intenta hacer clic en el botón de refresco interno o recarga la página
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