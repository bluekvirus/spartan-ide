/**
 * Mount a component based on `#<input.root-path>path.to.component` hash URL (SPA)
 * 
 * Install (to main.marko)
 * ```
 * include("./workbench") width="100%"  root-path="showcase/"
 * ```
 * 
 * With the above code, a SPA navigation to `#showcase/any` will load `/components/any.marko`
 * into the viewport. IF YOU DON'T SPECIFY root-path, `#workbench/any` will load the above component instead.
 * 
 * 
 * @author Tim Lauv
 * @created 2018.08.29
 * 
 */

module.exports = class {
    onCreate(input, output) {
        this.state = {
            context: null,
            meta: null,
        };

        let that = this;

        // default reaction to SPA route change
        output.global.ee.route(input.rootPath || 'workbench/', uri => {
                uri = uri.replace(input.rootPath || 'workbench/', '');

                let comp;
                try {
                    comp = require('../' + uri.split('.').join('/'));
                } catch (e) {
                    comp = null;
                    console.log(e);
                }
                that.setState('context', comp);
        });

        // add your own routes

    }

    onUpdate() {
        console.log('showing:', this.state.context);
    }

    clicked() {
        window.global.ee.emit('global:debug:echo', 'workbench component clicked!');
    }
}

