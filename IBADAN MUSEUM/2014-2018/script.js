const sections = document.querySelectorAll(".section");
let current = 0;
function showSection(index) {
  sections.forEach((sec, i) => {
    const scroller = sec.querySelector(".scroller");
    if (i === index) {
      sec.classList.add("active");
      sec.classList.remove("inactive");
      if (scroller) {
        // Remove animation immediately, then add after 1s
        removeAnimationFromScroller(scroller);
        setTimeout(() => {
          addAnimationToScroller(scroller);
        }, 3000);
      }
    } else {
      sec.classList.remove("active");
      sec.classList.add("inactive");
      if (scroller) {
        removeAnimationFromScroller(scroller);
      }
    }
  });
}

// Show the first section on load
showSection(0);

setInterval(() => {
  current = (current + 1) % sections.length;
  showSection(current);
}, 10000);

function addAnimationToScroller(scroller) {
  if (!window.matchMedia("(prefers-reduced-motion:reduced)").matches) {
    if (!scroller.hasAttribute("data-animated")) {
      scroller.setAttribute("data-animated", true);
      const innerScroller = scroller.querySelector(".inner-scroller");
      if (innerScroller && innerScroller.children.length > 0) {
        // Only duplicate if not already duplicated
        const alreadyDuplicated = Array.from(innerScroller.children).some(
          (child) => child.getAttribute("aria-hidden") === "true"
        );
        if (!alreadyDuplicated) {
          const scrollerContent = Array.from(innerScroller.children);
          scrollerContent.forEach((item) => {
            const duplicatedItem = item.cloneNode(true);
            duplicatedItem.setAttribute("aria-hidden", true);
            innerScroller.appendChild(duplicatedItem);
          });
        }
      }
    }
  }
}

function removeAnimationFromScroller(scroller) {
  scroller.removeAttribute("data-animated");
  const innerScroller = scroller.querySelector(".inner-scroller");
  if (innerScroller) {
    // Remove all duplicated items
    Array.from(innerScroller.children).forEach((child) => {
      if (child.getAttribute("aria-hidden") === "true") {
        innerScroller.removeChild(child);
      }
    });
  }
}
