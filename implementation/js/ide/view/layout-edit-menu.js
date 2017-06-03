;(function(app){

	app.view('LayoutEditMenu', {
		template: '@view/ide/layout-edit-menu.html',
		coop: ['save-layout-denied', 'save-layout-confirmed'],
		actions: {
			'switch-view': function($self){
				//app.navigate('_IDE/' + this.get('method') + '/' + $self.find('.text').text());
				
				//ask user whether they desire to save, only if the view has been changed
				if(this.get('method') === 'Layout' && this.parentCt.modified)
					app.get('Overlay.SaveLayout').create({
						data: {
							viewName: this.get('viewName'),
							next: $self.find('.text').text(),
							method: this.get('method')
						},
					}).overlay({
						effect: false,
					});

				else
					app.navigate('_IDE/' + this.get('method') + '/' + $self.find('.text').text());
			},
			'add-new': function(){
				app.get('Overlay.AddNewView').create().overlay({
					effect: false,
				});
			},
			'switch-method': function(){
				//app.navigate('_IDE/' + ((this.get('method') === 'Layout') ? 'Edit' : 'Layout') + '/' + this.get('viewName'));
				
				var viewName = next = this.get('viewName'),
					nextMethod = (this.get('method') === 'Layout') ? 'Edit' : 'Layout';

				if(this.get('method') === 'Layout'){
					//check whether the layout has been modified
					if(this.parentCt.modified){//modified

						//ask user whether they desier to save
						app.get('Overlay.SaveLayout').create({
							data: {
								viewName: viewName,
								next: next,
								method: nextMethod
							},
						}).overlay({
							effect: false,
						});

					}else{//not modified

						//go to new view directly
						app.navigate('_IDE/' + nextMethod + '/' + next);
					}
				}else{
					app.navigate('_IDE/' + nextMethod + '/' + next);
				}
				
			},
			'save-layout': function(){
				this.coop('save-layout');
			},
			'delete-local-view': function($self){
				app.get('Overlay.DeleteLocalView')
				.create({
					data: {
						viewName: $self.data('name')
					}
				})
				.overlay({
					effect: false
				});
			},
		},
		templateHelpers: {
			xif3: function(val1, val2){
				return val1 === val2;
			},
		},

		//========================================== functions to handle coop events ==========================================//
		
		//user choose not to save
		onSaveLayoutDenied: function(obj){
			app.navigate('_IDE/' + obj.method + '/' + obj.next);
		},

		//user choose to save
		onSaveLayoutConfirmed: function(obj){
			//call parentCt to handle to save method
			this.coop('save-layout', obj);

			//defer to make sure really saved before switching context
			// _.defer(function(){
			// 	app.navigate('_IDE/' + obj.method + '/' + obj.next);
			// });
		},
	});

})(Application);