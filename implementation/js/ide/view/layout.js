/**
 * Sample VIEW script.
 *
 * @author Stagejs.CLI
 * @created Wed May 17 2017 18:16:07 GMT-0700 (PDT)
 */
;(function(app){

	app.view('Layout', {

		template: '@view/ide/layout.html',
		//[editors]: {...},
		coop: [
			'point-layout-reset-confirmed' //user confirm to delete a line attaches to a certain point
		],
		initialize: function(){
			//indicate whether endpoint menu is current being shown or not
			this.endpointMenuShown = false;

			//indicate whether it is outline only
			this.outlineOnly = false;
		},
		onReady: function(){

		},
		onNavigateTo: function(path){
			var that = this;
			//remind the name for this view
			this.editingViewName = path.slice().pop();

			app.remote({
				url: '/api/getViewList',
				async: false,
			}).done(function(data){
				that.show('menu', 'LayoutEditMenu', {
					data: {
						items: data,
						layout: true,
						method: 'layout',
						viewName: that.editingViewName
					},
				});

				//check if loading view is from backend
				if(_.contains(data, that.editingViewName)){
					//initialize app._global
					that.initializeGlobal({});

					//flip the outlineOnly flag
					that.outlineOnly = true;

					//show mesh only for first layer region outlines
					that.show('mesh', 'Layout.Mesh', {
						data: {
							'outline-only': true
						}
					}).once('ready', function(){
						//dipict first layer regions
						that.show('preview', that.editingViewName).once('ready', function(){
							that.genLayoutFromTemplate(that.getViewIn('preview'));
						});
					});
					
				}else {
					//show the view preview first, in order to pick up html and size
					that.show('preview', that.editingViewName);

					//checkout local storage for the loading view
					/**
					 * check whether viewName in __current__ is same as loading view
					 * 		if yes, honor current	
					 * 	 	if not, clean __current__ and honor loading view config in __layouts__ if exists
					 */
					
					var layouts = app.store.get('__layouts__'),
						current = app.store.get('__current__');
					
					if(current.viewName === that.editingViewName){
						//honor __current__
						that.initializeGlobal(current);
					}else{
						//honor __layouts__
						if(layouts[that.editingViewName]){
							//clear __current__ in cache
							app.store.remove('__current__');
							app.store.set('__current__', {});
							//honor config inside __layouts__
							that.initializeGlobal(layouts[that.editingViewName]);
						}
						else{
							//initialize app._global
							that.initializeGlobal({});
						}
					}

					//show the mesh grids
					that.show('mesh', 'Layout.Mesh');
				}
			});
		},
		actions: {
			//action to delete a line in certain direction of an endpoint
			'delete-line': function($self){
				//if the line is deletable
				if($self.find('i').hasClass('deletable')){
					
					(new (app.get('Overlay.LayoutResetConfirm'))({
						data: {
							anchor: $self
						}
					})).overlay({
						effect: false,
						class: 'confirm-overlay warning-title',
					});
					
				}else{//NOT deletable
					app.notify('Cannot Delete', 'This line cannot be deleted!', 'error', {icon: 'fa fa-reddit-alien'});
				}
			},
		},

		//========================================== coop event handlers ==========================================//
		
		//open menu when clicked on endpoints
		onEndpointClicked: function(e){
			//call function:endpointClicked to handle this coop event
			this.endpointClicked(e);
		},
		
		//close endpoint menu
		onCloseEndpointMenu: function(){
			this.closeMenu();
		},

		//user confirm to delete a certain line attached to a certain point
		onPointLayoutResetConfirmed: function($anchor){
			//delete line
			this.deleteLine($anchor.data('direction'));

			//sync local storage data
			this.syncLocal();
		},

		//function to handle local storage syncing
		onSyncLocal: function(){
			this.syncLocal();
		},

		//function to handle saving current view layout configurations into cache
		onSaveLayout: function(){
			//stored object`
			var stored = app.store.get('__layouts__');

			//modified stored[that.editingViewName]
			stored[this.editingViewName] = app._global;

			//save it to cache with a deep copy, avoid werid issue
			app.store.set('__layouts__', _.deepClone(stored));

			//show notification
			app.notify('Success!', 'Layout configuration has been saved.', 'ok', {icon: 'fa fa-fort-awesome'});

		},

		//========================================== helper functions ==========================================//
		
		//functions to initialize app._global
		initializeGlobal: function(obj){
			//create a global object to store points, horizontal lines and vertical lines
			app._global.endPoints = obj.endPoints || {};
			app._global['vertical-line'] = obj['vertical-line'] || [];
			app._global['horizontal-line'] = obj['horizontal-line'] || [];
		},

		//function to sync __current__ local storage
		syncLocal: function(){//alias for the coop function, to be used in this view
			var current = {
				endPoints: app._global.endPoints,
				'horizontal-line': app._global['horizontal-line'],
				'vertical-line': app._global['vertical-line'],
				viewName: this.editingViewName //keep a reference for later comparison on loading
			};
			
			//remove old
			app.store.remove('__current__');

			//save current
			app.store.set('__current__', _.deepClone(current));
		},

		//function to generate initial regions from a backend loaded view
		genLayoutFromTemplate: function(viewInstance){
			var previewLeft = viewInstance.$el.offset().left,
				previewTop = viewInstance.$el.offset().top,
				that = this;

			//get all first layer regions
			_.each(viewInstance.$el.find('div.region'), function(el, index){
				var $el = $(el), $parent = $el.parent(), firstLayer = true, top, left, width, height;

				//trace every div with region tags, to see if any of its parents has class region
				//if yes, then it is NOT a first layer region.
				//if not, then it is a first layer region
				while(!$parent.hasClass('region-preview')){
					//not firstLayer
					if($parent.hasClass('region')){
						firstLayer = false;
						break;
					}else{//continue trace
						$parent = $parent.parent();
					}
				}

				//view from backend do not have layout, only mark the first layer regions
				if(firstLayer){
					top = $el.offset().top - previewTop;
					left = $el.offset().left - previewLeft;
					height = $el.height();
					width = $el.width();

					//draw a dashed path surrounding current div
					that.getViewIn('mesh').drawPath('M' + left + ' ' + top + 'l' + width + ' 0l0 ' + height + 'l' + (-width) + ' 0l0 ' + - (height))
											.attr('class', 'region-outline');

				}	
			});

			
		},

		//========================================== functions for endpoint clicking ==========================================//
		
		//endpoint click callback function
		endpointClicked: function(e){

			//reset
			this.cleanIndication();
			//vars
			var $target = $(e.target),
				radius = this.radius,
				width = this.$el.find('.end-point-menu').width(),
				height = this.$el.find('.end-point-menu').height(),
				x = $target.attr('cx'),
				y = $target.attr('cy');

			var pid = $target.attr('point-id'),
				point = app._global.endPoints[pid];
			//store point object in View
			this.pointClicked = point;

			//check if point is on frame, if yes do not show menu
			if(
				point.x <= 0 + app._global.tolerance || 
				point.y <= 0 + app._global.tolerance || 
				point.x >= 100 - app._global.tolerance|| 
				point.y >= 100 - app._global.tolerance
			) {
				//notification
				app.notify('Cannot be Operated', 'End points on outter frame cannot be operated! Choose inside end points inside!', 'error', {icon: 'fa fa-reddit-alien'});
				//close currently opened menu, if showing
				if(this.endpointMenuShown)
					//this.closeMenu(); //!!do not close menu after a 'wrong' click with menu currently showing somewhere else
					return;
			}

			//add active tag to current element
			//!!Note: jQuery2 does NOT support SVG element addClass. jQuery3 claims it has solved this problem.
			$target.attr('class', 'end-point draggble active');
			
			//show menu
			this.$el.find('.end-point-menu').css({
				left: (x - width / 2) + 'px',
				top: (y - height / 2) + 'px'
			}).removeClass('hidden');

			//flip flag
			this.endpointMenuShown = true;

			//NOW check in four directions whether there is a line attached 
			//if no pass
			//if yes check whether that line can be deleted or not
			this.colorArrows(point);
		},

		//function for closing endpoint menu
		closeMenu: function(){
			//hide menu
			this.$el.find('.end-point-menu').addClass('hidden');
			this.endpointMenuShown = false;
			//cleanup
			this.cleanIndication();
		},

		//clear active class from endpoint and reset the styling of arrow
		cleanIndication: function(){
			//remove active class
			this.parentCt.$el.find('.end-point.active').attr('class', 'end-point draggble');
			//clean all the indication color
			this.$el.find('.indicator > i').removeClass('text-muted text-danger deletable');
		},

		//color the arrows in the endpoint menu based on the result of checkDeletable()
		colorArrows: function(point){
			this.cleanIndication();
			//top
			if(point.top){
				this.checkDeletable(point.top, 'up');
			}else{
				this.$el.find('.up > i').addClass('text-muted');
			}
			//bottom
			if(point.bottom){
				this.checkDeletable(point.bottom, 'down');
			}else{
				this.$el.find('.down > i').addClass('text-muted');
			}
			//left
			if(point.left){
				this.checkDeletable(point.left, 'left');
			}else{
				this.$el.find('.left > i').addClass('text-muted');
			}
			//right
			if(point.right){
				this.checkDeletable(point.right, 'right');
			}else{
				this.$el.find('.right > i').addClass('text-muted');
			}
		},

		//check whether a single line is deletable or not
		checkDeletable: function(lineId, position){
			var line, dir, startPoint, endPoint,
				that = this;
			if(position === 'up' || position === 'down'){
				line = _.find(app._global['vertical-line'], function(vline){ return vline.id === lineId; });
				dir = 'v';
			}
			else{
				dir = 'h';
				line = _.find(app._global['horizontal-line'], function(hline){ return hline.id === lineId; });
			}
			//store line for later reference !!maybe need to change it later
			//this.lines[position] = line;

			//if horizontal line, two end points need to both have top and bottom
			if(dir === 'h'){
				startPoint = app._global.endPoints[line.left];
				endPoint = app._global.endPoints[line.right];

				if(startPoint.top && startPoint.bottom && endPoint.top && endPoint.bottom){//deletable
					this.$el.find('.' + position + ' > i').addClass('text-danger deletable');
					return true;
				}
				else//not deletable
					this.$el.find('.' + position + ' > i').addClass('text-muted');
			}
			//if vertical line, two end points need to both have left and right
			else{
				startPoint = app._global.endPoints[line.top];
				endPoint = app._global.endPoints[line.bottom];

				if(startPoint.left && startPoint.right && endPoint.left && endPoint.right){//deletable
					this.$el.find('.' + position + ' > i').addClass('text-danger deletable');
					return true;
				}
				else//not deletable
					this.$el.find('.' + position + ' > i').addClass('text-muted');
			}

			return false;
			
		},

		//========================================== functions to handle deleting lines ==========================================//

		//function for deleting the from a point
		deleteLine: function(position){
			var startPoint, endPoint,
				left, right, top, bottom,
				line,
				that = this;

			//get the line object
			if(position === 'up' || position === 'down')
				line = _.find(app._global['vertical-line'], function(vline){ return vline.id === that.pointClicked[position === 'up' ? 'top' : position === 'down' ? 'bottom' : position];});
			else
				line = _.find(app._global['horizontal-line'], function(hline){ return hline.id === that.pointClicked[position === 'up' ? 'top' : position === 'down' ? 'bottom' : position];});

			if(position === 'up' || position === 'down'){//deleting vertical line

				//get end points
				startPoint = app._global.endPoints[line.top];
				endPoint = app._global.endPoints[line.bottom];

			}else{//deleting horizontal line

				//get end points
				startPoint = app._global.endPoints[line.left];
				endPoint = app._global.endPoints[line.right];
			}
			
			//start point not attached anymore
			if(!this.checkAttached(startPoint, line.id, position)){
				this.removeAttachedPoint(startPoint, (position === 'up' || position === 'down') ? 'v' : 'h');
			}

			//end point not attached anymore
			if(!this.checkAttached(endPoint, line.id, position)){
				this.removeAttachedPoint(endPoint, (position === 'up' || position === 'down') ? 'v' : 'h');
			}

			//remove current line
			this.removeLineFromCollection(line.id, (position === 'up' || position === 'down') ? 'v' : 'h', true);

			//redraw after line deleted
			this.getViewIn('mesh').redrawAll();
			

			//if point still exists re-color, if not hide
			if(app._global.endPoints[this.pointClicked.id]){
				this.colorArrows(this.pointClicked);

				//add active class back
				_.defer(function(){
					_.each($('.end-point.draggble'), function(el){
						var $el = $(el);
						if($el.attr('point-id') === that.pointClicked.id)
							$el.attr('class', 'end-point draggble active');
					});
				});
			}
			else{
				this.$el.find('.end-point-menu').addClass('hidden');
				//flip flag
				this.shown = false;
			}

			app.notify('Success!', 'Line has been deleted.', 'ok', {icon: 'fa fa-fort-awesome'});
				
		},

		//function to check whether this will point still attached after deletion
		checkAttached: function(point, selfId, position){
		
			if(position === 'up' || position === 'down'){//check vertical lines

				if(//4 attachments must have at least one that is not deleting line
					(point.top && point.top !== selfId) ||
					(point.bottom && point.bottom !== selfId)
				)
					return true;

			}else{//check horizontal lines

				if(//4 attachments must have at least one that is not deleting line
					(point.left && point.left !== selfId) ||
					(point.right && point.right !== selfId)
				)
					return true;
			}
			
			return false;
		},

		//function to remove a line from the global line collection
		removeLineFromCollection: function(lineId, dir, updateEndpoint){
			var line;
			if(dir === 'h'){//horizontal line
				if(updateEndpoint){
					//delete end pointer point reference
					line = _.find(app._global['horizontal-line'], function(hline){ return hline.id === lineId; });
					app._global.endPoints[line.left] && delete app._global.endPoints[line.left].right;
					app._global.endPoints[line.right] && delete app._global.endPoints[line.right].left;
				}
				//delete line
				app._global['horizontal-line'] = _.without(app._global['horizontal-line'], _.find(app._global['horizontal-line'], function(hline){ return hline.id === lineId; }));
			}else{//vertical line
				if(updateEndpoint){
					//delete end pointer point reference
					line = _.find(app._global['vertical-line'], function(vline){ return vline.id === lineId; });
					app._global.endPoints[line.top] && delete app._global.endPoints[line.top].bottom;
					app._global.endPoints[line.bottom]&& delete app._global.endPoints[line.bottom].top;
				}
				//delete line
				app._global['vertical-line'] = _.without(app._global['vertical-line'], _.find(app._global['vertical-line'], function(vline){ return vline.id === lineId; }));
			}
		},

		//function to remove standalone point after deletion
		removeAttachedPoint: function(point, dir){
			var pre, after, x1, x2, y1, y2, startPoint, endPoint,
				newLineId = _.uniqueId((dir === 'h') ? 'vertical-' + app._global.generation + '-' : 'horizontal-' + app._global.generation + '-');
			if(dir === 'h'){//deleting horizontal line
				//get two vertical segments
				pre = _.find(app._global['vertical-line'], function(vline){ return vline.id ===  point.top;});
				after = _.find(app._global['vertical-line'], function(vline){ return vline.id ===  point.bottom;});

				//assign new line coords
				x1 = x2 = pre.x;
				y1 = pre.y1;
				y2 = after.y2;
				startPoint = pre.top;
				endPoint = after.bottom;

				//update end points' pointer to the new line
				app._global.endPoints[pre.top].bottom = newLineId;
				app._global.endPoints[after.bottom].top = newLineId;

			}else{//deleting vertical line
				//get two horizontal segments
				pre = _.find(app._global['horizontal-line'], function(vline){ return vline.id ===  point.left;});
				after = _.find(app._global['horizontal-line'], function(vline){ return vline.id ===  point.right;});

				//assign new line coords
				x1 = pre.x1;
				x2 = after.x2;
				y1 = y2 = pre.y;
				startPoint = pre.left;
				endPoint = after.right;

				//update end points' pointer to the new line
				app._global.endPoints[pre.left].right = newLineId;
				app._global.endPoints[after.right].left = newLineId;
			}

			//remove old lines and the point
			this.removeLineFromCollection(pre.id, (dir === 'h') ? 'v' : 'h');//flip
			this.removeLineFromCollection(after.id, (dir === 'h') ? 'v' : 'h');
			delete app._global.endPoints[point.id];

			//gen new line use genLine in mesh.js
			//information to send to genLine function
			var info = {x1: x1, y1: y1, x2: x2, y2: y2, startPoint: startPoint, endPoint: endPoint, id: newLineId, dir: (dir === 'h') ? 'v' : 'h'};

			if(info.dir === 'h'){//horizontal line
				this.getViewIn('mesh').genLine('h', {x1: info.x1, x2: info.x2, y: info.y1}, {
					left: info.startPoint,
					right: info.endPoint
				}, info.id);
			}else{//vertical line
				this.getViewIn('mesh').genLine('v', {y1: info.y1, y2: info.y2, x: info.x1}, {
					top: info.startPoint,
					bottom: info.endPoint
				}, info.id);
			}
		}
		
	});

})(Application);