;(function(app){

	app.view('Create.Arrows', {
		template: '@view/create/arrows.html',
		coop: ['click-endpoint', 'point-layout-reset-confirmed'],
		lines: {//store lines attached to current point
			up: '',
			down: '',
			left: '',
			right: ''
		},
		point: '',//store the point currently focusing on
		shown: false,//variable indicate whether currently menu is showing or not. for other views and events to consult.
		onReady: function(){

		},
	});

})(Application);