/**
 * Sample VIEW script.
 *
 * @author Stagejs.CLI
 * @created Wed May 17 2017 18:16:47 GMT-0700 (PDT)
 */
;(function(app){

	app.view('Edit', {

		template: '@view/ide/edit.html',
		data: '/api/getViewList',
		coop: ['navigation-changed'],
		//[editors]: {...},
		
		initialize: function(){},
		//onShow: function(){},
		//onDataRendered: function(){},
		navRegion: 'content-editor',
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
						edit: true,
						method: 'edit',
						viewName: that.editingViewName
					},
				});
			});

			//highlight current view
			// _.each(this.$el.find('.view-list-item .text'), function(el, index){
			// 	var $el = $(el);

			// 	if($el.text() === that.editingViewName)
			// 		$el.addClass('active');
			// });
		},
	});

})(Application);