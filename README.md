# spartan-ide

A web IDE for fast app development. See branch `starter` for common web app project starter kit.


## Libs

We used **h5bp**, **marko**, **express**, **browser-refresh** and **webpack** to form the starter kit.

## To Use

1. Create pages under `/pages` folder (Caveat: no global var, e.g *window*)
    - pages should be extending `@main` part of the `layout.marko` component (in turn, loads js/css bundles)
    - pages with `<div id="main"/>` will load the `main.marko` component
2. Create components under `/components` folder
3. Create mockup service data under `/mockdata` folder
4. Document api spec using swagger v3 under `/specs` folder
5. Put additional fonts/images under `/static` folder

### Src folders
- `/components/` for your marko components. (does not matter which side you are rendering)
    - `main.marko` for SPA entrypoint if you prefer. (routing wip)
    - `layout.marko` for easily creating `/pages/`.
- `/pages/` for your multi-page pleasure, served under `/pages/`. (make sure you **require()** newly added page in `client.js` so webpack can pickup both js and less/css changes)
- `/static/` JS/CSS bundles and static assets like fonts and images. (assets can be embedded in components)
- `client.js` bundler entrypoint, add your pages under `/pages/` in it as require() calls. SPA loading is already done for you.
- `server.js` backend entrypoint. (statics, `/pages/` auto-routes and more)
- `/mockdata/` backend mockup data templates, served under `/mockdata/`. (Mock.js flavor) 

### Routing in app
- Single-Page: `#abc/xyz...` anchor changes will be picked up and passed into `global.ee.route()` method, register your own handler within each component to cope with route change. Use `global.ee.navigateTo()` to manually control anchor change.
    ```
    class {
        onCreate(input, output) {
            ...
            window.global.ee.route('abc/xyz', uri => { ... });
            ...
        }

        onButtonClicked() {
            window.global.ee.navigateTo('efg/hij');
        }
    }
    ```
- Multi-Page: `/pages/your-page` url change will load `your-page.marko` under `/pages/` folder into the browser.

### Global co-op events
From time to time, you will need components loaded by different parent/region to be able to notify each other of state change or interactions, use `global.ee.coop()` and `global.ee.coopOnce()` to do that.

```
class {
    onCreate(input, output) {
        ...
        window.global.ee.coop(this, 'e', e => { ... });
        window.global.ee.coopOnce(this, 'e', 'fn'); // 'fn' is the handler method name of 'this'
        ...
    }

    onActionPerformed() {
        window.global.ee.emit('e', { ... data ... });
    }
}
```


## ToDo List

### client.js
0. Setup and expose polling tickets.
1. Setup and expose websocket channels.

### server.js
1. Connect/Express middlewares for `/services` and `/tasks`.
2. Waterline models for data persistence.
3. SSO session and roles with policies.


## Issue List

1. Multiple calls of marko/hot-reload `File modified` notification.

## Contribute

1. Clone the project
2. `npm -g install yarn` if you haven't
3. `yarn install`
4. `yarn watch` for development env (auto bundle and refresh browser with limited server restart)

Read `packages.json` script section for cli commands to build/start without auto refreshing the browser.

