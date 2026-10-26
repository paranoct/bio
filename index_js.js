const tabs = [...document.querySelectorAll("[data-tab]")];
const panels = [...document.querySelectorAll("[data-panel]")];

function activateTab(name, updateHash = true) {
  const available = tabs.some((tab) => tab.dataset.tab === name);
  const activeName = available ? name : "home";
  tabs.forEach((tab) => {
    const selected = tab.dataset.tab === activeName;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  panels.forEach((panel) => {
    const selected = panel.dataset.panel === activeName;
    panel.hidden = !selected;
    panel.classList.toggle("active", selected);
  });
  if (updateHash && window.location.hash !== `#${activeName}`) {
    window.history.replaceState(null, "", `#${activeName}`);
  }
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  tab.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(index + direction + tabs.length) % tabs.length];
    next.focus();
    activateTab(next.dataset.tab);
  });
});
window.addEventListener("hashchange", () => activateTab(window.location.hash.slice(1), false));
activateTab(window.location.hash.slice(1), false);
