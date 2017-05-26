(function(app){

	app.view('Overlay.FocusedEditing', {
		className: 'focused-editing-view clearfix',
		template: '@view/overlay/focused-editing.html',
		initialize: function(){
			this.onMoveCloneToCenter = this.options.onMoveCloneToCenter;
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
				var builder = app.locate('Overlay.FocusedEditing.Builder').view, template;

				if(builder)
					 template = builder.extractTemplate();


				//get data if any
				var dataTab = this.getViewIn('tabs').getViewIn('tab-Data'), dataContent;

				if(dataTab){//!!for now just fetch what is in the data editor
					dataContent = dataTab.get('data-content') || {};
				}

				//create a view
				var Result = app.view({
					template: template,
					data: dataContent
				});

				//spray
				app.spray(this.get('$element'), Result);


				//!!need to consult with zahra
				this.close();
				
			},
			'get-color': function($self, e){
				console.log('TBD'); //show copy the color name to the clipboard
			},
		},
		onClose: function(){
			app.coop('view-edit-menu-closed', {
				$element: this.get('$element')
			});
		},
	});

})(Application);