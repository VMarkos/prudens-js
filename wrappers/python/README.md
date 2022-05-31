# Python Wrapper
A python script that allows for Prudens JS to be integrated into python 3 (tested in v.3.8.10).

## Dependencies
In order to use the above wrappers it is required to install the following:
1. `Node.js` - see [here](https://nodejs.org/en/download/package-manager/) for detailed instructions on this.
2. `PyExecJs` - installation via `pip` with `pip install PyExecJS`.

## About the script
Details regarding the usage of the script.
### Directory Structure
In order to have the script run properly, you need to have the following directory structure (where `root` is any directory, e.g. your project's working directory):
```bash
├── root
│   ├── abduction.js
│   ├── prudens.js
│   ├── parsers.js
│   ├── prudensUtils.js
│   ├── wrappers.js
│   ├── wrappers.py
└── # anything else related to your project
```
Regarding `wrappers.js`, it can be found [here](https://github.com/VMarkos/prudens-js) while the rest JavaScript files may be found [here](https://github.com/VMarkos/prudens-js/tree/main/wrappers/python).

### Functions
The script provides two functions, `deduce` and `abduce` which virtually mimic the corresponding JavaScript functions for deducation and abduction respectively - for Prudens JS's original documentation, see [here](https://github.com/VMarkos/prudens-js#readme).

#### `deduce(kb_string, context_string)`
Accepts two strings as arguments, one representing a knowledge base and one representing and context and yields the inference output or an error object in case of error - for more on how string representations of knowledge are parsed internally by Prudens, please consult [this](https://github.com/VMarkos/prudens-js#parsing).

#### `abduce(kb_string, target, *args)`
Accepts two strings as arguments, one representing a knowledge base and one representing a single propositional symbol and yields the abduction output or an error object in case of error - again, consult [this](https://github.com/VMarkos/prudens-js#parsing) for more details on internal Prudens data representations.
