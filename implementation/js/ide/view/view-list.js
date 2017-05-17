;(function(app){

	app.view('ViewList', {
		//className: 'clearfix',
		//template: '@view/view-list.html',
		data: '/api/getViewList',
		layout: {
			split: [
				'300px:.list-holder:"<div class="title"><span class="text">VIEWS</span></div>{{#items}}<div class="view-list-item" action="edit-view"><span class="text">{{.}}</span></div>{{/items}}"',
				'1:.info-holder:<span>Stage-IDE powered by Stage.js framework. <i class="fa fa-github"></i></span>'
			],
			dir: 'v',
			bars: false
		},
		onReady: function(){
			
		},
		actions: {
			'edit-view': function($self){
				app.navigate('_IDE/ViewEdit/' + $self.text());
			}
		},
	});

})(Application);