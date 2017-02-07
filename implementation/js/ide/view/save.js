;(function(app){

	app.view('Save', {
		template: '@view/save.html',
		overlay: true,
		onReady: function(){

		},
		editors: {
			name: {
				type: 'text',
				label: 'Template Name',
				help: 'please give a template name',
				validate: {
					required: true
				},
				layout: {
					label: 'col-md-4',
					field: 'col-md-8',
				}
			}
		},
		actions: {
			close: function(){
				this.close();
			},
			save: function(){
				if(!this.validate(true)){
					var temp = {}, name = this.getEditor('name').getVal();
					temp.endPoints = app._global.endPoints;
					temp['horizontal-line'] = app._global['horizontal-line'];
					temp['vertical-line'] = app._global['vertical-line'];

					if(app.store.get(name)){//overwrite
						this.$el.find('.overwrite-message .name').text(name);
						this.$el.find('.overwrite-message').removeClass('hidden');
					}else{//no overwrite
						app.store.set(name, temp);
						app.coop('template-added', name);
						this.close();
					}
				}

			},
			overwrite: function(){
				var temp = {}, name = this.getEditor('name').getVal();
				temp.endPoints = app._global.endPoints;
				temp['horizontal-line'] = app._global['horizontal-line'];
				temp['vertical-line'] = app._global['vertical-line'];

				//store
				app.store.set(name, temp);

				this.close();
			},
			cancel: function(){
				this.$el.find('.overwrite-message').addClass('hidden');
			}
		}
	});

})(Application);