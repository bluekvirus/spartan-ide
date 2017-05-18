/**
 * Sample VIEW script.
 *
 * @author Stagejs.CLI
 * @created Wed May 17 2017 18:16:07 GMT-0700 (PDT)
 */
;(function(app){

	app.view('Layout', {

		template: '@view/ide/layout.html',
		coop: ['navigation-changed'],
		//[editors]: {...},
		
		initialize: function(){},
		//onShow: function(){},
		//onDataRendered: function(){},
		onReady: function(){

		},
		onNavigationChanged: function(path){
			var that = this;
			//
			this.editingViewName = path.pop();

			app.remote({
				url: '/api/getViewList',
				async: false,
			}).done(function(data){
				that.show('menu', 'LayoutEditMenu', {
					data: {
						items: data,
						layout: true,
						method: 'layout',
						viewName: that.editingViewName
					},
				});
			});

			//
		},
		navRegion: 'layout-editor',
	});

})(Application);