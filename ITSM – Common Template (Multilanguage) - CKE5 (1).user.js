// ==UserScript==
// @name         ITSM – Common Template (Multilanguage) - CKE5
// @namespace    http://tampermonkey.net/
// @version      4.5
// @description  Selector de plantillas. Plantilla de monitorización con autocompletado inteligente del nombre del servidor (Compatible con CKEditor 5).
// @author       Fernando González Cienfuegos
// @match        https://itsm.mecalux.com/pages/UI.php?*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(() => {
    'use strict';

    /*********************************
     * 1. CONFIGURACIÓN Y ESTILOS
     *********************************/
    const PUBLIC_WRAP_SEL = '[data-attribute-code="public_log"]';
    const LANG_KEY = 'itsm_publiclog_lang';

    /*********************************
     * CORTAFUEGOS: DETECTOR DE CAMBIOS
     *********************************/
    function isChangeTicket() {
        if (document.title.match(/(C-\d{6,})/i)) return true;

        const header = document.querySelector('.ibo-page-header--title') ||
                       document.querySelector('.ibo-panel--header-title');

        if (header && header.innerText.match(/(C-\d{6,})/i)) return true;

        return false;
    }

    /*********************************
     * 2. DICCIONARIO DE PLANTILLAS
     *********************************/
    const TPL = {
        es: {

            solicitar_conexion: `
                <p>Estimado/a <strong>[NOMBRE DEL CUSTOMER]</strong>,</p>

                <p>Nos ponemos en contacto con ustedes para solicitar el acceso remoto al <strong>servidor principal</strong> con el fin de revisar la incidencia <strong>[NÚM. DEL CASO]</strong> que nos ha comunicado [NOMBRE Y APELLIDOS DEL CALLER].</p>

                <p><strong>Detalles de la conexión:</strong></p>

                <ul>
                    <li><strong>Motivo:</strong> Revisión de la incidencia</li>
                    <li><strong>Observaciones:</strong> N/A</li>
                </ul>

                <p>Quedamos a la espera de su confirmación para acceder al servidor y revisar su caso.</p>

                <p>Gracias de antemano por su atención y colaboración.</p>

                <p>Un saludo.</p>`,

            informar_conexion_sin_confirmacion: `
                <p>Estimado/a <strong>[NOMBRE DEL CUSTOMER]</strong>,</p>

                <p>Le informamos que procederemos a conectarnos al <strong>servidor principal</strong> para llevar a cabo la revisión de la incidencia <strong>[I-XXXXXX]</strong>.</p>

                <p><strong>Detalles de la conexión:</strong></p>

                <ul>
                    <li><strong>Motivo:</strong> Revisión de la incidencia</li>
                    <li><strong>Observaciones:</strong> N/A</li>
                </ul>

                <p>Le mantendremos informado/a sobre el avance de la revisión y cualquier acción correctiva que sea necesaria. En caso de que requiera coordinar algún detalle adicional, no dude en comunicarse con nosotros.</p>

                <p>Agradecemos su colaboración y quedamos a su disposición para cualquier consulta.</p>

                <p>Un saludo.</p>`,

            alerta_monitorizacion_mantenimiento: `
                <p>Estimado cliente,</p>

                <p>Nos ponemos en contacto con usted para informarle de que nuestro sistema de monitorización ha detectado alertas preventivas que requieren tareas de mantenimiento en su instalación.</p>

                <p>Para garantizar el rendimiento óptimo del sistema y evitar cualquier posible impacto en la operativa, nuestro equipo técnico se va a conectar al servidor <strong>[NOMBRE DEL SERVIDOR]</strong> para llevar a cabo las acciones correspondientes.</p>

                <p>No es necesaria ninguna acción por su parte. En cuanto finalicemos la intervención y confirmemos que todos los indicadores han vuelto a la normalidad, procederemos a cerrar este ticket.</p>

                <p>Si tiene alguna duda o consulta adicional, quedamos a su entera disposición.</p>

                <p>Un saludo,</p>`,

            unificar_incidencias: `
                <p>Buenos días, <strong>[NOMBRE DEL CUSTOMER]</strong>:</p>

                <p>Tras revisar detalladamente su caso, hemos comprobado que la incidencia corresponde a la misma casuística que la reportada en el ticket <strong>[I-XXXXXX_PRINCIPAL]</strong>.</p>

                <p>Para poder ofrecerles un mejor seguimiento y mantener toda la información centralizada, hemos procedido a unificar ambas peticiones. Por este motivo, este ticket quedará cerrado y continuaremos gestionando la resolución directamente desde el ticket principal (<strong>[I-XXXXXX_PRINCIPAL]</strong>).</p>

                <p>Les agradecemos mucho su colaboración. En cuanto tengamos cualquier novedad, les informaremos de inmediato a través de dicho hilo para mantenerles al tanto de nuestros progresos.</p>

                <p>Reciban un cordial saludo,</p>

                <p>Mecalux Software Solution</p>`,

            nuevos_ejemplos_propuesta_1: `
                <p>Buenos días/tardes,</p>

                <p>Continuamos revisando el caso <strong>[NÚM. DEL CASO]</strong>. Hemos intentado reproducir el error sin éxito, ya que no disponemos de registros en el servidor correspondientes a esa fecha.</p>

                <p>A fin de determinar la causa raíz del problema y proceder con su corrección, necesitamos que nos proporcionen un ejemplo reciente de orden/tarea/contenedor en el que se produzca dicho error.</p>

                <p>Quedamos a la espera de esta información y le agradecemos su colaboración.</p>

                <p>Un saludo.</p>`,

            nuevos_ejemplos_propuesta_2: `
                <p>Buenos días/tardes,</p>

                <p>Nos ponemos en contacto en referencia al caso <strong>[NÚM. DEL CASO]</strong>.</p>

                <p>Hasta el momento, no hemos logrado reproducir el error debido a la ausencia de registros en el servidor correspondientes a esa fecha.</p>

                <p>Para identificar y corregir el problema de manera efectiva, le agradeceríamos que nos proporcione un ejemplo reciente del mismo. Una vez recibido, podremos avanzar con la investigación del caso.</p>

                <p>Quedamos atentos a su respuesta.</p>

                <p>Agradecemos su colaboración.</p>`,

            solicitar_info_propuesta_1: `
                <p>Buenos días/tardes,</p>

                <p>Nos ponemos en contacto en referencia al caso <strong>[NÚM. DEL CASO]</strong>.</p>

                <p>Con la información disponible hasta el momento, hemos logrado los siguientes avances: <strong>[EXPONER AVANCES]</strong>.</p>

                <p>Para poder continuar con su revisión e identificar la causa raíz de este ticket, requerimos que nos proporcionen más detalles sobre <strong>[EXPLICAR QUÉ NECESITAMOS: FECHA DE INICIO DEL PROBLEMA, OPERATIVA, ETC.]</strong>.</p>

                <p>Quedamos a la espera de noticias suyas y le agradecemos de antemano su tiempo y colaboración.</p>

                <p>Un saludo.</p>`,

            solicitar_info_propuesta_2: `
                <p>Buenos días/tardes,</p>

                <p>A fin de avanzar en la resolución del caso <strong>[NÚM. DEL CASO]</strong>, requerimos de información adicional.</p>

                <p>¿Podrían, por favor, indicarnos los pasos operativos que siguen hasta que se presenta el problema? <strong>[MENCIONAR LA INFORMACIÓN ESPECÍFICA QUE SE NECESITA]</strong>.</p>

                <p>Agradecemos de antemano su colaboración y quedamos a la espera de noticias suyas.</p>

                <p>Un saludo.</p>`,

            solicitar_info_propuesta_3: `
                <p>Buenos días,</p>

                <p>En primer lugar, rogamos disculpe nuestra insistencia respecto al caso <strong>[NÚM. DEL CASO]</strong>.</p>

                <p>Para poder continuar con la revisión de este, necesitamos que nos faciliten la información solicitada en comunicaciones anteriores.</p>

                <p>En caso de que continuemos sin tener los datos necesarios para la revisión del ticket, no tendremos más remedio que proceder con su cierre en los próximos días.</p>

                <p>Gracias de antemano por su tiempo y comprensión.</p>`,

            bajo_investigacion_general: `
                <p>Buenos días/tardes,</p>

                <p>Nos ponemos en contacto con ustedes para informarles de los avances producidos en la investigación del caso <strong>[NÚM. DEL CASO]</strong>.</p>

                <p>Hemos identificado <strong>[HALLAZGO RELEVANTE]</strong> y hemos llevado a cabo <strong>[ACCIÓN TOMADA]</strong>. Sin embargo, aún no hemos llegado a una conclusión final.</p>

                <p>Cualquier avance significativo que se produzca en este caso será comunicado a la mayor brevedad posible.</p>

                <p>Agradecemos de antemano su paciencia y colaboración.</p>

                <p>Un saludo.</p>`,

            bajo_investigacion_pequenos_avances: `
                <p>Queremos informarle que continuamos analizando su caso <strong>[NÚM. DEL CASO]</strong>. Hasta el momento, hemos logrado los siguientes avances: <strong>[AVANCES]</strong>.</p>

                <p>Cualquier novedad o avance adicional que se produzca será comunicado a la mayor brevedad posible. Asimismo, no duden en ponerse en contacto con nosotros para cualquier consulta o aclaración.</p>

                <p>Agradecemos su comprensión.</p>`,

            bajo_investigacion_cancelar_linea: `
                <p>Queremos informarle que seguimos analizando su caso <strong>[NÚM. DEL CASO]</strong>. Lamentablemente, hemos descartado la línea de investigación que estábamos siguiendo debido a <strong>[MOTIVOS]</strong>. Por este motivo, iniciaremos una nueva línea de investigación para estudiar en más profundidad <strong>[HIPÓTESIS NUEVA]</strong>.</p>

                <p>Esperamos poder comunicarles novedades y avances pronto.</p>

                <p>Muchas gracias por su compresión y colaboración.</p>`,

            bajo_investigacion_no_avances_1: `
                <p>Buenos días/tardes,</p>

                <p>Queremos informarle que seguimos analizando su caso <strong>[NÚM. DEL CASO]</strong> con detenimiento. Continúan los trabajos para encontrar una solución definitiva y se están evaluando las acciones a realizar para subsanar este caso de forma permanente.</p>

                <p>Lamentablemente, no se han producido avances significativos en la investigación pero, tenga por seguro, que estamos comprometidos a solventar esta anomalía en el sistema.</p>

                <p>Muchas gracias por su paciencia y colaboración.</p>`,

            caso_reproducido: `
                <p>Buenos días/tardes,</p>

                <p>Nos complace informarle que hemos logrado reproducir con éxito su caso <strong>[NÚM. DEL CASO]</strong> en nuestro entorno de pruebas.</p>

                <p>Durante este proceso, hemos identificado <strong>[COMPORTAMIENTO O ERROR ENCONTRADO]</strong>. A la vista de este descubrimiento, procederemos a evaluar las siguientes acciones necesarias para corregir y solventar este caso.</p>

                <p>Quedamos a su disposición para cualquier consulta adicional que pueda surgir.</p>

                <p>Reciba un cordial saludo.</p>`,

            diagnosticado: `
                <p>Buenos días/tardes,</p>

                <p>Nos ponemos en contacto con ustedes para informarles de los avances producidos en la investigación del caso <strong>[NÚM. DEL CASO]</strong>.</p>

                <p>Hemos diagnosticado la causa raíz de este ticket: <strong>[INDICAR CAUSA Y SI REQUIERE INTERVENCIÓN]</strong>.</p>

                <p>En comunicaciones posteriores, les indicaremos los pasos y acciones que hemos de realizar para solventar definitivamente este caso.</p>

                <p>Como siempre, agradecemos su paciencia y colaboración en este asunto.</p>

                <p>Reciba un cordial saludo.</p>`,

            escalado_investigacion: `
                <p>Buenos días/tardes,</p>

                <p>Nos gustaría informar de que el caso <strong>[NÚM. DEL CASO]</strong> ha sido escalado internamente a nuestro equipo de investigación para profundizar en el estudio del mismo, determinar su causa raíz y valorar las posibles vías para solventarlo de forma permanente.</p>

                <p>Cualquier avance relevante que se produzca en la investigación será comunicado a la mayor brevedad posible.</p>

                <p>Le agradecemos de antemano su paciencia y colaboración en este proceso.</p>

                <p>Reciba un cordial saludo.</p>`,

            escalado_desarrollo: `
                <p>Buenos días/tardes,</p>

                <p>Nos ponemos en contacto para informarle que se ha completado la investigación sobre la causa raíz del caso <strong>[NÚM. DEL CASO]</strong> y hemos observado <strong>[SITUACIÓN]</strong>. Por esto, hemos procedido a escalar este caso a nuestro equipo de desarrollo para preparar una corrección permanente y solventar así este ticket.</p>

                <p>Comunicaremos cualquier progreso que se produzca a la mayor brevedad posible.</p>

                <p>Le agradecemos de antemano su paciencia y colaboración en este proceso.</p>

                <p>Reciba un cordial saludo.</p>`,

            escalado_actualizaciones_no_publicada: `
                <p>Buenos días/tardes,</p>

                <p>Queremos notificarle que nos encontramos a la espera de la publicación de la última versión del software, lo cual nos impide, por el momento, establecer una fecha concreta para la actualización. Cualquier avance que se produzca respecto de dicha versión será comunicada a la mayor brevedad posible.</p>

                <p>Agradecemos su paciencia y colaboración.</p>`,

            escalado_actualizaciones_publicada: `
                <p>Buenos días/tardes,</p>

                <p>Nos ponemos en contacto con usted para informarle sobre el estado del caso <strong>[NÚM. DEL CASO]</strong>. Hemos determinado que la solución al problema requiere una actualización de <strong>[MAP/Binarios]</strong>.</p>

                <p>Actualmente estamos elaborando el documento con los detalles para la implementación del cambio en su entorno. En cuanto el documento esté listo, nos comunicaremos con usted para coordinar y planificar la intervención.</p>

                <p>Quedamos a su disposición para cualquier aclaración adicional.</p>`,

            preparando_correccion: `
                <p>Buenos días/tardes,</p>

                <p>Nos gustaría informarles de que hemos identificado una solución para el caso <strong>[NÚM. DEL CASO]</strong>. En estos momentos, nuestro equipo se encuentra trabajando en el desarrollo de dicha solución, tras haber evaluado diversas alternativas para garantizar su efectividad.</p>

                <p>Una vez que la corrección esté lista para su implementación, coordinaremos con usted la planificación de su despliegue a través del correspondiente documento RFC (Request for Change).</p>

                <p>Agradecemos su paciencia y colaboración durante este proceso.</p>`
        },

        en: {

            solicitar_conexion: `
                <p>Dear <strong>[CUSTOMER NAME]</strong>,</p>

                <p>We are contacting you to request remote access to the <strong>main server</strong> in order to review the issue <strong>[CASE NUMBER]</strong> reported by [CALLER NAME].</p>

                <p><strong>Connection details:</strong></p>

                <ul>
                    <li><strong>Reason:</strong> [BRIEF EXPLANATION OF THE REVIEW]</li>
                    <li><strong>Remarks:</strong> [IF APPLICABLE, INCLUDE ANY REQUIREMENT OR WARNING]</li>
                </ul>

                <p>We await your confirmation to access the server and review your case.</p>

                <p>Thank you in advance for your attention and cooperation.</p>

                <p>Best regards.</p>`,

            informar_conexion_sin_confirmacion: `
                <p style="margin-bottom: 16px;">Dear <strong>[CUSTOMER NAME]</strong>,</p>

                <p>We would like to inform you that we will be connecting to the <strong>main server</strong> to carry out the review of the issue <strong>[I-XXXXXX]</strong>.</p>

                <p><strong>Connection details:</strong></p>

                <ul>
                    <li><strong>Reason:</strong> Check issue</li>
                    <li><strong>Remarks:</strong> N/A</li>
                </ul>

                <p>We will keep you informed about the progress of the review and any corrective actions that may be necessary. Should you need to coordinate any additional details, please do not hesitate to contact us.</p>

                <p>We appreciate your cooperation and remain at your disposal for any queries.</p>

                <p>BR.</p>`,

            alerta_monitorizacion_mantenimiento: `
                <p>Dear customer,</p>

                <p>We are contacting you to inform you that our monitoring system has detected preventive alerts that require maintenance tasks in your facility.</p>

                <p>To ensure optimal system performance and prevent any potential impact on operations, our technical team will connect to the <strong>[SERVER NAME]</strong> server to carry out the corresponding actions (such as freeing up space or maintaining the database and its trace files).</p>

                <p>No action is required on your part. As soon as we finish the intervention and confirm that all indicators have returned to normal, we will proceed to close this ticket.</p>

                <p>If you have any questions or require further information, we remain at your disposal.</p>

                <p>Best regards,</p>`,

            unificar_incidencias: `
                <p>Good morning, <strong>[CUSTOMER NAME]</strong>,</p>

                <p>After a thorough review of this case, we have determined that the issue corresponds to the same situation reported in ticket <strong>[I-XXXXXX_PRINCIPAL]</strong>.</p>

                <p>In order to provide you with the best possible follow-up and keep all information centralized, we have merged both requests. Therefore, this current ticket will be closed, and we will continue managing the resolution entirely through the main ticket (<strong>[I-XXXXXX_PRINCIPAL]</strong>).</p>

                <p>We greatly appreciate your cooperation. As soon as we have any updates, we will notify you immediately via the main thread to keep you informed of our progress.</p>

                <p>Best regards,</p>

                <p>Mecalux Software Solution</p>`,

            nuevos_ejemplos_propuesta_1: `
                <p>Good morning/afternoon,</p>

                <p>We continue reviewing the issue <strong>[CASE NUMBER]</strong>. We have tried to reproduce the error without success, as we do not have server logs corresponding to that date.</p>

                <p>In order to determine the root cause of the problem and proceed with its correction, we need you to provide a recent example of an order/task/container where this error occurs.</p>

                <p>We await this information and thank you for your cooperation.</p>

                <p>Best regards.</p>`,

            nuevos_ejemplos_propuesta_2: `
                <p>Good morning/afternoon,</p>

                <p>We are contacting you regarding the issue <strong>[CASE NUMBER]</strong>.</p>

                <p>So far, we have not been able to reproduce the error due to the lack of server logs corresponding to that date.</p>

                <p>To identify and effectively correct the problem, we would appreciate it if you could provide a recent example of it. Once received, we will be able to move forward with the investigation of the case.</p>

                <p>We look forward to hearing from you.</p>

                <p>Thank you for your cooperation.</p>`,

            solicitar_info_propuesta_1: `
                <p>Good morning/afternoon,</p>

                <p>We are contacting you regarding the issue <strong>[CASE NUMBER]</strong>.</p>

                <p>With the information available so far, we have made the following progress: <strong>[STATE PROGRESS]</strong>.</p>

                <p>In order to continue with our review and identify the root cause of this ticket, we require you to provide more details regarding <strong>[EXPLAIN WHAT WE NEED: START DATE OF THE PROBLEM, OPERATIONS, ETC.]</strong>.</p>

                <p>We look forward to hearing from you and thank you in advance for your time and cooperation.</p>

                <p>Best regards.</p>`,

            solicitar_info_propuesta_2: `
                <p>Good morning/afternoon,</p>

                <p>In order to advance the resolution of the issue <strong>[CASE NUMBER]</strong>, we require some additional information.</p>

                <p>Could you please indicate the operational steps you follow until the problem occurs? <strong>[MENTION THE SPECIFIC INFORMATION NEEDED]</strong>.</p>

                <p>We thank you in advance for your cooperation and look forward to hearing from you.</p>

                <p>Best regards.</p>`,

            solicitar_info_propuesta_3: `
                <p>Good morning,</p>

                <p>First of all, please excuse our insistence regarding the issue <strong>[CASE NUMBER]</strong>.</p>

                <p>In order to continue with the review, we need you to provide the information requested in previous communications.</p>

                <p>If we continue without having the necessary data to review the ticket, we will have no choice but to proceed with its closure in the coming days.</p>

                <p>Thank you in advance for your time and understanding.</p>`,

            bajo_investigacion_general: `
                <p>Good morning/afternoon,</p>

                <p>We are contacting you to inform you of the progress made in the investigation of the issue <strong>[CASE NUMBER]</strong>.</p>

                <p>We have identified <strong>[RELEVANT FINDING]</strong> and we have carried out <strong>[ACTION TAKEN]</strong>. However, we have not yet reached a final conclusion.</p>

                <p>Any significant progress that occurs in this case will be communicated as soon as possible.</p>

                <p>We thank you in advance for your patience and cooperation.</p>

                <p>Best regards.</p>`,

            bajo_investigacion_pequenos_avances: `
                <p>We would like to inform you that we continue analyzing your issue <strong>[CASE NUMBER]</strong>. So far, we have achieved the following progress: <strong>[PROGRESS]</strong>.</p>

                <p>Any further news or progress will be communicated as soon as possible. Also, please do not hesitate to contact us for any query or clarification.</p>

                <p>We appreciate your understanding.</p>`,

            bajo_investigacion_cancelar_linea: `
                <p>We would like to inform you that we continue analyzing your issue <strong>[CASE NUMBER]</strong>. Unfortunately, we have discarded the line of investigation we were following due to <strong>[REASONS]</strong>. For this reason, we will start a new line of investigation to study in more depth <strong>[NEW HYPOTHESIS]</strong>.</p>

                <p>We hope to be able to communicate news and progress soon.</p>

                <p>Thank you very much for your understanding and cooperation.</p>`,

            bajo_investigacion_no_avances_1: `
                <p>Good morning/afternoon,</p>

                <p>We would like to inform you that we are still carefully analyzing your issue <strong>[CASE NUMBER]</strong>. Work continues to find a definitive solution, and we are evaluating the actions to take to permanently resolve this.</p>

                <p>Unfortunately, there has been no significant progress in the investigation, but rest assured that we are committed to solving this anomaly in the system.</p>

                <p>Thank you very much for your patience and cooperation.</p>`,

            caso_reproducido: `
                <p>Good morning/afternoon,</p>

                <p>We are pleased to inform you that we have successfully reproduced your issue <strong>[CASE NUMBER]</strong> in our test environment.</p>

                <p>During this process, we have identified <strong>[BEHAVIOR OR ERROR FOUND]</strong>. In light of this discovery, we will proceed to evaluate the next actions required to correct and resolve this case.</p>

                <p>We remain at your disposal for any further queries that may arise.</p>

                <p>Best regards.</p>`,

            diagnosticado: `
                <p>Good morning/afternoon,</p>

                <p>We are contacting you to inform you of the progress made in the investigation of the issue <strong>[CASE NUMBER]</strong>.</p>

                <p>We have diagnosed the root cause of this ticket: <strong>[INDICATE CAUSE AND WHETHER IT REQUIRES INTERVENTION]</strong>.</p>

                <p>In subsequent communications, we will indicate the steps and actions we must take to definitively resolve this case.</p>

                <p>As always, we appreciate your patience and cooperation in this matter.</p>

                <p>Best regards.</p>`,

            escalado_investigacion: `
                <p>Good morning/afternoon,</p>

                <p>We would like to inform you that the issue <strong>[CASE NUMBER]</strong> has been escalated internally to our research team to deepen its study, determine its root cause, and evaluate possible ways to resolve it permanently.</p>

                <p>Any relevant progress that occurs in the investigation will be communicated as soon as possible.</p>

                <p>We thank you in advance for your patience and cooperation in this process.</p>

                <p>Best regards.</p>`,

            escalado_desarrollo: `
                <p>Good morning/afternoon,</p>

                <p>We are contacting you to inform you that the investigation into the root cause of the issue <strong>[CASE NUMBER]</strong> has been completed and we have observed <strong>[SITUATION]</strong>. Therefore, we have proceeded to escalate this case to our development team to prepare a permanent fix and thus resolve this ticket.</p>

                <p>We will communicate any progress that occurs as soon as possible.</p>

                <p>We thank you in advance for your patience and cooperation in this process.</p>

                <p>Best regards.</p>`,

            escalado_actualizaciones_no_publicada: `
                <p>Good morning/afternoon,</p>

                <p>We would like to notify you that we are currently waiting for the release of the latest software version, which prevents us, for the moment, from establishing a specific date for the update. Any progress that occurs regarding said version will be communicated as soon as possible.</p>

                <p>We appreciate your patience and cooperation.</p>`,

            escalado_actualizaciones_publicada: `
                <p>Good morning/afternoon,</p>

                <p>We are contacting you to inform you about the status of the issue <strong>[CASE NUMBER]</strong>. We have determined that the solution to the problem requires an update of <strong>[MAP/Binaries]</strong>.</p>

                <p>We are currently preparing the document with the details for the implementation of the change in your environment. As soon as the document is ready, we will contact you to coordinate and plan the intervention.</p>

                <p>We remain at your disposal for any further clarification.</p>`,

            preparando_correccion: `
                <p>Good morning/afternoon,</p>

                <p>We would like to inform you that we have identified a solution for the issue <strong>[CASE NUMBER]</strong>. Currently, our team is working on the development of this solution, having evaluated various alternatives to ensure its effectiveness.</p>

                <p>Once the fix is ready for implementation, we will coordinate the planning of its deployment with you through the corresponding RFC (Request for Change) document.</p>

                <p>We appreciate your patience and cooperation during this process.</p>`
        }
    };

    /*********************************
     * 3. LÓGICA CORE
     *********************************/
    function getLang() {
        const saved = localStorage.getItem(LANG_KEY);
        return (saved === 'en' || saved === 'es') ? saved : 'es';
    }

    function setLang(lang) {
        localStorage.setItem(LANG_KEY, lang);
    }

    // Busca la instancia activa del editor en CKEditor 5
    function getActiveEditor() {
        const activeEditable = document.querySelector('.ck-editor__editable');
        return activeEditable ? activeEditable.ckeditorInstance : null;
    }

    function isEditorEmpty(ed) {
        if (!ed) return true;

        const t = (ed.getData() || '')
            .replace(/<p>\s*&nbsp;\s*<\/p>/gi, '')
            .replace(/&nbsp;/gi, ' ')
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        return t.length === 0;
    }

    /*********************************
     * 4. MOTOR DE EXTRACCIÓN
     *********************************/
    function extractTicketData() {

        let ticketNum = "[NÚM. DEL CASO]";
        let callerName = "[NOMBRE DEL CUSTOMER]";
        let serverName = "[NOMBRE DEL SERVIDOR]";

        // 1. Extraer Número de Caso
        const fcHeaderMatch = document.body.innerText.match(/First Contact\s*-\s*(I-\d{6,})/i);
        const titleMatch = document.title.match(/(I-\d{6,})/);

        const header = document.querySelector('.ibo-page-header--title') ||
                       document.querySelector('.ibo-panel--header-title');

        if (fcHeaderMatch) {
            ticketNum = fcHeaderMatch[1];
        } else if (titleMatch) {
            ticketNum = titleMatch[1];
        } else if (header && header.innerText.match(/(I-\d{6,})/)) {
            ticketNum = header.innerText.match(/(I-\d{6,})/)[1];
        }

        // 2. Extraer Caller
        let callerLinks = document.querySelectorAll(
            '[data-attribute-code="caller_id"] a, [data-attribute-code="contact_id"] a'
        );

        let foundCaller = false;

        for (let link of callerLinks) {

            let txt = link.innerText.trim();

            if (txt) {
                callerName = txt;
                foundCaller = true;
                break;
            }
        }

        if (!foundCaller) {

            let fallbackContainer =
                document.querySelector('[data-attribute-code="caller_id"] .ibo-field--value') ||
                document.querySelector('[data-attribute-code="caller_id"] .ibo-value');

            if (fallbackContainer) {

                let rawText = fallbackContainer.innerText.trim();

                if (rawText) {
                    callerName = rawText;
                    foundCaller = true;
                }
            }
        }

        // 3. Extraer Servidor
        const serverMatch = document.body.innerText.match(
            /(?:alert on the CI|alerta en el CI)\s+'([^']+)'/i
        );

        let foundServer = false;

        if (serverMatch && serverMatch[1]) {
            serverName = serverMatch[1];
            foundServer = true;
        }

        // 4. Memoria
        let savedTicket = localStorage.getItem('itsm_memory_ticket');

        if (foundCaller && ticketNum !== "[NÚM. DEL CASO]") {

            localStorage.setItem('itsm_memory_ticket', ticketNum);
            localStorage.setItem('itsm_memory_caller', callerName);

            if (foundServer) {
                localStorage.setItem('itsm_memory_server', serverName);
            } else {
                localStorage.removeItem('itsm_memory_server');
            }

        } else {

            let savedCaller = localStorage.getItem('itsm_memory_caller');
            let savedServer = localStorage.getItem('itsm_memory_server');

            if (savedTicket === ticketNum) {

                if (savedCaller) callerName = savedCaller;
                if (savedServer) serverName = savedServer;
            }
        }

        return {
            ticketNum,
            callerName,
            serverName
        };
    }

    /*********************************
     * 5. INYECCIÓN INTELIGENTE
     *********************************/
    function injectUI() {

        if (isChangeTicket()) return;

        let container = document.querySelector('.itsm-adv-public-templates');

        const isPublicLog = !!document.querySelector(PUBLIC_WRAP_SEL);

        const isFirstContact =
            !!document.querySelector('.itsm-firstcontact-controls') ||
            !!document.querySelector('[data-attribute-code="first_contact_reason"]');

        let targetHost = null;
        let insertMode = '';

        if (isPublicLog) {

            const publicActions =
                document.querySelector(
                    `${PUBLIC_WRAP_SEL} .ibo-caselog-entry-form--action-buttons--main-actions`
                ) ||
                document.querySelector(
                    `${PUBLIC_WRAP_SEL} .ibo-caselog-entry-form--action-buttons--extra-actions`
                );

            if (publicActions) {
                targetHost = publicActions;
                insertMode = 'public_right';
            }

        } else if (isFirstContact) {

            const tlFlexContainer =
                document.querySelector(
                    '.itsm-firstcontact-controls .itsm-publiclog-controls'
                ) ||
                document.querySelector('.itsm-firstcontact-controls');

            if (tlFlexContainer) {
                targetHost = tlFlexContainer;
                insertMode = 'fc_next_to_btn';
            }
        }

        if (!targetHost) {

            const editorEl = document.querySelector('.ck-editor__editable');

            if (editorEl) {
                targetHost = editorEl.parentNode;
                insertMode = 'fallback';
            } else {
                return;
            }
        }

        if (container) {

            if (container.parentNode !== targetHost) {
                targetHost.appendChild(container);
            }

            return;
        }

        container = document.createElement('div');
        container.className = 'itsm-adv-public-templates';

        /*********************************
         * SELECTOR DE IDIOMA
         *********************************/
        const langSelect = document.createElement('select');

        langSelect.style.cssText =
            'padding: 4px; font-size: 12px; border: 1px solid #94a3b8; ' +
            'border-radius: 4px; background-color: #f8fafc; cursor: pointer; ' +
            'font-weight: bold; height: 28px; flex-shrink: 0;';

        langSelect.innerHTML = `
            <option value="es">ES</option>
            <option value="en">EN</option>
        `;

        langSelect.value = getLang();

        langSelect.addEventListener('change', () => {
            setLang(langSelect.value);
        });

        /*********************************
         * LABEL
         *********************************/
        const label = document.createElement('span');

        label.innerText = 'Common Template:';

        label.style.cssText =
            'font-size: 13px; font-weight: bold; color: #0284c7; ' +
            'white-space: nowrap;';

        /*********************************
         * SELECTOR DE PLANTILLA
         *********************************/
        const select = document.createElement('select');

        select.style.cssText =
            'padding: 4px; font-size: 13px; border: 1px solid #bae6fd; ' +
            'border-radius: 4px; background-color: #f0f9ff; color: #0c4a6e; ' +
            'outline: none; cursor: pointer; max-width: 170px; height: 28px; ' +
            'text-overflow: ellipsis; white-space: nowrap;';

        select.innerHTML = `
            <option value="empty">-- Seleccionar --</option>

            <optgroup label="Solicitar Conexión">
                <option value="solicitar_conexion">Pedir Confirmación</option>
                <option value="informar_conexion_sin_confirmacion">Solo Informar (N/A)</option>
            </optgroup>

            <optgroup label="Monitorización">
                <option value="alerta_monitorizacion_mantenimiento">Alerta Preventiva (Mantenimiento)</option>
            </optgroup>

            <optgroup label="Cierre / Unificación">
                <option value="unificar_incidencias">Unificación por Duplicado</option>
            </optgroup>

            <optgroup label="Nuevos Ejemplos">
                <option value="nuevos_ejemplos_propuesta_1">Propuesta 1 (Pedir ejemplo)</option>
                <option value="nuevos_ejemplos_propuesta_2">Propuesta 2 (Pedir ejemplo alt)</option>
            </optgroup>

            <optgroup label="Solicitar Información">
                <option value="solicitar_info_propuesta_1">Propuesta 1 (Con avances)</option>
                <option value="solicitar_info_propuesta_2">Propuesta 2 (Pasos operativos)</option>
                <option value="solicitar_info_propuesta_3">Propuesta 3 (Ultimátum de cierre)</option>
            </optgroup>

            <optgroup label="Bajo Investigación">
                <option value="bajo_investigacion_general">General</option>
                <option value="bajo_investigacion_pequenos_avances">Pequeños Avances</option>
                <option value="bajo_investigacion_cancelar_linea">Cancelar Línea actual</option>
                <option value="bajo_investigacion_no_avances_1">Sin Avances</option>
            </optgroup>

            <optgroup label="Estado del Caso">
                <option value="caso_reproducido">✅ Caso Reproducido</option>
                <option value="diagnosticado">🎯 Diagnosticado</option>
            </optgroup>

            <optgroup label="Escalados">
                <option value="escalado_investigacion">↗️ A Investigación</option>
                <option value="escalado_desarrollo">💻 A Desarrollo</option>
                <option value="escalado_actualizaciones_no_publicada">📦 Actualización (No publicada)</option>
                <option value="escalado_actualizaciones_publicada">📦 Actualización (Publicada)</option>
                <option value="preparando_correccion">🛠️ Preparando Corrección</option>
            </optgroup>
        `;

        /*********************************
         * INSERCIÓN DE PLANTILLA
         *********************************/
        select.addEventListener('change', () => {

            const val = select.value;

            if (val === 'empty') return;

            const ed = getActiveEditor();

            if (!ed) {
                select.value = 'empty';
                return;
            }

            if (!isEditorEmpty(ed)) {

                if (!confirm(
                    "El editor ya contiene texto. ¿Deseas reemplazarlo con la plantilla seleccionada?"
                )) {
                    select.value = 'empty';
                    return;
                }
            }

            const currentLang = langSelect.value;

            if (TPL[currentLang] && TPL[currentLang][val]) {

                let finalHtml = TPL[currentLang][val];

                const ticketData = extractTicketData();

                // Reemplazos habituales
                finalHtml = finalHtml.replace(
                    /\[NOMBRE DEL CUSTOMER\]/gi,
                    ticketData.callerName
                );

                finalHtml = finalHtml.replace(
                    /\[CUSTOMER NAME\]/gi,
                    ticketData.callerName
                );

                finalHtml = finalHtml.replace(
                    /\[NOMBRE Y APELLIDOS DEL CALLER\]/gi,
                    ticketData.callerName
                );

                finalHtml = finalHtml.replace(
                    /\[CALLER NAME\]/gi,
                    ticketData.callerName
                );

                finalHtml = finalHtml.replace(
                    /\[NÚM\. DEL CASO\]/gi,
                    ticketData.ticketNum
                );

                finalHtml = finalHtml.replace(
                    /\[CASE NUMBER\]/gi,
                    ticketData.ticketNum
                );

                finalHtml = finalHtml.replace(
                    /\[I-XXXXXX\]/gi,
                    ticketData.ticketNum
                );

                // Reemplazo especial para Servidor
                finalHtml = finalHtml.replace(
                    /\[NOMBRE DEL SERVIDOR\]/gi,
                    ticketData.serverName
                );

                finalHtml = finalHtml.replace(
                    /\[SERVER NAME\]/gi,
                    ticketData.serverName
                );

                // Insertar directamente en CKEditor.
                // No se aplica ningún contenedor ni estilo adicional.
                ed.setData(finalHtml);
            }

            setTimeout(() => {
                select.value = 'empty';
            }, 300);
        });

        container.appendChild(label);
        container.appendChild(langSelect);
        container.appendChild(select);

        /*********************************
         * ESTILO DEL SELECTOR
         *
         * Esto afecta SOLO al selector de
         * plantillas, no al texto insertado.
         *********************************/
        if (insertMode === 'public_right') {

            container.style.cssText =
                'display: inline-flex; align-items: center; margin-right: 10px; ' +
                'padding-right: 10px; border-right: 2px solid #ccc; gap: 6px; ' +
                'flex-shrink: 1;';

            targetHost.insertBefore(container, targetHost.firstChild);

        } else if (insertMode === 'fc_next_to_btn') {

            container.style.cssText =
                'display: inline-flex; align-items: center; margin-left: 15px; ' +
                'padding-left: 15px; border-left: 2px solid #ccc; gap: 8px;';

            targetHost.appendChild(container);

        } else {

            container.style.cssText =
                'display: flex; align-items: center; gap: 8px; ' +
                'margin-bottom: 8px; padding: 6px; ' +
                'background-color: #f0f9ff; border: 1px solid #bae6fd; ' +
                'border-radius: 4px;';

            targetHost.insertBefore(container, targetHost.firstChild);
        }
    }

    /*********************************
     * 6. MOTOR DE OBSERVACIÓN
     *********************************/
    function bindEditors() {
        injectUI();
    }

    const obs = new MutationObserver(() => {

        if (isChangeTicket()) return;

        bindEditors();
    });

    function boot() {

        if (isChangeTicket()) return;

        obs.observe(document.body, {
            childList: true,
            subtree: true
        });

        bindEditors();

        setTimeout(extractTicketData, 1500);
    }

    if (document.readyState === 'loading') {

        window.addEventListener('DOMContentLoaded', boot);

    } else {

        boot();
    }

})();