(function(app){

	app.view('Overlay.FocusedEditing', {
		className: 'focused-editing-view clearfix',
		template: '@view/overlay/focused-editing.html',
		overlay: true,
		onReady: function(){
			this.activate('single', 1);
		},
		onItemActivated: function($item){
			var tabId = $item.attr('tabId');
			this.tab('tabs', 'Overlay.FocusedEditing.' + tabId, tabId); 
		},
		actions: {
			close: function(){
				
				this.close();
			},
			save: function(){
				
				this.close();
			},
		}
	});

})(Application);