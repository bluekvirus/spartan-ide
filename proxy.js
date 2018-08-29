/**
 * This is the proxy configure used by server.js (express middleware)
 * 
 * Based on http-proxy-middleware (nodejitsu's http-proxy)
 * 
 * path: { .. options .. } 
 * path: 'server'
 * 
 * @author Tim Lauv
 * @created 2018.07.25
 */

module.exports = {

    '/api': 'http://localhost:8000',

}