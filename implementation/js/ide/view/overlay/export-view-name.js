(function(app){

	app.view('Overlay.ExportViewName', {
		template: '@view/overlay/export-view-name.html',
		overlay: true,
		editors: {
			'view-name': {
				layout: {
					label: 'col-md-2',
					field: 'col-md-10',
				},
				type: 'text',
				label: 'Name',
				help: 'please give a view name to export',
				validate: {
					required: true,
					fn: function(val, parentCt){
						//check whether view name already exists
						var contained = false;
						app.remote({
							url: '/api/getViewList',
							async: false
						}).done(function(data){
							//get rid of user in from of names
							var temp = _.map(data, function(name){ return name.replace('User.', ''); });

							//make sure capital case
							var name  = (_.map(val.split('.'), function(str){ return str.charAt(0).toUpperCase() + str.slice(1); })).join('.');

							if(_.contains(temp, name)){
								parentCt.$el.find('.overwrite-holder').removeClass('hidden');
								contained = true;
							}else {
								parentCt.$el.find('.overwrite-holder').addClass('hidden');
							}
						});

						return contained && 'view name already exists';
					},
				}
			},
		},
		actions: {
			close: function(){
				this.close();
			},
			export: function(){
				//check validation
				if(!this.validate(true)){
					//post ot backend
					this.exportView(this.get('view-name'));
				}
			},
			'overwrite-no': function(){
				this.$el.find('.overwrite-holder').addClass('hidden');
			},
			'overwrite-yes': function(){
				this.exportView(this.get('view-name'), true);
			},
		},

		//function to handle exporting
		exportView: function(name, overwrite){
			var that = this;
			console.log(this.get(), this.options.viewType);
			app.remote({
				url: '/api/viewexport',
				payload: {
					name: name, //name
					template: this.get('template'), //template
					attributes: (this.options.viewType === 'parent') ? {} : this.get('attributes'), //give it a height and a width if sub-view
					data: this.get('dataContent'),
					layout: this.get('layout'),
					remoteFlag: this.get('remoteFlag'),
					overwrite: overwrite
				},
			}).done(function(){
				//update the viewlist on menu, if not overwrite
				if(!overwrite){
					var currentContext = app.locate('Edit') || app.locate('Layout');

					currentContext.view
						.getViewIn('menu').$el.find('.switch-views-holder')
						//append and add User. in front to fake the name.
						.append('<div class="view-list-item"><div action="switch-view" activate="single"><span class="text">User.' + (name.charAt(0).toUpperCase() + name.slice(1)) + '</span></div></div>');
				}
				
				//close the view
				that.close();

				//give notification
				app.notify('SUCCESS!', 'View has been successfully exported.', 'success');

			}).fail(function(){
				//give notification
				app.notify('FAIL!', 'View export error.', 'danger');
			});
		},
	});

})(Application);