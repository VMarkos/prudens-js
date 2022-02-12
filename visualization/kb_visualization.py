import networkx as nx
import matplotlib.pyplot as plt
from matplotlib import colors as mcolors
from math import sqrt, ceil
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

def plot_specificity_graph(kb):
    graph = SpecificityGraph(kb)
    G = nx.DiGraph()
    edges_as_tuples = graph.get_edges_as_tuples()
    G.add_edges_from(edges_as_tuples)
    nodes_with_edge = []
    for x, y in edges_as_tuples:
        nodes_with_edge.append(x)
        nodes_with_edge.append(y)
    for node in graph.nodes:
        if node['name'] not in nodes_with_edge:
            G.add_node(node['name'])
    connected_components = (G.subgraph(x) for x in nx.weakly_connected_components(G))
    colors = list(x for x in mcolors.CSS4_COLORS.values() if int(x[1:], 16) > 4000)
    cc = list(connected_components)
    for i in range(len(cc)):
        nx.draw(cc[i], with_labels=True, node_color=colors[i % len(colors)], node_size=1200)
        plt.show()
  
'''
Specificity graph structure:
edges: a dictionary with rule names as keys and lists of rule names as values.
nodes: a dictionary with rule names as keys and head & body as values (as a dict?)
'''

class SpecificityGraphNodes:
    def __init__(self, nodes):
        self.nodes = nodes
        self.cardinals = {} # Dict with integers i as keys and lists of rules with i literals in their body as values.
        for node in nodes:
            if len(node['body']) in self.cardinals.keys():
                self.cardinals[len(node['body'])].append(node) # FIXME This is not optimal in terms of memory!
            else:
                self.cardinals[len(node['body'])] = [node]

    def __iter__(self):
        self.node_count = 0
        self.current_cardinal = min(list(self.cardinals.keys()))
        self.previous_cardinals_count = 0
        return self
      
    def __next__(self):
        if self.node_count == len(self.nodes):
            raise StopIteration
        if self.node_count - self.previous_cardinals_count == len(self.cardinals[self.current_cardinal]):
            self.previous_cardinals_count = self.node_count
            self.current_cardinal += 1
            while self.current_cardinal not in self.cardinals.keys():
                self.current_cardinal += 1
        next_node = self.cardinals[self.current_cardinal][self.node_count - self.previous_cardinals_count]
        self.node_count += 1
        return next_node

    def __str__(self):
        output_string = ''
        for node in self.nodes:
           output_string += str(node) + '\n'
        return output_string.strip()

    def add_node(self, node):
        self.nodes.append(node)
        if len(node['body']) in self.cardinals.keys():
            self.cardinals[len(node['body'])].append(node)
        else:
            self.cardinals[len(node['body'])] = [node]

class SpecificityGraph:
    def __init__(self, kb):
        self.nodes = SpecificityGraphNodes(kb)
        self.edges = {}
        for rule in kb:
            # print(rule['name'])
            self.add_node(rule)

    def add_node(self, node):
        front = []
        for existing_node in self.nodes:
            if len(existing_node['body']) >= len(node['body']):
                break
            if set(existing_node['body']).issubset(node['body']):
                n_front = len(front)
                i = 0
                while i < n_front:
                    if set(front[i]['body']).issubset(existing_node['body']):
                        del front[i]
                        i -= 1
                        n_front -= 1
                    i += 1
                front.append(existing_node)
        # print(node['name'], front)
        for front_node in front:
            # print('front node:', front_node['name'])
            if front_node['name'] in self.edges.keys():
                n_children = len(self.edges[front_node['name']])
                # print(n_children)
                i = 0
                while i < n_children:
                    child_name = self.edges[front_node['name']][i]
                    child = None
                    for temp_node in self.nodes:
                        if temp_node['name'] == child_name:
                            child = temp_node
                            break
                    # print('child:', child)
                    if set(child['body']).issubset(node['body']) and len(child['body']) < len(node['body']): # Ensure that child is a proper subset of node!
                        del self.edges[front_node['name']][i]
                        # print('Deleted:', self.edges(front_node['name']))
                        i -= 1
                        n_children -= 1
                    i += 1
                # print('to be appended:', node)
                self.edges[front_node['name']].append(node['name'])
            else:
                self.edges[front_node['name']] = [node['name']]
                # print(self.edges)

    def get_edges_as_tuples(self):
        edge_pairs = []
        for node, children in self.edges.items():
            for child in children:
                edge_pairs.append((node, child))
        return edge_pairs

# if __name__ == '__main__':
#     with open('test_kb.json', 'r') as file:
#         kb = json.load(file)
#     plot_specificity_graph(kb)