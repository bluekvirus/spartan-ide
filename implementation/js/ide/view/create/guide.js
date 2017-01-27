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

			//create a global object to store points, horizontal lines and vertical lines
			app._global = app._global || {};
			app._global.endPoints = app._global.endPoints || {};
			app._global['vertical-line'] = app._global['vertical-line'] || [];
			app._global['horizontal-line'] = app._global['horizontal-line'] || [];
		},
		onReady: function(){
			//!!Note: all stored coordinates should be translate into percetage to work with window.resize() event!!
			//!!Note: all stored corrdinates only keep two digits after dicimal for easier comparison!!
			
			//add initial four lines on frame
			//top
			app._global['horizontal-line'].push({x1: 0, x2: 100, y: 0, id: _.uniqueId('horizontal')});
			//bottom
			app._global['horizontal-line'].push({x1: 0, x2: 100, y: 100, id: _.uniqueId('horizontal')});
			//left
			app._global['vertical-line'].push({y1: 0, y2: 100, x: 0, id: _.uniqueId('vertical')});
			//right
			app._global['vertical-line'].push({y1: 0, y2: 100, x: 100, id: _.uniqueId('vertical')});

			//add initial four points on frame
			//top-left
			//app._global.endPoints.push({x: 0, y: 0, id: _.uniqueId('point'), right: app._global['horizontal-line'][0].id, bottom: app._global['vertical-line'][0].id});
			//top-right
			//app._global.endPoints.push({x: 100, y: 0, id: _.uniqueId('point'), left: app._global['horizontal-line'][0].id, bottom: app._global['vertical-line'][1].id});
			//bottom-left
			//app._global.endPoints.push({x: 0, y: 100, id: _.uniqueId('point'), right: app._global['horizontal-line'][1].id, top: app._global['vertical-line'][0].id});
			//bottom-right
			//app._global.endPoints.push({x: 100, y: 100, id: _.uniqueId('point'), left: app._global['horizontal-line'][1].id, top: app._global['vertical-line'][1].id});

			//link initial points back to initial lines
			//top line
			//app._global['horizontal-line'][0].left = app._global.endPoints[0].id;
			//app._global['horizontal-line'][0].right = app._global.endPoints[1].id;
			//bottom line
				
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

				genHorizontal(x1, x2, y1, {}, true);

			}
			else{//vertical line

				x1 = x2 = trimNumber(parseInt($vertical.css('left')) / this.$el.width() * 100);
				y1 = trimNumber(parseInt($vertical.css('top')) / this.$el.height() * 100);
				y2 = trimNumber((parseInt($vertical.css('top')) + $vertical.height()) / this.$el.height() * 100);

				//add new line
				genVertical(y1, y2, x1, {}, true);
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
		}
	});

	//trim number only leave two digits after decimal point
	function trimNumber(number){
		return parseFloat(number.toFixed(2));
	}

	//generate new point and add to global collection
	function genPoint(x, y, adjcents, preid/*pre-defined id for easier initialization*/){
		var obj = {}, id = preid ? preid : uniqueId('endPoint');

		obj.x = x;
		obj.y = y;

		if(adjcents)
			_.each(adjcents, function(id, position){
				obj.position = id;
			});

		app._global.endPoints.id = obj;

		return app._global.endPoints.id;
	}

	//generate new horizontal line and add to global collection
	function genHorizontal(x1, x2, y, adjcents, sort){
		var obj = {};
		obj.x1 = x1;
		obj.x2 = x2;
		obj.y = y;
		obj.id = _.uniqueId('horizontal');

		if(adjcents)
			_.each(adjcents, function(id, position){
				obj.position = id;
			});

		app._global['horizontal-line'].push(obj);

		if(sort)
			app._global['horizontal-line'] = _.sortBy(app._global['horizontal-line'], function(coords){
				return coords.y;
			});

		return obj;
	}

	//generate new vertical line and add to global collection
	function genVertical(y1, y2, x, adjcents, sort){
		var obj = {};
		obj.y1 = y1;
		obj.y2 = y2;
		obj.x = x;
		obj.id = _.uniqueId('vertical');

		if(adjcents)
			_.each(adjcents, function(id, position){
				obj.position = id;
			});

		app._global['vertical-line'].push(obj);

		if(sort)
			app._global['vertical-line'] = _.sortBy(app._global['vertical-line'], function(coords){
				return coords.x;
			});

		return obj;
	}

})(Application);