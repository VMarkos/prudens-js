// Update KB lines

function kbKeyListener(event) {
    "use strict";
    if (event.key.length === 1 ||  event.key === "Enter" || event.key === "Backspace" || event.key === "Delete") {
        setTimeout(() => {updateLineNumber("kb")});
    }
}

document.getElementById("kb").addEventListener("keyup", kbKeyListener, false);
document.getElementById("kb").addEventListener("paste", (event) => {setTimeout(() => {updateLineNumber("kb")}, 0);}, false);
document.getElementById("kb").addEventListener("cut", (event) => {setTimeout(() => {updateLineNumber("kb")}, 0);}, false);

function kbScrollListener(event) {
    document.getElementById("kb-lines").scrollTop = document.getElementById("kb").scrollTop;
}

document.getElementById("kb").addEventListener("scroll", kbScrollListener, false);

// Update Context lines

function contextKeyListener(event) {
    "use strict";
    if (event.key.length === 1 || event.key === "Enter" || event.key === "Backspace" || event.key === "Delete") {
        updateLineNumber("context");
    }
}

document.getElementById("context").addEventListener("keyup", contextKeyListener, false);
document.getElementById("context").addEventListener("paste", (event) => {setTimeout(() => {updateLineNumber("context")}, 0);}, false);
document.getElementById("context").addEventListener("cut", (event) => {setTimeout(() => {updateLineNumber("context")}, 0);}, false);

function contextScrollListener(event) {
    document.getElementById("context-lines").scrollTop = document.getElementById("context").scrollTop;
}

document.getElementById("context").addEventListener("scroll", contextScrollListener, false);