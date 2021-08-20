function initialize() {
    document.getElementById("exec-button").value = "Deduce!";
    document.getElementById("context-label").value = "Context";
}

function infer() {
    "use strict";
    const kbObject = kbParser();
    if (kbObject["type"] === "error") {
        return "ERROR: " + kbObject["name"] + ":\n" + kbObject["message"];
    }
    const warnings = kbObject["warnings"];
    const contextObject = contextParser();
    if (contextObject["type"] === "error") {
        return "ERROR: " + contextObject["name"] + ":\n" + contextObject["message"];
    }
    // console.log(kb);
    // console.log(context);
    const output = forwardChaining(kbObject["kb"], contextObject["context"]);
    const inferences = output["facts"];
    const graph = output["graph"];
    // console.log("Inferences:");
    // console.log(inferences);
    const outputString = "";
    if (warnings.length > 0) {
        outputString += "Warnings:\n"
    }
    for (const warning of warnings) {
        outputString += warning["name"] + ": " + warning["message"] + "\n";
    }
    // console.log(graph);
    return outputString + "Inferences: " +  contextToString(inferences) + "\nGraph: " + graphToString(graph);
}

function consoleOutput() {
    "use strict";
    let newText;
    if (document.getElementById("exec-button").innerHTML != "Deduce!") {
        newText = "I am currently not working - wait for some next update!\n\nThanks for your patience! :)"
    } else {
        newText = infer();
    }
    const previous = document.getElementById("console").value;
    document.getElementById("console").value = previous + newText + "\n~$ ";
    if (document.getElementById("download-checkbox").checked) {
        download("output.txt", newText);
    }
}

function clearConsole() {
    "use strict";
    document.getElementById("console").value = "~$ ";
}

function deepCopy(object) { // This is a level 1 deep copy --- i.e. if some value is itself another JS-object, it will be copied in a shallow manner.
    "use strict";
    const copycat = {};
    for (const key of Object.keys(object)) {
        copycat[key] = object[key];
    }
    return copycat;
}

function removeAll(list, toBeRemoved) {
    "use strict";
    if (toBeRemoved.length == 0) {
        return list;
    }
    for (let i=0; i<list.length; i++) {
        if (toBeRemoved.includes(list[i])) { // Shallow check, might need rivision!
            list.splice(i, 1);
            i--;
        }
    }
    return list;
}

function deepEquals(x, y) { // x, y are objects --- possibly restricted version of deep equality for our purposes only!
    "use strict";
    if (typeof x != typeof y) {
        return false;
    }
    if (!(typeof x == "object")) {
        return x === y;
    }
    const xKeys = Object.keys(x);
    const yKeys = Object.keys(y);
    if (xKeys.length != yKeys.length) {
        return false;
    }
    for (let i=0; i<xKeys.length; i++) {
        let xi = x[xKeys[i]];
        let yi = y[yKeys[i]];
        if (xKeys[i] != yKeys[i] || (typeof xi !== "object" && xi != yi) || !deepEquals(xi, yi)) {
            return false;
        }
    }
    return true;
}

function arrayDeepEquals(x, y) { // x, y are arrays --- not used as of now!
    "use strict";
    if (x.length != y.length) {
        return false;
    }
    for (let i=0; i<x.length; i++) {
        if (!deepEquals(x[i], y[i])) {
            return false;
        }
    }
    return true;
}

function deepIncludes(object, list) { //Re-implementation of Array.prototype.includes() that check at depth=1 for equal objects.
    "use strict";
    for (const entry of list) {
        if (deepEquals(object, entry)) {
            return true;
        }
    }
    return false;
}

function toc() {
    "use strict";
    const headings = document.getElementById("main-body").querySelectorAll(["h2", "h3"]);
    let tableOfContents = "<div class=\"toc-ul\"><ul>";
    for (const heading of headings) {
        heading.setAttribute("id", beautifyTOC(heading.textContent));
        tableOfContents += "<li><div class=\"toc-entry\"><a href=\"#" + heading.id + "\"><div class=\"toc-link\">" + heading.textContent + "</div></a></div></li>"
    }
    // console.log(tableOfContents);
    document.getElementById("toc").innerHTML = tableOfContents + "</ul></div>";
}

function beautifyTOC(title) {
    "use strict";
    const delimeter = /\s+/;
    const titleArray = title.split(delimeter);
    let beautifulTitle = "";
    for (let i=0; i<titleArray.length-1; i++) {
        beautifulTitle += titleArray[i] + "-";
    }
    beautifulTitle += titleArray[titleArray.length-1];
    return beautifulTitle;
}

function updateLineNumber(id) {
    "use strict";
    const textArea = document.getElementById(id)
    const cursorStart = textArea.selectionStart;
    const cursorEnd = textArea.selectionEnd;
    const lines = textArea.value;
    // console.log(lines);
    // console.log(id);
    // const changeLine = /\r?\n/;
    // const numLines = lines.split(changeLine).length;
    const initHeight = textArea.style.height;
    textArea.style.height = 1 + "px";
    const textHeight = parseInt(textArea.scrollHeight);
    // console.log(textHeight);
    textArea.value = "a";
    const firstLineLength = parseInt(textArea.scrollHeight);
    textArea.value = "a\na";
    const secondLineLength = parseInt(textArea.scrollHeight);
    // console.log(firstLineLength);
    // console.log(secondLineLength);
    textArea.value = lines;
    textArea.selectionStart = cursorStart;
    textArea.selectionEnd = cursorEnd;
    const lineHeight = secondLineLength - firstLineLength;
    // console.log(lineHeight);
    const numLines = Math.floor(textHeight/lineHeight);
    textArea.style.height = initHeight;
    let newLines = "";
    for (let i=1; i<=numLines; i++) {
        newLines += "" + i + "\n";
    }
    // console.log(numLines);
    // console.log(newLines);
    document.getElementById(id + "-lines").value = newLines;
}

function tabChanger(event, tabName) {
    "use strict";
    const tabsLeft = document.getElementsByClassName("tab-left");
    const tabsRight = document.getElementsByClassName("tab-right");
    for (let i=0; i<tabsLeft.length; i++) {
        tabsLeft[i].style.display = "none";
        tabsRight[i].style.display = "none";
    }
    const tabLinks = document.getElementsByClassName("tablink");
    for (let i=0; i<tabsLeft.length; i++) {
        tabLinks[i].className = tabLinks[i].className.replace(" selected", "");
    }
    // console.log(tabName);
    tabName = tabName.replace("-tab", "");
    // console.log(tabName);
    document.getElementById(tabName + "-left").style.display = "block";
    document.getElementById(tabName + "-right").style.display = "grid";
    document.getElementById(tabName + "-tab").className += " selected";
    // event.currentTarget.firstElementChild.className += " selected";
    // if (tabName === "Deduce") {
    //     document.getElementById("context-label").innerHTML = "Context";
    //     document.getElementById("exec-button").innerHTML = "Deduce!";
    //     document.getElementById("deduce-tab").className += " selected";
    //     document.getElementById("abduce-tab").className = "tab-button";
    // } else {
    //     document.getElementById("context-label").innerHTML = "Targets";
    //     document.getElementById("exec-button").innerHTML = "Abduce!";
    //     document.getElementById("abduce-tab").className += " selected";
    //     document.getElementById("deduce-tab").className = "tab-button";
    // }
}

function download(filename, content) {
    let element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
