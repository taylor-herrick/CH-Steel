const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.getElementById("navMenu");
const navLinks = [...document.querySelectorAll(".navlink")];
const pageAnchorLinks = navLinks.filter((link) => {
  const href = link.getAttribute("href") || "";
  return href.startsWith("#");
});
const progressBar = document.getElementById("progressBar");
const sections = pageAnchorLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
let ticking = false;

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    navMenu.classList.toggle("is-open", !expanded);
  });

  const menuLinks = [...navMenu.querySelectorAll("a")];
  menuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      navMenu.classList.remove("is-open");
    });
  });
}

const setActiveLink = () => {
  if (!sections.length) return;

  const sectionTops = sections.map(
    (section) => section.getBoundingClientRect().top + window.scrollY
  );
  const offset = window.scrollY + window.innerHeight * 0.32;
  let activeId = sections[0].id;

  sectionTops.forEach((top, index) => {
    if (top <= offset) {
      activeId = sections[index].id;
    }
  });

  pageAnchorLinks.forEach((link) => {
    const matches = link.getAttribute("href") === `#${activeId}`;
    link.classList.toggle("is-active", matches);
  });
};

const updateProgress = () => {
  if (!progressBar) return;

  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? (window.scrollY / max) * 100 : 0;
  progressBar.style.width = `${Math.min(100, Math.max(0, ratio)).toFixed(2)}%`;
};

const recalcLayout = () => {
  // Section tops are computed live in setActiveLink to avoid stale offsets
  // when media/content loads after initial script execution.
};

const onFrame = () => {
  setActiveLink();
  updateProgress();
  ticking = false;
};

const reveals = [...document.querySelectorAll(".reveal")];

if ("IntersectionObserver" in window && reveals.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  reveals.forEach((el) => observer.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("is-visible"));
}

const year = document.getElementById("year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

const initHeroMetricsCount = () => {
  const metrics = [...document.querySelectorAll(".hero-metric-value[data-count-target]")];
  if (!metrics.length) return;

  const runCount = (el) => {
    const target = Number(el.dataset.countTarget || "0");
    const start = Number(el.dataset.countStart || "0");
    const duration = 700;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const value = Math.round(start + (target - start) * progress);
      el.textContent = String(value);
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCount(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.45 }
    );

    metrics.forEach((el) => observer.observe(el));
  } else {
    metrics.forEach((el) => runCount(el));
  }
};

initHeroMetricsCount();

window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onFrame);
    }
  },
  { passive: true }
);

window.addEventListener("resize", () => {
  recalcLayout();
  onFrame();
});

window.addEventListener("load", () => {
  recalcLayout();
  onFrame();
});

recalcLayout();
onFrame();

const enableCursorGrid = () => {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const cursorGrid = document.createElement("div");
  cursorGrid.className = "cursor-grid";
  document.body.appendChild(cursorGrid);

  let rafId = 0;
  let hideTimer = 0;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  const render = () => {
    const dx = targetX - currentX;
    const dy = targetY - currentY;
    currentX += dx * 0.22;
    currentY += dy * 0.22;

    cursorGrid.style.left = `${currentX}px`;
    cursorGrid.style.top = `${currentY}px`;

    if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) {
      rafId = window.requestAnimationFrame(render);
    } else {
      rafId = 0;
    }
  };

  window.addEventListener("mousemove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    if (!currentX && !currentY) {
      currentX = targetX;
      currentY = targetY;
    }

    cursorGrid.style.opacity = "0.34";
    if (!rafId) {
      rafId = window.requestAnimationFrame(render);
    }

    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      cursorGrid.style.opacity = "0";
    }, 220);
  });

  window.addEventListener("mouseleave", () => {
    cursorGrid.style.opacity = "0";
    window.clearTimeout(hideTimer);
  });
};

enableCursorGrid();

const initProjectsCarousels = () => {
  const isProjectsPage =
    !!document.getElementById("project-overview") ||
    /(^|\/)projects\.html$/i.test(window.location.pathname);

  if (!isProjectsPage) return;

  const slideshows = [...document.querySelectorAll(".cb-slideshow")];
  if (!slideshows.length) return;

  slideshows.forEach((slideshow) => {
    const slides = [...slideshow.querySelectorAll(".cb-slide")];
    if (slides.length < 2) return;

    slideshow.classList.add("is-carousel");

    let activeIndex = 0;
    const setActive = (nextIndex) => {
      activeIndex = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, index) => {
        slide.classList.toggle("is-active", index === activeIndex);
      });
    };

    setActive(0);

    const sectionTitle =
      slideshow.closest(".page-section")?.querySelector("h2")?.textContent?.trim() ||
      "Project gallery";

    const controls = document.createElement("div");
    controls.className = "cb-carousel-controls";

    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "cb-carousel-btn cb-carousel-btn-prev";
    prevBtn.setAttribute("aria-label", `Previous image in ${sectionTitle}`);
    prevBtn.textContent = "<";

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "cb-carousel-btn cb-carousel-btn-next";
    nextBtn.setAttribute("aria-label", `Next image in ${sectionTitle}`);
    nextBtn.textContent = ">";

    controls.append(prevBtn, nextBtn);
    slideshow.parentElement?.appendChild(controls);

    let timerId = 0;
    const restartAutoScroll = () => {
      window.clearInterval(timerId);
      timerId = window.setInterval(() => {
        setActive(activeIndex + 1);
      }, 4600);
    };

    prevBtn.addEventListener("click", () => {
      setActive(activeIndex - 1);
      restartAutoScroll();
    });

    nextBtn.addEventListener("click", () => {
      setActive(activeIndex + 1);
      restartAutoScroll();
    });

    slideshow.addEventListener("mouseenter", () => {
      window.clearInterval(timerId);
    });

    slideshow.addEventListener("mouseleave", () => {
      restartAutoScroll();
    });

    slideshow.addEventListener("focusin", () => {
      window.clearInterval(timerId);
    });

    slideshow.addEventListener("focusout", () => {
      restartAutoScroll();
    });

    restartAutoScroll();
  });
};

initProjectsCarousels();


