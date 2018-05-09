// Compiled using marko@4.9.7 - DO NOT EDIT
"use strict";

var marko_template = module.exports = require("marko/src/html").t(__filename),
    marko_componentType = "/spartan-ide$1.0.0/pages/index.marko",
    components_helpers = require("marko/src/components/helpers"),
    marko_renderer = components_helpers.r,
    marko_defineComponent = components_helpers.c,
    marko_helpers = require("marko/src/runtime/html/helpers"),
    marko_loadTag = marko_helpers.t,
    component_globals_tag = marko_loadTag(require("marko/src/components/taglib/component-globals-tag")),
    marko_loadTemplate = require("marko/src/runtime/helper-loadTemplate"),
    main_template = marko_loadTemplate(require.resolve("../components/main.marko")),
    main_tag = marko_loadTag(main_template),
    browser_refresh_tag = marko_loadTag(require("browser-refresh-taglib/refresh-tag")),
    init_components_tag = marko_loadTag(require("marko/src/components/taglib/init-components-tag")),
    await_reorderer_tag = marko_loadTag(require("marko/src/taglibs/async/await-reorderer-tag"));

function render(input, out, __component, component, state) {
  var data = input;

  out.w("<!doctype html><html class=\"no-js\" lang=\"\"><head><meta charset=\"utf-8\"><meta http-equiv=\"x-ua-compatible\" content=\"ie=edge\"><title></title><meta name=\"description\" content=\"\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1, shrink-to-fit=no\"><link rel=\"manifest\" href=\"/static/site.webmanifest\"><link rel=\"apple-touch-icon\" href=\"/static/icon.png\"><link rel=\"icon\" type=\"image/png\" href=\"/static/favicon.ico\"><link rel=\"stylesheet\" href=\"/static/css/normalize.css\"><link rel=\"stylesheet\" href=\"/static/css/bundle.css\" media=\"all\"></head><body>");

  component_globals_tag({}, out);

  out.w("<!--[if lte IE 9]>\n    <p class=\"browserupgrade\">You are using an <strong>outdated</strong> browser. Please <a href=\"https://browsehappy.com/\">upgrade your browser</a> to improve your experience and security.</p>\n  <![endif]-->");

  main_tag({}, out, __component, "13");

  out.w("<script src=\"/static/js/vendor/modernizr-3.6.0.min.js\"></script><script src=\"/static/js/plugins.js\"></script><script src=\"/static/js/bundle.js\"></script>");

  browser_refresh_tag({
      enabled: "true"
    }, out, __component, "17");

  init_components_tag({}, out);

  await_reorderer_tag({}, out, __component, "18");

  out.w("</body></html>");
}

marko_template._ = marko_renderer(render, {
    ___implicit: true,
    ___type: marko_componentType
  });

marko_template.Component = marko_defineComponent({}, marko_template._);

marko_template.meta = {
    id: "/spartan-ide$1.0.0/pages/index.marko",
    tags: [
      "marko/src/components/taglib/component-globals-tag",
      "../components/main.marko",
      "browser-refresh-taglib/refresh-tag",
      "marko/src/components/taglib/init-components-tag",
      "marko/src/taglibs/async/await-reorderer-tag"
    ]
  };
