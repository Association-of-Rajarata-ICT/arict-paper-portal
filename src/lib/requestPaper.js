export const REQUEST_PAPER_EVENT = "arict:request-paper";

// Opens the "Request a paper" dialog owned by the site header, from anywhere on the page.
export function openRequestPaper() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(REQUEST_PAPER_EVENT));
}
