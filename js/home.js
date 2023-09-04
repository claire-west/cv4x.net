((dynCore) => {
    var hrefRegex = /\[(.*)\]\(([^\)]*)\)/g;

    dynCore.when(
        dynCore.require([
            'lib.bind',
            'lib.model',
            'app.globalModel',
            'app.hashless'
        ]),
        dynCore.jsonBundle('app.json', {
            activity: 'activity',
            changelog: 'changelog'
        }),
        dynCore.css('home', 'app.home'),
        dynCore.require('lib.arraySort')
    ).done((modules, bind, model, globalModel, hashless, json) => {
        var dateCompare = function(a, b) {
            return b.date.toLocaleLowerCase().localeCompare(a.date.toLocaleLowerCase());
        };
        var model = model({
            activity: json.activity.sort(dateCompare),
            changelog: json.changelog.sort(dateCompare),
            parseHref: function(text) {
                var matches = text.matchAll(hrefRegex);
                var match = matches.next();
                while (!match.done) {
                    text = text.replace(match.value[0], '<a href="' + match.value[2] + '">' + match.value[1] + '</a>')

                    match = matches.next();
                }
                return text;
            }
        }, globalModel);

        var $page = $('#content-home');
        return bind($page, model).done(function() {
            model._refresh();
            hashless.bindNav($page.find('a'));
            dynCore.declare('app.home');
        });
    });
})(window.dynCore);