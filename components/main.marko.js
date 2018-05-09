// Compiled using marko@4.9.7 - DO NOT EDIT
"use strict";

var marko_template = module.exports = require("marko/src/html").t(__filename),
    marko_componentType = "/spartan-ide$1.0.0/components/main.marko",
    components_helpers = require("marko/src/components/helpers"),
    marko_renderer = components_helpers.r,
    marko_defineComponent = components_helpers.c,
    marko_loadTemplate = require("marko/src/runtime/helper-loadTemplate"),
    toolbelt_template = marko_loadTemplate(require.resolve("./toolbelt")),
    marko_helpers = require("marko/src/runtime/html/helpers"),
    marko_loadTag = marko_helpers.t,
    toolbelt_tag = marko_loadTag(toolbelt_template),
    workbench_template = marko_loadTemplate(require.resolve("./workbench")),
    workbench_tag = marko_loadTag(workbench_template);

function render(input, out, __component, component, state) {
  var data = input;

  out.w("<div>IDEv2.0");

  toolbelt_tag({}, out, __component, "1");

  workbench_tag({}, out, __component, "2");

  out.w("</div>");
}

marko_template._ = marko_renderer(render, {
    ___implicit: true,
    ___type: marko_componentType
  });

marko_template.Component = marko_defineComponent({}, marko_template._);

marko_template.meta = {
    id: "/spartan-ide$1.0.0/components/main.marko",
    tags: [
      "./toolbelt",
      "./workbench"
    ]
  };
