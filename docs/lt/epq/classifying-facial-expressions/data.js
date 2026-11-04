/* Face dataset used by classifying_facial_expressions.
 *
 * 115 training and 114 test 128x128 greyscale face images from the AR /
 * Yale / Stirling databases (see the page footer), stored as spritesheets
 * of size x size tiles laid out in "cols" columns:
 *   images/train-sheet.png, images/test-sheet.png  (loaded by app.js)
 * and the two per-class mean faces:
 *   images/mean-neutral.png, images/mean-smiling.png
 *
 * cTrain / cTest are the class labels: 0 = neutral, 1 = smiling.
 */
const DATA = {
  nTrain: 115,
  nTest: 114,
  cols: 11,
  size: 128,
  cTrain: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  cTest: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
};
