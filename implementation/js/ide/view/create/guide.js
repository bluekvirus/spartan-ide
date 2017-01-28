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
			var top = genLine('h', {x1: 0, x2: 100, y: 0});
			//bottom
			var bottom = genLine('h', {x1: 0, x2: 100, y: 100});
			//left
			var left = genLine('v', {y1: 0, y2: 100, x: 0});
			//right
			var right = genLine('v', {y1: 0, y2: 100, x: 100});

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
				newStartPoint, newEndPoint,
				occupied, oldLine,
				tolerance = 0.02/*since some time points won't match down to every digit, we intoduce a tolerance parameter here.*/;

			///TODO: 	!!DONE: Clean up this part into a function!!!!!!
			///			Make delete
			///			Make drag
			///			!!DONE: Magnate
			///			!!DONE: 2em gap
			///			Clean up code


			if(this._horizontal){//horizontal line

				x1 = trimNumber(parseInt($horizontal.css('left')) / this.$el.width() * 100); //raphael only takes number. therefore parseInt
				x2 =  trimNumber((parseInt($horizontal.css('left')) + $horizontal.width()) / this.$el.width() * 100);
				y1 = y2 = trimNumber(parseInt($horizontal.css('top')) / this.$el.height() * 100);
				
				//first check whether there is a point already at those coordinates
				occupied = checkOccupied({x1: x1, y1: y1, x2: x2, y2: y2});

				//generate new line id here for easier reference
				newLineId = _.uniqueId('horizontal-');

				//left endPoint
				if(occupied.occupiedStart){
					//set right pointer to the new horizontal line
					occupied.occupiedStart.right = newLineId;
					//refer start point to the occupied point
					newStartPoint = occupied.occupiedStart.id;

				}else{
					//find out it should attach to which vertical line
					oldLine = _.find(app._global['vertical-line'], function(vline){ return vline.x >= x1 * (1 - tolerance) && vline.x <= x1 * (1 + tolerance) && y1 < vline.y2 && y1 > vline.y1; });
					//!!Note: there should not be a horizontal line attached to the left of this new point.
					//!!Otherwise there should already be a point there.
				
					newStartPoint = breakLine('h', oldLine, {x: x1, y: y1}, newLineId, true);
				}
				//right endPoint
				if(occupied.occupiedEnd){
					//set left pointer to the new horizontal line
					occupied.occupiedEnd.left = newId;
					//refer end point to the end point
					newEndPoint = occupied.occupiedEnd.id;

				}else{
					//find out which line needs to be replaced
					oldLine = _.find(app._global['vertical-line'], function(vline){ return vline.x >= x2 * (1 - tolerance) && vline.x <= x2 * (1 + tolerance) && y1 < vline.y2 && y1 > vline.y1; });

					newEndPoint = breakLine('h', oldLine, {x: x2, y: y2}, newLineId);
				}
				
				//generate the new line to insert
				genLine('h', {x1: x1, x2: x2, y: y1}, {
					left: newStartPoint,
					right: newEndPoint
				}, newLineId);
			}
			else{//vertical line

				x1 = x2 = trimNumber(parseInt($vertical.css('left')) / this.$el.width() * 100);
				y1 = trimNumber(parseInt($vertical.css('top')) / this.$el.height() * 100);
				y2 = trimNumber((parseInt($vertical.css('top')) + $vertical.height()) / this.$el.height() * 100);

				//check occupation
				occupied = checkOccupied({x1: x1, y1: y1, x2: x2, y2: y2});

				//generate new line id here for easier reference
				newLineId = _.uniqueId('vertical-');

				//top end point
				if(occupied.occupiedStart){
					//set bottom pointer to the new vertical line
					occupied.occupiedStart.bottom = newLineId;
					//set start reference to the occupied point
					newStartPoint = occupied.occupiedStart.id;
				}else{
					//find out it should attach to which vertical line
					oldLine = _.find(app._global['horizontal-line'], function(hline){ return hline.y >= y1 * (1 - tolerance) && hline.y <= y1 * (1 + tolerance) && x1 < hline.x2 && x1 > hline.x1; });
					//break line
					newStartPoint = breakLine('v', oldLine, {x: x1, y: y1}, newLineId, true);
				}

				//bottom end point
				if(occupied.occupiedEnd){
					//set top pointer to the new vertical line
					occupied.occupiedEnd.top = newLineId;
					//set end reference to the occupied point
					newEndPoint = occupied.occupiedEnd.id;
				}else{
					//find out it should attach to which vertical line
					oldLine = _.find(app._global['horizontal-line'], function(hline){ return hline.y >= y2 * (1 - tolerance) && hline.y <= y2 * (1 + tolerance) && x1 < hline.x2 && x1 > hline.x1; });
					//break line
					newEndPoint = breakLine('v', oldLine, {x: x2, y: y2}, newLineId);
				}
				

				//add new vertical line
				genLine('v', {y1: y1, y2: y2, x: x1}, {
					top: newStartPoint,
					bottom: newEndPoint
				}, newLineId);
			}
			

			console.log(app._global['horizontal-line'], app._global['vertical-line'], app._global.endPoints);
			
			app.coop('layout-added', {
				x1: x1,
				y1: y1,
				x2: x2,
				y2: y2,
				startPoint: newStartPoint,
				endPoint: newEndPoint,
				lineId: newLineId
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

	//check whether there is already end points at the position the new line needs to be installed
	function checkOccupied(coords/*x1,y1 as first point and x2,y2 as second point*/){
		var occupiedStart, occupiedEnd;
		//check
		_.each(app._global.endPoints, function(endPoint, id){
			if(endPoint.x === coords.x1 && endPoint.y === coords.y1)
				occupiedStart = id;
			else if(endPoint.x === coords.x2 && endPoint.y === coords.y2)
				occupiedEnd = id;
		});

		//return as an object
		return {
			occupiedStart: occupiedStart,
			occupiedEnd: occupiedEnd
		};
	}

	//break a single segment into two
	function breakLine(insertDir, oldLine/*the line that needs to be broken*/, coords/*coordinates for the new point*/, newLineId, start/*bool, indicate first or second point on the inserting line*/){
		
		var newPointId = _.uniqueId('endPoint-'), 
			newStartLine, newEndLine;

		if(insertDir === 'h'){//inserting horizontal line

			//now break the vertical line into two shorter vertical line
			//add two newLines
			newStartLine = genLine('v', {y1: oldLine.y1, y2: coords.y, x: coords.x}, {
				top: oldLine.top,
				bottom: newPointId
			});

			newEndLine = genLine('v', {y1: coords.y, y2: oldLine.y2, x: coords.x}, {
				top: newPointId,
				bottom: oldLine.bottom
			});

			//delete the original line from collection
			app._global['vertical-line'] = _.without(app._global['vertical-line'], _.find(app._global['vertical-line'], function(vline){ return vline.id === oldLine.id; }));

			//add new endPoint
			start ? genPoint(coords.x, coords.y, { right: newLineId, top: newStartLine, bottom: newEndLine}, newPointId) 
					: genPoint(coords.x, coords.y, { left: newLineId, top: newStartLine, bottom: newEndLine}, newPointId);
			
		}else{//inserting vertical line

			//add two lines
			newStartLine = genLine('h', {x1: oldLine.x1, x2: coords.x, y: coords.y}, {
				left: oldLine.left,
				right: newPointId
			});

			newEndLine = genLine('h', {x1: coords.x, x2: oldLine.x2, y: coords.y}, {
				left: newPointId,
				right: oldLine.right
			});

			//delete the original line from collection
			app._global['horizontal-line'] = _.without(app._global['horizontal-line'], _.find(app._global['horizontal-line'], function(hline){ return hline.id === oldLine.id; }));

			//add new endPoint
			start ? genPoint(coords.x, coords.y, { bottom: newLineId, left: newStartLine, right: newEndLine}, newPointId) 
					: genPoint(coords.x, coords.y, { top: newLineId, left: newStartLine, right: newEndLine}, newPointId);
		}

		return newPointId;

	}

	//generate a new line and add it to the global collection
	function genLine(direction, coords, adjcents, preid/*pre-defined id, for easier collorating between end points and lines*/){
		var obj = {};

		//pass in coordinates
		_.each(coords, function(coord, name){
			obj[name] = coord;
		});

		//pass in adjcents
		_.each(adjcents, function(id, position){
			obj[position] = id;
		});

		//add to global collection accordingly
		if(direction === 'h'){//horizontal line
			//gen id
			obj.id = preid ? preid : _.uniqueId('horizontal-');
			//push into collection
			app._global['horizontal-line'].push(obj);
			//re-sort the collection
			app._global['horizontal-line'] = _.sortBy(app._global['horizontal-line'], function(coords){
				return coords.y;
			});

		}else{//vertical line
			//gen id
			obj.id = preid ? preid : _.uniqueId('vertical-');
			//push into collection
			app._global['vertical-line'].push(obj);
			//re-sort the collection
			app._global['vertical-line'] = _.sortBy(app._global['vertical-line'], function(coords){
				return coords.x;
			});
		}

		return obj.id;
	}
})(Application);