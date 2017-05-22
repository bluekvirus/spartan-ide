;(function(app){

	app.view('LayoutEditMenu', {
		template: '@view/ide/layout-edit-menu.html',
		actions: {
			'switch-view': function($self){
				app.navigate('_IDE/' + this.get('method') + '/' + $self.text());
			},
			'add-new': function(){
				app.get('Overlay.AddNewView').create().overlay({
					effect: false,
				});
			},
			'switch-method': function(){
				app.navigate('_IDE/' + ((this.get('method') === 'layout') ? 'Edit' : 'Layout') + '/' + this.get('viewName'));
			},
			'save-layout': function(){
				this.coop('save-layout');
			},
		},
		templateHelpers: {
			xif3: function(val1, val2){
				return val1 === val2;
			},
		}
	});

})(Application);