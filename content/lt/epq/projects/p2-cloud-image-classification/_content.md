# Can a model trained on curated cloud photographs recognise the sky above your school?

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

The second half of the project is a field test. The training corpus comes from
the [WMO International Cloud Atlas](https://cloudatlas.wmo.int/): five genera,
191 photographs, chosen to illustrate the classification. Those images are
often dramatic and well framed. Your own sky photos may include flat light,
horizons, buildings and mixed cloud. Your project would investigate how well a
model trained on the first kind of image performs on the second. A model that
scores well in cross-validation and then fails on your photos would show how
much the results depend on the training images.

You could produce the workflow, a labelled field-test set, a
confusion matrix for each test, and a written analysis of which genera and
which features cause the confusion.

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

Photograph within your centre's rules: note where and when you went, who knew,
and what you would do in bad weather — that is your risk assessment.

You could also use a public cloud dataset, but only one you can name, date and
cite: check its licence and the climate it was taken in. Images from another
country may not match UK skies. If you use one, keep it as a separate
experiment rather than mixing it into your main corpus without recording the
change. The Atlas has no "clear sky" gallery because it classifies clouds; if
you want a clear-sky class, collect it yourself, and note that "is there a
cloud?" is a different question from "which genus is this?".

## Example research questions or hypothesis

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

The same approach works on any labelled image collection: cloud genera in
another region, cloud type against time of day, or a teaching set for a
different subject.

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

## Example approaches to data preparation, analysis and modelling

You could train and evaluate on the curated corpus, then try a handful of your
own photographs; a larger field set can wait.

You could begin by fetching or collecting the corpus and building the workflow
from scratch: **Import Images** → **Image Features** → **Test & Score**, with
**Neural Network**, **Tree** and **Logistic Regression** as learners, and
**Confusion Matrix**, **Data Table** and **Column Statistics** for inspection.
You could set the working size to 128.

## Potential limitations, risks and sources of bias

The limitations you could consider include:

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
- - otographing the sky raises few ethical issues, but identifiable people,
  houses and car number plates should be avoided. If you ask classmates for
  photos, think about what you need to ask them first, and what your centre
  needs to agree to.

Think about how these limitations affect the claims you can reasonably
make from your model.

## Expected outcomes and opportunities for evaluation

The expected outcome would be a working Orange workflow that classifies cloud
genera, a feature-ablation table, a confusion matrix for the Atlas corpus and
a second confusion matrix for your own photos. A highly accurate model is not
necessary. A model that does well in cross-validation and then fails in the
field gives you something to explain.

You could evaluate the model on held-out Atlas images and on your own photos,
compare the two confusion matrices, and identify which genera and feature
groups produce the largest errors. You could also compare a colour-only model
with a shape-only model, and ask whether the apparent skill is really a
shortcut.

You could pick three field-test errors and inspect the images. You could ask
whether the cloud was mislabelled, whether it was a mixed sky, whether the
light was unusual, and whether the model relied on colour. Answering those
questions takes you beyond a single accuracy figure. You could finish by
considering what would be needed to make the model useful for a real user:
more local training data, a "not sure" option, a clear-sky class, or a
different kind of model.


## Example artefacts

- A screenshot of the finished Orange canvas: **Import Images** → **Image
  Features** → **Test & Score** → **Confusion Matrix**.
- A feature-ablation table for groups A–F, A–F plus G, and G only.
- A confusion matrix for the Atlas images under cross-validation.
- A second confusion matrix for your own field photographs.
- A grid of three misclassified clouds, with a note on what the model may have
  used instead of cloud shape.
- A human-baseline table comparing a friend's or teacher's classifications with
  the model's — optional, and only once you have thought about what you are
  asking them for.

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
