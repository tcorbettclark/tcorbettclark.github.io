# Prerequisites

These projects are practical: each needs a machine, some software, and data to
download. Every outline opens by saying what it needs — the tool, the machine,
what to download and how large — so check that first, then come back here for
the general picture.

The most common way a good project fails is discovering in March that the kit
was never available.

## Two routes

The outlines go one of two ways, and the outline says which.

**Orange Data Mining** is a visual tool: you build a workflow by connecting
widgets, and nothing you are asked to do involves writing code. A laptop that
runs a browser will run it. Some outlines add packages to Orange, and the
outline names them.

**Python** is for the outlines where the thing being measured does not exist
yet — a benchmark harness, a scoring script — so you write it. Those outlines
run a small language model on your own machine. That needs an Apple silicon Mac
(M-series) with 16 GB of memory: on anything less the model either will not load
or will be too slow to experiment with.

If your school provides the machines, ask before you plan around them: a project
that depends on installing software on a school machine needs the school's
agreement, and some networks block the downloads entirely.

## Software

| Route | You install |
|---|---|
| Orange | [Orange Data Mining](https://orangedatamining.com/) and, for some outlines, the [`orange3-ai-suite`](https://github.com/tcorbettclark/orange3-ai-suite) add-on with one of its extras (`image`, `lora`) |
| Python | Python 3.11 or later, and the packages the outline names: `mlx-lm`, `numpy`, `matplotlib`, `psutil` |

Everything runs locally once installed. Nothing here needs an account, a
subscription or a cloud service, which is deliberate: it keeps your data under
your control and the project reproducible after you leave school.

## Downloads

What you download dominates the setup, so check the size before you start on a
school connection:

- **Language models** are the largest item. [BritLLM](https://huggingface.co/britllm/britllm-3b-v0.1)
  is about 5 GB in full and 1–2 GB per quantised version, and a project that
  compares quantisations holds several at once.
- **Image corpora** run to hundreds of megabytes; the [WMO International Cloud
  Atlas](https://cloudatlas.wmo.int/) is the example in this pack.
- **Tabular data** is small: [Gapminder](https://www.gapminder.org/data/)
  indicators are a few megabytes, and the [World Bank](https://data.worldbank.org/)
  is a useful cross-check.

Datasets such as [MNIST](https://huggingface.co/datasets/ylecun/mnist) ship in
both forms, a prepared subset that will run in a lesson and the full set that
takes longer.

Check the licence of anything you download if you intend to redistribute what
you produce.

## Permission and ethics

Some projects bring you into contact with people or with other people's
material, and each of those is quicker to arrange early than in the week you
need the data:

- **Asking classmates for writing, answers or judgements** involves consent,
  anonymity, a right to withdraw, and storage your school accepts.
- **Photographing a site** may mean being off site, on site at a particular
  time, or both, with that agreed beforehand.
- **Using images or corpora you did not create** means a licence that allows
  reuse in your report, and a source you can cite.
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
