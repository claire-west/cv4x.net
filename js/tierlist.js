((dynCore) => {
    dynCore.when(
        dynCore.require([
            'lib.bind',
            'lib.model',
            'app.globalModel',
            'lib.download',
            'lib.hashWatch'
        ]),
        dynCore.jsonBundle('app.json.tierlist', {
            blank: 'blank',
            anime: 'anime'
        }),
        dynCore.js('https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js'),
        dynCore.js('https://cdn.jsdelivr.net/npm/js-base64@3.7.5/base64.min.js'),
        dynCore.css('tierlist', 'app.tierlist')
    ).done((modules, bind, model, globalModel, download, hashWatch, json) => {
        dynCore.js('https://lib.claire-west.ca/vend/js/html2canvas.min.js');

        function getTierLetter(i) {
            i = Number(i);
            if (isNaN(i)) {
                return;
            }

            if (i < 1) {
                return ''.padEnd(Math.abs(i) + 1, 'S');
            }

            if (i > 25) {
                return ''.padEnd(i - 24, 'Z');
            }

            i += 64;

            if (i > 82) {
                i++;
            }

            return String.fromCharCode(i);
        };

        function newTierlist() {
            return JSON.parse(JSON.stringify(json.blank));
        };

        function getHashList() {
            if (window.location.hash) {
                try {
                    var list = JSON.parse(Base64.decode(window.location.hash.substr(1)));
                    history.replaceState("", document.title, window.location.pathname);
                    return list;
                } catch (e) {
                    history.replaceState("", document.title, window.location.pathname);
                }
            }
        };

        function getInitialList() {
            return getHashList() || newTierlist();
        };

        var model = model({
            allLists: [],
            list: getInitialList(),

            onSelectChange: function(model) {
                model._set('newItem', '');
                model._set('list', model._get('allLists')[this.selectedIndex])
            },

            onSetSelectedList: function(title) {
                // do this at the end of the execution queue since <option/> elements might not exist yet
                setTimeout(() => { this.val(title); }, 0);
            },

            addTier: function() {
                model.list.tiers.push({
                    text: getTierLetter(model.list.tiers.length),
                    items: []
                });
                model._refresh();
            },

            moveUp: function() {
                var index = Number($(this).parent().parent().attr('z--index'));
                model.list.tiers.splice(index - 1, 0, model.list.tiers.splice(index, 1)[0]);
                model._refresh();
            },

            moveDown: function() {
                var index = Number($(this).parent().parent().attr('z--index'));
                model.list.tiers.splice(index + 1, 0, model.list.tiers.splice(index, 1)[0]);
                model._refresh();
            },

            deleteTier: function() {
                var index = $(this).parent().parent().attr('z--index');
                var tier = model.list.tiers[index];
                model.list.unassigned.unshift(...tier.items);
                model.list.tiers.splice(index, 1);
                model._refresh();
            },

            bindContentEdit: function(text) {
                if (this.data('z--bound')) {
                    return text;
                }

                this.on('focus', function(e) {
                    var $this = $(this);
                    $this.data('z--undo', $this.text());
                });

                this.on('keydown', function(e) {
                    var $this = $(this);
                    if (e.which === 27) {
                        $this.text($this.data('z--undo'));
                    }
                    if (e.which === 13 || e.which === 27) {
                        $this.trigger('blur');
                        $this.removeData('z--undo');
                    }
                    return e.which !== 13;
                });

                this.on('blur', function(event) {
                    var $this = $(this);
                    var path = 'list.title';
                    if ($this.parent().hasClass('tierlist-category')) {
                        var index = $this.parent().parent().attr('z--index');
                        path = 'list.tiers.' + index + '.text';
                        if (!$this.text().trim()) {
                            var letter = getTierLetter($this.parent().parent().attr('z--index'));
                            $this.text(letter || $this.data('z--undo'));
                        }
                    } else if (!$this.text().trim()) {
                        $this.text('New Tier List');
                    }

                    $this.removeData('z--undo');
                    if ($this.text() !== model._get(path)) {
                        $this.trigger('change');
                    }
                });

                this.on('keyup input paste', function() {
                    var $this = $(this);
                    var path = 'list.title';
                    if ($this.parent().hasClass('tierlist-category')) {
                        var index = $this.parent().parent().attr('z--index');
                        path = 'list.tiers.' + index + '.text';
                    }
                    if ($this.text() !== model._get(path)) {
                        $this.trigger('change');
                    }
                });

                this.data('z--bound', true);
                return text;
            },

            onCategoryNameChange: function() {
                var $this = $(this);
                var index = $this.parent().parent().attr('z--index');
                model.list.tiers[index].text = $this.text();
            },

            onTitleChange: function() {
                var $this = $(this);
                model.list.title = $this.text();
            },

            isTopTier: function() {
                return this.parent().parent().attr('z--index') === '0';
            },
            isBottomTier: function() {
                return this.parent().parent().attr('z--index') === String(model.list.tiers.length - 1);
            },
            isImageLink: function(text) {
                return text && text.startsWith('http') && (text.endsWith('.png') || text.endsWith('.jpeg') || text.endsWith('.gif') || text.endsWith('.gif'));
            },
            filterImageLink: function(text) {
                if (model.isImageLink(text)) {
                    return text;
                }
                return '';
            },

            addItem: function() {
                model.list.unassigned.push(model.newItem);
                model.newItem = '';
                model._refresh();
            },

            saveScreenshot: function(model) {
                model._set('takingScreenshot', true);
                html2canvas($('#content-tierlist .tierlist-content').get(0), {
                    useCORS: true,
                    scale: 3,
                    backgroundColor: $('body').hasClass('light') ? '#fff' : '#2f3136'
                }).then(function(canvas) {
                    download(canvas.toDataURL(), model.list.title + '.png');
                    model._set('takingScreenshot', false);
                });
            },

            saveTierList: function(model) {
                download('data:text/json;charset=utf-8,' + JSON.stringify(model.list), model.list.title + '.json');
            },

            loadTierList: function() {
                if (this.files.length) {
                    this.files[0].text().then((jsonString) => {
                        var list = JSON.parse(jsonString);
                        model._set('newItem', '');
                        model._set('list', list);
                    });
                }
            },

            resetTierList: function() {
                var items = model.list.unassigned;
                for (var tier of model.list.tiers) {
                    items = items.concat(tier.items);
                    tier.items = [];
                }
                model._set('list.unassigned', items);
                console.log(items)
            },

            newTierList: function() {
                model._set('newItem', '');
                model._set('list.title', '');
                model._set('list.tiers', []);
                model._set('list', newTierlist());
            },

            copyPermalink: function() {
                var url = window.location.href + '#' + Base64.encode(JSON.stringify(model.list));
                navigator.clipboard.writeText(url);
                $toast = $(this).find('.toast');
                $toast.addClass('toast-show');
                setTimeout(() => { $toast.removeClass('toast-show') });
            }
        }, globalModel);

        for (let prop in json) {
            model.allLists = model.allLists.concat(json[prop]);
        }

        function addUnassignedItems(input) {
            if (typeof(input) === 'string') {
                var values = input.split('\n');
                model.list.unassigned.push(...values);
                model._refresh();
            }
        };

        var $page = $('#content-tierlist');
        $page.find('.tierlist-add textarea').on('keydown', function(e) {
            var $this = $(this);
            var val = $this.val();

            if (e.which === 13 || e.which === 27) {
                $this.val('');
                $this.trigger('change');
            }

            if (e.which === 27) {
                $this.trigger('blur');
            }

            if (e.which === 13 && val) {
                addUnassignedItems(val);
            }

            return e.which !== 13;
        }).on('paste', function(e) {
            var val = e.originalEvent.clipboardData.getData('Text');
            if (val) {
                addUnassignedItems(val);
            }
            e.preventDefault();
        });

        var trash = $page.find('.tierlist-trash').get(0);
        // make trash a drop target
        new Sortable(trash, {
            group: 'tierlist-sortable',
            filter: 'i'
        });

        function onSort(e) {
            // undo the move in html (https://github.com/SortableJS/Sortable/issues/837#issuecomment-894882604)
            e.clone.remove();
            var items = e.from.getElementsByTagName(e.item.tagName);
            if (e.oldIndex > e.newIndex) {
                e.from.insertBefore(e.item, items[e.oldIndex + 1]);
            } else {
                e.from.insertBefore(e.item, items[e.oldIndex]);
            }

            // process reorder in the model instead
            var origin = model.list.unassigned;
            if (!e.from.parentElement.className.includes('tierlist-unassigned')) {
                origin = model.list.tiers[e.from.parentElement.getAttribute('z--index')].items;
            }

            var item = origin.splice(e.oldIndex, 1)[0];

            // if not deleting the item, insert it at the correct position
            if (e.to !== trash) {
                var destination = model.list.unassigned;
                if (!e.to.parentElement.className.includes('tierlist-unassigned')) {
                    destination = model.list.tiers[e.to.parentElement.getAttribute('z--index')].items;
                }

                destination.splice(e.newIndex, 0, item);
            }

            model._refresh();
        };

        function makeSortable() {
            var sortables = $page.find('.tierlist-sortable').get();
            for (var sortable of sortables) {
                new Sortable(sortable, {
                    group: 'tierlist-sortable',
                    draggable: '.tierlist-item',
                    animation: 20,
                    onEnd: onSort
                });
            }
        };

        hashWatch((args) => {
            return window.location.pathname.substr(1) === 'tierlist';
        }, () => {
            var list = getHashList();
            if (list) {
                model._set('newItem', '');
                model._set('list', list);
            }
        });

        return bind($page, model).done(function() {
            model._refresh();
            dynCore.declare('app.tierlist');

            makeSortable();
            model._track('list', makeSortable);
            model._track('list.tiers', makeSortable);
        });
    });
})(window.dynCore);