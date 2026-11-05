# Can a small language model tell you when it is likely to be wrong?

> One way to run this project, not the only way. Change the question, the
data, the tool or the artefact to suit what interests you: the choices, and
the reasons for them, have to be yours before your centre approves the
proposal.

## Project overview

You could investigate whether a language model's own probabilities can warn
you when its answer is unreliable. A model can sound confident and be wrong.
You would then test whether that confidence is measurable, and whether it tracks
accuracy. You would run [BritLLM](https://huggingface.co/britllm/britllm-3b-v0.1),
the 3B model you would run locally, on a set of questions with known answers.
For each question you would score the model's probability of the correct answer
and of the answer it prefers. Then you would check whether high confidence
means high accuracy.

This would be a project about **calibration**: the relationship between the
confidence a model expresses and the proportion of times it is right. You would
build **reliability diagrams**, measure **expected calibration error**, and test
a practical use of confidence: **selective prediction**. You would test how much
accuracy the model gains, and how many questions it has to give up, if it
answers only when it is confident. You could compare 3-bit, 6-bit and 8-bit
models, and compare different kinds of question.

You would measure confidence from the model's probabilities, not from how
confident the text sounds. This is more precise than counting hedging words, and
it lets you test whether the model "knows what it knows" in a way that can be
checked. You could also compare probability confidence with the model's verbal
confidence, if you can elicit a number from it.

Your final artefact could be a Python harness, a question set you designed,
calibration plots for each model, and a written analysis of when confidence is
useful and when it is misleading.

**What you submit.** The assessed product is a written report: around 5,000
words for a research project, or at least 1,000 words alongside an artefact
such as the one described here. The tables, plots and workflow are evidence
you discuss in the report, not the submission itself.

## Dataset(s) to be used

The models are the local **BritLLM** MLX quantisations: **3-bit**, **6-bit**
and **8-bit**. The [model card](https://huggingface.co/britllm/britllm-3b-v0.1)
records the licence and context length. The model has 3B parameters and a
2048-token context. All three quantisations run on a 16 GB M-series Mac. Start
with one quantisation and add the others once the harness works.

Your main dataset is a question set you write yourself. Aim for 100–200 items.
Each item needs:

- a short prompt, such as `The capital of France is`
- a correct answer, such as `Paris`
- two or three plausible distractors, such as `Lyon` and `Marseille`
- a category, such as factual recall, arithmetic, science, history, or a
  made-up entity
- a difficulty rating, which you assign before you see the model's results
- a source for the correct answer, so that you can check it later

A candidate-based format is a good fit for a base model. The model has not been
instruction-tuned, so it may continue text rather than answer a question.
Asking it to choose between candidates turns the task into a probability
comparison, which is exactly what you need for calibration. It also keeps the
scoring automatic and reproducible.

You could include easy, medium and hard items, and include some questions about things
that do not exist, such as a made-up capital city or a fictional chemical
element. A model that is confident about a fictional fact is showing you
something important. Include questions with ambiguous answers, and decide in
advance how you would handle them; ambiguity is part of the phenomenon, but it
complicates the scoring.

If you want a larger or more standard set, you could use a public
multiple-choice dataset such as [**AI2 Reasoning Challenge**](https://huggingface.co/datasets/allenai/ai2_arc)
(`allenai/ai2_arc`) or [**OpenBookQA**](https://huggingface.co/datasets/allenai/openbookqa)
(`allenai/openbookqa`). Check the dataset card and licence, and consider whether
the model may have seen the questions during pre-training. A public benchmark is
useful for comparison, but your own questions give you more control over
difficulty and contamination.

For a general measure of the model's surprise, use a held-out text: a
public-domain book chapter or a Wikipedia extract. Compute perplexity on it for
each quantisation. This is not a confidence measure for individual answers, but
it tells you whether the model is generally more or less uncertain after
compression.

If you also want to compare verbal confidence, you need prompts that ask the
model to state a probability, such as `How confident are you, from 0 to 100?`.
A base model may not follow that instruction reliably. You could treat verbal
confidence as a separate, optional experiment, and say clearly that it is a
different measurement.

## Suggested research question or hypothesis

For example:

> Can the token probabilities of a small language model be used to predict when
> its answers are wrong, and how well calibrated is that confidence across task
> types and quantisation levels?

You could develop this into more specific questions, such as whether high
confidence implies high accuracy, whether 3-bit is less calibrated than 8-bit,
whether the model is more overconfident on rare facts or on arithmetic, or
whether selective prediction can give a useful accuracy gain at a reasonable
coverage.

You could test whether the model is well calibrated on easy, common facts and
overconfident on hard or rare ones. You could test that by grouping the questions
by difficulty and category and plotting a separate reliability diagram for each
group.

## Key data science, statistical and machine learning concepts

Your project could involve:

- probability, log-probability and the softmax function
- scoring a fixed answer by summing the log-probabilities of its tokens
- length normalisation and why answer length is important
- accuracy, confidence and the difference between them
- calibration and **reliability diagrams**
- **expected calibration error** (ECE) and the **Brier score**
- selective prediction, coverage and the **risk-coverage curve**
- baselines: random choice, the most frequent answer, and always answering
- sampling versus scoring: generating an answer versus measuring the
  probability of a fixed answer
- temperature and how it changes the distribution
- tokenisation and multi-token answers
- question design, candidate sets and difficulty
- experimental control across quantisations
- confidence intervals and the uncertainty of a proportion
- the difference between "the model is uncertain" and "the question is
  ambiguous"
- contamination and benchmark leakage
- verbal confidence and its limits

The central idea is calibration. A model is calibrated if, among all the
questions where it says it is 80% confident, it is right about 80% of the time.
Perfect calibration is rare. The useful question is how far from calibrated the
model is, and whether the gap is stable enough to support a decision.

## Suggested approaches to data preparation, analysis and modelling

**How much to attempt.** One quantisation and a pilot of about 40 questions
answers the question; bigger question sets and more models are extensions. You
need the same kit as B1: Python, `mlx-lm` and an Apple-silicon Mac with 16 GB
— see [Prerequisites](../../prerequisites/).

You could begin by building the question set in a spreadsheet or a CSV file.
You would keep the prompt, the correct answer, the distractors, the category, the
difficulty and the source in separate columns. Write 20 pilot items first and
run them through the model. If the model gets everything right or everything
wrong, adjust the difficulty before writing the full set.

You could write a scorer in Python. For each question and each candidate answer:

1. Build the text `prompt + " " + answer`.
2. Tokenise it with the model's tokenizer.
3. Run the model on the token IDs and collect the logits.
4. Sum the log-probabilities of the answer tokens, using the logits at the
   positions that predict each token.
5. Divide by the number of answer tokens to length-normalise.
6. Convert the candidate scores to probabilities with a softmax.

The result is a probability for each candidate. Record the top candidate, its
probability, the margin between the top two, and whether it is correct. Check
the scorer on a few examples by comparing the top candidate with a greedy
generation: they should usually agree. If they do not, the prompt or the
tokenisation is probably wrong.

You could run the same questions through the 3-bit, 6-bit and 8-bit models. Keep the
prompt, the candidate set, the tokeniser and the scoring rule identical. The
models share a tokenizer, so the comparison is fair. If you change the prompt
format between models, you are measuring the prompt, not the quantisation.

Compute the basic statistics for each model:

- accuracy: the proportion of questions where the top candidate is correct
- mean confidence: the average probability of the top candidate
- the calibration curve: bin the questions by confidence (for example, 0–10%,
  10–20%, ...) and plot the observed accuracy in each bin against the mean
  confidence
- expected calibration error: a weighted average of the gap between confidence
  and accuracy across the bins
- the Brier score: the mean squared error between the predicted probability of
  the chosen answer and whether it was correct

You could plot a reliability diagram for each model and each task category. A model that
is overconfident sits below the diagonal: it claims more certainty than it
delivers. A model that is underconfident sits above it. Look at the number
of questions in each bin; a bin with three questions is not evidence of much.

Then test selective prediction. Sort the questions by confidence and answer
only the top proportion. Plot accuracy against coverage. You could compare
accuracy at 50% and 80% coverage, find the confidence threshold that gives 90%
accuracy, and report how many questions are answered at that threshold. Compare
the curve for 3-bit, 6-bit and 8-bit. A model that is better calibrated may
give a better accuracy-coverage trade-off even if its overall accuracy is
similar.

If you want to compare probability confidence with verbal confidence, run a
separate experiment. Ask the model to state a confidence from 0 to 100 after
each answer, parse the number, and compare it with the probability-based
confidence. You could ask whether the self-report tracks accuracy, and whether
it is systematically higher or lower. Treat the result with caution: the self-report is generated text, not a
direct readout of the model's internal state.

If you want to test sampling consistency, generate ten answers at temperature
0.8 for each question and measure how often they agree with the top candidate.
You could test whether agreement is a better predictor of correctness than the
probability of the top candidate. This is related to the idea of **semantic
uncertainty**, but keep it simple: agreement is a count, not a probability.

Try ten questions first: it is slower than it looks, and it is an extension
rather than part of the core.

You should report confidence intervals for accuracy and for ECE. With 100–200 questions,
the intervals are wide, especially for subgroup analyses. A bootstrap
resampling of the questions is a simple way to estimate the uncertainty without
new data.

You should record your decisions in your project log: the question set, the candidate
sets, the length normalisation, the prompt template, the categories, the
correctness rule, and how you handled ambiguous or refused answers.

## Potential limitations, risks and sources of bias

Considering the limitations of your data and model is an important part of
evaluating your project. For example:

- A language model's token probability is not a calibrated statement of truth.
  It reflects the likelihood of the next token given the prompt, which is
  influenced by phrasing, frequency and the model's training data.
- A base model may not treat the candidates as options. It may prefer a
  continuation that is grammatically likely rather than factually correct.
  That is part of what you are measuring, but it limits how directly you can
  read the result as "knowledge".
- The question set is small and yours. It may be biased toward facts you know
  and phrasings the model handles. Public benchmarks may be contaminated.
- The candidate set affects confidence. Adding a plausible distractor changes
  the softmax and can make the model look less confident without changing its
  knowledge.
- Length normalisation is a choice: dividing by the number of answer tokens can
  favour short answers, and not dividing can favour long ones. Both should be
  tried and the sensitivity reported.
- Tokenisation can split an answer into several tokens, and the boundary
  between prompt and answer may not align with a token, so the token IDs should
  be checked by hand for a few examples.
- Quantisation can change probabilities, but it can also change the speed and
  the kernel, so differences should not be attributed to bits without checking
  the configuration.
- Calibration on one set of questions may not transfer to another, so
  per-category results are more informative than a single claim that the model
  is "generally calibrated".
- ECE depends on the number and width of the bins, so fixed bins, the number of
  items per bin and a bootstrap estimate of uncertainty should be reported.
- The model may have seen the public benchmark questions during pre-training, so
  your own questions or a held-out set are safer, and the choice should be
  stated.
- Verbal confidence is generated text and may be influenced by the prompt, the
  model's style, or a desire to please. It is not ground truth.
- A model that is overconfident on your questions is not necessarily
  overconfident on all tasks, so the conclusion should be scoped to the model,
  the questions and the conditions tested.
- If you conclude that confidence is useful for selective prediction, remember
  that a wrong answer that is deferred still has a cost. The coverage-accuracy
  curve shows the trade-off, but it does not make the decision for you.

You should consider how these limitations affect the claims you can reasonably
make from your model.

## Expected outcomes and opportunities for evaluation

The expected outcome would be a Python harness that scores candidate answers, a
question set you designed, calibration plots and a coverage-accuracy curve for
each quantisation. Importantly, a model that is poorly calibrated is not a
failed project. The size and direction of the miscalibration are more important
than a single accuracy figure, and so is whether it is stable enough to be
useful.

You could evaluate the models on overall accuracy, calibration and selective
prediction, and compare the results across task categories and bit widths. You
could also compare probability confidence with verbal confidence, and ask
whether the two agree. A model whose words and probabilities disagree would be
worth discussing.

You could pick three questions where the model was confidently wrong and three
where it was uncertain and right. You could ask what made the difference, and
whether the question was rare, ambiguous, or phrased in an unusual way. If you
can answer that, you have a stronger evaluation than a single calibration score.

You could finish by reflecting on what confidence would need to be useful in a
real application: a reliable threshold, a clear cost for deferring, and a way
to communicate uncertainty to a user.

## Suitability as an EPQ artefact

This could make a strong EPQ artefact because designing the question set and the
scoring method requires you to make a series of decisions that you can research,
justify and evaluate. The harness provides a tangible outcome, while the
analysis provides evidence of planning, research, problem-solving and
reflection. The code is mostly scoring and plotting; the main work is designing
the questions and interpreting the calibration.

Crucially, the project is open-ended. There is no single correct question set,
confidence measure or threshold, and the quality of your EPQ does not depend
simply on finding a model that is perfectly calibrated. You have scope to make
and justify your own decisions about the task categories, the definition of a
correct answer, and the kind of uncertainty that is most important.

You could also discuss questions from AI safety and human-computer interaction:
how people interpret confidence, when a model should refuse, and why a fluent
answer is not the same as a reliable one. You could use your calibration curves as evidence in that discussion.

## Example artefacts

*Placeholder: the images and tables are not yet included. The list shows the
evidence a finished project could include.*

- Reliability diagrams for 3-bit, 6-bit and 8-bit BritLLM, with the number of
  questions in each bin.
- A table of accuracy, mean confidence, expected calibration error and Brier
  score for each quantisation.
- A coverage-accuracy curve for each quantisation, with the 90% accuracy
  threshold marked.
- A table of the three most confidently wrong questions, with the model's
  chosen answer and probability.
- An optional scatter plot comparing verbal confidence with probability-based
  confidence.

## Further reading

- [Guo et al., "On Calibration of Modern Neural Networks"](https://arxiv.org/abs/1706.04599)
  (2017) — the source of the reliability diagram and ECE methods used in this
  project.
- [Kadavath et al., "Language Models (Mostly) Know What They Know"](https://arxiv.org/abs/2207.05221)
  (2022) — evidence that models can sometimes estimate their own correctness.
- [Lin, Hilton and Evans, "Teaching Models to Express Their Uncertainty in
  Words"](https://arxiv.org/abs/2205.14334) (2022) — verbal confidence and its
  limits.
- [Farquhar et al., "Detecting hallucinations in large language models using
  semantic entropy"](https://www.nature.com/articles/s41586-024-07421-0),
  *Nature* (2024) — optional, an advanced use of sampling consistency.
- [Ji et al., "Survey of Hallucination in Natural Language Generation"](https://arxiv.org/abs/2202.03629)
  (2023) — a taxonomy of the failures you are trying to detect.
- The [scikit-learn documentation on probability calibration](https://scikit-learn.org/stable/modules/calibration.html)
  — practical definitions and plots.
