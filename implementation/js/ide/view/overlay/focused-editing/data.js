/**
 * Sample VIEW script.
 *
 * @author Stagejs.CLI
 * @created Tue May 23 2017 15:07:09 GMT-0800 (PST)
 */

;(function(app){

	app.view('Overlay.FocusedEditing.Data', {

		template: '@view/overlay/focused-editing/data.html',
		//data: 'url', {} or [],
		//coop: ['e', 'e'],
		//[editors]: {...},
		coop: ['ace-editor-initiated'],
		initialize: function(){
			//object to store current data
			this.dataSourceForView = app.model();

			//object to store configured ace editors
			this.aces = {};
		},
		//onShow: function(){},
		//onDataRendered: function(){},
		onReady: function(){
			var that = this;

			this.$el.find('.url-editor .help-block').addClass('hidden');

			//listen to remote switch change event
			this.$el.find('#remote-switch').on('change', function(e){
				var $this = $(this);

				if($this.prop('checked')){//show url editor if true
					that.$el.find('.url-editor').slideDown('fast');//.removeClass('hidden');
				}else{
					that.$el.find('.url-editor').slideUp('fast');//.addClass('hidden');
				}
			});

			//insert ace to editor
			this.coop('create-ace-editor', 'data-ace-editor', {theme: 'monokai', mode: 'json'});

			//after ace editor initiated, honor stored data value
			_.defer(function(){
				//get cacheName
				var cacheName = that.parentCt.get('cacheName');
				//fetch builder cache to get value
				var savedConfigs = app.store.get('__builder')[cacheName] || {};
				if(savedConfigs.data){
					//check whether remote
					if(savedConfigs.remoteFlag){//remote
						//make slider go to remote
						that.$el.find('#remote-switch').prop('checked', true);

						//change the value in url edit, and slidedown
						that.getEditor('url').setVal(savedConfigs.data);
						that.$el.find('.url-editor').slideDown('fast');

						//fetch the data and change the value in the ace editor
						app.remote({
							url: savedConfigs.data,
						}).done(function(data){
							that.aces.data.setValue(JSON.stringify(data, null, '\t'), 1);
						});

					}else{//local

						//make it pretty x.x de-stringify and stringify
						that.aces.data.setValue(JSON.stringify(JSON.parse(savedConfigs.data), null, '\t'), 1);
					}
				}
			});
		},
		//----- coop for ace editors have been initiated -----//
		onAceEditorInitiated: function(id, pad){
			var that = this;
			//data
			if(id === 'data-ace-editor')
				this.aces.data = pad;

			//register change event for data editor
			pad.getSession().on('change', _.debounce(function(e){
				that.dataEditorChanged(pad);
			}, 200));
		},
		dataEditorChanged: function(pad){
			//try to parse JSON data in the editor
			try{
				var data = JSON.parse(pad.getValue());
				this.dataSourceForView.clear().set(data);

				//reload builder for updated data, if builder is already shown
				var viewTabView = this.parentCt.getViewFromTab('View');
				//check whether builder is being shown
				if(viewTabView.builderShown){

					//cache name = currently editing view + region name
					var cacheName = _.string.slugify(viewTabView.get('cacheName'));

					//create the builder view
					var builder = app.get('Overlay.FocusedEditing.Builder')
						.create({
							cacheName : cacheName,
							dataSource: this.dataSourceForView, //temporary placeholder,
						});

					//spray the builder view onto the region
					  this.parentCt.spray(this.parentCt.get('$clone'), builder);
				}

			} catch(event){

				console.warn('JSON parse error...');

				//no need to show notification, since ace editor can tell error
				//app.notify('PARSE ERROR', 'Data is not a valid JSON format.', 'danger');
			}
		},
		editors: {
			// _global:{
			// 	layout: {
			// 		label: 'col-md-1',
			// 		field: 'col-md-11',
			// 	},
			// },
			url: {
				type: 'text',
				label: 'URL',
				validate: {
					required: true,
				},
			},
			// moved to browser native editor for using ace editor
			// 'data-content': {
			// 	type: 'textarea',
			// 	label: 'DATA',
			// },
		},
		actions: {
			'fetch-remote': function(){
				var that = this;

				app.remote({
					url: this.get('url'),
				})
				.done(function(data){
					that.aces.data.setValue(JSON.stringify(data, null,'\t'), 1);
				})
				.fail(function(){
					//that.getEditor('data-content').setVal('fetch error');
					app.notify('FETCH ERROR', 'Cannot fetch data from given url. ' + arguments[0], 'danger');
				});
			}
		},

	});

})(Application);
