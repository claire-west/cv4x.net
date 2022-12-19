((dynCore) => {
    dynCore.declare('app.hashless', dynCore.require([
        'lib.bind',
        'app.globalModel'
    ]), (modules, bind, globalModel) => {
        bind($('body'), globalModel);

        var $content = $('#content');
        var page = window.location.pathname.substr(1) || 'home';

        var app = 'app.' + page;
        dynCore.html(page, app, $content).done(() => {
            var $inner = $content.children('[z--controller]');
            if ($inner.length) {
                $inner.removeAttr('z--controller');
                dynCore.js(app).done(() => {
                    //bind($content, globalModel);
                    $content.show();
                });
            } else {
                bind($content, globalModel);
                $content.show();
            }
        });
    });
})(window.dynCore);