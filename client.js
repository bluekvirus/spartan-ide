// *****************************************************
// Call npm run build after you have changed this file!
// (or you can use npm run watch in addition to npm start)
// *****************************************************

/**
 * Entrypoint for ES6+ bundlers (e.g webpack) to transpile the required 
 * Javascript/CSS code for supporting component interactions in browser.
 * 
 * Note: Marko's server side plugin only creates component files and replaces  
 * <comp/> with HTML template from that component. Include your pages in this 
 * client entrypoint is of vital importance for your JS and CSS/LESS to work.
 * 
 * The require() calls in this file are what cause your JS and CSS code to 
 * be included in the bundle.js/.css. This is how the server-side rendering 
 * eventually being able to initialize those component templates replaced in 
 * that page. In other words, don't be surprised if your /pages/abc won't work 
 * it is because you forgot to include that page here with a require() call.
 * 
 * @author Tim Lauv
 */

// A: using server-side component rendering: (component tags in pages)
//    require that page!! (multiple)
require('./pages/index.marko');
//require('./pages/specs.marko');
// ...
// ... require other dynamic marko pages here ...
// ...
require('marko/components').init();

// B: using client-side component rendering: (component tags in component)
//    require the main component!! (single)
let main = require('./components/main');
document.addEventListener("DOMContentLoaded", (event) => {
    let mainEl = document.getElementById('main');
    if(mainEl)
        main.renderSync({}).replace(document.getElementById('main'));
    console.log('Ready!');
});
