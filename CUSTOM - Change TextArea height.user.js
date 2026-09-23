// ==UserScript==
// @name         CUSTOM - Change TextArea height
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  In incident webpages, change height to 400px.
// @author       Julian Villanueva
// @match        https://itsm.mecalux.com/pages/UI.php?stimulus=ev_resolve&class=Incident&operation=stimulus&id=*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(async function () {
    console.log("Script executed at: " + new Date().toISOString());

    await synchronousWrapper();

    // Select and filter <span> elements that match the desired condition
    console.log(document.getElementById("cke_2_contents"));
    document.getElementById("cke_2_contents").style.height = "400px";
    console.log(document.getElementById("cke_1_contents"));
    document.getElementById("cke_1_contents").style.height = "400px";

})();

// This wrapper waits for data to be fetched synchronously
async function synchronousWrapper() {
    console.log('Fetching data...');

    // Wait for the fetchDataSynchronously promise to resolve
    const data = await fetchDataSynchronously();

    console.log(data); // Data fetched message logged after 2 seconds
    console.log('Task completed');
}

// Simulate fetching data asynchronously
function fetchDataSynchronously() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('Data fetched');
        }, 2000); // Simulate a 2-second delay
    });
}