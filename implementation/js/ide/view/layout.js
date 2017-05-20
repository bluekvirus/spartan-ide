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
				//show the view preview
				that.show('preview', path.slice().pop());

				//show the mesh grids
				that.show('mesh', 'Layout.Mesh');

				//show the guide view
				//that.show('guide', 'Layout.Guide');
			});
		},
		actions: {
			'delete-line': function($self){//action to delete a line in certain direction
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

		//---------------------- coop event handlers----------------------//
		
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
		onPointLayoutResetConfirmed: function($point){


			//var line = this.lines[$self.data('direction')];
			//delete line
			//this.deleteLine(line, $self.data('direction'));

			//sync local storage data
			//this.coop('sync-local');
			
		},

		//====================== functions for endpoint clicking and deleting lines ======================//
		
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
			//store pid in View
			this.point = point;

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
				if(this.shown)
					//this.closeMenu();
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
	});

})(Application);