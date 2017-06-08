/**
 * Sample VIEW script.
 *
 * @author Stagejs.CLI
 * @created Tue May 23 2017 15:07:09 GMT-0800 (PST)
 */

;(function(app) {

	app.view('Overlay.FocusedEditing.GroupEditor', {
		//className: 'clearfix',
		template: '@view/overlay/focused-editing/group-editor.html',
		//data: 'url', {} or [],
		//coop: ['e', 'e'],
		//[editors]: {...},
		coop: ['ace-editor-initiated'],
		initialize: function() {
			//object to store editor instances
			this.aces = {};
		},
		onReady: function() {
			var that = this;
			//
			this.activate('editing', 0);

			//setup ace editor
			//html
			this.coop('create-ace-editor', 'html-ace-editor', {
				theme: 'github',
				mode: 'html'
			});
			//less
			this.coop('create-ace-editor', 'less-ace-editor', {
				theme: 'monokai',
				mode: 'less'
			});

			//after editor initiated honor the data in the view model
			_.defer(function() {
				//honor html
				if (that.get('html'))
					that.aces.html.setValue(that.get('html'), 1);

				//honor less
				if (that.get('less'))
					that.aces.less.setValue(that.get('less'), 1);
			});
		},
		onItemActivated: function($item) {
			var tabId = $item.attr('tabId'),
				reverseTabId = (tabId === 'html') ? 'less' : 'html';

			//show editors accordingly
			this.$el.find('.' + tabId + '-editors').removeClass('hidden');
			this.$el.find('.' + reverseTabId + '-editors').addClass('hidden');
		},
		//----- coop for ace editors have been initiated -----//
		onAceEditorInitiated: function(id, pad) {
			//html
			if (id === 'html-ace-editor')
				this.aces.html = pad;

			if (id === 'less-ace-editor')
				this.aces.less = pad;
		},
		actions: {
			close: function() {
				this.parentCt.$el.find('.clip-editing-holder').removeClass('active');
			},
			apply: function() {
				var obj = this.get('obj'),
					viewAndRegion = obj.name,
					allBuilders = app.store.get('__builder'),
					allGroups = allBuilders[viewAndRegion],
					editedObj = {
						template: this.aces.html.getValue(), //this.get('html'),
						data: this.get('datakey'), //datakey is editor
						less: this.aces.less.getValue(), //this.get('less'),
						css_container: obj.css_container
					},
					baseId, uniqueId;

				//prepare the data as required in data view
				if (this.get('type') === 'stack') {
					var editRegionGroups = allGroups.stackGroups,
						stackNumber = obj.stackNumber;
					baseId = viewAndRegion + '-' + stackNumber;
					uniqueId = baseId + '-id';
					editRegionGroups[stackNumber] = editedObj;
					allGroups.stackGroups = editRegionGroups;
					//Update cache
					allBuilders[viewAndRegion] = allGroups;
					app.store.set('__builder', _.deepClone(allBuilders));

					editedObj.name = viewAndRegion;
					editedObj.stackNumber = stackNumber;
					editedObj.type = 'stack';

				} else if (this.get('type') === 'hanger') {
					var editRegionStrings = allGroups.hangerGroups,
						hangerNumber = obj.hangerNumber;
					baseId = viewAndRegion + '-' + hangerNumber + '-hanger';
					uniqueId = baseId + '-id';
					editRegionStrings[hangerNumber] = editedObj;
					allGroups.hangerGroups = editRegionStrings;
					//Update cache
					allBuilders[viewAndRegion] = allGroups;
					app.store.set('__builder', _.deepClone(allBuilders));

					editedObj.name = viewAndRegion;
					editedObj.hangerNumber = hangerNumber;
					editedObj.type = 'hanger';
				}

				//trigger coop
				app.coop('group-updated', editedObj, this.get('__groupView'));

				//close the sliding editor
				this.parentCt.$el.find('.clip-editing-holder').removeClass('active');
			},
			delete: function() {
				var obj = this.get('obj'),
					type = this.get('type');

				//trigger coop
				app.coop('group-deleted', obj, type);

				//close the sliding editor
				this.parentCt.$el.find('.clip-editing-holder').removeClass('active');

				//show notification
				app.notify('Success!', 'Group has been deleted.', 'ok', {icon: 'fa fa-fort-awesome'});
			},
		},
		editors: {
			// html: {
			// 	label: 'HTML',
			// 	type: 'textarea',
			// },
			// less: {
			// 	label: 'LESS',
			// 	type: 'textarea',
			// },
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
