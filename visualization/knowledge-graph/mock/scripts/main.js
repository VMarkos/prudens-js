const unveilOnClick = {
    "z": ["r2", "r3", "c", "d", "e", "r2-z", "r3-z", "c-r2", "d-r2", "d-r3", "e-r3"],
    "e": ["r1", "a", "b", "r1-e", "a-r1", "b-r1"],
};

function unveil(event) {
    let targetId = event.target.id;
    if (targetId.includes("-label")) {
        targetId = targetId.substring(0, targetId.indexOf("-"));
    }
    let currentElement;
    for (const elementId of unveilOnClick[targetId]) {
        currentElement = document.getElementById(elementId);
        currentElement.style.visibility = "visible";
        if (!elementId.includes("-")) {
            currentElement = document.getElementById(elementId + "-label");
            currentElement.style.visibility = "visible";
        } else {
            currentElement = document.getElementById(elementId + "-label");
        }
    }
}

function hideAll() {
    const svgChildren = document.getElementById("g").childNodes;
    for (const child of svgChildren) {
        if (child.id === undefined || child.id === "" || child.id === "z" || child.id === "z-label") {
            continue;
        }
        child.style.visibility = "hidden";
    }
}

function initClickEvents() {
    let element;
    for (const id of Object.keys(unveilOnClick)) {
        element = document.getElementById(id);
        element.addEventListener("click", unveil);
        element = document.getElementById(id + "-label");
        element.addEventListener("click", unveil);
    }
}

function init() {
    hideAll();
    initClickEvents();
}

window.onload = init;