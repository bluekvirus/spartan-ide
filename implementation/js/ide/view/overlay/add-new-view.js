(function(app){

	app.view('Overlay.AddNewView', {
		template: '@view/overlay/add-new-view.html',
		overlay: true,
		editors: {
			'view-name': {
				layout: {
					label: 'col-md-2 text-left',
					field: 'col-md-10',
				},
				type: 'text',
				label: 'Name',
				validate: {
					required: true,
				}
			},
		},
		actions: {
			close: function(){
				this.close();
			},
			add: function(){
				this.validate(true);
			},
		}
	});

})(Application);