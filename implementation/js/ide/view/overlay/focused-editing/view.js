/**
 * Sample VIEW script.
 *
 * @author Stagejs.CLI
 * @created Tue May 23 2017 15:07:09 GMT-0800 (PST)
 */

;(function(app){

	app.view('Overlay.FocusedEditing.View', {

		template: '@view/overlay/focused-editing/view.html',
		//data: 'url', {} or [],
		//coop: ['e', 'e'],
		//[editors]: {...},
		
		initialize: function(){},
		//onShow: function(){},
		//onDataRendered: function(){},
		onAppendClone: function(){
			var $clone = this.get('$clone');

			//modify css top to be center
			var tabsHeight = this.parentCt.$el.find('.tabs-container .tabs').height(),
				parentHeight = this.parentCt.$el.height(),
				newTop = (parentHeight - tabsHeight - $clone.height()) / 2;
			//reset top	
			//$clone.css('top', newTop);
			//append
			this.$el.append($clone);

			//register builder loading event
			this.registerEditingEvents($clone);
		},
		registerEditingEvents: function($el){
			var that = this;
			//right click to load builder
			$el.on('contextmenu', function(e){
				e.preventDefault();
				e.stopPropagation();
				console.log('contextmenu',$el.empty());
				//cache name = currently editing view + region name
				var cacheName = window.location.hash.split('/').pop() + '-' + $el.attr('region');

				//create the builder view
				var builder = app.get('Overlay.FocusedEditing.Builder')
					.create({
						cacheName : cacheName
					});

				//setup default cache
				app.store.set(cacheName, app.store.get(cacheName) || {
				    'groups': [{
				        'template': '',
				        'data': '',
				        'less': '',
				        'css_container': {
				            'flex-grow': '0',
				            'flex-shrink': '1',
				            'flex-basis': '100%',
				        }
				    }, ],
				    'strings': [],
				    'direction': ''
				});

				that.get('$element').empty();

				//spray the builder view onto the region
          		that.spray($el, builder);
			});
		},
		actions: {
		//	submit: function(){...},
		//	dosomething: function(){...},
		//	...
		},

	});

})(Application);