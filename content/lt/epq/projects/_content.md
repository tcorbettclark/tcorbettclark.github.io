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
- How this might be assessed
- Example artefacts
- Further reading

The example artefacts are placeholders until the Orange workflows and Python
plots are built.

## The six projects

| ID | Project | Main tool | Data |
|---|---|---|---|
| A1 | MNIST digit classification | Orange Data Mining: Image Features, Image Pixels, Neural Network, Neural Network Viewer | MNIST digits |
| A2 | Cloud image classification | Orange Data Mining: Image Features, group ablation, colour shortcut | WMO International Cloud Atlas photographs and your own sky photos |
| A3 | Running a local Turing test | Orange Data Mining: Load LM, LM Generator | BritLLM outputs and human writing |
| C1 | Income and life expectancy | Orange Data Mining: Scatter Plot, Linear Regression, Test & Score, Predictions | Gapminder and World Bank indicators |
| B1 | Quantisation comparison | Python: `mlx-lm`, `psutil`, `matplotlib`; optional `powermetrics` | BritLLM quantisations and a task suite you write |
| B2 | Language-model failure and confidence | Python: `mlx-lm`, `numpy`, `matplotlib` | BritLLM quantisations and a question set you write |

The pages are:

- [MNIST digit classification](a1-mnist-digit-classification/)
- [Cloud image classification](a2-cloud-image-classification/)
- [Running a local Turing test](a3-local-turing-test/)
- [Income and life expectancy](c1-income-and-life-expectancy/)
- [Quantisation comparison](b1-quantisation-comparison/)
- [Language-model failure and confidence](b2-language-model-failure-and-confidence/)

A1–A3 and C1 are Orange projects. B1–B2 are Python projects: you would need to
read and adapt scripts, run them from the terminal, and plot results. None of
the six requires training a large model from random weights, and all six are
designed for a 16 GB M-series Mac. You do not need to work through them in
order.

## Setting up

For A1–A3 and C1, you need [Orange Data Mining](https://orangedatamining.com/) with
the [`orange3-ai-suite`](https://github.com/tcorbettclark/orange3-ai-suite)
add-on installed. The add-on provides the **Image Features**, **Image Pixels**,
**LM Text Loader**, **Load LM**, **LM Pre-trainer**, **LM Generator** and
**Neural Network Viewer** widgets. For A1–A2, install the add-on's `image` extra
(OpenCV). A3 needs `mlx-lm` on Apple Silicon; the add-on's `lora` extra installs
it for loading [BritLLM](https://huggingface.co/britllm/britllm-3b-v0.1).

Data and models:

- **A1:** the [`orange3-ai-suite`](https://github.com/tcorbettclark/orange3-ai-suite)
  repository includes a prepared MNIST subset, or you can download the
  [full MNIST dataset](https://huggingface.co/datasets/ylecun/mnist).
- **A2:** the [`orange3-ai-suite`](https://github.com/tcorbettclark/orange3-ai-suite)
  repository includes a cloud fetcher that downloads the
  [WMO International Cloud Atlas](https://cloudatlas.wmo.int/) corpus. You also
  collect your own sky photographs.
- **A3:** [BritLLM](https://huggingface.co/britllm/britllm-3b-v0.1) is available
  locally. Use public-domain texts, such as [Project Gutenberg](https://www.gutenberg.org/)
  editions, or your own writing for the human side of the test.
- **C1:** download the [Gapminder](https://www.gapminder.org/data/) indicators
  you need, and optionally cross-check them against the
  [World Bank](https://data.worldbank.org/).
- **B1–B2:** the local [BritLLM](https://huggingface.co/britllm/britllm-3b-v0.1)
  MLX quantisations, plus Python 3.11 or later with
  [`mlx-lm`](https://github.com/ml-explore/mlx-lm), `numpy`, `matplotlib` and
  `psutil`.

Everything runs locally once the data and models are downloaded. The Orange
add-on, the BritLLM model files and the datasets are external dependencies;
they are not included in this pack.

## A note on resources in B1

"Energy storage" can mean several things. B1 separates three resources:

- **Storage:** the size of the model on disk, in megabytes or gigabytes.
- **Memory:** the RAM used while the model is loaded and generating.
- **Energy:** the joules consumed per token or per correct answer.

B1 gives you measurements for all three. You decide which of them
matters for your use case, and argue the case from your results.
