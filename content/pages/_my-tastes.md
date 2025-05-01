Whenever I read material on-line, one of the first things I want to know are the tastes and style of the author. So with that in mind, here are mine.

Firstly, I’m a computer scientist and engineer, with an amateur love of mathematics.

With regards to the domain of ML, I currently believe in the following general principles and approaches:

1. Use probability. Use statistical ideas. Be principled. Leverage centuries of research. But also: understand the assumptions behind many results created before the availability of powerful computers and software. Most data isn’t linear, or drawn from independent identical distributions, or normal, etc. Even when these assumptions don’t hold, the results can still work or aid understanding.
2. Appreciate the “curse of dimensionality”. High dimensional space is basically void of data; distance metrics in feature space can be unintuitive or misleading, or say more about the metric than the data; results from algorithms should not change if measurement units are altered; the volume of hyper-spheres contain a vanishing fraction of bounding hyper-cube volume; etc.
3. Models such as Artificial Neural Networks and Kernel-based density estimators are general-purpose parameterised functions which make minimal assumptions about the data. Implicitly they do make assumptions of course, but the hope is that these structural constraints are either harmless or desired. Any inspiration from or analogy with brain function is of minor historical interest only.
4. Use fast (not first order) and mathematically motivated optimisation algorithms such as [BFGS](https://en.wikipedia.org/wiki/Broyden%E2%80%93Fletcher%E2%80%93Goldfarb%E2%80%93Shanno_algorithm). In particular, don’t use slow (first order) algorithms as an implicit way to try to prevent overfitting. Algorithms or models which use an initial random element (parameters or weights or subsets of data etc) should be run multiple times using ideas like cross-validation, regularisation, “bagging”, etc to minimise any variation effects caused by that random seeding. Basically, always try to measure and explicitly deal with this source of variation.
5. Publish reproducible results. I’ve spent the last 20 years using Python for commercial software development, so that will continue to be my go-to tool. Unsurprisingly, Jupyter notebooks will feature too.
6. Make honest assessments using both real datasets (publically available) and artificial pedagogical datasets created with specific and known characteristics.

As this blog evolves, I will try hard to adhere to my own principles!

I’m primarily interested in the subset of Machine Learning which is about deciding (and explaining) the category of a datapoint. Examples abound, such as reject or accept a loan application, diagnose a disease, forecast road traffic, or decide the optimal time to plant, subsequently manage, then harvest and clean a crop. I will generally avoid the added complexities of dealing with large quantities of time-series or image data.
