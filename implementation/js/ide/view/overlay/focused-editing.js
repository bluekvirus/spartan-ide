(function(app){

	app.view('Overlay.FocusedEditing', {
		className: 'focused-editing-view clearfix',
		template: '@view/overlay/focused-editing.html',
		coop: [
			'builder-group-config', //sliding out group config for builder
		],
		initialize: function(){
			//moving flag
			this.onMoveCloneToCenter = this.options.onMoveCloneToCenter;

			//carrier the view that is going to be sprayed
			this.spraying = false;

			//close after saving
			this.saved = false;
		},
		onReady: function(){
			this.activate('single', 0);
		},
		onItemActivated: function($item){
			var tabId = $item.attr('tabId'),
				that = this;
			//separate View view from others
			if(tabId === 'View')
				this.tab('tabs', app.get('Overlay.FocusedEditing.' + tabId).create({
					data: this.get()
				}).once('ready', function(){
					this.coop('move-clone-to-center', this);
				}), tabId);
			else
				this.tab('tabs', 'Overlay.FocusedEditing.' + tabId, tabId);
		},
		actions: {
			'close-builder': function(){
				//close focused-editing view
				this.close();
			},
			'save-builder': function(){
				//only save if builder has been shown
				if(!this.getViewIn('tabs').getViewIn('tab-View').builderShown){
					//notify
					app.notify('No changes has been made.', 'You have not made any changes.', 'info');

					return;
				}

				//get builder view
				var builder, template, dataTab, dataContent,
					builderFlag = true, dataFlag = true;
				
				try {
					builder = app.locate('Overlay.FocusedEditing.Builder').view;
				}catch(e){
					builderFlag = false;
					console.warn('You have NOT load the builder view into the region!');
				}

				//only assign tempalte if the builder view is loaded
				if(builderFlag)
					template = builder.extractTemplate();

				try{
					dataTab = this.getViewIn('tabs').getViewIn('tab-Data');
				}catch(e){
					dataFlag = false;
					console.warn('You have NOT assign any data.');
				}

				//only assign data if the dataTab has been loaded
				if(dataFlag){
					if(dataTab.$el.find('#remote-switch').prop('checked')){
						//remote data, fetch url editor's content as data
						dataContent = dataTab.get('url');
					}else{
						dataContent = dataTab.get('data-content');
					}
				}

				if(builderFlag && template){
					//flip flag
					this.saved = true;

					//temporary solution
					this.spraying = app.view({
										template: template,
										data: dataContent || {}
									});

					//save the extracted template and data to cache for future use
					var savedConfigs = app.store.get('__savedConfigs') || {};
					savedConfigs[this.get('cacheName')] = {
						template: template,
						data: dataContent || {}
					};

					app.store.set('__savedConfigs', _.deepClone(savedConfigs));

				}
				// //!!need to consult with zahra
				//this.close();
			},
			'get-color': function($self, e){
				console.log('TBD'); //show copy the color name to the clipboard
			},
		},
		onClose: function(){

			//fetch cache if there is nothing configured
			if(!this.spraying){
				var savedConfigs = app.store.get('__savedConfigs');
				//go fetch what has been stored in the cache, if not configured
				var stored = savedConfigs && savedConfigs[this.get('cacheName')];

				if(stored){
					this.spraying = app.view({
										template: stored.template,
										data: stored.data
									});
				}
				else{
					this.spraying = app.view({
										template: this.get('template'),
										data: this.get('dataContent')
									});
				}
			}

			app.coop('view-edit-menu-closed', {
				$element: this.get('$element'),
				spraying: this.spraying
			});

			//reset the flag
			this.saved = false;
			this.spraying = false;
		},
		onBuilderGroupConfig: function(obj){
			console.log('im here');
			this.$el.find('.clip-editing-holder').toggleClass('active');
		},
	});

})(Application);