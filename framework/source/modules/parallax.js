/***********************************************************************
 * Lola JavaScript Framework Module
 *
 *       Module: para
 *  Description: parallax scrolling module
 *       Author: Copyright 2012, tylerbeck
 *
 ***********************************************************************/
(function (lola) {
    /**
     * Parallaz Module
     * @namespace lola.para
     */
    var Module = function () {
        var self = this;

        //==================================================================
        // Attributes
        //==================================================================

        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "para";

        /**
         * agent's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ["tween"];

        var $w;
        var $b;

        var maxScroll;
        var vertical = true;

        var active = [];
        var targets = [];

        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function () {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function () {
            return dependencies;
        };


        //==================================================================
        // Methods
        //==================================================================
        this.activate = function( scrollv ){
            vertical = scrollv !== false;
            $w = $(lola.window);
            $b = $(document.body);
            $w.addListener( 'scroll', handleScroll );
            if (vertical)
                maxScroll = $b.height() - $w.innerHeight();
            else
                maxScroll = $b.width() - $w.innerWidth();

            console.log(vertical, $b.height(), $w.innerHeight(), maxScroll );


        };
        this.deactivate = function(){
            $w.removeListener( 'scroll', handleScroll );
        };

        function handleScroll( event ){
            var position = $w.attr(vertical?'scrollY':'scrollX') / maxScroll;
            console.log('position', position);
        }

        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {


        };


        //==================================================================
        // Classes
        //==================================================================


    };

    //register module
    lola.registerModule(new Module());

})(lola);

