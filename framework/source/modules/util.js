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
                if (lola.type.isPrimitive(source[k])){
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
                if (lola.type.get(info) == 'array'){
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
