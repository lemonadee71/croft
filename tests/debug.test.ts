import { describe, it } from "vitest";
import { html, createElementFromTemplate } from "../src/index";
import { getPlaceholders, isPlaceholder } from "../src/utils";

describe("debug", () => {
  it("checks placeholders", () => {
    const div = html`<div></div>`;
    const tmpl = html`<main>${div}</main>`;
    console.log("template string:", tmpl.template);
    console.log("values keys:", Object.keys(tmpl.values));

    const frag = createElementFromTemplate(tmpl);
    console.log("frag innerHTML:", frag.firstElementChild?.innerHTML);
  });

  it("checks TreeWalker on fragment", () => {
    const frag = document.createRange().createContextualFragment("<main>__abc12345__</main>");
    console.log("frag.firstChild:", frag.firstElementChild?.tagName);

    const placeholders = getPlaceholders(frag);
    console.log("placeholders found:", placeholders.length);
    placeholders.forEach((p) => console.log(" placeholder text:", JSON.stringify(p.textContent)));
  });

  it("checks TreeWalker on connected element", () => {
    document.body.innerHTML = "<main>__abc12345__</main>";
    const el = document.body;
    const placeholders = getPlaceholders(el);
    console.log("placeholders in body:", placeholders.length);
    placeholders.forEach((p) => console.log(" placeholder text:", JSON.stringify(p.textContent)));
    document.body.innerHTML = "";
  });

  it("manual walker test", () => {
    const frag = document.createRange().createContextualFragment("<p>__abc12345__</p>");
    const walker = document.createTreeWalker(frag, NodeFilter.SHOW_TEXT, (node) => {
      console.log("  visiting text node:", JSON.stringify(node.textContent));
      return isPlaceholder(node.textContent || "")
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    });
    let n;
    const found = [];
    while ((n = walker.nextNode())) found.push(n);
    console.log("found nodes:", found.length);
  });
});
