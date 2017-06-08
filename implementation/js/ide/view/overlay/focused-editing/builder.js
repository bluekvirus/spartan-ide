/**
 * Created by Zahra
 *
 */
;(function(app) {
	app.view('Overlay.FocusedEditing.Builder', {
		template: [
			'<div region="hanger-groups"></div>',
			'<div region="stack-groups" action="update-group"></div>',
		],
		coop: ['update-data', 'group-updated', 'group-deleted'],
		onUpdateData: function(options) {
			var cacheName = options.name,
				nameArray = cacheName.split('-');
			nameArray.shift();
			var region = nameArray.join('-');
			if (region === this.$el.parent().attr('region')) {
				this.set({
					name: options.name,
					direction: options.direction,
					stackGroups: options.newStackGroups,
					hangerGroups: options.newHangerGroups
				});
			}
		},
		actions: {
			'update-group': function($btn, e) {
				var cacheName = this.options.cacheName,
					allBuilders = app.store.get('__builder'),
					allGroups = allBuilders[cacheName];
				if (e.shiftKey) {
					//Add a Hanger group
					var hangerNumber = allGroups.hangerGroups.length,
						hangerGroupId = cacheName + '-' + hangerNumber + '-hanger-id';
					var hangerGroup = {
						template: '',
						data: '',
						less: '',
						css_container: {
							position: 'absolute',
							//-40 ~ 3em for the initial height
							top: (e.pageY - this.$el.offset().top - 40) + 'px',
							left: e.pageX - this.$el.offset().left + 'px'
						}
					};

					//Update the cache
					allGroups.hangerGroups.push(hangerGroup);
					allBuilders[cacheName] = allGroups;
					app.store.set('__builder', _.deepClone(allBuilders));

					//Spray the new hanger
					hangerGroup.name = cacheName;
					hangerGroup.hangerNumber = hangerNumber;
					var hangerGroupsDiv = this.getRegion('hanger-groups').$el;
					hangerGroupsDiv.append('<div id="' + hangerGroupId + '"></div>');
					var newHangerGroup = new HangerGroup({
						dataSource: this,
						data: hangerGroup
					});
					this.spray(('#' + hangerGroupId), newHangerGroup);
				} else {
					//Edit a stack group
					var region = this.$el.find(e.currentTarget),
						stackNumber = region.parent().parent().css('order'),
						currentStackGroup = allGroups.stackGroups[stackNumber];
					currentStackGroup.name = cacheName;
					currentStackGroup.stackNumber = stackNumber;
					//added by patrick for sliding up configuration
					app.coop('builder-group-config', {
						groupView: region.parent().data('view'),
						data: {
							type: 'stack',
							html: currentStackGroup.template,
							data: currentStackGroup.data,
							css_container: currentStackGroup.css_container,
							less: currentStackGroup.less,
							obj: currentStackGroup,
							builder: this
						}
					});
				}
			}
		},
		onReady: function() {
			var self = this,
				cacheName = this.options.cacheName,
				allBuilders = app.store.get('__builder'),
				allGroups = allBuilders[cacheName],
				currentDirection = allGroups.direction,
				stackNumber = 0,
				hangerNumber = 0;

			//Spray stack groups on the stack-groups region
			_.each(allGroups.stackGroups, function(stackGroup) {
				stackGroup.name = cacheName;
				var id = cacheName + '-' + stackNumber + '-id';
				stackGroup.stackNumber = stackNumber;
				var stackGroupsDiv = self.getRegion('stack-groups').$el;
				stackGroupsDiv.append('<div id="' + id + '"></div>');
				var newStackGroup = new StackGroup({
					dataSource: self,
					data: stackGroup
				});
				self.spray(('#' + id), newStackGroup);
				if (currentDirection === 'v') {
					if (allGroups.stackGroups.length > 1) {
						newStackGroup.$el.find('.drag-left').addClass('hidden');
						newStackGroup.$el.find('.drag-right').addClass('hidden');
						stackGroupsDiv.css({
							'flex-direction': 'column',
						});
					}
				} else if (currentDirection === 'h') {
					if (allGroups.stackGroups.length > 1) {
						newStackGroup.$el.find('.drag-top').addClass('hidden');
						newStackGroup.$el.find('.drag-bottom').addClass('hidden');
						stackGroupsDiv.css({
							'flex-direction': 'row',
						});
					}
				}
				stackNumber = stackNumber + 1;
			});

			//Spray hanger groups on the hanger-group region
			_.each(allGroups.hangerGroups, function(hangerGroup) {
				var hangerGroupId = cacheName + '-' + hangerNumber + '-hanger-id';
				hangerGroup.name = cacheName;
				hangerGroup.hangerNumber = hangerNumber;
				var hangerGroupsDiv = self.getRegion('hanger-groups').$el;
				hangerGroupsDiv.append('<div id="' + hangerGroupId + '"></div>');
				var newHangerGroup = new HangerGroup({
					dataSource: self,
					data: hangerGroup
				});
				self.spray(('#' + hangerGroupId), newHangerGroup);
				hangerNumber = hangerNumber + 1;
			});
		},
		onClose: function() {
			//Remove group and related css
			$('[id^=' + this.options.cacheName + ']').remove();
		},
		extractTemplate: function() {
			var builderName = this.options.cacheName,
				allBuilders = app.store.get('__builder'),
				groups = allBuilders[builderName],
				stackGroups = groups.stackGroups,
				hangerGroups = groups.hangerGroups,
				hangerNumber = 0,
				stackNumber = 0,
				allTemplate = $('<div></div>'),
				direction = '';
			if (groups.direction == 'h') {
				direction = 'flex-direction: row;';
			} else if (groups.direction == 'v') {
				direction = 'flex-direction: column;';
			}
			allTemplate.append('<div region="stack-groups" style="height:100%; display:flex; ' + direction + '"></div>');
			allTemplate.append('<div region="hanger-groups" style="position:absolute; top:0; left:0; height:100%; width:100%;"></div>');
			_.each(stackGroups, function(stackGroup) {
				var stackId = builderName + '-' + stackNumber + '-id',
					styleTagContent = JSON.stringify(stackGroup.css_container)
										  .replace(/\{/g, '')
										  .replace(/"/g, '')
										  .replace(/,/g, ';')
										  .replace(/\}/g, ';'),
					stackTemplate;
				if (stackGroup.data) {
					stackTemplate = '{{#' + stackGroup.data + '}}' + stackGroup.template + '{{/' + stackGroup.data + '}}';
				} else {
					stackTemplate = stackGroup.template;
				}
				var stackDiv = '<div id="' + stackId + '" style="' + styleTagContent + '">' + stackTemplate + '</div>';
				allTemplate.find('[region="stack-groups"]').append(stackDiv);
				stackNumber += 1;
			});
			_.each(hangerGroups, function(hangerGroup) {
				if (hangerGroup.template) {
					var hangerGroupId = builderName + '-' + hangerNumber + '-hanger-id',
						styleTagContent = JSON.stringify(hangerGroup.css_container)
											  .replace(/\{/g, '')
											  .replace(/"/g, '')
											  .replace(/,/g, ';')
											  .replace(/\}/g, ';'),
						hangerTemplate;
					if (hangerGroup.data) {
						hangerTemplate = '{{#' + hangerGroup.data + '}}' + hangerGroup.template + '{{/' + hangerGroup.data + '}}';
					} else {
						hangerTemplate = hangerGroup.template;
					}
					var hangerGroupDiv = '<div id="' + hangerGroupId + '" style="' + styleTagContent + '">' + hangerTemplate + '</div>';
					allTemplate.find('[region="hanger-groups"]').append(hangerGroupDiv);
				}
				hangerNumber += 1;
			});
			return allTemplate.html();
		},
		extractLess: function() {
			var builderName = this.options.cacheName,
				allBuilders = app.store.get('__builder'),
				groups = allBuilders[builderName],
				stacks = groups.stackGroups,
				hangerGroups = groups.hangerGroups,
				hangerNumber = 0,
				stackNumber = 0,
				allLess = '';
			_.each(stacks, function(stack) {
				if (stack.less) {
					var cssId = builderName + '-' + stackNumber + '-id',
						currentLess = '#' + cssId + '{' + stack.less + '}';
					allLess += currentLess;
				}
				stackNumber += 1;
			});
			_.each(hangerGroups, function(hangerGroup) {
				if (hangerGroup.less) {
					var cssId = builderName + '-' + hangerNumber + '-hanger-id',
						currentLess = '#' + cssId + '{' + hangerGroup.less + '}';
					allLess += currentLess;
				}
				hangerNumber += 1;
			});
			return allLess;
		},

		//------------------------------------------- coop events -------------------------------------------//
		//function to handle updating group event
		onGroupUpdated: function(editedObj, groupView){
			//call helper function
			this.updateGroup(editedObj, groupView);
		},
		//function to handle deleting group event
		onGroupDeleted: function(obj, type){
			//call helper function
			this.deleteGroup(obj, type);
		},

		//------------------------------------------- helper functions -------------------------------------------//
		//function to update group contents
		updateGroup: function(editedObj, groupView){
			//Reload the Stack group with the new data
			groupView.set(editedObj);
		},

		//function to delete a group
		deleteGroup: function(obj, type){
			var viewAndRegion = obj.name,
				stackNumber   = obj.stackNumber,
				hangerNumber  = obj.hangerNumber,
				allBuilders   = app.store.get('__builder'),
				cacheData     = allBuilders[viewAndRegion],
				deleteGroups  = cacheData.stackGroups,
				deleteStrings = cacheData.hangerGroups;
			//check what type of delete
			if (type === 'stack') {
				var groupId = viewAndRegion + '-' + stackNumber + '-id',
					basis = this.$el.find('#' + groupId).css('flex-basis');

				if (parseInt(stackNumber) === 0) {
					if (cacheData.stackGroups.length > 1) {
						var next = viewAndRegion + '-' + (parseInt(stackNumber) + 1) + '-id',
							nextBasis = parseInt(this.$el.find('#' + next).css('flex-basis')) + parseInt(basis);
						deleteGroups[(parseInt(stackNumber) + 1)].css_container = {
							'flex-grow': '0',
							'flex-shrink': '1',
							'flex-basis': nextBasis + '%',
						};
					}
				} else {
					var prev = viewAndRegion + '-' + (parseInt(stackNumber) - 1) + '-id',
						prevBasis = parseInt(this.$el.find('#' + prev).css('flex-basis')) + parseInt(basis);

					deleteGroups[(parseInt(stackNumber) - 1)].css_container = {
						'flex-grow': '0',
						'flex-shrink': '1',
						'flex-basis': prevBasis + '%',
					};
				}
				deleteGroups.splice(stackNumber, 1);
				cacheData.stackGroups = deleteGroups;
				var options = {
					newStackGroups: cacheData.stackGroups,
					newHangerGroups: cacheData.strings,
					direction: cacheData.direction,
					name: viewAndRegion
				};
				if (cacheData.stackGroups.length > 0) {
					allBuilders[viewAndRegion] = cacheData;
					app.store.set('__builder', _.deepClone(allBuilders));
					var cssId = viewAndRegion + '-' + stackNumber + '-css';
					this.$el.find('#' + cssId).remove();
					app.coop('update-data', options);
				}

			} else {//type === 'hanger'
				deleteStrings.splice(hangerNumber, 1);
				cacheData.hangerGroups = deleteStrings;
				var stringOptions = {
					newStackGroups: cacheData.stackGroups,
					newHangerGroups: cacheData.hangerGroups,
					direction: cacheData.direction,
					name: viewAndRegion
				};
				allBuilders[viewAndRegion] = cacheData;
				app.store.set('__builder', _.deepClone(allBuilders));
				var stringCssId = viewAndRegion + '-' + hangerNumber + '-hanger-css',
					stringId = viewAndRegion + '-' + hangerNumber + '-hanger-id';

				//Remove the string from the screen
				this.$el.find('#' + stringCssId).remove();
				this.$el.find('#' + stringId).remove();
			}
		},
	});

	var HangerGroup = app.view('HangerGroup', {
		template: [
			'<div class="ui-draggable-item drag-hanger-left"></div>',
			'<div action-click="update-hanger" region="hanger-container"></div>',
			'<div class="ui-draggable-item drag-hanger-right"></div>',
		],
		dnd: {
			drag: {
				helper: 'original'
			}
		},
		flagX: false,
		flagY: false,
		actions: {
			'update-hanger': function($btn, e) {
				//added by patrick for sliding up edit
				app.coop('builder-group-config', {
					groupView: this,
					data: {
						type: 'hanger',
						html: this.get('template'),
						data: this.get('data'),
						css_container: this.get('css_container'),
						less: this.get('less'),
						obj: this.get(),
						builder: this.parentCt
					}
				});
			}
		},
		onDragStart: function(event, ui) {
			this.initialX = parseInt(this.$el.parent().css('left'));
			this.initialY = parseInt(this.$el.parent().css('top'));
		},
		onDrag: function(event, ui) {
			this.changeX = arguments[1].position.left - arguments[1].originalPosition.left;
			this.changeY = arguments[1].position.top - arguments[1].originalPosition.top;
			this.$el.parent().css('top', this.initialY + this.changeY + 'px');
			this.$el.parent().css('left', this.initialX + this.changeX + 'px');
		},
		onDragStop: function(event, ui) {
			var viewAndRegion = this.get('name'),
				allBuilders = app.store.get('__builder'),
				allGroups = allBuilders[viewAndRegion],
				newHangerGroup = this.get();
			newHangerGroup.css_container.top = this.$el.parent().css('top');
			newHangerGroup.css_container.left = this.$el.parent().css('left');
			allGroups.hangerGroups[this.get('hangerNumber')].css_container.top = this.$el.parent().css('top');
			allGroups.hangerGroups[this.get('hangerNumber')].css_container.left = this.$el.parent().css('left');
			this.set(newHangerGroup);
			allBuilders[viewAndRegion] = allGroups;
			app.store.set('__builder', _.deepClone(allBuilders));
		},
		onReady: function() {
			//Apply content
			var viewAndRegion = this.get('name'),
				uniqueId = viewAndRegion + '-' + this.get('hangerNumber') + '-hanger',
				template = this.get('template');
			if (this.get('data')) {
				template = '{{#' + this.get('data') + '}}' + template + '{{/' + this.get('data') + '}}';
			}
			var	appliedContent = applyGroupContent(template, this.options.dataSource.options.dataSource.get());
			this.$el.find('[region="hanger-container"]').html(appliedContent);
			//Apply less
			compileLess(uniqueId, this, 'hanger-container');

			//Apply css for div container
			var hangerStyle = this.get('css_container');
			if (this.get('template')) {
				//Non-empty template-Replace new style
				this.$el.parent().removeAttr('style');
				hangerStyle['border-bottom'] = '2px dotted lightgrey';
				hangerStyle['z-index'] = '100';
			} else {
				//Nothing has been set in the template
				hangerStyle.border = '2px dotted lightgrey';
				hangerStyle['z-index'] = '100';
				hangerStyle.width = '6em';
				hangerStyle.height = '3em';
			}
			this.$el.parent().css(hangerStyle);
		}
	});

	applyGroupContent = function(template, data) {
		var theCompiledTemplate = Handlebars.compile(template),
			appliedContent = theCompiledTemplate(data);
		return appliedContent;
	};

	compileLess = function(id, reference, lockRegion) {
		var cssId = id + '-css';
		var flag = true;
		if (reference.get('less')) {
			var theme = $('head link[rel="stylesheet"]').attr('href').split('/')[1],
				lessContent = '#' + id + '-id {' + reference.get('less') + '}';
			reference.lock(lockRegion, flag, 'fa fa-spinner fa-spin fa-3x');
			flag = !flag;
			app.remote({
				url: 'api/less',
				payload: {
					less: lessContent,
					theme: theme
				}
			}).done(function(data) {
				reference.lock(lockRegion, flag, 'fa fa-spinner fa-spin fa-3x');
				$('#' + cssId).remove();
				$('head').append('<style id="' + cssId + '">' + data.msg + '</style>');
				flag = true;
			});
		} else {
			$('#' + cssId).remove();
		}
	};

	var StackGroup = app.view('StackGroup', {
		template: [
			'<div region="view-lock" action="update-group"></div>',
			'<div class="ui-draggable-item drag-top hidden"></div>',
			'<div class="ui-draggable-item drag-left hidden"></div>',
			'<div class="ui-draggable-item drag-right hidden"></div>',
			'<div class="ui-draggable-item drag-bottom hidden"></div>',
		],
		dnd: {
			drag: {
				helper: 'original'
			}
		},
		actions: {
			_bubble: true,
		},
		heightFlag: true,
		widthFlag: true,
		onDragStart: function(event, ui) {
			var id = this.$el.parent().attr('id'),
				arrayId = id.split('-'),
				currentBuilder = this.options.dataSource,
				newId;
			arrayId.pop();
			var viewAndRegion = this.get('name'),
				allBuilders = app.store.get('__builder'),
				allGroups = allBuilders[viewAndRegion],
				editStackGroup = allGroups.stackGroups,
				last = editStackGroup.length - 1,
				stackNumber = arrayId.pop(),
				stackGroups = this.$el.parent().parent();
			if (event.hasClass('drag-top')) {
				if (parseInt(stackNumber) === 0) {
					if (last === parseInt(stackNumber)) {
						allGroups.direction = 'v';
						stackGroups.css({
							'flex-direction': 'column',
						});
						allBuilders[viewAndRegion] = allGroups;
						app.store.set('__builder', _.deepClone(allBuilders));
					}
					this.$el.find('.drag-top').removeClass('hidden');
					this.$el.find('.drag-bottom').removeClass('hidden');
					$('<div id="new"></div>').insertBefore('#' + id);
				}
			} else if (event.hasClass('drag-bottom')) {
				if (parseInt(stackNumber) === last) {
					if (last === 0) {
						allGroups.direction = 'v';
						stackGroups.css({
							'flex-direction': 'column',
						});
						allBuilders[viewAndRegion] = allGroups;
						app.store.set('__builder', _.deepClone(allBuilders));
					}
					newId = viewAndRegion + '-' + (parseInt(stackNumber) + 1) + '-id';
					this.$el.find('.drag-top').removeClass('hidden');
					this.$el.find('.drag-top').removeClass('hidden');
					$('<div id="' + newId + '"></div>').insertAfter('#' + id);
				}
			} else if (event.hasClass('drag-left')) {
				if (parseInt(stackNumber) === 0) {
					if (last === parseInt(stackNumber)) {
						allGroups.direction = 'h';
						stackGroups.css({
							'flex-direction': 'row',
						});
						allBuilders[viewAndRegion] = allGroups;
						app.store.set('__builder', _.deepClone(allBuilders));
					}
					this.$el.find('.drag-left').removeClass('hidden');
					this.$el.find('.drag-right').removeClass('hidden');
					$('<div id="new"></div>').insertBefore('#' + id);
				}
			} else if (event.hasClass('drag-right')) {
				if (parseInt(stackNumber) === last) {
					if (last === 0) {
						allGroups.direction = 'h';
						stackGroups.css({
							'flex-direction': 'row',
						});
						allBuilders[viewAndRegion] = allGroups;
						app.store.set('__builder', _.deepClone(allBuilders));
					}
					newId = viewAndRegion + '-' + (parseInt(stackNumber) + 1) + '-id';
					this.$el.find('.drag-left').removeClass('hidden');
					this.$el.find('.drag-right').removeClass('hidden');
					$('<div id="' + newId + '"></div>').insertAfter('#' + id);
				}
			}
		},
		onDrag: function(event, ui) {
			var id = this.$el.parent().attr('id'),
				arrayId = id.split('-'),
				currentBuilder = this.options.dataSource,
				newId;
			arrayId.pop();
			var viewAndRegion = this.get('name'),
				allBuilders = app.store.get('__builder'),
				allGroups = allBuilders[viewAndRegion],
				stackGroups = allGroups.stackGroups,
				last = stackGroups.length - 1;
			stackNumber = arrayId.pop();
			if (event.hasClass('drag-bottom')) {
				if (this.heightFlag) {
					this.initialHeight = this.$el.height();
					this.initialBasis = parseInt(this.$el.parent().css('flex-basis'));
				}
				this.change = arguments[1].originalPosition.top - arguments[1].position.top;
				var newBottomHeight = parseInt(this.change / this.initialHeight * this.initialBasis);
				var bottomHeight = this.initialBasis - newBottomHeight;
				this.$el.parent().css('flex', '0 1 ' + bottomHeight + '%');
				if (parseInt(stackNumber) === last) {
					newId = viewAndRegion + '-' + (parseInt(stackNumber) + 1) + '-id';
					if (this.heightFlag) {
						this.heightFlag = false;
					}
					currentBuilder.$el.find('#' + newId).css('order', (parseInt(stackNumber) + 1));
					currentBuilder.$el.find('#' + newId).css('flex', '0 1 ' + newBottomHeight + '%');
				} else {
					var currentIdBottom = this.$el.parent().attr('id');
					var nextBottom = currentBuilder.$el.find('#' + currentIdBottom).next();
					if (this.heightFlag) {
						this.nextBasis = parseInt(nextBottom.css('flex-basis'));
						this.heightFlag = false;
					}
					var newNextHeightBottom = newBottomHeight + this.nextBasis;
					nextBottom.css('flex', '0 1 ' + newNextHeightBottom + '%');
				}
			} else if (event.hasClass('drag-top')) {
				if (this.heightFlag) {
					this.initialHeight = this.$el.height();
					this.initialBasis = parseInt(this.$el.parent().css('flex-basis'));
				}
				this.change = arguments[1].position.top - arguments[1].originalPosition.top;
				var newTopHeight = parseInt(this.change / this.initialHeight * this.initialBasis);
				var newHeight = this.initialBasis - newTopHeight;
				this.$el.parent().css('flex', '0 1 ' + newHeight + '%');
				if (parseInt(stackNumber) === 0) {
					if (this.heightFlag) {
						this.heightFlag = false;
					}
					currentBuilder.$el.find('#new').css('flex', '0 1 ' + newTopHeight + '%');
					this.$el.parent().css('flex', '0 1 ' + newHeight + '%');
				} else {
					var currentId = this.$el.parent().attr('id');
					var prev = currentBuilder.$el.find('#' + currentId).prev();
					if (this.heightFlag) {
						this.prevBasis = parseInt(prev.css('flex-basis'));
						this.heightFlag = false;
					}
					var prevHeight = newTopHeight + this.prevBasis;
					prev.css('flex', '0 1 ' + prevHeight + '%');
				}
			} else if (event.hasClass('drag-left')) {
				if (this.widthFlag) {
					this.initialWidth = this.$el.width();
					this.initialBasis = parseInt(this.$el.parent().css('flex-basis'));
				}
				this.change = arguments[1].position.left - arguments[1].originalPosition.left;
				var newLeftWidth = parseInt(this.change / this.initialWidth * this.initialBasis);
				var newWidth = this.initialBasis - newLeftWidth;
				this.$el.parent().css('flex', '0 1 ' + newWidth + '%');
				if (parseInt(stackNumber) === 0) {
					if (this.widthFlag) {
						this.widthFlag = false;
					}
					currentBuilder.$el.find('#new').css('flex', '0 1 ' + newLeftWidth + '%');
				} else {
					var currentLeftId = this.$el.parent().attr('id');
					var prevLeft = currentBuilder.$el.find('#' + currentLeftId).prev();
					if (this.widthFlag) {
						this.prevBasis = parseInt(prevLeft.css('flex-basis'));
						this.widthFlag = false;
					}
					var prevWidth = newLeftWidth + this.prevBasis;
					prevLeft.css('flex', '0 1 ' + prevWidth + '%');
				}
			} else if (event.hasClass('drag-right')) {
				if (this.widthFlag) {
					this.initialWidth = this.$el.width();
					this.initialBasis = parseInt(this.$el.parent().css('flex-basis'));
				}
				this.change = arguments[1].originalPosition.left - arguments[1].position.left;
				var newRightWidth = parseInt(this.change / this.initialWidth * this.initialBasis);
				var rightWidth = this.initialBasis - newRightWidth;
				this.$el.parent().css('flex', '0 1 ' + rightWidth + '%');
				if (parseInt(stackNumber) === last) {
					newId = viewAndRegion + '-' + (parseInt(stackNumber) + 1) + '-id';
					if (this.widthFlag) {
						this.widthFlag = false;
					}
					currentBuilder.$el.find('#' + newId).css('order', (parseInt(stackNumber) + 1));
					currentBuilder.$el.find('#' + newId).css('flex', '0 1 ' + newRightWidth + '%');
				} else {
					var currentRightId = this.$el.parent().attr('id');
					var nextRight = currentBuilder.$el.find('#' + currentRightId).next();
					if (this.widthFlag) {
						this.nextBasis = parseInt(nextRight.css('flex-basis'));
						this.widthFlag = false;
					}
					var newNextWidthRight = newRightWidth + this.nextBasis;
					nextRight.css('flex', '0 1 ' + newNextWidthRight + '%');
				}
			}
		},
		onDragStop: function(event, ui) {
			var currentId = this.$el.parent().attr('id'),
				currentBuilder = this.options.dataSource,
				prev = currentBuilder.$el.find('#' + currentId).prev(),
				next = currentBuilder.$el.find('#' + currentId).next();
			this.$el.find('.drag-top').css('left', '50%');
			this.$el.find('.drag-bottom').css('left', '50%');
			this.$el.find('.drag-left').css('top', '50%');
			this.$el.find('.drag-right').css('top', '50%');
			this.initialHeight = parseInt(this.$el.css('height'));
			this.initialWidth = parseInt(this.$el.css('width'));
			this.initialBasis = parseInt(this.$el.parent().css('flex-basis'));
			this.heightFlag = true;
			this.widthFlag = true;
			this.prevBasis = parseInt(prev.css('flex-basis'));
			this.nextBasis = parseInt(next.css('flex-basis'));
			var id = this.$el.parent().attr('id'),
				arrayId = id.split('-'),
				position = 'middle',
				newId;
			arrayId.pop();
			var viewAndRegion = this.get('name'),
				allBuilders = app.store.get('__builder'),
				allGroups = allBuilders[viewAndRegion],
				editStackGroup = allGroups.stackGroups,
				last = editStackGroup.length - 1;
			stackNumber = arrayId.pop();
			var newData = {
				template: '',
				data: '',
				less: '',
				css_container: {
					'flex-grow': '0',
					'flex-shrink': '1',
					'flex-basis': currentBuilder.$el.find('#new').css('flex-basis'),
				}
			};
			var editedData = {
				template: editStackGroup[parseInt(stackNumber)].template,
				data: editStackGroup[parseInt(stackNumber)].data,
				less: editStackGroup[parseInt(stackNumber)].less,
				css_container: {
					'flex-grow': '0',
					'flex-shrink': '1',
					'flex-basis': this.$el.parent().css('flex-basis'),
				}
			};
			if (event.hasClass('drag-bottom')) {
				if (parseInt(stackNumber) === last) {
					position = 'end';
				} else {
					position = 'next';
				}
			}
			if (event.hasClass('drag-right')) {
				if (parseInt(stackNumber) === last) {
					position = 'end';
				} else {
					position = 'next';
				}
			}
			if (event.hasClass('drag-top')) {
				if (parseInt(stackNumber) === 0) {
					position = 'start';
					editStackGroup.shift();
					editStackGroup.unshift(editedData);
					editStackGroup.unshift(newData);
				} else {
					position = 'prev';
				}
			}
			if (event.hasClass('drag-left')) {
				if (parseInt(stackNumber) === 0) {
					position = 'start';
					editStackGroup.shift();
					editStackGroup.unshift(editedData);
					editStackGroup.unshift(newData);
				} else {
					position = 'prev';
				}
			}
			if (position === 'prev') {
				//Update the current Stack group
				editStackGroup[parseInt(stackNumber)].css_container = {
					'flex-grow': '0',
					'flex-shrink': '1',
					'flex-basis': this.$el.parent().css('flex-basis'),
				};

				//Update the previous Stack group
				editStackGroup[parseInt(stackNumber) - 1].css_container = {
					'flex-grow': '0',
					'flex-shrink': '1',
					'flex-basis': this.prevBasis + '%',
				};

				//Update the cache
				allGroups.stackGroups = editStackGroup;
				allBuilders[viewAndRegion] = allGroups;
				app.store.set('__builder', _.deepClone(allBuilders));

				editedData.stackNumber = this.get('stackNumber');
				editedData.name = this.get('name');
				this.set(editedData);

				var prevId = this.get('name') + '-' + (parseInt(this.get('stackNumber')) - 1) + '-id';
				var prevObj = editStackGroup[parseInt(stackNumber) - 1];
				prevObj.stackNumber = parseInt(this.get('stackNumber')) - 1;
				prevObj.name = this.get('name');
				this.parentCt.$el.find('#' + prevId + ' .regional-stackgroup').data('view').set(prevObj);
			} else if (position === 'next') {
				//Update the current Stack group
				editStackGroup[parseInt(stackNumber)].css_container = {
					'flex-grow': '0',
					'flex-shrink': '1',
					'flex-basis': this.$el.parent().css('flex-basis'),
				};

				//Update the next Stack group
				editStackGroup[parseInt(stackNumber) + 1].css_container = {
					'flex-grow': '0',
					'flex-shrink': '1',
					'flex-basis': this.nextBasis + '%',
				};

				//Update the cache
				allGroups.stackGroups = editStackGroup;
				allBuilders[viewAndRegion] = allGroups;
				app.store.set('__builder', _.deepClone(allBuilders));

				editedData.stackNumber = this.get('stackNumber');
				editedData.name = this.get('name');
				this.set(editedData);

				var nextId = this.get('name') + '-' + (parseInt(this.get('stackNumber')) + 1) + '-id';
				var nextObj = editStackGroup[parseInt(stackNumber) + 1];

				nextObj.stackNumber = parseInt(this.get('stackNumber')) + 1;
				nextObj.name = this.get('name');
				this.parentCt.$el.find('#' + nextId + ' .regional-stackgroup').data('view').set(nextObj);
			} else if (position === 'end') {
				newId = this.get('name') + '-' + (parseInt(this.get('stackNumber')) + 1) + '-id';
				//Dragging from end and adding a new stack group to the end
				editStackGroup = editStackGroup.slice(0, -1);
				editStackGroup.push(editedData);
				newData.css_container['flex-basis'] = currentBuilder.$el.find('#' + newId).css('flex-basis');
				editStackGroup.push(newData);

				//Update the cache
				allGroups.stackGroups = editStackGroup;
				allBuilders[viewAndRegion] = allGroups;
				app.store.set('__builder', _.deepClone(allBuilders));

				//Update the current Stack group with the updated height
				editedData.stackNumber = this.get('stackNumber');
				editedData.name = this.get('name');
				newData.stackNumber = parseInt(this.get('stackNumber')) + 1;
				newData.name = this.get('name');
				this.set(editedData);

				//Spray the new Stack group
				var newStackGroup = new StackGroup({
					dataSource: this.options.dataSource,
					data: newData
				});
				this.parentCt.spray(('#' + newId), newStackGroup);
			} else if (position === 'start') {
				//Update the cache
				allGroups.stackGroups = editStackGroup;
				allBuilders[viewAndRegion] = allGroups;
				app.store.set('__builder', _.deepClone(allBuilders));

				//coop for adding to the beginning
				var options = {
					newStackGroups: editStackGroup,
					newHangerGroups: allGroups.hangerGroups,
					direction: allGroups.direction,
					name: this.get('name')
				};
				app.coop('update-data', options);
			}
		},
		onReady: function() {
			var viewAndRegion = this.get('name'),
				allBuilders = app.store.get('__builder'),
				allGroups = allBuilders[viewAndRegion],
				uniqueId = viewAndRegion + '-' + this.get('stackNumber'),
				template = this.get('template'),
				currentBuilder = this.options.dataSource;

			//Display the content
			if (this.get('data')) {
				template = '{{#' + this.get('data') + '}}' + template + '{{/' + this.get('data') + '}}';
			}
			var appliedContent = applyGroupContent(template, this.options.dataSource.options.dataSource.get());
			this.$el.find('[region="view-lock"]').html(appliedContent);
			this.$el.parent().css({
				'order': this.get('stackNumber'),
			});

			//Locate the flex item
			if (this.get('css_container')) {
				currentBuilder.$el.find('#' + uniqueId + '-id').css(this.get('css_container'));
			}

			//Apply less
			compileLess(uniqueId, this, 'view-lock');

			//Remove extra handles
			if (allGroups.stackGroups.length === 1) {
				allGroups.direction = '';
				this.$el.find('.drag-top').removeClass('hidden');
				this.$el.find('.drag-bottom').removeClass('hidden');
				this.$el.find('.drag-left').removeClass('hidden');
				this.$el.find('.drag-right').removeClass('hidden');
			}
			if (allGroups.direction === 'v') {
				this.$el.find('.drag-top').removeClass('hidden');
				this.$el.find('.drag-bottom').removeClass('hidden');
			} else if (allGroups.direction === 'h') {
				this.$el.find('.drag-left').removeClass('hidden');
				this.$el.find('.drag-right').removeClass('hidden');
			}
		}
	});
})(Application);
