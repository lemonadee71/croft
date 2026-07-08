import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Croft",
  description: "Lightweight, decoupled, native DOM reactive templating engine",
  base: "/croft/",
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: "Guide", link: "/getting-started" },
      { text: "API Reference", link: "/api-reference" },
      { text: "TodoMVC", link: "/examples/todomvc" },
    ],
    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Getting Started", link: "/getting-started" },
          { text: "Pipeline Overview", link: "/pipeline" },
        ],
      },
      {
        text: "Reactivity",
        items: [
          { text: "createHook", link: "/reactivity/create-hook" },
          { text: "Method Forwarding", link: "/reactivity/method-forwarding" },
          { text: "watch / unwatch", link: "/reactivity/watch" },
          { text: "Patterns", link: "/reactivity/patterns" },
        ],
      },
      {
        text: "Templates",
        items: [
          { text: "html Tag", link: "/templates/html-tag" },
          { text: "render", link: "/templates/render" },
          { text: "Conditionals & Lists", link: "/templates/conditional-lists" },
        ],
      },
      {
        text: "Directives",
        items: [
          { text: "Overview", link: "/directives/overview" },
          { text: "text", link: "/directives/text" },
          { text: "html", link: "/directives/html" },
          { text: "class", link: "/directives/class" },
          { text: "style", link: "/directives/style" },
          { text: "toggle", link: "/directives/toggle" },
          { text: "ref", link: "/directives/ref" },
          { text: "show / visible", link: "/directives/show-visible" },
          { text: "children", link: "/directives/children" },
          { text: "key", link: "/directives/key" },
          { text: "skip", link: "/directives/skip" },
          { text: "Event Handlers", link: "/directives/events" },
          { text: "Custom Directives", link: "/directives/custom-directives" },
        ],
      },
      {
        text: "Components",
        items: [
          { text: "defineComponent", link: "/components/define-component" },
          { text: "Props", link: "/components/props" },
          { text: "Slots", link: "/components/slots" },
          { text: "Nesting & Composition", link: "/components/nesting" },
        ],
      },
      {
        text: "Lifecycles",
        items: [
          { text: "DOM Lifecycles", link: "/lifecycles/dom-lifecycles" },
          { text: "Pipeline Hooks", link: "/lifecycles/pipeline-hooks" },
          { text: "Mutation Observer", link: "/lifecycles/mutation-observer" },
        ],
      },
      {
        text: "Extending",
        items: [
          { text: "Plugins", link: "/plugins" },
        ],
      },
      {
        text: "Examples",
        items: [
          { text: "TodoMVC App", link: "/examples/todomvc" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "API Reference", link: "/api-reference" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/lemonadee71/croft" },
    ],
  },
});
