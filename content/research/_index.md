Especially interested in explaining NN, their output.

I'm struck by how much model constraints are implicitly bound with the algorithms used to train networks.

4. Use fast (not first order) and mathematically motivated optimisation algorithms such as [BFGS](https://en.wikipedia.org/wiki/Broyden%E2%80%93Fletcher%E2%80%93Goldfarb%E2%80%93Shanno_algorithm). In particular, don’t use slow (first order) algorithms as an implicit way to try to prevent overfitting. Algorithms or models which use an initial random element (parameters or weights or subsets of data etc) should be run multiple times using ideas like cross-validation, regularisation, “bagging”, etc to minimise any variation effects caused by that random seeding. Basically, always try to measure and explicitly deal with this source of variation.


The following PDF papers are[^1] all rather old...

* My [DPhil](https://uni-of-oxford.custhelp.com/app/answers/detail/a_id/185/~/what-is-a-dphil) thesis, [Explanation from Neural Networks](thesis.pdf).
* Introductory notes on Independent Component Analysis and the Blind Separation of Sources problem: [ICA introduction](ica_introduction.pdf).
* Extending the basic ICA model Part 1: reducing the number of souces: [ICA extensions part 1](ica_extensions_pt1.pdf).
* Choosing an appropriate model for novelty detection: *link pending*

[^1]: My reference.
