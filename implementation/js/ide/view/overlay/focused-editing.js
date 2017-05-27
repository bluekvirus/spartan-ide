(function(app){

	app.view('Overlay.FocusedEditing', {
		className: 'focused-editing-view clearfix',
		template: '@view/overlay/focused-editing.html',
		initialize: function(){
			//moving flag
			this.onMoveCloneToCenter = this.options.onMoveCloneToCenter;

			//carrier the view that is going to be sprayed
			this.spraying = false;

			//close after saving
			this.saved = false;
		},
		onReady: function(){
			this.activate('single', 0);
		},
		onItemActivated: function($item){
			var tabId = $item.attr('tabId');
			//separate View view from others
			if(tabId === 'View')
				this.tab('tabs', app.get('Overlay.FocusedEditing.' + tabId).create({
					data: this.get()
				}).once('ready', function(){
					this.coop('move-clone-to-center', this);
				}), tabId);
			else
				this.tab('tabs', 'Overlay.FocusedEditing.' + tabId, tabId);
		},
		actions: {
			'close-builder': function(){
				//close focused-editing view
				this.close();
			},
			'save-builder': function(){
				//get builder view
				var builder, template, dataTab, dataContent,
					builderFlag = true, dataFlag = true;
				
				try {
					builder = app.locate('Overlay.FocusedEditing.Builder').view;
				}catch(e){
					builderFlag = false;
					console.warn('You have NOT load the builder view into the region!');
				}

				//only assign tempalte if the builder view is loaded
				if(builderFlag)
					template = builder.extractTemplate();

				try{
					dataTab = this.getViewIn('tabs').getViewIn('tab-Data');
				}catch(e){
					dataFlag = false;
					console.warn('You have NOT assign any data.');
				}

				//only assign data if the dataTab has been loaded
				if(dataFlag){
					if(dataTab.$el.find('#remote-switch').prop('checked')){
						//remote data, fetch url editor's content as data
						dataContent = dataTab.get('url');
					}else{
						dataContent = dataTab.get('data-content');
					}
				}

				if(builderFlag && template){
					//flip flag
					this.saved = true;

					//temporary solution
					this.spraying = app.view({
										template: template,
										data: dataContent || {}
									});
				}
					

				// //!!need to consult with zahra
				//this.close();
			},
			'get-color': function($self, e){
				console.log('TBD'); //show copy the color name to the clipboard
			},
		},
		onClose: function(){
			app.coop('view-edit-menu-closed', {
				saved: this.saved,
				$element: this.get('$element'),
				spraying: this.spraying
			});

			//reset the flag
			this.saved = false;
		},
	});

})(Application);