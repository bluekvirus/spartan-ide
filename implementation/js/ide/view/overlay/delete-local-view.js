(function(app){

	app.view('Overlay.DeleteLocalView', {
		template: '@view/overlay/delete-local-view.html',
		overlay: true,
		actions: {
			close: function(){
				this.close();
			},
			delete: function(){
				app.coop('delete-local-view', this.get('viewName'));
				this.close();
			},
		}
	});

})(Application);