/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Math
 *  Description: Math module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	/**
	 * Math Module
	 * @namespace lola.math
	 */
	var Module = function(){
        var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "math";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ["util"];



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
        // Methods
        //==================================================================

        /**
         * normalize radians to 0 to 2 * PI
         * @param {Number} value radian value
         * @return {Number}
         */
        this.normalizeRadians = function( value ) {
            var unit = 2 * Math.PI;
            while (value < unit)
                value += unit;
            return value % unit;
        };

        /**
         * normalize degrees to 0 to 360
         * @param {Number} value radian value
         * @return {Number}
         */
        this.normalizeDegrees = function( value ) {
            while (value < 360)
                value += 360;
            return value % 360;
        };

        /**
         * normalize a value within a range
         * @param {Number} min
         * @param {Number} value
         * @param {Number} max
         * @return {Number}
         */
        this.normalizeRange = function( min, value, max ){
            return Math.max( min, Math.min( max, value ) );
        };


        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {

            /**
             * get max value
             * @param {Function} getVal function to get value from elements
             * @return {Number}
             */
            maxValue: function( getVal ) {
                return this.compareValues( getVal, Math.max, Number.MIN_VALUE );
            },

            /**
             * get min value
             * @param {Function} getVal function to get value from elements
             * @return {Number}
             */
            minValue: function( getVal ) {
                return this.compareValues( getVal, Math.min, Number.MAX_VALUE );
            },

            /**
             * get total value
             * @param {Function} getVal function to get value from elements
             * @return {Number}
             */
            totalValue: function( getVal ) {
                return this.compareValues( getVal, function( a, b ) {
                    return a + b;
                }, 0 );
            },

            /**
             * get averate value
             * @param {Function} getVal function to get value from elements
             * @return {Number}
             */
            avgValue: function( getVal ) {
                return this.totalValue( getVal ) / this.length;
            }

        };
    };

	//register module
	lola.registerModule( new Module() );

})( lola );

