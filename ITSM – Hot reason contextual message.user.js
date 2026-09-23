// ==UserScript==
// @name         ITSM – Hot reason contextual message
// @namespace    http://tampermonkey.net/
// @version      0.9
// @description  Muestra un mensaje si Hot reason está vacío o tiene valor incorrecto. Incluye logs de depuración.
// @match        https://itsm.mecalux.com/pages/UI.php?stimulus=ev_resolve&class=Incident&operation=stimulus&id=*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    const BIGGER_SIZE = '1.2em';
    const VALID_PREFIXES = ['Runbook', 'Known Error', 'HORIZON'];
    const MESSAGE_ID = 'hot-reason-warning-box';

    const STATES = {
        empty:   { icon: '❌', color: '#FF0000' },
        valid:   { icon: '✅', color: '#008c07' },
        invalid: { icon: '⚠️', color: '#ff8800' }
    };

    function createFloatingMessage(input) {
        const wrapper = input.closest('.ibo-field--value');
        if (!wrapper) return null;

        wrapper.style.position = 'relative'; // El contenedor se vuelve ancla del mensaje

        const msg = document.createElement('div');
        msg.id = MESSAGE_ID;
        msg.textContent = '⚠️ Possible values: Runbook, Known Error, HORIZON';

        Object.assign(msg.style, {
            position: 'absolute',
            top: '-5px', // Ajusta esto si quieres bajarlo un poco más
            left: '105%', // justo a la derecha del input
            backgroundColor: '#c9fff7',
            border: '2px solid #09196b',
            color: '#09196b',
            padding: '10px',
            borderRadius: '6px',
            fontSize: '0.9em',
            fontWeight: 'bold',
            zIndex: 9999,
            maxWidth: '350px',
            whiteSpace: 'nowrap'
        });

        wrapper.appendChild(msg);
        return msg;
    }



    function handleHotReasonField(field) {
        console.log('[HotReason] Procesando campo:', field);
        const labelSpan = field.querySelector('.ibo-field--label span');
        const input = field.querySelector('input.ibo-input');

        if (!labelSpan || !input) {
            console.warn('[HotReason] No se encontró label o input');
            return;
        }

        const baseText = labelSpan.innerText.replace(/^(❌|✅|⚠️)\s*/, '').trim();

        const updateState = () => {
            const value = input.value.trim();
            console.log(`[HotReason] Valor actual: "${value}"`);
            let state = 'empty';

            if (value !== '') {
                const clean = value.replace(/^\[?/, '').toUpperCase();
                if (VALID_PREFIXES.some(p => clean.startsWith(p.toUpperCase()))) {
                    state = 'valid';
                } else {
                    state = 'invalid';
                }
            }

            console.log(`[HotReason] Estado detectado: ${state}`);
            const { icon, color } = STATES[state];

            labelSpan.innerHTML = `
                <span style="text-decoration: none; font-size: ${BIGGER_SIZE}">${icon}</span>
                <span style="color: ${color}; font-weight: bold; font-size: ${BIGGER_SIZE}; text-decoration: underline">${baseText}</span>
            `.trim();

            const existing = document.getElementById(MESSAGE_ID);

            if (state === 'valid') {
                if (existing) {
                    console.log('[HotReason] Eliminando mensaje flotante');
                    existing.remove();
                }
            } else {
                if (!existing) {
                    console.log('[HotReason] Mostrando mensaje flotante');
                    const msg = createFloatingMessage(input);
                }
            }
        };

        updateState();

        if (!input.dataset.listenerHotReason) {
            input.addEventListener('input', updateState);
            input.dataset.listenerHotReason = 'true';
        }
    }

    function scan(root = document.body) {
        console.log('[HotReason] Escaneando campos...');
        root.querySelectorAll("[data-attribute-code='escalation_reason']")
            .forEach(handleHotReasonField);
    }

    scan();

    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            m.addedNodes.forEach(node => {
                if (node.nodeType !== Node.ELEMENT_NODE) return;

                if (node.matches?.("[data-attribute-code='escalation_reason']")) {
                    console.log('[HotReason] Nodo añadido directo:', node);
                    handleHotReasonField(node);
                } else {
                    scan(node);
                }
            });
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
