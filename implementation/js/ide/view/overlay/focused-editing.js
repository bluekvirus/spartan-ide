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
				
				this.close();
			},
			'save-builder': function(){
				
				this.close();
			},
		},
		onClose: function(){
			app.coop('view-edit-menu-closed', {
				$element: this.get('$element')
			});
		},
	});

})(Application);