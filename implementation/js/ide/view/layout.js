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
			'point-layout-reset-confirmed', //user confirm to delete a line attaches to a certain point
			'delete-local-view', //remove a view from local storage
		],
		initialize: function(){
			//indicate whether endpoint menu is current being shown or not
			this.endpointMenuShown = false;

			//indicate whether it is outline only
			this.outlineOnly = false;

			//indicate whether current view has been edited
			this.modified = false;
		},
		onReady: function(){
			
		},
		onNavigateTo: function(path){
			var that = this;
			//remind the name for this view
			if(path)
				this.editingViewName = path.slice().pop();
			else
				this.editingViewName = '';

			app.remote({
				url: '/api/getViewList',
				async: false,
			}).done(function(data){
				//locally stored configurations
				var layouts = app.store.get('__layouts'),
				//stored configuration for current view
					current = app.store.get('__current');

				if(path && !layouts[that.editingViewName] && !_.contains(data, that.editingViewName)){
					app.get('Overlay.CreateNewView')
						.create({
							data: {
								viewName: that.editingViewName
							}
						})
						.overlay({
							effect: false
						});
					return;
				}//add newly created view to the collection
					// layouts[that.editingViewName] = {
					// 	layout: ['1'],
					// };

				//trim data, to show view list both for local stored layouts and remote layouts
				var viewList = data.slice();
				_.each(viewList, function(viewName, index){
					viewList[index] = {
						name: viewName,
						source: 'remote'
					};
				});
				_.each(layouts, function(cfg, viewName){
					//not contain in the list, pre-pend to the list
					if(!_.contains(data, viewName)){
						viewList.unshift({
							name: viewName,
							source: 'local'
						});
					}
				});

				//add locally saved to view to viewList
				that.show('menu', 'LayoutEditMenu', {
					data: {
						items: viewList,
						layout: true,
						method: 'Layout',
						viewName: that.editingViewName,
					},
				});

				if(path){
					//check whether __current is pointing to the loading view,
					//if not rewrite __current based on stored data
					if(current.viewName !== that.editingViewName){
						//clear __current in cache
						app.store.remove('__current');

						//overwrite current
						current = app.store.set('__current', layouts[that.editingViewName] || {viewName: that.editingViewName});
					}
					
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
								that.genLayoutFromTemplate(that.getViewIn('preview'), that.getViewIn('preview').$el);
							});
						});
						
					}else {
						//checkout local storage for the loading view
						//honor __current
						that.initializeGlobal(current);

						//honor __layouts
						if(layouts[that.editingViewName]){
							//show the view preview first, in order to pick up html and size
							that.show('preview', app.view({
									layout: layouts[that.editingViewName].layout
								}))
								.once('ready', function(){
									that.genLayoutFromTemplate(that.getViewIn('preview'), that.getViewIn('preview').$el);
								}); //!later on show saved configs
						}
						else{
							//initialize an object for the new view in __layouts
							layouts[that.editingViewName] = {};
							//sync __layouts with local storage
							app.store.remove('__layouts');
							app.store.set('__layouts', _.deepClone(layouts));
							//show a new blank view
							that.show('preview', app.view({
								template: 'NO TEMPLATE TBD',
							}));
						}

						//show the mesh grids
						that.show('mesh', 'Layout.Mesh');
					}	
				}else{
					//close preview and mesh view if no path is given
					if(that.getViewIn('mesh'))
						that.getViewIn('mesh').close();

					if(that.getViewIn('preview'))
						that.getViewIn('preview').close();
				}
			});
		},
		actions: {
			slide: function(){
				this.$el.find('.left-container').toggleClass('closed');
			},
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

			//re-generate layout
			this.onLayoutConfigChanged();

			//setup dirty-bit since point has been deleted
			if(!this.modified)
				this.setDirtyBit(true);
		},

		//function to handle local storage syncing
		onSyncLocal: function(){
			this.syncLocal();
		},

		//function to handle saving current view layout configurations into cache
		onSaveLayout: function(obj){
			//cache
			var layouts = app.store.get('__layouts');

			//modified layouts[this.editingViewName]
			layouts[this.editingViewName] = _.deepClone(app.store.get('__current'));//_.extend({viewName: this.editingViewName, layout: app.store.get('__current')}, app._global);

			//save it to cache with a deep copy, avoid werid issue
			app.store.set('__layouts', _.deepClone(layouts));

			//once layout saved flip the dirty bit
			if(this.modified)
				this.setDirtyBit(false);

			//show notification
			app.notify('Success!', 'Layout configuration has been saved.', 'ok', {icon: 'fa fa-fort-awesome'});

			//save from switching context, need to honor the switching
			if(obj)
				app.navigate('_IDE/' + obj.method + '/' + obj.next);

		},

		//on layout config changed, re-generate layout immedieately
		onLayoutConfigChanged: function(){
			//on closing generate layout if this is local view
			var temp = this.generateLayout(),
				that = this;

			//once layout changed flip the dirty bit
			if(!this.modified)
				this.setDirtyBit(true);

			//save the newly generated layout as a template for local view
			this
			.show('preview', app.view({
				layout: _.extend({bars: false}, temp.layout)
			}))
			.once('ready', function(){
				//update current
				var current = app.store.get('__current');
				current.layout = _.extend({bars: false}, temp.layout);
				//current.template = that.getViewIn('preview').parentRegion.$el.html();
				
				//sync local storage
				app.store.set('__current', _.deepClone(current));

				//add new marker
				that.genLayoutFromTemplate(that.getViewIn('preview'), that.getViewIn('preview').$el);

			});
		},

		//function to handle local view remove
		onDeleteLocalView: function(viewName){
			var layouts = app.store.get('__layouts');

			//remove stored view
			delete layouts[viewName];

			//sync to local storage
			app.store.remove('__layouts');
			app.store.set('__layouts', _.deepClone(layouts));

			//navigate to a view
			app.navigate('_IDE/Layout/');
		},

		//========================================== helper functions ==========================================//
		
		//functions to initialize app._global
		initializeGlobal: function(obj){
			//create a global object to store points, horizontal lines and vertical lines
			app._global.endPoints = obj.endPoints || {};
			app._global['vertical-line'] = obj['vertical-line'] || [];
			app._global['horizontal-line'] = obj['horizontal-line'] || [];
		},

		//function to sync __current local storage
		syncLocal: function(){//alias for the coop function, to be used in this view
			var current = _.extend(app.store.get('__current'), {
				endPoints: app._global.endPoints,
				'horizontal-line': app._global['horizontal-line'],
				'vertical-line': app._global['vertical-line'],
				viewName: this.editingViewName //keep a reference for later comparison on loading
			});
			
			//remove old for a clean setup
			app.store.remove('__current');

			//save current, with a duplicated object not a reference
			app.store.set('__current', _.deepClone(current));
		},

		//function to setup the dirty-bit for the saving button
		setDirtyBit: function(modified){
			if(modified){
				this.modified = true;
				this.$el.find('.view-layout-menu .dirty-bit').removeClass('hidden');
			}else{
				this.modified = false;
				this.$el.find('.view-layout-menu .dirty-bit').addClass('hidden');
			}
		},

		//function to depict first layer regions
		genLayoutFromTemplate: function(viewInstance, $preview){
			var previewLeft = viewInstance.$el.offset().left,
				previewTop = viewInstance.$el.offset().top,
				that = this;

			//remove all the size marker
			if($preview)
				$preview.find('.size-marker').remove();

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
					
					var previewHeight = $preview.height(),
						previewWidth = $preview.width();

					var markerBottom = previewHeight - height - top,
						markerLeft = left;
					
					//insert marker into preview view, but at the position of left corner of every region
					$preview.append('<div class="size-marker" style="bottom:' + markerBottom + 'px;left:' + markerLeft + 'px;">W: '+ width +' H: ' + height + '</div>');
					
					if(that.outlineOnly)
						//draw a dashed path surrounding current div
						that.getViewIn('mesh').drawPath('M' + left + ' ' + top + 'l' + width + ' 0l0 ' + height + 'l' + (-width) + ' 0l0 ' + - (height))
												.attr('class', 'region-outline');

				}
			});
		},

		//function for generating layout
		generateLayout: function(adjusting, overlay){
			var x = [], y = [], that = this, returnData;
			//generate a list of x and y coordinates from end points
			_.each(app._global.endPoints, function(endPoint, pid){
				var flag = false;
				if(!_.contains(x, endPoint.x)){//not contained in the x 
					if(!that.checkContained(x, endPoint, 'x')){//adjust the coordinate if necessary
						x.push(endPoint.x);
						//sort
						x = _.sortBy(x, function(num){ return num;});
					}
				}

				if(!_.contains(y, endPoint.y)){//y
					if(!that.checkContained(y, endPoint, 'y')){
						y.push(endPoint.y);
						//sort
						y = _.sortBy(y, function(num){ return num;});
					}
				}
			});

			//augment horizontal lines and vertical lines based on coordiates extracted from end points
			//horizontal
			_.each(app._global['horizontal-line'], function(hline){
				//left anchor
				that.checkContained(x, hline, 'x1');
				//right anchor
				that.checkContained(x, hline, 'x2');
				//y
				that.checkContained(y, hline, 'y');
			});

			//vertical
			_.each(app._global['vertical-line'], function(vline){
				//top anchor
				that.checkContained(y, vline, 'y1');
				//bottom anchor
				that.checkContained(y, vline, 'y2');
				//x
				that.checkContained(x, vline, 'x');
			});

			//acquire remote api for generating layout
			app.remote({
				url: '/api/generate',
				async: false,
				payload: {
					endPoints: app._global.endPoints,
					//max length h/v lines are 100 (%).
					hlines: app._global['horizontal-line'],
					vlines: app._global['vertical-line'],
				}
			})
			.done(function(data){
				//assign return data
				returnData = data;
			})
			.fail(function(error){
				app.notify('Error!', 'Generating error.', 'error', {icon: 'fa fa-reddit-alien'});
			});

			//debug log
			app.debug('x array', x, 'y array', y);
			app.debug('endPoints exported from generate action', app._global.endPoints);
			app.debug('h-lines exported from generate action', app._global['horizontal-line']);
			app.debug('v-lines exported from generate action', app._global['vertical-line']);

			return returnData;
		},

		//function to align points within a certain margin of error(app._global.tolerance)
		checkContained: function(arr, obj, key){
			var flag = false;
			//check whether in the margin of error
			//if yes, correct it
			_.each(arr, function(single){
				if(
					(single === 0 && obj[key] <= app._global.tolerance) ||//tolerance is 0.02 need to magnify it 100 times
					(single === 100 && obj[key] >= 100 - app._global.tolerance) ||
					(obj[key] >= (single - app._global.tolerance) && obj[key] <= (single + app._global.tolerance))
				){
					obj[key] = single;
						flag = true;
				}
			});
			return flag;
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
		},
		
	});

})(Application);