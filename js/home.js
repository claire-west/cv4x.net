((dynCore) => {
    dynCore.declare('app.home', dynCore.require([
        'lib.bind',
        'lib.model',
        'app.globalModel'
    ]), (modules, bind, model, globalModel) => {
        var $page = $('#content-home');
        var model = model({
            test: 'home.js model'
        }, globalModel);

        bind($page, model).done(function() {
            model._refresh();
        });
    });
})(window.dynCore);