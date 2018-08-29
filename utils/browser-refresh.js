var browserRefreshClient = require('./browser-refresh-client');
var nodePath = require('path');

var styleExtensions = {
    css: true,
    less: true,
    styl: true,
    stylus: true,
    scss: true,
    sass: true
};

var imageExtensions = {
    png: true,
    jpeg: true,
    jpg: true,
    gif: true,
    svg: true
};

var markoTplExtensions = {
    marko: true,
};

var enabled = false;

exports.enable = function(patterns) {
    if (!browserRefreshClient.isBrowserRefreshEnabled() || enabled) {
        return;
    }

    enabled = true;

    if (!patterns) {
        // Reasonable default with client-side only files...
        patterns = 'bundle.js *.md *.yaml *.json *.marko *.css *.less *.styl *.scss *.sass *.png *.jpeg *.jpg *.gif *.webp *.svg *.eot *.ttf *.woff *.woff2';
    }

    var sR = browserRefreshClient
        .enableSpecialReload(patterns, { autoRefresh: false });

    // Tim's hack: let the special request obj to be returned, carrying the .remove() 
    // cleanup method.
    return sR.onFileModified(function(path) {
        var extname = nodePath.extname(path);
        if (extname) {
            extname = extname.substring(1);
        }

        if (imageExtensions[extname]) {
            console.log('[utils/browser-refresh] Image modified: ' + path);
            browserRefreshClient.refreshImages();
        } else if (styleExtensions[extname]) {
            console.log('[utils/browser-refresh] StyleSheet modified: ' + path);
            browserRefreshClient.refreshStyles();
        } else {
            
            // Tim's hack: since this would have been picked up by client.js --> bundle.js
            if (markoTplExtensions[extname])
                return;

            console.log('[utils/browser-refresh] File modified: ' + path);
            browserRefreshClient.refreshPage();
        }
    })
};