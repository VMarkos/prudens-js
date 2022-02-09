import networkx as nx
import json

'''
KB DATA STRUCTURE:
[
  {
    "name": "r0",
    "body": [
      "p1126",
      "p752",
      "p1240"
    ],
    "head": "p324"
  },
]
'''

def specificity_graph(kb_object): # Graph-representation of a KB, based on a Hasse-like diagram.
    edges = []
    nodes = []
    for rule in kb_object:
        edges, nodes = add_node(edges, nodes, rule)
    pass # TODO Add edges one at a time.

def add_node(edges, nodes, rule):
    if rule in nodes:
        return edges, nodes
    nodes.append(rule)
    front = []
    visited = []
    found_new = True
    while found_new:
        front = []
        for node in nodes:
          pass
  
def visualize_kb(kb):
    pass

if __name__ == '__main__':
    pass
