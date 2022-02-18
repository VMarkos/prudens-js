let ruleCount = 0;
const nodeRadius = 24;
let activeContextMenu = false;
let deactivatingClick = false;
let pendingException = false;
let startExceptionId = undefined;
let movingExceptionId = undefined;
let currentCx = undefined;
let currentCy = undefined;
let drawingArrow = false;
const edges = new Map();
const edgesTo = new Map();
const kb = new Map(); // Div elements ids as keys and {name: body: head: } as value.
let premiseCount = 0;

/*
TODO list:
1. Make "Delete" functional, by removing current target of the event.
2. Make "Add Exception" functional by adding a node that is clipped to cursor until another mousedown event occurs.
3. For the above, take also care to add an arrow that moves along as well.
4. Then, generate the corresponding KB (would a dynamic approach make sense or would it be better to have it all generated once the "Generate" button is pressed?)
*/

const svgDivContainer = document.getElementById("svg-div-container");
const svgContainer = document.getElementById("svg-container");

svgContainer.addEventListener("mouseup", placeNode, false);
updateViewBox();
    // window.onresize = updateViewBox;

window.addEventListener("mousedown", garbageCollector, false);

svgContainer.addEventListener("mousemove", moveException, false);

function moveException(event) {
    // console.log("Drawing?", drawingArrow);
    const rect = event.target.getBoundingClientRect();
    const mouseX = event.pageX - rect.left;// + window.scrollY;
    const mouseY = event.pageY - rect.top;// - window.scrollX;
    if (!pendingException) {
        return false;
    }
    // console.log(movingExceptionId);
    const arrow = document.getElementById(movingExceptionId)
    const dx = mouseX - arrow.getAttribute("x1");
    const dy = mouseY - arrow.getAttribute("y1");
    const theta = Math.atan(dy / dx);
    const shortenLength = Math.sign(dx) * 4;
    const normalizedRadius = -Math.sign(dx) * nodeRadius;
    arrow.setAttribute("x2", mouseX - shortenLength * Math.cos(theta));
    arrow.setAttribute("y2", mouseY - shortenLength * Math.sin(theta));
    arrow.setAttribute("x1", currentCx - normalizedRadius * Math.cos(theta));
    arrow.setAttribute("y1", currentCy - normalizedRadius * Math.sin(theta));
}

function garbageCollector(event) {
    // console.log(activeContextMenu);
    if (activeContextMenu && event.target.className !== "context-menu-item-container") {
        document.getElementById("context-menu").remove();
        activeContextMenu = false;
        deactivatingClick = true;
    }
    if (pendingException) {
        pendingException = false;
    }
    // if (drawingArrow) {
    //     // console.log(event.target);
    // }
}

function nodeContextMenu(event) {
    // console.log("Drawing in context?", drawingArrow);
    activeContextMenu = true;
    const rect = event.target.getBoundingClientRect();
    const node = event.target.parentElement;
    const mouseX = event.pageX;// - rect.left;// + window.scrollY;
    const mouseY = event.pageY;// - rect.top;// - window.scrollX;
    const bodyContainer = document.getElementById("body-container");
    const contextMenu = document.createElement("div");
    contextMenu.id = "context-menu";
    contextMenu.style.left = mouseX + "px";
    contextMenu.style.top = mouseY + "px";
    contextMenu.className = "context-menu";
    bodyContainer.appendChild(contextMenu);
    const options = ["Delete", "Add Exception", "Add Existing Exception..."];
    for (const option of options) {
        const optionElement = document.createElement("div");
        optionElement.className = "context-menu-item-container";
        optionElement.id = option.replaceAll(" ", "-").replaceAll(".", "");
        optionElement.innerHTML = option;
        // console.log(optionElement.id);
        contextMenu.appendChild(optionElement);
    }
    document.getElementById("Delete").onclick = function() {deleteNode(node);};
    document.getElementById("Add-Exception").onclick = function(event) {addException(event, node);};
    document.getElementById("Add-Existing-Exception").onclick = function(event) {addExistingException(event, node);};
    return false;
}

function addExistingException(event, startNode) {
    activeContextMenu = false;
    document.getElementById("context-menu").remove();
    let userInput = prompt("Enter existing rule's label:");
    const ruleNumber = userInput.trim().substring(1); // FIXME When the prompt box is 'Cancel'-ed, you get an error here (no element created).
    let nodeLabel = "node-" + ruleNumber;
    while (!document.getElementById(nodeLabel)) {
        userInput = prompt("Enter existing rule's label:");
        nodeLabel = "node-" + userInput.trim().substring(1);
    }
    const endNode = document.getElementById(nodeLabel + "-item");
    const startX = document.getElementById(startNode.id + "-item").getAttribute("cx");
    const startY = document.getElementById(startNode.id + "-item").getAttribute("cy");
    const endX = endNode.getAttribute("cx");
    const endY = endNode.getAttribute("cy");
    const theta = Math.atan((endY - startY) / (endX - startX));
    const endShorten = Math.sign(endX - startX) * (nodeRadius + 16);
    const startShorten = -Math.sign(endX - startX) * nodeRadius;
    const edgeLabel = "arrow-" + startNode.id + "-node-" + ruleNumber;
    movingExceptionId = edgeLabel;
    drawArrow(startX - startShorten * Math.cos(theta), startY - startShorten * Math.sin(theta), endX - endShorten * Math.cos(theta), endY - endShorten * Math.sin(theta));
    // console.log(edgeLabel);
    if (edges.has(startNode.id)) {
        edges.get(startNode.id).push(edgeLabel);
    } else {
        edges.set(startNode.id, [edgeLabel]);
    }
    // edges.get(startNode.id).push(edgeLabel);
    if (edgesTo.has("node-" + ruleNumber)) {
        edgesTo.get("node-" + ruleNumber).push(edgeLabel);
    } else {
        edgesTo.set("node-" + ruleNumber, [edgeLabel]);
    } // FIXME THere is some cannot read props error here...
}

function addException(event, startNode) {
    document.getElementById("context-menu").remove();
    activeContextMenu = false;
    deactivatingClick = false;
    const rect = event.target.getBoundingClientRect();
    const mouseX = event.pageX - rect.left;// + window.scrollY;
    const mouseY = event.pageY + rect.top;// - window.scrollX;
    startNodeItem = document.getElementById(startNode.id + "-item");
    const dx = mouseX - startNodeItem.getAttribute("cx");
    const dy = mouseY - startNodeItem.getAttribute("cy");
    const theta = Math.atan(dy / dx);
    const normalizedRadius = - Math.sign(dx) * nodeRadius;
    movingExceptionId = "arrow-" + startNode.id + "-node-" + ruleCount;
    // console.log(movingExceptionId);
    if (edges.has(startNode.id)) {
        edges.get(startNode.id).push(movingExceptionId);
    } else {
        edges.set(startNode.id, [movingExceptionId]);
    }
    drawArrow(startNodeItem.getAttribute("cx") - normalizedRadius * Math.cos(theta), startNodeItem.getAttribute("cy") - normalizedRadius * Math.sin(theta), mouseX, mouseY);
    currentCx = startNodeItem.getAttribute("cx");
    currentCy = startNodeItem.getAttribute("cy");
    pendingException = true;
    drawingArrow = true;
    startExceptionId = startNode.id;
}

function deleteNode(node) {
    document.getElementById("context-menu").remove();
    activeContextMenu = false;
    deactivatingClick = false;
    node.remove();
    // console.log("edges: ", edges.get(node.id));
    const nodeIdRE = /node-\d+/g;
    if (edges.has(node.id)) {
        for (const edge of edges.get(node.id)) {
            const tempEndNode = edge.match(nodeIdRE)[1];
            edgesTo.get(tempEndNode).splice(edgesTo.get(tempEndNode).indexOf(edge), 1);
            document.getElementById(edge).remove();
        }
        edges.delete(node.id);
    }
    if (edgesTo.has(node.id)) {
        // console.log("edgesTo.get(node.id)):", edgesTo.get(node.id));
        for (const edge of edgesTo.get(node.id)) {
            const tempStartNode = edge.match(nodeIdRE)[0];
            edges.get(tempStartNode).splice(edges.get(tempStartNode).indexOf(edge), 1);
            // console.log("edgeTo (edge):", edge);
            document.getElementById(edge).remove();
        }
        edgesTo.delete(node.id);
    }
}

function updateViewBox() {
    const parentWidth = svgDivContainer.offsetWidth;
    const parentHeight = svgDivContainer.offsetHeight;
    document.getElementById("svg-container").setAttribute("viewBox", "0 0 " + parentWidth + " " + parentHeight);
}

function constructKb() {
    const rootNodes = [];
    const headMap = new Map();
    for (const node of edges.keys()) {
        if (!edgesTo.has(node)) {
            rootNodes.push(node);
        }
    }
    if (rootNodes.length === 0) {
        return false;
    }
    for (const root of rootNodes) {
        forwardPropagation(root, headMap);
    }
    // console.log("headMap:", headMap);
    adjustHeads(headMap);
    const kbList = sortBySpecificity();
    console.log(vKbToString(kbList));
    const kbString = "@KnowledgeBase\n" + vKbToString(kbList);
    const kbPrudens = parseKB(kbString);
    return {
        kbString: kbString,
        kbSimple: kbList,
        kbFull: kbPrudens,
    };
}

function addStandaloneRule(nodeName) {
    const body = []
    const rootNodeSize = 2; // 3 is an arbitrary constant.
    for (let i=0; i<rootNodeSize; i++) {
        body.push("p" + premiseCount);
        premiseCount++;
    }
    const head = "p" + premiseCount;
    premiseCount++;
    const name = "R" + nodeName.substring(nodeName.indexOf("-") + 1);
    kb.set(nodeName, {
        name: name,
        body: body,
        head: head,
    })
}

function generateException(rule, nodeName, priorBody) {
    const newName = "R" + nodeName.substring(nodeName.indexOf("-") + 1);
    const negatedHead = negateHead(rule["head"]);
    let newBody = rule["body"];
    if (priorBody.length > 0) {
        newBody = newBody.concat(priorBody);
    } else {
        newBody = newBody.concat(["p" + premiseCount]);
        premiseCount++;
    }
    kb.set(nodeName, {
        name: newName,
        body: newBody,
        head: negatedHead,
    });
}

function forwardPropagation(nodeName, headMap) {
    addStandaloneRule(nodeName);
    const front = [nodeName];
    const nodeIdRE = /node-\d+/g;
    while (front.length > 0) {
        const currentNode = front.pop();
        // console.log("currentNode:", currentNode);
        if (!edges.has(currentNode)) {
            continue;
        }
        // console.log("edges:", edges);
        for (const edge of edges.get(currentNode)) {
            // console.log("edge:", edge);
            const childNodeName = edge.match(nodeIdRE)[1];
            if (kb.has(childNodeName)) {
                const oldHead = kb.get(childNodeName)["head"];
                generateException(kb.get(currentNode), childNodeName, kb.get(childNodeName)["body"]); // TODO Potentail issues with heads here!
                // console.log("childNodeName:", childNodeName, "\ncurrentNode:", currentNode);
                // console.log("KB:", kbToString(kb));
                if (!headMap.has(oldHead)) {
                    headMap.set(oldHead, negateHead(kb.get(currentNode)["head"]));
                }
            } else {
                generateException(kb.get(currentNode), childNodeName, []);
            }
            front.push(childNodeName);
        }
    }
}

function adjustHeads(headMap) { // FIXME Greedy implementation, needs to be refined.
    for (let oldHead of headMap.keys()) {
        // console.log("(iter) headMap:", headMap, "\noldHead:", oldHead);
        let newHead = headMap.get(oldHead);
        const newSign = newHead.charAt(0) === "-";
        const oldSign = oldHead.charAt(0) === "-";
        if (oldHead.charAt(0) === "-") {
            oldHead = oldHead.substring(1);
        }
        if (newHead.charAt(0) === "-") {
            newHead = newHead.substring(1);
        }
        if (newSign === oldSign) {
            for (const node of kb.keys()) {
                const nodeHead = kb.get(node)["head"];
                if (nodeHead === oldHead || nodeHead === negateHead(oldHead)) {
                    kb.get(node)["head"] = nodeHead.replace(oldHead, newHead);    
                }
            }
        } else {
            for (const node of kb.keys()) {
                const nodeHead = kb.get(node)["head"];
                console.log("nodeHead:", nodeHead);
                if (nodeHead === oldHead || nodeHead === negateHead(oldHead)) {
                    // console.log("newHead:", newHead);
                    // nodeHead = nodeHead.replace(oldHead, newHead);
                    // console.log("(replace) nodeHead:", nodeHead);
                    kb.get(node)["head"] = negateHead(nodeHead).replaceAll(oldHead, newHead);
                }
            }
        }
    }
}

function sortBySpecificity() { // FIXME Dummy sorting algorithm.
    const kbList = [];
    for (const rule of kb.values()) {
        kbList.push(rule);
    }
    console.log("kbList:", kbList);
    return kbList.sort((a, b) => {return a["body"].length - b["body"].length;});
}

function negateHead(head) {
    if (head.charAt(0) === "-") {
        return head.substring(1);
    }
    return "-" + head;
}

function vRuleToString(rule) {
    let outputString = rule["name"] + " :: ";
    for (let i=0; i<rule["body"].length; i++) {
        const literal = rule["body"][i];
        if (i < rule["body"].length - 1) {
            outputString += literal + ", ";
        } else {
            outputString += literal + " implies " + rule["head"] + ";";
        }
    }
    return outputString;
}

function vKbToString(kbList) {
    let outputString = "";
    console.log("kb:", kbList);
    for (const rule of kbList) {
        console.log("rule:", rule);
        outputString += vRuleToString(rule) + "\n";
    }
    return outputString;
}

function placeNode(event) {
    // console.log(event.target);
    // console.log("Pending outside:", pendingException);
    // console.log("(ext) Drawing?", drawingArrow);
    if (event.target.id === "grid-rect" && !activeContextMenu && !deactivatingClick) {
        // console.log("Pending inside:", pendingException);
        const rect = event.target.getBoundingClientRect();
        const mouseX = event.pageX - rect.left;// + window.scrollY;
        const mouseY = event.pageY - rect.top;// - window.scrollX;
        let shiftX = 0;
        let shiftY = 0;
        if (drawingArrow) {
            // console.log("pending");
            const arrow = document.getElementById(movingExceptionId)
            const dx = mouseX - arrow.getAttribute("x1");
            const dy = mouseY - arrow.getAttribute("y1");
            const theta = Math.atan(dy / dx);
            const shortenLength = Math.sign(dx) * (nodeRadius + 12);
            shiftX = shortenLength * Math.cos(theta);
            shiftY = shortenLength * Math.sin(theta);
            if (edgesTo.has("node-" + ruleCount)) {
                edgesTo.get("node-" + ruleCount).push(movingExceptionId);
            } else {
                edgesTo.set("node-" + ruleCount, [movingExceptionId]);
            }
        }
        addNodeAt(mouseX + shiftX, mouseY + shiftY, nodeRadius, ruleCount);
        ruleCount++;
    }
    if (deactivatingClick) {
        deactivatingClick = false;
    }
    if (pendingException && !drawingArrow) {
        pendingException = false;
    }
    if (drawingArrow) {
        drawingArrow = false;
    }
}

function addNodeAt(x, y, r, id) {
    const svg = document.getElementById("graph-container");
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", "node-" + id);
    const newNode = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    newNode.setAttribute("id", "node-" + id + "-item");
    newNode.setAttribute("cx", x);
    newNode.setAttribute("cy", y);
    newNode.setAttribute("r", r);
    newNode.style.stroke = "#5c007a";
    newNode.style.strokeWidth = "2";
    newNode.style.fill = "#e6ceff";
    g.appendChild(newNode);
    const newLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    newLabel.setAttribute("id", "node-" + id + "-label");
    newLabel.setAttribute("x", x);
    newLabel.setAttribute("y", y);
    newLabel.setAttribute("text-anchor", "middle");
    newLabel.setAttribute("dominant-baseline", "middle");
    newLabel.style.stroke = "#5c007a";
    newLabel.style.strokeWidth = "1px";
    newLabel.style.fill = "#5c007a";
    newLabel.style.fontFamily = "monospace";
    newLabel.innerHTML = "R" + id;
    newLabel.style.cursor = "pointer";
    newNode.style.cursor = "pointer";
    newNode.setAttribute("onclick", "nodeContextMenu(event)");
    newLabel.setAttribute("onclick", "nodeContextMenu(event)");
    // newNode.setAttribute("oncontextmenu", "nodeContextMenu(event)");
    g.appendChild(newLabel);
    svg.appendChild(g);
}

function drawArrow(x_i, y_i, x_f, y_f) {
    const svg = document.getElementById("graph-container");
    const newArrow = document.createElementNS("http://www.w3.org/2000/svg", "line");
    newArrow.setAttribute("id", movingExceptionId);
    newArrow.setAttribute("x1", x_i);
    newArrow.setAttribute("x2", x_f);
    newArrow.setAttribute("y1", y_i);
    newArrow.setAttribute("y2", y_f);
    newArrow.style.stroke = "#5c007a";
    newArrow.style.strokeWidth = "4px";
    newArrow.setAttribute("marker-end", "url(#pointer)");
    svg.appendChild(newArrow);
}

function nodeClick(event) {
    const rect = event.target.getBoundingClientRect();
    const mouseX = event.pageX - rect.left;// + window.scrollY;
    const mouseY = event.pageY - rect.top;// - window.scrollX;
    // console.log(mouseX, mouseY);
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