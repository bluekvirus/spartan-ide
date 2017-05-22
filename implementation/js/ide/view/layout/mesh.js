/**
 * Sample VIEW script.
 *
 * @author Stagejs.CLI
 * @created Thu May 18 2017 12:06:34 GMT-0700 (PDT)
 */
;(function(app){

	app.view('Layout.Mesh', {

		//template: '@view/ide/layout/mesh.html',
		//data: 'url', {} or [],
		//coop: ['e', 'e'],
		//[editors]: {...},
		svg: true,
		attributes: {
			tabindex: "1" //make this div focusable in order to use keypress event
		},
		//coop: [],
		initialize: function(){
			//direction indicator
			this.horizontal = true;

			//radius for drawing the end-points
			this.radius = 8;

			//insert initial 4 points and 4 lines
			if(!(_.keys(app._global.endPoints).length)){
				//add initial four lines to represent the frame
				//top
				var top = this.genLine('h', {x1: 0, x2: 100, y: 0});
				//bottom
				var bottom = this.genLine('h', {x1: 0, x2: 100, y: 100});
				//left
				var left = this.genLine('v', {y1: 0, y2: 100, x: 0});
				//right
				var right = this.genLine('v', {y1: 0, y2: 100, x: 100});

				//add initial 4 points at four corners
				//top left
				var topLeft = this.genPoint(0, 0, {right: top, bottom: left});
				//top right
				var topRight = this.genPoint(100, 0, {left: top, bottom: right});
				//bottom left
				var bottomLeft = this.genPoint(0, 100, {right: bottom, top: left});
				//bottom right
				var bottomRight = this.genPoint(100, 100, {left: bottom, top: right});

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
			}
		},
		//onShow: function(){},
		//onDataRendered: function(){},
		onReady: function(){
			//routine
			this.paper.clear();
			var that = this;

			//get dimension of the canvas
			var width = this.$el.width(),
				height = this.$el.height();

			if(!this.get('outline-only')){
				//initial draw
				this.redrawAll();

				//mousemove event for show guide lines
				this.$el.find('svg').on('mousemove', function(e){
					//routine
					e.preventDefault();
					//e.stopPropagation(); //keep propgation for dragging layout
					
					if(that.dragging){
						//park current guide line
						if(that.horizontal)
							that.paper.d3.selectAll('.horizontal-line')
										.attr('d', 'M0 -5l' + 0 + ' -5');
						else
							that.paper.d3.selectAll('.vertical-line')
										.attr('d', 'M-5 0l-5 ' + 0);

						return;
					}

					//check whether endpoint menu is shown, if yes park horizontal/vertical guide lines
					if(that.parentCt.endpointMenuShown){
						//park current guide line
						if(that.horizontal)
							that.paper.d3.selectAll('.horizontal-line')
										.attr('d', 'M0 -5l' + 0 + ' -5');
						else
							that.paper.d3.selectAll('.vertical-line')
										.attr('d', 'M-5 0l-5 ' + 0);
						return;			
					}

					//set focus to this view
					that.$el.focus();

					//setup guide lines
					that.setupGuideLines({
						x: e.offsetX,
						y: e.offsetY
					}, e);

				});

				//keyup event for shift and control
				//on press shift key switch the direction of guide line
				this.$el.on('keyup', function(e){
					//prevent default events
					e.preventDefault();

					//shift key pressed
					if(e.which === 16){
						
						//park current line
						if(that.horizontal){

							that.paper.d3.selectAll('.horizontal-line')
										.attr('d', 'M0 -5l' + 0 + ' -5');

						}else{

							that.paper.d3.selectAll('.vertical-line')
										.attr('d', 'M-5 0l-5 ' + 0);

						}
							
						//flip flag
						that.horizontal = !that.horizontal;
					}
					//control key up
					// else if(e.which === 17)
					// 	that.getViewIn('guide').$el.find('.divide-line-horizontal, .divide-line-vertical').remove();

				});

				//click event, check on target to trigger different actions
				this.$el
				//click event for adding a horizontal line
				.on('click', '.horizontal-line', function(e){
					//routine
					e.preventDefault();
					e.stopPropagation();

					//don't do anything if menu is shown or dragging
					if(that.dragging || that.parentCt.endpointMenuShown)
						return;

					var	$target = $(e.target),
						pathArr = $target.attr('d').split(' ');

					//get coords in percentage
					var y = trimNumber(parseInt(pathArr[2]) / height * 100),
						x1 = trimNumber(parseInt(pathArr[0].replace('M', '')) / width * 100),
						x2 = trimNumber(parseInt(pathArr[1].split('L')[1]) / width * 100);

					//add horizontal line
					that.addLine({
						x1: x1,
						x2: x2,
						y: y
					});
				})
				//click event for adding a vertical line
				.on('click', '.vertical-line', function(e){
					//routine
					e.preventDefault();
					e.stopPropagation();

					//don't do anything if menu is shown or dragging
					if(that.dragging || that.parentCt.endpointMenuShown)
						return;

					var $target = $(e.target),
						pathArr = $target.attr('d').split(' ');

					//get coords in percentage
					var x = trimNumber(parseInt(pathArr[0].replace('M', '')) / width * 100),
						y1 = trimNumber(parseInt(pathArr[1].split('L')[0]) / height * 100),
						y2 = trimNumber(parseInt(pathArr[2]) / height * 100);

					//add vertical line
					that.addLine({
						x: x,
						y1: y1,
						y2: y2
					});

				})
				//click event on $el
				.on('click', function(e){
					//routine
					e.preventDefault();
					e.stopPropagation();

					//check if the endpoint menu is shown. if yes, close the menu by using coop event.
					if(that.parentCt.endpointMenuShown){
						that.coop('close-endpoint-menu');
						return;
					}
					
					//
					if(that.magneted){
						if(that.horizontal){
							that.$el.find('.horizontal-line').trigger('click');
							that.magneted = false;
						}else{
							that.$el.find('.vertical-line').trigger('click');
							that.magneted = false;
						}
						return;
					}
						
				});
			}

		},
		actions: {
		//	submit: function(){...},
		//	dosomething: function(){...},
		//	...
		},

		//---------------------------------------- helper functions ----------------------------------------//
		
		//====================== structure related functions ======================//
		//function for setting up guide lines
		setupGuideLines: function(positions, e){
			//get dimension of the canvas
			var width = this.$el.width(),
				height = this.$el.height(),
				that = this,
				limits = this.guideLineConstrain({
					x: (positions.x / width * 100),
					y: (positions.y / height * 100)
				}),
				magnet = this.guideLineMagnet({
					x: (positions.x / width * 100),
					y: (positions.y / height * 100)
				}, e);

			if(this.horizontal){//horizontal line

				//need to stay out of the 2em of any line
				if(this.guideLineTooClose(positions))//too close, park the horizontal line
					this.paper.d3.selectAll('.horizontal-line')
									.attr('d', 'M0 -5l' + 0 + ' -5');

				else if(magnet){
						this.magneted = true;
						this.paper.d3.selectAll('.horizontal-line')
								.attr('d', 'M' + parseInt(limits.min / 100 * width) + ' ' + magnet.y + 'L' + parseInt(limits.max / 100 * width) + ' ' + magnet.y);
					}
				
				else 
					this.paper.d3.selectAll('.horizontal-line')
								.attr('d', 'M' + parseInt(limits.min / 100 * width) + ' ' + positions.y + 'L' + parseInt(limits.max / 100 * width) + ' ' + positions.y);

			}else{//vertical line

				if(this.guideLineTooClose(positions))//too close, park the vertical line
					this.paper.d3.selectAll('.vertical-line')
									.attr('d', 'M-5 0l-5 ' + 0);

				else if(magnet){
					this.magneted = true; //for click event after magnet
					this.paper.d3.selectAll('.vertical-line')
							.attr('d', 'M' + magnet.x + ' ' + parseInt(limits.min / 100 * height) + 'L' + magnet.x + ' ' + parseInt(limits.max / 100 * height));
				}

				else
					this.paper.d3.selectAll('.vertical-line')
							.attr('d', 'M' + positions.x + ' ' + parseInt(limits.min / 100 * height) + 'L' + positions.x + ' ' + parseInt(limits.max / 100 * height));

			}

		},

		//function for setup length/height of the guide line based on mouse position
		guideLineConstrain: function(positions){
			var obj = {},
				that = this;

			if(this.horizontal){//horizontal line

				obj.min = _.filter(app._global['vertical-line'], function(coords){
					if(positions.y <= coords.y2 && positions.y >= coords.y1 && coords.x <= positions.x)
						return true;
					else
						return false;
				}).pop().x;

				obj.max = _.filter(app._global['vertical-line'], function(coords){
					if(positions.y <= coords.y2 && positions.y >= coords.y1 && coords.x > positions.x)
						return true;
					else
						return false;
				}).shift().x;

			}else{//vertical line

				obj.min = _.filter(app._global['horizontal-line'], function(coords){
					if(positions.x <= coords.x2 && positions.x >= coords.x1 && coords.y <= positions.y)
						return true;
					else
						return false;
				}).pop().y;

				obj.max = _.filter(app._global['horizontal-line'], function(coords){
					if(positions.x <= coords.x2 && positions.x >= coords.x1 && coords.y > positions.y)
						return true;
					else
						return false;
				}).shift().y;

			}

			return obj;
		},

		//function for checking whether guide line is too close(within 2em) to any existing layout lines
		guideLineTooClose: function(positions){
			//keep a 2em gap
			var horizontal = this.horizontal, //get now doing horizontal line or vertical line
				em = horizontal ? (parseFloat(getComputedStyle(document.body).fontSize)) / this.$el.height() * 100
								: (parseFloat(getComputedStyle(document.body).fontSize)) / this.$el.width() * 100, //get default em and translate it into percentage
				tooClose = false,
				yPer = positions.y / this.$el.height() * 100,
				xPer = positions.x / this.$el.width() * 100;


			if(horizontal){//horizontal lines
				//check
				_.each(app._global['horizontal-line'], function(hline){
					if(xPer <= hline.x2 && xPer >= hline.x1 && yPer >= hline.y - 2 * em && yPer <= hline.y + 2 * em)
						tooClose = true;
				});

			}else{//vertical lines
				_.each(app._global['vertical-line'], function(vline){
					if(yPer <= vline.y2 && yPer >= vline.y1 && xPer >= vline.x - 2 * em && xPer <= vline.x + 2 * em)
						tooClose = true;
				});
			}

			return tooClose;
		},

		//function to handle magnet effect
		guideLineMagnet: function(positions, e){
			//magnet effect within 1em radius to a certain point
			var x,y, distance,
				em = this.horizontal ? (parseFloat(getComputedStyle(document.body).fontSize)) / this.$el.height() * 100
								: (parseFloat(getComputedStyle(document.body).fontSize)) / this.$el.width() * 100, //get default em and translate it into percentage
				that = this;

			_.each(app._global.endPoints, function(endPoint, id){

				//calculate distance
				distance = that.horizontal ? Math.abs(endPoint.y - positions.y) : Math.abs(endPoint.x - positions.x);
				//if less than 1 em assign new x, y for return
				if(distance < 1 * em){
					if(that.horizontal){
						x = e.offsetX;
						y = endPoint.y / 100 * that.$el.height();
					}else{
						x = endPoint.x / 100 * that.$el.width();
						y = e.offsetY;
					}
				}
			});

			if(x && y) 
				return {x: x, y: y};//returns an object differs from return a boolean, though truely.
			else
				return false;
		},

		//generate a new line and add it to the global collection
		genLine: function(direction, coords, adjcents, preid/*pre-defined id, for easier collorating between end points and lines*/){
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
				obj.id = preid ? preid : _.uniqueId('horizontal-' + app._global.generation + '-');
				//push into collection
				app._global['horizontal-line'].push(obj);
				//re-sort the collection
				app._global['horizontal-line'] = _.sortBy(app._global['horizontal-line'], function(coords){
					return coords.y;
				});

			}else{//vertical line
				//gen id
				obj.id = preid ? preid : _.uniqueId('vertical-' + app._global.generation + '-');
				//push into collection
				app._global['vertical-line'].push(obj);
				//re-sort the collection
				app._global['vertical-line'] = _.sortBy(app._global['vertical-line'], function(coords){
					return coords.x;
				});
			}

			return obj.id;
		},

		//generate new point and add to global collection
		genPoint: function(x, y, adjcents, preid/*pre-defined id*/){
			var obj = {}, id = preid ? preid : _.uniqueId('endPoint-' + app._global.generation + '-');

			obj.x = x;
			obj.y = y;
			obj.id = id; //save a copy of its own id

			if(adjcents)
				_.each(adjcents, function(id, position){
					obj[position] = id;
				});

			app._global.endPoints[id] = obj;

			//sync local storage
			this.coop('sync-local');
			
			//return id for easier querying
			return id;
		},

		//onclick with horizontal/vertical guide, adda a newline based 
		addLine: function(coords){
			var $horizontal = this.$el.find('.horizontal-line'),
				$vertical = this.$el.find('.vertical-line'),
				width = this.$el.width(),
				height = this.$el.height();

			//variables for later use
			var x1, x2, y1, y2,
				newStartPoint, newEndPoint,
				occupied, oldLine,
				tolerance = app._global.tolerance;

			if(this.horizontal){//horizontal line
				//Caveat: check 0, since 0 is falsy. assign 0.01 to 0. since tolerance is 0.5.
				x1 = ((coords && coords.x1 === 0) ? 0.01 : (coords && coords.x1)) || trimNumber(parseInt($horizontal.css('left')) / this.$el.width() * 100); //raphael only takes number. therefore parseInt
				x2 = (coords && coords.x2) ||  trimNumber((parseInt($horizontal.css('left')) + $horizontal.width()) / this.$el.width() * 100);
				y1 = y2 = ((coords && coords.y === 0) ? 0.01 : (coords && coords.y)) || trimNumber(parseInt($horizontal.css('top')) / this.$el.height() * 100);

				//first check whether there is a point already at those coordinates
				occupied = this.checkOccupied({x1: x1, y1: y1, x2: x2, y2: y2}, tolerance);

				//generate new line id here for easier reference
				newLineId = _.uniqueId('horizontal-' + app._global.generation + '-');

				//left endPoint
				if(occupied.occupiedStart){
					//set right pointer to the new horizontal line
					occupied.occupiedStart.endPoint.right = newLineId;
					//refer start point to the occupied point
					newStartPoint = occupied.occupiedStart.id;

				}else{
					//find out it should attach to which vertical line
					oldLine = _.find(app._global['vertical-line'], function(vline){ return vline.x >= (x1 - tolerance) && vline.x <= (x1 + tolerance) && y1 < vline.y2 && y1 > vline.y1; });
					//!!Note: there should not be a horizontal line attached to the left of this new point.
					//!!Otherwise there should already be a point there.
					
					newStartPoint = this.breakLine('h', oldLine, {x: x1, y: y1}, newLineId, true);
				}
				//right endPoint
				if(occupied.occupiedEnd){
					//set left pointer to the new horizontal line
					occupied.occupiedEnd.endPoint.left = newLineId;
					//refer end point to the end point
					newEndPoint = occupied.occupiedEnd.id;

				}else{
					//find out which line needs to be replaced
					oldLine = _.find(app._global['vertical-line'], function(vline){ return vline.x >= (x2 - tolerance) && vline.x <= (x2 + tolerance) && y1 < vline.y2 && y1 > vline.y1; });

					newEndPoint = this.breakLine('h', oldLine, {x: x2, y: y2}, newLineId);
				}
				
				//generate the new line to insert
				this.genLine('h', {x1: x1, x2: x2, y: y1}, {
					left: newStartPoint,
					right: newEndPoint
				}, newLineId);
			}
			else{//vertical line
				//Caveat: check 0, since 0 is falsy. assign 0.01 to 0. since tolerance is 0.5.
				x1 = x2 = ((coords && coords.x === 0) ? 0.1 : (coords && coords.x)) || trimNumber(parseInt($vertical.css('left')) / this.$el.width() * 100);
				y1 = ((coords && coords.y1 === 0) ? 0.1 : (coords && coords.y1)) || trimNumber(parseInt($vertical.css('top')) / this.$el.height() * 100);
				y2 = (coords && coords.y2) || trimNumber((parseInt($vertical.css('top')) + $vertical.height()) / this.$el.height() * 100);

				//check occupation
				occupied = this.checkOccupied({x1: x1, y1: y1, x2: x2, y2: y2}, tolerance);

				//generate new line id here for easier reference
				newLineId = _.uniqueId('vertical-' + app._global.generation + '-');

				//top end point
				if(occupied.occupiedStart){
					//set bottom pointer to the new vertical line
					occupied.occupiedStart.endPoint.bottom = newLineId;
					//set start reference to the occupied point
					newStartPoint = occupied.occupiedStart.id;
				}else{
					//find out it should attach to which vertical line
					oldLine = _.find(app._global['horizontal-line'], function(hline){ return hline.y >= (y1 - tolerance) && hline.y <= (y1 + tolerance) && x1 < hline.x2 && x1 > hline.x1; });
					//break line
					newStartPoint = this.breakLine('v', oldLine, {x: x1, y: y1}, newLineId, true);
				}

				//bottom end point
				if(occupied.occupiedEnd){
					//set top pointer to the new vertical line
					occupied.occupiedEnd.endPoint.top = newLineId;
					//set end reference to the occupied point
					newEndPoint = occupied.occupiedEnd.id;
				}else{
					//find out it should attach to which vertical line
					oldLine = _.find(app._global['horizontal-line'], function(hline){ return hline.y >= (y2 - tolerance) && hline.y <= (y2 + tolerance) && x1 < hline.x2 && x1 > hline.x1; });
					//break line
					newEndPoint = this.breakLine('v', oldLine, {x: x2, y: y2}, newLineId);
				}
				

				//add new vertical line
				this.genLine('v', {y1: y1, y2: y2, x: x1}, {
					top: newStartPoint,
					bottom: newEndPoint
				}, newLineId);
			}
			//for debugging, log all the existing lines
			app.debug('horizontal-line', app._global['horizontal-line']);
			app.debug('vertical-line', app._global['vertical-line']);
			app.debug('end-points', app._global.endPoints);
			
			//sync local storage
			this.coop('sync-local');
			
			//need to redrawAll() here to avoid duplicated points
			//simply draw a new line here does not work
			this.redrawAll();
		},

		//check whether there is already end points at the position the new line needs to be installed
		checkOccupied: function(coords/*x1,y1 as first point and x2,y2 as second point*/, tolerance){
			var occupiedStart, occupiedEnd;

			//check
			_.each(app._global.endPoints, function(endPoint, id){
				if(coords.x1 <= (endPoint.x + tolerance) && coords.x1 >= (endPoint.x - tolerance) && coords.y1 <= (endPoint.y + tolerance) && coords.y1 >= (endPoint.y - tolerance))
					occupiedStart = {endPoint: endPoint, id: id};
				else if(coords.x2 <= (endPoint.x + tolerance) && coords.x2 >= (endPoint.x - tolerance) && coords.y2 <= (endPoint.y + tolerance) && coords.y2 >= (endPoint.y - tolerance))
					occupiedEnd = {endPoint: endPoint, id: id};
			});

			//return as an object
			return {
				occupiedStart: occupiedStart,
				occupiedEnd: occupiedEnd
			};
		},

		//break a single segment into two
		breakLine: function(insertDir, oldLine/*the line that needs to be broken*/, coords/*coordinates for the new point*/, newLineId, start/*bool, indicate first or second point on the inserting line*/){
			
			var newPointId = _.uniqueId('endPoint-' + app._global.generation + '-'), 
				newStartLine, newEndLine;

			if(insertDir === 'h'){//inserting horizontal line

				//now break the vertical line into two shorter vertical line
				//add two newLines
				newStartLine = this.genLine('v', {y1: oldLine.y1, y2: coords.y, x: coords.x}, {
					top: oldLine.top,
					bottom: newPointId
				});

				newEndLine = this.genLine('v', {y1: coords.y, y2: oldLine.y2, x: coords.x}, {
					top: newPointId,
					bottom: oldLine.bottom
				});

				//update oldLine's top-endPoint's bottom pointer and bottom-endPoint's top pointer
				app._global.endPoints[oldLine.top].bottom = newStartLine;
				app._global.endPoints[oldLine.bottom].top = newEndLine;
				//delete the original line from collection
				app._global['vertical-line'] = _.without(app._global['vertical-line'], _.find(app._global['vertical-line'], function(vline){ return vline.id === oldLine.id; }));

				//add new endPoint
				start ? this.genPoint(coords.x, coords.y, { right: newLineId, top: newStartLine, bottom: newEndLine}, newPointId) 
						: this.genPoint(coords.x, coords.y, { left: newLineId, top: newStartLine, bottom: newEndLine}, newPointId);
				
			}else{//inserting vertical line

				//add two lines
				newStartLine = this.genLine('h', {x1: oldLine.x1, x2: coords.x, y: coords.y}, {
					left: oldLine.left,
					right: newPointId
				});

				newEndLine = this.genLine('h', {x1: coords.x, x2: oldLine.x2, y: coords.y}, {
					left: newPointId,
					right: oldLine.right
				});

				//update oldLine's left-endPoint's right pointer and right-endPoint's left pointer
				app._global.endPoints[oldLine.left].right = newStartLine;
				app._global.endPoints[oldLine.right].left = newEndLine;

				//delete the original line from collection
				app._global['horizontal-line'] = _.without(app._global['horizontal-line'], _.find(app._global['horizontal-line'], function(hline){ return hline.id === oldLine.id; }));

				//add new endPoint
				start ? this.genPoint(coords.x, coords.y, { bottom: newLineId, left: newStartLine, right: newEndLine}, newPointId) 
						: this.genPoint(coords.x, coords.y, { top: newLineId, left: newStartLine, right: newEndLine}, newPointId);
			}

			return newPointId;
		},

		//function for checking moving contrain within 2em of 
		checkMovingConstrain: function(id/*point id*/){
			//fetch the point
			var point = app._global.endPoints[id],
				directions = ['left', 'right', 'top', 'bottom'],
				vem = (parseFloat(getComputedStyle(document.body).fontSize)) / this.$el.height() * 100,
				hem = (parseFloat(getComputedStyle(document.body).fontSize)) / this.$el.width() * 100,
				temp;

			var limits = {
				xmin : 2 * hem, xmax: 100 - 2 * hem, ymin: 2 * vem, ymax: 100 - 2 * vem
			};//store all the limits

			var extensions = {
				left: 0, right: 0, top: 0, bottom: 0,
				hlines: [],//store all the horizontal lines controlled by this point
				vlines: [],//store all the vertical lines controlled by this point
				endPoints: []//store all the end points controlled by this point
			};
			
			//check the extension limit of each direction
			_.each(directions, function(direction){
				var orientation = (direction === 'left' || direction === 'right') ? 'h' : 'v', tempLine;

				temp = point;
				if(!_.contains(extensions.endPoints, temp.id))
					extensions.endPoints.push(temp.id);//store the point

				//trace down the last point in this direction
				while(temp[direction]){
					//fetch next line
					tempLine = _.find(app._global[(orientation === 'h') ? 'horizontal-line' : 'vertical-line'], function(line){ return line.id === temp[direction] });
					//store line walked through
					(orientation === 'h') ? extensions.hlines.push(tempLine.id) : extensions.vlines.push(tempLine.id);
					//get next point
					temp = app._global.endPoints[tempLine[direction]];
					//store next point
					extensions.endPoints.push(temp.id);
				}

				switch(direction){
					case 'left':
						extensions.left = temp.x;
					break;
					case 'right':
						extensions.right = temp.x;
					break;
					case 'top':
						extensions.top = temp.y;
					break;
					case 'bottom':
						extensions.bottom = temp.y;
					break;
				}
			});

			//now we have extension limits, check with horizontal and vertical collections to setup the real limit
			//horizontal
			_.each(app._global['horizontal-line'], function(hline){
				if(
					!_.contains(extensions.hlines, hline.id) &&
					(
						(hline.x1 < (extensions.right + app._global.tolerance) && hline.x1 > (extensions.left - app._global.tolerance)) ||
						(hline.x2 < (extensions.right  + app._global.tolerance) && hline.x2 > (extensions.left - app._global.tolerance))
					)
				){
					if(hline.y <= (point.y + app._global.tolerance)){//ymin
						temp = hline.y + 2 * vem;
						if(temp > limits.ymin)
							limits.ymin = temp;
					}

					else if(hline.y >= (point.y - app._global.tolerance)){//ymax
						temp = hline.y - 2 * vem;
						if(temp < limits.ymax)
							limits.ymax = temp;
					}
				}
			});

			//vertical
			_.each(app._global['vertical-line'], function(vline){
				if(	
					!_.contains(extensions.vlines, vline.id) &&
					(
						(vline.y1 < (extensions.bottom + app._global.tolerance) && vline.y1 > (extensions.top - app._global.tolerance)) ||
						(vline.y2 < (extensions.bottom + app._global.tolerance) && vline.y2 > (extensions.top - app._global.tolerance))
					)

				){
					if(vline.x <= (point.x + app._global.tolerance)){//xmin
						temp = vline.x + 2 * hem;
						if(temp > limits.xmin)
							limits.xmin = temp;
					}

					else if(vline.x >= (point.x - app._global.tolerance)){//xmax
						temp = vline.x - 2 * hem;
						if(temp < limits.xmax)
							limits.xmax = temp;
					}
				}
			});

			return {
				limits: limits,
				hlines: extensions.hlines,
				vlines: extensions.vlines,
				endPoints: extensions.endPoints
			};
		},

		//====================== drawing related functions ======================//
		//function to redraw all lines based on global object, mainly used for window resize event
		redrawAll: function(){
			var that = this,
				width = this.$el.width(),
				height = this.$el.height();

			//clean old lines
			this.paper.clear();

			//draw horizontal lines
			_.each(app._global['horizontal-line'], function(coords, index){
				var x1 = that.calSvgCoord(coords.x1, true),
					x2 = that.calSvgCoord(coords.x2, true),
					y = that.calSvgCoord(coords.y);

				that.drawPath('M' + x1 + ' ' + y + 'L' + x2 + ' ' + y);
			});

			//draw vertical lines
			_.each(app._global['vertical-line'], function(coords, index){
				var y1 = that.calSvgCoord(coords.y1),
					y2 = that.calSvgCoord(coords.y2),
					x = that.calSvgCoord(coords.x, true);

				that.drawPath('M' + x + ' ' + y1 + 'L' + x + ' ' + y2);
			});

			//draw all the points
			_.each(app._global.endPoints, function(endPoint, id){
				var x = that.calSvgCoord(endPoint.x, true),
					y = that.calSvgCoord(endPoint.y);

				var circle = that.drawCircle(x, y);
				that.addPointAttr(circle.node, id);
			});

			//draw two initial guide lines
			//horizontal
			this.paper.d3.append('path')
						.attr('d', 'M0 -5l' + width + ' -5')
						.attr('class', 'horizontal-line')
						.on();
			//vertical
			this.paper.d3.append('path')
						.attr('d', 'M-5 0l-5 ' + height)
						.attr('class', 'vertical-line');
		},

		//calculate coordniates from percentage to pixels
		calSvgCoord: function(coord, w/*width*/){
			var height = this.$el.height(),
				width = this.$el.width();

			if(w)
				return coord / 100 * width;
			else
				return coord / 100 * height;
		},

		//function for drawing path
		drawPath: function(path, cal){
			var p;

			if(!cal)//do not need additional calculation, here path passed in as a string
				p = this.paper.path(path);

			else //here path passed in as an object({x1, y1, x2, y2}) with coordinates(percetange) in it, need to calculate to px
				p = this.paper.path('M' + this.calSvgCoord(path.x1, true) + ' ' + this.calSvgCoord(path.y1) + 'L' + this.calSvgCoord(path.x2, true) + ' ' + this.calSvgCoord(path.y2));

			$(p.node).attr('class', 'layout-line');

			return p;
		},

		//function for draw circles, cal === true means coordx and coordy are in percentage, which needs to be transferred into pixels
		drawCircle: function(coordx, coordy, cal){
			var x, y;
			
			if(cal){//need to transfer into px

				x = this.calSvgCoord(coordx, true);
				y = this.calSvgCoord(coordy);

			}else{

				x = coordx;
				y = coordy;

			}

			//draw circle on paper
			//inner circle, draw first, so it will be at lower index than outter circle, which has events on it.
			var inner = this.paper.circle(x, y, this.radius - 2).attr({'stroke-width':'none', 'fill': '#000'});
			$(inner.node).attr('class', 'end-point-inner');
			//outer circle
			var circle = this.paper.circle(x, y, this.radius).attr({'stroke' : '#DEDEDE', 'stroke-width':'2', 'fill': 'rgba(0, 0, 0, 0)'});
			return circle;
		},

		//add attributes to endpoints
		addPointAttr: function(node, id){
			var that = this;
			//
			var $node = $(node),
				$el = that.$el; //register on $el, not body anymore.

			//jquery2 cannot use addClass on SVG element
			node.setAttribute('class', 'end-point draggble');
			node.setAttribute('point-id', id);

			//Caveat: add events here! 
			//Do not register global event, it will be cleaned after redraw event.

			$node.one('click', function(e){
				that.endpointClickCallback(e, $node);
			});

			$node.one('mousedown', function(e){
				that.mousedownCallback(e, $node, $el);
			});
		},

		//function handles click event on endpoints
		endpointClickCallback: function(e){
			var that = this;

			//routine
			e.preventDefault();
			e.stopPropagation();

			that.coop('endpoint-clicked', e);

			$(e.target)
			.one('click', function(ev){
				that.endpointClickCallback(ev);
			})
			.one('mousedown', function(ev){
				//callback function
				that.mousedownCallback(ev, $(ev.target), that.$el);
			});
		},

		//function handles mousedown on endpoints
		mousedownCallback: function(e, $node, $body){

			//routine
			e.preventDefault();
			//e.stopPropagation();

			//save original point object
			var $point = $(e.target);
			
			var that = this,
				id = $node.attr('point-id');

			//set dragging flag true
			this.dragging = true;

			var constrains = this.checkDraggingConstrain(id),
				originalCoords = {
					x: app._global.endPoints[id].x,
					y: app._global.endPoints[id].y
				};

			//check whether if the nodes are on the frame
			if(
				originalCoords.x < 0 + app._global.tolerance || originalCoords.x > 100 - app._global.tolerance ||
				originalCoords.y < 0 + app._global.tolerance || originalCoords.y > 100 - app._global.tolerance
			){
				//send notification
				app.notify('Cannot be Operated', 'End points on outter frame cannot be operated! Choose inside end points inside!', 'error', {icon: 'fa fa-reddit-alien'});
				//set dragging false
				this.dragging = false;
				//return
				return;
			}

			//use body as the mousemove view port
			var updateLayoutSVG = function(e){
				//check constrains
				var hPer = e.offsetX / that.$el.width() * 100,
					vPer = e.offsetY / that.$el.height() * 100;

				//totally inside boundary
				if(hPer > constrains.limits.xmin && hPer < constrains.limits.xmax && vPer > constrains.limits.ymin && vPer < constrains.limits.ymax){
					//update all related lines and end points
					that.updateRelated(constrains.hlines, constrains.vlines, constrains.endPoints, e, $node.attr('point-id'), originalCoords, {x: true, y: true});
				}
				//only x inside boundary
				else if(hPer > constrains.limits.xmin && hPer < constrains.limits.xmax && (vPer < constrains.limits.ymin || vPer > constrains.limits.ymax)){
					//update all related lines and end points
					that.updateRelated(constrains.hlines, constrains.vlines, constrains.endPoints, e, $node.attr('point-id'), originalCoords, {x: true, y: false});
				}
				//only y inside boundary
				else if((hPer < constrains.limits.xmin || hPer > constrains.limits.xmax) && vPer > constrains.limits.ymin && vPer < constrains.limits.ymax){
					//update all related lines and end points
					that.updateRelated(constrains.hlines, constrains.vlines, constrains.endPoints, e, $node.attr('point-id'), originalCoords, {x: false, y: true});
				}
			};
			
			//!!trigger coop event to update generated view
			var updateGeneratedViewLayout = app.debounce(function(){
				//trigger coop event to re-generate layout and views
				that.coop('layout-adjusted', $point);
			});
			
			$body
			.on('mousemove', function(e){
				//prevent default
				e.preventDefault();

				//unbind original click event and mousedown event,
				//unbind click until mousemove to avoid mousedown and click event conflict
				$node.unbind('click').unbind('mousedown');

				updateLayoutSVG(e);
				//updateGeneratedViewLayout();
				
			})
			.one('mouseup', function(e){
				//routine
				e.preventDefault();
				e.stopPropagation();

				//unbind mousemove event on body
				$body.unbind('mousemove');
				//reset dragging flag to false
				that.dragging = false;
				//mouseup has a bit delay. use defer to register click and mousedown event on node again
				_.defer(function(){
					//click
					$node.one('click', function(event){
						that.endpointClickCallback(event, $node);
					});
					//mousedown
					$node.one('mousedown', function(event){
						that.mousedownCallback(event, $node, $body);
					});
				});
			});
		},

		//function check mouse dragging constrain on endpoints
		checkDraggingConstrain: function(id/*point id*/){
			//fetch the point
			var point = app._global.endPoints[id],
				directions = ['left', 'right', 'top', 'bottom'],
				vem = (parseFloat(getComputedStyle(document.body).fontSize)) / this.$el.height() * 100,
				hem = (parseFloat(getComputedStyle(document.body).fontSize)) / this.$el.width() * 100,
				temp;

			var limits = {
				xmin : 2 * hem, xmax: 100 - 2 * hem, ymin: 2 * vem, ymax: 100 - 2 * vem
			};//store all the limits

			var extensions = {
				left: 0, right: 0, top: 0, bottom: 0,
				hlines: [],//store all the horizontal lines controlled by this point
				vlines: [],//store all the vertical lines controlled by this point
				endPoints: []//store all the end points controlled by this point
			};
			
			//check the extension limit of each direction
			_.each(directions, function(direction){
				var orientation = (direction === 'left' || direction === 'right') ? 'h' : 'v', tempLine;

				temp = point;
				if(!_.contains(extensions.endPoints, temp.id))
					extensions.endPoints.push(temp.id);//store the point

				//trace down the last point in this direction
				while(temp[direction]){
					//fetch next line
					tempLine = _.find(app._global[(orientation === 'h') ? 'horizontal-line' : 'vertical-line'], function(line){ return line.id === temp[direction] });
					//store line walked through
					(orientation === 'h') ? extensions.hlines.push(tempLine.id) : extensions.vlines.push(tempLine.id);
					//get next point
					temp = app._global.endPoints[tempLine[direction]];
					//store next point
					extensions.endPoints.push(temp.id);
				}

				switch(direction){
					case 'left':
						extensions.left = temp.x;
					break;
					case 'right':
						extensions.right = temp.x;
					break;
					case 'top':
						extensions.top = temp.y;
					break;
					case 'bottom':
						extensions.bottom = temp.y;
					break;
				}
			});

			//now we have extension limits, check with horizontal and vertical collections to setup the real limit
			//horizontal
			_.each(app._global['horizontal-line'], function(hline){
				if(
					!_.contains(extensions.hlines, hline.id) &&
					(
						(hline.x1 < (extensions.right + app._global.tolerance) && hline.x1 > (extensions.left - app._global.tolerance)) ||
						(hline.x2 < (extensions.right  + app._global.tolerance) && hline.x2 > (extensions.left - app._global.tolerance))
					)
				){
					if(hline.y <= (point.y + app._global.tolerance)){//ymin
						temp = hline.y + 2 * vem;
						if(temp > limits.ymin)
							limits.ymin = temp;
					}

					else if(hline.y >= (point.y - app._global.tolerance)){//ymax
						temp = hline.y - 2 * vem;
						if(temp < limits.ymax)
							limits.ymax = temp;
					}
				}
			});

			//vertical
			_.each(app._global['vertical-line'], function(vline){
				if(	
					!_.contains(extensions.vlines, vline.id) &&
					(
						(vline.y1 < (extensions.bottom + app._global.tolerance) && vline.y1 > (extensions.top - app._global.tolerance)) ||
						(vline.y2 < (extensions.bottom + app._global.tolerance) && vline.y2 > (extensions.top - app._global.tolerance))
					)

				){
					if(vline.x <= (point.x + app._global.tolerance)){//xmin
						temp = vline.x + 2 * hem;
						if(temp > limits.xmin)
							limits.xmin = temp;
					}

					else if(vline.x >= (point.x - app._global.tolerance)){//xmax
						temp = vline.x - 2 * hem;
						if(temp < limits.xmax)
							limits.xmax = temp;
					}
				}
			});

			return {
				limits: limits,
				hlines: extensions.hlines,
				vlines: extensions.vlines,
				endPoints: extensions.endPoints
			};
		},

		//update related lines and points when dragging an endpoint
		updateRelated: function(hlines, vlines, points, event, anchorId, originalCoords, direction){
			var height = this.$el.height(),
				width = this.$el.width();

			//update horizontal lines
			if(direction.y)
				_.each(hlines, function(id){
					var line = _.find(app._global['horizontal-line'], function(hline){ return hline.id === id; }),
						yCoord = trimNumber(event.offsetY / height * 100);
					//update line itself
					line.y = yCoord;
					//update its end points
					//left
					app._global.endPoints[line.left].y = yCoord;
					//right
					app._global.endPoints[line.right].y = yCoord;
				});

			//update vertical lines
			if(direction.x)
				_.each(vlines, function(id){
					var line = _.find(app._global['vertical-line'], function(vline){ return vline.id === id; }),
						xCoord = trimNumber(event.offsetX / width * 100);
					//update line tiself
					line.x = xCoord;
					//update its end points
					//top
					app._global.endPoints[line.top].x = xCoord;
					//bottom
					app._global.endPoints[line.bottom].x = xCoord;
				});

			//update length of lines that connected to the related points
			_.each(points, function(pointId){
				var point = app._global.endPoints[pointId],
					line;
				//top line
				if(point.top){
					line = _.find(app._global['vertical-line'], function(vline){ return vline.id === point.top; });
					line.y2 = point.y;
				}

				//bottom line
				if(point.bottom){
					line = _.find(app._global['vertical-line'], function(vline){ return vline.id === point.bottom; });
					line.y1 = point.y;
				}

				//left line
				if(point.left){
					line = _.find(app._global['horizontal-line'], function(hline){ return hline.id === point.left; });
					line.x2 = point.x;
				}

				if(point.right){
					line = _.find(app._global['horizontal-line'], function(hline){ return hline.id === point.right; });
					line.x1 = point.x;
				}

			});

			//update points in the local storage
			this.coop('sync-local');

			//redraw all the lines
			this.redrawAll();
		},

		//---------------------------------------- functions to handle coop event ----------------------------------------//

	});

	//trim number only leave two digits after decimal point
	function trimNumber(number){
		return parseFloat(number.toFixed(2));
	}

})(Application);