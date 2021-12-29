import json

"""
KB generation algo:
Given a number of roots/trees (nroots), an average root similarity (avgrs), a probability of within-tree deviation (wtdev), an average tree depth (avgtd), an average branching factor (avgbf), do the following stuff:
    1. Generate nroots rules with their premises being the same with probability avgrs (randomly sampled in a way that works).
    2. For each root, generate a tree with wtdev, avgtd and avgbf (see below).
    3. Return the emerging kb.

In step 2, follow the following methodology, given wtdev, avgtd and avgbf:
    0. Specify a random (normally) depth such that, on average, it is avgtd --- THIS SHOULD BE DONE IN PRIOR, TO ENSURE THAT ALL DEPTHS COME FROM THE SAME DISTRIBUTION/RNG SEQUENCE!!! (The same may apply to other factors random **across** the KB).
    1. Generate a random (normally?) number of children with mean/median value avgbf (see below) and the corresponding wtdev.
    2. Repeat step 1 with each node until the desired depth is reached.

In step 1. follow the following methodology, given avgbf and wtdev --- AGAIN, deviations should be generated prior to this call:
    1. Generate avgbf[i] rules with head conflicting to that of their parent and allow for each premise to be kept/altered with probability wtdev --- what if we want to introduce NEW premises from other trees? Probably introduce another hyperparameter.
"""

def rule_generator(max_body_size): # You may need to provide head/body in case of chaining here...
    pass

def kb_generator(size, max_chain_length, max_body_size):
    pass

if __name__ == '__main__':
    pass