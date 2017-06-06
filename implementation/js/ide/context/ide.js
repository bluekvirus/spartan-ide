//_IDE view
(function(app){

	app.context('_IDE', {
		
		template: '@context/ide.html',
		navRegion: 'ide-content',
		onNavigateTo: function(path){
			app.navigate('_IDE/Views');
		}
		// data: '/api/getViewList',
		// coop: ['navigation-changed'],
		// navRegion: 'ide-nav-region',

		// onReady: function(){
		// 	this.show('ide-content', 'ViewPreview');
		// },
		// onNavigationChanged: function(path){
		// 	console.log(path);
		// },
		// attributes: {
		// 	style: 'height:100%;width:100%;'
		// },
		// actions: {
		// 	'preview-view': function($self){
		// 		app.navigate('_IDE/' + $self.find('.text').text());
		// 		//this.show('preview', $self.find('.text').text());
		// 	},
		// 	'edit-view': function($self){
		// 		app.navigate('_IDE/Layout/' + $self.parent().find('.text').text());
		// 	}
		// },
		// onNavigationChanged: function(path){
		// 	var viewName = path.pop(),
		// 		method = path.pop();
			
		// 	if(method === '_IDE'){
		// 		console.log('_IDE');
		// 		return;
		// 	}
		// 	else if(method === 'Layout'){
		// 		console.log('Layout');
		// 		return;
		// 	}
		// 	else if(method === 'Edit'){
		// 		console.log('Edit');
		// 		return;
		// 	}
		// },
	});

})(Application);