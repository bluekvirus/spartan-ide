(function(app){

	app.view('Overlay.CreateNewView', {
		template: '@view/overlay/create-new-view.html',
		overlay: true,
		actions: {
			close: function(){
				app.navigate('_IDE/Layout');
				this.close();
			},
			create: function(){
				//create an object for this view in the layout object to accommodate the navigation logic
				var layouts = app.store.get('__layouts__');
				layouts[this.get('viewName')] = {
					layout: ['1'],
				};
				app.store.set('__layouts__', _.deepClone(layouts));
				//app.navigate('_IDE/Layout/' + this.get('viewName'));
				window.location.reload(true);
				this.close();
			},
		}
	});

})(Application);