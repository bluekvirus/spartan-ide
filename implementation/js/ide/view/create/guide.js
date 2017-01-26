/**
 * Horizontal line from left to right.
 * Vertical line from top to bottom. 
 */

;(function(app){

	app.view('Create.Guide', {
		template: '@view/create/guide.html',
		coop:['guideline-move', 'guideline-switch', 'guideline-click'],
		initialize: function(){
			this._horizontal = true; //flag indicates that now showing horizontal line or vertical line
			this._x = 0; //0 - 100 in percentage
			this._y = 0; //0 - 100 in percentage
		},
		onReady: function(){
			//!!Note: all stored coordinates should be translate into percetage to work with window.resize() event!!
			//!!Note: all stored corrdinates only keep two digits after dicimal for easier comparison!!
			
			//add initial four lines on frame
			//top
			app._global['horizontal-line'].push({x1: 0, x2: 100, y: 0});
			//bottom
			app._global['horizontal-line'].push({x1: 0, x2: 100, y: 100});
			//left
			app._global['vertical-line'].push({y1: 0, y2: 100, x: 0});
			//right
			app._global['vertical-line'].push({y1: 0, y2: 100, x: 100});
		},
		onGuidelineMove: function(position){
			this._x = position.x / this.$el.width() * 100; //translate in percentage
			this._y = position.y / this.$el.height() * 100;
			this.setupGuideLines();
		},
		onGuidelineSwitch: function(){
			this._horizontal = !this._horizontal;
			this.setupGuideLines(true);
		},
		onGuidelineClick: function(){
			var $horizontal = this.$el.find('.horizontal-line'),
				$vertical = this.$el.find('.vertical-line');
			var x1, x2, y1, y2;

			if(this._horizontal){//horizontal line

				x1 = trimNumber(parseInt($horizontal.css('left')) / this.$el.width() * 100); //raphael only takes number. therefore parseInt
				x2 =  trimNumber((parseInt($horizontal.css('left')) + $horizontal.width()) / this.$el.width() * 100);
				y1 = y2 = trimNumber(parseInt($horizontal.css('top')) / this.$el.height() * 100);

				//add horizontal line to the collection
				app._global['horizontal-line'].push({x1: x1, x2: x2, y: y1});
				//reorder the horizontal lines
				app._global['horizontal-line'] = _.sortBy(app._global['horizontal-line'], function(coords){
					return coords.y;
				});

			}
			else{//vertical line

				x1 = x2 = trimNumber(parseInt($vertical.css('left')) / this.$el.width() * 100);
				y1 = trimNumber(parseInt($vertical.css('top')) / this.$el.height() * 100);
				y2 = trimNumber((parseInt($vertical.css('top')) + $vertical.height()) / this.$el.height() * 100);

				//add vertical line to the collection
				app._global['vertical-line'].push({y1: y1, y2: y2, x: x1});
				//reorder the vertical lines
				app._global['vertical-line'] = _.sortBy(app._global['vertical-line'], function(coords){
					return coords.x;
				});
			}

			app.coop('layout-added', {
				x1: x1,
				y1: y1,
				x2: x2,
				y2: y2,
			});
				
		},
		setupGuideLines: function(switched){
			//four constrain varibles
			var limits, that = this;

			if(this._horizontal){//horizontal line
				//reset vertical line
				if(switched)
					this.$el.find('.vertical-line').css({
						left: 0
					});

				//consult vertical lines to see how long should this horizontal line be
				limits = this.guideLineConstrain('h');

				//setup horizontal line position
				this.$el.find('.horizontal-line').css({
					left: limits.min + '%',
					right: (100 - limits.max) + '%',
					top: this._y + '%'
				});

			}else{//vertical line
				//reset vertical line
				if(switched)
					this.$el.find('.horizontal-line').css({
						top: 0
					});

				//consult horizontal lines to see how long this vertical line should be
				limits = this.guideLineConstrain('v');

				//setup horizontal line position
				this.$el.find('.vertical-line').css({
					top: limits.min + '%',
					bottom: (100 - limits.max) + '%',
					left: this._x + '%'
				});
			}
		},
		guideLineConstrain: function(direction){
			var obj = {},
				that = this;

			if(direction === 'h'){//horizontal line

				obj.min = _.filter(app._global['vertical-line'], function(coords){
					if(that._y <= coords.y2 && that._y >= coords.y1 && coords.x <= that._x)
						return true;
					else
						return false;
				}).pop().x;

				obj.max = _.filter(app._global['vertical-line'], function(coords){
					if(that._y <= coords.y2 && that._y >= coords.y1 && coords.x > that._x)
						return true;
					else
						return false;
				}).shift().x;

			}else{//vertical line

				obj.min = _.filter(app._global['horizontal-line'], function(coords){
					if(that._x <= coords.x2 && that._x >= coords.x1 && coords.y <= that._y)
						return true;
					else
						return false;
				}).pop().y;

				obj.max = _.filter(app._global['horizontal-line'], function(coords){
					if(that._x <= coords.x2 && that._x >= coords.x1 && coords.y > that._y)
						return true;
					else
						return false;
				}).shift().y;

			}

			return obj;

		},
	});

	function trimNumber(number){
		return parseFloat(number.toFixed(2));
	}

})(Application);