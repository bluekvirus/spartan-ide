;(function(app){

	app.context('Create', {
		template: '@context/create.html',
		attributes: {
			tabindex: "1" //make this div focusable in order to use keypress event
		},
		coop: ['template-added'],
		initialize: function(){
			//indicate whether click event will be triggered or not
			this.clickable = true;
			//lock all the interactions
			this.locked = false;
		},
		onTemplateAdded: function(name){
			this.addTemplateOnMenu(name, true);
		},
		onSyncLocal: function(){
			//sync end points
			app.store.set('endPoints', app._global.endPoints);
			//sync horizontal lines
			app.store.set('horizontal-line', app._global['horizontal-line']);
			//sync vertical lines
			app.store.set('vertical-line', app._global['vertical-line']);
		},
		onReady: function(){
			var that = this;
			//guide line
			this.show('guide', 'Create.Guide');
			//layout svg
			this.show('layout', 'Create.Layout');
			//menu arrows
			this.show('arrows', 'Create.Arrows');

			//show all stored templates
			_.each(app.store.getAll(), function(item, key){
				if(key !== 'endPoints' && key !== 'horizontal-line' && key !== 'vertical-line'){//only focus on stored object
					that.addTemplateOnMenu(key);
				}
			});
			
			//focus on this.$el to trigger events
			this.$el.focus();

			//on mouse move use app.coop to show the guide lines
			this.$el.on('mousemove', _.throttle(function(e){
				//prevent default events
				e.preventDefault();

				var constrain = that.checkConstrain(e), x, y;

				//check constrain
				if(!constrain) {
					//re-set guideline
					app.coop('guideline-move',{
						x: 0,
						y: 0
					});
					//set clickable to false
					that.clickable = false;

					return;	
				}else if(typeof constrain === 'boolean'){//normal
					
					that.clickable = true;
					//get x and y
					x = e.pageX;
					y = e.pageY;

					app.coop('guideline-move', {
						x: x,
						y: y
					});

				}else{//magnet

					that.clickable = true;
					//get x and y
					x = constrain.x;
					y = constrain.y;

					app.coop('guideline-move', {
						x: x,
						y: y
					});

				}

			}, 25));

			//on press shift key switch the direction of guide line
			this.$el.on('keyup', function(e){
				//prevent default events
				e.preventDefault();

				//shift key pressed
				if(e.which === 16)
					app.coop('guideline-switch');

			});

			this.$el.on('click', function(e){
				//if end point menu is being shown, close menu ONLY and no further operations
				var Menu = that.getViewIn('arrows');
				if(Menu.shown){
					Menu.closeMenu();
					return;
				}
				//only trigger if this.$el is already focused
				if(that.$el.is(':focus') && that.clickable)
					//tell guide line view user clicked
					app.coop('guideline-click');
			});

			//click event to show menu
			this.$el.find('.side-menu-trigger').on('click', function(e){
				//prevent default events
				e.preventDefault();

				var $this = $(this);
				//
				$this.toggleClass('active');
				that.$el.find('.side-menu-list').toggleClass('active');

				//toggle icon
				$this.find('.fa').toggleClass('hidden');
			});

			//stop hover on side menu being popup
			this.$el.find('[class^="side-menu"]').hover(function(e){
				e.stopPropagation();
			});

			//stop hover on block being popup
			this.$el.find('.locker').hover(function(e){
				e.stopPropagation();
			});

			//set up templates holder height for scroll
			var height = this.$el.height(),
				blockHeight = this.$el.find('.side-menu-section').outerHeight() * 2 + this.$el.find('.side-menu-item').outerHeight() * 4,
				adjust = (parseFloat(getComputedStyle(document.body).fontSize)) * 0.5; //wrapper class adjustment
			this.$el.find('.side-menu-templates-holder').css({
				height: (height - blockHeight - adjust) + 'px'
			});
			//for resize
			this.listenTo(app, 'app:resized', function(){
				var height = that.$el.height();
				that.$el.find('.side-menu-templates-holder').css({
					height: (height - blockHeight - adjust) + 'px'
				});
			});
		},
		actions: {
			lock: function($self){
				$self.find('.lock').toggleClass('hidden');
				$self.find('.unlock').toggleClass('hidden');
				this.$el.find('.locker').toggleClass('hidden');
				this.locked = !this.locked;
			},
			generate: function(){//need to align lines, ignore margin of errors
				var x = [], y = [];
				//generate a list of x and y coordinates from end points
				_.each(app._global.endPoints, function(endPoint, pid){
					var flag = false;
					if(!_.contains(x, endPoint.x)){//not contained in the x 
						if(!checkContained(x, endPoint, 'x')){//adjust the coordinate if necessary
							x.push(endPoint.x);
							//sort
							x = _.sortBy(x, function(num){ return num;});
						}
					}

					if(!_.contains(y, endPoint.y)){//y
						if(!checkContained(y, endPoint, 'y')){
							y.push(endPoint.y);
							//sort
							y = _.sortBy(y, function(num){ return num;});
						}
					}
				});

				//augment horizontal lines and vertical lines based on coordiates extracted
				//horizontal
				_.each(app._global['horizontal-line'], function(hline){
					//left anchor
					checkContained(x, hline, 'x1');
					//right anchor
					checkContained(x, hline, 'x2');
					//y
					checkContained(y, hline, 'y');
				});

				//vertical
				_.each(app._global['vertical-line'], function(vline){
					//top anchor
					checkContained(y, vline, 'y1');
					//bottom anchor
					checkContained(y, vline, 'y2');
					//x
					checkContained(x, vline, 'x');
				});

				app.remote({
					url: '/api/generate',
					payload: {
						endPoints: app._global.endPoints,
						hlines: app._global['horizontal-line'],
						vlines: app._global['vertical-line']
					}
				})
				.done(function(data){
					app.notify('Generated!', 'Layout has been generated.', 'ok', {icon: 'fa fa-fort-awesome'});
				})
				.fail(function(error){
					app.notify('Error!', 'Generating error.', 'error', {icon: 'fa fa-reddit-alien'});
				});

				//debug log
				app.debug('x array', x, 'y array', y);
				app.debug('endPoints exported from generate action', app._global.endPoints);
				app.debug('h-lines exported from generate action', app._global['horizontal-line']);
				app.debug('v-lines exported from generate action', app._global['vertical-line']);
			},
			reset: function(){
				//clear cache for current layout
				app.store.remove('endPoints');
				app.store.remove('horizontal-line');
				app.store.remove('vertical-line');
				//reset global objects
				app._global.endPoints = undefined;
				app._global['horizontal-line'] = undefined;
				app._global['vertical-line'] = undefined;

				//refresh
				this.show('guide', 'Create.Guide');
				//layout svg
				this.show('layout', 'Create.Layout');
				//menu arrows
				this.show('arrows', 'Create.Arrows');
			},
			save: function(){
				var Save = app.get('Save');
				(new Save()).overlay();
			},
			'load-template': function($self){
				var temp = app.store.get($self.attr('template-name'));

				//reset app._global object
				app._global.endPoints = temp.endPoints;
				app._global['horizontal-line'] = temp['horizontal-line'];
				app._global['vertical-line'] = temp['vertical-line'];

				//reset local stored object for current template
				app.store.set('endPoints', temp.endPoints);
				app.store.set('horizontal-line', temp['horizontal-line']);
				app.store.set('vertical-line', temp['vertical-line']);

				//refresh
				this.show('guide', 'Create.Guide');
				//layout svg
				this.show('layout', 'Create.Layout');
				//menu arrows
				this.show('arrows', 'Create.Arrows');
			},
			'delete-template': function($self){
				//get template id
				var id = $self.attr('template-name');
				//remove tempalte saved in local storage
				app.store.remove(id);
				//remove menu item in DOM
				$self.parent().remove();
			},
		},
		checkConstrain: function(e){
			var that = this;
			//if locked return false
			if(this.locked) return false;
			//stay inside window
			if(e.pageX < 1 || e.pageX > this.$el.width() - 1 || e.pageY < 1 || e.pageY > this.$el.height() - 1)
				return false;
			//menu is showing return false
			if(this.getViewIn('arrows').shown) return false;
			//dragging an end point return false
			if(this.getViewIn('layout').dragging) return false;
			//hover on points
			if(_.string.include($(e.target).attr('class'), 'end-point') || 
				_.string.include($(e.target).attr('class'), 'side-menu-trigger') || 
				_.string.include($(e.target).attr('class'), 'side-menu-list') ||
				_.string.include($(e.target).attr('class'), 'side-menu-item') ||
				_.string.include($(e.target).attr('class'), 'fa')
			){//trigger an hover event specially for end points and menu
				
				return false;
			}
			//keep a 2em gap
			var horizontal = this.getViewIn('guide')._horizontal, //get now doing horizontal line or vertical line
				em = horizontal ? (parseFloat(getComputedStyle(document.body).fontSize)) / this.$el.height() * 100
								: (parseFloat(getComputedStyle(document.body).fontSize)) / this.$el.width() * 100, //get default em and translate it into percentage
				tooClose = false,
				yPer = e.pageY / this.$el.height() * 100,
				xPer = e.pageX / this.$el.width() * 100;


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

			if(tooClose) return false;

			//magnet effect within 1em radius to a certain point
			var x,y, distance;
			_.each(app._global.endPoints, function(endPoint, id){

				//calculate distance
				distance = horizontal ? Math.abs(endPoint.y - yPer) : Math.abs(endPoint.x - xPer);
				//if less than 1 em assign new x, y for return
				if(distance < 1.25 * em){
					if(horizontal){
						x = e.pageX;
						y = endPoint.y / 100 * that.$el.height();
					}else{
						x = endPoint.x / 100 * that.$el.width();
						y = e.pageY;
					}
				}
			});

			if(x && y) return {x: x, y: y};//returns an object differs from return a boolean, though truely.

			return true;
		},
		addTemplateOnMenu: function(name, newly){
			var htmlStr = '<div class="side-menu-item wrapper wrapper-horizontal-2x clearfix">' +
								'<span class="side-menu-item-text" action="load-template" template-name="' + name + '"><i class="fa fa-file"></i> '+ name +'</span>' +
								'<div class="pull-right" action="delete-template" template-name="' + name + '"><i class="fa fa-close"></i></div>' +
							'</div>',
			$elem = $(htmlStr);

			this.$el.find('.side-menu-templates-holder').append($elem);
		}
	});

	function checkContained(arr, obj, key){
		var flag = false;
		//check whether in the margin of error
		//if yes, correct it
		_.each(arr, function(single){
			if(
				(single === 0 && obj[key] <= app._global.tolerance) ||
				(single === 100 && obj[key] >= 100 - app._global.tolerance) ||
				(obj[key] >= single * (1 - app._global.tolerance) && obj[key] <= single * (1 + app._global.tolerance))
			){
				obj[key] = single;
					flag = true;
			}
		});
		return flag;
	}

})(Application);