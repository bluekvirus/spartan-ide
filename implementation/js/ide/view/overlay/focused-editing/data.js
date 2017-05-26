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
		
		initialize: function(){},
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
				console.log('url', this.get('url'));
				app.remote({
					url: this.get('url'),
				})
				.done(function(data){
					that.getEditor('data-content').setVal(JSON.stringify(data, null,'\t'));
				})
				.fail(function(){
					that.getEditor('data-content').setVal('fetch error');
				});
			}
		},

	});

})(Application);