document.addEventListener("DOMContentLoaded", (event) => {
  // TODO: replace with the HTML Sanitizer API once more widely available
  // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API
  const policy = trustedTypes.createPolicy("highlightjs-policy", {
    createHTML: (input) => DOMPurify.sanitize(input, {RETURN_TRUSTED_TYPE: false}),
  });
  document.querySelectorAll("pre code").forEach((el) => {
    formatted_code = hljs.highlightAuto(el.textContent);
    el.innerHTML = policy.createHTML(formatted_code.value);
  });
});
