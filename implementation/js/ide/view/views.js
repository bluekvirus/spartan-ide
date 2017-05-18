/**
 * Sample VIEW script.
 *
 * @author Stagejs.CLI
 * @created Wed May 17 2017 18:15:32 GMT-0700 (PDT)
 */
;(function(app){

	app.view('Views', {

		template: '@view/ide/views.html',
		data: '/api/getViewList',
		//data: 'url', {} or [],
		//coop: ['e', 'e'],
		//[editors]: {...},
		
		initialize: function(){},
		//onShow: function(){},
		//onDataRendered: function(){},
		//navRegion: 'preview',
		onNavigateTo: function(path){

			this.show('preview', path.pop());
			//this.getRegion('preview').trigger('region:load-view', path);
		},
		actions: {
			'preview-view': function($self){
				app.navigate('_IDE/Views/' + $self.find('.text').text());
				//this.show('preview', $self.find('.text').text());
			},
			'edit-view': function($self){
				app.navigate('_IDE/Layout/' + $self.parent().find('.text').text());
			}
		},

	});


})(Application);