# Can a country's income explain how long its people live, and what do the exceptions tell us?

## Project overview

You could investigate the relationship between a country's income and the life
expectancy of its people, and use the exceptions to ask what income leaves out.
The starting point would be the pattern made famous by Gapminder: richer
countries tend to live longer. You would build a regression model in **Orange
Data Mining** to predict life expectancy from income per person, then examine
the countries that sit far above or below the trend. You would consider which
countries live much longer or much shorter than their income predicts, and what
else might explain the gap: schooling, child mortality, health spending,
geography, inequality or conflict.

A high R² is not necessary for your project to be successful. A simple model that
explains much of the variation is useful, but the exceptions are an important
part of the investigation. You would learn to read a scatter plot, fit and
interpret a regression, inspect residuals, add a second indicator without
fooling yourself, and separate correlation from causation.

Your final artefact could be the workflow, a scatter plot with the fitted line,
a residual table naming the biggest exceptions, a comparison of two or three
models, and a short case study of one over-performing and one under-performing
country.

## Dataset(s) to be used

A suitable starting point would be [**Gapminder**](https://www.gapminder.org/),
the Swedish foundation co-founded by Hans Rosling. Gapminder publishes free
datasets and visualisations about global development. Its best-known chart plots income
per person against life expectancy, with each country drawn as a bubble whose
size is its population. Gapminder is not a single file: you download the
indicators you need from [Gapminder's data page](https://www.gapminder.org/data/),
usually as a spreadsheet or CSV, and combine them yourself.

Useful indicators include:

- income per person (GDP per capita, adjusted for purchasing power)
- life expectancy at birth
- mean years of schooling
- child mortality
- fertility rate
- health spending per person
- CO₂ emissions per person

Gapminder's data is free to use with attribution. Check the licence note on each
indicator download and record the source and download date in your project log.
The [**World Bank**](https://data.worldbank.org/) publishes similar indicators
(life expectancy at birth, GDP per capita, health expenditure, immunisation
rates) and is a useful second source. The definitions are not identical:
"income per person" may use purchasing-power parity or market exchange rates,
and "life expectancy" is an estimate rather than a count. Comparing sources is
part of the investigation.

You would need to decide which countries and years to include. A single recent
year with good coverage gives you one row per country and a clean cross-section.
A panel of several decades lets you ask whether the relationship changes over
time, but it makes the data preparation harder. Country borders change, some
states are very small, and many indicators have missing values. Write down your
inclusion rules before you start.

Income is heavily skewed: a few countries are far richer than the rest. Plotting
income on a logarithmic scale usually makes the relationship closer to a
straight line, and it changes which countries look like outliers. You could add a
log-transformed column in a spreadsheet, or use **Feature Constructor** in
Orange to create one. Record the choice, because it affects the model and the
interpretation.

The data is aggregate national statistics, so there are no personal-data
issues. There is an interpretation issue: a country average does not describe
the people inside it. A country can have a high average income and a low life
expectancy because of inequality, or a low average income and a high life
expectancy because of strong public health. Keep that distinction visible in
your writing.

## Suggested research question or hypothesis

For example:

> To what extent can income per person explain life expectancy across
> countries, and what do the exceptions tell us about the limits of the
> relationship?

You could develop this into more specific questions, such as whether a
log-transformed income fits better than raw income, which countries are the
largest positive and negative residuals, whether adding schooling or child
mortality improves the model, whether the pattern holds within regions and
across decades, or whether the relationship is causal.

You could test whether income explains a substantial part of the variation, and
whether the residuals cluster by region and by health-system quality. You could
test that by colouring the scatter plot by region, fitting separate models, and
comparing the residuals.

## Key data science, statistical and machine learning concepts

Your project could involve:

- scatter plots, correlation and the shape of a relationship
- linear regression and the meaning of a coefficient
- logarithmic scales and why income is often plotted on a log axis
- R², root mean squared error (RMSE) and mean absolute error (MAE)
- residuals and what a residual plot can reveal
- outliers and influential points
- training, validation and test data, and cross-validation
- multiple regression and feature importance
- confounding: a third variable that affects both income and health
- multicollinearity: income and schooling are correlated, so their coefficients
  can be unstable
- Simpson's paradox: a relationship that changes direction when you split the
  data into groups
- the ecological fallacy: country averages do not describe individuals
- correlation versus causation
- data definitions, missing values and changing country borders
- extrapolation and the limits of a model outside the data it saw

Orange's **Scatter Plot** can draw the relationship and a regression line.
**Linear Regression** fits the model and shows the coefficients. **Test &
Score** reports R², RMSE and MAE under cross-validation. **Predictions** shows
predicted versus actual values and the residuals. **Feature Statistics** and
**Data Table** help you inspect distributions and individual countries.
**Feature Constructor** creates a log-income column, and **Preprocess** can
standardise features if you want to compare coefficients on a common scale.

## Suggested approaches to data preparation, analysis and modelling

You could begin by downloading two indicators, income per person and life
expectancy, for a recent year. Put them in a spreadsheet with one row per
country, check the missing values, and import the CSV into Orange with **File**.
You could open **Scatter Plot**, put income on the x-axis and life expectancy on the
y-axis, and colour the points by region. Look at the shape before you fit
anything.

You could try a linear fit first, then a log-transformed income, and compare
which looks more like a straight line. Fit **Linear Regression** and read the
coefficient to see how many extra years of life expectancy are associated with a
doubling of income. Use **Test & Score** with cross-validation to get R², RMSE
and MAE. Compare the
model with a baseline that always predicts the mean life expectancy; a model
that cannot beat the mean is not adding much.

You could open **Predictions** and inspect the residuals to identify which
countries are furthest above the line and which furthest below. Define your
exception criterion before you go looking for explanations: a fixed number of
years, a percentage deviation, or a standardised residual. Write the definition down, then list the
countries that meet it. This prevents you from choosing the outliers that fit
your favourite story.

You could add a second indicator, such as mean years of schooling or child mortality, and
refit the model. You could check whether R² improves and which coefficient
changes. Income and schooling are correlated, so the income coefficient may
shrink when schooling is added. That is expected: the two variables share information, so the model has
less unique information to attribute to income. Try dropping one and watching
the other, and explain what happens.

You could split the data by region or by income group and fit separate models.
You could check whether the slope changes, and whether the relationship
disappears or reverses in any group. A relationship that holds across the whole
world but not within regions is a useful warning about aggregated data. If you have several years, repeat the
analysis for an earlier decade and compare.

You could pick one over-performing and one under-performing country for a short case
study. Read about their health systems, inequality, geography and recent
history. Do not try to prove a cause from two examples; use the cases to suggest
mechanisms that a larger study could test. If you have time, add a third
indicator that might explain the pattern, such as health spending or
vaccination coverage, and see whether it survives the comparison.

You should record your decisions in your project log: the year or years, the countries
included, the income definition, the log transformation, the exception
criterion, the model specification, the validation method, and the sources of
each indicator.

## Potential limitations, risks and sources of bias

Considering the limitations of your data and model is an important part of
evaluating your project. For example:

- The ecological fallacy is the central risk. A country-level relationship does
  not tell you what happens to an individual, and a country average can hide
  enormous inequality.
- Income is correlated with many other things: education, health systems,
  sanitation, geography, colonial history, conflict and inequality. A regression
  coefficient is not a causal effect.
- Data definitions differ between Gapminder and the World Bank. Mixing sources
  without checking definitions can change the result.
- Missing values are common, especially for poorer countries and earlier
  decades. Dropping them silently can bias the sample.
- Country borders and names change. The USSR, Yugoslavia and other historical
  states need a consistent rule.
- A few very rich or very small countries can dominate the fit, so the effect
  of removing the largest outliers should be checked.
- There are only about 200 countries, so a handful of unusual cases can change
  the coefficients. The uncertainty should be reported and the robustness of the
  conclusion tested.
- Linear regression assumes a straight-line relationship. Log income often fits
  better, but it is still an approximation.
- R² does not prove causation, and a high R² does not mean the model is useful
  for policy. Omitted variables can bias every coefficient.
- The data is historical and is revised, so the download date and the version of
  each indicator should be recorded.
- Extrapolating beyond the observed range of income or life expectancy is
  unsafe, so the model should not be used to predict countries or years it has
  not seen.
- Choosing the year, the countries or the exception criterion after seeing the
  results makes the analysis look stronger than it is, so the main choices should
  be recorded in the log before the analysis.

You should consider how these limitations affect the claims you can reasonably
make from your model.

## Expected outcomes and opportunities for evaluation

The expected outcome would be a working Orange workflow that predicts life
expectancy from income, a scatter plot with a fitted line, a residual table
naming the largest exceptions, and a comparison of at least two model
specifications. Importantly, a high R² is not necessary for your project to be
successful. A model that explains a moderate share of the variation, and a clear
account of what it misses, is a strong result.

You could evaluate the model with cross-validation, compare it with a
mean-prediction baseline, inspect the residuals for patterns, and check whether
the conclusions survive a change of year, region or indicator. You could compare
Gapminder with the World Bank for one or two countries, and ask whether the
definitions explain any disagreement.

You could pick three countries that break the rule and write a short explanation
for each. You could ask whether the gap is explained by income inequality, a
health system, a recent conflict, oil wealth, or a data problem. If you can
answer that, you have a stronger evaluation than a single R². If you cannot, that is also a finding about
the limits of the data.

You could finish by reflecting on what a model like this could and could not be
used for. It may describe a broad pattern across countries without being reliable
enough to guide policy for one country. Articulating that distinction is part of
the project.

## Suitability as an EPQ artefact

This could make a strong EPQ artefact because building the model requires you to
make a series of decisions that you can research, justify and evaluate. The
model provides a tangible outcome, while the analysis provides evidence of
planning, research, problem-solving and reflection. The data is public, and the
workflow is easy to demonstrate.

Crucially, the project is open-ended. There is no single correct set of
countries, indicators or model, and the quality of your EPQ does not depend
simply on maximising R². You have scope to make and justify your own decisions
about the question, the dataset and the interpretation of the exceptions.

You could also discuss questions from statistics and public argument:
correlation and causation, ecological inference, data definitions, and the
difference between a pattern and a policy. You could use your charts and residuals as evidence in that discussion.

## Example artefacts

*Placeholder: the images and tables are not yet included. The list shows the
evidence a finished project could include.*

- A screenshot of the Orange workflow, showing **File**, **Scatter Plot**,
  **Linear Regression**, **Test & Score** and **Predictions**.
- A scatter plot of life expectancy against log income, coloured by region, with
  the fitted regression line.
- A coefficient table from **Linear Regression**, with a plain-English
  interpretation of each coefficient.
- A residual plot and a table of the ten largest positive and negative
  residuals.
- A model comparison table: income only, income plus schooling, and income plus
  child mortality, with R², RMSE and MAE for each.
- A short case-study note on one over-performing and one under-performing
  country.

## Further reading

- Rosling, *Factfulness* (2018) — the worldview behind Gapminder, and a good
  source of claims to test.
- [Gapminder's data and teaching pages](https://www.gapminder.org/) — the
  indicators, the bubble chart and the notes on each dataset.
- [The World Bank's indicator pages](https://data.worldbank.org/) — definitions
  and a second source for the same measurements.
- The [Orange Data Mining documentation](https://orangedatamining.com/docs/) —
  **Scatter Plot**, **Linear Regression**, **Test & Score** and **Predictions**.
- Spiegelhalter, *The Art of Statistics* (2019) — especially the chapters on
  causation and uncertainty.
- Wilkinson and Pickett, *The Spirit Level* (2009) — a famous and contested
  argument about inequality and health, useful as a claim to examine.
