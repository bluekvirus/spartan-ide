;(function(app){

	app.view('LayoutEditMenu', {
		template: '@view/ide/layout-edit-menu.html',
		coop: ['save-layout-denied', 'save-layout-confirmed'],
		initialize: function(){
			this.pads = {};
		},
		onReady: function(){
			var that = this;
			
			//only happens in edit context, not layout.
			//if(this.get('edit')) {
				//initialize data-content editor to an ace editor
				var elementId = 'parent-data-content';
				var pad = ace.edit(elementId);
				//config ace editor
				pad.setTheme('ace/theme/monokai');
				pad.setFontSize(14);
				pad.getSession().setMode('ace/mode/json');
				pad.$blockScrolling = Infinity;
				//save it for later use
				this.pads.parentDataContent = pad;

				//register change event on remote check box
				this.$el.find('#parent-data-remote-switch').on('change', function(e){
					if($(this).prop('checked')){
						that.$el.find('.data-editor').removeClass('local');
						that.$el.find('.url-editor').removeClass('hidden');
					}
					else{
						that.$el.find('.url-editor').addClass('hidden');
						that.$el.find('.data-editor').addClass('local');
					}
				});
			//}

			//wait for the ace setup
			//shrink the menu after ace initiated to avoid styling glitch
			_.defer(function(){
				that.parentCt.$el.find('.left-container').addClass('closed');
			});
		},
		actions: {
			'export-parent': function(){
				var layouts = app.store.get('__layouts'),
					remote = this.$el.find('#parent-data-remote-switch').prop('checked'),
					//check whether remote or local data
					dataContent = remote ? this.$el.find('.url-editor > input').val() : this.pads.parentDataContent.getValue(),
					remoteFlag = remote ? true : false; //indicator for backend to better deal with data contents

				if(layouts[this.get('viewName')] && layouts[this.get('viewName')].layout) {

					//call view name overlay to configure a export name
					app.get('Overlay.ExportViewName').create({
						viewType: 'parent',
						data: {
							layout: layouts[this.get('viewName')].layout,
							dataContent: dataContent,
							remoteFlag: remoteFlag
						},
					}).overlay({
						effect: false
					});

				}else {
					console.warn('Cannot export view layout...');
				}


			},
			'parent-remote-fetch': function(){
				var url = this.$el.find('.url-editor > input').val(),
					that = this;
				//fetch data
				app.remote({
					url: url
				})
				.done(function(data){
					var str = JSON.stringify(data, null, '\t');
					that.pads.parentDataContent.setValue(str, 1);
					//show success notification
					app.notify('FETCH SUCCESS!', 'Data has been successfully fetched.', 'success');
				})
				.fail(function(){
					//show error notification
					app.notify('FETCH ERROR!', 'Cannot fetch data from given url.', 'danger');
				});
			},
			'switch-view': function($self){
				//app.navigate('_IDE/' + this.get('method') + '/' + $self.find('.text').text());
				
				//ask user whether they desire to save, only if the view has been changed
				if(this.get('method') === 'Layout' && this.parentCt.modified)
					app.get('Overlay.SaveLayout').create({
						data: {
							viewName: this.get('viewName'),
							next: $self.find('.text').text(),
							method: this.get('method'),
							parentCt: this
						},
					}).overlay({
						effect: false,
					});

				else{

					//reset parent indicators before navigate away
					this.resetParentIndicator();
					
					app.navigate('_IDE/' + this.get('method') + '/' + $self.find('.text').text());
				}
					
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
				var that = this;
				if((_.find(this.get('items'), function(v){ return v.name === that.get('viewName'); })).source === 'remote'){
					app.notify('ERROR!', 'Currently you cannot save the layout for a remote view.', 'danger');
					return;
				}

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

		//========================================== helper functions ==========================================//

		//function to reset parent's indicator, based on current context
		resetParentIndicator: function(){

			//reset all the indicators based on context
			if(this.get('method') === 'Layout'){
				//indicate whether endpoint menu is current being shown or not
				this.parentCt.endpointMenuShown = false;

				//indicate whether it is outline only
				this.parentCt.outlineOnly = false;

				//indicate whether current view has been edited
				this.parentCt.modified = false;
			}

			else if(this.get('method') === 'Edit'){
				//indicator of which $el triggered context menu
				this.parentCt.$contextMenuTrigger = false;

				//array to store all the first layer regions object
				this.parentCt.firstLayers = [];

				//indicate whether context menu is currently showing
				this.parentCt.contextmenuShown = false;
			}
		},

		//function to compare two values in Handlerbar.js
		templateHelpers: {
			xif3: function(val1, val2){
				return val1 === val2;
			},
		},

		//========================================== functions to handle coop events ==========================================//
		
		//user choose not to save
		onSaveLayoutDenied: function(obj){

			//reset parent indicators before navigate away
			this.resetParentIndicator();

			app.navigate('_IDE/' + obj.method + '/' + obj.next);
		},

		//user choose to save
		onSaveLayoutConfirmed: function(obj){

			//reset parent indicators before navigate away
			this.resetParentIndicator();

			//call parentCt to handle to save method
			this.coop('save-layout', obj);

			//defer to make sure really saved before switching context
			// _.defer(function(){
			// 	app.navigate('_IDE/' + obj.method + '/' + obj.next);
			// });
		},
	});

})(Application);