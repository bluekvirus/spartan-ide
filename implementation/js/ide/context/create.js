;(function(app){

	app.context('Create', {
		template: '@context/create.html',
		attributes: {
			tabindex: "1" //make this div focusable in order to use keypress event
		},
		onReady: function(){
			var that = this;
			//guide line
			this.show('guide', 'Create.Guide');
			//layout svg
			this.show('layout', 'Create.Layout');
			
			//focus on this.$el to trigger events
			this.$el.focus();

			//on mouse move use app.coop to show the guide lines
			this.$el.on('mousemove', function(e){
				//prevent default events
				e.preventDefault();

				//check constrain
				if(!that.checkConstrain(e)) return;

				//get x and y
				var x = e.pageX,
					y = e.pageY;

				app.coop('guideline-move', {
					x: x,
					y: y
				});

			});

			//on press shift key switch the direction of guide line
			this.$el.on('keyup', function(e){
				//prevent default events
				e.preventDefault();

				//shift key pressed
				if(e.which === 16)
					app.coop('guideline-switch');

			});

			this.$el.on('click', function(e){
				//console.log(e);
			});
		},
		checkConstrain: function(e){
			if(e.pageX < 0 || e.pageX > this.$el.width() || e.pageY < 0 || e.pageY > this.$el.height())
				return false;


			return true;
		},
	});

})(Application);