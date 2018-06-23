require('marko/express');
require('marko/node-require');

var express = require('express');
var compression = require('compression'); // Provides gzip compression for the HTTP response
var serveStatic = require('serve-static');

// If the process was started using browser-refresh then enable
// hot reloading for certain types of files to short-circuit
// a full process restart. You *should* use browser-refresh
// in development: https://www.npmjs.com/package/browser-refresh
require('marko/browser-refresh').enable('*.marko *.css *.less *.styl *.scss *.sass *.png *.jpeg *.jpg *.gif *.webp *.svg');

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
});