// ==UserScript==
// @name         CUSTOM - Remove Useless Tabs ORGANIZATION
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  In incident webpages, remove useless tabs.
// @author       Julian Villanueva
// @match        https://itsm.mecalux.com/pages/UI.php?operation=details&class=Organization*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(async function () {
  console.log("Script executed at: " + new Date().toISOString());

  let tabToDelete = [
    "OVERVIEW",
    "USER REQUEST LIST",
    "CONTRACT FEES",
    "WITHOUT CONTRACT FEES",
    "CHILDS ORGANIZATION LIST",
    "NOTIFICATIONS"
  ];

  // Select and filter <span> elements that match the desired condition
  const filteredSpan = Array.from(document.getElementsByTagName("span")).filter(
    (option) => {
      return tabToDelete.includes(option.innerHTML.toUpperCase());
    }
  );

  let filteredSpanParentUl = new Set();

  filteredSpan.forEach(span => {
    let filter = findParentUl(span);
    // Check if the UL has a role and only add if it's a 'tablist'
    if (filter && filter.role && filter.role.toUpperCase() === "TABLIST") {
      filteredSpanParentUl.add(span.parentElement.parentElement);
    }
  });

  // Remove each <ul> that contains the unwanted tabs
  filteredSpanParentUl.forEach(ul => {
    ul.remove(); // Fixed from Remove() to remove()
  });

})();

// Function to find the parent <ul> of a given element
function findParentUl(element) {
  let currentElement = element;
  while (currentElement && currentElement.tagName !== "UL") {
    currentElement = currentElement.parentElement;
  }
  return currentElement;
}
