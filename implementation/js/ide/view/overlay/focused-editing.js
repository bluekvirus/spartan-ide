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

			//show group-editor
			this.show('group-editor', 'Overlay.FocusedEditing.GroupEditor');
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
			else{
				//close the sliding editing view
				this.$el.find('.clip-editing-holder').removeClass('active');


				this.tab('tabs', 'Overlay.FocusedEditing.' + tabId, tabId);
			}

		},
		actions: {
			'close-builder': function(){
				//close focused-editing view
				this.close();
			},
			'save-builder': function(){
				//Not a problem anymore since we now always show the builder view
				//only save if builder has been shown
				// if(!this.getViewIn('tabs').getViewIn('tab-View').builderShown){
				// 	//notify
				// 	app.notify('No changes has been made.', 'You have not made any changes.', 'info');

				// 	return;
				// }

				//get builder view
				var builder, template, dataTab, dataContent, less, compliedLess,
					builderFlag = true, dataFlag = true,
					savedConfigs = app.store.get('__savedConfigs') || {},
					theme = $('head link[rel="stylesheet"]').attr('href').split('/')[1],
					cssId = 'exported-' + this.get('cacheName');
        
				try {
					builder = app.locate('Overlay.FocusedEditing.Builder').view;
				}catch(e){
					builderFlag = false;
					console.warn('Get builder view error...');
				}

				//only assign tempalte if the builder view is loaded
				if(builderFlag)
					//fetch template
					template = builder.extractTemplate() || ' ';

					//fetch less
					less = builder.extractLess();

					//check if less exists, and then complie
					//referenced Zahra's builder
					if(less){
						
						app.remote({
							url: 'api/less',
							payload: {
								less: less,
								theme: theme
							},
							async: false,
						}).done(function(data) {
							//fetch complied less
							compliedLess = data.msg;
							//remove the old one, just case there is one
							$('#' + cssId).remove();
							//insert the new one
							$('head').append('<style id="' + cssId + '">' + data.msg + '</style>');
						});
					}

				try{
					dataTab = this.getViewFromTab('Data');
				}catch(e){
					dataFlag = false;
					console.warn('You have NOT assign any data.');
				}

				//only assign data if the dataTab has been loaded, otherwise try local stored data
				if(dataFlag){
					// if(dataTab.$el.find('#remote-switch').prop('checked')){
					// 	//remote data, fetch url editor's content as data

					// 	dataContent = dataTab.get('url');
					// }else{
					// 	dataContent = dataTab.get('data-content');
					// }
					//

					dataContent = dataTab.aces.data.getValue(); //fetch value from ace editor
				}

				if(builderFlag && template){
					//flip flag
					this.saved = true;

					//for blank data config view
					if(!dataContent){
						//consult __savedConfig(unedited version) to see whether there is a data object there
						if(savedConfigs[this.get('cacheName')] && savedConfigs[this.get('cacheName')].data){
							dataContent = savedConfigs[this.get('cacheName')].data;
						}else {//really no data
							dataContent = "{}";	
						}
					}

					//prepare the view for spraying back
					this.spraying = app.view({
										template: template,
										data: JSON.parse(dataContent)
									});

					//save the extracted template and data to cache for future use
					savedConfigs[this.get('cacheName')] = {
						template: template,
						data: dataContent,
						cssId: cssId,
						css: compliedLess
					};

					//sync cache
					app.store.set('__savedConfigs', _.deepClone(savedConfigs));

					//add notification
					app.notify('Success!', 'Configuration has been successfully saved.', 'ok', {icon: 'fa fa-fort-awesome'});
				}
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
										data: JSON.parse(stored.data)
									});
				}
				else{
					this.spraying = app.view({
										template: this.get('template') || ' ',
										data: JSON.parse(this.get('dataContent'))
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
			//----set the data for editing view----//
			//replace the data.data object with data.datakey
			obj.data.datakey = obj.data.data;
			delete obj.data.data;

			//insert groupView into data to bridge code
			obj.data.__groupView = obj.groupView;
			//setup the data for the group editor view
			this.getViewIn('group-editor').set(obj.data, {reset: true});

			this.$el.find('.clip-editing-holder').addClass('active');
		},

		//------------------------- functions to insert ace editor to textarea editors -------------------------//
		//coop event listener
		onCreateAceEditor: function(id, options){
			this._createAceEditor(id, options);
		},

		//create function
		_createAceEditor: function(elementId, options){
			var pad = ace.edit(elementId);
			//config ace editor
			pad.setTheme(options.theme && ('ace/theme/' + options.theme));
			pad.setFontSize(options.fontsize || 14);
			pad.getSession().setMode(options.mode && ('ace/mode/' + options.mode));
			pad.$blockScrolling = Infinity;
			//pad.setOption("maxLines", 1000);

			//use coop event to give back pad to every view
			app.coop('ace-editor-initiated', elementId, pad);
		},

	});

})(Application);
