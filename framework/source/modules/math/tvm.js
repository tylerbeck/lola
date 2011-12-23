/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Time Value of Money
 *  Description: Time Value of Money Math module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Time Value of Money Math
	 * @implements {lola.Module}
	 * @memberof lola.math
	 */
	var tvm = {

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
			lola.debug('lola.math.tvm::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization



			//remove initialization method
			delete lola.math.tvm.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.math.tvm::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization



			//remove initialization method
			delete lola.math.tvm.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "math.tvm";
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
		 * present value
		 * @param fv future value
		 * @param rate rate per term
		 * @param term
		 */
		pv: function( fv, rate, term ) {
			return fv / Math.pow( 1 + rate, term );
		},

		/**
		 * future value
		 * @param pv present value
		 * @param rate rate per term
		 * @param term
		 */
		fv: function( pv, rate, term ) {
			return pv * Math.pow( 1 + rate, term );
		},


		/**
		 * present value of an annuity
		 * @param a annuity
		 * @param rate rate per term
		 * @param term
		 */
		pva: function( a, rate, term ) {
			return a * (1 - ( 1 / Math.pow( 1 + rate, term ) ) ) / rate;
		},

		/**
		 * future value of an annuity
		 * @param a annuity
		 * @param rate rate per term
		 * @param term
		 */
		fva: function( a, rate, term ) {
			return a * (Math.pow( 1 + rate, term ) - 1) / rate;
		},

		/**
		 * payment
		 * @param pv present value
		 * @param rate rate per term
		 * @param term
		 * @param fv future value
		 */
		payment: function( pv, rate, term, fv ) {
			var rp = Math.pow( 1 + rate, term );
			return  pv * rate / ( 1 - (1 / rp)) - fv * rate / (rp - 1);
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
	lola.registerModule( tvm );

})( lola );

