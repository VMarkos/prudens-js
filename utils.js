let tab = "deduce-tab";

function initialize() {
    document.getElementById("exec-button").value = "Deduce!";
    document.getElementById("context-label").value = "Context";
}

function infer() {
    "use strict";
    if (tab === "deduce-tab") {
        return deduce();
    }
    else if (tab === "abduce-tab") {
        return abduce();
    }
}

function abduce() {
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
    const targetsObject = targetParser();
    if (targetsObject["type"] === "error") {
        return "ERROR: " + targetsObject["name"] + ":\n" + targetsObject["message"];
    }
    const domainsObject = domainsParser();
    if (domainsObject["type"] === "error") {
        return "ERROR: " + domainsObject["name"] + ":\n" + domainsObject["message"];
    }
    const output = greedyPropositionalAbduction(kbObject, contextObject["context"], targetsObject["targets"]); // TODO This version of abduction handles only one target --- a simple loop could fix this.
    console.log(domainsObject);
    // const output = greedyRelationalAbduction(kbObject, contextObject["context"], targetsObject["targets"][0], domainsObject["predicates"]);
    // console.log(output);
    const outputString = "";
    if (warnings.length > 0) {
        outputString += "Warnings:\n";
    }
    for (const warning of warnings) {
        outputString += warning["name"] + ": " + warning["message"] + "\n";
    }
    // console.log(graph);
    return outputString + "Missing Facts: " +  abductiveProofsToString(output);
}

function deduce() {
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
    // console.log(kbObject);
    // console.log(contextObject); // TODO fix some context parsing issue (in propositional cases it includes the semicolon into the name of the prop)
    const output = forwardChaining(kbObject, contextObject["context"]);
    const inferences = output["facts"];
    const graph = output["graph"];
    // console.log("Inferences:");
    // console.log(inferences);
    const outputString = "";
    if (warnings.length > 0) {
        outputString += "Warnings:\n";
    }
    for (const warning of warnings) {
        outputString += warning["name"] + ": " + warning["message"] + "\n";
    }
    // console.log(graph);
    return outputString + "Context: " + contextToString(contextObject["context"]) + "\nInferences: " + contextToString(inferences) + "\nGraph: " + graphToString(graph);
}

function consoleOutput() {
    "use strict";
    let newText;
    // if (document.getElementById("exec-button").innerHTML != "Deduce!") {
    newText = "I am currently not working - wait for some next update!\n\nThanks for your patience! :)";
    // } else {
    newText = infer();
    // }
    const previous = document.getElementById(tab + "-console").value;
    document.getElementById(tab + "-console").value = previous + newText + "\n~$ ";
    if (document.getElementById("download-checkbox").checked) {
        download("output.txt", newText);
    }
}

function clearConsole() {
    "use strict";
    document.getElementById(tab + "-console").value = "~$ ";
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
    tab = tabName;
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