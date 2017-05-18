/**
 * Sample VIEW script.
 *
 * @author Stagejs.CLI
 * @created Wed May 17 2017 18:16:07 GMT-0700 (PDT)
 */
;(function(app){

	app.view('Layout', {

		template: '@view/ide/layout.html',
		data: '/api/getViewList',
		coop: ['navigation-changed'],
		//[editors]: {...},
		
		initialize: function(){},
		//onShow: function(){},
		//onDataRendered: function(){},
		onNavigationChanged: function(path){
			var that = this;
			//
			this.editingViewName = path.pop();
			this.$el.find('.view-name span').text(this.editingViewName);

			//highlight current view
			_.each(this.$el.find('.view-list-item .text'), function(el, index){
				var $el = $(el);

				if($el.text() === that.editingViewName)
					$el.addClass('active');
			});
		},
		navRegion: 'layout-editor',
		actions: {
			'switch-view': function($self){
				app.navigate('_IDE/Layout/' + $self.text());
			},
			'edit-view': function(){
				app.navigate('_IDE/Edit/' + this.editingViewName);
			},
			'apply-change': function(){

			},
		},

	});

})(Application);