((dynCore) => {
    dynCore.declare('app.anime', dynCore.require([
        'lib.bind',
        'lib.model',
        'app.globalModel',
        'lib.download'
    ]), (modules, bind, model, globalModel, download) => {
        dynCore.css('anime', 'app.anime');
        dynCore.js('https://lib.claire-west.ca/vend/js/html2canvas.min.js');

        var years = {};
        var fetchYear = function(year) {
            if (!years[year]) {
                years[year] = $.Deferred();
                $.ajax('/json/anime/' + year + '.json').done(function(data) {
                    years[year].resolve(data);
                });
            }
            return years[year];
        };

        var convertTZ = function(time, season) {
            // parse hhmm as EST or EDT based on season
            // toLocaleString baesd on browser time zone
            // return in hhmm format
            return new Date(new Date(Date.parse('1970-01-01T' + time.substr(0, 2) + ':' + time.substr(2, 2) + (season === '春' || season === '夏' ? '-05:00' : '-04:00'))).toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })).toTimeString('hhmm').substr(0, 5).replace(':', '');
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
                getTime: function(text, prevText, season) {
                    // split into char array to account for multibyte emoji
                    if (!text) {
                        return '';
                    }
                    var chars = [...text];
                    var time = convertTZ(chars.slice(1, 5).join(''), season);
                    text = chars[0] + time + chars.slice(5).join('');
                    setTimeout(() => {
                        twemoji.parse(this.get(0));
                    }, 0);
                    return text;
                },
                downloadSchedule: function(model) {
                    html2canvas($('#content-anime .weeklySchedule').get(0), {
                        useCORS: true
                    }).then(function(canvas) {
                        download(canvas.toDataURL(), model.year + ' (' + model.season + ').png');
                    });
                }
            }, globalModel)
        };

        //controller.refresh();
        controller.model._track('year', function() {
            controller.refresh();
        });
        controller.model._track('season', function() {
            controller.refreshSeason();
        });

        var $page = $('#content-anime');
        bind($page, controller.model).done(function() {
            controller.model._refresh();
        });
    });
})(window.dynCore);