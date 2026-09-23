// ==UserScript==
// @name         ITSM – Contrato tiempo 0.00 con mensaje lateral
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Muestra ❗ si ambos campos de contrato están a 0.00. Alinea mensaje a la derecha de los campos sin bloquear la página.
// @author       Julian
// @match        https://itsm.mecalux.com/pages/UI.php?stimulus=ev_resolve&class=Incident&operation=stimulus&id=*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    const ALERT_COLOR = '#FF0000';
    const BIGGER_SIZE = '1.2em';
    const MESSAGE_ID = 'custom-contract-warning';

    const fields = [
        { code: 'resolution_time_included', label: 'Contract Included Time' },
        { code: 'resolution_time_not_included', label: 'Contract Excluded Time' }
    ];

    function getFieldInfo(code) {
        const container = document.querySelector(`[data-attribute-code="${code}"]`);
        const input = container?.querySelector('input');
        const labelSpan = container?.querySelector('.ibo-field--label span');
        return { container, input, labelSpan };
    }

    function applyStyle(labelSpan) {
        const cleanText = labelSpan.textContent.replace(/^❗\s*/, '').trim();
        labelSpan.innerHTML = `
            <span style="color: ${ALERT_COLOR}; font-weight: bold; font-size: ${BIGGER_SIZE}; text-decoration: underline">${cleanText}</span>
        `.trim();
    }

    function resetStyle(labelSpan) {
        const cleanText = labelSpan.textContent.replace(/^❗\s*/, '').trim();
        labelSpan.textContent = cleanText;
        labelSpan.style = '';
    }

    function createFloatingMessage(input) {
        const wrapper = input.closest('.ibo-field--value');
        if (!wrapper) return null;

        wrapper.style.position = 'relative'; // El contenedor se vuelve ancla del mensaje

        const msg = document.createElement('div');
        msg.id = MESSAGE_ID;
        msg.textContent = '⚠️ At least one of the contract time fields must be greater than 0.00';

        Object.assign(msg.style, {
            position: 'absolute',
    top: '-5px',                // similar posición al de Hot Reason
    left: '105%',              // a la derecha del input
    backgroundColor: '#ffecec', // fondo claro rosado (se mantiene)
    border: `2px solid ${ALERT_COLOR}`, // borde rojo
    color: ALERT_COLOR,        // texto rojo
    padding: '10px',
    borderRadius: '6px',
    fontSize: '0.9em',
    fontWeight: 'bold',
    zIndex: 9999,
    maxWidth: '450px',
    whiteSpace: 'nowrap'
        });

        wrapper.appendChild(msg);
        return msg;
    }

    function removeMessageContainer() {
        const msg = document.getElementById(MESSAGE_ID);
        if (msg) msg.remove();
    }

    function updateState() {
        const values = fields.map(f => {
            const { input, labelSpan } = getFieldInfo(f.code);
            return {
                value: input?.value?.trim(),
                labelSpan
            };
        });

        const allZero = values.every(f => f.value === '0.00');

        values.forEach(f => {
            if (!f.labelSpan) return;
            if (allZero) applyStyle(f.labelSpan);
            else resetStyle(f.labelSpan);
        });

        if (allZero) {
            const { input } = getFieldInfo(fields[0].code); // Usamos el primer campo
            if (input) createFloatingMessage(input);
        } else {
            removeMessageContainer();
        }
    }

    function observeInputs() {
        fields.forEach(f => {
            const { input } = getFieldInfo(f.code);
            if (input && !input.dataset.contractTimeWatcher) {
                input.addEventListener('input', updateState);
                input.dataset.contractTimeWatcher = 'true';
            }
        });
    }

    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            if ([...m.addedNodes].some(n =>
                n.nodeType === Node.ELEMENT_NODE &&
                (n.querySelector?.('input#att_8') || n.querySelector?.('input#att_9'))
            )) {
                observeInputs();
                updateState();
            }
        }
    });

    // Init
    observeInputs();
    updateState();

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
