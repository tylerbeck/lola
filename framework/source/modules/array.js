(function( lola ) {
	var $ = lola;
	/**
	 * Array Module
	 * @implements {lola.Module}
     * @namespace lola.array
	 */
	var Array = function(){

        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "array";

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
         * checks an array of objects for a property with value
         * @public
         * @param {Array<Object>} array array to check
         * @param {String} property property to inspect
         * @param value value to match
         * @return {Boolean}
         */
        this.hasObjectWithProperty = function ( array, property, value ) {
            var callback = function( item, index, arr ) {
                return item[property] == value;
            };
            return array.some( callback );
        };

        /**
         * returns a unique copy of the array
         * @public
         * @param array
         * @return {Array}
         */
        this.unique = function ( array ) {
            var tmp = [];
            for (var i = array.length-1; i >= 0; i--){
                if (tmp.indexOf( array[i] ) == -1){
                    tmp.push( array[i] );
                }
            }

            return tmp;
        };

        /**
         * checks if array contains object
         * @public
         * @param {Array} array
         * @return {Boolean}
         */
        this.isIn = function ( array, value ) {
            return array.indexOf( value ) >= 0;
        };

        /**
         * removes null values from array
         * @public
         * @param {Array} array
         * @return {Array}
         */
        this.pruneNulls = function( array ) {
            var tmp = [];
            array.forEach( function(item){
                if ( item != null ){
                    tmp.push( item );
                }
            });
            return tmp;
        };


        /**
         * creates a sort function for property
         * @param {String} property
         * @return {Function}
         */
        this.getSortFunction = function( property ){
            return function( a, b ) {
                var x = a[property];
                var y = b[property];
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            };
        };

        /**
         * sort an array on a property
         * @param {Array} array
         * @param {String} property
         */
        this.sortOn = function( property, array ){
            return array.sort( lola.array.getSortFunction(property) );
        };



        //==================================================================
        // Selector Methods
        //==================================================================
        this.selectorMethods = {

            /**
             * iterates each element in Selector and applies callback.
             * @param {Function} callback function callback( item, index, array ):void
             */
            forEach: function( callback ) {
                this.elements.forEach( callback );
                return this;
            },

            /**
             * iterates each element in Selector and checks that every callback returns true.
             * @param {Function} callback function callback( item, index, array ):Boolean
             */
            every: function( callback ) {
                return this.elements.every( callback );
            },

            /**
             * iterates each element in Selector and checks that at least one callback returns true.
             * @param {Function} callback function callback( item, index, array ):Boolean
             */
            some: function( callback ) {
                return this.elements.some( callback );
            }

        };

    };


	//register module
	lola.registerModule( new Array() );

})( lola );

