function cssvar(name) {
  return window.getComputedStyle(document.querySelector("html")
                                ).getPropertyValue("--" + name);
}
