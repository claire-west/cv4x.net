((dynCore) => {
    dynCore.when(
        dynCore.require([
            'lib.bind',
            'lib.model',
            'app.globalModel',
            'lib.download'
        ]),
        dynCore.jsonBundle('app.json.tierlist', {
            anime: 'anime'
        }),
        dynCore.css('tierlist', 'app.tierlist')
    ).done((modules, bind, model, globalModel, download, json) => {
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
        }

        var model = model({
            allLists: [],
            list: json.anime[json.anime.length - 1],

            onSelectChange: function(model) {
                model._set('list', model._get('allLists')[this.selectedIndex])
            },

            onSetSelectedList: function(title) {
                // do this at the end of the execution queue since <option/> elements might not exist yet
                setTimeout(() => { this.val(title); }, 0);
            },

            addTier: function() {
                model.list.tiers.push({
                    text: getTierLetter(model.list.tiers.length)
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
                // move items to the bench
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
                    var index = $this.parent().parent().attr('z--index');
                    if (!$this.text().trim()) {
                        var letter = getTierLetter($this.parent().parent().attr('z--index'));
                        $this.text(letter || $this.data('z--undo'));
                    }
                    $this.removeData('z--undo');
                    if ($this.text() !== model.list.tiers[index].text) {
                        $this.trigger('change');
                    }
                });

                this.on('keyup input paste', function() {
                    var $this = $(this);
                    var index = $this.parent().parent().attr('z--index');
                    if ($this.text() !== model.list.tiers[index].text) {
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
                        model._set('list', list);
                    });
                }
            },

            newTierList: function() {
                model._set('list', {
                    title: "My New Tier List",
                    description: null,
                    tiers: [
                        {
                            "text": "S",
                            "items": []
                        },
                        {
                            "text": "A",
                            "items": []
                        },
                        {
                            "text": "B",
                            "items": []
                        },
                        {
                            "text": "C",
                            "items": []
                        },
                        {
                            "text": "D",
                            "items": []
                        }
                    ],
                    "unassigned": []
                });
            }
        }, globalModel);

        for (let prop in json) {
            model.allLists = model.allLists.concat(json[prop]);
        }

        var $page = $('#content-tierlist');
        $page.find('.tierlist-item textarea').on('keydown', function(e) {
            var $this = $(this);
            var val = $this.val();

            if (e.which === 13 || e.which === 27) {
                $this.val('');
                $this.trigger('change');
            }

            if (e.which === 27) {
                $this.trigger('blur');
            }

            if (e.which === 13) {
                model.list.unassigned.push(val);
                model._refresh();
            }

            return e.which !== 13;
        });

        return bind($page, model).done(function() {
            model._refresh();
            dynCore.declare('app.tierlist');
        });
    });
})(window.dynCore);