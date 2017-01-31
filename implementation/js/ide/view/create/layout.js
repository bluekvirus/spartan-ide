;(function(app){

	app.view('Create.Layout', {
		svg: true,
		coop: ['layout-added', 'line-deleted'],
		radius: 8,
		onReady: function(){
			var that = this;

			this.paper.clear();

			//initial draw all the lines
			this.redrawAll();

			//listen to resize event
			this.listenTo(app, 'app:resized', app.throttle(function(){
				that.redrawAll();
			}));
		},
		onLayoutAdded: function(endPoints){
			//add end points to global object
			
			//since all points are in percentage translate it into pixels
			var height = this.$el.height(),
				width = this.$el.width(),
				circle;

			//draw the line
			var x1 = this.calSvgCoord(endPoints.x1, true),
				x2 = this.calSvgCoord(endPoints.x2, true),
				y1 = this.calSvgCoord(endPoints.y1),
				y2 = this.calSvgCoord(endPoints.y2);

			this.drawPath('M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2);

			//draw points
			circle = this.drawCircle(x1, y1);
			addPointAttr(circle.node, endPoints.startPoint);
			circle = this.drawCircle(x2, y2);
			addPointAttr(circle.node, endPoints.endPoint);
		},
		onLineDeleted: function(){
			this.redrawAll();
		},
		//function to redraw all lines based on global object, mainly used for window resize event
		redrawAll: function(){
			var that = this;

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
				addPointAttr(circle.node, id);
			});
		},
		calSvgCoord: function(coord, w/*width*/){
			var height = this.$el.height(),
				width = this.$el.width();

			if(w)
				return coord / 100 * width;
			else
				return coord / 100 * height;
		},
		drawPath: function(pathStr){
			//draw path on paper
			this.paper.path(pathStr).attr({'stroke' : '#DEDEDE', 'stroke-dasharray': '--'});
		},
		drawCircle: function(x, y){
			//draw circle on paper
			//inner circle, draw first, so it will be at lower index than outter circle, which has events on it.
			this.paper.circle(x, y, this.radius - 2).attr({'stroke-width':'none', 'fill': '#000'});
			//outer circle
			var circle = this.paper.circle(x, y, this.radius).attr({'stroke' : '#DEDEDE', 'stroke-width':'2', 'fill': 'rgba(0, 0, 0, 0)'});
			return circle;
		},
	});

	function addPointAttr(node, id){
		var $node = $(node),
			$body = $('body');
		//jquery2 cannot use addClass on SVG element
		node.setAttribute('class', 'end-point draggble');
		node.setAttribute('point-id', id);


		$node.on('click', function(e){
			//prevent default
			e.preventDefault();
			//stop event poping to parent element
			e.stopPropagation();
			
			//trigger end point click event
			app.coop('click-endpoint', e);
		});

		$node.once('mousedown', function(e){
			//prevent default
			e.preventDefault();
			//stop event poping to parent element
			e.stopPropagation();

			$node.once('mousemove', function(e){
				
				$node.unbind('click');

				$node.attr('cx', e.pageX);

				console.log('mousemove', e);
			});

			
		
		})
		.once('mouseup', function(e){
			//unbind mousemove
			$body.unbind('mousemove');
			//rebind click event
			$node.on('click', function(e){
				//prevent default
				e.preventDefault();
				//stop event poping to parent element
				e.stopPropagation();
				
				//trigger end point click event
				app.coop('click-endpoint', e);
			});
		});
	}

})(Application);