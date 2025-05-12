document.addEventListener("DOMContentLoaded", (event) => {
  for (var node of document.getElementsByClassName("math")) {
    katex.render(node.innerText, node, {
      displayMode: node.classList.contains("block"), // otherwise assume it is "inline"
      throwOnError: false,
    });
  }
});
