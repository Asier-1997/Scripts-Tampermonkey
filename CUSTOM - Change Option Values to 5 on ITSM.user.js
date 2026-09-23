// ==UserScript==
// @name         CUSTOM - Change Option Values to 5 on ITSM
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Change all option values to 5 on itsm.mecalux.com except for hidden selects
// @author       Julian Villanueva
// @match        https://itsm.mecalux.com/pages/UI.php
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(async function () {
    console.log('Script executed at: ' + new Date().toISOString());

    // Await for synchronousWrapper to finish before proceeding
    await synchronousWrapper();

    // Select and filter <option> elements that match the desired condition
    const filteredOptions = Array.from(document.getElementsByTagName('option')).filter(option => {
        // Filter options with text '10' and whose parent <select> is NOT in a hidden <div>
        const parentSelect = option.parentElement;
        const parentDiv = findParentDiv(parentSelect);

        // Only return the options that are inside visible <div> elements
        return option.innerHTML === '10' && !isElementHidden(parentDiv);
    });

    // Use a Set to store unique <select> elements (parent of <option>)
    const modifiedSelects = new Set();

    // Update the filtered options and store their parent <select> elements
    filteredOptions.forEach(option => {
        console.log(option.value);
        option.value = 5;
        option.style.color = 'red';
        option.innerHTML = "5";

        // Add the parent <select> to the Set of modified selects
        const parentSelect = option.parentElement;
        modifiedSelects.add(parentSelect);
    });

    console.log('All relevant option values have been changed to 5.');

    // Reload only the modified <select> elements that haven't been excluded
    reloadModifiedSelects(modifiedSelects);
})();

// Function to find the parent <div> of a given element (e.g. <select>)
function findParentDiv(element) {
    let currentElement = element;
    while (currentElement && currentElement.tagName !== 'DIV') {
        currentElement = currentElement.parentElement;
    }
    return currentElement;
}

// Function to check if a given element (e.g. <div>) is hidden (has display: none)
function isElementHidden(element) {
    return element && window.getComputedStyle(element).display === 'none';
}

// Simulate fetching data asynchronously
function fetchDataSynchronously() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('Data fetched');
        }, 2000); // Simulate a 2-second delay
    });
}

// Function to reload only modified <select> elements by triggering the 'change' event
function reloadModifiedSelects(modifiedSelects) {
    // Iterate through the Set of modified <select> elements
    modifiedSelects.forEach(select => {
        // Trigger the change event to force re-render/update
        const event = new Event('change', { bubbles: true });
        select.dispatchEvent(event);

        console.log('Select tag change event dispatched for modified select:', select);
    });
}

// This wrapper waits for data to be fetched synchronously
async function synchronousWrapper() {
    console.log('Fetching data...');

    // Wait for the fetchDataSynchronously promise to resolve
    const data = await fetchDataSynchronously();

    console.log(data); // Data fetched message logged after 2 seconds
    console.log('Task completed');
}
