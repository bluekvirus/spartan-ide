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
		coop: ['view-edit-menu-closed'],
		//[editors]: {...},
		initialize: function(){
			//indicator of which $el triggered context menu
			this.contextMenuTrigger = false;

			//array to store all the first layer regions object
			this.firstLayers = [];

			//indicate whether context menu is currently showing
			this.contextmenuShown = false;
		},
		//onShow: function(){},
		//onDataRendered: function(){},
		//navRegion: 'content-editor',
		onNavigateTo: function(path){
			var that = this;

			//if no path provided go to layout view, edit view should not handle create/delete and no path situation
			if(!path){
				app.navigate('_IDE/Layout');
				return;
			}

			//
			this.editingViewName = path.slice().pop();

			app.remote({
				url: '/api/getViewList',
			}).done(function(data){
				//locally stored configurations
				var layouts = app.store.get('__layouts__'),
				//stored configuration for current view
					current = app.store.get('__current__');

				var showing; //later to store view to be shown

				//*** always consult layout, since we've asked user whether to save before switching ***//
				//clear __current__ in cache
				app.store.remove('__current__');

				//overwrite current
				current = app.store.set('__current__', layouts[that.editingViewName] || {viewName: that.editingViewName, template: 'currently no template stored',});

				//check whether it is a remote view or a local view
				//remote
				if(_.contains(data, that.editingViewName)){
					
					that.showEditingView(that.editingViewName);
				}
				//local
				else{
					//check whether it is newly added view, a view can only be newed at layout view
					if(!layouts[that.editingViewName]){
						app.navigate('_IDE/Layout/' + that.editingViewName);
						return;
					}

					that.showEditingView(current.layout, true);
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
			'context-menu-item-clicked': function($self, e){
				var type = $self.data('type'),
					that = this;

				//action only prevent default, does not stop propagationation
				//we need to separate click on the menu and click on the bigger context
				//e.stopPropagation();

				//check which menu has been clicked
				switch(type){
					case 'view':
						//fetch view list from backend
						app
						.remote({
							url: '/api/getViewList',
						})
						.done(function(data){
							
							//combine local and remote view
							var temp = data.slice();
							_.each(temp, function(viewName, index){
								temp[index] = {
									remote: true,
									name: viewName
								};
							});

							_.each(app.store.get('__layouts__'), function(view){
								temp.unshift({
									local: true,
									name: view.viewName
								});
							});

							//show the popover
							app.view({
								className: 'context-menu-view-popover',
								data: temp,
								template: [
									'{{#items}}',
										'<div class="context-menu-view-popover-item" {{#if remote}}data-type="remote"{{else}}data-type="local"{{/if}} data-view-name={{name}} action="assign-view">',
											'{{#if remote}}<i class="fa fa-cloud"></i>{{/if}}',
											'{{#if local}}<i class="fa fa-database"></i>{{/if}}',
											'<span> {{name}}</span>',
										'</div>',
									'{{/items}}',
								],
								popover: true,
								actions: {
									'assign-view': function($self){
										//get region name
										var region =  that.contextMenuTrigger.attr('region'),
										//get remote or local
											type = $self.data('type');

										//show the desired view on that region
										if(type === 'remote')
											that.getViewIn('content-editor').show(region, $self.data('view-name'));
										else
											that.getViewIn('content-editor'); //TBD
										
										//close the contextmenu after assign
										that.closeContextMenu();
									},
								}
							})
							.create()
							.popover($self, {placement: 'right', bond: that, style: {width: '300px', height: '300px'}/*give height and width to make the popover arrow at right position*/});

						});

					break;
					case 'form':
						console.log('form-clicked');
					break;
					case 'datagrid':
						console.log('datagrid-clicked');
					break;
					case 'chart':
						console.log('chart-clicked');
					break;
				}
			},
		},

		//========================================== coop handler functions ==========================================//

		//function to handle view edit menu close event
		onViewEditMenuClosed: function(obj){

			//give back the visibility of side menu
			this.$el.find('.view-edit-menu').css({
				visibility: 'visible',
			});

			//remove the highlight class of the region
			obj.$element.removeClass('editing');

			this.$el.toggleClass('viewport-blur', false);
		},

		//========================================== helper functions ==========================================//
		
		//function to initialize app._global
		initializeGlobal: function(obj){
			//create a global object to store points, horizontal lines and vertical lines
			app._global.endPoints = obj.endPoints || {};
			app._global['vertical-line'] = obj['vertical-line'] || [];
			app._global['horizontal-line'] = obj['horizontal-line'] || [];
		},

		//function to handle showing view to editing region
		showEditingView: function(viewInfo, local){
			var showing, that = this;
			if(local)
				showing = app.view({
							layout: viewInfo,
							events: {
								'click .first-layer-region': function(e){
									//callback function, preventDefault stopPropagation will be done inside callback function
									that.regionClickCallback(e, $(e.target));
								},
								'contextmenu .first-layer-region': function(e){
									//callback function, preventDefault stopPropagation will be done inside callback function
									that.regionContextmenuCallback(e, $(e.target));
								}
							}
						})
						.create()
						.on('render', function(){
							//add a fake class to this.$el in order to find first layer regions
							this.$el.addClass('fake-outmost-region');
							that.firstLayers = that.setupFirstLayer(this);
						})
						.on('ready', function(){
							//mark the region size at the left bottom of every first layer region
							that.markFirstLayer();
						});
			else
				//fetch the view from remote
				showing = app.get(viewInfo)
							.create({
								events: {
									'click .first-layer-region': function(e){
										//callback function, preventDefault stopPropagation will be done inside callback function
										that.regionClickCallback(e, $(e.target));
									},
									'contextmenu .first-layer-region': function(e){
										//callback function, preventDefault stopPropagation will be done inside callback function
										that.regionContextmenuCallback(e, $(e.target));
									}
								}
							})
							.on('render', function(){
								//add a fake class to this.$el in order to find first layer regions
								this.$el.addClass('fake-outmost-region');
								that.firstLayers = that.setupFirstLayer(this);
							})
							.on('ready', function(){
								//mark the region size at the left bottom of every first layer region
								that.markFirstLayer();
							});
			
			this.show('content-editor',  showing);
		},

		//function to depict first layer regions
		setupFirstLayer: function(viewInstance){
			var previewLeft = viewInstance.$el.offset().left,
				previewTop = viewInstance.$el.offset().top,
				that = this,
				firstLayers = [];

			//remove older markers
			//this.getViewIn('content-editor').$el.find('.size-marker').remove();
			
			//get all first layer regions
			_.each(viewInstance.$el.find('div[region]'), function(el, index){
				var $el = $(el), $parent = $el.parent(), firstLayer = true;

				//trace every div with region tags, to see if any of its parents has class region
				//if yes, then it is NOT a first layer region.
				//if not, then it is a first layer region
				while(!$parent.hasClass('fake-outmost-region')){

					//not firstLayer
					if($parent.attr('region')){
						firstLayer = false;
						break;
					}else{//continue trace
						$parent = $parent.parent();
					}
				}

				//view from backend do not have layout, only mark the first layer regions
				if(firstLayer){
					//add a class for giving border
					$el.addClass('first-layer-region');

					//keep a copy for later reference
					firstLayers.push($el);
				}
			});

			//

			//return all qualified el's
			return firstLayers;
		},

		//function to handle marking region size
		markFirstLayer: function(){
			var view = this.getViewIn('content-editor'),
				$viewEl = view.$el,
				contentOffsetTop = $viewEl.offset().top,
				contentOffsetLeft = $viewEl.offset().left,
				contentOffsetHeight = $viewEl.height(),
				contentOffsetWidth = $viewEl.width();

			_.each(this.firstLayers, function($el){
				//add mark
				var top = $el.offset().top - contentOffsetTop,
					left = $el.offset().left - contentOffsetLeft,
					height = $el.height(),
					width = $el.width();
				
				var markerBottom = contentOffsetHeight - height - top - 1,
					markerLeft = left;

				//insert marker into preview view, but at the position of left corner of every region
				$viewEl.append('<div class="size-marker" style="bottom:' + markerBottom + 'px;left:' + markerLeft + 'px;">W: '+ width +' H: ' + height + '</div>');
			});
		},

		//function to handle region click event
		regionClickCallback: function(e, $el){
			var that = this;
			//routine
			e.preventDefault();
			e.stopPropagation();

			if(this.contextmenuShown){
				this.closeContextMenu();
				return;
			}

			//hide elements in side menu
			this.$el.find('.view-edit-menu').css({
				visibility: 'hidden'
			});

			//animation effect for the region is going to be edited
			//clone a div in the exactly position
			
			//original position
			var $clone = $el.clone(),
				$editor = this.$el.find('.region-content-editor'),
				top = $el.offset().top - $editor.offset().top,
				left = $el.offset().left - $editor.offset().left,
				height = $el.height(),
				width = $el.width();

			//calculate new positions
			var newTop = ($editor.height() - height) / 2,
				newLeft = ($editor.width() - width) / 2;

			//append
			$clone
			.css({
				position: 'absolute',
				top: top,
				left: left,
				height: height,
				width: width,
				border: '1px solid #000',
				transition: '.5s',
			}).appendTo(this.$el.find('.region-content-editor'));

			//load the focused edit view, clone a copy of $el and pass it to the focused editing view
			app.get('Overlay.FocusedEditing')
				.create({
					data: {
						$element: $el,
						$clone: $clone
					},
					onMoveCloneToCenter: function(ctForClone){
						$clone.css({
							top: newTop,
							left: newLeft
						}).one(app.ADE, function(){
							if($(this).data('moved')) return;
							that.$el.toggleClass('viewport-blur', true);
							ctForClone.trigger('view:append-clone');
							console.log('!!');
	            		});

						//add a highlight class to the region currently editing
						$el.addClass('editing');
					}
				})
				.overlay({
					effect: false,
					class: 'focused-editing-overlay'
				});


		},

		//function to handle region right click (contextmenu) event
		regionContextmenuCallback: function(e, $el){
			//routine
			e.preventDefault();
			e.stopPropagation();

			this.contextmenuShown = true;

			//get the current position of the mouse
			var x = e.pageX - this.$el.find('.region-content-editor').offset().left,
				y = e.pageY - this.$el.find('.region-content-editor').offset().top,
				editorWidth =  this.$el.find('.region-content-editor').width(),
				editorHeight = this.$el.find('.region-content-editor').height(),
				menuWidth = this.$el.find('.context-menu').width(),
				menuHeight = this.$el.find('.context-menu').height(),
				tolerance = 30; //px

			this.$el.find('.context-menu')
			//adjust position of context menu, and flip if necessary
			.css({
				top: (y + menuHeight + 30 > editorHeight) ? (y - menuHeight) : y,
				left: (x + menuWidth + 30 > editorWidth) ? (x - menuWidth) : x,
			})
			//show menu
			.removeClass('hidden');

			//add a highlight class for clicked region
			this.$el.find('.first-layer-region').removeClass('active'); //remove first
			$el.addClass('active');

			this.contextMenuTrigger = $el;
		},

		//function to handle closing context menu
		closeContextMenu: function(){
			var that = this;
			//close popover on the context-menu
			_.each(this.$el.find('.context-menu .context-menu-item'), function(el){
				var $el = $(el);

				if($el.popover())
					$el.popover('hide');
			});

			//rebind all the click event for first layer region
			_.each(this.firstLayers, function($el){
				
				$el.on('click', function(e){
					that.regionClickCallback(e, $el);
				});
			});

			//hide menu
			this.$el.find('.context-menu').addClass('hidden');
			
			//remove the highlight
			this.$el.find('.first-layer-region.active').removeClass('active');

			//flip flag
			this.contextmenuShown = false;
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