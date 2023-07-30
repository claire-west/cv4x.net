((dynCore) => {
    dynCore.when(
        dynCore.require([
            'lib.bind',
            'lib.model',
            'app.globalModel',
            'lib.hashWatch'
        ])
    ).done((modules, bind, model, globalModel, hashWatch) => {
        function changeHash() {
            var hash = [...arguments].join('/');
            window.location.replace('#' + hash);
        };

        var model = model({
            setTab: function(model) {
                changeHash($(this).data('tab'));
            }
        }, globalModel);

        // watch hash for changes - all layout for this page is dictated by this
        // it runs once when registering the handler to process the initial hash state
        hashWatch((args) => {
            return window.location.pathname.substr(1) === 'faves';
        }, (tab) => {
            if (tab !== model.tab) {
                model._set('tab', tab);
            }
        });

        if (!window.location.hash) {
            changeHash('music');
        }

        var $page = $('#content-faves');
        return bind($page, model).done(function() {
            model._refresh();
            dynCore.declare('app.faves');
        });
    });
})(window.dynCore);