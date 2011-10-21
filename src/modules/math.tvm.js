/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Utility
 *  Description: utility module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "math.tvm",

		//module dependencies
		dependencies: [],

		//initialization flag
		initialized: false,


		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.math.tvm.initialized ) {
				//console.info('lola.math.tvm.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );


				lola.math.tvm.initialized = true;
			}
		},


		//------------------------------------------------------------------
		// PV: Present Value
		//------------------------------------------------------------------
		PV: function( FV, RATE, TERM ) {
			return FV / Math.pow( 1 + RATE, TERM );
		},

		//------------------------------------------------------------------
		// FV: Future Value
		//------------------------------------------------------------------
		FV: function( PV, RATE, TERM ) {
			return PV * Math.pow( 1 + RATE, TERM );
		},


		//------------------------------------------------------------------
		// PVA: Present Value of an Annuity
		//------------------------------------------------------------------
		PVA: function( A, RATE, TERM ) {
			return A * (1 - ( 1 / Math.pow( 1 + RATE, TERM ) ) ) / RATE;
		},

		//------------------------------------------------------------------
		// FVA: Future Value of an Annuity
		//------------------------------------------------------------------
		FVA: function( A, RATE, TERM ) {
			return A * (Math.pow( 1 + RATE, TERM ) - 1) / RATE;
		},

		//------------------------------------------------------------------
		// Payment: Payment For a loan with the given parameters
		//------------------------------------------------------------------
		Payment: function( PV, RATE, TERM, FV ) {
			var rp = Math.pow( 1 + RATE, TERM );
			return  PV * RATE / ( 1 - (1 / rp)) - FV * RATE / (rp - 1);
		},

		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {


		}

	};
	lola.registerModule( Module );
})( lola );
