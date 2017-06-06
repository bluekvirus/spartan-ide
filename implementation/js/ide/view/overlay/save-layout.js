(function(app){

	app.view('Overlay.SaveLayout', {
		template: '@view/overlay/save-layout.html',
		overlay: true,
		actions: {
			close: function(){
				app.coop('save-layout-denied', this.get());
				this.close();
			},
			save: function(){
				app.coop('save-layout-confirmed', this.get());
				this.close();
			},
		}
	});

})(Application);