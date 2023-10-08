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
            anime: 'anime.2023'
        }),
        dynCore.js('https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js'),
        dynCore.js('https://cdn.jsdelivr.net/npm/js-base64@3.7.5/base64.min.js'),
        dynCore.css('tierlist', 'app.tierlist')
    ).done((modules, bind, model, globalModel, download, hashWatch, json) => {
        dynCore.js('https://lib.claire-west.ca/vend/js/html2canvas.min.js');

        var imageRegex = /^http(.*)\.(jpg|jpeg|png|webp|avif|gif|svg)(\?.*)?$/;
        var colorRegex = /^\#([0-9A-Fa-f]{3}){1,2}$/;

        var defaultColors = [ '#FF7F7F', '#FFBF7F', '#FFDF7F', '#FFFF7F', '#BFFF7F', '#7FBFFF', '#7F7FFF', '#BF7FBF' ];
        var fallbackColor = '#858585';

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
                    if (Array.isArray(list)) {
                        list = Object.assign(newTierlist(), { unassigned: list });
                    }
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

        function scrollUp() {
            var $scrollContainer = $('#content,html');
            $scrollContainer.animate({ scrollTop: 0 }, 100);
        };

        function scrollDown() {
            var $scrollContainer = $('#content,html');
            $scrollContainer.animate({ scrollTop: $scrollContainer.prop("scrollHeight") }, 250);
        };

        var model = model({
            allLists: [],
            list: getInitialList(),
            colors: defaultColors.slice(),

            onSelectChange: function(model) {
                model._set('newItem', '');
                model._set('list', JSON.parse(JSON.stringify(model._get('allLists')[this.selectedIndex])));
                model.setColorsFromList();
                scrollUp();
            },

            onSelectList: function(list) {
                model._set('newItem', '');
                model._set('list', JSON.parse(JSON.stringify(list)));
                model.setColorsFromList();
                globalModel.closeModal.call(this);
                scrollUp();
            },

            onSetSelectedList: function(title) {
                // do this at the end of the execution queue since <option/> elements might not exist yet
                setTimeout(() => { this.val(title); });
            },

            addTier: function() {
                var newTier = {
                    text: getTierLetter(model.list.tiers.length),
                    items: []
                };
                var newIndex = model.list.tiers.length;
                if (model.colors[newIndex] !== defaultColors[newIndex]) {
                    newTier.color = model.colors[newIndex];
                }
                model.list.tiers.push(newTier);
                model._refresh();
            },

            moveUp: function() {
                var index = Number($(this).parent().parent().attr('z--index'));
                var tier = model.list.tiers[index];
                var targetIndex = index - 1;
                // preserve color order
                var color = tier.color;
                if (model.list.tiers[targetIndex].color) {
                    tier.color = model.list.tiers[targetIndex].color;
                } else {
                    delete tier.color;
                }
                if (color) {
                    model.list.tiers[targetIndex].color = color;
                } else {
                    delete model.list.tiers[targetIndex].color;
                }

                model.list.tiers.splice(targetIndex, 0, model.list.tiers.splice(index, 1)[0]);
                model._refresh();
            },

            moveDown: function() {
                var index = Number($(this).parent().parent().attr('z--index'));
                var tier = model.list.tiers[index];
                var targetIndex = index + 1;
                // preserve color order
                var color = tier.color;
                if (model.list.tiers[targetIndex].color) {
                    tier.color = model.list.tiers[targetIndex].color;
                } else {
                    delete tier.color;
                }
                if (color) {
                    model.list.tiers[targetIndex].color = color;
                } else {
                    delete model.list.tiers[targetIndex].color;
                }

                model.list.tiers.splice(targetIndex, 0, model.list.tiers.splice(index, 1)[0]);
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
                return !!text && text.startsWith('http') && imageRegex.test(text);
            },
            filterImageLink: function(text) {
                if (model.isImageLink(text)) {
                    return text;
                }
                return '';
            },

            adjustTextHeight: function(text) {
                var element = $(this).get(0);
                setTimeout(() => {
                    while (element.offsetHeight > element.parentElement.offsetHeight) {
                        let fontSize = Number(element.style.fontSize.replace('%', '')) || 100;
                        element.style.fontSize = (fontSize - 1) + '%';
                    }
                });

                return text;
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
                download('data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(model.list)), model.list.title + '.json');
            },

            openLoadModal: function(model) {
                globalModel.openModal('tierlist-load', model);
            },

            loadTierList: function() {
                if (this.files.length) {
                    this.files[0].text().then((jsonString) => {
                        var list = JSON.parse(jsonString);
                        model._set('newItem', '');
                        model._set('list', list);
                        model.setColorsFromList();
                        globalModel.closeModal.call(this);
                        scrollUp();
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
            },

            newTierList: function() {
                model._set('newItem', '');
                model._set('list', newTierlist());
                model._set('colors', defaultColors.slice());
                scrollUp();
            },

            copyPermalink: function() {
                var url = window.location.href + '#' + Base64.encode(JSON.stringify(model.list));
                navigator.clipboard.writeText(url);
                $toast = $(this).find('.toast');
                $toast.addClass('toast-show');
                setTimeout(() => { $toast.removeClass('toast-show') });
            },

            setAspect: function() {
                $this = $(this);
                var aspect = $this.data('aspect');
                var value = $this.data('value');
                if (!value && model.list.config && model.list.config.aspect) {
                    delete model.list.config.aspect[aspect];
                    model._refresh();
                } else {
                    model._set('list.config.aspect.' + aspect, value);
                }
            },

            toggleConfigPanel: function() {
                model._set('showConfig', !model._get('showConfig'));
                if (model.showConfig) {
                    scrollDown();
                }
            },

            setColorsFromList: function() {
                for (var i = 0; i < model.list.tiers.length; i++) {
                    var color = model.list.tiers[i].color;
                    if (colorRegex.test(color)) {
                        model._set('colors.' + i, color);
                    } else {
                        model._set('colors.' + i, defaultColors[i] || fallbackColor);
                    }
                }
            },
            onColorChange: function(color) {
                var $this = $(this);
                var index = $this.parent().attr('z--index');
                if (model.list.tiers[index]) {
                    if (colorRegex.test(color) && color !== defaultColors[index] && color !== fallbackColor) {
                        model._set('list.tiers.' + index + '.color', color);
                    } else {
                        delete model.list.tiers[index].color;
                        model._refresh();
                    }
                }
            },
            isDarkColor: function(color) {
                if (!color) {
                    return;
                }

                // https://stackoverflow.com/a/12043228
                var color = color.substring(1);
                var rgb = parseInt(color, 16);
                var r = (rgb >> 16) & 0xff;
                var g = (rgb >>  8) & 0xff;
                var b = (rgb >>  0) & 0xff;

                var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                if (luma < 55) {
                    return true;
                }
            },
            revertColor: function() {
                var $this = $(this);
                var index = $this.parent().attr('z--index');
                var color = defaultColors[index] || fallbackColor;
                if (model.list.tiers[index]) {
                    delete model.list.tiers[index].color;
                }
                model._set('colors.' + index, color);
            }
        }, globalModel);

        model.setColorsFromList();

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
            var siblings = e.from.getElementsByTagName(e.item.tagName);
            if (e.to === e.from && e.oldIndex > e.newIndex) {
                e.from.insertBefore(e.item, siblings[e.oldIndex + 1]);
            } else {
                e.from.insertBefore(e.item, siblings[e.oldIndex]);
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
                model.setColorsFromList();
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