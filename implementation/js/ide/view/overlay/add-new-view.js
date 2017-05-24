(function(app){

	app.view('Overlay.AddNewView', {
		template: '@view/overlay/add-new-view.html',
		overlay: true,
		editors: {
			'view-name': {
				layout: {
					label: 'col-md-2',
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
				//valid name, then navigate to layout editing view
				if(!this.validate(true)){
					app.navigate('_IDE/Layout/' + this.get('view-name'));
				}

				//close the overlay
				this.close();
			},
		}
	});

})(Application);