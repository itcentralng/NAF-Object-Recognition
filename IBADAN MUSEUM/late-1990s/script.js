"use strict";
const scrollers = document.querySelectorAll(".scroller");
if (!window.matchMedia("(prefers-reduced-motion:reduced)").matches) {
    setTimeout(() => {
          addAnimation();

        //   addAnimationToScroller(scroller);
        }, 3000);
      }

function addAnimation() {
  scrollers.forEach((scroller) => {
    scroller.setAttribute("data-animated", true);
    const innerScroller = scroller.querySelector(".inner-scroller");
    const scrollerContent = Array.from(innerScroller.children);

    scrollerContent.forEach((item) => {
      const duplicatedItem = item.cloneNode(true);
      duplicatedItem.setAttribute("aria-hidden", true);
      innerScroller.appendChild(duplicatedItem);
    });
  });
}
