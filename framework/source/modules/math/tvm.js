(function( lola ) {
	var $ = lola;
	/**
	 * @description Math Time Value of Money Module
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
		 * @description preinitializes module
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
		 * @description initializes module
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
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "math.tvm";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},

		/**
		 * @description present value
		 * @param fv future value
		 * @param rate rate per term
		 * @param term
		 */
		pv: function( fv, rate, term ) {
			return fv / Math.pow( 1 + rate, term );
		},

		/**
		 * @description future value
		 * @param pv present value
		 * @param rate rate per term
		 * @param term
		 */
		fv: function( pv, rate, term ) {
			return pv * Math.pow( 1 + rate, term );
		},


		/**
		 * @description present value of an annuity
		 * @param a annuity
		 * @param rate rate per term
		 * @param term
		 */
		pva: function( a, rate, term ) {
			return a * (1 - ( 1 / Math.pow( 1 + rate, term ) ) ) / rate;
		},

		/**
		 * @description future value of an annuity
		 * @param a annuity
		 * @param rate rate per term
		 * @param term
		 */
		fva: function( a, rate, term ) {
			return a * (Math.pow( 1 + rate, term ) - 1) / rate;
		},

		/**
		 * @description payment
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
		 * @description get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * @description module's selector methods
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

