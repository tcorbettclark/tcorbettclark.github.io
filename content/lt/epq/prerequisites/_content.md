# Prerequisites

These projects are practical: you need a machine, some software, data, and
permission to collect anything that is not already public. This page lists what
that means before you commit to one of the outlines, because the most common
way a good project fails is discovering in March that the kit was never
available.

## What the qualification asks of you

The Extended Project is a Level 3 qualification worth 120 guided learning
hours. All four boards that offer it agree on the essentials:

- **You choose the project.** You draft the title and aims and the centre
  approves them before work starts. A centre may refuse a proposal it cannot
  supervise or resource.
- **You are supervised.** You get a supervisor for regular reviews, and a
  centre coordinator who is accountable for the submission.
- **You keep a record.** A production log (AQA), candidate production record
  (WJEC) or equivalent, with your planning, research, decisions and
  reflections. Without it the project cannot be moderated, however good the
  report.
- **You present.** A live presentation to a non-specialist audience, with
  questions recorded by your supervisor.
- **You submit written work.** A research report of roughly 5,000 words, or an
  artefact with a research-based report of at least 1,000 words (AQA's
  figures). Every project product includes a written report.
- **It is your own work**, not submitted for another qualification, and any use
  of AI tools is declared.

Hours, marks and paperwork differ by board — see the last section.

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

Check the download size before you start on a school connection, and check the
model's licence if you intend to redistribute anything you produce.

## Permission and ethics

Three of the six projects bring you into contact with people or with other
people's material, and all four boards require your centre to approve the
ethics of a proposal **before** you collect data. Plan for it:

- **Asking classmates for writing, answers or judgements** (A3, B2) means
  consent, anonymity, a right to withdraw, and storage that satisfies your
  school's data protection policy.
- **Photographing the sky** (A2) may need permission to be off-site or on the
  school site at particular times, and a risk assessment.
- **Using images or corpora you did not create** (A2, A1, C1) means checking the
  licence permits reuse in your report, and citing the source properly.
- **Using an AI tool**, including the model you are studying, means recording
  prompts and outputs in your log and never presenting its text as your own.

## Time

120 guided learning hours sounds like a lot and is not. A plausible shape,
which you should adjust with your supervisor:

| Stage | Hours |
|---|---|
| Taught skills, ethics and project management | 30 |
| Proposal, planning and background reading | 20 |
| Collecting or preparing data | 20 |
| Building, running and evaluating | 20 |
| Writing the report | 20 |
| Presentation and log | 10 |

If an outline's "suggested approaches" would not fit inside its stage, cut the
outline down rather than the report.

## The rules for your board

Your centre will tell you which board it enters you with. Read the relevant
specification, or at least the assessment objectives and the evidence
requirements:

- **AQA 7993** — [specification](https://filestore.aqa.org.uk/subjects/AQA-W-7993-SP-19.PDF) and [AI guidance](https://www.aqa.org.uk/files/345f3433-b1f8-4406-93a6-19dd85874079/445389386589a6083669db126a9e792a1fae35cc.pdf)
- **Pearson Edexcel** — [specification](https://qualifications.pearson.com/content/dam/pdf/Project-Qualification/Level-3/2010/Specification/project-specification-level-3.pdf)
- **OCR (H857)** — [specification](https://www.ocr.org.uk/Images/414382-specification.pdf)
- **WJEC/Eduqas** — [specification](https://www.wjec.co.uk/media/iuphacwi/wjec-level-3-extended-project-spec-e-26-04-23.pdf)

<footer>Written for the outlines in this pack. Your centre's decisions on
approval, supervision and ethics take precedence over anything here.</footer>
