/**
 * Sample VIEW script.
 *
 * @author Stagejs.CLI
 * @created Tue May 23 2017 15:07:09 GMT-0800 (PST)
 */

;(function(app){

	app.view('Overlay.FocusedEditing.GroupEditor', {
		//className: 'clearfix',
		template: '@view/overlay/focused-editing/group-editor.html',
		//data: 'url', {} or [],
		//coop: ['e', 'e'],
		//[editors]: {...},
		onReady: function(){
			this.activate('editing', 0);
		},
		onItemActivated: function($item){
			var tabId = $item.attr('tabId'),
				reverseTabId = (tabId === 'html') ? 'less' : 'html';

			//show editors accordingly
			this.$el.find('.' + tabId + '-editors').removeClass('hidden');
			this.$el.find('.' + reverseTabId + '-editors').addClass('hidden');
		},
		actions: {
			close: function(){
				this.parentCt.$el.find('.clip-editing-holder').removeClass('active');
			},
			apply: function(){
				var obj = this.get('obj'),
                    viewAndRegion = obj.name,
                    editedObj = {
                        template: this.get('html'),
                        data: this.get('datakey'),
                        less: this.get('less'),
                        css_container: obj.css_container
                    },
                    baseId, uniqueId;
                var allGroups = app.store.get(viewAndRegion);
                    currentBuilder = this.get('builder');

                //prepare the data as required in data view
                if(this.get('type') === 'stack'){
                    var editRegionGroups = allGroups.stackGroups,
                        stackNumber = obj.stackNumber;
                    baseId = viewAndRegion + '-' + stackNumber;
                    uniqueId = baseId + '-id';
                    editRegionGroups[stackNumber] = editedObj;
                    allGroups.stackGroups = editRegionGroups;

                    //Update cache
                	app.store.set(viewAndRegion, allGroups);

                    editedObj.name = viewAndRegion;
                    editedObj.stackNumber = stackNumber;
                    editedObj.type = 'stack';

                }else if (this.get('type') === 'hanger'){
                    var editRegionStrings = allGroups.hangerGroups,
                        hangerNumber = obj.hangerNumber;
                    baseId = viewAndRegion + '-' + hangerNumber + '-hanger';
                    uniqueId = baseId + '-id';
                    editRegionStrings[hangerNumber] = editedObj;
                    allGroups.hangerGroups = editRegionStrings;

                    //Update cache
                	app.store.set(viewAndRegion, allGroups);

                    editedObj.name = viewAndRegion;
                    editedObj.hangerNumber = hangerNumber;
                    editedObj.type = 'hanger';
                }
             
                //trigger coop
                app.coop('group-updated', obj, editedObj, this.get('__dataSource'));
			},
			delete: function(){
				var obj = this.get('obj'),
					type = this.get('type');

				//trigger coop
                app.coop('group-deleted', obj, type);	
			},
		},
		editors: {
			html: {
				label: 'HTML',
				type: 'textarea',
			},
			less: {
				label: 'LESS',
				type: 'textarea',
			},
			datakey: {
				label: 'Data-Key',
				type: 'text',
				layout: {
					label: 'col-md-1',
					field: 'col-md-11',
				},
			},
		},
	});

})(Application);