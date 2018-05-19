//A: using server-side component rendering: (there is a <main/> tag in index page)
//require('./components/main');
//require('marko/components').init();

//B: using client-side component rendering:
var main = require('./components/main');
document.addEventListener("DOMContentLoaded", (event) => {
    main.renderSync({}).replace(document.getElementById('main'));
    //console.log('DOMContentLoaded');
});
