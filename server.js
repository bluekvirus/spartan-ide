require('marko/express');
require('marko/node-require');

var express = require('express');
var compression = require('compression'); // Provides gzip compression for the HTTP response
var serveStatic = require('serve-static');

// If the process was started using browser-refresh then enable
// hot reloading for certain types of files to short-circuit
// a full process restart. You *should* use browser-refresh
// in development: https://www.npmjs.com/package/browser-refresh
require('lasso/browser-refresh')
    .enable('bundle.js *.marko *.css *.less *.styl *.scss *.sass *.png *.jpeg *.jpg *.gif *.webp *.svg');

// Grab cli params (--watch)
const argv = require('yargs').argv;

var app = express();
var port = process.env.PORT || 9000;

// :Middlewares:
// Enable gzip compression for all HTTP responses
app.use(compression());
// Allow all of the generated files under "static" to be served up by Express
app.use('/static', serveStatic(__dirname + '/static'));

// :Routes:
// Map the "/" route to the home page
var indexPageTpl = require('./pages/index.marko');
app.get('/', function(req, res){
    res.marko(indexPageTpl, {});
});

// Map the "/pages/*" route to dynamic marko pages
app.get('/pages/:pageName', function(req, res){
    var dynamicPage, error = {};
    try {
        dynamicPage = require('./pages/' + req.params['pageName']);
    } catch (e){
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
var watcher;
if (argv.w || argv.watch) {
    const webpack = require('webpack');
    const compiler = webpack(require('./webpack.config'));
    watcher = compiler.watch({}, (err, stats) => {
        console.log('[webpack watch]: started.');
    });
}

// Bind port and serve
app.listen(port, function (err) {
    if (err) {
        if (watcher)
            watcher.close(() => {console.log('[webpack watch]: ended.');})
        throw err;
    }
    console.log('Listening on port %d', port);

    // The browser-refresh module uses this event to know that the
    // process is ready to serve traffic after the restart
    if (process.send) {
        process.send('online');
    }
});

