// ==UserScript==
// @name         ITSM – Private Log Enhancements
// @namespace    http://tampermonkey.net/
// @version      3.3
// @description  Private Log Enhancements developed for Remote Support with Custom Asynchronous UI Modals & CKEditor 5 Support. Private Log template is only inserted when the user actually starts editing.
// @match        https://itsm.mecalux.com/pages/UI.php?operation=details&class=Incident&id=*
// @updateURL    https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-PrivateLogEnhancements.user.js
// @downloadURL  https://gist.githubusercontent.com/julii-vg18/1cf0f6db81af4d5a04457a9714701509/raw/ITSM-PrivateLogEnhancements.user.js
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    /******************************
    * Module: log
    ******************************/
    const log = {
        L: (...a) => console.log('[ITSM-LOG]', ...a),
        W: (...a) => console.warn('[ITSM-LOG]', ...a),
        E: (...a) => console.error('[ITSM-LOG]', ...a),
    };

    /******************************
    * Module: cfg
    ******************************/
    const SELECT_KEY = 'itsm_privatelog_template';

    const TEMPLATES = {
        update: `
        <table border="1" cellpadding="2" cellspacing="0" style="width:100%">
        <tbody>
            <tr><td style="background-color:#bd42ff; text-align:center"><strong>UPDATE</strong></td></tr>
            <tr><td style="background-color:#d898fa"><strong>UPDATE TYPE</strong><span style="color:#d898fa">[TAG:UPDTYPE]</span></td></tr>
            <tr><td>UPDATE BINARIOS/MAP &rarr; [Versi&oacute;n]</td></tr>
            <tr><td style="background-color:#d898fa"><strong>ADDITIONAL CHANGES</strong><span style="color:#d898fa">[TAG:UPDADDCHANGES]</span></td></tr>
            <tr><td>[Cambios adicionales a implementar junto a la actualizaci&oacute;n (<em>p.e. Activar un toggle, modificar un .config</em>,<em> etc...)</em>]</td></tr>
            <tr><td style="background-color:#d898fa"><strong>RESOURCES</strong><span style="color:#d898fa">&nbsp;[TAG:UPDRESOURCES]</span></td></tr>
            <tr><td><p>Ruta sFTP donde se encuentre lo siguiente o link a otra incidencia donde est&eacute;:</p>
            <ul><li>IIS Backup</li><li>BD DUMP</li><li>Responses.xml</li></ul>
                </td></tr>
            <tr><td style="background-color:#d898fa"><strong>DATA</strong><span style="color:#d898fa">&nbsp;[TAG:UPDDATA]</span></td></tr>
            <tr><td><p>- <strong>Versi&oacute;n de Binarios/MAP actuales</strong>:&nbsp;</p>
                <p>- &iquest;<strong>Tiene MongoDB</strong>?**: SI / NO</p>
                <p>- &iquest;<strong>Tiene Toggles</strong>?: SI / NO</p>
                <p>- &iquest;<strong>Tiene M&eacute;tricas o Datawarehouse</strong>?: SI (¿Cual? Metricas/Datawarehouse) / NO</p>
                <p>- <strong>RFs</strong>: Android / WindowsCE</p>
                <p>&nbsp; &nbsp; - <u>S.O Versi&oacute;n</u>:&nbsp;</p>
                <p>&nbsp; &nbsp; - <u>Navegador / APK Versi&oacute;n</u>:&nbsp;</p>
                <p>- &iquest;<strong>Tiene Entornos de PRE o TEST</strong>?: SI / NO</p>
                <p>- <strong>Licencia</strong>: USER / SITE</p>
            </td></tr>
            <tr><td style="background-color:#d898fa"><strong>TESTS </strong><span style="color:#d898fa">[TAG:UPDTESTS]</span></td></tr>
            <tr><td>[Indica el detalle de que problema se solucionar&aacute; tras la actualizaci&oacute;n y como probarlo]</td></tr>
        </tbody>
        </table>
    `,

        transfer: `
        <table border="1" cellpadding="2" cellspacing="0" style="width:100%">
        <tbody>
            <tr><td data-darkreader-inline-bgcolor="" style="--darkreader-inline-bgcolor:var(--darkreader-background-ffa366, #8f3900); background-color:#ffa366; text-align:center"><strong>TRANSFER</strong></td></tr>
            <tr><td data-darkreader-inline-bgcolor="" style="--darkreader-inline-bgcolor:var(--darkreader-background-ffc299, #702d00); background-color:#ffc299"><strong>INITIAL / CURRENT SITUATION</strong><span data-darkreader-inline-color="" style="--darkreader-inline-color:var(--darkreader-text-ffc299, #ffb685); color:#ffc299"> [TAG:TRANINITSITU]</span></td></tr>
            <tr><td>[Describe the starting situation of the ticket or the current status of it]</td></tr>
            <tr><td data-darkreader-inline-bgcolor="" style="--darkreader-inline-bgcolor:var(--darkreader-background-ffc299, #702d00); background-color:#ffc299"><strong>INVESTIGATION</strong><span data-darkreader-inline-color="" style="--darkreader-inline-color:var(--darkreader-text-ffc299, #ffb685); color:#ffc299"> [TAG:TRAINVEST]</span></td></tr>
            <tr><td>[Investigation details here]</td></tr>
            <tr><td data-darkreader-inline-bgcolor="" style="--darkreader-inline-bgcolor:var(--darkreader-background-ffc299, #702d00); background-color:#ffc299"><strong>ACTIONS TAKEN</strong><span data-darkreader-inline-color="" style="--darkreader-inline-color:var(--darkreader-text-ffc299, #ffb685); color:#ffc299"> [TAG:TRAACTAKEN]</span></td></tr>
            <tr><td>[Actions taken here]</td></tr>
            <tr><td data-darkreader-inline-bgcolor="" style="--darkreader-inline-bgcolor:var(--darkreader-background-ffc299, #702d00); background-color:#ffc299"><strong>PENDING</strong><span data-darkreader-inline-color="" style="--darkreader-inline-color:var(--darkreader-text-ffc299, #ffb685); color:#ffc299"> [TAG:TRAPENDING]</span></td></tr>
            <tr><td>[Pending points here]</td></tr>
            <tr><td data-darkreader-inline-bgcolor="" style="--darkreader-inline-bgcolor:var(--darkreader-background-ffc299, #702d00); background-color:#ffc299"><strong>TESTS </strong><span data-darkreader-inline-color="" style="--darkreader-inline-color:var(--darkreader-text-ffc299, #ffb685); color:#ffc299">[TAG:TRATESTS]</span></td></tr>
            <tr><td>[Indicate step by step how to reproduce the problem if known (Step 1 &rarr; Step 2 &rarr; Step 3 &rarr; ...)]</td></tr>
            <tr><td data-darkreader-inline-bgcolor="" style="--darkreader-inline-bgcolor:var(--darkreader-background-ffc299, #702d00); background-color:#ffc299"><strong>LOGS</strong><span data-darkreader-inline-color="" style="--darkreader-inline-color:var(--darkreader-text-ffc299, #ffb685); color:#ffc299"> [TAG:TRALOGS]</span></td></tr>
            <tr><td><p>[Add log file paths here]</p><ul><li>&nbsp;</li><li>&nbsp;</li><li>&nbsp;</li></ul></td></tr>
            <tr><td data-darkreader-inline-bgcolor="" style="--darkreader-inline-bgcolor:var(--darkreader-background-ffc299, #702d00); background-color:#ffc299"><strong>TEST ENVIRONMENT</strong><span data-darkreader-inline-color="" style="--darkreader-inline-color:var(--darkreader-text-ffc299, #ffb685); color:#ffc299"> [TAG:TRATESTENV]</span></td></tr>
            <tr><td>[Indicate details regarding the existence of a test environment]</td></tr>
        </tbody>
        </table>
    `,

        wip: `
        <table border="1" cellpadding="2" cellspacing="0" style="width:100%">
        <tbody>
            <tr><td style="background-color:#b3b3b3; text-align:center"><strong>WORK IN PROGRESS</strong></td></tr>
            <tr><td style="background-color:#dddddd; position:relative;"><strong> INITIAL / CURRENT SITUATION</strong><span style="color:#dddddd;"> [TAG:WIPINITSITU]</span></td></tr>
            <tr><td>[Describe the starting situation of the ticket or the current status of it]</td></tr>
            <tr><td style="background-color:#dddddd; position:relative;"><strong> INVESTIGATION</strong><span style="color:#dddddd;"> [TAG:WIPINVEST]</span></td></tr>
            <tr><td>[Investigation details here]</td></tr>
            <tr><td style="background-color:#dddddd; position:relative;"><strong> LOGS</strong><span style="color:#dddddd;"> [TAG:WIPCONCLU]</span></td></tr>
            <tr><td><p>[Add log file paths here]</p><ul><li>&nbsp;</li><li>&nbsp;</li><li>&nbsp;</li></ul></td></tr>
            <tr><td style="background-color:#dddddd; position:relative;"><strong> ACTIONS TAKEN</strong><span style="color:#dddddd;"> [TAG:WIPACTAKEN]</span></td></tr>
            <tr><td>[Actions taken here]</td></tr>
            <tr><td style="background-color:#dddddd; position:relative;"><strong> CONCLUSION</strong><span style="color:#dddddd;"> [TAG:WIPCONCLU]</span></td></tr>
            <tr><td>[Conclusions here]</td></tr>
            <tr><td style="background-color:#dddddd; position:relative;"><strong> PENDING</strong><span style="color:#dddddd;"> [TAG:WIPPENDING]</span></td></tr>
            <tr><td>[Pending points here]</td></tr>
        </tbody>
        </table>
    `,

        solution: `
        <table border="1" cellpadding="2" cellspacing="0" style="width:100%">
        <tbody>
            <tr>
                <td data-darkreader-inline-bgcolor="" style="--darkreader-inline-bgcolor:var(--darkreader-background-46d267, #259856); background-color:#46d267; text-align:center"><strong>SOLUTION OF THE TICKET</strong></td>
            </tr>
            <tr>
                <td data-darkreader-inline-bgcolor="" style="--darkreader-inline-bgcolor:var(--darkreader-background-adebbb, #165a33); background-color:#adebbb"><strong>INITIAL SITUATION</strong><span data-darkreader-inline-color="" style="--darkreader-inline-color:var(--darkreader-text-adebbb, #9de7ad); color:#adebbb"> [TAG:SOLINITSITU]</span></td>
            </tr>
            <tr>
                <td>[Describe, upon all preliminary investigations, what was the problem reported by the customer]</td>
            </tr>
            <tr>
                <td data-darkreader-inline-bgcolor="" style="--darkreader-inline-bgcolor:var(--darkreader-background-adebbb, #165a33); background-color:#adebbb"><strong>KEY DIAGNOSIS</strong><span data-darkreader-inline-color="" style="--darkreader-inline-color:var(--darkreader-text-adebbb, #9de7ad); color:#adebbb"> [TAG:SOLDIAG]</span></td>
            </tr>
            <tr>
                <td>[Detail the <strong>key diagnosis</strong> step which lead to applying the following solution]</td>
            </tr>
            <tr>
                <td data-darkreader-inline-bgcolor="" style="--darkreader-inline-bgcolor:var(--darkreader-background-adebbb, #165a33); background-color:#adebbb"><strong>SOLUTION</strong><span data-darkreader-inline-color="" style="--darkreader-inline-color:var(--darkreader-text-adebbb, #9de7ad); color:#adebbb"> [TAG:SOLSOLUTION]</span></td>
            </tr>
            <tr>
                <td>[Detail exactly which actions were taken in order to fix the <strong>Initial Situation</strong>]</td>
            </tr>
            <tr>
                <td data-darkreader-inline-bgcolor="" style="--darkreader-inline-bgcolor:var(--darkreader-background-adebbb, #165a33); background-color:#adebbb"><strong>VALIDATION CHECKLIST</strong><span data-darkreader-inline-color="" style="--darkreader-inline-color:var(--darkreader-text-adebbb, #9de7ad); color:#adebbb"> [TAG:SOLCHECKLIST]</span></td>
            </tr>
            <tr>
                <td>
                    <p>[Detail what checks validated that the <strong>Solution </strong>applied fixed the <strong>Initial Situation</strong>]</p>
                    <ul>
                        <li>1st Validation</li>
                        <li>2nd Validation</li>
                        <li>3rd Validation</li>
                    </ul>
                </td>
            </tr>
        </tbody>
        </table>
    `,

        empty: `<p></p>`
    };

    const ALL_HEADERS = [
        "INITIAL / CURRENT SITUATION",
        "INVESTIGATION",
        "ACTIONS TAKEN",
        "CONCLUSION",
        "PENDING",
        "TRANSFER",
        "INITIAL SITUATION",
        "SOLUTION",
        "LOGS",
        "TEST ENVIRONMENT",
        "UPDATE TYPE",
        "ADDITIONAL CHANGES",
        "RESOURCES",
        "DATA",
        "TESTS"
    ];

    const COLLAPSIBLE_HEADERS = [
        "INVESTIGATION",
        "ACTIONS TAKEN",
        "LOGS",
        "TEST ENVIRONMENT",
        "RESOURCES",
        "DATA",
        "TESTS"
    ];

    const COLLAPSIBLE_TAGS = new Set([
        "WIPINVEST",
        "TRAINVEST",
        "WIPACTAKEN",
        "TRAACTAKEN",
        "TRALOGS",
        "TRATESTENV",
        "UPDRESOURCES",
        "UPDDATA",
        "UPDTESTS"
    ]);

    const TAG_REGEX = /\[TAG:([A-Z0-9_:-]+)\]/i;

    const PLACEHOLDER_TEXTS = [
        "[PENDING POINTS HERE]",
        "[INVESTIGATION DETAILS HERE]",
        "[ACTIONS TAKEN HERE]",
        "[DESCRIBE THE STARTING SITUATION OF THE TICKET OR THE CURRENT STATUS OF IT]",
        "[INITIAL TICKET SITUATION DETAILS HERE]",
        "[SOLUTION DETAILS HERE]",
        "[ADD LOG FILE PATHS HERE]",
        "[INDICATE DETAILS REGARDING THE EXISTENCE OF A TEST ENVIRONMENT]",
        "[CONCLUSIONS HERE]",
        "N\\A",
        "N/A",
        "[VERSIÓN]",
        "[CAMBIOS ADICIONALES A IMPLEMENTAR JUNTO A LA ACTUALIZACIÓN",
        "[INDICA EL DETALLE DE QUE PROBLEMA SE SOLUCIONARÁ TRAS LA ACTUALIZACIÓN",
        "[INDICATE STEP BY STEP HOW TO REPRODUCE THE PROBLEM IF KNOWN"
    ];

    const SEND_BTN_SEL =
        'button.ibo-button.ibo-block.ibo-is-regular.ibo-is-primary:is([data-role="ibo-button"],[role="ibo-button"])[name="save"]';

    const CANCEL_BTN_SEL =
        'button.ibo-button:is([data-role="ibo-button"],[role="ibo-button"])[name="cancel"], button[title="Cancel"], button[aria-label="Cancel"]';

    /******************************
    * Module: util
    ******************************/
    const util = {
        norm: s =>
            (s || '')
                .replace(/\s+/g, ' ')
                .trim()
                .toUpperCase(),

        cleanHtml: html =>
            (html || '')
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, '')
                .replace(/\s+/g, ' ')
                .trim(),

        debounce: (fn, wait = 120) => {
            let t;
            return (...a) => {
                clearTimeout(t);
                t = setTimeout(() => fn(...a), wait);
            };
        },

        isVisibleEl: el =>
            !!(el && el.offsetParent),

        isPrivateInstance: el =>
            !!el?.closest('[data-attribute-code="private_log"]'),

        isPublicInstance: el =>
            !!el?.closest('[data-attribute-code="public_log"]'),

        isPublicTabActive: () =>
            document.querySelector(
                ".ibo-activity-panel--tab-toggler.ibo-is-active"
            )?.dataset?.caselogAttributeCode === "public_log",

        isPrivateTabActive: () =>
            document.querySelector(
                ".ibo-activity-panel--tab-toggler.ibo-is-active"
            )?.dataset?.caselogAttributeCode === "private_log",

        isPlaceholderish: txt => {
            const t = (txt || "")
                .replace(/\s+/g, " ")
                .trim()
                .toUpperCase();

            return PLACEHOLDER_TEXTS.some(p =>
                t.includes(p)
            );
        },

        rowsEmpty(rows) {
            if (!rows || !rows.length) return true;

            if (
                rows.some(
                    r =>
                        r.querySelector?.(
                            'img,video,iframe,table tr,pre,code'
                        )
                )
            ) {
                return false;
            }

            const txt = rows
                .map(r =>
                    (r.textContent || "")
                        .replace(/\u00A0/g, " ")
                )
                .join(" ")
                .replace(/\s+/g, " ")
                .trim();

            return !txt || util.isPlaceholderish(txt);
        }
    };

    /******************************
    * Module: UI (Custom Modals)
    ******************************/
    const UI = {
        confirm(message, onConfirm, onCancel) {
            const overlay = document.createElement('div');

            overlay.style.cssText = `
                position: fixed; inset: 0;
                background-color: rgba(0,0,0,0.4);
                z-index: 9999;
                display:flex;
                justify-content:center;
                align-items:center;
                font-family: Arial, sans-serif;
            `;

            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');

            const modal = document.createElement('div');

            modal.style.cssText = `
                background:#fff;
                border:1px solid #ccc;
                border-radius:4px;
                box-shadow:0 2px 10px rgba(0,0,0,0.2);
                width:420px;
                max-width:90%;
                display:flex;
                flex-direction:column;
                overflow:hidden;
            `;

            const header = document.createElement('div');

            header.style.cssText =
                `background:#4a4a4a;color:#fff;padding:10px;font-weight:bold;text-align:center;font-size:14px;`;

            header.textContent = 'Confirmation required';

            const content = document.createElement('div');

            content.style.cssText =
                `padding:20px;text-align:center;color:#333;font-size:13px;line-height:1.5;`;

            content.innerHTML = message;

            const footer = document.createElement('div');

            footer.style.cssText =
                `display:flex;justify-content:center;gap:15px;padding:10px 0 15px;`;

            const mkBtn = (txt, color, cb) => {
                const b = document.createElement('button');

                b.textContent = txt;

                b.style.cssText = `
                    background:#fff;
                    color:${color};
                    border:1px solid ${color};
                    border-radius:3px;
                    padding:6px 16px;
                    cursor:pointer;
                    font-size:13px;
                    transition:all .12s ease-in-out;
                `;

                b.addEventListener('mouseenter', () => {
                    b.style.background = color;
                    b.style.color = '#fff';
                });

                b.addEventListener('mouseleave', () => {
                    b.style.background = '#fff';
                    b.style.color = color;
                });

                b.onclick = () => {
                    if (document.body.contains(overlay)) {
                        document.body.removeChild(overlay);
                    }

                    cb && cb();
                };

                return b;
            };

            const confirmBtn =
                mkBtn('Confirm', '#28a745', onConfirm);

            const cancelBtn =
                mkBtn('Cancel', '#dc3545', onCancel);

            footer.appendChild(confirmBtn);
            footer.appendChild(cancelBtn);

            modal.appendChild(header);
            modal.appendChild(content);
            modal.appendChild(footer);

            overlay.appendChild(modal);

            document.body.appendChild(overlay);

            confirmBtn.focus();

            overlay.addEventListener('keydown', ev => {
                if (ev.key === 'Escape') cancelBtn.click();
                if (ev.key === 'Enter') confirmBtn.click();
            });
        },

        alert(message, onClose) {
            const overlay = document.createElement('div');

            overlay.style.cssText = `
                position: fixed; inset: 0;
                background-color: rgba(0,0,0,0.5);
                z-index: 9999;
                display:flex;
                justify-content:center;
                align-items:center;
                font-family: Arial, sans-serif;
            `;

            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');

            const modal = document.createElement('div');

            modal.style.cssText = `
                background:#fff;
                border:1px solid #ccc;
                border-radius:4px;
                box-shadow:0 4px 15px rgba(0,0,0,0.3);
                width:420px;
                max-width:90%;
                display:flex;
                flex-direction:column;
                overflow:hidden;
            `;

            const header = document.createElement('div');

            header.style.cssText =
                `background:#dc3545;color:#fff;padding:10px;font-weight:bold;text-align:center;font-size:14px;`;

            header.textContent = 'Action Blocked';

            const content = document.createElement('div');

            content.style.cssText =
                `padding:20px;text-align:center;color:#333;font-size:13px;line-height:1.5;`;

            content.innerHTML = message;

            const footer = document.createElement('div');

            footer.style.cssText =
                `display:flex;justify-content:center;padding:10px 0 15px;`;

            const okBtn = document.createElement('button');

            okBtn.textContent = 'Cerrar';

            okBtn.style.cssText = `
                background:#fff;
                color:#dc3545;
                border:1px solid #dc3545;
                border-radius:3px;
                padding:6px 24px;
                cursor:pointer;
                font-size:13px;
                font-weight:bold;
                transition:all .12s ease-in-out;
            `;

            okBtn.addEventListener('mouseenter', () => {
                okBtn.style.background = '#dc3545';
                okBtn.style.color = '#fff';
            });

            okBtn.addEventListener('mouseleave', () => {
                okBtn.style.background = '#fff';
                okBtn.style.color = '#dc3545';
            });

            okBtn.onclick = () => {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }

                onClose && onClose();
            };

            footer.appendChild(okBtn);

            modal.appendChild(header);
            modal.appendChild(content);
            modal.appendChild(footer);

            overlay.appendChild(modal);

            document.body.appendChild(overlay);

            okBtn.focus();

            overlay.addEventListener('keydown', ev => {
                if (ev.key === 'Escape' || ev.key === 'Enter') {
                    okBtn.click();
                }
            });
        }
    };

    /******************************
    * Module: styles
    ******************************/
    (function injectCSS() {
        const css = `
table.itsm-theme-wip      { --title-bg:#b3b3b3; --header-bg:#dddddd; --content-bg:#eaf3f8; }
table.itsm-theme-transfer { --title-bg:#ffa366; --header-bg:#ffc299; --content-bg:#fff3e8; }
table.itsm-theme-solution { --title-bg:#46d267; --header-bg:#adebbb; --content-bg:#e9f8ee; }
table.itsm-theme-update   { --title-bg:#bd42ff; --header-bg:#d898fa; --content-bg:#fcf5ff; }

.collapsible-anim {
    overflow:hidden;
    transition:max-height 260ms ease,opacity 200ms ease,transform 200ms ease;
    will-change:max-height,opacity,transform
}

.collapsible-anim.collapsed {
    max-height:0!important;
    opacity:0;
    transform:translateY(-2px)
}

.collapsible-anim.expanded {
    opacity:1;
    transform:translateY(0)
}

@media (prefers-reduced-motion:reduce) {
    .collapsible-anim {
        transition:none
    }
}

.ibo-activity-entry--main-information-content
  table:is([data-collapsible-template="true"],[data-collapsible-processed="true"]) {
    width:100%;
    border-collapse:separate;
    border-spacing:0;
    border:1px solid #5b6b73;
    border-radius:3px;
    box-shadow:0 1px 3px rgba(0,0,0,.08);
    background:var(--content-bg,#eaf3f8)
}

.ibo-activity-entry--main-information-content
  table:is([data-collapsible-template="true"],[data-collapsible-processed="true"])>tbody>tr:first-child>td {
    background:var(--title-bg:#b3b3b3)!important;
    text-align:center;
    font-weight:bold;
    border:1px solid #8a8a8a;
    padding:6px 8px
}

.ibo-activity-entry--main-information-content
  table:is([data-collapsible-template="true"],[data-collapsible-processed="true"])>tbody>tr>td[data-is-header="true"] {
    background:var(--header-bg:#dddddd)!important;
    font-weight:bold;
    position:relative;
    border:1px solid #8a8a8a;
    padding:6px 22px 6px 8px;
    border-radius:3px
}

.ibo-activity-entry--main-information-content
  table:is([data-collapsible-template="true"],[data-collapsible-processed="true"]) .collapsible-wrapper-cell {
    background:var(--content-bg,#eaf3f8);
    padding:0;
    border:0
}

.ibo-activity-entry--main-information-content
  table:is([data-collapsible-template="true"],[data-collapsible-processed="true"]) .collapsible-inner,
.collapsible-inner tr,
.collapsible-inner td {
    background:transparent;
    border:0
}

.ibo-activity-entry--main-information-content
  table:is([data-collapsible-template="true"],[data-collapsible-processed="true"]) .collapsible-inner>tbody>tr>td {
    padding:8px 10px
}

.ibo-activity-entry--main-information-content
  table:is([data-collapsible-template="true"],[data-collapsible-processed="true"]) .collapsible-inner>tbody>tr>td :not(pre):not(code):not(table) {
    background:transparent
}

.collapsible-arrow {
    position:absolute;
    right:8px;
    top:50%;
    transform:translateY(-50%);
    font-size:12px;
    pointer-events:none;
    opacity:.8
}

.template-selector {
    width:150px;
    padding:4px;
    font-size:13px;
    height:28px;
    margin-left:8px;
    vertical-align:middle
}

.hidden-tag {
    font-size:11px;
    position:absolute;
    right:8px;
    bottom:4px;
    user-select:none
}

.ibo-activity-entry--main-information-content
  table:is([data-collapsible-template="true"],[data-collapsible-processed="true"])
  .collapsible-inner td>table[border] {
    border-collapse:collapse;
    width:100%;
    border:1px solid #c3ccd3
}

.ibo-activity-entry--main-information-content
  table:is([data-collapsible-template="true"],[data-collapsible-processed="true"])
  .collapsible-inner td>table[border] td,

.ibo-activity-entry--main-information-content
  table:is([data-collapsible-template="true"],[data-collapsible-processed="true"])
  .collapsible-inner td>table[border] th {
    border:1px solid #c3ccd3;
    padding:6px 8px
}

.ibo-activity-entry--main-information-content
  table:is([data-collapsible-template="true"],[data-collapsible-processed="true"])
  >tbody>tr>td[data-is-header="true"][data-empty="1"]::after {
    content:"– empty –";
    position:absolute;
    right:26px;
    top:50%;
    transform:translateY(-50%);
    font-size:11px;
    font-weight:500;
    font-style:italic;
    opacity:.6;
    pointer-events:none
}

.ibo-activity-entry--main-information-content
  table:is([data-collapsible-template="true"],[data-collapsible-processed="true"])
  >tbody>tr:not(.itsm-title-row)>td:not([data-is-header="true"]):not(.collapsible-wrapper-cell) {
    padding:8px 10px;
    background:var(--content-bg,#eaf3f8);
    border:0
}

[data-attribute-code="private_log"] .ibo-caselog-entry-form--actions {
    position:relative
}

[data-attribute-code="private_log"] .itsm-privlog-toggle-bar {
    display:flex;
    align-items:center;
    justify-content:center;
    padding:6px 0;
    background:#f5f5f5;
    border-top:1px solid #ccc
}

[data-attribute-code="private_log"] .itsm-privlog-toggle {
    background:linear-gradient(to bottom,#fff,#e6e6e6);
    border:1px solid #888;
    border-radius:4px;
    padding:4px 12px;
    font-size:12px;
    font-weight:bold;
    color:#333;
    cursor:pointer;
    transition:all .2s
}

[data-attribute-code="private_log"] .itsm-privlog-toggle:hover {
    background:linear-gradient(to bottom,#f9f9f9,#dcdcdc);
    border-color:#555
}

[data-attribute-code="private_log"][data-form-collapsed="1"] .ibo-caselog-entry-form--text-input,
[data-attribute-code="private_log"][data-form-collapsed="1"] .ibo-caselog-entry-form--extra-inputs,
[data-attribute-code="private_log"][data-form-collapsed="1"] .ibo-caselog-entry-form--lock-indicator,
[data-attribute-code="private_log"][data-form-collapsed="1"] .ibo-caselog-entry-form--action-buttons--main-actions {
    display:none!important
}

[data-role="ibo-button-group"] .ibo-button-for-options-menu {
    display:none!important
}

.itsm-global-toggle-btn {
    cursor:pointer;
    margin-left:15px;
    font-weight:600;
    user-select:none;
    display:inline-flex;
    align-items:center;
    gap:5px
}

.itsm-global-toggle-btn:hover {
    color:#000
}
`;

        const el = document.createElement('style');
        el.textContent = css;
        document.head.appendChild(el);
    })();

    /******************************
    * Module: ck (CKEditor 5)
    ******************************/
    const ck = {

        adjustHeight(h = 450) {
            if (!document.getElementById('itsm-ckeditor-height')) {
                const css = document.createElement('style');

                css.id = 'itsm-ckeditor-height';

                css.textContent =
                    `.ibo-caselog-entry-form--text-input .ck-editor__editable{min-height:${h}px !important;}`;

                document.head.appendChild(css);
            }
        },

        /*
         * Inicializa únicamente el estado interno del editor.
         *
         * IMPORTANTE:
         * Esto NO modifica el contenido del CKEditor.
         */
        initEditorState(ed) {
            if (!ed || ed.__itsm_init === true) return;

            ed.__itsm_init = true;

            ed.__itsm_isPlaceholder = false;
            ed.__itsm_placeholderHTML = "";
            ed.__itsm_userEdited = false;

            ed.__itsm_clearedByPublic = false;
            ed.__itsm_noAutoReinsert = false;

            /*
             * Estado de interacción real del usuario.
             */
            ed.__itsm_userActivated = false;
            ed.__itsm_waitingForUserInput = false;

            /*
             * Indica que la plantilla fue introducida como consecuencia
             * de una acción explícita del usuario.
             */
            ed.__itsm_templateInsertedByUser = false;
        },

        /*
         * Vincula el editor con nuestra lógica de detección de cambios.
         */
        bindEditor(ed) {
            if (!ed) return;

            ck.initEditorState(ed);

            if (ed.__itsm_privateBound) return;

            /*
             * Detectamos modificaciones sobre una plantilla que ya existe.
             *
             * Este listener NO inserta plantillas.
             */
            ed.model.document.on('change:data', () => {

                const nowTrim =
                    (ed.getData() || "").trim();

                const ref =
                    ed.__itsm_placeholderHTML;

                const was =
                    ed.__itsm_isPlaceholder;

                const edited =
                    nowTrim &&
                    ref &&
                    nowTrim !== ref;

                if (edited && was) {
                    ed.__itsm_isPlaceholder = false;
                    ed.__itsm_userEdited = true;
                    ed.__itsm_noAutoReinsert = true;
                }
            });

            /*
             * Detectamos la primera modificación REAL del usuario.
             *
             * Focus/click NO dispara la inserción.
             */
            const editable =
                ed.ui?.view?.editable?.element;

            if (editable) {

                editable.addEventListener(
                    'beforeinput',
                    event => {

                        if (ed.__itsm_userActivated) {
                            return;
                        }

                        const inputTypes = [
                            'insertText',
                            'insertCompositionText',
                            'insertFromPaste',
                            'insertFromDrop',
                            'deleteContentBackward',
                            'deleteContentForward'
                        ];

                        if (!inputTypes.includes(event.inputType)) {
                            return;
                        }

                        ed.__itsm_waitingForUserInput = true;

                        const current =
                            (ed.getData() || "").trim();

                        /*
                         * Si está vacío, insertamos la plantilla JUSTO
                         * cuando el usuario comienza a modificar el editor.
                         */
                        if (!current) {

                            const chosen =
                                templates.getChosen();

                            if (
                                chosen !== 'empty' &&
                                TEMPLATES[chosen]
                            ) {

                                ck.insertTemplate(
                                    TEMPLATES[chosen],
                                    true,
                                    true
                                );

                                const wrap =
                                    document.querySelector(
                                        '[data-attribute-code="private_log"]'
                                    );

                                if (wrap) {
                                    wrap.dataset.defaultInserted = '1';
                                }

                                controller.syncSelector();
                            }
                        }

                        ed.__itsm_userActivated = true;
                        ed.__itsm_waitingForUserInput = false;
                    },
                    true
                );
            }

            ed.__itsm_privateBound = true;
        },

        /*
         * Inserta una plantilla.
         *
         * userInitiated = true significa que la inserción fue provocada
         * por una acción real del usuario.
         */
        insertTemplate(
            html,
            force = false,
            userInitiated = false
        ) {

            const ed =
                ck.getActivePrivateEditor();

            if (!ed) return;

            ck.initEditorState(ed);

            const before =
                ed.getData() || "";

            const isEmpty =
                !util.cleanHtml(before);

            if (
                !force &&
                (
                    ed.__itsm_clearedByPublic ||
                    ed.__itsm_noAutoReinsert
                )
            ) {
                return;
            }

            if (force || isEmpty) {

                /*
                 * Esta es la única operación que realmente cambia
                 * el contenido automáticamente.
                 *
                 * Ahora solo se llama como consecuencia de una
                 * acción explícita del usuario.
                 */
                ed.setData(html);

                ed.__itsm_isPlaceholder = true;
                ed.__itsm_placeholderHTML =
                    (html || "").trim();

                ed.__itsm_userEdited = false;

                if (userInitiated) {
                    ed.__itsm_templateInsertedByUser = true;
                }

                if (force) {
                    ed.__itsm_clearedByPublic = false;
                    ed.__itsm_noAutoReinsert = false;
                }
            }
        },

        getActivePrivateEditor() {

            const wrap =
                document.querySelector(
                    '[data-attribute-code="private_log"]'
                );

            if (!wrap) return null;

            const editable =
                wrap.querySelector(
                    '.ck-editor__editable'
                );

            const ed =
                editable?.ckeditorInstance || null;

            if (ed) {
                ck.bindEditor(ed);
            }

            return ed;
        }
    };

    /******************************
    * Module: templates
    ******************************/
    const templates = {

        getChosen() {

            const wrap =
                document.querySelector(
                    '[data-attribute-code="private_log"]'
                );

            const sel =
                wrap?.querySelector(
                    '.template-selector'
                );

            const fromSelect =
                sel?.value;

            if (
                fromSelect &&
                TEMPLATES[fromSelect]
            ) {
                return fromSelect;
            }

            const saved =
                localStorage.getItem(
                    SELECT_KEY
                );

            return (
                saved &&
                TEMPLATES[saved]
            )
                ? saved
                : 'wip';
        },

        addSelector() {

            const bar =
                document.querySelector(
                    '[data-attribute-code="private_log"] .ibo-caselog-entry-form--action-buttons--extra-actions'
                );

            if (!bar) return;

            if (
                bar.querySelector(
                    '.template-selector'
                )
            ) {
                return;
            }

            const label =
                Object.assign(
                    document.createElement('span'),
                    {
                        innerText: 'Template:'
                    }
                );

            label.style.cssText =
                'font-size:13px;font-weight:bold';

            const sel =
                document.createElement('select');

            sel.className =
                'template-selector';

            sel.innerHTML = `
                <option value="wip">WIP</option>
                <option value="transfer">Ticket Transfer / Escalation</option>
                <option value="solution">Solution</option>
                <option value="update">Update</option>
                <option value="empty">Empty</option>
            `;

            const saved =
                localStorage.getItem(
                    SELECT_KEY
                );

            sel.value =
                (
                    saved &&
                    TEMPLATES[saved]
                )
                    ? saved
                    : 'wip';

            sel.addEventListener(
                'change',
                () => {

                    const val =
                        sel.value;

                    localStorage.setItem(
                        SELECT_KEY,
                        val
                    );

                    const wrap =
                        document.querySelector(
                            '[data-attribute-code="private_log"]'
                        );

                    if (val === 'empty') {

                        const ed =
                            ck.getActivePrivateEditor();

                        if (ed) {

                            ed.setData('');

                            ed.__itsm_isPlaceholder = false;
                            ed.__itsm_userEdited = false;
                            ed.__itsm_noAutoReinsert = false;
                            ed.__itsm_userActivated = false;
                            ed.__itsm_waitingForUserInput = false;
                            ed.__itsm_templateInsertedByUser = true;
                        }

                        if (wrap) {
                            wrap.dataset.defaultInserted = '1';
                        }

                        controller.syncSelector();

                        return;
                    }

                    if (TEMPLATES[val]) {

                        /*
                         * Cambiar manualmente el selector sí cuenta
                         * como acción explícita del usuario.
                         */
                        ck.insertTemplate(
                            TEMPLATES[val],
                            true,
                            true
                        );

                        if (wrap) {
                            wrap.dataset.defaultInserted = '1';
                        }

                        controller.syncSelector();
                    }
                }
            );

            bar.appendChild(label);
            bar.appendChild(sel);
        }
    };

    /******************************
    * Module: tables
    ******************************/
    const tables = (() => {

        let _processing = false;

        function getRows(tbl) {

            const tb =
                (tbl.tBodies && tbl.tBodies[0]) ||
                tbl.querySelector('tbody');

            if (!tb) return [];

            try {
                return Array.from(
                    tb.querySelectorAll(':scope > tr')
                );
            } catch {
                return Array.from(tb.children)
                    .filter(n => n.tagName === 'TR');
            }
        }

        function isOurTemplate(table) {

            const td =
                table.querySelector(
                    'tbody > tr:first-child > td'
                );

            const t =
                util.norm(
                    td
                        ? td.textContent
                        : ''
                );

            return (
                t.includes('WORK IN PROGRESS') ||
                t.includes('TRANSFER') ||
                t.includes('SOLUTION OF THE TICKET') ||
                t.includes('UPDATE')
            );
        }

        function hasHeaderOrTag(rows) {

            return rows.some((row, i) => {

                if (i === 0) return false;

                const cell =
                    row.querySelector('td');

                if (!cell) return false;

                const raw =
                    cell.innerText ||
                    cell.textContent ||
                    '';

                const t =
                    util.norm(raw);

                return (
                    ALL_HEADERS.includes(t) ||
                    TAG_REGEX.test(raw)
                );
            });
        }

        function processTable(table) {

            if (
                table.classList.contains(
                    'collapsible-inner'
                )
            ) {
                return;
            }

            if (
                table.dataset.collapsibleProcessed ===
                "true"
            ) {
                return;
            }

            const rows =
                getRows(table);

            if (!rows.length) return;

            if (
                !(
                    isOurTemplate(table) ||
                    hasHeaderOrTag(rows)
                )
            ) {
                return;
            }

            table.dataset.collapsibleProcessed =
                "true";

            table.setAttribute(
                'data-collapsible-template',
                'true'
            );

            const firstCell =
                rows[0]?.querySelector('td');

            const normFirst =
                util.norm(
                    firstCell
                        ? (
                            firstCell.innerText ||
                            firstCell.textContent
                        )
                        : ''
                );

            rows[0].classList.add(
                'itsm-title-row'
            );

            if (
                normFirst.includes(
                    'WORK IN PROGRESS'
                )
            ) {
                table.classList.add(
                    'itsm-theme-wip'
                );
            } else if (
                normFirst.includes(
                    'TRANSFER'
                )
            ) {
                table.classList.add(
                    'itsm-theme-transfer'
                );
            } else if (
                normFirst.includes(
                    'SOLUTION OF THE TICKET'
                )
            ) {
                table.classList.add(
                    'itsm-theme-solution'
                );
            } else if (
                normFirst.includes(
                    'UPDATE'
                )
            ) {
                table.classList.add(
                    'itsm-theme-update'
                );
            }

            rows.forEach((row, idx) => {

                if (idx === 0) return;

                const cell =
                    row.querySelector('td');

                if (!cell) return;

                const raw =
                    cell.innerText ||
                    cell.textContent ||
                    '';

                const t =
                    util.norm(raw);

                const hasTag =
                    TAG_REGEX.test(raw);

                if (
                    ALL_HEADERS.includes(t) ||
                    hasTag
                ) {

                    cell.dataset.isHeader =
                        'true';

                    row.style.display =
                        'table-row';

                    cell.style.position =
                        'relative';

                    cell.style.fontWeight =
                        'bold';
                }
            });

            rows.forEach((row, idx) => {

                if (idx === 0) return;

                const cell =
                    row.querySelector('td');

                if (
                    !cell ||
                    cell.dataset.isHeader !==
                    'true'
                ) {
                    return;
                }

                let end =
                    rows.length;

                for (
                    let i = idx + 1;
                    i < rows.length;
                    i++
                ) {

                    const next =
                        rows[i].querySelector('td');

                    if (
                        next?.dataset.isHeader ===
                        'true'
                    ) {
                        end = i;
                        break;
                    }
                }

                const contentRows =
                    rows.slice(
                        idx + 1,
                        end
                    );

                if (
                    util.rowsEmpty(
                        contentRows
                    )
                ) {

                    cell.dataset.empty =
                        '1';

                    contentRows.forEach(
                        r =>
                            r.style.display =
                            'none'
                    );

                } else {

                    cell.removeAttribute(
                        'data-empty'
                    );
                }
            });

            rows.forEach((row, idx) => {

                if (idx === 0) return;

                const cell =
                    row.querySelector('td');

                if (!cell) return;

                if (
                    cell.dataset.empty ===
                    '1'
                ) {
                    return;
                }

                const raw =
                    cell.innerText ||
                    cell.textContent ||
                    '';

                const t =
                    util.norm(raw);

                const m =
                    raw.match(TAG_REGEX);

                const tagCode =
                    m
                        ? m[1].toUpperCase()
                        : null;

                const titleCollapsible =
                    COLLAPSIBLE_HEADERS.includes(t);

                const tagWhitelisted =
                    !!(
                        tagCode &&
                        COLLAPSIBLE_TAGS.has(
                            tagCode
                        )
                    );

                if (
                    !(
                        titleCollapsible ||
                        tagWhitelisted
                    )
                ) {
                    return;
                }

                let end =
                    rows.length;

                for (
                    let i = idx + 1;
                    i < rows.length;
                    i++
                ) {

                    const next =
                        rows[i].querySelector('td');

                    if (
                        next?.dataset.isHeader ===
                        'true'
                    ) {
                        end = i;
                        break;
                    }
                }

                const contentRows =
                    rows.slice(
                        idx + 1,
                        end
                    );

                if (
                    util.rowsEmpty(
                        contentRows
                    )
                ) {

                    cell.dataset.empty =
                        '1';

                    cell.style.cursor =
                        'default';

                    const old =
                        cell.querySelector(
                            '.collapsible-arrow'
                        );

                    if (old) old.remove();

                    contentRows.forEach(
                        r =>
                            r.style.display =
                            'none'
                    );

                    return;

                } else {

                    cell.removeAttribute(
                        'data-empty'
                    );
                }

                cell.style.cursor =
                    'pointer';

                let arrow =
                    cell.querySelector(
                        '.collapsible-arrow'
                    );

                if (!arrow) {

                    arrow =
                        document.createElement(
                            'span'
                        );

                    arrow.className =
                        'collapsible-arrow';

                    arrow.textContent =
                        '▼';

                    cell.appendChild(
                        arrow
                    );
                }

                const wrapperRow =
                    document.createElement(
                        'tr'
                    );

                const wrapperCell =
                    document.createElement(
                        'td'
                    );

                wrapperRow.className =
                    'collapsible-wrapper-row is-collapsed';

                wrapperCell.className =
                    'collapsible-wrapper-cell';

                wrapperCell.colSpan =
                    cell.colSpan || 1;

                const animDiv =
                    document.createElement(
                        'div'
                    );

                animDiv.className =
                    'collapsible-anim collapsed';

                animDiv.dataset.open =
                    '0';

                const innerTable =
                    document.createElement(
                        'table'
                    );

                innerTable.className =
                    'collapsible-inner';

                const innerTbody =
                    document.createElement(
                        'tbody'
                    );

                innerTable.appendChild(
                    innerTbody
                );

                contentRows.forEach(
                    r =>
                        innerTbody.appendChild(r)
                );

                animDiv.appendChild(
                    innerTable
                );

                wrapperCell.appendChild(
                    animDiv
                );

                wrapperRow.appendChild(
                    wrapperCell
                );

                row.insertAdjacentElement(
                    'afterend',
                    wrapperRow
                );

                let ro = null;

                const open = () => {

                    animDiv.classList.add(
                        'expanded'
                    );

                    animDiv.classList.remove(
                        'collapsed'
                    );

                    animDiv.dataset.open =
                        '1';

                    animDiv.style.maxHeight =
                        innerTable.scrollHeight +
                        'px';

                    const onEnd = e => {

                        if (
                            e.propertyName ===
                            'max-height'
                        ) {

                            animDiv.style.maxHeight =
                                'none';

                            animDiv.removeEventListener(
                                'transitionend',
                                onEnd
                            );
                        }
                    };

                    animDiv.addEventListener(
                        'transitionend',
                        onEnd
                    );

                    arrow.textContent =
                        '▲';

                    if (
                        !ro &&
                        'ResizeObserver' in window
                    ) {

                        ro =
                            new ResizeObserver(
                                () => {

                                    if (
                                        animDiv.dataset.open ===
                                        '1'
                                    ) {
                                        animDiv.style.maxHeight =
                                            'none';
                                    }
                                }
                            );

                        ro.observe(
                            innerTable
                        );
                    }
                };

                const close = () => {

                    if (
                        !animDiv.style.maxHeight ||
                        animDiv.style.maxHeight ===
                        'none'
                    ) {

                        animDiv.style.maxHeight =
                            innerTable.scrollHeight +
                            'px';
                    }

                    requestAnimationFrame(
                        () => {

                            animDiv.classList.add(
                                'collapsed'
                            );

                            animDiv.classList.remove(
                                'expanded'
                            );

                            animDiv.dataset.open =
                                '0';

                            animDiv.style.maxHeight =
                                '0px';

                            arrow.textContent =
                                '▼';
                        }
                    );
                };

                cell.addEventListener(
                    'click',
                    () =>
                        animDiv.dataset.open ===
                        '1'
                            ? close()
                            : open()
                );

                innerTable
                    .querySelectorAll(
                        'img,iframe,video'
                    )
                    .forEach(el =>
                        el.addEventListener(
                            'load',
                            () => {

                                if (
                                    animDiv.dataset.open ===
                                    '1'
                                ) {
                                    animDiv.style.maxHeight =
                                        'none';
                                }
                            }
                        )
                    );
            });
        }

        function processAll() {

            if (_processing) return;

            _processing = true;

            try {

                document
                    .querySelectorAll(
                        '.ibo-activity-entry--main-information-content table:not(.collapsible-inner):not([data-collapsible-processed])'
                    )
                    .forEach(
                        processTable
                    );

            } finally {

                _processing = false;
            }
        }

        function processIn(root) {

            if (
                !root ||
                !root.querySelectorAll
            ) {
                return;
            }

            root
                .querySelectorAll(
                    '.ibo-activity-entry--main-information-content table:not(.collapsible-inner):not([data-collapsible-processed])'
                )
                .forEach(
                    processTable
                );
        }

        return {
            processAll,
            processIn
        };
    })();

    /******************************
    * Module: controller
    ******************************/
    const controller = {

        syncSelector() {

            const wrap =
                document.querySelector(
                    '[data-attribute-code="private_log"]'
                );

            if (!wrap) return;

            const sel =
                wrap.querySelector(
                    '.template-selector'
                );

            if (!sel) return;

            const ed =
                ck.getActivePrivateEditor();

            if (!ed) return;

            const html =
                (ed.getData() || '')
                    .toUpperCase();

            if (
                html.includes(
                    'WORK IN PROGRESS'
                )
            ) {
                sel.value = 'wip';

            } else if (
                html.includes(
                    'SOLUTION OF THE TICKET'
                )
            ) {
                sel.value = 'solution';

            } else if (
                html.includes(
                    'TRANSFER'
                )
            ) {
                sel.value = 'transfer';

            } else if (
                html.includes(
                    'UPDATE'
                )
            ) {
                sel.value = 'update';

            } else if (
                !html.trim()
            ) {
                sel.value =
                    templates.getChosen();
            }
        },

        /*
         * IMPORTANTE:
         *
         * Esta función ya NO inserta automáticamente una plantilla.
         *
         * Solo prepara el editor para detectar la primera modificación
         * real del usuario.
         */
        ensureDefaultTemplateNow() {

            const wrap =
                document.querySelector(
                    '[data-attribute-code="private_log"]'
                );

            if (!wrap) return;

            const isTabActive =
                util.isPrivateTabActive();

            const isVisible =
                util.isVisibleEl(wrap);

            if (
                !isTabActive &&
                !isVisible
            ) {
                return;
            }

            const ed =
                ck.getActivePrivateEditor();

            if (!ed) return;

            ck.initEditorState(ed);

            const html =
                (ed.getData() || '')
                    .trim();

            /*
             * Si ya existe contenido real, simplemente sincronizamos
             * el selector.
             */
            if (html.length > 0) {

                wrap.dataset.defaultInserted =
                    '1';

                controller.syncSelector();

                return;
            }

            const chosen =
                templates.getChosen();

            /*
             * Si el usuario seleccionó EMPTY, no hay nada que insertar.
             */
            if (chosen === 'empty') {

                wrap.dataset.defaultInserted =
                    '1';

                controller.syncSelector();

                return;
            }

            /*
             * MUY IMPORTANTE:
             *
             * No hacemos setData().
             *
             * El editor permanece completamente vacío hasta que el
             * usuario empiece a modificarlo.
             */
            delete wrap.dataset.defaultInserted;

            ed.__itsm_userActivated =
                false;

            ed.__itsm_waitingForUserInput =
                false;
        },

        resetInsertionFlags() {

            const wrap =
                document.querySelector(
                    '[data-attribute-code="private_log"]'
                );

            if (!wrap) return;

            delete wrap.dataset.defaultInserted;

            const ed =
                ck.getActivePrivateEditor();

            if (ed) {

                ed.__itsm_clearedByPublic =
                    false;

                ed.__itsm_noAutoReinsert =
                    false;

                ed.__itsm_isPlaceholder =
                    false;

                ed.__itsm_userActivated =
                    false;

                ed.__itsm_waitingForUserInput =
                    false;

                ed.__itsm_templateInsertedByUser =
                    false;
            }
        },

        clearPrivateIfPublicExists() {

            if (
                !util.isPublicTabActive()
            ) {
                return;
            }

            const privWrap =
                document.querySelector(
                    '[data-attribute-code="private_log"]'
                );

            const ed =
                ck.getActivePrivateEditor();

            if (!ed) return;

            /*
             * Si el privado solamente tiene el placeholder o no ha
             * sido editado por el usuario, se vacía.
             */
            if (
                ed.__itsm_isPlaceholder === true ||
                ed.__itsm_userEdited !== true
            ) {

                ed.setData('');

                ed.__itsm_clearedByPublic =
                    true;

                ed.__itsm_noAutoReinsert =
                    true;

                ed.__itsm_userActivated =
                    false;

                if (privWrap) {
                    delete privWrap.dataset.defaultInserted;
                }
            }
        },

        hasDoubleLogContent() {

            let hasPublic = false;
            let hasPrivate = false;

            document
                .querySelectorAll(
                    '.ck-editor__editable'
                )
                .forEach(el => {

                    const ed =
                        el.ckeditorInstance;

                    if (!ed) return;

                    const html =
                        ed.getData() || '';

                    const cleanTxt =
                        util.cleanHtml(
                            html
                        );

                    if (
                        cleanTxt.length > 0 &&
                        !util.isPlaceholderish(
                            html
                        )
                    ) {

                        if (
                            util.isPublicInstance(
                                el
                            )
                        ) {
                            hasPublic = true;
                        }

                        if (
                            util.isPrivateInstance(
                                el
                            )
                        ) {
                            hasPrivate = true;
                        }
                    }
                });

            return (
                hasPublic &&
                hasPrivate
            );
        },

        /*
         * Después de enviar un Private Log NO vuelve a insertar
         * automáticamente una plantilla.
         *
         * El siguiente Private Log empieza vacío.
         */
        ensureTemplateIfEmptySoon() {

            const wrap =
                document.querySelector(
                    '[data-attribute-code="private_log"]'
                );

            const ed =
                ck.getActivePrivateEditor();

            if (!ed) return;

            ck.initEditorState(ed);

            if (wrap) {
                delete wrap.dataset.defaultInserted;
            }

            ed.__itsm_userActivated =
                false;

            ed.__itsm_waitingForUserInput =
                false;

            ed.__itsm_templateInsertedByUser =
                false;
        }
    };

    /******************************
    * Module: publicCleaner
    ******************************/
    const publicCleaner = {

        bindAll: util.debounce(
            function () {

                document
                    .querySelectorAll(
                        '.ck-editor__editable'
                    )
                    .forEach(el => {

                        const ed =
                            el.ckeditorInstance;

                        if (
                            !ed ||
                            ed.__itsm_publicBound
                        ) {
                            return;
                        }

                        ed.model.document.on(
                            'change:data',
                            controller.clearPrivateIfPublicExists
                        );

                        ed.__itsm_publicBound =
                            true;
                    });

                controller
                    .clearPrivateIfPublicExists();

            },
            150
        )
    };

    /******************************
    * Module: privateForm (folding)
    ******************************/
    const privateForm = (() => {

        const FORM_COLLAPSE_KEY =
            (id = 'unknown') =>
                `itsm_privlog_form_collapsed:${id}`;

        function getTicketId() {

            try {

                return (
                    new URLSearchParams(
                        location.search
                    ).get('id') ||
                    'unknown'
                );

            } catch {

                return 'unknown';
            }
        }

        function toggle(form, id) {

            const now =
                form.dataset.formCollapsed ===
                '1'
                    ? '0'
                    : '1';

            form.setAttribute(
                'data-form-collapsed',
                now
            );

            localStorage.setItem(
                FORM_COLLAPSE_KEY(id),
                now
            );
        }

        function makeCollapsible() {

            const form =
                document.querySelector(
                    'form.ibo-caselog-entry-form[data-attribute-code="private_log"]'
                );

            if (!form) return;

            const ticketId =
                getTicketId();

            if (
                !form.__itsm_formCollapseInit
            ) {

                const saved =
                    localStorage.getItem(
                        FORM_COLLAPSE_KEY(
                            ticketId
                        )
                    );

                if (saved === '1') {

                    form.setAttribute(
                        'data-form-collapsed',
                        '1'
                    );
                }
            }

            const textInput =
                form.querySelector(
                    '.ibo-caselog-entry-form--text-input'
                );

            if (textInput) {

                let bar =
                    form.querySelector(
                        '.itsm-privlog-toggle-bar'
                    );

                if (!bar) {

                    bar =
                        document.createElement(
                            'div'
                        );

                    bar.className =
                        'itsm-privlog-toggle-bar';

                    const btn =
                        document.createElement(
                            'button'
                        );

                    btn.type =
                        'button';

                    btn.className =
                        'itsm-privlog-toggle';

                    const setLabel = () =>
                        btn.textContent =
                            form.dataset.formCollapsed ===
                            '1'
                                ? 'UNFOLD'
                                : 'FOLD';

                    setLabel();

                    btn.addEventListener(
                        'click',
                        e => {

                            e.preventDefault();

                            toggle(
                                form,
                                ticketId
                            );

                            setLabel();
                        }
                    );

                    bar.appendChild(
                        btn
                    );

                    textInput.insertAdjacentElement(
                        'afterend',
                        bar
                    );

                } else {

                    const btn =
                        bar.querySelector(
                            '.itsm-privlog-toggle'
                        );

                    if (btn) {

                        btn.textContent =
                            form.dataset.formCollapsed ===
                            '1'
                                ? 'UNFOLD'
                                : 'FOLD';
                    }
                }
            }

            form.__itsm_formCollapseInit =
                true;
        }

        return {
            makeCollapsible:
                util.debounce(
                    makeCollapsible,
                    80
                )
        };
    })();

    /******************************
    * Module: globalToggler
    ******************************/
    const globalToggler = {

        init() {

            const containers =
                document.querySelectorAll(
                    '.ibo-activity-panel--tab-toolbar-middle-actions'
                );

            containers.forEach(
                container => {

                    if (
                        container.querySelector(
                            '.itsm-global-toggle-btn'
                        )
                    ) {
                        return;
                    }

                    this.createBtn(
                        container
                    );
                }
            );
        },

        createBtn(container) {

            const label =
                document.createElement(
                    'label'
                );

            label.className =
                'ibo-activity-panel--tab-toolbar-action itsm-global-toggle-btn';

            label.innerHTML =
                `<span class="fas fa-expand-arrows-alt"></span> <span class="txt">Unfold logs</span>`;

            label.dataset.state =
                '0';

            label.addEventListener(
                'click',
                e => {

                    e.preventDefault();

                    this.toggleAll(
                        label
                    );
                }
            );

            container.appendChild(
                label
            );
        },

        toggleAll(btn) {

            const isCollapsed =
                btn.dataset.state ===
                '0';

            const targetOpenState =
                isCollapsed
                    ? '0'
                    : '1';

            const animDivs =
                document.querySelectorAll(
                    '.collapsible-anim'
                );

            animDivs.forEach(
                div => {

                    if (
                        div.dataset.open ===
                        targetOpenState &&
                        util.isVisibleEl(
                            div
                        )
                    ) {
                        this.triggerHeaderClick(
                            div
                        );
                    }
                }
            );

            const txt =
                btn.querySelector(
                    '.txt'
                );

            const ico =
                btn.querySelector(
                    '.fas'
                );

            if (isCollapsed) {

                btn.dataset.state =
                    '1';

                txt.textContent =
                    "Fold logs";

                ico.className =
                    "fas fa-compress-arrows-alt";

            } else {

                btn.dataset.state =
                    '0';

                txt.textContent =
                    "Unfold logs";

                ico.className =
                    "fas fa-expand-arrows-alt";
            }
        },

        triggerHeaderClick(animDiv) {

            try {

                const wrapperCell =
                    animDiv.parentElement;

                const wrapperRow =
                    wrapperCell.parentElement;

                const headerRow =
                    wrapperRow.previousElementSibling;

                if (headerRow) {

                    const cell =
                        headerRow.querySelector(
                            'td[data-is-header="true"]'
                        );

                    if (cell) {
                        cell.click();
                    }
                }

            } catch (e) {

                console.error(
                    'Error triggering click',
                    e
                );
            }
        }
    };

    /******************************
    * Module: observers
    ******************************/
    const observers = (() => {

        function getActivityRoot() {

            return (
                document.querySelector(
                    '.ibo-activity-entry-list'
                ) ||

                document.querySelector(
                    '.ibo-activity-panel--content'
                ) ||

                document.body
            );
        }

        const activityObs =
            new MutationObserver(
                muts => {

                    let touched = false;

                    for (const m of muts) {

                        if (
                            !m.addedNodes.length
                        ) {
                            continue;
                        }

                        for (
                            const n of m.addedNodes
                        ) {

                            if (
                                n.nodeType === 1
                            ) {

                                if (
                                    n.matches?.(
                                        '.ibo-activity-entry'
                                    ) ||

                                    n.querySelector?.(
                                        '.ibo-activity-entry--main-information-content'
                                    )
                                ) {

                                    tables.processIn(
                                        n
                                    );

                                    touched =
                                        true;
                                }
                            }
                        }
                    }

                    if (touched) {

                        setTimeout(
                            () =>
                                tables.processIn(
                                    getActivityRoot()
                                ),
                            120
                        );
                    }

                    globalToggler.init();
                }
            );

        const tablesObs =
            new MutationObserver(
                muts => {

                    if (
                        muts.some(
                            m =>
                                m.addedNodes.length >
                                0
                        )
                    ) {
                        tables.processAll();
                    }
                }
            );

        const privateObs =
            new MutationObserver(
                muts => {

                    if (
                        muts.some(
                            m =>
                                m.addedNodes.length >
                                0
                        )
                    ) {

                        templates.addSelector();

                        controller
                            .ensureDefaultTemplateNow();

                        publicCleaner.bindAll();

                        privateForm
                            .makeCollapsible();
                    }
                }
            );

        const editorsObs =
            new MutationObserver(
                util.debounce(
                    muts => {

                        let trigger =
                            false;

                        for (
                            const m of muts
                        ) {

                            for (
                                const n of m.addedNodes
                            ) {

                                if (
                                    n.nodeType ===
                                    1 &&

                                    (
                                        n.classList?.contains(
                                            'ck-editor'
                                        ) ||

                                        n.querySelector?.(
                                            '.ck-editor__editable'
                                        )
                                    )
                                ) {

                                    trigger =
                                        true;

                                    break;
                                }
                            }

                            if (trigger) break;
                        }

                        if (trigger) {

                            log.L(
                                "Editor CKEditor 5 detectado -> selector + ensure + collapsible"
                            );

                            templates.addSelector();

                            publicCleaner.bindAll();

                            controller
                                .ensureDefaultTemplateNow();

                            privateForm
                                .makeCollapsible();
                        }
                    },
                    120
                )
            );

        const editorGoneObs =
            new MutationObserver(
                () => {

                    const wrap =
                        document.querySelector(
                            '[data-attribute-code="private_log"]'
                        );

                    if (!wrap) return;

                    const hasEditor =
                        !!wrap.querySelector(
                            '.ck-editor__editable'
                        );

                    if (!hasEditor) {

                        delete wrap.dataset
                            .defaultInserted;
                    }
                }
            );

        function start() {

            activityObs.observe(
                getActivityRoot(),
                {
                    childList: true,
                    subtree: true
                }
            );

            tablesObs.observe(
                document.body,
                {
                    childList: true,
                    subtree: true
                }
            );

            privateObs.observe(
                document.body,
                {
                    childList: true,
                    subtree: true
                }
            );

            editorsObs.observe(
                document.body,
                {
                    childList: true,
                    subtree: true
                }
            );

            editorGoneObs.observe(
                document.body,
                {
                    childList: true,
                    subtree: true
                }
            );
        }

        return {
            start
        };
    })();

    /******************************
    * Module: events
    ******************************/
    (function wireEvents() {

        /*
         * Interceptador de validación de doble log
         * (Fase de captura)
         */
        document.addEventListener(
            'click',
            e => {

                const btn =
                    e.target.closest(
                        SEND_BTN_SEL
                    );

                if (!btn) return;

                /*
                 * Si estamos enviando estando en el LOG PÚBLICO,
                 * aseguramos vaciar el privado si no se modificó.
                 */
                if (
                    util.isPublicTabActive()
                ) {

                    controller
                        .clearPrivateIfPublicExists();
                }

                if (
                    btn.__itsm_bypassDoubleCheck
                ) {
                    return;
                }

                if (
                    controller.hasDoubleLogContent()
                ) {

                    e.preventDefault();
                    e.stopImmediatePropagation();

                    UI.confirm(

                        `Hay contenido redactado <b>TANTO</b> en el <span style="color:green;font-weight:600">LOG PÚBLICO</span> como en el <span style="color:#932866;font-weight:600">LOG PRIVADO.</span><br><br>
                        Si continúas, se enviarán <u><b>AMBOS</b></u> textos de forma simultánea.<br><br>
                        ¿Estás seguro de que deseas realizar este envío doble?`,

                        () => {

                            btn.__itsm_bypassDoubleCheck =
                                true;

                            btn.click();

                            btn.__itsm_bypassDoubleCheck =
                                false;
                        },

                        () => {

                            log.L(
                                "Envío doble cancelado de forma segura por el operador."
                            );
                        }
                    );
                }
            },
            true
        );

        /*
         * Cambio de pestañas
         */
        document.addEventListener(
            'click',
            e => {

                const t =
                    e.target.closest(
                        '.ibo-activity-panel--tab-toggler'
                    );

                if (!t) return;

                const which =
                    t.dataset
                        .caselogAttributeCode;

                setTimeout(
                    () => {

                        if (
                            which ===
                            'public_log'
                        ) {

                            controller
                                .clearPrivateIfPublicExists();

                        } else if (
                            which ===
                            'private_log'
                        ) {

                            const wrap =
                                document.querySelector(
                                    '[data-attribute-code="private_log"]'
                                );

                            if (wrap) {

                                delete wrap.dataset
                                    .defaultInserted;
                            }

                            /*
                             * Solo prepara el editor.
                             * NO inserta plantilla.
                             */
                            controller
                                .ensureDefaultTemplateNow();
                        }

                        globalToggler.init();

                    },
                    100
                );
            }
        );

        /*
         * Post-Envío
         */
        document.addEventListener(
            'click',
            e => {

                const btn =
                    e.target.closest(
                        SEND_BTN_SEL
                    );

                if (
                    !btn ||
                    e.defaultPrevented
                ) {
                    return;
                }

                const inPrivate =
                    !!btn.closest(
                        '[data-attribute-code="private_log"]'
                    ) ||
                    util.isPrivateTabActive();

                if (!inPrivate) {
                    return;
                }

                const wrap =
                    document.querySelector(
                        '[data-attribute-code="private_log"]'
                    );

                if (wrap) {
                    wrap.dataset.justSent =
                        '1';
                }

                controller
                    .resetInsertionFlags();

                /*
                 * No auto-rellenar después del envío.
                 * El próximo Private Log empezará vacío.
                 */
                setTimeout(
                    () =>
                        controller
                            .ensureTemplateIfEmptySoon(),
                    100
                );
            }
        );

        /*
         * Cancelación
         */
        document.addEventListener(
            'click',
            e => {

                const btn =
                    e.target.closest(
                        CANCEL_BTN_SEL
                    );

                if (!btn) return;

                const inPrivate =
                    !!btn.closest(
                        '[data-attribute-code="private_log"]'
                    ) ||
                    util.isPrivateTabActive();

                if (!inPrivate) {
                    return;
                }

                controller
                    .resetInsertionFlags();
            }
        );

    })();

    /******************************
    * Boot
    ******************************/
    window.addEventListener(
        'load',
        () => {

            tables.processAll();

            templates.addSelector();

            /*
             * IMPORTANTE:
             * Esto ya NO introduce la plantilla.
             * Solo prepara el editor.
             */
            controller
                .ensureDefaultTemplateNow();

            ck.adjustHeight();

            publicCleaner.bindAll();

            privateForm
                .makeCollapsible();

            globalToggler.init();

            observers.start();
        }
    );

    window.addEventListener(
        'resize',
        () => {

            document
                .querySelectorAll(
                    '.collapsible-anim[data-open="1"]'
                )
                .forEach(
                    div => {
                        div.style.maxHeight =
                            'none';
                    }
                );
        }
    );

})();