/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Time Value of Money
 *  Description: Time Value of Money Math module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
    /**
     * Array Module
     * @namespace lola.array
     */
    var Module = function(){
	    var $ = lola;
	    var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "math.tvm";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [];


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
         * present value
         * @param fv future value
         * @param rate rate per term
         * @param term
         */
        this.pv = function( fv, rate, term ) {
            return fv / Math.pow( 1 + rate, term );
        };

        /**
         * future value
         * @param pv present value
         * @param rate rate per term
         * @param term
         */
        this.fv = function( pv, rate, term ) {
            return pv * Math.pow( 1 + rate, term );
        };


        /**
         * present value of an annuity
         * @param a annuity
         * @param rate rate per term
         * @param term
         */
        this.pva = function( a, rate, term ) {
            return a * (1 - ( 1 / Math.pow( 1 + rate, term ) ) ) / rate;
        };

        /**
         * future value of an annuity
         * @param a annuity
         * @param rate rate per term
         * @param term
         */
        this.fva = function( a, rate, term ) {
            return a * (Math.pow( 1 + rate, term ) - 1) / rate;
        };

        /**
         * payment
         * @param pv present value
         * @param rate rate per term
         * @param term
         * @param fv future value
         */
        this.payment = function( pv, rate, term, fv ) {
            var rp = Math.pow( 1 + rate, term );
            return  pv * rate / ( 1 - (1 / rp)) - fv * rate / (rp - 1);
        };


    };



	//register module
	lola.registerModule( new Module() );

})( lola );

