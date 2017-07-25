// eslint-disable-next-line no-unused-vars
function cssvar(name) {
  return window.getComputedStyle(document.querySelector("html")
                                ).getPropertyValue("--" + name);
}
