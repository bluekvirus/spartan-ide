;(function(app){

	app.view('Create.Guide', {
		template: '@view/create/guide.html',
		coop:['guideline-move', 'guideline-switch'],
		initialize: function(){
			this._horizontal = true;
			this._x = 0;
			this._y = 0;
		},
		onReady: function(){

		},
		onGuidelineMove: function(position){
			this._x = position.x;
			this._y = position.y;
			this.setupGuideLines();
		},
		onGuidelineSwitch: function(){
			this._horizontal = !this._horizontal;
			this.setupGuideLines(true);
		},
		setupGuideLines: function(switched){
			if(this._horizontal){//horizontal line
				//reset vertical line
				if(switched)
					this.$el.find('.vertical-line').css({
						left: 0
					});
				//setup horizontal line position
				this.$el.find('.horizontal-line').css({
					top: this._y
				});

			}else{//vertical line
				//reset vertical line
				if(switched)
					this.$el.find('.horizontal-line').css({
						top: 0
					});
				//setup horizontal line position
				this.$el.find('.vertical-line').css({
					left: this._x
				});
			}
		},
	});

})(Application);