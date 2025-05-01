document.addEventListener("DOMContentLoaded", (event) => {
  for (var node of document.getElementsByClassName("math inline")) {
    katex.render(node.innerHTML, node);
  }
});
