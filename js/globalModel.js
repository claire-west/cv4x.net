((dynCore) => {
    dynCore.declare('app.globalModel', dynCore.require([
        'lib.bind',
        'lib.fragment',
        'lib.globalModel',
        'lib.isMobile'
    ]), (modules, bind, fragment, globalModel, isMobile) => {
        globalModel._set('isMobile', isMobile());
        globalModel._set('year', new Date().getFullYear());
        globalModel._set('titles', {
            home: 'cv4x.net'
        });
        globalModel._set('addTitle', (path, title) => {
            globalModel._get("titles")[path] = title;
        });
        globalModel._set('setTitle', (path) => {
            var titles = globalModel._get("titles");
            if (!titles[path]) {
                path = 'home';
            }
            globalModel._set('title', titles[path]);
        });

        globalModel._set('onToggleLayout', () => {
            var $body = $('body');
            $body.toggleClass('wide');
            if ($body.hasClass('wide')) {
                localStorage.setItem('layout', 'wide');
            } else {
                localStorage.removeItem('layout');
            }
        });

        globalModel._set('onToggleTheme', () => {
            var $body = $('body');
            $body.toggleClass('light');
            if ($body.hasClass('light')) {
                localStorage.setItem('theme', 'light');
            } else {
                localStorage.removeItem('theme');
            }
        });

        globalModel._set('onToggleNav', () => {
            var $body = $('body');
            $body.toggleClass('nav');
        });

        globalModel._set('onCopy', function() {
            var text = $(this).next().text();
            if (text) {
                if (isMobile()) {
                    // https://stackoverflow.com/a/71985515
                    const element = document.createElement("textarea");
                    element.value = text;
                    document.body.appendChild(element);
                    element.select();
                    document.execCommand("copy");
                    document.body.removeChild(element);
                } else {
                    navigator.clipboard.writeText(text);
                }
            }
        });

        // track loaded modal fragments for reuse if opened more than once
        var modalFragments = {};
        globalModel._set('openModal', (fragmentName, model) => {
            $('.modal .dialog').children().hide();
            var promise = $.Deferred();
            if (!modalFragments[fragmentName]) {
                $('.modal .dialog').append($('<z--frag-' + fragmentName + '/>'));
                // manually run fragment.scan before bind so we can get a reference to $fragment
                modalFragments[fragmentName] = fragment.scan($('.modal .dialog z--frag-' + fragmentName), model || globalModel);
                modalFragments[fragmentName].done(function($fragment, model) {
                    bind($fragment, model);
                    model._refresh();
                });
            }
            modalFragments[fragmentName].done(function($fragment) {
                $fragment.show();
                $('body').addClass('noscroll');
                $('.modal').show().find('.dialog').scrollTop(0);
                promise.resolve($fragment);
            });
            return promise;
        });

        globalModel._set('closeModal', function() {
            var $element = $(this).parent();
            while ($element.length) {
                if ($element.hasClass('modal')) {
                    $('body').removeClass('noscroll');
                    $element.hide();
                    break;
                }
                $element = $element.parent();
            }
        });

        globalModel._set('dateFormatter', function(date) {
            if (typeof(date) === 'string') {
                date = new Date(date + ' UTC');
            }

            if (date) {
                return date.toLocaleString();
            }
            return '';
        });

        globalModel._set('twemojify', function(text) {
            setTimeout(() => {
                twemoji.parse(this.get ? this.get(0) : this);
            }, 0);
            if (text) {
                return text;
            }
        });

        globalModel._set('twemojify_custom', function(text) {
            setTimeout(() => {
                twemojiCustom.parse(this.get ? this.get(0) : this);
            }, 0);
            if (text) {
                return text;
            }
        });

        return globalModel;
    });
})(window.dynCore);
