# Prerequisites

These projects are practical: you need a machine, some software, data, and
permission to collect anything that is not already public. This page lists what
that means before you commit to one of the outlines, because the most common
way a good project fails is discovering in March that the kit was never
available.

## Check your board's rules

The qualification is set by the awarding body your centre enters you with. Its
hours, its assessment objectives and the evidence it asks for are all in that
board's specification, and they differ between boards. Ask your supervisor which
one applies to you, read it, and treat it as the authority: nothing here is a
substitute for it.

The four specifications are listed at the end of this page. What follows here is
what these particular projects need in order to run.

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
people's material, and your centre has to agree how you handle that before you
collect anything. Ask what it requires, and plan for it:

- **Asking classmates for writing, answers or judgements** (A3, B2) means
  consent, anonymity, a right to withdraw, and storage that satisfies your
  school's data protection policy.
- **Photographing the sky** (A2) may need permission to be off-site or on the
  school site at particular times, and a risk assessment.
- **Using images or corpora you did not create** (A2, A1, C1) means checking the
  licence permits reuse in your report, and citing the source properly.
- **Using an AI tool**, including the model you are studying, means recording
  prompts and outputs in your log and never presenting its text as your own.

## Your own work

The report, the code and the analysis have to be your own work, written for this
project and not for another qualification. Whatever tools you use, say so in your
log and in the report: declare what the model did, and never present its text as
your own.

## Time

The project has to fit alongside your other studies, so plan for part-time work
across a school year. A plausible shape, which you can adjust with your
supervisor:

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

## The specifications

Your centre will tell you which board it enters you with. Read the relevant
specification, or at least the assessment objectives and the evidence
requirements:

- **AQA 7993** — [specification](https://filestore.aqa.org.uk/subjects/AQA-W-7993-SP-19.PDF) and [AI guidance](https://www.aqa.org.uk/files/345f3433-b1f8-4406-93a6-19dd85874079/445389386589a6083669db126a9e792a1fae35cc.pdf)
- **Pearson Edexcel** — [specification](https://qualifications.pearson.com/content/dam/pdf/Project-Qualification/Level-3/2010/Specification/project-specification-level-3.pdf)
- **OCR (H857)** — [specification](https://www.ocr.org.uk/Images/414382-specification.pdf)
- **WJEC/Eduqas** — [specification](https://www.wjec.co.uk/media/iuphacwi/wjec-level-3-extended-project-spec-e-26-04-23.pdf)

<footer>Written for the outlines in this pack. Your centre's decisions on
approval, supervision and ethics take precedence over anything here.</footer>
