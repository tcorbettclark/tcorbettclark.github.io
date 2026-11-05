# Data Science and AI EPQ project examples

The examples below are designed to help you envisage what a Data Science and AI
EPQ project might look like, from developing a research question and choosing
suitable data to building and evaluating a model. They are intended as
inspiration rather than projects to copy. An important part of the EPQ is
developing and taking ownership of your own project, so you should choose a
question that interests you and develop your own approach to investigating it.

Each project page opens with what the project needs — machine, software and
downloads — and then follows the same pattern:

- Project overview
- Dataset(s) to be used
- Suggested research question or hypothesis
- Key data science, statistical and machine learning concepts
- Suggested approaches to data preparation, analysis and modelling
- Potential limitations, risks and sources of bias
- Expected outcomes and opportunities for evaluation
- Example artefacts
- Further reading

The example artefacts are placeholders until the Orange workflows and Python
plots are built.

## The six projects

| ID | Project | Main tool | Data |
|---|---|---|---|
| P1 | MNIST digit classification | Orange Data Mining: Image Features, Image Pixels, Neural Network, Neural Network Viewer | MNIST digits |
| P2 | Cloud image classification | Orange Data Mining: Image Features, group ablation, colour shortcut | WMO International Cloud Atlas photographs and your own sky photos |
| P3 | Running a local Turing test | Orange Data Mining: Load LM, LM Generator | BritLLM outputs and human writing |
| P4 | Income and life expectancy | Orange Data Mining: Scatter Plot, Linear Regression, Test & Score, Predictions | Gapminder and World Bank indicators |
| P5 | Quantisation comparison | Python: `mlx-lm`, `psutil`, `matplotlib`; optional `powermetrics` | BritLLM quantisations and a task suite you write |
| P6 | Language-model failure and confidence | Python: `mlx-lm`, `numpy`, `matplotlib` | BritLLM quantisations and a question set you write |

The pages are:

- [MNIST digit classification](p1-mnist-digit-classification/)
- [Cloud image classification](p2-cloud-image-classification/)
- [Running a local Turing test](p3-local-turing-test/)
- [Income and life expectancy](p4-income-and-life-expectancy/)
- [Quantisation comparison](p5-quantisation-comparison/)
- [Language-model failure and confidence](p6-language-model-failure-and-confidence/)

## Setting up

Each page says what it needs before it starts: the machine, the software and the
downloads, with sizes. [Prerequisites](../prerequisites/) describes the two
routes — Orange Data Mining for P1–P4, Python for P5–P6 — and the permissions
that take time to arrange.

None of the six requires training a large model from random weights, and you do
not need to work through them in order.

Everything runs locally once the data and models are downloaded. The Orange
add-on, the BritLLM model files and the datasets are external dependencies; they
are not included in this pack.

## A note on resources in P5

"Energy storage" can mean several things. P5 separates three resources:

- **Storage:** the size of the model on disk, in megabytes or gigabytes.
- **Memory:** the RAM used while the model is loaded and generating.
- **Energy:** the joules consumed per token or per correct answer.

P5 gives you measurements for all three. You decide which of them
matters for your use case, and argue the case from your results.
