import json
import random

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

DATA STRUCTURE:
{
    {
        name: 'asdy123',
        body: ['a', '-b', ..., 'c'],
        head: 'z',
    },
    {
        name: 'asdy124',
        body: ['a', 'b', ..., 'c'],
        head: '-z',
    },
    ...
}
"""

def generate_kb(n_trees, avg_root_size=3, avg_root_similarity=0.4, deviation=0.3, avg_tree_depth=6, avg_branching_factor=2, removal_probability=0.1, roots=None, all_premises=None):
    if all_premises == None:
        all_premises = generate_premises(n_trees, avg_tree_depth, avg_branching_factor) # ASSUMPTION: Each root rule has 1 to 4 premises.
    if roots == None:
        roots = root_generator(n_trees, avg_root_size, avg_root_similarity, all_premises)
    kb = []
    for root in roots:
        new_tree = generate_tree(root, max(1, int(random.gauss(avg_tree_depth, 0.5))), deviation, max(1, int(random.gauss(avg_branching_factor, 0.5))), removal_probability, all_premises)
        kb += new_tree # TODO check for duplicates? (What are the chances?)
    return kb

def root_generator(n_roots, avg_root_size, avg_root_similarity, all_premises):
    used_premises = random.sample(all_premises, max(1, int(random.gauss(avg_root_size, (avg_root_size - 1) / 3))))
    roots = [{
        'name': 'r0',
        'body': [x for x in used_premises],
        'head': random.choice([x for x in all_premises if x not in used_premises]),
    }]
    unused_premises = [x for x in all_premises if x not in used_premises]
    for i in range(1, n_roots):
        root_size = max(1, int(random.gauss(avg_root_size, (avg_root_size - 1) / 3)))
        new_premises = random.sample(unused_premises, max(1, int(root_size * (1 - avg_root_similarity)))) # FIXME If this is too slow, check this part for optimization!
        unused_premises = [x for x in unused_premises if x not in used_premises]
        head = random.choice(unused_premises)
        unused_premises.remove(head) # TODO Possible error here?
        roots.append({
            'name': 'r' + str(i),
            'body': random.sample(used_premises, int(root_size * avg_root_similarity)) + new_premises,
            'head': head,
        })
        used_premises += new_premises
        if (head not in used_premises):
            used_premises.append(head)
    return roots

def generate_premises(n_roots, avg_tree_depth, avg_branching_factor):
    return ['p' + str(i) for i in range(n_roots * avg_branching_factor ** avg_tree_depth)] # Is this sufficient?

def generate_tree(root, depth, deviation, branching_factor, removal_probability, all_premises): # Remember that depth is received from some **universal** distribution that you have generated at some point prior to calling this!
    tree = [root]
    frontier = [root] # Queue with all nodes that need to be expanded.
    while len(tree) < depth * branching_factor: # Roughly what you need...
        parent = frontier.pop()
        current_bf = int(max(1, random.gauss(branching_factor, 0.5))) # 0.5 is arbitrarily chosen.
        children = expand_node(current_bf, deviation, parent, removal_probability, all_premises)
        for child in children:
            frontier.insert(0, child)
            tree.append(child)
    return tree
        

def expand_node(children_count, deviation, parent, removal_probability, all_premises):
    parent_body = parent['body']
    parent_head = parent['head']
    children = []
    for i in range(children_count):
        new_head = negate_head(parent_head)
        new_body = expand_body(parent_body, deviation, removal_probability, all_premises)
        children.append({
            'name': parent['name'] + '.' +  str(i),
            'body': new_body,
            'head': new_head,
        })
    return children

def expand_body(parent_body, deviation, removal_probability, all_premises):
    new_body = [parent_body[0]]
    for i in range(1,len(parent_body)):
        premise = parent_body[i]
        if random.random() > removal_probability:
            new_body.append(premise)
    k = 0
    while random.random() < deviation ** k:
        new_body.append(random.choice([x for x in all_premises if x not in (parent_body + new_body)]))
        k += 1
    return new_body

def negate_head(head):
    if head[0] == '-':
        return head[1:]
    return '-' + head

if __name__ == '__main__':
    n_roots = 20
    avg_root_size = 3
    avg_root_similarity = 0.4
    deviation = 0.3
    avg_tree_depth = 6
    avg_branching_factor = 3
    removal_probability = 0.1
    kb = generate_kb(n_roots, avg_root_size, avg_root_similarity, deviation, avg_tree_depth, avg_branching_factor, removal_probability)
    with open('test_kb.json', 'w') as file:
        json.dump(kb, file, indent=2)