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
                if(this.get('type') === 'group'){
                    var editRegionGroups = allGroups.groups,
                        groupNumber = obj.groupNumber;
                    baseId = viewAndRegion + '-' + groupNumber;
                    uniqueId = baseId + '-id';
                    editRegionGroups[groupNumber] = editedObj;
                    allGroups.groups = editRegionGroups;

                    editedObj.name = viewAndRegion;
                    editedObj.groupNumber = groupNumber;
                    editedObj.type = 'group';

                }else if (this.get('type') === 'string'){
                    var editRegionStrings = allGroups.strings,
                        stringNumber = obj.stringNumber;
                    baseId = viewAndRegion + '-' + stringNumber + '-string';
                    uniqueId = baseId + '-id';
                    editRegionStrings[stringNumber] = editedObj;
                    allGroups.strings = editRegionStrings;
                    editedObj.name = viewAndRegion;
                    editedObj.stringNumber = stringNumber;
                    editedObj.type = 'string';
                }

                //Update cache
                app.store.set(viewAndRegion, allGroups);
                //trigger coop
                app.coop('group-updated', obj, editedObj);
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