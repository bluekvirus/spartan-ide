;(function(app){

	app.view('Create.Layout', {
		svg: true,
		coop: ['layout-added'],
		onReady: function(){
			var that = this;

			this.paper.clear();

			//listen to resize event
			this.listenTo(app, 'app:resized', app.throttle(function(){
				that.redrawAll();
			}));
		},
		onLayoutAdded: function(endPoints){
			//add end points to global object
			
			//since all points are in percentage translate it into pixels
			var height = this.$el.height(),
				width = this.$el.width();

			var x1 = this.calSvgCoord(endPoints.x1, true),
				x2 = this.calSvgCoord(endPoints.x2, true),
				y1 = this.calSvgCoord(endPoints.y1),
				y2 = this.calSvgCoord(endPoints.y2);

			var pathStr = 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2;

			this.paper.path(pathStr);
		},
		//function to redraw all lines based on global object, mainly used for window resize event
		redrawAll: function(cb){
			var that = this;

			//clean old lines
			this.paper.clear();

			//draw horizontal lines
			_.each(app._global['horizontal-line'], function(coords, index){
				var x1 = that.calSvgCoord(coords.x1, true),
					x2 = that.calSvgCoord(coords.x2, true),
					y = that.calSvgCoord(coords.y);

				var pathStr = 'M' + x1 + ' ' + y + 'L' + x2 + ' ' + y;
				that.paper.path(pathStr);
			});

			//draw vertical lines
			_.each(app._global['vertical-line'], function(coords, index){
				var y1 = that.calSvgCoord(coords.y1),
					y2 = that.calSvgCoord(coords.y2),
					x = that.calSvgCoord(coords.x, true);

				var pathStr = 'M' + x + ' ' + y1 + 'L' + x + ' ' + y2;
				that.paper.path(pathStr);
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
	});

})(Application);