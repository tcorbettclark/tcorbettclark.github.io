function slugify(text) {
    return text.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
}

function ensureUniqueIds(headings) {
    var counts = {};
    for (var i = 0; i < headings.length; i++) {
        var id = headings[i].id;
        if (counts[id]) {
            counts[id]++;
            headings[i].id = id + "-" + counts[id];
        } else {
            counts[id] = 1;
        }
    }
}

function assignHeadingIds(headings) {
    for (var i = 0; i < headings.length; i++) {
        if (!headings[i].id) {
            headings[i].id = slugify(headings[i].textContent);
        }
    }
    ensureUniqueIds(headings);
}

function buildTocList(headings) {
    var list = document.createElement("ul");
    list.className = "toc-list";
    var lastH2 = null;
    var headingLiMap = [];

    for (var i = 0; i < headings.length; i++) {
        var h = headings[i];
        var li = document.createElement("li");
        li.className = "toc-" + h.tagName.toLowerCase();
        var a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = h.textContent;
        li.appendChild(a);
        headingLiMap.push({ heading: h, li: li });

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

    return { list: list, headingLiMap: headingLiMap };
}

function initScrollSpy(headingLiMap) {
    var currentActive = null;

    function setActive(li) {
        if (currentActive === li) return;
        if (currentActive) currentActive.classList.remove("toc-active");
        li.classList.add("toc-active");
        currentActive = li;
    }

    var scrollOffsetRem = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scroll-offset")) || 5;
    var rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    var scrollOffsetPx = Math.round(scrollOffsetRem * rootFontSize) + 5;

    function updateActiveHeading() {
        var activeLi = null;
        for (var i = 0; i < headingLiMap.length; i++) {
            if (headingLiMap[i].heading.getBoundingClientRect().top <= scrollOffsetPx) {
                activeLi = headingLiMap[i].li;
            }
        }
        if (activeLi) {
            setActive(activeLi);
            var link = activeLi.querySelector("a");
            if (link) {
                var hash = link.getAttribute("href");
                if (hash && hash.charAt(0) === "#" && location.hash !== hash) {
                    history.replaceState(null, "", hash);
                }
            }
        }
    }

    var observer = new IntersectionObserver(function () {
        updateActiveHeading();
    }, {
        rootMargin: "-" + scrollOffsetPx + "px 0px -60% 0px",
        threshold: 0
    });

    for (var m = 0; m < headingLiMap.length; m++) {
        observer.observe(headingLiMap[m].heading);
    }

    var ticking = false;
    window.addEventListener("scroll", function () {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(function () {
                updateActiveHeading();
                ticking = false;
            });
        }
    }, { passive: true });

    updateActiveHeading();
}

function main() {
    var toc = document.getElementById("toc");
    var content = document.querySelector(".content");
    if (!toc || !content) return;

    var headings = content.querySelectorAll("h2, h3");
    if (headings.length === 0) {
        toc.style.display = "none";
        return;
    }

    assignHeadingIds(headings);

    var title = document.createElement("p");
    title.className = "toc-title";
    title.textContent = "Contents";
    toc.appendChild(title);

    var result = buildTocList(headings);
    toc.appendChild(result.list);

    initScrollSpy(result.headingLiMap);
}

document.addEventListener("DOMContentLoaded", main);