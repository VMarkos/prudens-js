// Update KB lines

// FIXME This doesn't work for abduction tab!

const tabs = ["deduce-tab", "abduce-tab"]


function kbKeyListener(event) {
    "use strict";
    if (event.key.length === 1 ||  event.key === "Enter" || event.key === "Backspace" || event.key === "Delete") {
        setTimeout(() => {updateLineNumber(tab + "-kb")});
    }
}

for (const tab of tabs) {
    document.getElementById(tab + "-kb").addEventListener("keyup", kbKeyListener, false);
    document.getElementById(tab + "-kb").addEventListener("paste", (event) => {setTimeout(() => {updateLineNumber(tab + "-kb")}, 0);}, false);
    document.getElementById(tab + "-kb").addEventListener("cut", (event) => {setTimeout(() => {updateLineNumber(tab + "-kb")}, 0);}, false);
    document.getElementById(tab + "-kb").addEventListener("scroll", kbScrollListener, false);
}

function kbScrollListener(event) {
    document.getElementById(tab + "-kb-lines").scrollTop = document.getElementById(tab + "-kb").scrollTop;
}

// Update Context lines

function contextKeyListener(event) {
    "use strict";
    if (event.key.length === 1 || event.key === "Enter" || event.key === "Backspace" || event.key === "Delete") {
        updateLineNumber(tab + "-context");
    }
}

for (const tab of tabs) {
    document.getElementById(tab + "-context").addEventListener("keyup", contextKeyListener, false);
    document.getElementById(tab + "-context").addEventListener("paste", (event) => {setTimeout(() => {updateLineNumber(tab + "-context")}, 0);}, false);
    document.getElementById(tab + "-context").addEventListener("cut", (event) => {setTimeout(() => {updateLineNumber(tab + "-context")}, 0);}, false);
    document.getElementById(tab + "-context").addEventListener("scroll", contextScrollListener, false);
}

function contextScrollListener(event) {
    document.getElementById(tab + "-context-lines").scrollTop = document.getElementById(tab + "-context").scrollTop;
}

// Update Target lines

function targetKeyListener(event) {
    "use strict";
    if (event.key.length === 1 || event.key === "Enter" || event.key === "Backspace" || event.key === "Delete") {
        updateLineNumber(tab + "-targets");
    }
}

document.getElementById("abduce-tab-targets").addEventListener("keyup", targetKeyListener, false);
document.getElementById("abduce-tab-targets").addEventListener("paste", (event) => {setTimeout(() => {updateLineNumber("abduce-tab-targets")}, 0);}, false);
document.getElementById("abduce-tab-targets").addEventListener("cut", (event) => {setTimeout(() => {updateLineNumber("abduce-tab-targets")}, 0);}, false);
document.getElementById("abduce-tab-targets").addEventListener("scroll", contextScrollListener, false);

function contextScrollListener(event) {
    document.getElementById(tab + "-targets-lines").scrollTop = document.getElementById(tab + "-targets").scrollTop;
}

// Update Domains lines

function domainKeyListener(event) {
    "use strict";
    if (event.key.length === 1 || event.key === "Enter" || event.key === "Backspace" || event.key === "Delete") {
        updateLineNumber(tab + "-domains");
    }
}

document.getElementById("abduce-tab-domains").addEventListener("keyup", domainKeyListener, false);
document.getElementById("abduce-tab-domains").addEventListener("paste", (event) => {setTimeout(() => {updateLineNumber("abduce-tab-domains")}, 0);}, false);
document.getElementById("abduce-tab-domains").addEventListener("cut", (event) => {setTimeout(() => {updateLineNumber("abduce-tab-domains")}, 0);}, false);
document.getElementById("abduce-tab-domains").addEventListener("scroll", contextScrollListener, false);

function contextScrollListener(event) {
    document.getElementById(tab + "-domains-lines").scrollTop = document.getElementById(tab + "-domains").scrollTop;
}