# Prerequisites

These projects are practical: each needs a machine, some software, and data to
download. This page lists what that means before you commit to an outline,
because the most common way a good project fails is discovering in March that
the kit was never available.

## A computer that can run this

A1–A3 and C1 need a laptop that can run Orange Data Mining, which is
undemanding. B1 and B2 run a small language model locally and need an Apple
silicon Mac (M-series) with 16 GB of memory; on anything less the model either
will not load or will be too slow to experiment with.

If your school provides the machines, ask before you plan around them: a
project that depends on installing software on a school machine needs the
school's agreement, and some networks block the downloads entirely.

## Software

| For | You need |
|---|---|
| A1, A2 | [Orange Data Mining](https://orangedatamining.com/) with the [`orange3-ai-suite`](https://github.com/tcorbettclark/orange3-ai-suite) add-on and its `image` extra (OpenCV) |
| A3 | The same add-on with its `lora` extra, plus `mlx-lm` on Apple silicon |
| C1 | [Orange Data Mining](https://orangedatamining.com/); no add-on beyond the standard widgets |
| B1, B2 | Python 3.11 or later, `mlx-lm`, `numpy`, `matplotlib`, `psutil` |

Everything runs locally once installed. Nothing here needs an account, a
subscription or a cloud service, which is deliberate: it keeps your data under
your control and the project reproducible after you leave school.

## Data and models to download

| Project | What you download | Roughly |
|---|---|---|
| A1 | A prepared MNIST subset, or the [full MNIST dataset](https://huggingface.co/datasets/ylecun/mnist) | tens of MB |
| A2 | The WMO International Cloud Atlas corpus, plus your own photographs | hundreds of MB |
| A3, B1, B2 | [BritLLM](https://huggingface.co/britllm/britllm-3b-v0.1) | about 5 GB for the full model; roughly 1–2 GB per quantised version |
| C1 | [Gapminder](https://www.gapminder.org/data/) indicators, optionally cross-checked against the [World Bank](https://data.worldbank.org/) | a few MB |

Model downloads are multi-gigabyte, before you count the datasets, so check
the size and the disk space before you start on a school connection. Check
the model's licence too if you intend to redistribute anything you produce.

## Permission and ethics

Three of the six projects bring you into contact with people or with other
people's material, and each of those is quicker to arrange early than in the
week you need the data:

- **Asking classmates for writing, answers or judgements** (A3, B2) involves
  consent, anonymity, a right to withdraw, and storage your school accepts.
- **Photographing the sky** (A2) may mean being off site, or on site at a
  particular time, with that agreed beforehand.
- **Using images or corpora you did not create** (A1, A2, C1) means a licence
  that allows reuse in your report, and a source you can cite.
- **Using an AI tool** means keeping the prompts and outputs you relied on, so
  that you can show what the model did and what you did.

Ask your supervisor what your centre requires, and when it needs it.

## Your board

The qualification, the report, the log, the presentation and what the assessor
looks for are set by the awarding body your centre enters you with, and they
differ between boards. Read that specification and treat it as the authority:
this page describes the kit, not the qualification.

Your centre will tell you which board it enters you with. The specifications
are here:

- **AQA 7993** — [specification](https://filestore.aqa.org.uk/subjects/AQA-W-7993-SP-19.PDF)
- **Pearson Edexcel** — [specification](https://qualifications.pearson.com/content/dam/pdf/Project-Qualification/Level-3/2010/Specification/project-specification-level-3.pdf)
- **OCR (H857)** — [specification](https://www.ocr.org.uk/Images/414382-specification.pdf)
- **WJEC/Eduqas** — [specification](https://www.wjec.co.uk/media/iuphacwi/wjec-level-3-extended-project-spec-e-26-04-23.pdf)

<footer>Written for the outlines in this pack. Your centre's decisions on
approval, supervision and ethics take precedence over anything here.</footer>
