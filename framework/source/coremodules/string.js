/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: String
 *  Description: String module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * String Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var string = {

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
			lola.debug( 'lola.string::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.string.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.string::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.string.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "string";
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
		 * pads the front of a string with the specified character to the specified length
		 * @param {String|int} str
		 * @param {String} chr character to use in pad
		 * @param {int} size padded length
		 */
		padFront: function ( str, chr, size ) {
			str = str.toString();
			while ( str.length < size ) {
				str = chr[0] + str;
			}
			return str;
		},

		/**
		 * pads the end of a string with the specified character to the specified length
		 * @param {String|int} str
		 * @param {String} chr character to use in pad
		 * @param {int} size padded length
		 */
		padEnd: function ( str, chr, size ) {
			str = str.toString();
			while ( str.length < size ) {
				str = str + chr[0];
			}
			return str;
		},

		/**
		 * converts hyphenated strings to camelCase
		 * @param {String} str
		 */
		camelCase: function ( str ) {
			var parts = str.split( "-" );
			var pl = parts.length;
			for ( var i = 1; i<pl; i++ ) {
				if ( parts[i].length > 0 )
					parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
			}

			return parts.join("");
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

			};

			return methods;

		},


		//==================================================================
		// Prototype Upgrades
		//==================================================================
		/**
		 * upgrades string prototype and is then deleted
		 * @private
		 */
		upgradeStringPrototype: function() {

			if ( !String.prototype.trim ) {
				String.prototype.trim = function () {
					return String( this ).replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' );
				};
			}
		}

	};

	//==================================================================
	// Class Prototypes
	//==================================================================


	string.upgradeStringPrototype();
	delete string.upgradeStringPrototype;

	//register module
	lola.registerModule( string );

})( lola );
