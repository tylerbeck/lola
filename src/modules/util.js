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
		namespace: "util",

		//module dependencies
		dependencies: ['array'],

		//initialization flag
		initialized: false,


		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.util.initialized ) {
				//console.info('lola.util.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );


				lola.util.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// prioritySort - sorts on priority property
		//------------------------------------------------------------------
		prioritySort: function ( a, b ) {
			var x = a.priority;
			var y = b.priority;
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		},

		//------------------------------------------------------------------
		// isDescendant - determines if a is descendant of b
		//------------------------------------------------------------------
		isDescendant: function ( a, b ) {
			return lola.util.isAncestor( b, a );
		},

		//------------------------------------------------------------------
		// isAncestor - determines if a is ancestor of b
		//------------------------------------------------------------------
		isAncestor: function ( a, b ) {
			var ancestor = b;
			while ( ancestor && (ancestor = ancestor.parentNode) && ancestor.nodeName != "BODY" ) {
				if (a == ancestor) return true;
			}
			return false;
		},

		//------------------------------------------------------------------
		// setStatus - sets window status text
		//------------------------------------------------------------------
		setStatus: function ( val ) {
			val = val || "";
			lola.window.status = val;
			return true;
		},

		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {
			//iterate through values calling iterator to change this.data.value
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
			},


			valueAtIndex: function( getVal, index ) {
				if ( typeof getVal === 'string' )
					return this.elements[index][getVal];
				else if ( typeof getVal === 'function' )
					return getVal.call( this, this.elements[index] );
			}


   		},

		//==================================================================
		// NEW Javascript Functionality
		//==================================================================
		upgradeObjectPrototype: function() {

			if ( !Object.keys ) {
				Object.keys = function ( object ) {
					var keys = [];
					for ( var name in object ) {
						if ( Object.prototype.hasOwnProperty.call( object, name ) ) {
							keys.push( name );
						}
					}
					return keys;
				};
			}
		}


	};

	Module.upgradeObjectPrototype();
	delete Module.upgradeObjectPrototype;

	lola.registerModule( Module );
})( lola );
