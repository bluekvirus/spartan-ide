/**
 * Sample VIEW script.
 *
 * @author Stagejs.CLI
 * @created Wed May 17 2017 18:16:47 GMT-0700 (PDT)
 */
;(function(app){

	app.view('Edit', {

		template: '@view/ide/edit.html',
		data: '/api/getViewList',
		//[editors]: {...},
		initialize: function(){},
		//onShow: function(){},
		//onDataRendered: function(){},
		//navRegion: 'content-editor',
		onNavigateTo: function(path){
			var that = this;
			//
			this.editingViewName = path.slice().pop();

			app.remote({
				url: '/api/getViewList',
				async: false,
			}).done(function(data){
				//locally stored configurations
				var layouts = app.store.get('__layouts__'),
				//stored configuration for current view
					current = app.store.get('__current__');

				//*** always consult layout, since we've asked user whether to save before switching ***//
				//clear __current__ in cache
				app.store.remove('__current__');

				//overwrite current
				current = app.store.set('__current__', layouts[that.editingViewName] || {viewName: that.editingViewName, template: 'currently no tempalte stored',});

				//check whether it is a remote view or a local view
				//remote
				if(_.contains(data, that.editingViewName)){
					that.show('content-editor', that.editingViewName)
						.once('ready', function(){
							var firstLayers = that.setupFirstLayer(that.getViewIn('content-editor'));
						});
				}
				//local
				else{
					//!!bug when there is no path provided
					//check whether it is newly added view, a view can only be newed at layout view
					if(!layouts[that.editingViewName]){
						app.navigate('_IDE/Layout/' + that.editingViewName);
						return;
					}

					that
					.show('content-editor', app.view({
						layout: current.layout
					}))
					.once('ready', function(){
						var firstLayers = that.setupFirstLayer(that.getViewIn('content-editor'));
					});
				}

				//show the side menu
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
						edit: true,
						method: 'Edit',
						viewName: that.editingViewName
					},
				});
			});

		},
		actions: {
			'close-context-menu': function(){
				this.closeContextMenu();
			},
		},

		//========================================== helper functions ==========================================//
		
		//functions to initialize app._global
		initializeGlobal: function(obj){
			//create a global object to store points, horizontal lines and vertical lines
			app._global.endPoints = obj.endPoints || {};
			app._global['vertical-line'] = obj['vertical-line'] || [];
			app._global['horizontal-line'] = obj['horizontal-line'] || [];
		},

		//function to depict first layer regions
		setupFirstLayer: function(viewInstance){
			var previewLeft = viewInstance.$el.offset().left,
				previewTop = viewInstance.$el.offset().top,
				that = this,
				firstLayers = [];

			//remove older markers
			this.getViewIn('content-editor').$el.find('.size-marker').remove();

			//get all first layer regions
			_.each(viewInstance.$el.find('div.region'), function(el, index){
				var $el = $(el), $parent = $el.parent(), firstLayer = true, top, left, width, height;

				//trace every div with region tags, to see if any of its parents has class region
				//if yes, then it is NOT a first layer region.
				//if not, then it is a first layer region
				while(!$parent.hasClass('region-content-editor')){
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
					//keep a copy for later reference
					firstLayers.push($el);
				
					var view = that.getViewIn('content-editor'),
						$viewEl = view.$el,
						contentOffsetTop = $viewEl.offset().top,
						contentOffsetLeft = $viewEl.offset().left,
						contentOffsetHeight = $viewEl.height(),
						contentOffsetWidth = $viewEl.width();

					//add mark
					
					top = $el.offset().top - contentOffsetTop;
					left = $el.offset().left - contentOffsetLeft;
					height = $el.height();
					width = $el.width();
					
					var markerBottom = contentOffsetHeight - height - top,
						markerLeft = left;

					//insert marker into preview view, but at the position of left corner of every region
					$viewEl.append('<div class="size-marker" style="bottom:' + markerBottom + 'px;left:' + markerLeft + 'px;">W: '+ width +' H: ' + height + '</div>');
					

					//color the borders
					$el.addClass('first-layer-region');

					//register edit events on the first layer $els
					that.addEditingEvents($el);
				}
			});

			//

			//return all qualified el's
			return firstLayers;
		},

		//function to add editing events on firstLayer regions
		addEditingEvents: function($el){

			var that = this,
				previewHeight = this.$el.find('.region-content-editor').height(),
				previewWidth = this.$el.find('region-content-editor').width();

			$el
			//left click to fire up focused editing view
			.on('click', function(e){
				//routine
				e.preventDefault();
				e.stopPropagation();

				//close the context menu
				that.$el.find('.context-menu').addClass('hidden');

				//load the focused edit view, clone a copy of $el and pass it to the focused editing view
				app.get('Overlay.FocusedEditing')
					.create({
						data: {
							element: $el.clone(),
						}
					})
					.overlay({
						effect: false,
						class: 'focused-editing-overlay'
					});

			})
			//right click for context menu
			.on('contextmenu', function(e){
				//routine
				e.preventDefault();
				e.stopPropagation();

				//get the current position of the mouse
				var x = e.pageX - that.$el.find('.region-content-editor').offset().left,
					y = e.pageY - that.$el.find('.region-content-editor').offset().top,
					editorWidth =  that.$el.find('.region-content-editor').width(),
					editorHeight = that.$el.find('.region-content-editor').height(),
					menuWidth = that.$el.find('.context-menu').width(),
					menuHeight = that.$el.find('.context-menu').height(),
					tolerance = 30; //px

				that.$el.find('.context-menu')
				.css({
					top: (y + menuHeight + 30 > editorHeight) ? (y - menuHeight) : y,
					left: (x + menuWidth + 30 > editorWidth) ? (x - menuWidth) : x,
				})
				.removeClass('hidden');

				//add a highlight class for clicked region
				that.$el.find('.first-layer-region').removeClass('active'); //remove first
				$el.addClass('active');
			});
		},

		//function to handle closing context menu
		closeContextMenu: function(){
			//hide menu
			this.$el.find('.context-menu').addClass('hidden');
			
			//remove the highlight
			this.$el.find('.first-layer-region.active').removeClass('active');
		},

		//function to match regions with endpoints for persistent
		matchRegions: function(){
			var that = this;
			//global storage for storing region coordinates, used as base for comparison later
			app._global.regions = [];
			//contruct a mapping from point to region
			var regions = that.getFirstLayer(that.getViewIn('content-editor')),
				height = that.$el.find('.region-content-editor').height(),
				width = that.$el.find('.region-content-editor').width();

			_.each(regions, function($el){
				var el = $el[0];
				var boundingRect = _.clone(el.getBoundingClientRect());//make a copy
				//only pick 4 corners, and minus the offset of the parent region, .region-content-editor
				boundingRect = _.pick(boundingRect, 'top', 'bottom', 'left', 'right');
				_.each(boundingRect, function(prop, key){
					if(key === 'top' || key === 'bottom'){
						boundingRect[key] = prop - that.$el.find('.region-content-editor').offset().top;
					}else{
						boundingRect[key] = prop - that.$el.find('.region-content-editor').offset().left;
					}
				});

				//push marked regions
				app._global.regions.push(that.getBoundingPoints(el, boundingRect, width, height));
			});

			//show notification
			app.notify('Generated!', 'Layout has been generated.', 'ok', {icon: 'fa fa-fort-awesome'});
			//object to store region-view configuration globally, empty array if it does not exist.
			app._global.regionView = app._global.regionView || []; //now it is an array

			//sync with local storage
			app.store.set('regionView', app._global.regionView);

			//re-render views
			if(app._global.regionView.length){

				_.each(app._global.regionView, function(obj, index){
					var regionObj, regionName, regionMethod;
					//find which region in app._global.regions representing current region, save content in it;
					//consult app._global.tolerance for acceptable margin of errors.
					regionObj = _.find(app._global.regions, function(bounds){
						return obj.topLeft === bounds.topLeft &&
								obj.topRight === bounds.topRight &&
								obj.bottomLeft === bounds.bottomLeft &&
								obj.bottomRight === bounds.bottomRight;
					});

					//get region name
					if(regionObj){
						regionName = regionObj.regionName;
						//get render method, view or html
						regionMethod = obj.method;
					}
						
					//trim out the region has no match
					else{
						app._global.regionView[index] = undefined;
						return;
					}

					// var generatedView = that.getViewIn('generate-view');
					// if(regionName)
					// 	if(regionMethod === 'view'){
					// 		//load view into the region
					// 		generatedView.spray(generatedView.getRegion(regionName).$el.css('overflow', 'auto'), obj.view, {
					// 			data: obj.data,
					// 		});
					// 	}else{
					// 		//load view into the region
					// 		generatedView.spray(generatedView.getRegion(regionName).$el.css('overflow', 'auto'), obj.view, {
					// 			data: obj.data,
					// 			editors: obj.editors,
					// 			svg: _.reduce(obj.svg, function(memo, svgfnstr, name){
					// 					memo[name] = new Function("return " + svgfnstr)(); //Functionify lol
					// 					return memo;
					// 			}, {}),
					// 		});
					// 	}
				});
			}

			//trim out undefined just assigned
			app._global.regionView = _.compact(app._global.regionView);
		},

		//function to get bounding endpoints of a region
		getBoundingPoints: function(el, boundingRect, width, height, options){
			//return obj
			var temp = {};

			//calcualte position in percentage
			var top = trimNumber(boundingRect.top / height * 100), //transfer it into percentage
				left = trimNumber(boundingRect.left / width * 100),
				bottom = trimNumber(boundingRect.bottom / height * 100),
				right = trimNumber(boundingRect.right / width * 100),
				regionName = el ? $(el).attr('region') : ''; //region name for later reference

			//find points corresponding to 4 corners
			_.each(app._global.endPoints, function(point, id){
				//top left
				if(
					(point.x >= left - app._global.tolerance && point.x <= left + app._global.tolerance) &&
					(point.y >= top - app._global.tolerance && point.y <= top + app._global.tolerance)
				){
					temp.topLeft = id;
				}

				//top right
				else if(
					(point.x >= right - app._global.tolerance && point.x <= right + app._global.tolerance) &&
					(point.y >= top - app._global.tolerance && point.y <= top + app._global.tolerance)
				){
					temp.topRight = id;
				}

				//bottom left
				else if(
					(point.x >= left - app._global.tolerance && point.x <= left + app._global.tolerance) &&
					(point.y >= bottom - app._global.tolerance && point.y <= bottom + app._global.tolerance)
				){
					temp.bottomLeft = id;
				}

				//bottom right
				else if(
					(point.x >= right - app._global.tolerance && point.x <= right + app._global.tolerance) &&
					(point.y >= bottom - app._global.tolerance && point.y <= bottom + app._global.tolerance)
				){
					temp.bottomRight = id;
				}			
			});
			
			//for app._global.regions
			if(regionName) temp.regionName = regionName;

			//for app._global.regionView
			if(options)
				temp = _.extend(temp, options);

			return temp;
		}
	});

	//trim number only leave two digits after decimal point
	function trimNumber(number){
		return parseFloat(number.toFixed(2));
	}

})(Application);