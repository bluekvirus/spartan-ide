# spartan-ide

A web IDE for fast app development. See branch `starter` for common web app project starter kit.

## Libs

We used **h5bp**, **marko**, **express**, **browser-refresh** and **webpack** to form the starter kit.

## To Use

- `/components/` for your marko components. (does not matter which side you are rendering)
    - `main.marko` for SPA entrypoint if you prefer. (routing wip)
    - `layout.marko` for easily creating `/pages/`.
- `/pages/` for your multi-page pleasure, served under `/pages/`.
- `/static/` JS/CSS bundles and static assets like fonts and images. (assets can be embedded in components)
- `client.js` bundler entrypoint, add your pages under `/pages/` in it as require() calls. SPA loading is already done for you.
- `server.js` backend entrypoint. (statics, `/pages/` auto-routes and more)
- `/mockdata/` backend mockup data templates, served under `/mockdata/`. (Mock.js flavor) 

## ToDo List

### main.marko
0. SPA routing like Backbone

### server.js
1. Connect/Express middlewares for `/services` and `/tasks`.
2. Waterline models for data persistence.
3. SSO session and roles with policies.

### Issue List
1. Multiple calls of marko/hot-reload `File modified` notification.

## Contribute

1. Clone the project
2. `npm -g install yarn` if you haven't
3. `yarn install`
4. `yarn watch` for development env (auto bundle and refresh browser with limited server restart)

Read `packages.json` script section for cli commands to build/start without auto refreshing the browser.

