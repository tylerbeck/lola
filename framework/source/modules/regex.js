/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Regular Expression
 *  Description: Regular Expression module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Regular Expression Module
	 * @namespace lola.regex
	 */
	var Module = function(){

        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "regex";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [];

        /**
         * looks for extra spaces
         */
        this.extraSpace = /\s\s+/g;

        /**
         * is a valid number
         */
        this.isNumber = /^-?\d*(?:\.\d+)?$/;

        /**
         * is a number with units
         */
        this.isDimension = /^(-?\d*(?:\.\d+)?)(%|in|cm|mm|em|ex|pt|pc|px)$/;

        /**
         * is css color (color names not matched)
         */
        this.isColor = /^(#|rgb|rgba|hsl|hsla)(.*)$/;

        /**
         * is css hex color
         */
        this.isHexColor = /^#([A-F0-9]{3,6})$/;

        /**
         * is css rgb or rgba color
         */
        this.isRGBColor = /^rgba?\(([^\)]+)\)$/;

        /**
         * is css hsl or hsla color
         */
        this.isHSLColor = /^hsla?\(([^\)]+)\)$/;



        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };

        //==================================================================
        // Selector Methods
        //==================================================================

        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {

        }



    };


	//register module
	lola.registerModule( new Module() );

})( lola );

