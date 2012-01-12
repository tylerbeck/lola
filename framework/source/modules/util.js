/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Utility
 *  Description: Utility module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Utility Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var util = {

		//==================================================================
		// Attributes
		//==================================================================


		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.util::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.util.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.util::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.util.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "util";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},

        /**
         * copies primitives from source to target
         * @param source
         * @param target
         */
        copyPrimitives: function( source, target ){
            for (var k in source){
                if (lola.type.isPrimitive(source[k])){
                    target[k] = source[k];
                }
            }
        },

        /**
         * checks for required arguments
         * @param {String} group
         * @param {Array} required
         * @param {Array} info
         * @return {Boolean}
         */
        checkArgs: function ( group, required, info ) {
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
        },


		//==================================================================
		// Classes
		//==================================================================


		//==================================================================
		// Selection Methods
		//==================================================================
		/**
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
			 * @type {Object}
			 */
			var methods = {

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

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================


	//register module
	lola.registerModule( util );

})( lola );
