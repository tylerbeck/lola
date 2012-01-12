/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Math
 *  Description: Math module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Math Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var math = {

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
			lola.debug('lola.math::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization



			//remove initialization method
			delete lola.math.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.math::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization



			//remove initialization method
			delete lola.math.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "math";
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
		 * normalize radians to 0 to 2 * PI
		 * @param {Number} value radian value
		 * @return {Number}
		 */
		normalizeRadians: function( value ) {
			var unit = 2 * Math.PI;
			while (value < unit)
				value += unit;
			return value % unit;
		},

		/**
		 * normalize degrees to 0 to 360
		 * @param {Number} value radian value
		 * @return {Number}
		 */
		normalizeDegrees: function( value ) {
			while (value < 360)
				value += 360;
			return value % 360;
		},

		/**
		 * normalize a value within a range
		 * @param {Number} min
		 * @param {Number} value
		 * @param {Number} max
		 * @return {Number}
		 */
		normalizeRange: function( min, value, max ){
			return Math.max( min, Math.min( max, value ) );
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
					return this.totalValue( getVal ) / this.elements.length;
				}

			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================




	//register module
	lola.registerModule( math );

})( lola );

