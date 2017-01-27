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

			//!!Note: all stored coordinates should be translate into percetage to work with window.resize() event!!
			//!!Note: all stored corrdinates only keep two digits after dicimal for easier comparison!!
			
			//add initial four lines to represent the frame
			//top
			var top = genHorizontal(0, 100, 0);
			//bottom
			var bottom = genHorizontal(0, 100, 100);
			//left
			var left = genVertical(0, 100, 0);
			//right
			var right = genVertical(0, 100, 100);

			//add initial 4 points at four corners
			//top left
			var topLeft = genPoint(0, 0, {right: top, bottom: left});
			//top right
			var topRight = genPoint(100, 0, {left: top, bottom: right});
			//bottom left
			var bottomLeft = genPoint(0, 100, {right: bottom, top: left});
			//bottom right
			var bottomRight = genPoint(100, 100, {left: bottom, top: right});

			//link lines back to newly generated points
			var temp;
			//top
			temp = app._global['horizontal-line'][_.findIndex(app._global['horizontal-line'], function(obj){ return obj.id === top; })];
			temp.left = topLeft;
			temp.right = topRight;
			//bottom
			temp = app._global['horizontal-line'][_.findIndex(app._global['horizontal-line'], function(obj){ return obj.id === bottom; })];
			temp.left = bottomLeft;
			temp.right = bottomRight;
			//left
			temp = app._global['vertical-line'][_.findIndex(app._global['vertical-line'], function(obj){ return obj.id === left; })];
			temp.top = topLeft;
			temp.bottom = bottomLeft;
			//right
			temp = app._global['vertical-line'][_.findIndex(app._global['vertical-line'], function(obj){ return obj.id === right; })];
			temp.top = topRight;
			temp.bottom = bottomRight;
		},
		onReady: function(){
				
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
			//variables for later use
			var x1, x2, y1, y2, 
				occupiedStart, occupiedEnd,
				newStart, newEnd,
				newLineId, newPointId,
				newStartPoint, newEndPoint,
				oldLine;



			////////////////////////////
			///
			///
			///
			///
			///TODO: 	Clean up this part into a function!!!!!!
			///			Make delete
			///			Make drag
			///
			///
			///
			///


			if(this._horizontal){//horizontal line

				x1 = trimNumber(parseInt($horizontal.css('left')) / this.$el.width() * 100); //raphael only takes number. therefore parseInt
				x2 =  trimNumber((parseInt($horizontal.css('left')) + $horizontal.width()) / this.$el.width() * 100);
				y1 = y2 = trimNumber(parseInt($horizontal.css('top')) / this.$el.height() * 100);

				//add a new horizontal line
				//1). add two endPoints into the collection
				//2). add a horizontal line into the collection
				
				//first check whether there is a point already at those coordinates
				_.each(app._global.endPoints, function(endPoint, id){
					if(endPoint.x === x1 && endPoint.y === y1)
						occupiedStart = id;
					else if(endPoint.x === x2 && endPoint.y === y2)
						occupiedEnd = id;
				});
				newLineId = _.uniqueId('horizontal-');

				//left endPoint
				if(occupiedStart){
					//set right pointer to the new horizontal line
					occupiedStart.right = newLineId;

				}else{
					//find out it should attach to which vertical line
					oldLine = _.find(app._global['vertical-line'], function(vline){ return vline.x === x1 && y1 < vline.y2 && y1 > vline.y1; });
					//!!Note: there should not be a horizontal line attached to the left of this new point.
					//!!Otherwise there should already be a point there.
				
					newPointId = _.uniqueId('endPoint-');
					//now break the vertical line into two shorter vertical line
					//add two newLines
					newStart = genVertical(oldLine.y1, y1, x1, {
						top: oldLine.top,
						bottom: newPointId
					});

					newEnd = genVertical(y1, oldLine.y2, x1, {
						top: newPointId,
						bottom: oldLine.bottom
					});

					//delete the original line from collection
					app._global['vertical-line'] = _.without(app._global['vertical-line'], _.find(app._global['vertical-line'], function(vline){ return vline.id === oldLine.id; }));

					//add new left endPoint
					newStartPoint = genPoint(x1, y1, {
						right: newLineId,
						top: newStart,
						bottom: newEnd
					}, newPointId);
				}
				//right endPoint
				if(occupiedEnd){
					//set left pointer to the new horizontal line
					occupiedEnd.left = newId;

				}else{
					oldLine = _.find(app._global['vertical-line'], function(vline){ return vline.x === x2 && y1 < vline.y2 && y1 > vline.y1; });

					newPointId = _.uniqueId('endPoint-');
					//now break the vertical line into two shorter vertical line
					//add two newLines
					newStart = genVertical(oldLine.y1, y1, x2, {
						top: oldLine.top,
						bottom: newPointId
					});

					newEnd = genVertical(y1, oldLine.y2, x2, {
						top: newPointId,
						bottom: oldLine.bottom
					});

					//delete the original line from collection
					app._global['vertical-line'] = _.without(app._global['vertical-line'], _.find(app._global['vertical-line'], function(vline){ return vline.id === oldLine.id; }));

					//add new right endPoint
					newEndPoint = genPoint(x2, y2, {
						left: newLineId,
						top: newStart,
						bottom: newEnd
					}, newPointId);
				}
				

				genHorizontal(x1, x2, y1, {
					left: newStartPoint,
					right: newEndPoint
				}, newLineId);

				console.log(app._global['horizontal-line'], app._global['vertical-line'], app._global.endPoints);

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
	function genPoint(x, y, adjcents, preid/*pre-defined id*/){
		var obj = {}, id = preid ? preid : _.uniqueId('endPoint-');

		obj.x = x;
		obj.y = y;

		if(adjcents)
			_.each(adjcents, function(id, position){
				obj[position] = id;
			});

		app._global.endPoints[id] = obj;

		//return id for easier querying
		return id;
	}

	//generate new horizontal line and add to global collection
	function genHorizontal(x1, x2, y, adjcents, preid/*pre-defined id*/){
		var obj = {};
		obj.x1 = x1;
		obj.x2 = x2;
		obj.y = y;
		obj.id = preid ? preid : _.uniqueId('horizontal-');

		if(adjcents)
			_.each(adjcents, function(id, position){
				obj[position] = id;
			});

		app._global['horizontal-line'].push(obj);

		//re-sort the array
		app._global['horizontal-line'] = _.sortBy(app._global['horizontal-line'], function(coords){
			return coords.y;
		});

		//return id for easier querying
		return obj.id;
	}

	//generate new vertical line and add to global collection
	function genVertical(y1, y2, x, adjcents, preid/*pre-defined id*/){
		var obj = {};
		obj.y1 = y1;
		obj.y2 = y2;
		obj.x = x;
		obj.id = preid ? preid : _.uniqueId('vertical-');

		if(adjcents)
			_.each(adjcents, function(id, position){
				obj[position] = id;
			});

		app._global['vertical-line'].push(obj);

		//re-sort the array
		app._global['vertical-line'] = _.sortBy(app._global['vertical-line'], function(coords){
			return coords.x;
		});

		//return id for easier querying
		return obj.id;
	}

})(Application);