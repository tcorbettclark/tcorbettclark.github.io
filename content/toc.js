document.addEventListener("DOMContentLoaded", function () {
    var toc = document.getElementById("toc");
    var content = document.querySelector(".content");
    if (toc && content) {
        var headings = content.querySelectorAll("h2, h3");
        if (headings.length > 0) {
            var title = document.createElement("p");
            title.className = "toc-title";
            title.textContent = "Contents";
            toc.appendChild(title);
            var list = document.createElement("ul");
            list.className = "toc-list";
            var lastH2 = null;
            for (var i = 0; i < headings.length; i++) {
                var h = headings[i];
                if (!h.id) {
                    h.id = h.textContent.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
                }
                var li = document.createElement("li");
                li.className = "toc-" + h.tagName.toLowerCase();
                var a = document.createElement("a");
                a.href = "#" + h.id;
                a.textContent = h.textContent;
                li.appendChild(a);
                if (h.tagName === "H3" && lastH2) {
                    var subList = lastH2.querySelector("ul");
                    if (!subList) {
                        subList = document.createElement("ul");
                        subList.className = "toc-sublist";
                        lastH2.appendChild(subList);
                    }
                    subList.appendChild(li);
                } else {
                    list.appendChild(li);
                    lastH2 = li;
                }
            }
            toc.appendChild(list);
        } else {
            toc.style.display = "none";
        }
    }
});