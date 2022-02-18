# KB Generator
A simple UI to automatically generate Knowledge Bases based on exception graphs. Current version's source code found [here](/kb_generator).

## Definitions
KB Generator is a UI that allows users to design *propositional* knowledge bases by providing the corresponding Exception Graph of the knowledge base. Given a knowledge base (KB), the corresponding (unweighted) Exception Graph (EG) is a graph with rules as its nodes and edges connecting any two direct exceptions, where by *direct exceptions* we refer to these pairs of rule, *(r,s)* such that *r* and *s* have conflicting heads and the body of *s* is a minimal superset of the body of *r* (with respect to set inclusion).

## How-to
The interface of KB Generator is quite intuitive. The basic actions allowed by the interface are summarized below:
1. By clicking anywhere on the drawing area (the gridded part of the screen), a node is placed at the cursor's position.
2. By clicking on a node a list of options appears. Namely:
   - `Delete`: Deletes node as well as all nodes starting or ending to it.
   - `Add Exception`: Adds an arrow starting from the current (clicked) node and pointing to the cursor's position. Once the user clicks again on the drawing area, a new node is positioned and the arrow is fixed. *For several open bugs regarding node positioning see [Warnings & Known Bugs](#warnings--known-bugs).*
   - `Add Existing Exception...`: Opens a pop-up dialog box where the user is prompted to enter the label of an already existing node. Then, an arrow is drawn between the current (clicked) and the specified node.

In the following `.gif`s you may see the two available ways to create an exception (inserting a new exception and connecting existing nodes, respectively).
| Drawing New Exception | Drawing Existing Exception |
| --- | --- |
| ![Drawing a new exception](/assets/kb_generator/new_exc.gif) | ![Drawing an existing exception](/assets/kb_generator/ex_exc.gif) |

## Output
Having designed a graph on the drawing area, pressing the "Generate" button prompts you to download a `.json` file. The contents of the file have the following structure:
```
"kbString": "String representation of the knowledge base",
"kbSimple": [
   {
      "name": "R0",
      "body": [
        "p0",
        "p1"
      ],
      "head": "p6"
    },
    ... // Similarly...
],
"kbFull": // See below...
```
For more about the value of the `kbFull` key see [here](https://github.com/VMarkos/prudens-js#parsekbkb) - it is actually the full internal representation of a knowledge base as used by Prudens and all its (sub)components.

## Warnings & Known Bugs
- [ ] On window resize, the drawing panel's axes rescale, leading to unexpected behavior regarding node and arrow positioning.
- [ ] When choosing the "Cancel" option in the "Add Existing Exception..." dialogue box, there might be observed unexpected behaviors regarding rule namings - yet, nothing significant has been observed so far.
- [ ] When hovering over existing nodes while drawing a new exception through the "Add Exception" option, arrows are temporarily dislocated.
- [ ] Exception Graphs that correspond to some prioritized knowledge base are a strict subset of all directed acyclic graphs, however the current implementation of the UI allows for any graph to be inserted, leading to unexpected behavior when incosistent EGs are drawn.
- [ ] Once drawn through the "Add Exception" option, arrows are positioned away from the current cursor position - this is resolved on cursor's move, however.
