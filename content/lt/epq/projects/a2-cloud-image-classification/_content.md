# Can a model trained on curated cloud photographs recognise the sky above your school?

> One way to run this project, not the only way. Change the question, the
data, the tool or the artefact to suit what interests you: the choices, and
the reasons for them, have to be yours before your centre approves the
proposal.

## Project overview

You could investigate whether a computer can identify cloud genera from
photographs, and whether a model trained on professionally curated images still
works on ordinary phone photos of the sky. You would build the classifier in
**Orange Data Mining**, using the **Image Features** widget to turn each
photograph into 36 human-readable measurements of brightness, profile, spatial
mass, texture, topology and symmetry. An optional seventh group adds four
colour measurements. The model learns from those numbers, and **Test & Score**,
**Confusion Matrix** and **Column Statistics** show where it succeeds and where
it fails.

An important part of the project would be a field test. The training corpus
comes from the [WMO International Cloud Atlas](https://cloudatlas.wmo.int/):
five genera, 191 photographs, chosen to illustrate the classification. Those
images are often dramatic and well framed. Your own sky photos may include
flat light, horizons, buildings and mixed cloud. Your project would investigate
how well a model trained on the first kind of image performs on the second. A
model that scores well in cross-validation and then fails on your photos would
show how much the results depend on the training images.

Your final artefact could be the workflow, a labelled field-test set, a
confusion matrix for each test, and a written analysis of which genera and
which features cause the confusion.

**What you submit.** The assessed product is a written report: around 5,000
words for a research project, or at least 1,000 words alongside an artefact
such as the one described here. The tables, plots and workflow are evidence
you discuss in the report, not the submission itself.

## Dataset(s) to be used

A suitable starting point would be the [WMO International Cloud Atlas](https://cloudatlas.wmo.int/).
The [`orange3-ai-suite`](https://github.com/tcorbettclark/orange3-ai-suite)
add-on's repository includes a fetcher that downloads a curated corpus of five
genera: cirrus (43 images), altocumulus (40), stratocumulus (26), cumulonimbus
(39) and cumulus (43). That is 191 images in total, written to one folder per
genus, which is the layout **Import Images** expects. If you do not have the repository, download images from the Atlas
galleries yourself and arrange them the same way. The images remain the
property of their photographers. They are provided for personal,
non-commercial teaching use under the Atlas copyright terms and are not covered
by the add-on's code licence. The fetcher also writes a credits file listing the
photographer, location, date and Atlas image ID for every image, so you can cite
them properly and remove any image you do not want to use.

The Atlas is the reference standard for cloud classification. Its definitions
and photographs are the authority for what each genus is, and its images are
chosen to be clear examples. They are useful for training, but they are not a
representative sample of everyday sky photographs.

Your own photographs are the second dataset. Aim for 20–40 images per genus,
taken over several weeks and in different weather. Include dull, overcast days
as well as spectacular ones. Label each photo against the Atlas definitions and
record the date, time and location. If a photo shows several genera, decide
whether to label the dominant one or exclude it, and apply that rule
consistently. Keep the images sky-only where possible; avoid identifiable
people, houses or car number plates.

You could also use a public cloud dataset from Kaggle or the Hugging Face Hub,
but check the licence and the climate. Images from another country may not
match UK skies. If you use one, keep it as a separate experiment rather than
mixing it into your main corpus without recording the change. The Atlas has no
"clear sky" gallery because it classifies clouds; if you want a clear-sky
class, collect it yourself, and note that "is there a cloud?" is a different
question from "which genus is this?".

## Suggested research question or hypothesis

For example:

> To what extent can a classifier trained on curated cloud-atlas photographs
> recognise cloud genera in everyday sky photographs, and which genera and
> features cause the most confusion?

You could develop this into more specific questions, such as whether shape and
texture features outperform colour features, whether the model generalises from
Atlas images to your own photos, which pairs of genera are systematically
confused, or whether adding a small number of your own photos to the training
set improves the field test.

You could test whether colour looks helpful in cross-validation because it
separates blue sky from grey cloud, but does not help distinguish genera once
the sky is overcast. You could test that by comparing
group G on and off, and by looking at whether the model's errors are cases
where the colour cue is absent.

**Variants.** The same approach works on any labelled image collection: cloud
genera in another region, cloud type against time of day, or a teaching set
for a different subject.

## Key data science, statistical and machine learning concepts

Your project could involve:

- image classification, labels and features
- feature extraction and the difference between shape, texture and colour
- the colour shortcut: a feature that predicts the label for the wrong reason
- training, validation and test data, and cross-validation on a small corpus
- accuracy, per-class accuracy, precision, recall and the confusion matrix
- class imbalance and why 26 images of one genus behave differently from 43
- ablation: switching feature groups on and off
- domain shift: curated Atlas images versus ordinary phone photos
- baselines: a majority-class predictor, a colour-only model and a shape-only
  model
- human baselines, labelling error and ambiguous examples

The feature groups give you a vocabulary for the investigation. **A (6)**
covers brightness and global photometry; **B (12)** row, column and diagonal
profiles; **C (6)** spatial mass, centre of mass and spread; **D (6)** texture
and edge density; **E (3)** topology; **F (3)** symmetry; and **G (4)** colour,
including bluish fraction, blueness, saturation and greenery. Group G is off by
default because it is a shortcut. Groups A–F give 36 features; adding G gives
40.

## Suggested approaches to data preparation, analysis and modelling

**How much to attempt.** Train and evaluate on the curated corpus, then test
on 10–20 of your own photographs; a larger field set is an extension. You need
Orange Data Mining with the same add-on and its `image` extra, plus a camera —
see [Prerequisites](../../prerequisites/).

You could begin by fetching or collecting the corpus and building the workflow
from scratch: **Import Images** → **Image Features** → **Test & Score**, with
**Neural Network**, **Tree** and **Logistic Regression** as learners, and
**Confusion Matrix**, **Data Table** and **Column Statistics** for inspection.
You could set the working size to 128.

First, run a baseline with groups A–F and 5-fold cross-validation. Read the
confusion matrix by genus. You could identify which pairs are confused.
Altocumulus and stratocumulus are both layered and often appear in similar
light; cumulus and cumulonimbus share a lumpy shape. Look at the images behind
the errors in **Image Features** or **Data Table**, and consider why the
features might overlap.

Then switch on group G and rerun. Accuracy may rise. Inspect the new features:
`bluish_fraction`, `blueness_mean`, `saturation_mean` and `greenery_fraction`.
A model can use "is the image blue?" as a proxy for "is this a sky photo?"
without learning anything about cloud shape. You could run a colour-only model
(G on, A–F off) and a shape-only model (A–F on, G off). If the colour-only model
is much stronger than you expected, that is evidence of a shortcut. You could
compare learners on exactly the same features: if the neural network, tree and
logistic regression all produce similar results, the features are doing the work.

The field test would be the main part of the investigation. Take 20–40 new
photos, label them against the Atlas, and import them with a second **Import
Images** widget, using the same folder names as the training corpus. Run **Image
Features** with the same settings and connect the result to the **Test Data**
input of **Test & Score**. Do not tune on these images. Record the accuracy and
the confusion matrix, then compare them with the cross-validation results. You
could identify which genera survive the change, and whether the errors are
caused by mixed sky, flat light, horizon clutter, or a real similarity between
genera. You could then add half of your field photos to the training set and
test on the other half, to see whether a small amount of local data closes the
gap.

A human baseline is optional but valuable. Ask a weather-savvy friend or a
geography teacher to classify the same field photos, using the Atlas
definitions. Compare their errors with the model's. With a small sample you
cannot draw strong conclusions, but the comparison shows that some clouds are
hard for people too. If you use **Preprocess** to normalise features, connect the
**Preprocessor** output to **Test & Score** so that normalisation is fitted
inside each fold.

You should record your decisions in your project log: which genera you included, what
counted as a valid photo, how you handled mixed skies, how you split training
and field-test data, and which feature groups you used.

## Potential limitations, risks and sources of bias

Considering the limitations of your data and model is an important part of
evaluating your project. For example:

- The Atlas corpus is curated. Its photographs are chosen to illustrate each
  genus, often in dramatic light and with a clear subject. Your phone photos
  are unlikely to look like that.
- The corpus is small: 191 images, with only 26 stratocumulus. Cross-validation
  helps, but it cannot create data, and per-class results may be unstable.
- Many Atlas photographs contain more than one genus. The label usually names
  the dominant or most instructive cloud, not the only cloud in the frame. Your
  own labels have the same ambiguity.
- Colour is a shortcut. A high score with group G on may reflect blue sky,
  green ground or camera white balance rather than cloud structure.
- Hand-crafted features are not a modern vision model. A pretrained embedding
  or a convolutional network would probably score higher. Your project would
  focus on explanation and generalisation.
- The classes are imbalanced, so overall accuracy can hide poor performance on
  the smallest class. Per-class accuracy and the confusion matrix are more
  informative.
- The field test is small and local. One fortnight of weather is not a climate,
  and your photos may all come from one location or one time of day.
- The Atlas licence permits personal, non-commercial teaching use, so the images
  should not be redistributed or used in a public product, and the credits file
  should stay with the data.
- Photographing the sky raises few ethical issues, but identifiable people,
  houses and car number plates should be avoided. If you ask classmates for
  photos, get consent and keep them anonymous.

You should consider how these limitations affect the claims you can reasonably
make from your model.

## Expected outcomes and opportunities for evaluation

The expected outcome would be a working Orange workflow that classifies cloud
genera, a feature-ablation table, a confusion matrix for the Atlas corpus and a
second confusion matrix for your own photos. Importantly, a highly accurate
model is not necessary for your project to be successful. A model that does well
in cross-validation and then fails in the field is an interesting result,
provided you can explain why.

You could evaluate the model on held-out Atlas images and on your own photos,
compare the two confusion matrices, and identify which genera and feature
groups produce the largest errors. You could also compare a colour-only model
with a shape-only model, and ask whether the apparent skill is really a
shortcut.

You could pick three field-test errors and inspect the images. You could ask
whether the cloud was mislabelled, whether it was a mixed sky, whether the light
was unusual, and whether the model relied on colour. If you can answer those
questions, you have a stronger evaluation than a single accuracy figure. You could finish by considering what would be needed to
make the model useful for a real user: more local training data, a "not sure"
option, a clear-sky class, or a different kind of model.

## Suitability as an EPQ artefact

This could make a strong EPQ artefact because producing the classifier requires
you to make a series of decisions that you can research, justify and evaluate.
The model provides a tangible outcome, while the fieldwork provides evidence of
planning, research, problem-solving and reflection. The no-code tools leave you
time for data collection, labelling and interpretation.

Crucially, the project is open-ended. There is no single correct set of genera,
features or field-test design, and the quality of your EPQ does not depend
simply on achieving the highest accuracy. You have scope to make and justify
your own decisions about the cloud classes, the handling of mixed skies, and the
field test. You could also discuss shortcut learning, domain shift, and the
difference between a curated dataset and ordinary photographs.

## Example artefacts

*Placeholder: the images and tables are not yet included. The list shows the
evidence a finished project could include.*

- A screenshot of the finished Orange canvas: **Import Images** → **Image
  Features** → **Test & Score** → **Confusion Matrix**.
- A feature-ablation table for groups A–F, A–F plus G, and G only.
- A confusion matrix for the Atlas images under cross-validation.
- A second confusion matrix for your own field photographs.
- A grid of three misclassified clouds, with a note on what the model may have
  used instead of cloud shape.
- A human-baseline table comparing a friend's or teacher's classifications with
  the model's.

## Further reading

- The [WMO International Cloud Atlas](https://cloudatlas.wmo.int/) — the
  definitions and reference photographs for every genus.
- The [Met Office "Learn about weather — clouds" pages](https://www.metoffice.gov.uk/weather/learn-about/weather/types-of-weather/clouds)
  — UK-specific identification guidance.
- The [Orange Image Analytics documentation](https://orange3-imageanalytics.readthedocs.io/)
  — **Image Features**, **Test & Score** and **Confusion Matrix**.
- [Geirhos et al., "Shortcut Learning in Deep Neural Networks"](https://arxiv.org/abs/2004.07780),
  *Nature Machine Intelligence* (2020) — a readable account of why models learn
  the wrong cues.
- [Beery, Van Horn and Perona, "Recognition in Terra Incognita"](https://arxiv.org/abs/1804.01159),
  ECCV (2018) — optional, on recognising objects in unfamiliar conditions.
