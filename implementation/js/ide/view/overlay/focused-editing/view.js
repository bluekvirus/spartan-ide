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
			$clone.data('moved', true);
		},
		actions: {
		//	submit: function(){...},
		//	dosomething: function(){...},
		//	...
		},

	});

})(Application);