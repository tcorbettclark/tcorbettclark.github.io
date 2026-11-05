# How much memory, speed and energy does quantisation save, and what does it cost in quality?

> One way to run this project, not the only way. Change the question, the
data, the tool or the artefact to suit what interests you: the choices, and
the reasons for them, have to be yours before your centre approves the
proposal.

## Project overview

You could investigate what happens when a language model is compressed.
[BritLLM](https://huggingface.co/britllm/britllm-3b-v0.1), the 3B model you would
run locally, is available at several quantisation levels: 3-bit, 4-bit, 6-bit
and 8-bit. Each version stores the same weights with a different number of bits,
so each has a different file size, memory footprint and speed. The usual claim
is that quality barely drops. Your project would test that claim, and measure
the resources that the claim leaves out.

The project would have two parts. The first would be a quality comparison: how
well each version answers a fixed set of questions, and how surprised it is by
held-out text. The second would be a resource comparison: how much disk space
each version needs, how much memory it uses while generating, how fast it
generates, and how much energy it consumes per token. You would combine the two
into a trade-off analysis, and investigate whether 4-bit is the sweet spot or
whether the best choice depends on whether you care about memory, speed, energy
or accuracy.

An important part of the project would be the resource measurement. You would
measure memory and energy as well as accuracy, so you can ask whether the
cheapest model is also the cheapest per correct answer. That question is
relevant to phones, laptops and data centres.

Your final artefact could be a Python benchmark harness, a results table, a set
of trade-off plots, and a written recommendation for a particular use case.

**What you submit.** The assessed product is a written report: around 5,000
words for a research project, or at least 1,000 words alongside an artefact
such as the one described here. The tables, plots and workflow are evidence
you discuss in the report, not the submission itself.

## Dataset(s) to be used

The models are the local BritLLM MLX quantisations. The 3B model has a
2048-token context and is released under the ODC-BY licence. The local
directories are approximately:

- **3-bit:** 1.1 GB
- **4-bit:** 1.4 GB
- **6-bit:** 2.0 GB
- **8-bit:** 2.6 GB
- **fp16:** 5.0 GB, optional, as an uncompressed reference

These are file sizes, not memory in use. Your project would measure both. All
four quantisations run on a 16 GB M-series Mac; the fp16 reference is optional
and uses more memory.

For quality, you need two kinds of data. The first is a held-out text corpus
for perplexity: a chapter of a public-domain book, a Wikipedia extract, or a
similar body of ordinary prose. The model should not have been trained on the
exact text you use, although a 3B model may have seen some of it; record your
source and treat the result as a relative comparison between quantisations, not
an absolute measure of knowledge. The second is a task suite you write: 100–300
short items across categories such as factual recall, arithmetic, multi-step
reasoning, instruction following and creative writing. Write the questions and
the expected answers yourself, or adapt a public dataset and record its licence.
A mixture of easy, medium and hard items is more informative than a set that
every model passes or every model fails.

For the resource measurements, you need a quiet machine, a way to measure
memory, and optionally a way to measure energy. On macOS, `psutil` gives you the
process's resident memory, and `powermetrics` can report CPU and GPU power if
you have administrator rights. A plug-in power meter is an alternative, but it
measures the whole machine and is harder to attribute to the model. Record the
machine, the macOS version, the MLX version and the model paths in your log.

If you want to extend the comparison beyond BritLLM, you can download another
small model from [Hugging Face](https://huggingface.co/models) and convert it
with `mlx_lm.convert`. Check the licence and keep the second model as a separate
arm; mixing model families makes it harder to attribute differences to
quantisation.

## Suggested research question or hypothesis

For example:

> How does 3-bit, 4-bit, 6-bit and 8-bit quantisation of a 3B language model
> affect quality, speed, memory, storage and energy per token, and which
> resource trade-off matters most?

You could develop this into more specific questions, such as whether quality
loss is linear in the number of bits or whether there is a cliff, whether
quantisation damages some task types more than others, whether energy per token
falls in proportion to model size, or whether energy per correct answer changes
the ranking of the models.

You could test whether memory and disk size fall roughly linearly with bits,
whether speed improves but not proportionally, and whether quality holds up
from 8-bit to 4-bit before falling more sharply at 3-bit. You could test each part
separately and report where the hypothesis fails.

## Key data science, statistical and machine learning concepts

Your project could involve:

- quantisation: representing weights with fewer bits
- bits per weight, group size and affine quantisation
- storage size versus runtime memory versus energy: three different resources
- model parameters and the relationship between parameter count, bits and bytes
- memory bandwidth and why inference is often bandwidth-bound
- tokens per second and time to first token
- perplexity and cross-entropy
- accuracy and exact-match scoring on a task suite
- baselines and ceiling/floor effects
- experimental control: fixed prompts, seeds, temperatures and maximum lengths
- repeats, means, standard deviations and confidence intervals
- paired comparisons: the same prompt across all bit widths
- thermal throttling and background load
- energy per token and energy per correct answer
- efficiency frontiers: quality per gigabyte and quality per joule
- the difference between a benchmark score and a useful model

You would need to report the resource measurements as carefully as the quality
measurements. A model that is 20% smaller but 5% less accurate may be a good
trade for a phone and a bad trade for a server. Your project would make that
trade explicit.

## Suggested approaches to data preparation, analysis and modelling

You could begin by inventorying the models. For each directory, record the file
size, the `config.json` quantisation settings, the number of bits and the group
size. Compute the theoretical size from the parameter count and compare it with
the disk size. The difference is the overhead from the tokenizer, metadata and
file format.

You could write a small Python harness with three parts:

1. **Load and warm up.** Load the model in a fresh process, run one short
   generation, and record the time and peak memory. The warm-up is needed because
   the first run includes lazy loading and compilation.
2. **Measure generation.** For each prompt, record the time to generate a fixed
   number of new tokens, the number of new tokens, the peak resident memory
   and, if available, the energy samples. Use the same prompts, the same
   sampler, the same temperature and the same seed across models. Greedy
   decoding is the simplest choice because it removes sampling variability; if
   you use sampling, repeat each prompt several times.
3. **Score quality.** Score the task suite automatically. Exact match is easiest
   for factual and arithmetic items; a small rubric or a hand-checked sample is
   better for open-ended writing. For perplexity, run the model over a held-out
   text and compute the mean negative log-likelihood per token, then
   exponentiate it.

You could measure memory with `psutil.Process().memory_info().rss` sampled in a background
thread, or with `resource.getrusage` after the run. RSS includes the Python
interpreter, the MLX buffers and the loaded weights, so it is likely to be larger than
the file size. Report both, and explain the difference. If you can, measure the
memory after loading but before generating, and the peak during generation,
because the two answer different questions.

You could measure speed with `time.perf_counter()` around the generation call. Record
tokens per second as new tokens divided by seconds. Run each condition at least
three times and report the mean and standard deviation. Randomise the order of
the models, or alternate them, so that thermal throttling does not always
favour the first model you run. Let the machine rest between runs if it becomes
warm. If you use `mlx_lm.stream_generate`, you can also record the time to first
token; otherwise report total generation time.

You could measure energy only if you can do it safely and with supervision. On macOS,
`powermetrics` requires administrator rights. Run it in the background with a
one-second sampling interval, record the CPU and GPU power, and integrate the
power over the generation window. Report joules per token and joules per
correct answer. Treat the result as a relative comparison on your machine, not
an absolute claim about all hardware. If you cannot use `powermetrics`, a
plug-in power meter or a careful estimate based on time and average power is
better than no measurement, provided you explain the method and its
uncertainty.

You could analyse the results with plots:

- quality (accuracy or perplexity) against bits
- tokens per second against bits
- peak memory against bits
- file size against bits
- energy per token against bits
- energy per correct answer against bits

You could look for a knee in the curve: whether the drop from 8-bit to 6-bit is
small and the drop from 4-bit to 3-bit is large, whether the speed gain flattens
before the quality loss becomes serious, and whether the energy ranking matches
the memory ranking. A simple efficiency frontier, with quality on one axis and
resource use on the other, makes the trade-off visible.

Break the quality results down by task category. Quantisation may damage
arithmetic or rare factual recall more than it damages fluent continuation. A
small factorial analysis, with bit width and task type as factors, is enough to
show an interaction if one exists.

You should record your decisions in your project log: the task suite, the scoring rules,
the prompts, the sampler, the number of repeats, the memory method, the energy
method, and the machine conditions.

## Potential limitations, risks and sources of bias

Considering the limitations of your data and model is an important part of
evaluating your project. For example:

- You are comparing one model family on one machine. The results may not
  generalise to other models, other hardware or other quantisation methods.
- The models may use different quantisation settings, so the bits and group
  size should be read from the configuration rather than assumed from the
  label.
- File size, memory and energy are different quantities. A smaller file does
  not always mean a smaller runtime footprint, and a smaller model does not
  always mean less energy per useful output.
- Peak RSS includes the Python process, the operating system's caches and
  temporary buffers. It is not a pure measure of the model's weights.
- Energy measurement is noisy. Background applications, fan speed, room
  temperature and battery state can dominate small differences, so repeats,
  randomised order and a report of the uncertainty are needed.
- `powermetrics` reports package power, not the power drawn from the wall. It is
  useful for relative comparisons but not for a precise carbon calculation.
- Tokens per second depends on prompt length, batch size, maximum new tokens
  and the sampler, so those settings need to be fixed across models. Otherwise
  the comparison measures the settings rather than the quantisation.
- The task suite may be too easy or too hard, so it should be piloted with 10
  items per category and the difficulty adjusted until the models do not all
  score 100% or 0%.
- Perplexity is not the same as usefulness. A model can have a lower perplexity
  and still be worse at following instructions, or vice versa.
- If you use a public benchmark, the model may have seen the questions during
  pre-training, so prompts you write yourself or a held-out set are safer, and
  the choice should be stated.
- The quality difference between adjacent bit widths may be smaller than the
  run-to-run noise, so a difference should not be claimed unless the repeats
  support it.
- A quantised model may be faster because it uses a different kernel, not simply
  because it has fewer bits, so the end-to-end result should be measured and the
  difference not attributed to one cause.
- "Energy storage" can mean different things: disk size, memory in use, or
  energy consumed. This project separates them, and you would decide which are
  relevant to your use case. That choice should be explained in your evaluation.

You should consider how these limitations affect the claims you can reasonably
make from your measurements.

## Expected outcomes and opportunities for evaluation

The expected outcome would be a benchmark harness, a table of quality and
resource measurements for each quantisation, and a set of trade-off plots.
Importantly, a model that loses accuracy is not a failed project. The shape of
the trade-off is more important than whether one model wins on every measure:
where quality starts to fall, which resources improve fastest, and whether the
cheapest model is also the cheapest per correct answer.

You could evaluate the models on held-out questions and held-out text, compare
the quality ranking with the memory, speed and energy rankings, and identify
the bit width that gives the best value for a stated use case. You could also
compare the measured file size with the theoretical size, and the measured
memory with the file size, to show how much of the resource cost is overhead.

You could pick one task category where 3-bit fails and one where it succeeds,
and explain the difference. You could ask whether the failure comes from a loss
of factual knowledge, an inability to follow a multi-step instruction, or a
change in formatting. That analysis is more informative than a single accuracy
figure.

You could finish by reflecting on what a deployment decision would look like:
if you were shipping a local assistant on a 16 GB laptop, which quantisation
you would choose, and what evidence would change your mind. You could use that
comparison to justify a deployment choice.

## Suitability as an EPQ artefact

This could make a strong EPQ artefact because designing the benchmark requires
you to make a series of decisions that you can research, justify and evaluate.
The harness provides a tangible outcome, while the measurement process provides
evidence of planning, research, problem-solving and reflection. The code is
mostly measurement and plotting rather than model training, so a student with
some Python experience can manage it.

Crucially, the project is open-ended. There is no single correct task suite,
resource metric or recommendation, and the quality of your EPQ does not depend
simply on finding one model that wins on every measure. You have scope to make
and justify your own decisions about the tasks, the measurement method, and the
resource that is most important for a particular user.

You could also discuss green computing and edge deployment: the same questions
about memory, speed and energy are asked by engineers who run models on phones,
in cars and in data centres. Your measurements are on a small scale, but the
questions are similar.

## Example artefacts

*Placeholder: the images and tables are not yet included. The list shows the
evidence a finished project could include.*

- A results table with one row per quantisation and columns for quality, tokens
  per second, peak memory, file size and energy per token.
- A trade-off plot of quality against bits, with error bars from your repeats.
- A plot of tokens per second and peak memory against bits.
- A plot of energy per token and energy per correct answer against bits.
- A short recommendation table for two use cases, such as a laptop assistant and
  a shared server, with the evidence for each choice.

## Further reading

- [Dettmers and Zettlemoyer, "The case for 4-bit precision: k-bit inference
  scaling laws"](https://arxiv.org/abs/2212.09720) (2022) — the paper behind the
  4-bit rule of thumb.
- [Frantar et al., "GPTQ: Accurate Post-Training Quantization for Generative
  Pre-trained Transformers"](https://arxiv.org/abs/2210.17323) (2023) — a widely
  used quantisation method.
- [Gholami et al., "A survey of quantization methods for efficient neural
  network inference"](https://arxiv.org/abs/2103.13630) (2021) — a map of the
  field.
- The [MLX documentation](https://github.com/ml-explore/mlx-lm) on quantisation
  and `mlx_lm.convert` — the practical reference for the models you are using.
- [Strubell, Ganesh and McCallum, "Energy and Policy Considerations for Deep
  Learning in NLP"](https://arxiv.org/abs/1906.02243) (2019) — why energy
  measurement is important.
- [Patterson et al., "Carbon Emissions and Large Neural Network Training"](https://arxiv.org/abs/2104.10350)
  (2021) — optional, on the wider energy picture.
