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
				//collect information first
				var configs = this.builderResult();

				//close focused-editing view
				this.close();

				app.notify('SAVED!', 'Configuration of the view has been saved.', 'success');
			},
			'export-builder': function(){
				//collect information first
				var configs = this.builderResult();

				//get dimension attributes
				var $trigger = this.get('$element');

				//call view name overlay to configure a export name
				var ExportName = app.get('Overlay.ExportViewName').create({
					data: {
						template: configs.template,
						dataContent: configs.data,
						remoteFlag: configs.remoteFlag,
						attributes: {
							style: 'height:' + $trigger.height() + 'px;width:' + $trigger.width() + 'px;margin: 40px auto 0 auto;position:relative;',//make it expand, temporary solution
						},
						less: configs.less ? configs.less : ' ',
						themeName: configs.themeName,
					},
				});
				//close current view
				this.close();
				//overlay
				ExportName.overlay({
					effect: false
				});

			},
			'get-color': function($self, e){
				console.log('TBD'); //show copy the color name to the clipboard
			},
		},
		onClose: function(){
			//fetch cache if there is nothing configured
			if(!this.spraying){
				//go fetch what has been stored in the cache, if not configured
				var stored = app.store.get('__builder')[this.get('cacheName')];

				this.spraying = app.view({
									template: stored.template || ' ',
									data: JSON.parse(stored.data) || this.get('dataContent')
								});
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

		//------------------------- helper functions -------------------------//
		//function to collect builder's informations
		builderResult: function(){
			var builder, template, dataTab, dataContent, less, compliedLess, attribute,
				builderFlag = true, dataFlag = true, remoteFlag = false,
				allBuilders = app.store.get('__builder'),
				savedConfigs = allBuilders[this.get('cacheName')],
				theme = $('head link[rel="stylesheet"]').attr('href').split('/')[1],
				cssId = 'exported-' + this.get('cacheName');

			//fetch builder view
			try {
				builder = app.locate('Overlay.FocusedEditing.Builder').view;
			}catch(e){
				builderFlag = false;
				console.warn('Get builder view error...');
			}

			//only assign tempalte if the builder view is loaded
			if(builderFlag)
				//extract template
				template = builder.extractTemplate() || ' ';

				//extract less
				less = builder.extractLess();

				//save this less to backend, so we don't need to store in the cache in order to preserve the styling
				//only exporting less when exporting a view.
				// if(less){
				// 	app.remote({
				// 		url: 'api/saveless',
				// 		payload: {
				// 			lessString: less,
				// 			themeName: theme,

				// 		},
				// 	}).done(function(data){
				// 		console.log('less saved to the backend');
				// 	});
				// }

				//still need this, since until user reload the page, they won't able to get the new less
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

			//check whether user has configured data tab.
			try{
				dataTab = this.getViewFromTab('Data');
			}catch(e){
				dataFlag = false;
				console.warn('You have NOT assign any data.');
			}

			//only assign data if the dataTab has been loaded, otherwise try local stored data
			if(dataFlag){
				//check whether remote or not
				if(dataTab.$el.find('#remote-switch').prop('checked')){//remote
					dataContent = dataTab.get('url'); //fetch url from url editor
					//flip the flag
					remoteFlag = true;
				}else{//local
					dataContent = dataTab.aces.data.getValue(); //fetch value from ace editor
				}
			}

			if(builderFlag && template){
				//flip flag
				this.saved = true;

				//if blank data and no dataTab, then consult the data stored in local storage
				//otherwise blank data is set up by the user
				if(!dataContent && !dataFlag) {

					if(savedConfigs.data){
						//fetch data
						dataContent = savedConfigs.data;
						//fetch remote flag
						remoteFlag = savedConfigs.remoteFlag;
					}else {//really there is no data for this view
						dataContent = "{}"; //for consistency as local storage, since we need to parse later
					}

				}

				//prepare the view for spraying back
				this.spraying = app.view({
									template: template,
									data: remoteFlag ? dataContent : JSON.parse(dataContent)
								});


				//save the extracted template and data to cache for future use
				savedConfigs = _.extend(savedConfigs,
										{
											template: template,
											data: dataContent,
											cssId: cssId,
											css: compliedLess,
											remoteFlag: remoteFlag,
											less: less ? less : ' ',
											themeName: theme,
										});
				//sync with local storage
				allBuilders[this.get('cacheName')] = _.deepClone(savedConfigs);
				app.store.set('__builder', _.deepClone(allBuilders));

				return savedConfigs;
			}
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
