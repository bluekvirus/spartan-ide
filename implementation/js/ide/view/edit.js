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
			this.$contextMenuTrigger = false;

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
				var layouts = app.store.get('__layouts'),
				//stored configuration for current view
					current = app.store.get('__current');

				var showing; //later to store view to be shown

				//*** always consult layout, since we've asked user whether to save before switching ***//
				//clear __current in cache
				app.store.remove('__current');

				//overwrite current
				current = app.store.set('__current', layouts[that.editingViewName] || {viewName: that.editingViewName, template: 'currently no template stored',});

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
			slide: function(){
				this.$el.find('.left-container').toggleClass('closed');
			},
			'export-region': function(){
				//get the trigger $el
				var $trigger = this.$contextMenuTrigger;
				//preview solution
				// var Temp = app.view({
				// 	className: 'export-preview',
				// 	template: $trigger.html() + '<div class="close-holder" style="position:fixed;right:2em;top:1em;" action="close-preview"><i class="fa fa-2x fa-close"></i></div>',
				// 	attributes: {
				// 		style: 'height:' + $trigger.height() + 'px;width:' + $trigger.width() + 'px;',
				// 	},
				// 	actions: {
				// 		'close-preview': function(){
				// 			this.close();
				// 		},
				// 	},

				// 	//need to fetch from local storage, use cacheName rule from zahra

				// });

				// Temp.create().overlay({
				// 	effect: false,
				// 	background: 'rgba(255, 255, 255, 0.7)'
				// });

				//export solution
				app.get('Overlay.ExportViewName')
					.create({
						data: {
							html: $trigger.html(),
							attributes: {
								style: 'height:' + $trigger.height() + 'px;width:' + $trigger.width() + 'px;margin: 40px auto 0 auto;',//make it expand, temporary solution
							},
						},
					})
					.overlay({
						effect: false,
						background: 'rgba(255, 255, 255, 0.7)'
					});

				//close context menu
				this.closeContextMenu();

			},
			'close-context-menu': function(){
				this.closeContextMenu();
			},
			'context-menu-item-clicked': function($self, e){
				var type = $self.data('type'),
					that = this;

				//check which menu has been clicked
				switch(type){
					case 'view':
						//temporarily disabled view assignment function
						console.log('form-clicked');

						//fetch view list from backend
						// app
						// .remote({
						// 	url: '/api/getViewList',
						// })
						// .done(function(data){

						// 	//combine local and remote view
						// 	var temp = data.slice();
						// 	_.each(temp, function(viewName, index){
						// 		temp[index] = {
						// 			remote: true,
						// 			name: viewName
						// 		};
						// 	});

						// 	_.each(app.store.get('__layouts'), function(view){
						// 		temp.unshift({
						// 			local: true,
						// 			name: view.viewName
						// 		});
						// 	});

						// 	//show the popover
						// 	app.view({
						// 		className: 'context-menu-view-popover',
						// 		data: temp,
						// 		template: [
						// 			'{{#items}}',
						// 				'<div class="context-menu-view-popover-item" {{#if remote}}data-type="remote"{{else}}data-type="local"{{/if}} data-view-name={{name}} action="assign-view">',
						// 					'{{#if remote}}<i class="fa fa-cloud"></i>{{/if}}',
						// 					'{{#if local}}<i class="fa fa-database"></i>{{/if}}',
						// 					'<span> {{name}}</span>',
						// 				'</div>',
						// 			'{{/items}}',
						// 		],
						// 		popover: true,
						// 		actions: {
						// 			'assign-view': function($self){
						// 				//get region name
						// 				var region =  that.$contextMenuTrigger.attr('region'),
						// 				//get remote or local
						// 					type = $self.data('type');

						// 				//show the desired view on that region
						// 				if(type === 'remote')
						// 					that.getViewIn('content-editor').show(region, $self.data('view-name'));
						// 				else
						// 					that.getViewIn('content-editor'); //TBD

						// 				//close the contextmenu after assign
						// 				that.closeContextMenu();
						// 			},
						// 		}
						// 	})
						// 	.create()
						// 	.popover($self, {placement: 'right', bond: that, style: {width: '300px', height: '300px'}/*give height and width to make the popover arrow at right position*/});

						// });

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

					//--------------- newly adde for assign/edit/draw ---------------//
					case 'assign':
						console.log('assign a view to the region');
					break;
					case 'edit':
						this.contextmenuEdit(e, this.$contextMenuTrigger);
					break;
					case 'draw':
						console.log('svg');
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

			//spary the view here to make the parentCt edit
			this.spray(obj.$element, obj.spraying);

			// if(obj.saved){
			// 	//clean element
			// 	obj.$element.empty();

			// 	//spary the view here to make the parentCt edit
			// 	this.spray(obj.$element, obj.spraying);
			// }

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
						})
						.on('ready', function(){
							//mark first layers
							that.firstLayers = that.setupFirstLayer(this);
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
							})
							.on('ready', function(){
								//mark first layers
								that.firstLayers = that.setupFirstLayer(this);
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
				var $el = $(el), $parent = $el.parent(), firstLayer = true, cacheName,
					savedConfigs;

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
					//check whether there is a config stored in the localstorage
					cacheName = _.string.slugify(window.location.hash.split('/').pop() + '-' + $el.attr('region'));
					//get saved configs
					savedConfigs = app.store.get('__builder')[cacheName] || {};

					if(savedConfigs.template){//spray if exists template to avoid undefined
						that.spray($el, app.view({
							template: savedConfigs.template,
							data: savedConfigs.remoteFlag ? savedConfigs.data : JSON.parse(savedConfigs.data)
						}));

						//still need this one, exported less is only for exported view
						$('head').append('<style id="' + savedConfigs.cssId + '">' + savedConfigs.css + '</style>');
					}

					//keep a copy for later reference
					firstLayers.push($el);
				}
			});

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

			//close side menu
			this.closeSideMenu();

			if(this.contextmenuShown){
				//defer to make sure when clicking on other regions, this.contextmenuShown has not been changed
				_.defer(function(){
					that.closeContextMenu();
				});
				return;
			}
		},

		//function to handle region right click (contextmenu) event
		regionContextmenuCallback: function(e, $el){
			//routine
			e.preventDefault();
			e.stopPropagation();

			//close side menu
			this.closeSideMenu();

			//click event from children should be trigger until find the first-layer-region
			while(!$el.hasClass('first-layer-region')){
				$el = $el.parent();
			}

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

			this.$contextMenuTrigger = $el;
		},

		//function to handle context menu assign
		contextmenuAssign: function(){
			//TBD...
		},

		//function to handle context menu edit
		contextmenuEdit: function(e, $el){
			var that = this;
			//click event from children should be trigger until find the first-layer-region
			while(!$el.hasClass('first-layer-region')){
				$el = $el.parent();
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
				top = $el.offset().top,// - $editor.offset().top,
				left = $el.offset().left,// - $editor.offset().left,
				height = $el.height(),
				width = $el.width(),
				cacheName = _.string.slugify(window.location.hash.split('/').pop() + '-' + $el.attr('region')),
				savedConfigs = app.store.get('__builder')[cacheName];

			//calculate new positions
			var newTop = ($editor.height() - height) / 2,
				newLeft = ($editor.width() - width) / 2;

			//append
			$clone
			.addClass('clone')
			.css({
				position: 'absolute',
				top: top,
				left: left,
				height: height,
				width: width,
				border: '1px dashed #000',
				transition: '.5s',
			}).appendTo(this.$el);//.appendTo(this.$el.find('.region-content-editor'));

			//load the focused edit view, clone a copy of $el and pass it to the focused editing view
			app.get('Overlay.FocusedEditing')
				.create({
					data: {
						$element: $el,
						$clone: $clone,
						cacheName: cacheName,
						template: savedConfigs ? savedConfigs.template : $el.html(),
						dataContent: savedConfigs ? savedConfigs.data : "{}", //whatever stored in localstorage is an string. so default should be "{}"
					},
					onMoveCloneToCenter: function(ctForClone){
						$clone.css({
							top: (this.$el.find('.region-tabs').height() - height) / 2,
							left: (this.$el.find('.region-tabs').width() - width) / 2
						}).anyone(app.ADE, function(){
							//add blur effect on the view
							that.$el.addClass('viewport-blur');

							//
							ctForClone.trigger('view:append-clone');

							//empty the content and add a highlight class to the region currently editing
							$el.addClass('editing').empty();
						});
					}
				})
				.overlay({
					effect: false,
					class: 'focused-editing-overlay'
				});

			//close contextmenu
			this.closeContextMenu();
		},

		//function to handle context menu draw
		contextmenuDraw: function(){
			//TBD...
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

			//hide menu
			this.$el.find('.context-menu').addClass('hidden');

			//remove the highlight
			this.$el.find('.first-layer-region.active').removeClass('active');

			//flip flag
			this.contextmenuShown = false;
		},

		//function to close side menu
		closeSideMenu: function(){
			this.$el.find('.left-container').addClass('closed');
		},

	});

	//trim number only leave two digits after decimal point
	function trimNumber(number){
		return parseFloat(number.toFixed(2));
	}

})(Application);
