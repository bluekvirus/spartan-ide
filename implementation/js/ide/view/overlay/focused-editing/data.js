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
		
		initialize: function(){
			this.dataSourceForView = app.model();
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
					that.$el.find('.url-editor').slideDown( "fast" );//.removeClass('hidden');
				}else{
					that.$el.find('.url-editor').slideUp( "fast" );//.addClass('hidden');
				}
			});

			//insert ace to editor
			//fetch id, since only one textarea exists
			var id = this.$el.find('textarea').attr('id');
			this.coop('create-ace-editor', id, {theme: 'monokai', mode: 'json'});
		},
		onEditorChanged: function(name, editor){
			if(name === 'data-content'){
				try{
					var data = JSON.parse(editor.getVal());
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
					app.notify('PARSE ERROR', 'Data is not a valid JSON format.', 'danger');
				}
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
			'data-content': {
				type: 'textarea',
				label: 'DATA',
			},
		},
		actions: {
			'fetch-remote': function(){
				var that = this;
				
				app.remote({
					url: this.get('url'),
				})
				.done(function(data){
					that.getEditor('data-content').setVal(JSON.stringify(data, null,'\t'), true);
				})
				.fail(function(){
					//that.getEditor('data-content').setVal('fetch error');
					app.notify('FETCH ERROR', 'Cannot fetch data from given url. ' + arguments[0], 'danger');
				});
			}
		},

	});

})(Application);