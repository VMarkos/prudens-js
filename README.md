# Prudens JS
A full implementation of Prudens in Javascript alongside a simple UI and the corresponding documentation.

For the corresponding UI: @ https://vmarkos.github.io/prudens-js/index.html

# Data Structure
All interaction within the scope of Prudens JS is conducted based on JSON representations of knowledge bases, rules, literals and variables. In this section we present in detail the properties of each of these separately.

# Parsing and 
In this section we describe the functions that allow for string input to be parsed in the form described above. We also describe the functionality provided by Prudens JS so as to reconstruct a rule's/literal's string representation from the corresponding JSON object.

# Deduction
Regarding deduction, Prudens JS fully supports the reasoning mechanism as described [here](https://www.internetofus.eu/wp-content/uploads/sites/38/2021/05/Michael_2019_MachineCoaching.pdf). Below we present the functions of Prudens JS related to deduction.

# Abduction
Regarding abduction, the current version of Prudens JS supports only a propositional version which adheres to the deduction process described [here](https://www.internetofus.eu/wp-content/uploads/sites/38/2021/05/Michael_2019_MachineCoaching.pdf). That is, any abductive proof provided by Prudens JS consists of any missing facts that could lead to a given target, _t_, using the aforementioned deduction algorithm.
