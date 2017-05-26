;(function(app) {
    app.view('Overlay.FocusedEditing.Builder', {
        template: [
            '<div region="string"></div>',
            '<div action="update-group" region="group"></div>',
        ],
        coop: ['update-data'],
        onUpdateData: function(options) {
            var ViewAndRegion = options.name,
                nameArray = ViewAndRegion.split('-');
            nameArray.shift();
            var region = nameArray.join('-');
            if (region === this.$el.parent().attr('region')) {
                //TODO: empty array remove existing view
                this.set({
                    name: options.name,
                    direction: options.direction,
                    groups: options.newGroups,
                    strings: options.newStrings
                });
            }
        },
        actions: {
            'update-group': function($btn, e) {
                var allGroups = app.store.get(this.get('name')),
                    viewAndRegion = this.get('name');
                if (e.shiftKey) {
                    var stringNumber = allGroups.strings.length;
                    var stringId = viewAndRegion + '-' + stringNumber + '-string-id';
                    var string = {
                        template: '',
                        data: '',
                        less: '',
                        css_container: {
                            position: 'absolute',
                            top: parseInt((e.pageY - this.$el.offset().top) / this.$el.height() * 100) + '%',
                            left: parseInt((e.pageX - this.$el.offset().left) / this.$el.width() * 100) + '%',
                            width: '6em',
                            height: '3em',
                            'background-color': 'lightgrey',
                            'border-bottom': '2px dotted black'
                        }
                    };
                    string.name = this.get('name');
                    string.stringNumber = stringNumber;
                    var stringsDiv = this.getRegion('string').$el;
                    stringsDiv.append('<div id="' + stringId + '"></div>');
                    var newString = new StringView({ data: string });
                    this.spray($('#' + stringId), newString);
                    allGroups.strings.push(string);
                    app.store.set(viewAndRegion, allGroups);
                } else {
                    var groupNumber = $(e.currentTarget).parent().parent().parent().css('order'),
                        currentGroup = allGroups.groups[groupNumber];
                    currentGroup.name = this.get('name');
                    currentGroup.groupNumber = groupNumber;
                    (new PopOver({
                        data: {
                            type: 'group',
                            html: currentGroup.template,
                            data: currentGroup.data,
                            css_container: currentGroup.css_container,
                            less: currentGroup.less,
                            obj: currentGroup
                        }
                    })).popover($(e.currentTarget), { placement: 'top', bond: this, style: { width: '600px' } });
                }
            },
            'change-direction': function() {
                var groups = this.getRegion('group').$el,
                    currenctDirection = this.getEditor('direction').getVal();
                if (currenctDirection === 'v') {
                    this.$el.find('.drag-bottom').removeClass('hide');
                    this.$el.find('.drag-top').removeClass('hide');
                    this.$el.find('.drag-left').addClass('hide');
                    this.$el.find('.drag-right').addClass('hide');
                    groups.css({
                        'flex-direction': 'column',
                    });
                } else {
                    this.$el.find('.drag-bottom').addClass('hide');
                    this.$el.find('.drag-top').addClass('hide');
                    this.$el.find('.drag-left').removeClass('hide');
                    this.$el.find('.drag-right').removeClass('hide');
                    groups.css({
                        'flex-direction': 'row',
                    });
                }
                var name = this.get('name').split('/'),
                    viewAndRegion = name[0],
                    allGroups = app.store.get(viewAndRegion),
                    direction = 'direction';
                allGroups.direction = currenctDirection;
                app.store.set(viewAndRegion, allGroups);
            }
        },
        onReady: function() {
            console.log('here');
            var self = this,
                allGroups = app.store.get(this.get('name')),
                viewAndRegion = this.get('name'),
                currentDirection = allGroups.direction,
                groupNumber = 0,
                stringNumber = 0;
            _.each(allGroups.groups, function(group) {
                var id = viewAndRegion + '-' + groupNumber + '-id';
                group.name = self.get('name');
                group.groupNumber = groupNumber;
                var groupsDiv = self.getRegion('group').$el;
                groupsDiv.append('<div id="' + id + '"></div>');
                var newGroup = new Group({ data: group });
                self.spray($('#' + id), newGroup);
                if (currentDirection === 'v') {
                    newGroup.$el.find('.drag-left').addClass('hide');
                    newGroup.$el.find('.drag-right').addClass('hide');
                    groupsDiv.css({
                        'flex-direction': 'column',
                    });
                } else if (currentDirection === 'h') {
                    newGroup.$el.find('.drag-top').addClass('hide');
                    newGroup.$el.find('.drag-bottom').addClass('hide');
                    groupsDiv.css({
                        'flex-direction': 'row',
                    });
                }
                groupNumber = groupNumber + 1;
            });
            _.each(allGroups.strings, function(string) {
                var stringId = viewAndRegion + '-' + stringNumber + '-string-id';
                string.name = self.get('name');
                string.stringNumber = stringNumber;
                var stringsDiv = self.getRegion('string').$el;
                stringsDiv.append('<div id="' + stringId + '"></div>');
                var newString = new StringView({ data: string });
                self.spray($('#' + stringId), newString);
                stringNumber = stringNumber + 1;
            });
        },
        onClose: function() {
            $('[id^=' + this.get('name') + ']').remove();
        },
        extractTemplate: function() {
            var builderName = this.get('name'),
                groups = app.store.get(builderName),
                stacks = groups.groups,
                strings = groups.strings,
                stringNumber = 0,
                stackNumber = 0,
                allTemplate = $('<div></div>'),
                direction = '';
            if (groups.direction == 'h') {
                direction = 'flex-direction: row;';
            } else if (groups.direction == 'v') {
                direction = 'flex-direction: column;';
            }
            allTemplate.append('<div region="string"></div>');
            allTemplate.append('<div region="group" style="' + direction + '"></div>');
            _.each(stacks, function(stack) {
                if (stack.template) {
                    var stackId = builderName + '-' + stackNumber + '-id',
                        style = $('#' + stackId).attr('style'),
                        stackDiv = '<div id ="' + stackId + '" style="' + style + '">' + stack.template + '</div>';
                    if (stack.data) {
                        stackDiv = '{{#' + stack.data + '}}' + $(stackDiv).get(0).outerHTML + '{{/' + stack.data + '}}';
                    }
                    allTemplate.find('[region="group"]').append(stackDiv);
                }
                stackNumber += 1;
            });
            _.each(strings, function(string) {
                if (string.template) {
                    var stringId = builderName + '-' + stringNumber + '-string-id',
                        style = $('#' + stringId).attr('style'),
                        stringDiv = '<div id ="' + stringId + '" style="' + style + '">' + string.template + '</div>';
                    if (string.data) {
                        stringDiv = '{{#' + string.data + '}}' + $(stringDiv).get(0).outerHTML + '{{/' + string.data + '}}';
                    }
                    allTemplate.find('[region="string"]').append(stringDiv);
                }
                stringNumber += 1;
            });
            return allTemplate.html();
        },
        extractLess: function() {
            var builderName = this.get('name'),
                groups = app.store.get(builderName),
                stacks = groups.groups,
                strings = groups.strings,
                stringNumber = 0,
                stackNumber = 0,
                allLess = '';
            _.each(stacks, function(stack) {
                if (stack.less) {
                    var cssId = builderName + '-' + stackNumber + '-css',
                        currentLess = '#' + cssId + '{' + stack.less + '}';
                    allLess += currentLess;
                }
                stackNumber += 1;
            });
            _.each(strings, function(string) {
                if (string.less) {
                    var cssId = builderName + '-' + stringNumber + '-string-css',
                        currentLess = '#' + cssId + '{' + string.less + '}';
                    allLess += currentLess;
                }
                stringNumber += 1;
            });
            return allLess;
        }
    });

    var StringView = app.view('StringView', {
        template: [
            '<div action-click="edit-string" region="string-container">{{{template}}}</div>',
        ],
        actions: {
            'edit-string': function($btn, e) {
                (new PopOver({
                    data: {
                        type: 'string',
                        html: this.get('template'),
                        data: this.get('data'),
                        css_container: this.get('css_container'),
                        less: this.get('less'),
                        obj: this.get()
                    }
                })).popover($btn, { placement: 'top', bond: this, style: { width: '600px' } });
            }
        },
        onReady: function() {
            var viewAndRegion = this.get('name'),
                uniqueId = viewAndRegion + '-' + this.get('stringNumber');
            if (this.get('less')) {
                var theme = $('head link[rel="stylesheet"]').attr('href').split('/')[1],
                    less = '#' + uniqueId + '-string-id {' + this.get('less') + '}',
                    self = this;
                if (self.flag === undefined) {
                    self.flag = true;
                }
                self.lock('string-container', self.flag, 'fa fa-spinner fa-spin fa-3x');
                self.flag = !self.flag;
                app.remote({
                    url: 'api/less',
                    payload: {
                        less: less,
                        theme: theme
                    }
                }).done(function(data) {
                    self.lock('string-container', self.flag, 'fa fa-spinner fa-spin fa-3x');
                    var uniqueCSS = uniqueId + '-string-css';
                    $('#' + uniqueCSS).remove();
                    $('head').append('<style id="' + uniqueCSS + '">' + data.msg + '</style>');
                });
            } else {
                var uniqueCSS = uniqueId + '-css';
                $('#' + uniqueCSS).remove();
            }
            if (this.get('css_container')) {
                $('#' + uniqueId + '-string-id').css(this.get('css_container'));
                if (typeof this.get('stringNumber') !== 'undefined' && this.get('template')) {
                    this.$el.parent().css({ 'height': '', 'width': '', 'background-color': '' });
                }
            }
        }
    });

    var Group = app.view('Group', {
        template: [
            '<div region="content"></div>',
            '<div class="ui-draggable-item drag-top"></div>',
            '<div class="ui-draggable-item drag-left"></div>',
            '<div class="ui-draggable-item drag-right"></div>',
            '<div class="ui-draggable-item drag-bottom"></div>',
        ],
        dnd: {
            drag: {
                helper: 'original'
            }
        },
        heightFlag: true,
        widthFlag: true,
        onDrag: function(event, ui) {
            var id = this.$el.parent().attr('id');
            var arrayId = id.split('-');
            arrayId.pop();
            var viewAndRegion = this.get('name'),
                allGroups = app.store.get(viewAndRegion),
                addGroup = allGroups.groups,
                last = addGroup.length - 1;
            groupNumber = arrayId.pop();
            if (event.hasClass('drag-bottom')) {
                if (this.heightFlag) {
                    this.initialHeight = this.$el.height();
                    this.initialBasis = parseInt(this.$el.parent().css('flex-basis'));
                }
                var newBottomHeight = parseInt(this.change / this.initialHeight * this.initialBasis);
                this.change = arguments[1].originalPosition.top - arguments[1].position.top;
                var bottomHeight = this.initialBasis - newBottomHeight;
                this.$el.parent().css('flex', '0 1 ' + bottomHeight + '%');
                if (parseInt(groupNumber) === last) {
                    if (this.heightFlag) {
                        this.heightFlag = false;
                    }
                    $('#new').css('flex', '0 1 ' + newBottomHeight + '%');
                } else {
                    var currentIdBottom = this.$el.parent().attr('id');
                    var nextBottom = $('#' + currentIdBottom).next();
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
                if (parseInt(groupNumber) === 0) {
                    if (this.heightFlag) {
                        this.heightFlag = false;
                    }
                    $('#new').css('flex', '0 1 ' + newTopHeight + '%');
                    this.$el.parent().css('flex', '0 1 ' + newHeight + '%');
                } else {
                    var currentId = this.$el.parent().attr('id');
                    var prev = $('#' + currentId).prev();
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
                if (parseInt(groupNumber) === 0) {
                    if (this.widthFlag) {
                        this.widthFlag = false;
                    }
                    $('#new').css('flex', '0 1 ' + newLeftWidth + '%');
                } else {
                    var currentLeftId = this.$el.parent().attr('id');
                    var prevLeft = $('#' + currentLeftId).prev();
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
                var newRightWidth = parseInt(this.change / this.initialWidth * this.initialBasis);
                this.change = arguments[1].originalPosition.left - arguments[1].position.left;
                var rightWidth = this.initialBasis - newRightWidth;
                this.$el.parent().css('flex', '0 1 ' + rightWidth + '%');
                if (parseInt(groupNumber) === last) {
                    if (this.widthFlag) {
                        this.widthFlag = false;
                    }
                    $('#new').css('flex', '0 1 ' + newRightWidth + '%');
                } else {
                    var currentIdRight = this.$el.parent().attr('id');
                    var nextRight = $('#' + currentIdRight).next();
                    if (this.widthFlag) {
                        this.nextBasis = parseInt(nextRight.css('flex-basis'));
                        this.widthFlag = false;
                    }
                    var newNextWidthRight = newRightWidth + this.nextBasis;
                    nextRight.css('flex', '0 1 ' + newNextWidthRight + '%');
                }
            }
        },
        onDragStart: function(event, ui) {
            var id = this.$el.parent().attr('id'),
                arrayId = id.split('-');
            arrayId.pop();
            var viewAndRegion = this.get('name'),
                allGroups = app.store.get(viewAndRegion),
                addGroup = allGroups.groups,
                last = addGroup.length - 1,
                groupNumber = arrayId.pop(),
                groups = this.$el.parent().parent();
            if (event.hasClass('drag-top')) {
                if (parseInt(groupNumber) === 0) {
                    if (last === parseInt(groupNumber)) {
                        allGroups.direction = 'v';
                        groups.css({
                            'flex-direction': 'column',
                        });
                        app.store.set(viewAndRegion, allGroups);
                    }
                    this.$el.find('.drag-left').hide();
                    this.$el.find('.drag-right').hide();
                    $('<div id="new"></div>').insertBefore('#' + id);
                }
            } else if (event.hasClass('drag-bottom')) {
                if (parseInt(groupNumber) === last) {
                    if (last === 0) {
                        allGroups.direction = 'v';
                        groups.css({
                            'flex-direction': 'column',
                        });
                        app.store.set(viewAndRegion, allGroups);
                    }
                    this.$el.find('.drag-left').hide();
                    this.$el.find('.drag-right').hide();
                    $('<div id="new"></div>').insertAfter('#' + id);
                }
            } else if (event.hasClass('drag-left')) {
                if (parseInt(groupNumber) === 0) {
                    if (last === parseInt(groupNumber)) {
                        allGroups.direction = 'h';
                        groups.css({
                            'flex-direction': 'row',
                        });
                        app.store.set(viewAndRegion, allGroups);
                    }
                    this.$el.find('.drag-top').hide();
                    this.$el.find('.drag-bottom').hide();
                    $('<div id="new"></div>').insertBefore('#' + id);
                }
            } else if (event.hasClass('drag-right')) {
                if (parseInt(groupNumber) === last) {
                    if (last === 0) {
                        allGroups.direction = 'h';
                        groups.css({
                            'flex-direction': 'row',
                        });
                        app.store.set(viewAndRegion, allGroups);
                    }
                    this.$el.find('.drag-top').hide();
                    this.$el.find('.drag-bottom').hide();
                    $('<div id="new"></div>').insertAfter('#' + id);
                }
            }
        },
        onDragStop: function(event, ui) {
            var currentId = this.$el.parent().attr('id');
            var prev = $('#' + currentId).prev();
            var next = $('#' + currentId).next();
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
                position = 'middle';
            arrayId.pop();
            var viewAndRegion = this.get('name'),
                allGroups = app.store.get(viewAndRegion),
                addGroup = allGroups.groups,
                last = addGroup.length - 1;
            groupNumber = arrayId.pop();
            var newData = {
                template: '',
                data: '',
                less: '',
                css_container: {
                    'flex-grow': '0',
                    'flex-shrink': '1',
                    'flex-basis': $('#new').css('flex-basis'),
                }
            };
            var editedData = {
                template: addGroup[parseInt(groupNumber)].template,
                data: addGroup[parseInt(groupNumber)].data,
                less: addGroup[parseInt(groupNumber)].less,
                css_container: {
                    'flex-grow': '0',
                    'flex-shrink': '1',
                    'flex-basis': this.$el.parent().css('flex-basis'),
                }
            };
            if (event.hasClass('drag-bottom')) {
                if (parseInt(groupNumber) === last) {
                    addGroup = addGroup.slice(0, -1);
                    addGroup.push(editedData);
                    addGroup.push(newData);
                } else {
                    position = 'next';
                }
            }
            if (event.hasClass('drag-right')) {
                if (parseInt(groupNumber) === last) {
                    addGroup = addGroup.slice(0, -1);
                    addGroup.push(editedData);
                    addGroup.push(newData);
                } else {
                    position = 'next';
                }
            }
            if (event.hasClass('drag-top')) {
                if (parseInt(groupNumber) === 0) {
                    addGroup.shift();
                    addGroup.unshift(editedData);
                    addGroup.unshift(newData);
                } else {
                    position = 'prev';
                }
            }
            if (event.hasClass('drag-left')) {
                if (parseInt(groupNumber) === 0) {
                    addGroup.shift();
                    addGroup.unshift(editedData);
                    addGroup.unshift(newData);
                } else {
                    position = 'prev';
                }
            }
            if (position === 'prev') {
                addGroup[parseInt(groupNumber)].css_container = {
                    'flex-grow': '0',
                    'flex-shrink': '1',
                    'flex-basis': this.$el.parent().css('flex-basis'),
                };
                addGroup[parseInt(groupNumber) - 1].css_container = {
                    'flex-grow': '0',
                    'flex-shrink': '1',
                    'flex-basis': this.prevBasis + '%',
                };
            } else if (position === 'next') {
                addGroup[parseInt(groupNumber)].css_container = {
                    'flex-grow': '0',
                    'flex-shrink': '1',
                    'flex-basis': this.$el.parent().css('flex-basis'),
                };
                addGroup[parseInt(groupNumber) + 1].css_container = {
                    'flex-grow': '0',
                    'flex-shrink': '1',
                    'flex-basis': this.nextBasis + '%',
                };
            }
            allGroups.groups = addGroup;
            var options = {
                newGroups: allGroups.groups,
                direction: allGroups.direction,
                name: this.get('name')
            };
            app.store.set(viewAndRegion, allGroups);
            var cssId = viewAndRegion + '-' + groupNumber + '-css';
            $('#' + cssId).remove();
            app.coop('update-data', options);
        },
        onReady: function() {
            var theTemplateScript = this.get('template'),
                inputData = this.get('data'),
                //TODO: get the data here
                //  jsonData = (inputData === '') ? '' : JSON.parse(inputData),
                preCompiledTemplateScript;
            if (Array.isArray(inputData)) {
                preCompiledTemplateScript = '{{#each .}}' + theTemplateScript + '{{/each}}';
            } else {
                preCompiledTemplateScript = theTemplateScript;
            }
            var theTemplate = Handlebars.compile(preCompiledTemplateScript),
                theCompiledHTML = theTemplate(inputData),
                contentData = {
                    element: theCompiledHTML,
                    obj: this.get()
                };
            this.show('content', Content, {
                data: contentData
            });
            this.$el.css({
                'order': this.get('groupNumber'),
            });
            this.$el.find('.drag-top').css('left', '50%', 'important');
            this.$el.find('.drag-bottom').css('left', '50%', 'important');
            this.$el.find('.drag-left').css('top', '50%', 'important');
            this.$el.find('.drag-right').css('top', '50%', 'important');
        }
    });

    var Content = app.view({
        template: [
            '<div region="view-lock" action="update-group">{{{element}}}</div>',
        ],
        actions: {
            _bubble: true,
        },
        onReady: function() {
            var viewAndRegion = this.get('obj').name,
                uniqueId = viewAndRegion + '-' + this.get('obj').groupNumber;
            if (this.get('obj').less) {
                this.$el.attr('id', uniqueId);
                var theme = $('head link[rel="stylesheet"]').attr('href').split('/')[1],
                    less = '#' + uniqueId + '-id {' + this.get('obj').less + '}',
                    self = this;
                if (self.flag === undefined) {
                    self.flag = true;
                }
                self.lock('view-lock', self.flag, 'fa fa-spinner fa-spin fa-3x');
                self.flag = !self.flag;
                app.remote({
                    url: 'api/less',
                    payload: {
                        less: less,
                        theme: theme
                    }
                }).done(function(data) {
                    self.lock('view-lock', self.flag, 'fa fa-spinner fa-spin fa-3x');
                    var uniqueCSS = uniqueId + '-css';
                    $('#' + uniqueCSS).remove();
                    $('head').append('<style id="' + uniqueCSS + '">' + data.msg + '</style>');
                });
            } else {
                var uniqueCSS = uniqueId + '-css';
                $('#' + uniqueCSS).remove();
            }
            if (this.get('obj').css_container) {
                $('#' + uniqueId + '-id').css(this.get('obj').css_container);
            }
        }
    });

    var PopOver = app.view({
        template: [
            '<div class="col-md-12">',
            '<div class="row">',
            '<div class="form form-horizontal">',
            '<ul class="nav nav-tabs">',
            '<li activate="single" tabid="html"><a>html</a></li>',
            '<li activate="single" tabid="less"><a>less</a></li>',
            '</ul>',
            '<div region="tabs"></div>',
            '<div editor="data"></div>',
            '</div>',
            '</div>',
            '</div>',
            '<div class="row">',
            '<span class="btn btn-primary" action-click="submit">Apply</span>',
            '<span class="btn btn-info btn-outline" action-click="cancel">Cancel</span>',
            '<span class="btn btn-danger delete-group" action-click="delete">Delete</span>',
            '</div>'
        ],
        onItemActivated: function($item) {
            var tabid = $item.attr('tabid');
            this.tab('tabs', app.view({
                template: ['<div editor="code"></div>'],
                useParentData: tabid,
                editors: {
                    code: {
                        value: this.get(tabid),
                        label: tabid,
                        type: 'textarea',
                        placeholder: tabid,
                        validate: {
                            required: true
                        }
                    }
                }
            }), tabid);
        },
        editors: {
            data: {
                label: 'Data Key',
                type: 'text',
                placeholder: 'Data Key'
            }
        },
        actions: {
            submit: function() {
                if (this.getViewIn('tabs').$el.find('[region="tab-html"] [editor="code"] textarea').val()) {
                    //HTML field is not empty
                    var obj = this.get('obj'),
                        viewAndRegion = obj.name,
                        direction = 'direction',
                        editedObj = {
                            template: this.getViewIn('tabs').$el.find('[region="tab-html"] [editor="code"] textarea').val(),
                            data: this.getEditor('data').getVal(),
                            less: this.getViewIn('tabs').$el.find('[region="tab-less"] [editor="code"] textarea').val(),
                            css_container: obj.css_container
                        };
                    var allGroups = app.store.get(viewAndRegion),
                        editedSObj = {
                            template: this.getViewIn('tabs').$el.find('[region="tab-html"] [editor="code"] textarea').val(),
                            data: this.getEditor('data').getVal(),
                            less: this.getViewIn('tabs').$el.find('[region="tab-less"] [editor="code"] textarea').val(),
                            css_container: obj.css_container
                        };
                    if (this.get('type') === 'group') {
                        var editRegionGroups = allGroups.groups,
                            groupNumber = obj.groupNumber;
                        editRegionGroups[groupNumber] = editedObj;
                        allGroups.groups = editRegionGroups;
                    } else if (this.get('type') === 'string') {
                        var editRegionStrings = allGroups.strings,
                            stringNumber = obj.stringNumber;
                        editRegionStrings[stringNumber] = editedObj;
                        allGroups.strings = editRegionStrings;
                    }
                    var options = {
                        newGroups: allGroups.groups,
                        newStrings: allGroups.strings,
                        direction: allGroups.direction,
                        name: obj.name
                    };
                    app.store.set(viewAndRegion, allGroups);
                    this.close();
                    app.coop('update-data', options);
                } else {
                    console.log('heeerE?');
                    //TODO: Why this is undefined?
                    //console.log('tabs, ', this.getViewIn('tabs').$el.getViewIn('tab-html'));
                    //this.getViewIn('tabs').getViewIn('tab-html').getEditor('code').validate(true);
                    this.close();
                }
            },
            cancel: function() {
                this.close();
            },
            delete: function() {
                //TODO: change the height of surronding elements
                var obj = this.get('obj'),
                    viewAndRegion = obj.name,
                    groupNumber = obj.groupNumber,
                    stringNumber = obj.stringNumber,
                    cacheData = app.store.get(viewAndRegion),
                    deleteGroups = cacheData.groups,
                    deleteStrings = cacheData.strings;
                if (this.get('type') === 'group') {
                    var groupId = viewAndRegion + '-' + groupNumber + '-id',
                        basis = $('#' + groupId).css('flex-basis');
                    if (parseInt(groupNumber) === 0) {
                        var next = viewAndRegion + '-' + (parseInt(groupNumber) + 1) + '-id',
                            nextBasis = parseInt($('#' + next).css('flex-basis')) + parseInt(basis);
                        console.log('next basis is, ', nextBasis);
                        deleteGroups[(parseInt(groupNumber) + 1)].css_container = {
                            'flex-grow': '0',
                            'flex-shrink': '1',
                            'flex-basis': nextBasis + '%',
                        };
                    } else {
                        var prev = viewAndRegion + '-' + (parseInt(groupNumber) - 1) + '-id',
                            prevBasis = parseInt($('#' + prev).css('flex-basis')) + parseInt(basis);
                        console.log('prev basis is, ', prevBasis);
                        deleteGroups[(parseInt(groupNumber) - 1)].css_container = {
                            'flex-grow': '0',
                            'flex-shrink': '1',
                            'flex-basis': prevBasis + '%',
                        };
                    }
                    deleteGroups.splice(groupNumber, 1);
                    cacheData.groups = deleteGroups;
                    var options = {
                        newGroups: cacheData.groups,
                        newStrings: cacheData.strings,
                        direction: cacheData.direction,
                        name: viewAndRegion
                    };
                    if (cacheData.groups.length > 1) {

                        app.store.set(viewAndRegion, cacheData);
                        var cssId = viewAndRegion + '-' + groupNumber + '-css';
                        $('#' + cssId).remove();
                        this.close();
                        app.coop('update-data', options);
                    } else {
                        this.close();
                    }
                } else {
                    deleteStrings.splice(stringNumber, 1);
                    cacheData.strings = deleteStrings;
                    var stringOptions = {
                        newGroups: cacheData.groups,
                        newStrings: cacheData.strings,
                        direction: cacheData.direction,
                        name: viewAndRegion
                    };
                    app.store.set(viewAndRegion, cacheData);
                    var stringCssId = viewAndRegion + '-' + groupNumber + '-string-css';
                    $('#' + stringCssId).remove();
                    this.close();
                    app.coop('update-data', stringOptions);
                }
            }
        },
        onReady: function() {
            this.$el.find('[tabid="html"]').addClass('active');
            var tabids = ['html', 'less'],
                self = this;
            _.map(tabids, function(tabid) {
                self.tab('tabs', app.view({
                    template: ['<div editor="code"></div>'],
                    useParentData: tabid,
                    editors: {
                        code: {
                            value: self.get(tabid),
                            label: tabid,
                            type: 'textarea',
                            placeholder: tabid,
                            validate: {
                                required: true
                            }
                        }
                    }
                }), tabid);
            });
            if (this.get('type') === 'add') {
                this.$el.find('.delete-group').addClass('hide');
            }
        }
    });
})(Application);
