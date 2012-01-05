(function( lola ) {
	var $ = lola;
	/**
	 * Array Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var array = {

		//==================================================================
		// Attributes
		//==================================================================


		//==================================================================
		// Methods
		//==================================================================
		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.array::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization



			//remove initialization method
			delete lola.array.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 * @default array
		 */
		getNamespace: function() {
			return "array";
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
		 * checks an array of objects for a property with value
		 * @public
		 * @param {Array<Object>} array array to check
		 * @param {String} property property to inspect
		 * @param value value to match
		 * @return {Boolean}
		 */
		hasObjectWithProperty: function ( array, property, value ) {
			var callback = function( item, index, arr ) {
				return item[property] == value;
			};
			return array.some( callback );
		},

		/**
		 * returns a unique copy of the array
		 * @public
		 * @param array
		 * @return {Array}
		 */
		unique: function ( array ) {
			var tmp = [];
			for (var i = array.length-1; i >= 0; i--){
				if (tmp.indexOf( array[i] ) == -1){
					tmp.push( array[i] );
				}
			}

			return tmp;
		},

		/**
		 * checks if array contains object
		 * @public
		 * @param {Array} array
		 * @return {Boolean}
		 */
		isIn: function ( array, value ) {
			return array.indexOf( value ) >= 0;
		},

		/**
		 * removes null values from array
		 * @public
		 * @param {Array} array
		 * @return {Array}
		 */
		pruneNulls: function( array ) {
			var tmp = [];
			array.forEach( function(item){
				if ( item != null ){
					tmp.push( item );
				}
			});
			return tmp;
		},


		/**
		 * creates a sort function for property
		 * @param {String} property
		 * @return {Function}
		 */
		getSortFunction: function( property ){
			return function( a, b ) {
				var x = a[property];
				var y = b[property];
				return ((x < y) ? -1 : ((x > y) ? 1 : 0));
			};
		},

		/**
		 * sort an array on a property
		 * @param {Array} array
		 * @param {String} property
		 */
		sortOn: function( property, array ){
			return array.sort( lola.array.getSortFunction(property) );
		},


		//==================================================================
		// Selector Methods
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

			return methods;

		},


		//==================================================================
		// Prototype Upgrades
		//==================================================================
		/**
		 * upgrades array prototype and is then deleted
		 * @private
		 */
		upgradeArrayPrototype: function() {

			// forEach JS 1.6 ------------------------------------------
			if ( !Array.prototype.forEach ) {
				Array.prototype.forEach = function( fun /*, thisp */ ) {
					"use strict";

					if ( this === void 0 || this === null )
						throw new TypeError();

					var t = Object( this );
					var len = t.length >>> 0;
					if ( typeof fun !== "function" )
						throw new TypeError();

					var thisp = arguments[1];
					for ( var i = 0; i < len; i++ ) {
						if ( i in t )
							fun.call( thisp, t[i], i, t );
					}
				};
			}

			// indexOf JS 1.6 ------------------------------------------
			if ( !Array.prototype.indexOf ) {
				Array.prototype.indexOf = function( searchElement /*, fromIndex */ ) {
					"use strict";

					if ( this === void 0 || this === null )
						throw new TypeError();

					var t = Object( this );
					var len = t.length >>> 0;
					if ( len === 0 )
						return -1;

					var n = 0;
					if ( arguments.length > 0 ) {
						n = Number( arguments[1] );
						if ( n !== n ) // shortcut for verifying if it's NaN
							n = 0;
						else if ( n !== 0 && n !== (1 / 0) && n !== -(1 / 0) )
							n = (n > 0 || -1) * Math.floor( Math.abs( n ) );
					}

					if ( n >= len )
						return -1;

					var k = n >= 0
							? n
							: Math.max( len - Math.abs( n ), 0 );

					for ( ; k < len; k++ ) {
						if ( k in t && t[k] === searchElement )
							return k;
					}
					return -1;
				};
			}

			// lastIndexOf JS 1.6 --------------------------------------
			if ( !Array.prototype.lastIndexOf ) {
				Array.prototype.lastIndexOf = function( searchElement /*, fromIndex*/ ) {
					"use strict";

					if ( this === void 0 || this === null )
						throw new TypeError();

					var t = Object( this );
					var len = t.length >>> 0;
					if ( len === 0 )
						return -1;

					var n = len;
					if ( arguments.length > 1 ) {
						n = Number( arguments[1] );
						if ( n !== n )
							n = 0;
						else if ( n !== 0 && n !== (1 / 0) && n !== -(1 / 0) )
							n = (n > 0 || -1) * Math.floor( Math.abs( n ) );
					}

					var k = n >= 0
							? Math.min( n, len - 1 )
							: len - Math.abs( n );

					for ( ; k >= 0; k-- ) {
						if ( k in t && t[k] === searchElement )
							return k;
					}
					return -1;
				};
			}

			// filter JS 1.6 -------------------------------------------
			if ( !Array.prototype.filter ) {
				Array.prototype.filter = function( fun /*, thisp */ ) {
					"use strict";

					if ( this === void 0 || this === null )
						throw new TypeError();

					var t = Object( this );
					var len = t.length >>> 0;
					if ( typeof fun !== "function" )
						throw new TypeError();

					var res = [];
					var thisp = arguments[1];
					for ( var i = 0; i < len; i++ ) {
						if ( i in t ) {
							var val = t[i]; // in case fun mutates this
							if ( fun.call( thisp, val, i, t ) )
								res.push( val );
						}
					}

					return res;
				};
			}

			// every JS 1.6 --------------------------------------------
			if ( !Array.prototype.every ) {
				Array.prototype.every = function( fun /*, thisp */ ) {
					"use strict";

					if ( this === void 0 || this === null )
						throw new TypeError();

					var t = Object( this );
					var len = t.length >>> 0;
					if ( typeof fun !== "function" )
						throw new TypeError();

					var thisp = arguments[1];
					for ( var i = 0; i < len; i++ ) {
						if ( i in t && !fun.call( thisp, t[i], i, t ) )
							return false;
					}

					return true;
				};
			}

			// map JS 1.6 ----------------------------------------------
			if ( !Array.prototype.map ) {
				Array.prototype.map = function( fun /*, thisp */ ) {
					"use strict";

					if ( this === void 0 || this === null )
						throw new TypeError();

					var t = Object( this );
					var len = t.length >>> 0;
					if ( typeof fun !== "function" )
						throw new TypeError();

					var res = new Array( len );
					var thisp = arguments[1];
					for ( var i = 0; i < len; i++ ) {
						if ( i in t )
							res[i] = fun.call( thisp, t[i], i, t );
					}

					return res;
				};
			}

			// some JS 1.6 ---------------------------------------------
			if ( !Array.prototype.some ) {
				Array.prototype.some = function( fun /*, thisp */ ) {
					"use strict";

					if ( this === void 0 || this === null )
						throw new TypeError();

					var t = Object( this );
					var len = t.length >>> 0;
					if ( typeof fun !== "function" )
						throw new TypeError();

					var thisp = arguments[1];
					for ( var i = 0; i < len; i++ ) {
						if ( i in t && fun.call( thisp, t[i], i, t ) )
							return true;
					}

					return false;
				};
			}

			// reduce ecma-5 -------------------------------------------
			if ( !Array.prototype.reduce ) {
				Array.prototype.reduce = function( accumlator ) {
					var i, l = this.length, curr;

					if ( typeof accumlator !== "function" ) // ES5 : "If IsCallable(callbackfn) is false, throw a TypeError exception."
						throw new TypeError( "First argument is not callable" );

					if ( (l == 0 || l === null) && (arguments.length <= 1) )// == on purpose to test 0 and false.
						throw new TypeError( "Array length is 0 and no second argument" );

					if ( arguments.length <= 1 ) {
						for ( i = 0; i = l; i++ ) // empty array
							throw new TypeError( "Empty array and no second argument" );

						curr = this[i++]; // Increase i to start searching the secondly defined element in the array
					}
					else {
						curr = arguments[1];
					}

					for ( i = i || 0; i < l; i++ ) {
						if ( i in this )
							curr = accumlator.call( undefined, curr, this[i], i, this );
					}

					return curr;
				};
			}

			// isArray ecma-5 ------------------------------------------
			if ( !Array.isArray ) {
				Array.isArray = function( obj ) {
					return Object.prototype.toString.call( obj ) === "[object Array]" ||
							(obj instanceof Array);
				};
			}

		}


	};

	//update array prototype
	array.upgradeArrayPrototype();
	delete array['upgradeArrayPrototype'];

	//register module
	lola.registerModule( array );

})( lola );

