/**
 * Sample VIEW script.
 *
 * @author Stagejs.CLI
 * @created Wed May 17 2017 18:16:07 GMT-0700 (PDT)
 */
;(function(app){

	app.view('Layout', {

		template: '@view/ide/layout.html',
		//[editors]: {...},
		
		initialize: function(){},
		//onShow: function(){},
		//onDataRendered: function(){},
		onReady: function(){

		},
		onNavigateTo: function(path){
			var that = this;
			//remind the name for this view
			this.editingViewName = path.slice().pop();

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
				//show the view preview
				that.show('preview', path.slice().pop());

				//show the mesh grids
				that.show('mesh', 'Layout.Mesh');

				//show the guide view
				//that.show('guide', 'Layout.Guide');
			});
		}
		
	});

})(Application);