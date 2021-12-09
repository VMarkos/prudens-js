# Description of the Propositional KB Generation Script

```diff
+ Tested on python 3.8.10
```

## Data Structure

The generated knowledge base has the following structure:
```
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
```

## `generate_kb(n_roots, *args)`

`n_roots` specifies the number of roots and, consequently, the number of trees contained in a knowledge base. That is, `n_roots=2` would mean that the generated knowledge base would contain two exception trees, as, for instance, in the example below:

```diff
+ R1 :: a, b implies x;
+ R2 :: a, c implies -x;
+ R3 :: b, d implies -x;
+ R4 :: a, c, e implies x;
- R5 :: a, z implies y;
- R6 :: a, z, w implies -y;
- R7 :: z, w, u implies y;
```

*`+` and `-` are used with the sole purpose of highlighting which the two subtress are and are not part of Prudens's language's syntax.*

`generate_kb` also accepts more arguments, through which one may further manipulate the structure of the generated knowledge base:

| Argument | Description | Default Value |
| -------- | ----------- | ------------- |
| `avg_root_size` | Float indicating the average number of premises each root rule should contain. | 3 |
| `avg-root_similarity` | Float in (0,1) indicating the probability that a premise present in some root rule also appears in (at least) one otheer root rule.| 0.4 |
| `deviation` | Float in (0,1) indicating the probability that an exception contains more than one new premises, compared to its parent rule.| 0.3 |
| `avg_tree_depth` | Float indicating the average tree depth for each sub-tree in the generated knowledge base. | 6 |
| `avg_branching_factor` | Float indicating the average number of child nodes each node in each tree should have. | 2 |
| `removal_probability` | Float in (0,1) indicating the probability that, at each iteration, a premise of a parent node will not also be a premise of a child node. | 0.1 |
