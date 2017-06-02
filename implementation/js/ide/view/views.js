/**
 * Sample VIEW script.
 *
 * @author Stagejs.CLI
 * @created Wed May 17 2017 18:15:32 GMT-0700 (PDT)
 */
;(function(app){

	app.view('Views', {

		template: '@view/ide/views.html',
		//data: '/api/getViewList',
		//data: 'url', {} or [],
		//coop: ['e', 'e'],
		//[editors]: {...},
		
		initialize: function(){},
		//onShow: function(){},
		//onDataRendered: function(){},
		//navRegion: 'preview',
		onReady: function(){
			
			var that = this;

			//combine remote views and local views together in the view list
			app.remote({
				url: '/api/getViewList'
			}).done(function(data){
				var layouts = app.store.get('__layouts'),
					temp = data.slice();

				_.each(temp, function(viewName, index){
					temp[index] = {
						name: viewName,
						remote: true,
					};
				});

				_.each(layouts, function(obj, viewName){
					if(!_.contains(data, viewName))
						temp.push({
							name: viewName,
							local: true,
						});
				});

				that.set(temp);
			});
		},
		onNavigateTo: function(path){
			var that = this;
			//
			if(path && this.get('items')){
				var viewName = path.pop(),
					layouts = app.store.get('__layouts');
				//check what type of view
				if((_.find(this.get('items'), function(v){ return v.name === viewName;})).remote)
					this.show('preview', viewName);
				else
					this.show('preview', layouts[viewName].template);

				

				//active the view current path is pointed
				_.defer(function(){
					_.each(that.$el.find('.view-preview-menu .view-list-item .text'), function(el){
						var $el = $(el);
						if($el.text() === viewName)
							$el.parent().addClass('active');
					});
				});

			}
			//this.getRegion('preview').trigger('region:load-view', path);
		},
		actions: {
			'preview-view': function($self){
				app.navigate('_IDE/Views/' + $self.find('.text').text());
				//this.show('preview', $self.find('.text').text());
			},
			'edit-view': function($self){
				app.navigate('_IDE/Layout/' + $self.parent().find('.text').text());
			}
		},

	});


})(Application);