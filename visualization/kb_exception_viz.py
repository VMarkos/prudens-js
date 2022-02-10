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
    edges = {} # Dictionary with rule names as keys and list of edge-end rules as values.
    nodes = []
    for rule in kb_object:
        edges, nodes = add_node(edges, nodes, rule)
    pass # TODO Add edges one at a time.
  
def visualize_kb(kb):
    pass
  
'''
Specificity graph structure:
edges: a dictionary with rule names as keys and lists of rule names as values.
nodes: a dictionary with rule names as keys and head & body as values (as a dict?)
'''
  
class SpecificityGraph:
    def __init__(self, nodes, edges):
        self.nodes = nodes
        self.edges = edges
        self.cardinals = {} # Dict with integers i as keys and lists of rules with i literals in their body as values.
        for node in nodes:
            if len(node['body']]) in self.cardinals.keys():
                self.cardinals[len(node['body']])].append(node['name'])
            else:
                self.cardinals[len(node['body']])] = [node['name']]
        
    def __iter__(self):
        self.node_count = 0
        self.current_cardinal = 0
        self.previous_cardinals_count = 0
        return self
      
    def __next__(self):
        if self.node_count == len(self.nodes):
            raise StopIteration
        if len(self.cardinals[current_cardinal]) == #TODO Here!
        next_node = self.cardinals[current_cardinal]

if __name__ == '__main__':
    pass
