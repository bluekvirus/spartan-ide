;(function(app){

	app.view('ViewEdit', {
		layout: {
			split: [
				'300px:.menu-holder:@view/create/view-edit-menu.html',
				'1:view-loading:<span>loading...</span>'
			],
			dir: 'v',
			bars: false,
		},
		data: '/api/getViewList',
		coop: ['navigation-changed'],
		navRegion: 'view-loading',
		onNavigationChanged: function(path){
			var that = this;
			//fetch editing view name
			this.EditingName = path.pop();
			this.$el.find('.view-name span').text(this.EditingName);

			//
			_.each(this.$el.find('.view-list-item .text'), function(el, index){
				if($(el).text() === this.EditingName)
					$(el).addClass('active');
			});
		},
		actions: {
			'edit-view': function($self){
				app.navigate('_IDE/ViewEdit/' + $self.text());
			},
		},
	});

})(Application);