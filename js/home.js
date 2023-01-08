((dynCore) => {
    dynCore.when(
        dynCore.require([
            'lib.bind',
            'lib.model',
            'app.globalModel'
        ]),
        dynCore.jsonBundle('app.json', {
            activity: 'activity',
            changelog: 'changelog'
        }),
        dynCore.css('home', 'app.home'),
        dynCore.require('lib.arraySort')
    ).done((modules, bind, model, globalModel, json) => {
        var dateCompare = function(a, b) {
            return b.date.toLocaleLowerCase().localeCompare(a.date.toLocaleLowerCase());
        };
        var model = model({
            test: "testing home model",
            activity: json.activity.sort(dateCompare),
            changelog: json.changelog.sort(dateCompare),
            parseHref: function(text) {
                return text;
            }
        }, globalModel);

        var $page = $('#content-home');
        return bind($page, model).done(function() {
            model._refresh();
            dynCore.declare('app.home');
        });
    });
})(window.dynCore);