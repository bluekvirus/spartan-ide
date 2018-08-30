/**
 * Mount a component based on `#<input.root-path>path.to.component` hash URL (SPA)
 * 
 * Install (to main.marko)
 * ```
 * include("./workbench") width="100%"  root-path="showcase/"
 * ```
 * 
 * With the above code, a SPA navigation to `#showcase/any` will load `/components/any.marko`
 * into the viewport.
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
        output.global.ee.coop(this, 'global:route', e => {
            // default reaction to SPA route change
            if (e.new.startsWith(input.rootPath || 'workbench/')) {
                e.new = e.new.replace(input.rootPath || 'workbench/', '');

                let comp;
                try {
                    comp = require('../' + (e.new).split('.').join('/'));
                } catch (e) {
                    comp = null;
                    console.log(e);
                }
                that.setState('context', comp);
            }

            // add your own 
            
        });
    }

    onUpdate() {
        console.log('showing:', this.state.context);
    }

    clicked() {
        console.log('workbench clicked...');
    }
}

