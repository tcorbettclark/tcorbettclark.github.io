# Can a small language model tell you when it is likely to be wrong?

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

You could produce a Python harness, a question set you designed,
calibration plots for each model, and a written analysis of when confidence is
useful and when it is misleading.

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
chapter of a public-domain book such as *Alice's Adventures in Wonderland*
([Project Gutenberg ebook 11](https://www.gutenberg.org/ebooks/11)), or a
Wikipedia article you record by title, revision date and URL. Compute perplexity on it for
each quantisation. This is not a confidence measure for individual answers, but
it tells you whether the model is generally more or less uncertain after
compression.

If you use Wikipedia, check the licence and attribute it; a public-domain text
avoids the question entirely.

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

**A way in.** One quantisation and a pilot question set will show you what the
measurement involves; more questions and models can follow.

You could begin by building the question set in a spreadsheet or a CSV file.
You would keep the prompt, the correct answer, the distractors, the category,
the difficulty and the source in separate columns. Write 20 pilot items first
and run them through the model.

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

Think about how these limitations affect the claims you can reasonably
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
