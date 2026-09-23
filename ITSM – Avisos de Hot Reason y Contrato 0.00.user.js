// ==UserScript==
// @name         ITSM – Avisos de Hot Reason y Contrato 0.00
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Muestra banners flotantes si Hot Reason es inválido/vacío y si ambos tiempos de contrato son 0.00, sin bloquear acciones.
// @author       Julian Villanueva
// @match        https://itsm.mecalux.com/pages/UI.php?stimulus=ev_resolve&class=Incident&operation=stimulus&id=*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    const ALERT_COLOR = '#FF0000';
    const BIGGER_SIZE = '1.2em';

    /** ---- CAMPOS DE CONTRATO ---- **/
    const CONTRACT_FIELDS = [
        { code: 'resolution_time_included', label: 'Contract Included Time' },
        { code: 'resolution_time_not_included', label: 'Contract Excluded Time' }
    ];
    const CONTRACT_MSG_ID = 'contract-warning-box';

    function getFieldInfo(code) {
        const container = document.querySelector(`[data-attribute-code="${code}"]`);
        const input = container?.querySelector('input');
        const labelSpan = container?.querySelector('.ibo-field--label span');
        return { container, input, labelSpan };
    }

    function styleContractLabel(labelSpan) {
        const cleanText = labelSpan.textContent.replace(/^❗\s*/, '').trim();
        labelSpan.innerHTML = `
            <span style="color: ${ALERT_COLOR}; font-weight: bold; font-size: ${BIGGER_SIZE}; text-decoration: underline">${cleanText}</span>
        `.trim();
    }

    function resetContractLabel(labelSpan) {
        const cleanText = labelSpan.textContent.replace(/^❗\s*/, '').trim();
        labelSpan.textContent = cleanText;
        labelSpan.style = '';
    }

    function createContractMessage(input) {
        const wrapper = input.closest('.ibo-field--value');
        if (!wrapper) return null;
        wrapper.style.position = 'relative';

        const msg = document.createElement('div');
        msg.id = CONTRACT_MSG_ID;
        msg.textContent = '⚠️ At least one of the contract time fields must be greater than 0.00';
        Object.assign(msg.style, {
            position: 'absolute',
            top: '-5px',
            left: '105%',
            backgroundColor: '#ffecec',
            border: `2px solid ${ALERT_COLOR}`,
            color: ALERT_COLOR,
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

    function removeContractMessage() {
        const msg = document.getElementById(CONTRACT_MSG_ID);
        if (msg) msg.remove();
    }

    function updateContractState() {
        const values = CONTRACT_FIELDS.map(f => {
            const { input, labelSpan } = getFieldInfo(f.code);
            return {
                value: input?.value?.trim(),
                labelSpan
            };
        });

        const allZero = values.every(f => f.value === '0.00');
        values.forEach(f => {
            if (!f.labelSpan) return;
            if (allZero) styleContractLabel(f.labelSpan);
            else resetContractLabel(f.labelSpan);
        });

        if (allZero) {
            const { input } = getFieldInfo(CONTRACT_FIELDS[0].code);
            if (input) createContractMessage(input);
        } else {
            removeContractMessage();
        }
    }

    function observeContractInputs() {
        CONTRACT_FIELDS.forEach(f => {
            const { input } = getFieldInfo(f.code);
            if (input && !input.dataset.contractTimeWatcher) {
                input.addEventListener('input', updateContractState);
                input.dataset.contractTimeWatcher = 'true';
            }
        });
    }

    /** ---- HOT REASON ---- **/
    const HOT_REASON_MSG_ID = 'hot-reason-warning-box';
    const VALID_PREFIXES = ['Runbook', 'Known Error', 'HORIZON'];
    const STATES = {
        empty:   { icon: '❌', color: '#FF0000' },
        valid:   { icon: '✅', color: '#008c07' },
        invalid: { icon: '⚠️', color: '#ff8800' }
    };

    function createHotReasonMessage(input) {
        const wrapper = input.closest('.ibo-field--value');
        if (!wrapper) return null;
        wrapper.style.position = 'relative';

        const msg = document.createElement('div');
        msg.id = HOT_REASON_MSG_ID;
        msg.textContent = '⚠️ Possible values: Runbook, Known Error, HORIZON';
        Object.assign(msg.style, {
            position: 'absolute',
            top: '-5px',
            left: '105%',
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
        const labelSpan = field.querySelector('.ibo-field--label span');
        const input = field.querySelector('input.ibo-input');
        if (!labelSpan || !input) return;

        const baseText = labelSpan.innerText.replace(/^(❌|✅|⚠️)\s*/, '').trim();

        const updateState = () => {
            const value = input.value.trim();
            let state = 'empty';

            if (value !== '') {
                const clean = value.replace(/^\[?/, '').toUpperCase();
                if (VALID_PREFIXES.some(p => clean.startsWith(p.toUpperCase()))) {
                    state = 'valid';
                } else {
                    state = 'invalid';
                }
            }

            const { icon, color } = STATES[state];
            labelSpan.innerHTML = `
                <span style="text-decoration: none; font-size: ${BIGGER_SIZE}">${icon}</span>
                <span style="color: ${color}; font-weight: bold; font-size: ${BIGGER_SIZE}; text-decoration: underline">${baseText}</span>
            `.trim();

            const existing = document.getElementById(HOT_REASON_MSG_ID);
            if (state === 'valid') {
                if (existing) existing.remove();
            } else {
                if (!existing) createHotReasonMessage(input);
            }
        };

        updateState();
        if (!input.dataset.listenerHotReason) {
            input.addEventListener('input', updateState);
            input.dataset.listenerHotReason = 'true';
        }
    }

    function scanHotReason(root = document.body) {
        root.querySelectorAll("[data-attribute-code='escalation_reason']").forEach(handleHotReasonField);
    }

    /** ---- INIT ---- **/
    function init() {
        observeContractInputs();
        updateContractState();
        scanHotReason();
    }

    const observer = new MutationObserver(muts => {
        muts.forEach(m => {
            m.addedNodes.forEach(node => {
                if (node.nodeType !== Node.ELEMENT_NODE) return;

                if (node.querySelector?.('input#att_8') || node.querySelector?.('input#att_9')) {
                    observeContractInputs();
                    updateContractState();
                }
                if (node.matches?.("[data-attribute-code='escalation_reason']")) {
                    handleHotReasonField(node);
                } else {
                    scanHotReason(node);
                }
            });
        });
    });

    init();
    observer.observe(document.body, { childList: true, subtree: true });
})();
