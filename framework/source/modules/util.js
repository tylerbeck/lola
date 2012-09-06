/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Utility
 *  Description: Utility module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	/**
	 * Utility Module
	 * @namespace lola.util
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
        var namespace = "util";

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
         * copies primitives from source to target
         * @param source
         * @param target
         */
        this.copyPrimitives = function( source, target ){
            for (var k in source){
                if ($.type.isPrimitive(source[k])){
                    target[k] = source[k];
                }
            }
        };

        /**
         * checks for required arguments
         * @param {String} group
         * @param {Array} required
         * @param {Array} info
         * @return {Boolean}
         */
        this.checkArgs = function ( group, required, info ) {
            var check = true;
            var warnings = [];

            for (var i=required.length-1; i >= 0; i--){
                if (required[i][1] === undefined || required[i][1] === null){
                    check = false;
                    warnings.push(required[i][0]+' is not set!')
                }
            }

            if (!check){
                //start group
                if (console.groupCollapsed)
                    console.groupCollapsed( group );
                else
                    console.group( group );

                //error info
                if ($.type.get(info) == 'array'){
                    info.forEach( function(item){
                        console.info( item );
                    });
                }

                //error warnings
                warnings.forEach( function(item){
                    console.warn( item );
                });

                //end group
                console.groupEnd();
            }

            return check;
        };

        /**
         * gets and sets an inline property for client
         * @private
         * @param {*} scope
         * @param {String} name
         * @param {String} type
         * @param {*} defaultValue
         * @return {*}
         */
        this.getInlineValue = function( scope, name, type, defaultValue ){
            var $inline = $('script[type="text/x-$-'+name+'"]', scope );
            if ( $inline.length ){
                //inline property was found
                var value = eval( $inline[0].innerHTML );
                if ( $.type.get( value ) === type.toLowerCase() ){
                    return value;
                }
            }
            return defaultValue;
        };

        /**
         * converts node list to array
         * @param {NodeList} nl
         */
        this.nodeList2Array = function( nl ){
            try {
                return Array.prototype.slice.call( nl, 0 );
            }
            catch(e){
                var arr = [];
                for (var i = nl.length; i--; arr.unshift(nl[i]) ){
                    //intentionally empty
                }
                return arr;
            }
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
             * iterate through values calling iterator to change value
             * @param {Function} getVal function tat returns value from each item
             * @param {Function} compareFn function that compares values / modifies data
             * @param {Object} initialVal initial value;
             * @return {*}
             */
            compareValues: function( getVal, compareFn, initialVal ) {
                var value = initialVal;

                if ( typeof getVal === 'string' ) {
                    this.foreach( function( item ) {
                        value = compareFn.call( this, value, Number( item[getVal] ) );
                    } );
                }
                else if ( typeof getVal === 'function' ) {
                    this.foreach( function( item ) {
                        value = compareFn.call( this, value, getVal.call( this, item ) );
                    } );
                }

                return value;
            }

        };

    };

	//register module
	lola.registerModule( new Module() );

})( lola );
