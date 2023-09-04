((dynCore) => {
    dynCore.declare('frag.nav', dynCore.require([
        'lib.fragment',
        'app.hashless'
    ]), (modules, fragment, hashless) => {
        fragment.controller('frag.nav', {
            onInit: function() {
                var $links = this.$fragment.find('a');
                hashless.bindNav($links);

                // if window resizes from or to "small", reset the navbar
                var previousWidth = window.innerWidth;
                window.addEventListener('resize', function(e) {
                    if ((previousWidth > 640 && window.innerWidth < 641) ||
                        (previousWidth < 641 && window.innerWidth > 640)) {
                        $('body').addClass('nav');
                    }
                    previousWidth = window.innerWidth;
                });

                window.addEventListener('popstate', function () {
                    hashless();
                });
            }
        });
    });
})(window.dynCore);