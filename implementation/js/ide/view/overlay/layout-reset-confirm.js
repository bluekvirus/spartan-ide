;(function(app){

	app.view('Overlay.LayoutResetConfirm', {
		template: '@view/overlay/layout-reset-confirm.html',
		overlay: true,
		actions: {
			close: function(){
				this.close();
			},
			continue: function(){
				if(this.get('anchor'))
					app.coop('point-layout-reset-confirmed', this.get('anchor'));
				else
					app.coop('line-layout-reset-confirmed');

				this.close();
			}
		}
	});

})(Application);