/**
 * Sample VIEW script.
 *
 * @author Stagejs.CLI
 * @created Thu May 18 2017 12:06:30 GMT-0700 (PDT)
 */
;(function(app){

	app.view('Layout.Guide', {

		template: '@view/ide/layout/guide.html',
		attributes: {
			tabindex: "1" //make this div focusable in order to use keypress event
		},
		//data: 'url', {} or [],
		//coop: ['e', 'e'],
		//[editors]: {...},
		
		initialize: function(){
			//initial direction is horizontal
			this.horizontal = true;

			//initial move flag
			this.initialMove = true;

		},
		//onShow: function(){},
		//onDataRendered: function(){},
		onReady: function(){
			var that = this;

			//get height and width of the element
			var height = this.$el.height(),
				width = this.$el.width();

			//mousemove event for show guide lines
			this.$el.on('mousemove', function(e){
				//routine
				e.preventDefault();
				e.stopPropagation();

				var $this = $(this);
				//set focus to this view
				$this.focus();

				//initial move show horizontal line
				if(that.initialMove){
					that.$el.find('.horizontal-line').css({
						display: 'inherit',
					});
					that.initialMove = false;
				}

				//setup guide lines
				that.setupGuideLines({
					x: e.offsetX / width * 100,
					y: e.offsetY / height * 100
				});

			});

			//keyup event for shift and control
			//on press shift key switch the direction of guide line
			this.$el.on('keyup', function(e){
				//prevent default events
				e.preventDefault();

				//shift key pressed
				if(e.which === 16){
					
					//park the oppsite line
					if(that.horizontal){

						that.$el.find('.horizontal-line').css({
							display: 'none',
						});

						that.$el.find('.vertical-line').css({
							display: 'inherit',
						});

					}
						
					else{

						that.$el.find('.vertical-line').css({
							display: 'none',
						});

						that.$el.find('.horizontal-line').css({
							display: 'inherit',
						});

					}
						
					that.horizontal = !that.horizontal;
				}
				//control key up
				else if(e.which === 17)
					that.getViewIn('guide').$el.find('.divide-line-horizontal, .divide-line-vertical').remove();

			});

		},
		actions: {
		//	submit: function(){...},
		//	dosomething: function(){...},
		//	...
		},

		//---------------------------------------- helper functions ----------------------------------------//
		setupGuideLines: function(positions){

			if(this.horizontal){//horizontal line

				this.$el.find('.horizontal-line').css({
					top: positions.y + '%'
				});

			}else{//vertical line

				this.$el.find('.vertical-line').css({
					left: positions.x + '%'
				});

			}

		},
	});

})(Application);