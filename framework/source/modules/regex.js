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
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var regex = {

		//==================================================================
		// Attributes
		//==================================================================
		extraSpace: /\s\s+/g,
		isNumber: /^-?\d*(?:\.\d+)?$/,
		isDimension: /^(-?\d*(?:\.\d+)?)(%|in|cm|mm|em|ex|pt|pc|px)$/,
		isColor: /^(#|rgb|rgba|hsl|hsla)(.*)$/,
		isHexColor: /^#([A-F0-9]{3,6})$/,
		isRGBColor: /^rgba?\(([^\)]+)\)$/,
		isHSLColor: /^hsla?\(([^\)]+)\)$/,


		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug('lola.regex::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization



			//remove initialization method
			delete lola.regex.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.regex::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization



			//remove initialization method
			delete lola.regex.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "regex";
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

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================




	//register module
	lola.registerModule( regex );

})( lola );

