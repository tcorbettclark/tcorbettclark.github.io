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

    function setActive(el) {
        if (currentActive === el) return;
        if (currentActive) currentActive.classList.remove("toc-active");
        el.classList.add("toc-active");
        currentActive = el;
    }

    var scrollOffsetRem = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scroll-offset")) || 5;
    var rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    var scrollOffsetPx = Math.round(scrollOffsetRem * rootFontSize) + 5;

    function updateActiveHeading(updateHash) {
        var activeLi = null;
        for (var i = 0; i < headingLiMap.length; i++) {
            if (headingLiMap[i].isTop) {
                continue;
            }
            if (headingLiMap[i].heading.getBoundingClientRect().top <= scrollOffsetPx) {
                activeLi = headingLiMap[i].li;
            }
        }
        if (!activeLi) {
            var topEntry = headingLiMap.filter(function (e) { return e.isTop; })[0];
            if (topEntry) activeLi = topEntry.li;
        }
        if (activeLi) {
            setActive(activeLi);
            if (updateHash) {
                var link = activeLi.tagName === "A" ? activeLi : activeLi.querySelector("a");
                if (link) {
                    var hash = link.getAttribute("href");
                    if (hash && hash.charAt(0) === "#" && location.hash !== hash) {
                        history.replaceState(null, "", hash);
                    }
                }
            }
        }
    }

    var ticking = false;
    var settleTimer = null;

    window.addEventListener("scroll", function () {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(function () {
                updateActiveHeading(false);
                ticking = false;
            });
        }
        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = setTimeout(function () {
            updateActiveHeading(true);
        }, 150);
    }, { passive: true });

    updateActiveHeading(true);
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

    var title = document.createElement("div");
    title.className = "toc-title";

    var titleText = document.createElement("span");
    titleText.textContent = "Contents";
    title.appendChild(titleText);

    var topA = document.createElement("a");
    topA.href = "#";
    topA.className = "toc-top-link";
    topA.appendChild(document.createTextNode("Top"));
    var topIcon = document.createElement("i");
    topIcon.className = "fa-solid fa-angles-up";
    topIcon.style.marginLeft = "0.3em";
    topA.appendChild(topIcon);
    title.appendChild(topA);

    toc.appendChild(title);

    var result = buildTocList(headings);
    toc.appendChild(result.list);

    var topEntry = { isTop: true, li: topA };
    result.headingLiMap.unshift(topEntry);
    initScrollSpy(result.headingLiMap);

    var scrollLinks = document.createElement("div");
    scrollLinks.className = "toc-scroll-links";

    var bottomLink = document.createElement("a");
    bottomLink.href = "#footer";
    bottomLink.appendChild(document.createTextNode("Bottom"));
    var bottomIcon = document.createElement("i");
    bottomIcon.className = "fa-solid fa-angles-down";
    bottomIcon.style.marginLeft = "0.3em";
    bottomLink.appendChild(bottomIcon);

    scrollLinks.appendChild(bottomLink);
    toc.appendChild(scrollLinks);
}

document.addEventListener("DOMContentLoaded", main);