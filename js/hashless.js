((dynCore) => {
    dynCore.declare('app.hashless', dynCore.require([
        'lib.bind',
        'app.globalModel'
    ]), (modules, bind, globalModel) => {
        var $content = $('#content');
        var $title = $('title');
        var currentPage;
        var titles = {};
        var init = function() {
            var page = window.location.pathname.substr(1) || 'home';
            if (page === currentPage) {
                return;
            }
            currentPage = page;
            $content.children().hide();

            var app = 'app.' + page;
            var promise = $.Deferred();

            var $page = $('#content-' + page);
            if ($page.length) {
                $page.show();
                $title.text(titles[page] || titles.home);
                promise.resolve();
            } else {
                $.ajax('/' + (page === 'home' ? 'index' : page) + '.html').done(function(html) {
                    var $html = $($.parseHTML(html));
                    for (var i = 0; i < $html.length; i++) {
                        if ($html[i].localName === 'title') {
                            titles[page] = $html[i].innerText;
                            break;
                        }
                    }
                    $title.text(titles[page] || titles.home);

                    var $page = $html.find('#content-' + page);
                    $page.appendTo($content).hide();
                    $html.remove();

                    if (typeof($page.attr('z--controller')) !== 'undefined') {
                        $page.removeAttr('z--controller');
                        dynCore.require(app).done(() => {
                            $page.show();
                            promise.resolve();
                        });
                    } else {
                        bind($page, globalModel).done(() => {
                            globalModel._refresh();
                            $page.show();
                            promise.resolve();
                        });
                    }
                }).fail(function() {
                    currentPage = 'home';
                    window.history.replaceState({},'', '/');
                    init();
                });
            }

            return promise;
        };

        var initialBinding = $.Deferred();
        var initialPage = window.location.pathname.substr(1) || 'home';
        titles[initialPage] = $title.text();

        var $inner = $content.children('[z--controller]');
        if ($inner.length) {
            $inner.removeAttr('z--controller');
            dynCore.require('app.' + initialPage).done(function() {
                bind($('body'), globalModel).done(function() {
                    initialBinding.resolve();
                });
            });
        } else {
            bind($('body'), globalModel).done(function() {
                initialBinding.resolve();
            });
        }

        initialBinding.done(function() {
            var $nav = $('#main > nav');
            init().done(() => {
                $content.show();
                $nav.show();
            });
        });

        return function(fn) {
            if (typeof(fn) === 'function') {

            } else {
                init.call(this);
            }
        }
    });
})(window.dynCore);