/**
 * Dev server with api proxy support and easy page/mockdata rendering.
 * 
 * @author Tim Lauv
 * @created 2018.5
 */

require('marko/express');
require('marko/node-require');

let express = require('express');
let compression = require('compression'); // Provides gzip compression for the HTTP response
let serveStatic = require('serve-static');
let mockjs = require('mockjs');

// If the process was started using browser-refresh then enable
// hot reloading for certain types of files to short-circuit
// a full process restart. You *should* use browser-refresh
// in development: https://www.npmjs.com/package/browser-refresh
// save the special/partial reload obj for .remove() cleanup.
let sR = require('./utils/browser-refresh').enable();

// Grab cli params (--watch)
const argv = require('yargs').argv;

let app = express();
let port = process.env.PORT || 9000;

// :Middlewares:
// Enable gzip compression for all HTTP responses
app.use(compression());
// Allow all of the generated files under "static" to be served up by Express
app.use('/static', serveStatic(__dirname + '/static'));
// Allow api and user docs/specs to be served. (optional)
app.use('/specs', serveStatic(__dirname + '/specs'));

// :Routes:
// Map the "/" route to the home page
let indexPageTpl = require('./pages/index.marko');
app.get('/', function(req, res){
    res.marko(indexPageTpl, {});
});

// Map proxied apis according to proxy.js
let proxiedCalls = require('./proxy');
let proxyFactory = require('http-proxy-middleware');
for (let p in proxiedCalls) {
    let s = proxiedCalls[p];
    s = typeof s == 'string' ? {target: s} : s;
    app.use(p, proxyFactory(s));
}

// Map the "/mockdata/*" route to Mock.js templates (*.js with module.exports = { tpl })
app.all('/mockdata/:tplName', function(req, res){
    let mockTpl;
    try {
        mockTpl = require('./mockdata/' + req.params['tplName']);
        res.json(mockjs.mock(mockTpl));
    } catch (e) {
        res.redirect('/pages/404');
    }
});

// Map the "/pages/*" route to dynamic marko pages
app.get('/pages/:pageName', function(req, res){
    let dynamicPage, error = {};
    try {
        dynamicPage = require('./pages/' + req.params['pageName']);
    } catch (e) {
        console.log('marko page error:', e);
        dynamicPage = require('./pages/404');
        error = {path: '/pages/' + req.params['pageName']};
    }
    res.marko(dynamicPage, error);
});

// :Catch All:
app.use(function(req, res, next){
    res.redirect('/pages/404');
});

// Webpack watch (optional on -w, --watch)
let watcher;
if (argv.w || argv.watch) {
    const webpack = require('webpack');
    const compiler = webpack(require('./webpack.config'));
    compiler.hooks.done.tap('LogCompileError', (stats) => {
        if (stats.compilation.errors.length)
            console.error('[webpack watch]: compile failed', stats.compilation.errors);
        else 
            console.log('[webpack watch]: re-compiled.');
    });
    watcher = compiler.watch({}, (err, stats) => {
        if (err)
            throw err;
        console.log('[webpack watch]: started.');
    });
}

// Bind port and serve
app.listen(port, function (err) {
    if (err) {
        throw err;
    }
    console.log('Listening on port %d', port);

    // The browser-refresh module uses this event to know that the
    // process is ready to serve traffic after the restart
    if (process.send) {
        process.send('online');
    }

    // Caveat: SIGHUP,SIGTERM,SIGINT is more like intercepted instead of listened to...
    process.once('SIGTERM', () => {
        watcher.close(() => {console.log('[webpack watch]: ended.');});
        sR.remove();
        // Note: call this, or it will hang! default behavior removed by intercepting SIGTERM.
        process.exit();
    });
});
