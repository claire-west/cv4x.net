((dynCore) => {
    dynCore.when(
        dynCore.require([
            'lib.bind',
            'lib.model',
            'app.globalModel',
            'lib.download'
        ]),
        dynCore.css('anime', 'app.anime')
    ).done((modules, bind, model, globalModel, download) => {
        dynCore.js('https://lib.claire-west.ca/vend/js/html2canvas.min.js');

        var convertTZ = function(time) {
            // parse hhmm as UTC+0
            // toTimeString uses browser time zone
            // return in hhmm format
            return new Date(Date.parse('1970-01-01T' + time.substr(0, 2) + ':' + time.substr(2, 2) + '-00:00')).toTimeString('hhmm').substr(0, 5).replace(':', '');
        };

        var convertScheduleTZs = function(schedule) {
            for (var day in schedule) {
                for (var i = 0; i < schedule[day].length; i++) {
                    var text = schedule[day][i];
                    // split into char array to account for multibyte emoji
                    if (!text) {
                        return '';
                    }
                    var chars = [...text];
                    var time = convertTZ(chars.slice(1, 5).join(''));
                    schedule[day][i] = chars[0] + time + chars.slice(5).join('');
                }
            }
        }

        var years = {};
        var fetchYear = function(year) {
            if (!years[year]) {
                years[year] = $.Deferred();
                $.ajax('/json/anime/' + year + '.json').done(function(data) {
                    for (var season in data) {
                        if (data[season] && data[season].schedule) {
                            convertScheduleTZs(data[season].schedule);
                        }
                    }
                    years[year].resolve(data);
                });
            }
            return years[year];
        };

        var controller = {
            refresh: function() {
                fetchYear(this.model.year).done((yearData) => {
                    if (this.model.yearData === yearData) {
                        return;
                    }
                    this.model.yearData = yearData;
                    // validate current season setting
                    if (!yearData[this.model.season]) {
                        if (yearData.冬) {
                            this.model.season = '冬';
                        } else if (yearData.春) {
                            this.model.season = '春';
                        } else if (yearData.夏) {
                            this.model.season = '夏';
                        } else if (yearData.秋) {
                            this.model.season = '秋';
                        } else {
                            this.model.season = null;
                        }
                    }
                    this.refreshSeason();
                });
            },
            refreshSeason: function() {
                fetchYear(this.model.year).done((yearData) => {
                    var seasonData = yearData[this.model.season];
                    if (this.model.seasonData === seasonData) {
                        return;
                    }
                    if (this.model.season) {
                        // validate current tab setting
                        if (!seasonData[this.model.tab]) {
                            if (seasonData.schedule) {
                                this.model.tab = 'schedule';
                            } else if (seasonData.impressions) {
                                this.model.tab = 'impressions';
                            } else if (seasonData['wrap-up']) {
                                this.model.tab = 'wrap-up';
                            } else {
                                this.model.tab = null;
                            }
                        }
                    }
                    this.model.seasonData = seasonData;
                    this.model._refresh();
                });
            },
            model: model({
                year: globalModel.year,
                isNotLastYear: function(year) {
                    return year < globalModel.year;
                },
                prevYear: function(model) {
                    model.season = '秋';
                    model._set('year', model.year - 1);
                },
                nextYear: function(model) {
                    model.season = '冬';
                    model._set('year', model.year + 1);
                },
                setSeason: function(model) {
                    model._set('season', $(this).text());
                },
                setTab: function(model) {
                    model._set('tab', $(this).text().toLocaleLowerCase() || 'schedule');
                },
                hideUnmarked: localStorage.getItem('anime.hideUnmarked') === "true",
                toggleShowHide: function(model) {
                    model._set('hideUnmarked', !model.hideUnmarked);
                },
                marked: {},
                toggleMarked: function(text, marked, model) {
                    if (model.hideUnmarked) {
                        return;
                    }
                    var title = text.substr(text.indexOf(' ') + 1);
                    if (marked.hasOwnProperty(title)) {
                        delete model.marked[title];
                    } else {
                        model.marked[title] = true;
                    }
                    localStorage.setItem('anime.markedItems', JSON.stringify(marked));
                    model._set('updateMarked', model.updateMarked + 1);
                },
                updateMarked: 0,
                isMarked: function(updateMarked, prev, marked, text) {
                    return marked[text.substr(text.indexOf(' ') + 1)] === true;
                },
                downloadSchedule: function(model) {
                    html2canvas($('#content-anime .weeklySchedule').get(0), {
                        useCORS: true
                    }).then(function(canvas) {
                        download(canvas.toDataURL(), model.year + ' (' + model.season + ').png');
                    });
                },
                malHref: function(mal) {
                    return 'https://myanimelist.net/anime/' + mal;
                },
                twemojify: globalModel.twemojify // function binding doesn't traverse models (yet)
            }, globalModel)
        };

        try {
            var markedItems = localStorage.getItem('anime.markedItems');
            if (markedItems) {
                controller.model.marked = JSON.parse(markedItems);
            }
        } catch (e) {
            controller.model.marked = {}
        }

        controller.model._track('year', function() {
            controller.refresh();
        });
        controller.model._track('season', function() {
            controller.refreshSeason();
        });
        controller.model._track('hideUnmarked', function(hideUnmarked) {
            localStorage.setItem('anime.hideUnmarked', hideUnmarked);
        });

        var $page = $('#content-anime');
        return bind($page, controller.model).done(function() {
            controller.model._refresh();
            dynCore.declare('app.anime');
        });
    });
})(window.dynCore);