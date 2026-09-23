// ==UserScript==
// @name         ITSM – Bloquear resolución si no hay tiempo
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Muestra un popup si ambos campos de contrato están a 0.00, con botones para cancelar o continuar con la resolución.
// @author       Julian Villanueva
// @match        https://itsm.mecalux.com/pages/UI.php?stimulus=ev_resolve&class=Incident&operation=stimulus&id=*
// @updateURL    https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-ChecksTimeOnResolved.user.js
// @downloadURL  https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-ChecksTimeOnResolved.user.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    const CONTRACT_FIELDS = [
        { code: 'resolution_time_included', label: 'Contract Included Time' },
        { code: 'resolution_time_not_included', label: 'Contract Excluded Time' }
    ];

    function getFieldInfo(code) {
        const container = document.querySelector(`[data-attribute-code="${code}"]`);
        const input = container?.querySelector('input');
        return { input };
    }

    function isContractTimeZero() {
        return CONTRACT_FIELDS.every(f => {
            const { input } = getFieldInfo(f.code);
            return (input?.value?.trim() || '') === '0.00';
        });
    }

    function showConfirmModal(onContinue) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.4);
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: Arial, sans-serif;
            animation: fadeInOverlay 0.2s ease-out;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: #fff;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            width: 420px;
            max-width: 90%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: scale(0.9);
            opacity: 0;
            animation: popInModal 0.2s ease-out forwards;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            background-color: #4a4a4a;
            color: #fff;
            padding: 10px;
            font-weight: bold;
            text-align: center;
            font-size: 14px;
        `;
        header.textContent = 'Contract Time Missing';

        const content = document.createElement('div');
        content.style.cssText = `
            padding: 20px;
            text-align: center;
            color: #333;
            font-size: 13px;
            line-height: 1.5;
        `;
        content.innerHTML = `
            Cannot close an incident without time introduced on the case.<br>
            Do you want to continue anyway?
        `;

        const footer = document.createElement('div');
        footer.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 15px;
            padding: 10px 0 15px;
        `;

        const btnContinue = document.createElement('button');
        btnContinue.textContent = 'Continue';
        btnContinue.style.cssText = `
            background: #fff;
            color: #28a745;
            border: 1px solid #28a745;
            border-radius: 3px;
            padding: 6px 16px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.15s ease-in-out;
        `;
        btnContinue.addEventListener('mouseenter', () => {
            btnContinue.style.background = '#28a745';
            btnContinue.style.color = '#fff';
        });
        btnContinue.addEventListener('mouseleave', () => {
            btnContinue.style.background = '#fff';
            btnContinue.style.color = '#28a745';
        });

        const btnCancel = document.createElement('button');
        btnCancel.textContent = 'Cancel';
        btnCancel.style.cssText = `
            background: #fff;
            color: #dc3545;
            border: 1px solid #dc3545;
            border-radius: 3px;
            padding: 6px 16px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.15s ease-in-out;
        `;
        btnCancel.addEventListener('mouseenter', () => {
            btnCancel.style.background = '#dc3545';
            btnCancel.style.color = '#fff';
        });
        btnCancel.addEventListener('mouseleave', () => {
            btnCancel.style.background = '#fff';
            btnCancel.style.color = '#dc3545';
        });

        btnContinue.addEventListener('click', () => {
            document.body.removeChild(overlay);
            if (onContinue) onContinue();
        });

        btnCancel.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });

        const styleTag = document.createElement('style');
        styleTag.textContent = `
            @keyframes fadeInOverlay {
                from { background-color: rgba(0,0,0,0); }
                to { background-color: rgba(0,0,0,0.4); }
            }
            @keyframes popInModal {
                from { transform: scale(0.9); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(styleTag);

        footer.appendChild(btnContinue);
        footer.appendChild(btnCancel);
        modal.appendChild(header);
        modal.appendChild(content);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    function hookMarkAsResolvedButton() {
        const resolveBtn = document.querySelector("button[title='Mark as resolved']");
        if (!resolveBtn || resolveBtn.dataset.contractWatcher) return;

        // Guardamos el listener en una variable para poder quitarlo luego
        const onResolveClick = function (e) {
            if (isContractTimeZero()) {
                e.preventDefault();
                e.stopImmediatePropagation();

                showConfirmModal(() => {
                    resolveBtn.removeEventListener('click', onResolveClick); // quitar listener antes
                    resolveBtn.click(); // continuar sin volver a disparar el popup
                });
            }
    };

    resolveBtn.addEventListener('click', onResolveClick);
    resolveBtn.dataset.contractWatcher = 'true';
    }


    function init() {
        hookMarkAsResolvedButton();
    }

    const observer = new MutationObserver(muts => {
        muts.forEach(m => {
            m.addedNodes.forEach(node => {
                if (node.querySelector?.("button[title='Mark as resolved']")) {
                    hookMarkAsResolvedButton();
                }
            });
        });
    });

    init();
    observer.observe(document.body, { childList: true, subtree: true });
})();
