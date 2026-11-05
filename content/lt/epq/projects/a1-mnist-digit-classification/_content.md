# Can a no-code image classifier read handwritten digits, and can you explain its mistakes?

> One way to run this project, not the only way. Change the question, the
data, the tool or the artefact to suit what interests you: the choices, and
the reasons for them, have to be yours before your centre approves the
proposal.

## Project overview

You could investigate whether a computer can recognise handwritten digits from
a small set of human-readable image measurements, rather than from raw pixels.
You would build the classifier in **Orange Data Mining**, using the **Image
Features** widget from the
[`orange3-ai-suite`](https://github.com/tcorbettclark/orange3-ai-suite) add-on.
The widget turns each image into 36 numbers describing brightness, row and
column profiles, spatial mass, texture, enclosed holes, stroke crossings and
symmetry. Each feature has a one-sentence definition, so you can inspect it
before you trust it. A **Neural Network** learns from those numbers, and the
**Neural Network Viewer** draws the network and its weights.

A highly accurate model is not necessary for your project to be successful. A
convolutional network trained in Python would probably score higher. Your
project would be about explaining the classifier: which measurements carry the
signal, which digits it confuses, and whether a model trained on a clean
teaching dataset recognises digits written by you. You would produce a
reusable Orange workflow, evaluation tables and plots, and a written analysis
that names the features behind each success and failure.

Your final artefact could be the workflow itself, together with a short user
guide that lets someone else load a digit image and see the prediction and the
feature values that produced it.

**What you submit.** The assessed product is a written report; the
tables, plots and workflow are evidence you discuss in it, not the
submission itself. Your board sets the length and the form, so check the
current specification or ask your supervisor.

## Dataset(s) to be used

A suitable starting point would be the standard MNIST dataset. The
`orange3-ai-suite` repository includes a prepared subset of 5,000 training
images (500 per digit) and 1,000 validation images (100 per digit), stored as
56×56 PNGs in one folder per class. The folder names are the labels, which is
the layout **Import Images** expects. The subset was drawn from standard MNIST
with a fixed seed by the repository's MNIST demo builder, so you can rebuild it
or read how it was sampled. If you download full MNIST, create the same
folder-per-class layout.

MNIST is clean, centred and light-on-dark: white digits on a black background.
If you photograph your own digits with dark ink on white paper, invert them
before importing, or the features may describe the background rather than the
stroke. For your own test set, collect 20–50 examples of each digit, crop them
to squares, and put them in folders named 0–9. Ask classmates for samples if you
want a wider range of styles, with their consent and without collecting
anything more personal than the digit itself.

Get your centre's approval before you ask anyone, keep the samples anonymous,
and let people withdraw theirs at any point.

If you want more training data, full MNIST is available from
[Hugging Face](https://huggingface.co/datasets/ylecun/mnist). Download
it once and work offline afterwards. Check the dataset card and record the
licence and source in your project log.

## Suggested research question or hypothesis

For example:

> To what extent can a no-code image classifier recognise handwritten digits
> from interpretable image features, and which features explain its successes
> and failures?

You could develop this into more specific questions, such as which feature
groups carry most of the predictive signal, whether hand-crafted features beat
a raw-pixel baseline, which pairs of digits are systematically confused, or
whether the model generalises to digits written by people whose handwriting was
not in the training set.

You could test whether topological features (hole count and stroke crossings)
separate digits with enclosed regions (0, 6, 8, 9) from those without, and
whether profile and spatial-mass features matter more for digits such as 1, 2,
4 and 7. Neither is settled until you run the ablation.

**Variants.** The same workflow answers a different question on a different
image set: handwritten letters, symbols, or objects you can photograph
indoors. Check the licence of anything you did not collect yourself.

## Key data science, statistical and machine learning concepts

Your project could involve:

- classification, labels, features and target variables
- the difference between raw pixels and engineered features
- training, validation and test data, and cross-validation on small datasets
- accuracy, per-class accuracy, precision, recall and the confusion matrix
- baselines: a raw-pixel model and a majority-class predictor
- ablation: removing one feature group at a time and measuring the change
- overfitting, generalisation and data leakage
- interpretability: reading feature definitions and network weights
- domain shift, when test images do not look like training images

The add-on provides seven feature groups. **A (6 features)** covers global
photometry; **B (12)** row, column and diagonal profile summaries; **C (6)**
spatial mass, centre of mass and spread; **D (6)** texture, gradient and edge
density; **E (3)** topology, including hole count and stroke crossings; **F
(3)** symmetry; and **G (4)** colour, which is off by default and is irrelevant
for MNIST. Groups A–F give 36 features, small enough to inspect and large enough
to support a real ablation study.

## Suggested approaches to data preparation, analysis and modelling

**A way in.** Build the baseline, then one ablation; keep the rest for later
if the time allows. You need Orange Data Mining with the `orange3-ai-suite`
add-on, which provides the Image Features widget — see
[Prerequisites](../../prerequisites/).

You could begin by building the workflow from scratch: **Import Images** →
**Image Features** → **Test & Score**, with **Neural Network** as the learner
and **Confusion Matrix**, **Data Table** and **Column Statistics** attached.
Set the working size to 56 so the feature windows have something to measure.

From there the sequence is yours: decide what to measure, what to compare
and when to stop.

## Potential limitations, risks and sources of bias

Considering the limitations of your data and model is an important part of
evaluating your project. For example:

- Hand-crafted features are not a convolutional network. Your accuracy may be
  lower than a convolutional network, and that is expected.
- The feature set is fixed by the widget. You cannot invent a new measurement
  without leaving the no-code workflow, so your hypothesis space is
  constrained.
- MNIST is clean, centred and light-on-dark. Your own digits may differ in
  size, slant, stroke thickness, paper colour and polarity. A drop in accuracy
  is evidence about domain shift, not a failed model.
- The bundled subset has 5,000 training images, enough for a small classifier
  but not for fine distinctions. Cross-validation results can vary from fold
  to fold.
- The classes are balanced in MNIST but may not be balanced in your own
  collection, so overall accuracy can hide a weak class. Per-class accuracy is
  more informative.
- The **Neural Network** widget trains a scikit-learn multilayer perceptron, not
  a deep network. The viewer is designed for small networks; a large one
  becomes unreadable.
- Accuracy on a single split can mislead, so cross-validation and the spread
  across folds are more informative than one score. A final test set should stay
  untouched until the end.
- Changing the working size, contrast normalisation or denoising changes the
  feature values, so comparisons are only fair when those settings are fixed.

Think about how these limitations affect the claims you can reasonably
make from your model.

## Expected outcomes and opportunities for evaluation

The expected outcome would be a working Orange workflow that classifies digits
from interpretable features, together with a feature table, a confusion matrix
and an ablation record. A highly accurate model is not necessary for your
project to be successful. A model that reaches 92% and whose errors you can
explain is a stronger EPQ artefact than a 98% model you cannot interpret.

You could evaluate the model on held-out MNIST images and on your own
handwriting, compare it with a raw-pixel baseline and a majority-class baseline,
and examine which digits and feature groups produce the largest errors. You
could also compare the confusion matrices of the neural network, tree and
logistic regression, and ask whether they fail in the same places.

You could pick three misclassified images and trace each one back to its
feature values. You could try to explain why the model chose the wrong digit. If
you can explain them, you have a stronger evaluation than a single accuracy
figure. If you cannot, that is also a finding about the limits of the feature
set. You could finish by considering what would change with a convolutional
network: whether the errors would disappear or move somewhere less visible.

## How this might be assessed

Before you commit, ask yourself how the work would be judged: what would your
report be arguing, what evidence would you be presenting, and what would you do
with the answer? Settle that with your supervisor and your board's
specification — this page does not decide it.

Check with your supervisor that none of this overlaps work you are submitting for
another qualification.

## Example artefacts

*Placeholder: the images and tables are not yet included. The list shows the
evidence a finished project could include.*

- A screenshot of the finished Orange canvas: **Import Images** → **Image
  Features** → **Test & Score** → **Confusion Matrix**.
- A table of accuracy for each feature-group ablation.
- A confusion matrix with the three largest confusions annotated.
- A screenshot of **Neural Network Viewer** showing the strongest weights for
  one digit.
- A table comparing the model's predictions with your own handwritten digits.

## Further reading

- [LeCun, Cortes and Burges, "The MNIST Database of Handwritten Digits"](https://huggingface.co/datasets/ylecun/mnist) — the
  dataset's home page, with the original description and baseline results.
- [Orange Data Mining documentation](https://orangedatamining.com/docs/) — the
  Image Analytics add-on, **Test & Score**, **Confusion Matrix** and **Neural
  Network** pages.
- [scikit-learn user guide](https://scikit-learn.org/stable/modules/neural_networks_supervised.html)
  — "Neural network models (supervised)" and "Model evaluation" for the methods
  behind the widgets.
- [Molnar, *Interpretable Machine Learning*](https://christophm.github.io/interpretable-ml-book/)
  (2019, updated 2022) — chapters on feature importance and permutation
  importance, written for a general reader.
- [Goodfellow, Bengio and Courville, *Deep Learning*](https://www.deeplearningbook.org/)
  (2016), chapter 9 — optional background on convolutional networks.
