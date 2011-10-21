/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Math
 *  Description: math module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "math",

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
			if ( !lola.math.initialized ) {
				//console.info('lola.math.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				lola.math.initialized = true;
			}
		},

		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {

			maxValue: function( getVal ) {
				return this.compareValues( getVal, Math.max, 0 );
			},

			minValue: function( getVal ) {
				return this.compareValues( getVal, Math.min, 0xFFFFFF );
			},

			totalValue: function( getVal ) {
				return this.compareValues( getVal, function( a, b ) {
					return a + b;
				}, 0 );
			},

			avgValue: function( getVal ) {
				return this.totalValue( getVal ) / this.elements.length;
			},


			summaryValue: function( type, getVal ) {
				if ( typeof type === 'number' ) {
					return this.valueAtIndex( getVal, type );
				}
				else {
					switch ( type ) {
						case 'min':
							return this.minValue( getVal );
							break;
						case 'max':
							return this.maxValue( getVal );
							break;
						case 'avg':
							return this.avgValue( getVal );
							break;
						default:
							return this.totalValue( getVal );
							break;
					}
				}
				return 0;
			}

		}

	};

	lola.registerModule( Module );
})( lola );
