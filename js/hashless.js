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

        var initialPage = window.location.pathname.substr(1) || 'home';
        titles[initialPage] = $title.text();

        var $inner = $content.children('[z--controller]');
        var initialLoad = $.Deferred().resolve();
        if ($inner.length) {
            $inner.removeAttr('z--controller');
            initialLoad = dynCore.require('app.' + initialPage);
        }

        initialLoad.done(function() {
            bind($('body'), globalModel).done(function() {
                var $nav = $('#main > nav');
                init().done(() => {
                    $content.show();
                    $nav.show();
                });
            });
        });

        return Object.assign(init, {
            bindNav: function($elements) {
                $elements.filter(function() {
                    return $(this).data('z--nav') !== true;
                }).data('z--nav', true).on('click', function(e) {
                    if (this.href.includes(location.origin)) {
                        e.preventDefault();
                        if (this.href !== location.href) {
                            window.history.pushState({},'', this.href.replace(location.origin, ''));
                            if (window.innerWidth < 641) {
                                $('body').addClass('nav');
                            }
                            init();
                        }
                    }
                });
            }
        });
    });
})(window.dynCore);