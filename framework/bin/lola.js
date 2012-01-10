/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Core
 *  Description: Core module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
( function( window ) {
	/**
	 * @namespace lola
	 * @description: Lola Framework core is used to load modules and for top-level framework attributes and methods
	 * @param {String} selector selector string
	 * @param {Object|undefined} context for selection
	 * @return {lola.Selector}
	 */
	var lola = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * @private
		 * @type {int}
		 */
		window: window,

		/**
		 * @private
		 * @type {int}
		 */
		 guid: 0,

		/**
		 * @private
		 * @type {Boolean}
		 */
		initialized: false,

		/**
		 * @private
		 * @type {Array}
		 */
		initializers: [],

		/**
		 * @private
		 * @type {Object}
		 */
		dependencies: {},

		/**
		 * @private
		 * @type {Array}
		 */
		safeDeleteHooks: [],

		/**
		 * @public
		 * @type {Object}
		 */
		urlvars: {},

		/**
		 * @public
		 * @type {String}
		 */
		hash: "",

		/**
		 * @private
		 * @type {Boolean}
		 */
		debugMode: false,

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * framework initialization function
		 * @private
		 * @param wnd {Object} reference to window
		 */
		initialize: function( wnd ) {
			if (!lola.initialized) {
				lola.debug('lola::initialize');
				lola.initialized  = true;
				window = wnd;

				var i;

				//remove auto initialization listeners
				if ( document.addEventListener ) {
					document.removeEventListener( "DOMContentLoaded", lola.initialize, false );
				}
				else if ( document.attachEvent ) {
					document.detachEvent( "onreadystatechange", lola.initialize );
				}

				//check dependencies
                lola.checkDependencies(lola.dependencies);

				//execute initialization stack
				var stackSize = lola.initializers.length;

				for ( i = 0; i < stackSize; i++ ) {
					var initializer = lola.initializers[i];
					if (typeof initializer == "function"){
						initializer();
					}

					delete lola.initializers[i];
				}
			}
		},

        /**
         * checks a dependency map for modules
         * @param {Object} map
         */
        checkDependencies: function( map ){
            var fails = [];
            for ( var k in map ) {
                var missing = this.checkModules( map[k] );
                if ( missing.length > 0 )
                    fails.push(k+': '+missing.join(', '));
            }
            if ( fails.length > 0 ) {
                throw new Error( "module dependency checks failed for: \n\t" + fails.join( "\n\t" ) );
            }
        },

        /**
         * checks if modules are registered and returns missing modules
         * @param {Array} modules
         * @return {Array} missing modules
         */
        checkModules: function( modules ){
            var missing = [];

            Object.forEach(modules, function(item){
                if (!lola.hasPackage( lola, item ))
                    missing.push(item);
            });

            return missing;
        },

		/**
		 * creates/gets and returns the object lineage defined in chain param
		 * @public
		 * @param {!Object} base object on which to build chain
		 * @param {!String} chain "." seperated namespace / package
		 * @return {Object}
		 */
		getPackage: function( base, chain ) {
			//lola.debug('lola::getPackage');
			var result = base;
			if ( typeof chain === 'string' ) {
				var parts = chain.split( '.' );
				var part;
				while ( part = parts.shift() ) {
					if ( result[part] == null  )
                        result[part] = {};
					result = result[part];
				}
			}
			return result;
		},

        /**
         * checks the existence of the object lineage defined in chain param
         * @public
         * @param {!Object} base object on which to build chain
         * @param {!String} chain "." seperated namespace / package
         * @return {Boolean}
         */
        hasPackage: function( base, chain ) {
            var result = base;
            if ( typeof chain === 'string' ) {
                var parts = chain.split( '.' );
                var part;
                while ( part = parts.shift() ) {
                    if ( result[part] == null  )
                        return false;
                    else
                        result = result[part];
                }
            }
            return true;
        },

		/**
		 * extends the target with properties from the source
		 * @public
		 * @param target {Object}
		 * @param source {Object}
		 * @param overwrite {Boolean|undefined}
		 * @param errors {Boolean|undefined}
		 * @return {void}
		 */
		extend: function( target, source, overwrite, errors ) {
			//lola.debug('lola::extend');
			//TODO: make deep copy an option
			if ( overwrite == undefined ) overwrite = false;
			if ( errors == undefined ) errors = false;
			for ( var k in source ) {
				if ( overwrite || target[k] == null )
					target[k] = source[k];
				else if ( errors )
					throw new Error( "property " + k + " already exists on extend target!" );
			}
		},


		/**
		 * eval abstraction
		 * @param {String} expression the expression to evaluate
		 * @param {Object|undefined} node the node in which to load the script
		 */
		evaluate: function( expression, node ) {
			//console.info('eval: '+expression);
			if ( node == null ) {
				node = document.getElementsByTagName( 'head' )[0];
				if ( !node )
					node = document.documentElement;
			}

			var script = document.createElement( 'script' );
			script.type = "text/javascript";

			if ( this.support.domEval ) {
				script.appendChild( document.createTextNode( expression ) );
			}
			else {
				script.text = expression;
			}

			node.insertBefore( script, node.firstChild );
			node.removeChild( script );
		},

		/**
		 * loads a script from a url src
		 * @param {String} src the uri of the script to load
		 * @param {Function|undefined} callback the function to call after the script has loaded
		 */
		loadScript: function( src, callback ) {
			var	node = document.getElementsByTagName( 'head' )[0];
			if ( !node )
				node = document.documentElement;

			var script = document.createElement( 'script' );

            if (typeof callback == "function")
                lola.event.addListener(script, 'load', function(){callback.apply()} );

            script.src = src;
			node.insertBefore( script, node.firstChild );

		},



		/**
		 * registers a module with the Lola Framework
		 * @public
		 * @param {lola.Module} module
		 * @return {void}
		 */
		registerModule: function( module ) {
            var ns = module.getNamespace();
            lola.debug('lola::registerModule - ' + ns );

			//add module dependencies
            if (module.hasOwnProperty('getDependencies') && typeof module.getDependencies=="function")
			    lola.dependencies[ns] =  module.getDependencies();

			//add module to namespace
			lola.extend( lola.getPackage( lola, ns ), module );

			//add selector methods
			lola.extend( lola.Selector.prototype, module.getSelectorMethods() );
			delete module['getSelectorMethods'];

			//add initializer
			if ( module.initialize && typeof module.initialize === "function" ) {
				lola.addInitializer( function() {
					module.initialize();
				} );
			}

			//run preinitialization method if available
			if ( module.preinitialize && typeof module.preinitialize === "function" ) {
				module.preinitialize();
			}
		},

		/**
		 * delete a property on an object and removes framework references
		 * @public
		 * @param {Object} object object on which to delete property
		 * @param {String} property property to delete
		 * @return {void}
		 */
		safeDelete: function( object, property ) {
			//lola.debug('lola::safeDelete');
			var obj = (property) ? object[ property ] : object;
			for ( var i = this.safeDeleteHooks.length - 1; i >= 0; i-- ) {
                if (obj){
                    var hook = this.safeDeleteHooks[i];
                    hook.fn.call( hook.scope, obj );
                }
			}

			if ( object && property ){
                //object[ property ] = null;
                delete object[ property ];
            }

		},

		/**
		 * Object prototype's to string method
		 * @param {Object} object
		 * @return {String}
		 */
		toString: Object.prototype.toString,

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

        /**
         * adds function to initialization stack
         * @param {Function} fn
         */
        addInitializer: function( fn ){
            lola.initializers.push( fn );
        },

        /**
         * outputs debug statement
         */
        debug: function(/*args*/){
			if (lola.debugMode) {
				console.log("["+lola.now()+"]", arguments.join(' '));

			}
		},

        /**
         * get current time in milliseconds
         * @return {uint}
         */
        now: function(){
            return (new Date()).getTime();
        },

        /**
         * used in selector methods to determine whether to return an array
         * or an object
         * @param v
         * @return {*}
         * @private
         */
		__: function( v ){
			return (v.length == 1) ? v[0] : v;
		},

		//==================================================================
		// Prototype Upgrades
		//==================================================================
		/**
		 * upgrades object prototype and is then deleted
		 * @private
		 */
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


            if ( !Object.forEach ){
                Object.forEach = function( obj, fun  ) {
                    "use strict";

                    if ( obj === void 0 || obj === null )
                        throw new TypeError();

                    var t = Object( obj );
                    if ( typeof fun !== "function" )
                        throw new TypeError();

                    var thisp = arguments[2];
                    for ( var k in t ) {
                        if (t.hasOwnProperty(k)){
                            fun.call( thisp, t[k], k, t );
                        }
                    }
                };
            }


		},

		//==================================================================
		// Classes
		//==================================================================
		/**
		 * Selector class
		 * @param {String} selector selector string
		 * @param {Object|undefined} context for selection
		 * @constructor
		 */
		Selector: function( selector, context ) {
			return this.initialize( selector, context );
		},

		/**
		 * Lola Module Interface
		 * @interface
		 */
		Module: function() {
            return this;
		},

        /**
         * URL Class
         * @class
         * @param str
         */
        URL: function( str ){
            return this.init( str );
        }

	};

	//==================================================================
	// Selector Methods
	//==================================================================
	lola.Selector.prototype = {
		/**
		 * internal selection element array
		 * @private
		 * @type {Array}
		 */
		elements: [],

		/**
		 * Selector initialization function
		 * @param {String} selector selector string
		 * @param {Object} context context in which to
		 * @return {lola.Selector}
		 */
		initialize: function( selector, context ) {
			if ( typeof selector === "string" ){
				if (window['Sizzle']) {
					this.elements = Sizzle( selector, context );
				}
				else {
                    try {
                        if (!context)
                            context = document;
                        var nodeList =  context.querySelectorAll( selector );
                        var nl = nodeList.length;
                        this.elements = [];
                        for (var i=0; i<nl; i++){
                            this.elements.push( nodeList.item(i) );
                        }
                    }
                    catch (e){
                        console.log('Exception:', selector );
                    }
					//TODO: write lightweight selector to use if Sizzle not loaded
					//throw new Error( "Sizzle not found" );
				}
			}
			else if ( Array.isArray( selector ) ) {
				this.elements = selector;
			}
			else {
				this.elements = [selector];
			}

			return this;
		},

		/**
		 * assigns guid to elements
		 * @return {lola.Selector}
		 */
		identify: function() {
			this.forEach( function( item ) {
				if ( !item.id )
					item.id = "lola-guid-" + lola.guid++;
			} );

			return this;
		},

		/**
		 * returns the element at the specified index
		 * @param {int} index
		 * @return {Object}
		 */
		get: function( index ) {
			if ( index == undefined )
				index = 0;
			return this.elements[ index ];
		},

		/**
		 * returns all of the selected elements
		 * @return {Array}
		 */
		getAll: function() {
			return this.elements;
		},

		/**
		 * returns element count
		 * @return {int}
		 */
		count: function() {
			return this.elements.length;
		},

		/**
		 *concatenates the elements from one or more
		 * @param {lola.Selector|Array|Object} obj object to concatenate
         * @param {Boolean|undefined}
		 * @return {lola.Selector}
		 */
		concat: function( obj, unique ) {
			if ( obj instanceof lola.Selector ) {
				this.elements = this.elements.concat( obj.getAll() );
			}
			else if ( obj instanceof Array ) {
				var item;
				while ( item = obj.pop() ) {
					this.concat( item, unique );
				}
			}
			else {
				this.elements.push( obj );
			}

            if (unique == undefined || unique === true){
                this.elements = lola.array.unique(this.elements);
            }

			return this;
		}

	};

	//==================================================================
	// Module Interface
	//==================================================================
	lola.Module.prototype = {

		/**
		 * initializes module
		 * @return {void}
		 */
		initialize: function() {
		},

		/**
		 * get module's namespace
		 * @return {String}
		 */
		getNamespace: function() {
			return "";
		},

		/**
		 * get module's dependencies
		 * @return {Array}
		 */
		getDependencies: function() {
			return [];
		},

		/**
		 * get module's selectors
		 * @return {Object}
		 */
		getSelectorMethods: function() {
			return {};
		}

	};

    //==================================================================
    // URL Class
    //==================================================================
    lola.URL.prototype = {
        protocol: "",
        domain:"",
        path:"",
        page:"",
        vars:{},
        hash:"",

        init: function( url ){
            this.parse( url );
            return this;
        },

        parse: function( url ){
            var parts = url.split("#",2);
            this.hash = (parts[1])?parts[1]:"";

            var vars = {};
            parts = parts[0].replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
                vars[key] = value;return "";
            });
            this.vars = vars;

            parts = parts.split(":");
            if (parts.length == 2 ){
                this.protocol = parts[0];
                parts = parts[1].substr(2).split("/");
                this.domain = parts.shift();
            }
            else {
                parts = parts[0].split("/");
            }

            this.page = parts.pop();

            this.path = (this.domain == "" ? "" : "/");
            if (parts.length > 0){
                this.path = this.path+parts.join("/")+"/";
            }
        },

        toString: function(){
            var v = [];
            Object.forEach( this.vars, function( item, key ){
                v.push( key+"="+item );
            });
            var vstr = (v.length)?"?"+v.join("&"):"";
            var hstr = (this.hash == "")?"":"#"+this.hash;
            if (this.protocol != "")
                return this.protocol+"://"+this.domain+this.path+this.page+vstr+hstr;
            else
                return this.path+this.page+vstr+hstr;
        }
    };

	//==================================================================
	// Auto Initialization
	//==================================================================
	var main = function( selector, context ) {
		return new lola.Selector( selector, context );
	};

	lola.upgradeObjectPrototype();
	delete lola.upgradeObjectPrototype;


	lola.extend( main, lola, true );
	lola = main;
	window['$'] = lola;
	window['lola'] = lola;

	lola.url = new lola.URL( window.location.href );
	lola.debugMode = lola.url.vars['debug'] == "true";

	if ( document.readyState === "complete" ) {
		lola.initialize( window );
	}
	else {
		if ( document.addEventListener ) {
			document.addEventListener( "DOMContentLoaded", lola.initialize, false );
			window.addEventListener( "load", lola.initialize, false );
		}
		else if ( document.attachEvent ) {
			document.attachEvent( "onreadystatechange", lola.initialize );
			window.attachEvent( "onload", lola.initialize );
		}
	}

})( window );


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

/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: CSS
 *  Description: CSS module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * CSS Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var css = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * cache for fixed/mapped style properties
		 * @private
		 */
		propertyCache: {},

		/**
		 * cache for fixed/mapped selectors
		 * @private
		 */
		selectorCache: {},

		/**
		 * style property hooks
		 * @private
		 */
		propertyHooks: {},

		/**
		 * references to dynamic stylesheets
		 * @private
		 */
		stylesheets: {},

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.css::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization

			//remove initialization method
			delete lola.css.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.css::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization
			lola.support.cssRules = ( (document.styleSheets.length > 0 && document.styleSheets[0].cssRules) || !document.createStyleSheet ) ? true : false;

            //add default hooks
            var dimensionals = "padding margin background-position border-top-width border-right-width border-bottom-width "+
                "border-left-width border-width bottom font-size height left line-height list-style-position "+
                "margin margin-top margin-right margin-bottom margin-left max-height max-width min-height "+
                "min-width outline-width padding padding-top padding-right padding-bottom padding-left right "+
                "text-indent top width";

            dimensionals.split(' ').forEach( function( item ){
                lola.css.registerStyleHook( item, lola.css.dimensionalHook );
            });

			//add default stylesheet for dynamic rules
			this.addStyleSheet( "_default" );

			//add default mappings
			this.propertyCache['float'] = (lola.support.cssFloat) ? 'cssFloat' : 'styleFloat';

			//remove initialization method
			delete lola.css.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "css";
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
		 * returns whether or not an object can have styles applied
		 * @param {*} obj
		 */
		canStyle: function( obj ) {
			//TODO: Implement canStyle function
			return true
		},

		/**
		 * gets mapped selector string
		 * @param {String} selector
		 * @return {String}
		 */
		getSelector: function( selector ) {
			if ( !this.selectorCache[selector] )
				this.selectorCache[selector] = lola.string.camelCase( selector );
			return this.selectorCache( selector );
		},

		/**
		 * gets mapped selector string
		 * @param {String} property
		 * @return {String}
		 */
		getProperty: function( property ) {
			if ( !this.propertyCache[property] )
				this.propertyCache[property] = lola.string.camelCase( property );
			return this.propertyCache[ property ];
		},

        /**
         * gets/sets style on an object
         * @public
         * @param {Object} obj styleable object
         * @param {String} style style property
         * @param {*} value leave undefined to get style
         * @return {*}
         */
        style: function( obj, style, value ) {
            //make sure style can be set
            var prop = lola.css.getProperty( style );
            if ( lola.css.canStyle( obj ) ) {
                if ( lola.css.propertyHooks[ prop ] != null ) {
                    return lola.css.propertyHooks[prop].apply( obj, arguments );
                }
                else {
                    if ( value == undefined )
                        css.getRawStyle( obj, prop );
                    else
                        css.setRawStyle( obj, prop, value );
                }
            }

            return false;
        },

        /**
         * gets raw style of an object
         * @public
         * @param {Object} obj styleable object
         * @param {String} style style property
         * @return {String}
         */
        getRawStyle: function ( obj, style ){
            var prop = lola.css.getProperty( style );
            if (document.defaultView && document.defaultView.getComputedStyle) {
                return document.defaultView.getComputedStyle( obj, undefined )  [ prop ];
            }
            else if ( typeof(document.body.currentStyle) !== "undefined") {
                return obj["currentStyle"][prop];
            }
            else {
                return obj.style[prop];
            }
        },

        /**
         * sets raw style on an object
         * @public
         * @param {Object} obj styleable object
         * @param {String} style style property
         * @param {*} value leave undefined to get style
         */
        setRawStyle: function( obj, style, value ){
            var prop = lola.css.getProperty( style );
            return obj.style[ prop ] = value;
        },

        /**
         * registers hook for style property
         * @param {String} style
         * @param {Function} fn function(obj, style, value):*
         */
        registerStyleHook: function( style, fn ){
            var prop = lola.css.getProperty( style );
            css.propertyHooks[ prop ] = fn;
        },

        /**
         * sets a dimension style with or without units
         * gets a dimensional style with no units
         * @param obj
         * @param style
         * @param value
         * @private
         */
        dimensionalHook: function( obj, style, value ){
            if (value == undefined) {
                var val = css.getRawStyle( obj, style );
                return parseFloat(val.replace( lola.regex.isDimension, "$1"));
            }
            else {
                value = (String(value).match(lola.regex.isDimension)) ? value : value+"px";
                css.setRawStyle( obj, style, value );
            }
        },

		/**
		 * adds a stylesheet to the document head with an optional source
		 * @param {String|undefined} id reference id for stylesheet
		 * @param {String|undefined} source url for external stylesheet
		 */
		addStyleSheet: function( id, source ) {
			var stylesheet = (lola.support.cssRules) ? document.createElement( 'style' ) : document.createStyleSheet();
			if (source) {
				stylesheet.source = source;
			}
			if (id) {
				this.registerStyleSheet( stylesheet, id );
			}
			lola('head').appendChild( stylesheet );
		},

		/**
		 * registers a stylesheet with the css module
		 * @param {Node} stylesheet stylesheet object reference
		 * @param {String} id the id with which to register stylesheet
		 */
		registerStyleSheet: function( stylesheet, id ) {
			this.stylesheets[ id ] = stylesheet;
		},

		/**
		 * adds a selector to a stylesheet
		 * @param {String} selector
		 * @param {Object} styles an object containing key value pairs of style properties and values
		 * @param {String|Object|undefined} stylesheet registered stylesheet id or stylesheet reference
		 * @return {Object}
		 */
		addSelector: function( selector, styles, stylesheet ) {
			if (lola.type.get(stylesheet) == "string" ){
				stylesheet = this.stylesheets["_default"];
			}
			stylesheet = stylesheet || this.stylesheets["_default"];
			styles = styles || [];

			var ri = lola.support.cssRules ? stylesheet.cssRules.length : stylesheet.rules.length;
			if ( stylesheet.addRule )
				stylesheet.addRule( selector, null, ri );
			else
				stylesheet.insertRule( selector + ' { }', ri );

			var rule = lola.support.cssRules ? stylesheet.cssRules[ri] : stylesheet.rules[ri];
			if ( styles ){
				var props = styles.keys();
				props.forEach( function( item ){
					lola.css.style( rule, item, styles[item] );
				});
			}

			return rule;
		},
		/**
		 * performs action on matching rules
		 * @param {String} selector
		 * @param {Function} action
		 * @param {String} media
		 */
		performRuleAction: function( selector, action, media ) {
			selector = selector.toLowerCase();
			media = media ? media.toLowerCase() : '';
			for ( var si = 0; si < document.styleSheets.length; si++ ) {
				var ss = document.styleSheets[si];
				//match media
				if ( !media || media == ss.mediaText ) {
					var rules = (lola.support.cssRules) ? ss.cssRules : ss.rules;
					for ( var ri in rules ) {
						if ( rules[ri] && rules[ri].selectorText ) {
							if ( rules[ri].selectorText.toLowerCase() == selector ) {
								console.info( 'matched rule: ' + rules[ri].selectorText );
								action( si, ri );
							}
						}
					}
				}
			}
		},

		/**
		 * returns an array of matching rules
		 * @param {String} selector
		 * @param {String} media
		 * @return {Array}
		 */
		getRules: function( selector, media ) {
			var rules = [];
			lola.css.performRuleAction( selector, function( si, ri ) {
				if ( lola.support.cssRules )
					rules.push( document.styleSheets[ si ].cssRules[ ri ] );
				else
					rules.push( document.styleSheets[ si ].rules[ ri ] );
			}, media );
			return rules;
		},

		/**
		 * updates rules in matching selectors
		 * @param {String} selector
		 * @param {Object} styles an object containing key value pairs of style properties and values
		 * @param {String} media
		 * @return {Array}
		 */
		updateRules: function( selector, styles, media ) {
			var rules = lola.css.getRules( selector, media );
			var props = styles.keys();
			props.forEach( function( item ){
				rules.forEach( function( rule ){
					lola.css.style( rule, item, styles[item] );
				});
			});

			return rules;
		},

		/**
		 * deletes matching rules
		 * @param selector
		 * @param media
		 */
		deleteRules: function( selector, media ) {
			lola.css.performRuleAction( selector, function( si, ri ) {
				if ( lola.support.cssRules )
					document.styleSheets[ si ].deleteRule( ri );
				else
					document.styleSheets[ si ].removeRule( ri );
			}, media )
		},

		/**
		 * gets or sets an objects classes
		 * @param {Node} obj
		 * @param {String|Array|undefined} classes leave undefined to get classes
		 * @return {Array}
		 */
		classes: function( obj, classes ) {
			if ( classes != undefined ) {
				if ( lola.type.get( classes ) != 'array' ) {
					if ( lola.type.get( classes ) == 'string' )
						classes = [classes];
					else
						classes = [];
				}

				obj.className = classes.join( " " );
				return classes;

			}
			else {
				var names = obj.className.replace( lola.regex.extraSpace, " " );
				return names.split( " " ).reverse();
			}
		},

		/**
		 * returns
		 * @param obj
		 * @param className
		 */
		hasClass: function( obj, className ) {
			var names = lola.css.classes( obj );
			return lola.array.isIn( names, className );
		},

		/**
		 * adds class to object if not already added
		 * @param {Node} obj
		 * @param {String} className
		 */
		addClass: function( obj, className ) {
			var names = lola.css.classes( obj );
			if ( !lola.array.isIn( names, className ) ) {
				names.push( className );
				lola.css.classes( obj, names );
			}
		},

		/**
		 * removes a class from an object
		 * @param {Node} obj
		 * @param {String} className
		 */
		removeClass: function( obj, className ) {
			var names = lola.css.classes( obj );
			var index = names.indexOf( className );
			if ( index >= 0 ) {
				names.splice( index, 1 );
				lola.css.classes( obj, names );
			}
		},

		/**
		 * removes an objects style property
		 * @param obj
		 * @param style
		 */
		clearStyle: function( obj, style ) {
			delete obj.style[ lola.css.getProperty( style ) ];
		},

		/**
		 * parses an RGB or RGBA color
		 * @param {String} val
		 */
		parseRGBColor: function( val ) {
			var rgba = { r:0, g:0, b:0, a:1 };
			var parts = val.match( lola.type.rIsRGBColor );
			if ( parts != null ) {
				var v = parts[1].replace( /\s+/g, "" );
				v = v.split( ',' );
				rgba.r = lola.css.parseColorPart( v[0], 255 );
				rgba.g = lola.css.parseColorPart( v[1], 255 );
				rgba.b = lola.css.parseColorPart( v[2], 255  );
				rgba.a = (v.length > 3) ? lola.css.parseColorPart( v[3], 1 ) : 1;
			}
			return rgba;
		},

		/**
		 * parses an HSL or HSLA color
		 * @param {String} val
		 * @return {Object}
		 */
		parseHSLColor: function( val ) {
			var hsla = { h:0, s:0, l:0, a:1 };
			var parts = val.match( lola.type.rIsHSLColor );
			if ( parts != null ) {
				var v = parts[1].replace( /\s+/g, "" );
				v = v.split( ',' );
				hsla.h = lola.css.parseColorPart( v[0], 360  );
				hsla.s = lola.css.parseColorPart( v[1], 1  );
				hsla.l = lola.css.parseColorPart( v[2], 1  );
				hsla.a = (v.length > 3) ? lola.css.parseColorPart( v[3], 1 ) : 1;
			}
			return hsla;
		},

		/**
		 * parses color part value
		 * @private
		 * @param {String} val
		 * @return {Number}
		 */
		parseColorPart: function( val, divisor ) {
			if ( val ) {
				if ( val.indexOf( '%' ) > 0 )
					return parseFloat( val.replace( /%/g, "" ) ) / 100;
				else
					return parseFloat( val ) / divisor;
			}
			return 0;

		},


		//==================================================================
		// Classes
		//==================================================================
		Color: function( value ){
			return this.init( value );
		},

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
				 * sets or gets element css property
				 * @param {String} property
				 * @param {*} value
				 */
				style: function( property, value ) {
					if ( value != undefined ) {
						this.forEach( function( item ) {
							lola.css.style( item, property, value );
						} );
						return this;
					}
					else {
						var values = [];
						this.forEach( function(item){
							values.push( lola.css.style( item, property ) )
						});
						return lola.__(values);
					}
				},

				/**
				 * sets or gets classes for elements
				 * @param {String|Array|undefined} values
				 */
				classes: function( values ) {
					if ( values != undefined ) {
						//set class names
						this.forEach( function( item ) {
							lola.css.classes( item, values );
						} );
						return this;

					}
					else {
						//get class names
						var names = [];
						this.forEach( function( item ) {
							names.push( lola.css.classes( item ) );
						} );

						return lola.__(names);
					}
				},

				/**
				 * checks that all elements in selector have class
				 * @param {String} name
				 */
				hasClass: function( name ) {
					var check = true;
					this.forEach( function( item ) {
						if (!lola.css.hasClass( item, name )){
							check = false;
						}
					} );
					return check;
				},

				/**
				 * adds class to all elements
				 * @param {String} name
				 */
				addClass: function( name ) {
					this.forEach( function( item ) {
						lola.css.addClass( item, name );
					} );
					return this;
				},

				/**
				 * removes class from all elements
				 * @param {String} name
				 */
				removeClass: function( name ) {
					this.forEach( function( item ) {
						lola.css.removeClass( item, name );
					} );
					return this;
				}

			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================
	css.Color.prototype = {

		/**
		 * output color type
		 * @private
		 */
		outputType: "",

		/**
		 * hex color value object
		 * @public
		 */
		hexValue: null,

		/**
		 * rgba color value object
		 * @public
		 */
		rgbValue: null,

		/**
		 * hsla color value object
		 * @public
		 */
		hslValue: null,

		/**
		 * class initialization function
		 * @param value
		 */
		init: function( value ){
			if (value) this.parseString( value );
			return this;
		},

		/**
		 * parses style color values returns rgba object
		 * @public
		 * @param {String} val
		 */
		parseString: function( val ) {
			//console.info('parseColor ------ ');
			var cparts = val.match( lola.regex.isColor );
			if ( cparts ) {
				var parts,rgb,hsl,hex;
				switch ( cparts[1] ) {
					case '#':
						parts = val.match( lola.regex.isHexColor );
						hex = ( parts != null ) ? parts[1] : "000000";
						rgb = lola.math.color.hex2rgb(hex);
						hsl = lola.math.color.rgb2hsl(rgb.r,rgb.g,rgb.b);
						rgb.a = hsl.a = 1;
						break;
					case 'rgb':
					case 'rgba':
						rgb = lola.css.parseRGBColor( val );
						hsl = lola.math.color.rgb2hsl(rgb.r,rgb.g,rgb.b);
						hex = lola.math.color.rgb2hex(rgb.r,rgb.g,rgb.b);
						hsl.a = rgb.a;
						this.valueType = "rgba";
						break;
					case 'hsl':
					case 'hsla':
						hsl = lola.css.parseHSLColor( val );
						rgb = lola.math.color.hsl2rgb(hsl.h,hsl.s,hsl.l);
						hex = lola.math.color.rgb2hex(rgb.r,rgb.g,rgb.b);
						rgb.a = hsl.a;
						this.valueType = "hsla";
						break;
				}

				this.hexValue = hex;
				this.rgbValue = rgb;
				this.hslValue = hsl;
			}
		},

		/**
		 * outputs a css color string of the type specified in outputType
		 * @return {String}
		 */
		toString: function() {
			switch (this.outputType) {
				case "#":
					return this.toHexString();
				case "hsl":
					return this.toHslString();
				case "hsla":
					return this.toHslaString();
				case "rgb":
					return this.toRgbString();
				default:
					return this.toRgbaString();
			}
		},

		/**
		 * returns the uint value of color object
		 * @return {uint}
		 */
		toInt: function() {
			return parseInt("0x" + this.hexValue );
		},

		/**
		 * outputs a css color hex string
		 * @return {String}
		 */
		toHexString: function() {
			return "#" + this.hexValue;
		},

		/**
		 * outputs a css color hsl string
		 * @return {String}
		 */
		toHslString: function() {
			return "hsl("+
					Math.round( this.hslValue.h * 360 )+","+
					Math.round( this.hslValue.s * 100 )+"%,"+
					Math.round( this.hslValue.l * 100 )+"%)";
		},

		/**
		 * outputs a css color hsla string
		 * @return {String}
		 */
		toHslaString: function() {
			return "hsla("+
					Math.round( this.hslValue.h * 360 )+","+
					Math.round( this.hslValue.s * 100 )+"%,"+
					Math.round( this.hslValue.l * 100 )+"%,"+
					this.hslValue.a+"%)";
		},

		/**
		 * outputs a css color rgb string
		 * @return {String}
		 */
		toRgbString: function() {
			return "rgb("+
					Math.round( this.rgbValue.r * 255 )+","+
					Math.round( this.rgbValue.g * 255 )+","+
					Math.round( this.rgbValue.b * 255 )+")";
		},

		/**
		 * outputs a css color rgba string
		 * @return {String}
		 */
		toRgbaString: function() {
			return "rgba("+
					Math.round( this.rgbValue.r * 255 )+","+
					Math.round( this.rgbValue.g * 255 )+","+
					Math.round( this.rgbValue.b * 255 )+","+
					this.rgbValue.a+")";
		}
	};

	//register module
	lola.registerModule( css );

})( lola );
/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Data
 *  Description: Data module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Data Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var data = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * cache for all data storage
		 * @private
		 */
		cache: {},

		/**
		 * uid for data references
		 * @private
		 */
		uid: 1,

		/**
		 * attribute for data storage uid
		 * @private
		 */
		cacheIDProp: "LOLA-DATA-UID",

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.data::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization
			lola.safeDeleteHooks.push( {scope:this, fn:this.remove} );

			//remove initialization method
			delete lola.data.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.data::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.data.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "data";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ["support"];
		},

		/**
		 * get next data uid
		 * @return {int}
		 * @private
		 */
		nextUid: function() {
			return lola.data.uid++;
		},

		/**
		 * links element with data cache
		 * @param {Object} object
		 * @param {Boolean|undefined} create defaults to true,
		 * set to false to prevent creating a cache if one doesn't already exist
		 */
		getCacheId: function( object, create ) {
			create = (create == undefined) ? true : create;
			//assume if create cache is being called that ther is no cache
			var cacheId = lola.dom.attr( object, lola.data.cacheIDProp );
			if ( cacheId == null ) {
				switch ( lola.type.get( object ) ) {
					case 'function':
					case 'object':
						cacheId = object[lola.data.cacheIDProp];
						if ( cacheId == null && create ) {
							cacheId = lola.data.nextUid();
							object[lola.data.cacheIDProp] = cacheId;
						}
						break;
					case 'applet':
					case 'embed':
					case 'number':
					case 'date':
					case 'array':
					case 'boolean':
					case 'regexp':
					case 'string':
					case 'textnode':
					case 'commentnode':
						//not supported
						break;
					case 'htmlobject':
						//TODO: implement special case for flash objects
						break;
					default:
						//get attribute
						cacheId = lola.dom.attr( object, lola.data.cacheIDProp );
						if ( cacheId == null && create ) {
							cacheId = lola.data.nextUid();
							lola.dom.attr( object, lola.data.cacheIDProp, cacheId );
						}
						break;
				}
			}
			return cacheId;
		},

		/**
		 * gets an objects data for the specified namespace
		 * @param {Object} object the object for which to retrieve data
		 * @param {String} namespace the namespace to retrieve
		 * @param {Boolean|undefined} create namespace data for object if not found,
		 * defaults to false
		 */
		get: function( object, namespace, create ) {
			var cacheId = lola.data.getCacheId( object, false );
			//console.log('data.get: ' + object);
			if ( lola.data.cache[namespace] == null || cacheId == null ) {
				if (create) {
					var obj = {};
					return lola.data.set( object, obj, namespace, false );
				}
				else {
					return null;
				}
			}
			else
				return lola.data.cache[namespace][cacheId];
		},

		/**
		 * gets data for entire namespace
		 * @param {String} namespace the namespace to get from data cache
		 */
		getNamespaceData: function( namespace ) {
			return lola.data.cache[namespace];
		},

		/**
		 * replaces/updates existing object data
		 * @param {Object} object
		 * @param {Object} data
		 * @param {String} namespace namespace to put data
		 * @param {Boolean|undefined} overwite overwite existing data, defaults to false
		 */
		set: function( object, data, namespace, overwite ) {
			//console.info( 'lola.data.set: ' + object + "::" + namespace + ' replace=' + replace );
			//check for existing cache
			var cacheId = lola.data.getCacheId( object, true );

			if ( lola.data.cache[namespace] == null )
				lola.data.cache[namespace] = {};

			if ( overwite || lola.data.cache[namespace][cacheId] == null )
				lola.data.cache[namespace][cacheId] = data;
			else
				lola.extend( lola.data.cache[namespace][cacheId], data, true );

			return lola.data.cache[namespace][cacheId];
		},

		/**
		 * removes object data
		 * @param {Object} object
		 * @param {String|undefined} namespace namespace to remove data,
		 * removes data from all namespaces if undefined
		 * @param {Boolean|undefined} recurse recurse childNodes to delete data
		 */
		remove: function( object, namespace, recurse ) {
			//console.info( 'lola.data.remove: ' + object + "::" + namespace );
			//remove object data
			var cacheId = lola.data.getCacheId( object, false );
			if ( cacheId ) {
				if ( namespace == null || namespace == undefined ) {
					namespace = [];
					for ( var ns in lola.data.cache ) {
						namespace.push( ns );
					}
				}
				else {
					if ( lola.type.get(namespace) != "array" )
						namespace = [namespace];
				}

				namespace.forEach( function( nsp ) {
					delete lola.data.cache[nsp][cacheId];
				} )

			}
			if (recurse === undefined)
				recurse == true;

			if ( recurse ) {
				if ( object.childNodes ) {
					object.childNodes.forEach( function( item ) {
						lola.data.remove( item, namespace, true );
					} )
				}
			}

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
				 * get data for elements
				 * @param {String} namespace
				 * @param {Boolean|undefined} create create data object if null
				 * @return {Array}
				 */
				getData: function( namespace, create ) {
					var data = [];
					this.forEach( function( item ) {
						data.push( lola.data.get( item, namespace, create ) )
					} );
					return lola.__(data);
				},

				/**
				 * put data for elements
				 * @param {Object} data data to put in cache for elements (overwrites)
				 * @param {String} namespace
				 * @return {lola.Selector}
				 */
				putData: function( data, namespace ) {
					this.forEach( function( item ) {
						lola.data.set( item, data, namespace, true );
					} );
					return this;
				},

				/**
				 * updates data for elements
				 * @param {Object} data
				 * @param {String} namespace
				 * @return {lola.Selector}
				 */
				updateData: function( data, namespace ) {
					this.forEach( function( item ) {
						//clear data
						lola.data.set( item, data, namespace, false );
					} );
					return this;
				},

				/**
				 * remove specified namespaces from data cache
				 * @param {Array|String|undefined} namespace
				 * @param {Boolean|undefined} recurse recurse childNodes, defaults to false
				 * @return {lola.Selector}
				 */
				removeData: function( namespace, recurse ) {
					this.forEach( function( item ) {
						//clear data
						lola.data.remove( item, namespace, recurse );
					} );
					return this;
				},

				/**
				 * remove specified namespaces from data cache
				 * @param {Boolean|undefined} recurse recurse childNodes, defaults to false
				 * @return {lola.Selector}
				 */
				removeAllData: function( recurse ) {
					return this.removeData( null, recurse );
				}
			};

			return methods;

		}



	};


	//register module
	lola.registerModule( data );

})( lola );
/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: DOM
 *  Description: DOM module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * DOM Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var dom = {

		//==================================================================
		// Attributes
		//==================================================================

		/**
		 * map of attribute getter/setter hooks
		 * @private
		 * @type {Array}
		 */
		attributeHooks: {},

		//==================================================================
		// Methods
		//==================================================================
        /**
         * preinitializes module
         * @private
         * @return {void}
         */
        preinitialize: function() {
            lola.debug( 'lola.dom::preinitialize' );
            if ( !lola ) throw new Error( 'lola not defined!' );

            //do module preinitialization
            //lola.safeDeleteHooks.push( {scope:this, fn:this.remove} );


            //remove initialization method
            delete lola.dom.preinitialize;
        },

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.dom::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization

			//remove initialization method
			delete lola.dom.initialize;


		},
		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "dom";
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
		 * sets or gets an node attribute
		 * @param {Object} object the object on which to access the attribute
		 * @param {String} name the name of the attribute
		 * @param {*} value (optional) value to set
		 */
		attr: function( object, name, value ) {
			//console.log('dom.attr');
			if ( this.attributeHooks[name] ) {
				return this.attributeHooks[name].apply( object, arguments );
			}
			else {
				if ( value || value == "") {   //set value
					if (lola(value).isPrimitive()) {
						return object[name] = value;
					}
					else {
						throw new Error('attribute values must be primitives');
					}
				}
				else {
					return object[name];
				}
			}
		},

		/**
		 * deletes expando properties
		 * @param {Object} object
		 * @param {String} name
		 */
		deleteExpando: function( object, name ) {
			if ( lola.support.deleteExpando )
				delete object[name];
			else
				object[name] = null;
		},

		//------------------------------------------------------------------
		// isDescendant - determines if a is descendant of b
		//------------------------------------------------------------------
		/**
		 * determines if element a is descendant of element b
		 * @param {Node} a
		 * @param {Node} b
		 */
		isDescendant: function ( a, b ) {
			return lola.dom.isAncestor( b, a );
		},

		/**
		 * determines if element a is an ancestor of element b
		 * @param {Node} a
		 * @param {Node} b
		 */
		isAncestor: function ( a, b ) {
			var ancestor = b;
			while ( ancestor && (ancestor = ancestor.parentNode) && ancestor.nodeName != "BODY" ) {
				if (a == ancestor) return true;
			}
			return false;
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
				 *  gets sub selection
				 * @return {lola.Selector}
				 */
				find: function( selector ) {
					var $instance = $([]);
					this.forEach( function(item){
						var $tmp = $(selector, item);
						$instance.concat( $tmp );
					});

					return $instance;
				},

				/**
				 *  generation selection
				 * @return {lola.Selector}
				 */
				generation: function( count ) {
					if (!count)
						count = 1;

					var $instance = $([]);
					this.forEach( function(item){
						var ancestor = item;
						var index = 0;
						while( ancestor = ancestor.parentNode && index < count ){
							index++;
						}
						if (ancestor)
							$instance.concat( [ancestor] );
					});

					return $instance;
				},

				/**
				 *  sets or gets html on elements
				 * @return {lola.Selector|Array}
				 */
				html: function( content ) {
					if ( arguments.length == 0 ) {
						var values = [];
						this.forEach( function( item ) {
							values.push( (item) ? item.innerHTML : null );
						} );
						return lola.__(values);
					}
					else {
						this.forEach( function( item ) {
                            if (item.hasOwnProperty('childNodes')){
                                var cnl = item.childNodes.length;
                                for ( var i=0; i<cnl; i++ ) {
                                    var child = item.childNodes.item(i);
                                    lola.safeDelete( child );
                                }
                                switch ( lola.type.get( content ) ) {
                                    case 'null':
                                    case 'undefined':
                                        item.innerHTML = "";
                                        break;
                                    case 'string':
                                        item.innerHTML = content;
                                        break;
                                    case 'array':
                                        item.innerHTML = "";
                                        for ( var c in content ) {
                                            item.appendChild( c );
                                        }
                                        break;
                                    default:
                                        item.innerHTML = "";
                                        item.appendChild( content );
                                        break;
                                }
                            }
						} );
						return this;
					}
				},

				/**
				 *  appends node to first selection element in DOM
				 * @param {Element} node
				 * @return {lola.Selector}
				 */
				appendChild: function( node ) {
					if ( this.elements.length > 0 ) {
						this.get().appendChild( node );
					}

					return this;
				},

				/**
				 *  prepends node to first selection element in DOM
				 * @param {Element} node
				 * @return {lola.Selector}
				 */
				prependChild: function( node ) {
					if ( this.elements.length > 0 ) {
						this.get().insertBefore( node, this.get().firstChild );
					}

					return this;
				},

				/**
				 *  clones first selection element
				 * @param {Boolean} deep
				 * @return {Element}
				 */
				cloneNode: function( deep ) {
					if ( this.elements.length > 0 ) {
						return this.get().cloneNode( deep );
					}
					return null;
				},

				/**
				 *  inserts node before first element in DOM
				 * @param {Element} node
				 * @return {lola.Selector}
				 */
				insertBefore: function( node ) {
					if ( this.elements.length > 0 ) {
						this.get().insertBefore( node );
					}
					return this;
				},

				/**
				 *  removes node from first element in DOM
				 * @param {Element} node
				 * @return {lola.Selector}
				 */
				removeChild: function( node ) {
					if ( this.elements.length > 0 ) {
						lola.safeDelete( node );
						this.get().removeChild( node );
					}
					return this;
				},

				/**
				 *  replaces node in first element in DOM
				 * @param {Element} newChild
				 * @param {Element} oldChild
				 * @return {lola.Selector}
				 */
				replaceChild: function( newChild, oldChild ) {
					if ( this.elements.length > 0 ) {
						lola.safeDelete( oldChild );
						//TODO: check if call to below line is needed
						//lola.data.destroyCache( oldChild, true );
						this.get().replaceChild( newChild, oldChild );
					}
					return this;
				},

				/**
				 *  sets or gets attributes
				 * @param {String} name
				 * @param {*} value
				 * @return {lola.Selector|Array}
				 */
				attr: function( name, value ) {
					if ( value != undefined ) {
						this.forEach( function( item ) {
							lola.dom.attr( item, name, value );
						} );
						return this;
					}
					else {
						var values = [];
						this.forEach( function( item ) {
							values.push( lola.dom.attr( item, name ) );
						} );
						return lola.__(values);
					}
				},

				/**
				 *  removes attribute from elements
				 * @param {String} name
				 * @return {lola.Selector}
				 */
				removeAttr: function( name ) {
					this.forEach( function( item ) {
						item.removeAttribute( name );
					} );
					return this;
				},

				/**
				 *  sets new parent elements
				 * @param {String} newParent
				 * @return {lola.Selector|Array}
				 */
                 parent: function( newParent ) {
					if ( newParent != undefined ) {
						this.forEach(function(item){
							$(newParent).appendChild( item );
						});
						return this;
					}
					else {

						var values = [];
						this.forEach( function( item ) {
							values.push( item?item.parentNode:null );
						} );
						return lola.__(values);
					}
				},

				/**
				 *  deletes expando property on elements
				 * @param {String} name
				 * @return {lola.Selector}
				 */
				deleteExpando: function( name ) {
					this.forEach( function( item ) {
						lola.deleteExpando( item, name );
					} );
					return this;
				}



			};

			return methods;

		}

	};


	//register module
	lola.registerModule( dom );

})( lola );

/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Event
 *  Description: Event module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Event Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var event = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * event maping
		 * @private
		 * @type {Object}
		 */
		map: { 'mousewheel':['mousewheel','DOMMouseScroll'] },

		/**
		 * event hooks
		 * @private
		 * @type {Object}
		 */
		hooks: {},

		/**
		 * event listener uid
		 * @type {int}
		 */
		uid: 0,



		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.event::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.event.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.event::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.event.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "event";
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
		 * add a framework event listener
		 * @param {Object} target
		 * @param {String} type
		 * @param {Function} handler
		 * @param {Boolean|undefined} useCapture
		 * @param {uint|undefined} priority default 0xFFFFFF
		 * @param {Object|undefined} scope
		 */
		addListener: function( target, type, handler, useCapture, priority, scope ) {
			var required = [['target',target],['type',type],['handler',handler]];
			var info = [target,'type: '+type,'useCapture: '+useCapture];
			if ( lola.checkArgs('ERROR: lola.event.addListener( '+type+' )', required, info) ){
				if (lola.event.hooks[type] != null){
					return lola.event.hooks[type]['addListener'].call( lola.event.hooks[type], target, type, handler, useCapture, priority, scope );
				}
				else {
					var data = lola.data.get( target, lola.event.dataNs );
					if ( !data ) {
						data = { capture:{}, bubble:{} };
						lola.data.set( target, data, lola.event.dataNs, true );
					}

					var phase = lola.event.phaseString( target, useCapture );
					priority = priority || event.PRIORITY_NORMAL;
					scope = scope || target;

					//assign handler a uid so it can be easily referenced
					if ( handler.uid == null )
						handler.uid = lola.event.uid++;
					var uid = handler.uid;

					if ( data[phase][type] == null )
						data[phase][type] = {};

					data[phase][type][uid] = {priority:priority, huid:uid, handler:handler, scope:scope };


					//since duplicate dom listeners are discarded just add listener every time
					// function checks if event listener can actually be added
					if ( phase == 'capture' )
						lola.event.addDOMListener( target, type, lola.event.captureHandler, true );
					else
						lola.event.addDOMListener( target, type, lola.event.bubbleHandler, false );

					return uid;
				}
			}
		},

		/**
		 * remove a framework event listener
		 * @param {Object} target
		 * @param {String} type
		 * @param {Function} handler
		 * @param {Boolean|undefined} useCapture
		 */
		removeListener: function( target, type, handler, useCapture ) {
			var required = [['target',target],['type',type],['handler',handler]];
			var info = [target,'type: '+type,'useCapture: '+useCapture];
			if ( lola.checkArgs('ERROR: lola.event.removeListener( '+type+' )', required, info) ){
				if (lola.event.hooks[type] != null){
					lola.event.hooks[type]['removeListener'].call( lola.event.hooks[type], target, type, handler, useCapture );
				}
				else {
					var data = lola.data.get( target, lola.event.dataNs );
					if ( !data ) data = { capture:{}, bubble:{} };

					var phase = lola.event.phaseString( target, useCapture );

					//get handler uid
					var uid = lola.type.get( handler ) == 'function' ? handler.uid : handler;

					delete data[phase][type][uid];

					//if there are no more listeners in stack remove handler
					// function checks if event listener can actually be removed
					if ( Object.keys( data[phase][type] ).length == 0 ) {
						if ( phase == 'capture' )
							lola.event.removeDOMListener( target, type, lola.event.captureHandler, true );
						else
							lola.event.removeDOMListener( target, type, lola.event.bubbleHandler, false );

					}
				}
			}
		},


		/**
		 * removes all listeners associated with handler
		 * @param {String|Array} types
		 * @param {Function} handler
		 * @param {Boolean|undefined} useCapture
		 */
		removeHandler: function( handler, types, useCapture ) {
			//console.info( 'lola.event.removeHandler: '+type+' '+capture );
			var required = [['handler',handler]];
			var info = [];
			if ( lola.checkArgs('ERROR: lola.event.removeHandler', required, info) ){
				//get handler uid
				var uid = lola.type.get( handler ) == 'function' ? handler.uid : handler;

				//get event data
				var data = lola.data.getNamespace( lola.event.dataNs );
				if ( data ) {
					var ctypes = (useCaputure == undefined) ? ['capture','bubble'] : useCapture ? ['capture'] : ['bubble'];
					//iterate data
					for ( var oid in data ) {
						if ( types != undefined )
							types = lola.type.get( types ) == 'array' ? types : [types];
						for ( var phase in ctypes ) {
							var type;
							if ( types ) {
								for ( type in types ) {
									if ( data[oid][phase][type] )
										delete  data[oid][phase][type][uid];
								}
							}
							else {
								for ( type in data[oid][phase] ) {
									delete  data[oid][phase][type][uid];
								}
							}
							//rempve DOM listener if needed
							if ( Object.keys( data[oid][phase][type] ).length == 0 )
								lola.event.removeDOMListener( target, type, (phase == 'capture') ? lola.event.captureHandler : lola.event.bubbleHandler, (phase == 'capture') );
						}
					}
				}
			}
		},

		/**
		 * internal capture listener
		 * @param {Object} event
		 * @private
		 */
		captureHandler: function( event ) {
			event = event || lola.window.event;
			lola.event.handler( event, 'capture' )
		},

		/**
		 * internal bubble listener
		 * @param {Object} event
		 * @private
		 */
		bubbleHandler: function( event ) {
			event = event || lola.window.event;
			lola.event.handler( event, 'bubble' )
		},

		/**
		 * internal capture listener
		 * @private
		 * @param {Object} event
		 * @param {String} phase
		 */
		handler: function( event, phase ) {
			//console.info( 'lola.event.handler: '+event.type+' '+phase );
			var e = (event.hasOwnProperty( 'originalEvent' )) ? event : new lola.event.LolaEvent( event );
			var data = lola.data.get( e.currentTarget, lola.event.dataNs );
			if ( data && data[phase] && data[phase][event.type] ) {
				//console.info('    found event');
				var stack = [];
				for ( var uid in data[phase][event.type] ) {
					stack.push( data[phase][event.type][uid] );
				}
				//stack = stack.sort( lola.util.prioritySort );
				stack = lola.array.sortOn( 'priority', stack );
				for ( var i in stack ) {
					if ( e._immediatePropagationStopped )
						break;
					var obj = stack[i];
					if ( obj.handler )
						obj.handler.call( obj.scope, e );
					else
						delete data[phase][event.type][obj.huid];
				}
			}
		},

		/**
		 * triggers a framework event on an object
		 * @param {Object} object
		 * @param {String} type
		 * @param {Boolean|undefined} bubbles
		 * @param {Boolean|undefined} cancelable
		 * @param {Object|undefined} data
		 */
		trigger: function( object, type, bubbles, cancelable, data ) {
			/*console.group('lola.event.trigger: '+type);
			lola.debug(object);
			console.groupEnd();*/
			var args = [object, type];
			var names = ['target','type'];
			var group = 'lola.event.trigger: type='+type+' bubbles='+bubbles;
			if ( lola.checkArgs(args, names, group) ){
				if ( bubbles == undefined )
					bubbles = true;
				if ( cancelable == undefined )
					cancelable = true;

				var event = type;
				if ( lola.type.get( event ) === 'string' ) {
					event = document.createEvent( "Event" );
					event.initEvent( type, bubbles, cancelable );
					event.data = data;
				}

				if ( object.hasOwnProperty( 'dispatchEvent' ) ) {
					object.dispatchEvent( event );
				}
				else {
					event = new lola.event.LolaEvent( event, object );
					lola.event.handler( event,  'capture' );
					lola.event.handler( event,  'bubble' );
				}
			}
		},

		/**
		 * add a DOM event listener
		 * @param {Object} target
		 * @param {String} type
		 * @param {Function} handler
		 * @param {Boolean|undefined} useCapture
		 */
		addDOMListener: function( target, type, handler, useCapture ) {
			//if ( target.hasOwnProperty('nodeType') && (target.nodeType == 1 || target.nodeType == 9)){
			type = lola.event.map[type] ? lola.event.map[type] : [type];
			type.forEach( function(t) {
				try {
					if ( target.addEventListener )
						target.addEventListener( t, handler, useCapture );
					else if ( lola.support.msEvent )
						target.attachEvent( 'on' + t, handler );
					else if ( target['on' + t.toLowerCase()] == null )
						target['on' + type.toLowerCase()] = handler;
				}
				catch( error ) {
					//console.info( 'lola.event.addDOMListener error' );
				}
			} );
			//}
		},

		/**
		 * remove a DOM event listener
		 * @param {Object} target
		 * @param {String} type
		 * @param {Function} handler
		 */
		removeDOMListener: function( target, type, handler ) {
			//if ( target.hasOwnProperty('nodeType') && (target.nodeType == 1 || target.nodeType == 9)){
			type = lola.event.map[type] ? lola.event.map[type] : [type];
			type.forEach( function() {
				try {
					if ( target.removeEventListener )
						target.removeEventListener( type, handler, false );
					else if ( lola.support.msEvent )
						target.detachEvent( 'on' + type, handler );
					else if ( target['on' + type.toLowerCase()] == null )
						delete target['on' + type.toLowerCase()];
				}
				catch( error ) {
					//console.info( 'lola.event.removeDOMListener error' );
				}
			} );
			//}
		},

		/**
		 * gets the dom target
		 * @param {Object} event
		 * @param {Object} target
		 * @return {Object}
		 */
		getDOMTarget: function( event, target ) {
			if ( event ) {
				if ( event.currentTarget )
					target = event.currentTarget;
				else if ( event.srcElement )
					target = event.srcElement;

				if ( target && target.nodeType == 3 ) // defeat Safari bug
					target = target.parentNode;
			}
			return target;
		},

		/**
		 * @descrtiption returns key code for key events
		 * @param {Event} e
		 * @return {int}
		 */
		getDOMKeycode: function( e ) {
			var code;

			if ( e.keyCode )
				code = e.keyCode;
			else if ( e.which )
				code = e.which;

			return code;
		},

		/**
		 * returns key string for key events
		 * @param {Event} e
		 * @return {String}
		 */
		getDOMKey: function( e ) {
			var code;

			if ( e.keyCode )
				code = e.keyCode;
			else if ( e.which )
				code = e.which;

			return String.fromCharCode( lola.event.getDOMKeycode(e) );
		},

		/**
		 * returns x,y coordinates relative to document
		 * @param {Event} e
		 * @return {Object}
		 */
		getDOMGlobalXY: function( e ) {
			var xPos = 0;
			var yPos = 0;
			if ( e.pageX || e.pageY ) {
				xPos = e.pageX;
				yPos = e.pageY;
			}
			else if ( e.clientX || e.clientY ) {
				xPos = e.clientX + document.documentElement.scrollLeft + document.body.scrollLeft;
				yPos = e.clientY + document.documentElement.scrollTop + document.body.scrollTop;
			}

			return {x:xPos,y:yPos};
		},

		/**
		 * returns x,y coordinates relative to currentTarget
		 * @param {Event} e
		 * @return {Object}
		 */
		getDOMLocalXY: function( e ) {
			var xPos = e.layerX || e.offsetX || 0;
			var yPos = e.layerY || e.offsetY || 0;
			return {x:xPos,y:yPos};
		},

		/**
		 * returns actual event phase to use
		 * @param {Object} target
		 * @param {Boolean|undefined} useCapture
		 * @return {String}
		 */
		phaseString: function( target, useCapture ) {
			return ((useCapture && (lola.support.domEvent || lola.support.msEvent)) || (!target.dispatchEvent && !target.attachEvent)) ? 'capture' : 'bubble';
		},

		/**
		 * prevent default event action
		 * @param {Event} e
		 * @return {Boolean}
		 */
		preventDefault: function( e )
		{
			e = e ? e : window.event;
			if (e)
			{
				if(e.stopPropagation)
					e.stopPropagation();
				if(e.preventDefault)
					e.preventDefault();

				if(e.stopPropagation)
					e.stopPropagation();
				if(e.preventDefault)
					e.preventDefault();
				e.cancelBubble = true;
				e.cancel = true;
				e.returnValue = false;
			}
			return false;
		},


		//==================================================================
		// Classes
		//==================================================================
		/**
		 * LolqEvent class used with internal events
		 * @class
		 * @param {Object} event
		 * @param {Object} target
		 */
		LolaEvent: function( event, target ) {
			return this.init( event, target );
		},

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
				 * adds a framework event listener
				 * @param {String} type
				 * @param {Function} handler
				 * @param {Boolean|undefined} useCapture
				 * @param {uint|undefined} priority
				 * @param {Object|undefined} scope
				 */
				addListener: function( type, handler, useCapture, priority, scope ) {
					this.forEach( function( item ) {
						lola.event.addListener( item, type, handler, useCapture, priority, scope );
					} );

					return this;
				},

				/**
				 * removes a framework event listener
				 * @param {String} type
				 * @param {Function} handler
				 * @param {Boolean|undefined} useCapture
				 */
				removeListener: function( type, handler, useCapture ) {
					this.forEach( function( item ) {
						lola.event.removeListener( item, type, handler, useCapture );
					} );

					return this;
				},

				/**
				 * removes all listeners associated with handler
				 * @param {Function} handler
				 * @param {Array|undefined} types event types to remove for handler, undefined removes all
				 * @param {String|undefined} phase
				 */
				removeHandler: function( handler, types, phase ) {
					this.forEach( function( item ) {
						lola.event.removeHandler( item, handler, types, phase );
					} );

					return this;
				},

				/**
				 * triggers an framework event on an object
				 * @param {String} type
				 * @param {Boolean|undefined} bubbles
				 * @param {Boolean|undefined} cancelable
				 * @param {Object|undefined} data
				 */
				trigger: function( type, bubbles, cancelable, data ) {
					this.forEach( function( item ) {
						lola.event.trigger( item, type, bubbles, cancelable, data );
					} );

					return this;
				}
			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================
	event.LolaEvent.prototype = {

		/**
		 * reference to original event
		 * @type {Event}
		 */
		originalEvent: null,

		/**
		 * flag for propagation stopped
		 * @type {Boolean}
		 * @private
		 */
		propagationStopped: false,

		/**
		 * flag for immediate propagation stopped
		 * @type {Boolean}
		 * @private
		 */
		immediatePropagationStopped: false,

		/**
		 * event's target
		 * @type {Object}
		 */
		target: null,

		/**
		 * event's currentTarget
		 * @type {Object}
		 */
		currentTarget: null,

		/**
		 * global x position (Mouse/Touch Events)
		 * @type {Number}
		 */
		globalX: null,

		/**
		 * global y position (Mouse/Touch Events)
		 * @type {Number}
		 */
		globalY: null,

		/**
		 * key code for Key Events
		 * @type {int}
		 */
		key: null,

		/**
		 * class initializer
		 * @param {Event} event
		 * @param {Object} target
		 */
		init: function( event, target ) {
			lola.extend( this, event, false, false );
			this.originalEvent = event;
			if ( target ) {
				this.target = target;
			}
			this.currentTarget = lola.event.getDOMTarget( event, target );
			var gpos = lola.event.getDOMGlobalXY( event );
			this.globalX = gpos.x;
			this.globalY = gpos.y;

			var lpos = lola.event.getDOMLocalXY( event );
			this.localX = lpos.x;
			this.localY = lpos.y;

			this.key = lola.event.getDOMKey( event );

			return this;
		},

		/**
		 * prevents an events default behavior
		 */
		preventDefault: function(){
			this.originalEvent.preventDefault();
		},

		/**
		 * stops event propagation
		 */
		stopPropagation: function(){
			this.originalEvent.stopPropagation();
			this.propagationStopped = true;
		},

		/**
		 * stops immediate event propagation
		 */
		stopImmediatePropagation: function(){
			this.originalEvent.stopImmediatePropagation();
			this.immediatePropagationStopped = true;
		}

	};


	//==================================================================
	// Hooks
	//==================================================================

	/**
	 * delayed hover intent event hook
	 * @event hover
	 */
	event.hooks['hover'] = {
		event: 'hoverConfirmed',
		getData: function( target ){
			var ns = 'eventHover';
			var wait = lola.dom.attr( target, "hoverDelay" );
			wait = (wait == null || wait == undefined) ? 250 : parseInt(wait);
			var data = lola.data.get( target, ns );
			if ( !data ) {
			    data = { hasIntent:false, wait:wait, timeout:-1 };
			    lola.data.set( target, data, ns, true );
			}
			return data;
		},
		mouseOver: function( event ){
			//lola.debug('hover.mouseover');
			lola.event.addListener( event.currentTarget, 'mouseout', lola.event.hooks.hover.mouseOut );
			var data = lola.event.hooks.hover.getData( event.currentTarget );
			data.hasIntent = true;
			if (data.timeout < 0)
				data.timeout = setTimeout( lola.event.hooks.hover.confirm, data.wait, event.currentTarget )
		},
		mouseOut: function( event ){
			//lola.debug('hover.mouseout')
			lola.event.removeListener( event.currentTarget, 'mouseout', lola.event.hooks.hover.mouseOut );
			var data = lola.event.hooks.hover.getData( event.currentTarget );
			data.hasIntent = false;
		},
		confirm: function( target ){
			//lola.debug('hover.confirm')
			lola.event.removeListener( target, 'mouseout', lola.event.hooks.hover.mouseOut );
			var data = lola.event.hooks.hover.getData( target );
			data.timeout = -1;
			if (data.hasIntent){
				lola.event.trigger( target, lola.event.hooks.hover.event );
			}
		},
		addListener: function( target, type, handler, useCapture, priority, scope ){
			var uid = lola.event.addListener( target, lola.event.hooks.hover.event, handler, useCapture, priority, scope );
			lola.event.hooks.hover.getData( target );
			lola.event.addListener( target, 'mouseover', lola.event.hooks.hover.mouseOver );
			return uid;
		},
		removeListener: function( target, type, handler, useCapture ){
			var edata = lola.data.get( target, lola.event.dataNs );
			lola.event.removeListener(target, lola.event.hooks.hover.event, handler, useCapture );
			var phase = lola.event.phaseString( target, useCapture );
			if (edata[phase][lola.event.hooks.hover.event] == null || Object.keys(edata[phase][lola.event.hooks.hover.event]).length == 0){
				lola.event.removeListener( target, 'mouseover', lola.event.hooks.hover.mouseOver );
				lola.data.remove( target, 'eventHover' );
			}
		}
	};

	/**
	 * mouse enter state event
	 * @event mouseenterstate
	 */
	event.hooks['mouseenterstate'] = {
		e1: 'domouseenter',
		e2: 'domouseleave',
		getData: function( target ){
			var ns = 'eventMouseEnterState';
			var data = lola.data.get( target, ns );
			if ( !data ) {
			    data = { within:false };
			    lola.data.set( target, data, ns, true );
			}
			return data;
		},
		getEnhancedType: function( type ){
			if (!lola.support.msEvent) {
				type = 'do'+type;
			}
			return type;
		},
		mouseOver: function( event ){
			var data = lola.event.hooks.mouseenterstate.getData( event.currentTarget );
			if (!data.within && event.currentTarget != event.relatedTarget){
				data.within = true;
				lola.event.trigger( event.currentTarget, lola.event.hooks.mouseenterstate.e1, false );
			}
		},
		mouseOut: function( event ){
			var data = lola.event.hooks.mouseenterstate.getData( event.currentTarget );
			if ( data.within &&
					!lola.util.isAncestor( event.currentTarget, event.relatedTarget ) &&
					event.currentTarget != event.relatedTarget ){
				data.within = false;
				lola.event.trigger( event.currentTarget, lola.event.hooks.mouseenterstate.e2, false );
			}
		},
		addListener: function( target, type, handler, useCapture, priority, scope ){
			//IE has it already
			if (!lola.support.msEvent) {
				//deal with other browsers
				lola.event.addListener( target, 'mouseover', lola.event.hooks.mouseenterstate.mouseOver, useCapture, priority, scope );
				lola.event.addListener( target, 'mouseout', lola.event.hooks.mouseenterstate.mouseOut, useCapture, priority, scope );
			}
			return lola.event.addListener( target, lola.event.hooks.mouseenterstate.getEnhancedType( type ), handler, useCapture, priority, scope );
		},
		removeListener: function( target, type, handler, useCapture ){

			var edata = lola.data.get( target, lola.event.dataNs );
			var phase = lola.event.phaseString( target, useCapture );
			type = lola.event.hooks.mouseenterstate.getEnhancedType( type );
			lola.event.removeListener( target, type, handler, useCapture );

			//check for other hook listeners before removeing
			if (    !lola.support.msEvent &&
					edata[phase][lola.event.hooks.mouseenterstate.getEnhancedType( type )] == null ||
					edata[phase][lola.event.hooks.mouseenterstate.getEnhancedType( type )].keys().length == 0){
				//deal with other browsers
				lola.event.removeListener( target, 'mouseover', lola.event.hooks.mouseenterstate.mouseOver, useCapture );
				lola.event.removeListener( target, 'mouseout', lola.event.hooks.mouseenterstate.mouseOut, useCapture );
			}

		}
	};

	/**
	 * mouse leave event
	 * @event mouseleave
	 */
	event.hooks['mouseleave'] = event.hooks['mouseenterstate'];

	/**
	 * mouse enter event
	 * @event mouseleave
	 */
	event.hooks['mouseenter'] = event.hooks['mouseenterstate'];

    event.PRIORITY_BEFORE = 1;
    event.PRIORITY_FIRST = 0x400000;
    event.PRIORITY_NORMAL = 0x800000;
    event.PRIORITY_LAST= 0xC00000;
    event.PRIORITY_AFTER = 0xFFFFFF;

	//register module
	lola.registerModule( event );

})( lola );
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
/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Support
 *  Description: Support module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Support Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var support = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * can script text nodes be appended to script nodes
		 * @public
		 * @type {Boolean}
		 */
		domEval: false,

		/**
		 * can delete expando properties
		 * @public
		 * @type {Boolean}
		 */
		deleteExpando: true,

		/**
		 * dom event model
		 * @public
		 * @type {Boolean}
		 */
		domEvent: false,

		/**
		 * ms event model
		 * @public
		 * @type {Boolean}
		 */
		msEvent: false,

		/**
		 * browser animation frame timing
		 * @public
		 * @type {Boolean}
		 */
		browserAnimationFrame: false,

		/**
		 * IE style
		 * @public
		 * @type {Boolean}
		 */
		style: false,

		/**
		 * float is reserved check whether to user cssFloat or styleFloat
		 * @public
		 * @type {Boolean}
		 */
		cssFloat: false,

		/**
		 * check color alpha channel support
		 * @public
		 * @type {Boolean}
		 */
		colorAlpha: false,

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug('lola.support::preinitialize');
			//DOM script eval support
			var root = document.documentElement;
			var script = document.createElement( 'script' );
			var uid = "scriptCheck" + (new Date).getTime();
			script.type = "text/javascript";
			try {
				script.appendChild( document.createTextNode( 'window.' + uid + '=true;' ) );
			}
			catch( e ) {

			}

			root.insertBefore( script, root.firstChild );
			root.removeChild( script );

			if ( window[ uid ] ) {
				this.domEval = true;
				delete window[ uid ];
			}


			//create test div and test helpers for support tests
			var div = document.createElement( 'div' );
			var html = function( val ) {
				div.innerHTML = val;
			};


			//style support
			html( "<div style='color:black;opacity:.25;float:left;background-color:rgba(255,0,0,0.5);' test='true'>test</div>" );
			var target = div.firstChild;
			this.style = (typeof target.getAttribute( 'style' ) === 'string');
			this.cssFloat = /^left$/.test( target.style.cssFloat );
			this.colorAlpha = /^rgba.*/.test( target.style.backgroundColor );


			//check for deletion of expando properties
			try {
				delete target.test;
			}
			catch( e ) {
				this.deleteExpando = false;
			}


			//Event Model
			if ( document.addEventListener )
				this.domEvent = true;
			else if ( document.attachEvent )
				this.msEvent = true;


			//remove initialization method
			delete lola.support.preinitialize;

		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.support::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization



			//remove initialization method
			delete lola.support.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "support";
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

			};

			return methods;

		}

	};

	//register module
	lola.registerModule( support );

})( lola );

/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Type
 *  Description: Type module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Type Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var type = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * @private
		 * @type {Object}
		 */
		map: {},

		/**
		 * @private
		 * @type {Object}
		 */
		primitives: ["boolean","number","string","undefined","null"],

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug('lola.type::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization
			lola.type.createMap();
			delete lola.type.createMap;
			delete lola.type.mapTag;
			delete lola.type.mapSpecialTag;
			delete lola.type.mapObject;

			//remove initialization method
			delete lola.type.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.type::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.type.initialize;
		},
		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "type";
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
		 * creates map of object and element types
		 * @private
		 */
		createMap: function() {

			var objTypes = "String Number Date Array Boolean RegExp Function Object";
			var tagTypes =  "a abbr acronym address applet area article aside audio "+
							"b base basefont bdi bdo big blockquote body br button "+
							"canvas caption center cite code col colgroup command "+
							"datalist dd del details dfn dir div dl dt "+
							"em embed "+
							"fieldset figcaption figure font footer form frame frameset "+
							"h1 h2 h3 h4 h5 h6 head header hgroup hr html "+
							"i iframe img input ins "+
							"keygen kbd "+
							"label legend li link "+
							"map mark menu meta meter "+
							"nav noframes noscript "+
							"object ol optgroup option output "+
							"p param pre progress "+
							"q "+
							"rp rt ruby "+
							"s samp script section select small source span strike strong style sub summary sup svg "+
							"table tbody td textarea tfoot th thead time title tr track tt "+
							"u ul "+
							"var video "+
							"wbr "+
							"xmp";
			var specialTagTypes ="object";

			objTypes.split(' ').forEach( this.mapObject );
			tagTypes.split(' ').forEach( this.mapTag );
			specialTagTypes.split(' ').forEach( this.mapSpecialTag );

			var tn = document.createTextNode( 'test' );
			var cn = document.createComment( 'test' );
			var tntype = lola.toString.call( tn );
			var cntype = lola.toString.call( cn );
			lola.type.map[ tntype ] = 'textnode';
			lola.type.map[ cntype ] = 'commentnode';
			//TODO: add isTextNode and isCommentNode selector functions

			delete lola.type.mapTag;
			delete lola.type.mapObject;
			delete lola.type.mapSpecialTag;

		},

		/**
		 * maps tag type
		 * @private
		 * @param item
		 * @param index
		 */
		mapTag: function( item, index ) {
			var tag = document.createElement( item );
			var type = lola.toString.call( tag );
			var name = type.replace( /\[object HTML/g, "" ).replace( /Element\]/g, "" );
			name = name == "" ? "Element" : name;
			lola.type.map[ type ] = name.toLowerCase();
			var isfn = "lola.Selector.prototype['is" + name + "'] = " +
					"function(index){ return this.isType('" + name.toLowerCase() + "',index); };";
			lola.evaluate( isfn );
		},

		/**
		 * maps special tag types
		 * @private
		 * @param item
		 * @param index
		 */
		mapSpecialTag: function( item, index ) {
			var tag = document.createElement( item );
			var type = lola.toString.call( tag );
			var name = type.replace( /\[object /g, "" ).replace( /Element\]/g, "" ); // keep HTML
			name = name == "" ? "Element" : name;
			lola.type.map[ type ] = name.toLowerCase();
			var isfn = "lola.Selector.prototype['is" + name + "'] = " +
					"function(index){ return this.isType('" + name.toLowerCase() + "',index); };";
			lola.evaluate( isfn );
		},

		/**
		 * maps object types
		 * @private
		 * @param item
		 * @param index
		 */
		mapObject: function( item, index ) {
			var type = "[object " + item + "]";
			lola.type.map[ type ] = item.toLowerCase();
			var isfn = "lola.Selector.prototype['is" + item + "'] = " +
					"function(index){ return this.isType('" + item.toLowerCase() + "',index); };";
			lola.evaluate( isfn );
		},

		/**
		 * gets the specified object's type
		 * @param {Object} object
		 * @return {String}
		 */
		get: function( object ) {
			if ( object ) {
				var type = lola.type.map[ lola.toString.call( object ) ];
				if ( type )
					return type;
				return 'other ';
			}
			return 'null'
		},

        isPrimitive: function( object ) {
            return this.primitives.indexOf(this.get(object)) >= 0;
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
				 * gets the type if the specified index
				 * @return {Array}
				 */
				getType: function() {
					var values = [];
					this.forEach( function( item ) {
						values.push( lola.type.get(item) );
					} );
					return lola.__(values);
				},

				/**
				 * checks if element at index is a type, or all elements are a type
				 * @param {String} type
				 * @param {int|undefined} index
				 */
				isType: function( type, index ) {
					if (index != undefined && index >= 0 ) {
						return lola.type.get( this.get(index)) == type;
					}
					else {
						return this.elements.every( function( item ){
							return lola.type.get(item) == type;
						} );
					}
				},

				/**
				 * checks if element at index is a primitive, or all elements are primitives
				 * @param {int|undefined} index
				 */
				isPrimitive: function( index ) {
					if (index != undefined && index >= 0 ) {
						return lola.type.primitives.indexOf( this.getType(index) );
					}
					else {
						return this.elements.every( function( item ){
							return lola.type.primitives.indexOf(lola.type.get(item)) >= 0;
						} );
					}
				}

			};

			return methods;

		}



	};


	//register module
	lola.registerModule( type );

})( lola );

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

        copyPrimitives: function( source, target ){
            for (var k in source){
                if (lola.type.isPrimitive(source[k])){
                    target[k] = source[k];
                }
            }
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
/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Agent
 *  Description: Agent module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Ag Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var agent = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * registration index
		 * @private
		 */
		index: 0,

		/**
		 * registration map
		 * @private
		 */
		map: {},

		/**
		 * initializers
		 * @private
		 */
		initializers: [],

        /**
         * @private
         * @type {Object}
         */
        dependencies: {},


		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug('lola.agent::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization
			lola.safeDeleteHooks.push( {scope:this, fn:this.drop} );


			//remove initialization method
			delete lola.agent.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.agent::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

            //check agent dependencies
            lola.checkDependencies( this.dependencies );

            //execute agent initialization stack
            var stackSize = lola.agent.initializers.length;

            for ( i = 0; i < stackSize; i++ ) {
                var initializer = lola.agent.initializers[i];
                if (typeof initializer == "function"){
                    initializer();
                }

                delete lola.agent.initializers[i];
            }


			//remove initialization method
			delete lola.agent.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "agent";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['event','data'];
		},


		/**
		 * used to register an agent with the framework
		 * @param {Object} agent object that implements the agent interface
		 */
        registerAgent: function( agent ) {
            var ns = agent.getNamespace();
			console.info('register agent: '+ns);
			if (ns && agent.sign && agent.drop) {
				//setup namespace
				var pkg = lola.getPackage( lola.agent, ns );

				//copy module methods and attributes
				lola.extend( pkg, agent, true );

                //add dependencies
                if (agent.hasOwnProperty('getDependencies') && typeof agent.getDependencies=="function")
                    this.dependencies[ 'agent.'+ns ] = agent.getDependencies();

				//map agent
				this.map[ ns ] = pkg;

				//add initializer
				if ( agent.initialize && typeof agent.initialize === "function" ) {
					lola.agent.initializers.push( function() {
						agent.initialize();
					} );
				}

				//run preinitialization method if available
				if ( agent.preinitialize && typeof agent.preinitialize === "function" ) {
					agent.preinitialize();
				}

			}
			else {
				console.error( 'invalid agent implementation: '+name );
			}

		},

		/**
		 * assign a client to an agent
		 * @param {Object} client
		 * @param {String} name name of registered agent
		 */
		assign: function( client, name ) {
			var agent = lola.agent.map[ name ];
			if (agent){
				agent.sign( client );
			}
			else {
				throw new Error("unknown agent: "+name);
			}
		},

		/**
		 * drop a client from an agent
		 * @param {Object} client
		 * @param {String} name name of registered agent
		 */
		drop: function( client, name ) {
			var agents = {};
			if (name == !undefined){
				agents = lola.agent.map;
			}
			else if (typeof name == 'string'){
				name.split(',').forEach( function(item){
					agents[ item ] = lola.agent.map[ item ];
				});
			}

			for (var i in agents){
				var agent = agents[i];
				if (agent){
					agent.drop( client );
				}
			}
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
				 * assigns an agent to selector elements
				 * @param {String} agentName name of registered agent
				 */
				assignAgent: function( agentName ) {
					this.forEach( function(item){
						lola.agent.assign( item, agentName );
					});
					return this;
				},

				/**
				 * drops client from agent
				 * @param {String} agentName name of registered agent
				 */
				dropAgent: function( agentName ) {
					this.forEach( function(item){
						lola.agent.drop( item, agentName );
					})
				}

			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================




	//register module
	lola.registerModule( agent );

})( lola );

/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Chart
 *  Description: Chart module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function (lola) {
    var $ = lola;
    /**
     * @description Chart Module
     * @implements {lola.Module}
     * @memberof lola
     */
    var chart = {

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
        preinitialize:function () {
            lola.debug('lola.chart::preinitialize');
            if (!lola) throw new Error('lola not defined!');

            //do module preinitialization


            //remove initialization method
            delete lola.chart.preinitialize;
        },

        /**
         * @description initializes module
         * @public
         * @return {void}
         */
        initialize:function () {
            lola.debug('lola.chart::initialize');
            //this framework is dependent on lola framework
            if (!lola) throw new Error('lola not defined!');

            //do module initialization


            //remove initialization method
            delete lola.chart.initialize;
        },

        /**
         * @description get module's namespace
         * @public
         * @return {String}
         * @default dom
         */
        getNamespace:function () {
            return "chart";
        },

        /**
         * @description get module's dependencies
         * @public
         * @return {Array}
         * @default []
         */
        getDependencies:function () {
            return ['graphics'];
        },

        //==================================================================
        // Classes
        //==================================================================
        Grid: function(x,y,width,height,spacing,flags){
            return this.init(x,y,width,height,spacing,flags);
        },

        Axis: function(x,y,size,label,labelOffset,flags ){
            return this.init(x,y,size,label,labelOffset,flags);
        },


        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * @description get module's selectors
         * @public
         * @return {Object}
         */
        getSelectorMethods:function () {

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
    chart.Grid.HORIZONTAL = 0x1;
    chart.Grid.VERTICAL = 0x2;
    chart.Grid.prototype = {
        x:0,
        y:0,
        width:100,
        height:100,
        spacing:10,
        flags:3,
        init: function(x,y,width,height,spacing,flags){
            this.x = x || 0;
            this.y = y || 0;
            this.width = width || 100;
            this.height = height || 100;
            this.spacing = spacing || 10;
            this.flags = (flags==undefined)?3:flags;

            return this;
        },

        draw: function( ctx, flags ){
            flags = flags == undefined ? this.flags : flags;

            var i;
            //vertical
            if (flags & lola.chart.Grid.VERTICAL){
                for (i=this.x+this.spacing; i<=this.width+this.x; i+=this.spacing){
                        ctx.beginPath();
                        ctx.moveTo(i,this.y);
                        ctx.lineTo(i,this.y+this.height);
                        ctx.stroke();
                        ctx.closePath();
                }
            }
            //horizontal
            if (flags & lola.chart.Grid.HORIZONTAL){
                for (i=this.y+this.spacing; i<=this.height+this.y; i+=this.spacing){
                    ctx.beginPath();
                    ctx.moveTo(this.x,i);
                    ctx.lineTo(this.x+this.width,i);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        }
    };

    chart.Axis.VERTICAL = 0x1;
    chart.Axis.prototype = {
        x:0,
        y:0,
        size: 100,
        label: undefined,
        labelOffset: {x:0,y:0},
        flags: 0x2,
        init: function(x,y,size,label,labelOffset,flags){
            this.x = x || 0;
            this.y = y || 0;
            this.size = size || 100;
            this.label = label;
            if( labelOffset ) this.labelOffset = labelOffset;
            this.flags = (flags==undefined)?0x0:flags;
            return this;
        },

        draw: function( ctx, flags ){
            flags = flags == undefined ? this.flags : flags;
            ctx.beginPath();
            ctx.moveTo( this.x, this.y );
            if (flags & lola.chart.Axis.VERTICAL){
                //vertical axis
                ctx.lineTo( this.x, this.y+this.size );
            }
            else {
                //horizontal axis
                ctx.lineTo( this.x+this.size, this.y );
            }
            ctx.stroke();
            ctx.closePath();

            if (this.label) {
                if (flags & lola.chart.Axis.VERTICAL) {
                    //label at bottom
                    ctx.textAlign = "center";
                    ctx.fillText( this.label, this.x + this.labelOffset.x, this.y + this.size + this.labelOffset.y );
                }
                else {
                    ctx.textAlign = "right";
                    ctx.fillText( this.label, this.x + this.labelOffset.x, this.y + this.labelOffset.y );
                }
            }
        }
    };



    //register module
    lola.registerModule(chart);

})(lola);
/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Command
 *  Description: Command module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Command Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var cmd = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * registry of commands
		 * @private
		 */
		registry: {},

		/**
		 * holds calls to unloaded commands
		 * @private
		 */
		callLater: {},


		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.cmd::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.cmd.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.cmd::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.cmd.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "cmd";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['event'];
		},

		/**
		 * registers command with the module
		 * @param {Class|String} cmd the comman ./d b class or url of the class' js file
		 * @param {String} name the name with which tobv register the command
		 */
		register: function( cmd, name ) {
			if ( typeof cmd != "string" && name == undefined  )
				name = cmd.name;

			lola.debug('register command: '+name);
			if ( this.registry[name] != null && typeof this.registry[name] != "string" )
				console.warn( 'command "'+name+'" has already been registered... overwriting' );

			//register command class or url
			this.registry[name] = cmd;

			lola.event.addListener( this, name, this.executeCommand  );
		},

		/**
		 * executes a registered command
		 * @param {String} name registered command name
		 * @param {Object} params parameter object to be passed to command
		 * @param {lola.cmd.Responder} responder responder object to handle command events
		 */
		execute: function( name, params, responder ){
			if (this.registry[name]) {

				if (!responder) {
					responder = new cmd.Responder();
				}

				if ( typeof this.registry[name] == "string" ) {
					//add execution params to call later queue for the unloaded command
					if ( !this.callLater[ name ] ){
						//try to load command
						lola.loadScript( this.registry[name], function(e){
							if ( typeof this.registry[name] == "function" ) {
								//command successfully loaded - iterate through queued calls
								var s = lola.cmd.callLater[ name ].length;
								for (var i = 0; i < s; i++){
									var o = lola.cmd.callLater[ name ][i];
									lola.cmd.execute( o.name, o.params, o.responder );
								}
								delete lola.cmd.callLater[ name ];
							}
							else {
								throw new Error('The command loaded from "'+lola.cmd.registry[name]+'" is not named "'+name+'"');
							}
						});
						this.callLater[ name ] = [];
					}

					var cmdObj = {name:name, params:params, responder:responder};
					this.callLater[ name ].push( cmdObj );
				}
				else {
					//try to execute command
					var cmdClass = this.registry[ name ];
					if (cmdClass) {
						var cmd = new cmdClass();
						if (responder) {
							lola.event.addListener( cmd, 'result', responder.handleResult );
							lola.event.addListener( cmd, 'fault', responder.handleFault );
							lola.event.addListener( cmd, 'status', responder.handleStatus );
						}

						cmd.execute( params );
					}
				}
			}
			else {
				throw new Error('Unknown command type: '+name);
			}

			return responder;

		},

		/**
		 * handles executing commands triggered via event model
		 * @private
		 * @param event
		 */
		executeCommand: function( event ){
			lola.cmd.execute(event.type, event.data.parameters, event.data.responder );
		},


		//==================================================================
		// Classes
		//==================================================================
		/**
		 * Responder class handles command events
		 * @class
		 * @param {Function} resultHandler
		 * @param {Function} faultHandler
		 * @param {Function} statusHandler
		 */
		Responder: function( resultHandler, faultHandler, statusHandler ){
			return this.init();
		},

		/**
		 * Data object for executing commands via event model
		 * @param {Object} parameters parameter object
		 * @param {lola.cmd.Responder} responder responder object
		 */
		Data: function( parameters, responder ){
			return this.init( parameters, responder);
		},


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
	cmd.Responder.prototype = {
		/**
		 * user defined result handler
		 */
		resultHandler:undefined,

		/**
		 * user defined fault handler
		 */
		faultHandler:undefined,

		/**
		 * user defined status handler
		 */
		statusHandler:undefined,

		/**
		 * last response event
		 * @private
		 */
		lastResponse: undefined,

		/**
		 * class initializer
		 * @private
		 * @param {Function} resultHandler
		 * @param {Function} faultHandler
		 * @param {Function} statusHandler
		 */
		init: function( resultHandler, faultHandler, statusHandler ){
			this.resultHandler = resultHandler;
			this.faultHandler = faultHandler;
			this.statusHandler = statusHandler;
		},

		/**
		 * handle status events from command
		 * @private
		 * @param {Object} event
		 */
		handleStatus: function( event ){
			if (!this.lastResponse ||  this.lastResponse.type == 'status' )
				this.lastResponse = event;
			if (typeof this.statusHandler == 'function')
				this.statusHandler.apply(lola.window, [event] );
		},

		/**
		 * handle result events from command
		 * @private
		 * @param {Object} event
		 */
		handleResult: function( event ){
			this.lastResponse = event;
			if (typeof this.resultHandler == 'function')
				this.resultHandler.apply(lola.window, [event] );
		},

		/**
		 * handle fault events from command
		 * @private
		 * @param {Object} event
		 */
		handleFault: function( event ){
			this.lastResponse = event;
			if (typeof this.faultHandler == 'function')
				this.faultHandler.apply(lola.window, [event] );
		},

		/**
		 * get last response
		 * @return {Object|undefined}
		 */
		getLastResponse: function(){
			return this.lastResponse;
		}


	};

	cmd.Data.prototype = {
		/**
		 * command parameters
		 * @type {Object}
		 */
		parameters: undefined,

		/**
		 * command responder
		 * @type {lola.cmd.Responder}
		 */
		responder: undefined,

		/**
		 * class initializer
		 * @private
		 * @param {Object} parameters
		 * @param {lola.cmd.Responder} responder
		 */
		init: function(parameters, responder) {
			this.parameters = parameters;
			this.responder = responder;
		}
	};

	//register module
	lola.registerModule( cmd );

})( lola );
/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Easing
 *  Description: Easing module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Easing Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var easing = {

		//==================================================================
		// Attributes
		//==================================================================
        methods: {},

        defaultResolution: 1000,

        defaultEase: "ease",

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.easing::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization

			//remove initialization method
			delete lola.easing.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.easing::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization
            this.registerSimpleEasing("none", 0, 0, 1, 1);
            this.registerSimpleEasing("ease", .25, .1, .25, 1);
            this.registerSimpleEasing("linear", 0, 0, 1, 1);
            this.registerSimpleEasing("ease-in", .42, 0, 1, 1);
            this.registerSimpleEasing("ease-out", 0, 0, .58, 1);
            this.registerSimpleEasing("ease-in-out", .42, 0, .58, 1);


			//remove initialization method
			delete lola.easing.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "easing";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ["math.point","geometry"];
		},


		/**
		 * calculates a point on a cubic bezier curve given time and an array of points.
		 * @private
		 * @param {Number} t time 0 <= t <= 1
		 * @param {lola.graphics.Point|Object} p0 anchor 1
		 * @param {lola.graphics.Point|Object} p1 control 1
		 * @param {lola.graphics.Point|Object} p2 control 2
		 * @param {lola.graphics.Point|Object} p3 anchor 2
		 * @return {lola.graphics.Point}
		 */
		cubicBezier: function( t, p0, p1, p2, p3 ) {
			var inv = 1 - t;
			return lola.math.point.add(
					lola.math.point.multiply( p0, inv * inv * inv ),
					lola.math.point.multiply( p1, 3 * inv * inv * t ),
					lola.math.point.multiply( p2, 3 * inv * t * t ),
					lola.math.point.multiply( p3, t * t * t )
			);

		},

        /**
         * samples a splines points for use in time based easing
         * @private
         * @param {lola.geometry.spline} spline
         * @param {uint} resolution per spline section
         */
        sampleSpline: function( spline, resolution ) {
            var points = spline.getPoints();
            var sectionCount = points.length - 1;
            var samples = [];
            if (sectionCount > 0) {
                resolution *= sectionCount;
                var splits = [];
                for (var i = 1; i<= sectionCount; i++ ){
                    splits.push( points[i].getAnchor().x );
                }
                //console.log(splits);
                var lastSplit = 0;
                var splitIndex = 0;
                var currentSplit = splits[0];
                for (var s = 0; s<= resolution; s++) {
                    //console.log(s);
                    var t = s/resolution;
                    if (t <= currentSplit){
                        t = (t-lastSplit)/(currentSplit-lastSplit);
                        //console.log(t);
                        var sample = this.cubicBezier(
                            t,
                            points[splitIndex].getAnchor(),
                            points[splitIndex].getControl2(),
                            points[splitIndex+1].getControl1(),
                            points[splitIndex+1].getAnchor()
                        );
                        samples.push( sample );
                    }
                    else{
                        splitIndex++;
                        lastSplit = currentSplit;
                        currentSplit = splits[ splitIndex ];
                        s--;
                    }
                }
            }
            return samples;
        },

        /**
         * registers the an easing method using the given parameters
         * @param id
         * @param spline
         * @param resolution
         * @param overwrite
         */
        register: function( id, spline, resolution, overwrite  ){
            resolution = 10;//resolution?resolution:easing.defaultResolution;
            overwrite = overwrite === true;

            var first = spline.getPoint(0).getAnchor();
            var last = spline.getPoint( (spline.getPoints().length - 1) ).getAnchor();
            if ( first.x == 0 && first.y == 0 && last.x == 1 && last.y == 1 ){
                //Todo: make sure spline can be fit to cartesian function

                var Ease = function(){
                    return this;
                };

                var samples = easing.sampleSpline( spline, 1000 );

                Ease.prototype = {
                    samples: samples,
                    sampleCount: samples.length,
                    lastIndex: 1,
                    exec: function( t,v,c,d ){
                        t/=d;
                        var s = this.samples;
                        var i = this.lastIndex;
                        var l = this.sampleCount;
                        //TODO: use a more efficient time search algorithm
                        while( t>s[i].x && i < l ){
                            i++;
                            if ( t <= s[i].x ){
                                var low = s[i-1];
                                var high = s[i];
                                var p = (t - low.x) / (high.x - low.x);
                                this.lastIndex = i;
                                return v+c*(low.y+p*(high.y-low.y));
                            }
                        }
                    }
                };

                if ( !easing.methods[ id ] || overwrite ){
                    lola.easing.methods[ id ] = Ease;
                }else{
                    throw new Error("easing id already taken");
                }

            }else{
                throw new Error("invalid easing spline");
            }
        },

        /**
         * registers a single section cubic-bezier easing method
         * @param id
         * @param p1x
         * @param p1y
         * @param p2x
         * @param p2y
         */
        registerSimpleEasing: function(id,p1x,p1y,p2x,p2y){
            var geo = lola.geometry;
            var spline = new geo.Spline();
            var c1 = new geo.Point( p1x, p1y );
            var c2 = new geo.Point( p2x, p2y );
            var v1 = c1.toVector();
            var v2 = c2.toVector();
            spline.addPoint( new geo.SplinePoint( 0, 0, 0, 0, v1.velocity, v1.angle ) );
            spline.addPoint( new geo.SplinePoint( 1, 1, v2.velocity, v2.angle, 1, 1 ) );
            easing.register( id, spline );
        },

        /**
         * gets a regsitered easing function
         * @param {String} id
         */
        get: function( id ){
            //console.log("lola.easing.get: "+id);
            if (this.methods[ id ]){
                return new this.methods[ id ]();
            }
            else {
                console.warn('easing method "'+id+'" not found.');
                return new this.methods[ this.defaultEase ]();
            }
        },

        /**
         * sets the default easing method
         * @param {String} ids
         */
        setDefaultEase: function( id ){
            if (this.methods[ id ]){
                this.defaultEase = id;
            }
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
	lola.registerModule( easing );

})( lola );

/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Geometry Module
 *  Description: Geometry module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * math.geom Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var geometry = {

		//==================================================================
		// Attributes
		//==================================================================
        rDropPx: /px/g,


		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.geometry::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.geometry.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.math.geom::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.geometry.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "geometry";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['math','regex'];
		},

        /**
         * translates and / or scales a spline based on the specified bounding points
         * @param {lola.geometry.Spline} spline
         * @param {lola.geometry.Point} oldMin
         * @param {lola.geometry.Point} oldMax
         * @param {lola.geometry.Point} newMin
         * @param {lola.geometry.Point} newMax
         * @param {Boolean|undefined} flipX
         * @param {Boolean|undefined} flipY
         */
        normalizeSpline: function( spline, oldMin, oldMax, newMin, newMax, flipX, flipY ){

            flipX = flipX === true;
            flipY = flipY === true;

            var pm = lola.math.point;
            var norm = new lola.geometry.Spline();
            var spts = spline.getPoints();
            var l = spts.length;
            var oldSize = pm.subtract( oldMax, oldMin );
            var newSize = pm.subtract( newMax, newMin );

            var normalizePoint = function( pt ){
                pt = pm.divide( pm.subtract( pt, oldMin ), oldSize );
                if (flipX) pt.x = 1-pt.x;
                if (flipY) pt.y = 1-pt.y;
                return pm.multiply( pt, newSize );
            };

            for (var i=0; i<l; i++ ){
                //get points
                var cp1 = spts[i].getControl1();
                var anch = spts[i].getAnchor();
                var cp2 = spts[i].getControl2();

                //normalize points
                var nanch = normalizePoint( anch );
                var ncv1 = pm.subtract( nanch, normalizePoint( cp1 ) ).toVector();
                var ncv2 = pm.subtract( normalizePoint( cp2 ), nanch ).toVector();


                var np = new lola.geometry.SplinePoint( nanch.x, nanch.y, ncv1.velocity, ncv1.angle, ncv2.velocity, ncv2.angle );
                norm.addPoint( np );
            }

            return norm;
        },

        /**
         * returns offset of object
         * @param {Element} elem
         * @param {Boolean|undefined} absolute if true returns absolute position
         */
        getOffset: function ( elem, absolute ) {
            if ( !absolute )
                absolute = false;
            var point = new geometry.Point( elem.offsetLeft, elem.offsetTop );
            if ( absolute && elem.offsetParent ) {
                var parent = geometry.getOffset( elem.offsetParent, true );
               point = lola.math.point.add( point, parent );
            }
            return point;
        },

        /**
         * gets position relative to root
         * @param {Element} elem
         */
        absolutePosition: function( elem ){
            return geometry.getOffset( elem, true );
        },

        /**
         * get position relative to offsetParent
         * @param {Element} elem
         */
        relativePosition: function( elem ){
            return geometry.getOffset( elem, false );
        },

        /**
         * gets or sets the width of an element
         * @param {Element} elem
         * @param {Number|undefined} value
         */
        width: function ( elem, value ) {
            if (value){
                //setting
                var bl = lola.css.style(elem,"borderLeft");
                var br = lola.css.style(elem,"borderRight");
                var pl = lola.css.style(elem,"paddingLeft");
                var pr = lola.css.style(elem,"paddingRight");
                value -= bl+br+pl+pr;

                return lola.css.style( elem, 'width', value);
            }
            else{
                //getting
                if ( elem.offsetWidth )
                    return elem.offsetWidth;
                else
                    return elem.clientWidth;
            }
        },

        /**
         * gets or sets the height of an element
         * @param {Element} elem
         * @param {Number|undefined} value
         */
        height: function ( elem, value ) {
            if (value){
                //setting
                var bl = lola.css.style(elem,"borderTop");
                var br = lola.css.style(elem,"borderBottom");
                var pl = lola.css.style(elem,"paddingTop");
                var pr = lola.css.style(elem,"paddingBottom");
                value -= bl+br+pl+pr;

                return lola.css.style( elem, 'height', value);
            }
            else{
                //getting
                if ( elem.offsetHeight )
                    return elem.offsetHeight;
                else
                    return elem.clientHeight;
            }
        },

        /**
         * calculates distance between points
         * @param {lola.geometry.Point|Object} p1
         * @param {lola.geometry.Point|Object} p2
         */
        pointDistance: function( p1, p2 ){
            var d = lola.math.point.subtract(p2,p1);
            return Math.sqrt( Math.pow(d.x,2) + Math.pow(d.y,2)  );
        },


		//==================================================================
		// Classes
		//==================================================================
        /**
         * Point class
         * @class
         * @param {Number|undefined} x x coordinate
         * @param {Number|undefined} y y coordinate
         */
        Point: function ( x, y ) {
            this.x = x;
            this.y = y;
            return this;
        },

        /**
         * Spline class
         * @class
         * @param {Array|undefined} points array of spline points
         * @param {uint} flags
         */
        Spline: function( points, flags ){
            this.points = points?points:[];
            this.flags = flags == undefined ? 0 : flags;
            return this;
        },

        /**
         * SplinePoint class
         * @class
         * @param anchorX
         * @param anchorY
         * @param entryStrength
         * @param entryAngle
         * @param exitStrength
         * @param exitAngle
         */
        SplinePoint: function( anchorX, anchorY, entryStrength, entryAngle, exitStrength, exitAngle ) {
            return this.init( anchorX, anchorY, entryStrength, entryAngle, exitStrength, exitAngle );
        },

        /**
         * Vector class
         * @class
         * @param velocity
         * @param angle
         */
        Vector: function ( velocity, angle ){
            this.velocity = velocity;
            this.angle = angle;
            return this;
        },

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
    geometry.Point.prototype = {
        /**
         * x coordinate
         * @type {Number}
         */
        x: undefined,

        /**
         * y coordinate
         * @type {Number}
         */
        y: undefined,

        /**
         * converts point to vector
         * @return {lola.math.geom.Vector}
         */
        toVector: function(){
            var a = Math.atan2( this.y, this.x );
            var v = Math.sqrt( this.x*this.x + this.y*this.y );
            return new lola.geometry.Vector(v,a);
        },

        /**
         * converts point to object notation
         * @return {String}
         */
        toString: function(){
            return "{x:"+this.x+",y:"+this.y+"}";
        }
    };

    geometry.Spline.CLOSED = 0x1;
    geometry.Spline.FILL = 0x2;
    geometry.Spline.STROKE = 0x4;
    geometry.Spline.CONTROLS =0x8;
    geometry.Spline.prototype = {
        /**
         * array of {lola.geometry.SplinePoint}
         * @type {Array}
         * @private
         */
        points: [],

        /**
         * spline flags
         * @type {Boolean}
         */
        flags: 0x0,

        /**
         * adds a point at the specified index.
         * if index is not passed, point will be added at last position
         * @param {lola.geometry.SplinePoint} splinePoint
         * @param {uint|undefined} index
         */
        addPoint: function( splinePoint, index ){
            if ( index == undefined )
                index = this.points.length;

            this.points.splice(index,0,splinePoint);
        },

        /**
         * removes the point at the specified index.
         * @param {uint} index
         */
        removePoint: function( index ){
            if ( index != undefined )
                this.points.splice(index,1,undefined);
        },

        /**
         * updates/replaces a point at the specified index.
         * @param {lola.geometry.SplinePoint} splinePoint
         * @param {uint} index
         */
        updatePoint: function( splinePoint, index ){
            if ( index != undefined )
                this.points.splice(index,1,splinePoint);
        },

        /**
         * gets the splinePoint at the specified index.
         * @param {uint} index
         */
        getPoint: function( index ){
            return this.points[ index ];
        },

        /**
         * gets all splinePoints.
         */
        getPoints: function(){
            return this.points;
        },

        /**
         * draws spline
         * @param {Boolean} close draw a closed spline
         * @param {Object|String|undefined} ctx
         */
        draw: function( ctx, flags ){
            flags = flags == undefined ? this.flags : flags;
            var sl = this.points.length;
            //console.log('drawSpline: '+sl);
            if (sl > 1) {
                var pts = [];
                //console.log(pts);
                this.points.forEach( function(item){
                    pts.push( item.getControl1() );
                    pts.push( item.getAnchor() );
                    pts.push( item.getControl2() );
                });
                var pl = pts.length;


                if (flags & geometry.Spline.CONTROLS){

                    ctx.beginPath();
                    ctx.moveTo(pts[1].x, pts[1].y);
                    ctx.lineTo(pts[2].x, pts[2].y);
                    ctx.stroke();
                    ctx.closePath();

                    for (var n=3; n<pl-3; n+=3){
                        var n2 = n+1;
                        var n3 = n+2;
                        ctx.beginPath();
                        ctx.moveTo(pts[n].x, pts[n].y);
                        ctx.lineTo(pts[n2].x, pts[n2].y);
                        ctx.stroke();
                        ctx.closePath();

                        ctx.beginPath();
                        ctx.moveTo(pts[n2].x, pts[n2].y);
                        ctx.lineTo(pts[n3].x, pts[n3].y);
                        ctx.stroke();
                        ctx.closePath();
                    }

                    ctx.beginPath();
                    ctx.moveTo(pts[n].x, pts[n].y);
                    ctx.lineTo(pts[n+1].x, pts[n+1].y);
                    ctx.stroke();
                    ctx.closePath();

                }

                ctx.beginPath();
                ctx.moveTo( pts[1].x,pts[1].y );
                for (var i=2; i<pl-3; i+=3){
                    ctx.bezierCurveTo(
                        pts[i].x,pts[i].y,
                        pts[i+1].x,pts[i+1].y,
                        pts[i+2].x,pts[i+2].y
                    );
                }

                if (flags & geometry.Spline.CLOSED){
                    ctx.bezierCurveTo(
                        pts[pl-1].x,pts[pl-1].y,
                        pts[0].x,pts[0].y,
                        pts[1].x,pts[1].y
                    );
                }

                if (flags & geometry.Spline.FILL){
                    ctx.fill();
                }

                if (flags & geometry.Spline.STROKE){
                    ctx.stroke();
                }

                ctx.closePath();

            }
            else{
                throw new Error('not enough spline points');
            }
        }

    };

    geometry.SplinePoint.prototype = {

        /**
         * splinepoint anchor point
         * @type {lola.geometry.Point|undefined}
         */
        anchor: undefined,

        /**
         * splinepoint entry vector
         * @type {lola.geometry.Vector|undefined}
         */
        entry: undefined,

        /**
         * splinepoint exit vector
         * @type {lola.geometry.Vector|undefined}
         */
        exit: undefined,

        /**
         * initialization function
         * @param ax
         * @param ay
         * @param es
         * @param ea
         * @param xs
         * @param xa
         */
        init: function (ax, ay, es, ea, xs, xa){
            this.anchor = new lola.geometry.Point( ax, ay );
            this.entry = new lola.geometry.Vector( es, ea );
            this.exit = new lola.geometry.Vector( xs, xa==undefined?ea:xa );
        },

        /**
         * sets the SplinePont's entry and exit angles
         * if exitAngle is omitted the same angle is set for both
         * @param {Number} entryAngle
         * @param {Number|undefined} exitAngle
         */
        setAngle: function( entryAngle, exitAngle) {
            this.entry.angle = entryAngle;
            this.exit.angle = exitAngle==undefined?entryAngle:exitAngle;
        },


        /**
         * gets the spline point's anchor
         * @return {lola.geometry.Point}
         */
        getAnchor: function(){
            return this.anchor;
        },

        /**
         * gets the spline point's entry control point
         * @return {lola.geometry.Point}
         */
        getControl1: function(){
            return lola.math.point.subtract( this.anchor, this.entry.toPoint());
        },

        /**
         * gets the spline point's exit control point
         * @return {lola.geometry.Point}
         */
        getControl2: function(){
            return lola.math.point.add( this.anchor, this.exit.toPoint() );
        }

    };

    geometry.Vector.prototype = {
        /**
         * velocity or length of the vector
         * @type {Number}
         */
        velocity: undefined,

        /**
         * angle of vector (horizontal pointing right is 0 radians)
         * @type {Number}
         */
        angle: undefined,

        /**
         * converts a vector to a (0,0) based point
         * @return {lola.geometry.Point}
         */
        toPoint: function() {
            return new lola.geometry.Point(
                Math.cos(this.angle)*this.velocity,
                Math.sin(this.angle)*this.velocity
            )
        }
    };


	//register module
	lola.registerModule( geometry );

})( lola );
/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Graphics
 *  Description: Graphics module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Graphics Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var graphics = {

		//==================================================================
		// Attributes
		//==================================================================
        /**
         * default context
         * @private
         */
		ctx: null,

        /**
         * 2d context map
         * @private
         */
		map2d: {},

        /**
         * 2d context reset object
         * @private
         */
		reset2d: {},

        /**
         * 2d style map
         * @private
         */
        styles2d: {},

        /**
         * routine map
         * @private
         */
        routines: {},

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.graphics::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization
			lola.safeDeleteHooks.push( {scope:lola.graphics, fn:lola.graphics.remove2dContext} );

			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');
			for ( var k in ctx ){
				switch ( lola.type.get(ctx[k]) ) {
					case "string":
					case "boolean":
					case "number":
						this.reset2d[ k ] = ctx[k];
						break;
                    case "function":
                        //console.log("Context Method: "+k);
                        if ( !this[k] ){
                            lola.evaluate( "lola.graphics."+k+" = function(){"+
                                    "this.ctx."+k+".apply( this.ctx, arguments );"+
                                "}");
                        }
                        break;
				}
			}

			//remove initialization method
			delete lola.graphics.preinitialize;

            //alias graphics package
            lola.g = lola.graphics;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.graphics::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.graphics.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "graphics";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [ "math.point","math.vector" ];
		},

        /**
         * maps 2d context of specified canvas
         * @param {Element} canvas
         * @param {String|undefined} id
         */
		register2dContext:function( canvas, id ){
			var context = canvas.getContext('2d');
			id = (id==undefined)?$(canvas).identify().attr('id'):id;
			var gdata = $(canvas).getData( this.getNamespace(), true );
			if (gdata.contexts2d == null)
				gdata.contexts2d = [];
			gdata.contexts2d.push( id );
			//$(canvas).putData( gdata, this.getNamespace() );

			this.map2d[ id ] = context;
		},

        /**
         * unmaps 2d context for specified canvas
         * @param canvas
         */
		remove2dContext:function( canvas ){
			var gdata = $(canvas).getData( this.getNamespace(), false );
			if (gdata && gdata.contexts2d) {
				var id;
				while ( id = gdata.contexts2d.pop() ){
					delete this.map2d[ id ];
				}
			}
		},

        /**
         * get a mapped context
         * @param {String} id
         * @return {Object}
         */
        get2dContext: function(id) {
            return this.map2d[id];
        },

        /**
         * resolves string to context
         * if a context is passed the same context is returned.
         * if nothing is found the current default context is returned
         * @param {Object|String|undefined} ctx
         */
        resolveContext: function( ctx ) {
            if (typeof ctx === "string")
                ctx = this.get2dContext( ctx );

            return ctx || lola.graphics.ctx;
        },

        /**
         * @descrtiption sets the current default context
         * @param {Object|String} ctx
         */
        setContext: function( ctx ) {
            this.ctx = this.resolveContext( ctx );
        },

        /**
         * returns a context to its original state
         * @param {Object|String|undefined} ctx
         */
		reset2dContext: function( ctx ) {
			if (typeof ctx == "string")
				ctx = this.resolveContext(ctx);

			if (ctx) lola.util.copyPrimitives( this.reset2d, ctx );
		},

        /**
         * copies properties of styleObject into style cache with given name
         * @param {String} name
         * @param {Object} styleObj
         */
        registerStyle: function( name, styleObj ) {
            var obj = {};
            lola.util.copyPrimitives( styleObj, obj );
            this.styles2d[ name ] = obj;
        },

        /**
         * removes style with specified name
         * @param {String} name
         */
        removeStyle: function(  name ) {
            delete this.styles2d[ name ];
        },

        /**
         * registers a repeatable drawing routine
         * @param {String} name
         * @param {Function} fnc function that accepts ctx to draw
         */
        registerRoutine: function( name, fnc ) {
            this.routines[ name ] = fnc;
        },

        /**
         * removes routine with specified name
         * @param {String} name
         */
        removeRoutine: function(  name ) {
            delete this.routines[ name ];
        },

        /**
         * execute a drawing routine
         * @param {String} name
         */
        executeRoutine: function( name ) {
            if (typeof this.routines[name] == "function" ){
                this.routines[name]( this.ctx );
            }
        },

        /**
         * copies properties of styleObject into style cache with given name
         * @param {Object|String} style
         * @param {Object|String} ctx
         */
        applyStyle: function( style, ctx ) {
            ctx = this.resolveContext( ctx );
            var styles = (typeof style == "string") ?  this.styles2d[ style ] || this.reset2d : style;
            lola.util.copyPrimitives( this.reset2d, ctx );
            lola.util.copyPrimitives( styles, ctx );
        },

        /**
         * draws drawable objects in current context
         * @param {Object|Array} objects
         */
        draw: function( object, flags ){
            if ( object.draw && typeof object.draw === "function" ){
                object.draw( lola.graphics.ctx, flags );
            }
        },

        /**
         * clears a context
         * @param ctx
         */
        clear: function( ctx ){
            ctx = this.resolveContext( ctx );
            ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);
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
				register2dContext: function(){
					this.forEach( function(item){
						lola.graphics.register2dContext( item );
					});

					return this;
				}
			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================

	//register module
	lola.registerModule( graphics );

})( lola );
/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: HTTP
 *  Description: HTTP module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * HTTP Request Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var http = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * storage for cached xsl requests
		 */
		xslCache: {},


		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.http::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.http.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.http::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.http.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "http";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['string'];
		},

		/**
		 * @descripiton applies transformation using results of two requests
		 * @public
		 * @param {lola.http.Request} xmlDoc
		 * @param {lola.http.Request} xslDoc
		 * @param {Object} xslParams
		 */
		transform: function( xmlDoc, xslDoc, xslParams ) {
			var children,k;
			if ( window.ActiveXObject ) {
				//THIS NEEDS TO BE TESTED! I've got no clue if it will work or not.
				var xsltCompiled = new ActiveXObject( "MSXML2.XSLTemplate" );
				xsltCompiled.stylesheet = xslDoc.documentElement;
				var processor = xsltCompiled.createProcessor();
				processor.input = xmlDoc;
				for ( k in xslParams ) {
					processor.addParameter( k, xslParams[k] );
				}
				processor.transform();

				var tempDiv = document.createElement( 'div' );
				tempDiv.innerHTML = processor.output;
				children = tempDiv.childNodes;
			}
			else if ( document.implementation && document.implementation.createDocument ) {
				var xsltProcessor = new XSLTProcessor();
				xsltProcessor.importStylesheet( xslDoc );
				for ( k in xslParams ) {
					xsltProcessor.setParameter( null, k, xslParams[k] );
				}
				var resultDocument = xsltProcessor.transformToFragment( xmlDoc, document );
				if ( resultDocument ) {
					children = resultDocument.childNodes;
				}
			}

			return children;
		},

		/**
		 * caches xsl request
		 * @public
		 * @param {String} id
		 * @param {lola.http.Request} xsl
		 */
		cacheXsl: function( id, xsl ){
			lola.http.xslCache[ id ] = xsl;
		},

		/**
		 * replaces "<" ">" "&" with "&lt;" "&gt;" "&amp;"
		 * @param {String} str
		 */
		encode: function( str ) {
			if ( typeof str == 'string' ) {
				str = str.replace( /</g, '&lt;' );
				str = str.replace( />/g, '&gt;' );
				str = str.replace( /&/g, '&amp;' );
			}
			return str;
		},

		/**
		 * replaces "&lt;" "&gt;" "&amp;" with "<" ">" "&"
		 * @param {String} str
		 */
		unencode: function( str ) {
			if ( typeof str == 'string' ) {
				str = str.replace( /\$lt;/g, '<' );
				str = str.replace( /&gt;/g, '>' );
				str = str.replace( /&amp;/g, '&' );
			}
			return str;
		},

		//==================================================================
		// Classes
		//==================================================================
		/**
		 * Base HTTP Request Class
		 * @class
		 * @param {String} url request url
		 * @param {String} method request method
		 * @param {Array} headers request headers
		 * @param {Boolean} async execute request asyncronously
		 * @param {String} user credentials username
		 * @param {String} password credentials password
		 */
		Request: function( url, method, headers, async, user, password ) {
			return this.init( url, method, headers, async, user, password );
		},

		/**
		 * Asynchronous HTTP Request Class Alias
		 * @class
		 * @param {String} url request url
		 * @param {String} method request method
		 * @param {Array} headers request headers
		 * @param {String} user credentials username
		 * @param {String} password credentials password
		 * @extends lola.http.Request
		 */
		AsyncRequest: function( url, method, headers, user, password ) {
			return this.init( url, method, headers, true, user, password );
		},

		/**
		 * Synchronous HTTP Request Class Alias
		 * @class
		 * @param {String} url request url
		 * @param {String} method request method
		 * @param {Array} headers request headers
		 * @param {String} user credentials username
		 * @param {String} password credentials password
		 * @extends lola.http.Request
		 */
		SyncRequest: function( url, method, headers, user, password ) {
			return this.init( url, method, headers, false, user, password );
		},

		/**
		 * AJAX Transform Class
		 * @param {lola.http.Request} xml request object
		 * @param {lola.http.Request|String} xsl request object or string id for cached xsl
		 * @param {Object} xslParams
		 * @param {String|undefined} xslCacheId if set xsl will be cached with the specified id
		 */
		Transform: function( xml, xmlParams, xsl, xslParams, transformParams, xslCacheId ) {
			return this.init( xml, xmlParams, xsl, xslParams, transformParams, xslCacheId );
		},

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
				applyTransform: function( transform, interimContent, faultContent ) {
					this.html( interimContent );
					this.forEach( function(item){
						lola.event.addListener( transform, 'result', function( event ) {
							$( item ).html( event.data );
						} );
						lola.event.addListener( transform, 'fault', function() {
							$( item ).html( faultContent );
						} );
					});

					transform.load();

				},
				/**
				 * loads a request's content into elements
				 * @param {lola.http.Request} request
				 * @param {Object} requestParams
				 * @param {*} interimContent
				 * @param {*} faultContent
				 */
				applyRequest: function( request, requestParams, interimContent, faultContent ) {
					this.html( interimContent );
					this.forEach( function(item){
						lola.event.addListener( request, 'result', function( event ) {
							$( item ).html( event.currentTarget.responseText() );
						} );
						lola.event.addListener( request, 'fault', function() {
							$( item ).html( faultContent );
						} );
					});

					request.load();
				},

				/**
				 * loads http content into elements asynchronously
				 * @param {String} url
				 * @param {*} interimContent
				 * @param {*} faultContent
				 */
				loadContent: function( url, interimContent, faultContent ){
					var request = new lola.http.AsyncRequest( url, 'get', [] );
					this.applyRequest( request, {}, interimContent, faultContent);
				}
			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================
	http.Request.prototype = {
		/**
		 * request url
		 * @private
		 */
		url: "",

		/**
		 * request method
		 * @private
		 */
		method: 'POST',

		/**
		 * request headers
		 * @private
		 */
		headers: [],

		/**
		 * execute request asyncronously
		 * @private
		 */
		async: true,

		/**
		 * username
		 * @private
		 */
		user: null,

		/**
		 * password
		 * @private
		 */
		password: null,

		/**
		 * DOM xmlhttprequest
		 * @private
		 */
		request: false,

		/**
		 * readyFlag
		 * @public
		 */
		ready: false,

		/**
		 * http.Request initializer
		 * @param {String} url request url
		 * @param {String} method request method
		 * @param {Array} headers request headers
		 * @param {Boolean} async execute request asyncronously
		 * @param {String} user credentials username
		 * @param {String} password credentials password
		 */
		init: function( url, method, headers, async, user, password ) {
			this.method = method || 'POST';
			this.headers = headers || [];
			this.async = async === true;
			this.url = url;
			this.user = user;
			this.password = password;

			return this;
		},

		/**
		 * gets correct request object
		 * @private
		 */
		getRequestObject: function() {
			var request = false;
			if ( window.XMLHttpRequest && !(window.ActiveXObject) ) {
				// branch for native XMLHttpRequest object
				try {
					request = new XMLHttpRequest();
				}
				catch( error ) {
					request = false;
				}
			}
			else if ( window.ActiveXObject ) {
				// branch for IE/Windows ActiveX version
				try {
					//request = new ActiveXObject("MSXML2.FreeThreadedDomDocument");
					request = new ActiveXObject( "Msxml2.XMLHTTP" );
				}
				catch( error ) {
					try {
						request = new ActiveXObject( "Microsoft.XMLHTTP" );
					}
					catch( error ) {
						request = false;
					}
				}
			}

			return request;
		},

		/**
		 * builds and executes request
		 * @private
		 * @param url
		 * @param params
		 * @param method
		 * @param headers
		 * @param async
		 * @param readystatechange
		 * @param scope
		 * @param user
		 * @param password
		 */
		makeRequest: function( url, params, method, headers, async, readystatechange, scope, user, password ) {
			var request = this.getRequestObject();
			request.open( method, url, async, user, password );
			request.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
			for ( var i = 0; i < headers.length; i++ ) {
				try {
					request.setRequestHeader( headers[i].name, headers[i].value );
				}
				catch( e ) {
				}
			}
			if ( params != null ) {
				if ( lola.type.get( params ) != 'string' ) {
					var temp = [];
					for ( var k in params ) {
						temp.push( k + "=" + lola.string.encode( params[k] ) );
					}
					params = temp.join( '&' );
				}

				if ( params.length > 0 ) {
					//request.setRequestHeader("Content-Length", params.length);
					//request.setRequestHeader("Connection", "close");
				}
			}

			request.onreadystatechange = function() {
				readystatechange.call( scope )
			};
			request.send( params );

			return request;
		},

		/**
		 * send request
		 * @public
		 * @param {Object|String|undefined} params
		 */
		load: function( params ) {
			this.request = this.makeRequest( this.url, params, this.method, this.headers, this.async, this.readyStateChange, this, this.user, this.password );
		},

		/**
		 * ready state change listener
		 * @private
		 */
		readyStateChange: function() {
			if ( this.request ) {
				switch ( this.request.readyState ) {
					case 0:
						//uninitialized
						break;
					case 1:
						//loading
						lola.event.trigger( this, 'loading', true, true, this.request );
						break;
					case 2:
						//loaded
						lola.event.trigger( this, 'loaded', true, true, this.request );
						break;
					case 3:
						//interactive
						lola.event.trigger( this, 'interactive', true, true, this.request );
						break;
					case 4:
						//complete
						lola.event.trigger( this, 'stateComplete', true, true, this.request );
						if ( this.request.status == 200 && !this.ready ) {
							this.ready = true;
							lola.event.trigger( this, 'result', true, true, this.request );
						}
						else if ( this.request.status >= 400 ) {
							console.info( 'AsyncRequest.readyStateChange.fault:', this.url );
							lola.event.trigger( this, 'fault', false, false, this.request );
						}
						break;
				}
			}
		},

		/**
		 * get raw response text
		 * @return {String}
		 */
		responseText: function() {
			if ( this.ready || !this.async)
				return this.request.responseText;
			else
				return false;
		},

		/**
		 * get response xml document
		 * @return {XML}
		 */
		responseXML: function() {
			if ( this.ready || !this.async )
				return this.request.responseXML;
			else
				return false;
		}


	};
	http.AsyncRequest.prototype = http.Request.prototype;
	http.SyncRequest.prototype = http.Request.prototype;

	http.Transform.prototype = {
		/**
		 * xml request object
		 * @private
		 * @type {lola.http.Request}
		 */
		xml: null,

		/**
		 * xsl request object
		 * @private
		 * @type {lola.http.Request}
		 */
		xsl: null,

		/**
		 * transformation xsl request params
		 * @private
		 * @type {Object}
		 */
		xslParams: null,

		/**
		 * transformation xml request params
		 * @private
		 * @type {Object}
		 */
		xmlParams: null,

		/**
		 * cache xsl onceLoaded
		 * @private
		 * @type {String}
		 */
		xslCacheId: "",

		/**
		 * holds transformation result
		 * @type {Array}
		 */
		resultNodes: [],

		/**
		 * Transform class initializer
		 * @private
		 * @param xml
		 * @param xsl
		 * @param xslParams
		 * @param xslCacheId
		 */
		init: function( xml, xmlParams, xsl, xslParams, transformParams, xslCacheId ) {
			this.xmlParams = xmlParams;
			this.xslParams = xslParams;
			this.transformParams = transformParams;
			this.xslCacheId = xslCacheId || "";
			if ( lola.type.get( xsl ) == 'string' ) {
				var xslId = xsl;
				xsl = lola.http.getCachedXsl( xslId );
				if ( !xsl ) {
					throw new Error( 'unknown xsl cache id: "' + xslId + '"' );
				}
			}
			else {
				this.xsl = xsl;
			}

			if ( this.xsl && this.xml ) {
				lola.event.addListener( this.xsl, 'result', this.checkStates, true, 0, this );
				lola.event.addListener( this.xsl, 'fault', this.handleXSLFault, true, 0, this );
				lola.event.addListener( this.xml, 'result', this.checkStates, true, 0, this );
				lola.event.addListener( this.xml, 'fault', this.handleXMLFault, true, 0, this );

				this.checkStates();
			}
			else {
				throw new Error( 'transform error!' );
			}

		},

		/**
		 * checks the states of both requests to see if the transform can be applied
		 * @private
		 */
		checkStates: function() {
			if ( this.xml.ready && this.xsl.ready ) {
				//cache xsl request if id set
				if (this.xslCacheId && this.xslCacheId != "") {
					lola.http.cacheXsl( this.xslCacheId, this.xsl );
				}

				//both requests are ready, do transform
				this.resultNodes = lola.http.transform( this.xml.responseXML(), this.xsl.responseXML(), this.transformParams );
				lola.event.trigger( this, 'result', true, true, this.resultNodes );
			}
		},

		/**
		 *  handles xsl fault
		 * @private
		 */
		handleXSLFault: function() {
			lola.event.trigger( this, 'fault', true, true, 'xsl fault' );
		},

		/**
		 *  handles xml fault
		 * @private
		 */
		handleXMLFault: function() {
			lola.event.trigger( this, 'fault', true, true, 'xml fault' );
		},

		/**
		 * sends the transform requests if not yet sent
		 * @public
		 */
		load: function() {
			if ( !this.xml.request ) {
				this.xml.send( this.xmlParams );
			}
			if ( !this.xsl.request ){
				this.xsl.send( this.xslParams );
			}
		},

		/**
		 *  cancels transform request... aborts requests and removes listeners
		 * @public
		 */
		cancel: function() {
			lola.event.removeListener( this.xsl, 'result', this.checkStates, true );
			lola.event.removeListener( this.xsl, 'fault', this.handleXSLFault, true );
			lola.event.removeListener( this.xml, 'result', this.checkStates, true );
			lola.event.removeListener( this.xml, 'fault', this.handleXMLFault, true );
			try {
				this.xsl.abort();
			}
			catch(e){}
			try {
				this.xml.abort();
			}
			catch(e){}
		},

		/**
		 * get the result of the transformation
		 * @public
		 * @return {Array} array of nodes
		 */
		getResultNodes: function(){
			return this.resultNodes;
		}


	};


	//register module
	lola.registerModule( http );

})( lola );
/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: JSON
 *  Description: JSON module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * JSON Module adapted from json.org code
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var json = {

		//==================================================================
		// Attributes
		//==================================================================
		// JSON parsing variables
		cx: /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		escapable: /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		gap: null,
		indent: null,
		meta: {    // table of character substitutions
			'\b': '\\b',
			'\t': '\\t',
			'\n': '\\n',
			'\f': '\\f',
			'\r': '\\r',
			'"' : '\\"',
			'\\': '\\\\'
		},
		rep: null,

        /**
         * map used for JSONp callbacks
         * @type {Object}
         * @private
         */
        handleResponse: {},
        ruid:0,

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.json::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.json.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.json::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.json.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "json";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['http'];
		},

		/**
		 * json parsing method
		 * @private
		 * @param {String} string
		 */
		escapeQuotes: function ( string ) {
			// If the string contains no control characters, no quote characters, and no
			// backslash characters, then we can safely slap some quotes around it.
			// Otherwise we must also replace the offending characters with safe escape
			// sequences.
			//this.escapable.lastIndex = 0;
			return this.escapable.test( string ) ?
					'"' + string.replace( this.escapable, function ( a ) {
						var c = lola.json.meta[a];
						return typeof c === 'string' ? c :
								'\\u' + ('0000' + a.charCodeAt( 0 ).toString( 16 )).slice( -4 );
					} ) + '"' :
					'"' + string + '"';
		},


		/**
		 * json parsing method
		 * @private
		 * @param {String} key
		 * @param {Object} holder
		 */
		str: function ( key, holder ) {
			var i,          // The loop counter.
					k,          // The member key.
					v,          // The member value.
					length,
					mind = this.gap,
					partial,
					value = holder[key];

			// If the value has a toJSON method, call it to obtain a replacement value.
			if ( value && typeof value === 'object' &&
					typeof value.toJSON === 'function' ) {
				value = value.toJSON( key );
			}

			// If we were called with a replacer function, then call the replacer to
			// obtain a replacement value.
			if ( typeof this.rep === 'function' ) {
				value = this.rep.call( holder, key, value );
			}

			// What happens next depends on the value's type.
			switch ( typeof value ) {
				case 'string':
					return this.escapeQuotes( value );

				case 'number':
					// JSON numbers must be finite. Encode non-finite numbers as null.
					return isFinite( value ) ? String( value ) : 'null';

				case 'boolean':
				case 'null':
					// If the value is a boolean or null, convert it to a string. Note:
					// typeof null does not produce 'null'. The case is included here in
					// the remote chance that this gets fixed someday.
					return String( value );

				case 'object':
					// If the type is 'object', we might be dealing with an object or an array or null.
					// Due to a specification blunder in ECMAScript, typeof null is 'object',
					// so watch out for that case.
					if ( !value ) {
						return 'null';
					}

					// Make an array to hold the partial results of stringifying this object value.
					this.gap += this.indent;
					partial = [];

					// Is the value an array?
					if ( Object.prototype.toString.apply( value ) === '[object Array]' ) {

						// The value is an array. Stringify every element. Use null as a placeholder
						// for non-JSON values.
						length = value.length;
						for ( i = 0; i < length; i += 1 ) {
							partial[i] = this.str( i, value ) || 'null';
						}

						// Join all of the elements together, separated with commas, and wrap them in
						// brackets.
						v = partial.length === 0 ? '[]' :
								this.gap ? '[\n' + this.gap +
										partial.join( ',\n' + this.gap ) + '\n' +
										mind + ']' :
										'[' + partial.join( ',' ) + ']';
						this.gap = mind;
						return v;
					}

					// If the replacer is an array, use it to select the members to be stringified.
					if ( this.rep && typeof this.rep === 'object' ) {
						length = this.rep.length;
						for ( i = 0; i < length; i += 1 ) {
							k = this.rep[i];
							if ( typeof k === 'string' ) {
								v = this.str( k, value );
								if ( v ) {
									partial.push( this.escapeQuotes( k ) + (this.gap ? ': ' : ':') + v );
								}
							}
						}
					}
					else {
						// Otherwise, iterate through all of the keys in the object.
						for ( k in value ) {
							if ( Object.hasOwnProperty.call( value, k ) ) {
								v = this.str( k, value );
								if ( v ) {
									partial.push( this.escapeQuotes( k ) + (this.gap ? ': ' : ':') + v );
								}
							}
						}
					}

					// Join all of the member texts together, separated with commas,
					// and wrap them in braces.

					v = partial.length === 0 ? '{}' :
							this.gap ? '{\n' + this.gap + partial.join( ',\n' + this.gap ) + '\n' +
									mind + '}' : '{' + partial.join( ',' ) + '}';
					this.gap = mind;
					return v;
			}
		},

		/**
		 * json encodes a javascript object
		 * @public
		 * @param {Object} obj
		 * @return {String}
		 */
		encode: function ( obj ) {
			return lola.json.stringify( obj );
		},

		/**
		 * decodes a json string
		 * @public
		 * @param {String} text
		 * @return {Object}
		 */
		decode: function ( text ) {
			return lola.json.parse( text );
		},

		/**
		 * json encodes a javascript object
		 * @private
		 * @param {Object} value
		 * @param {Object} replacer
		 * @param {String} space
		 * @return {String}
		 */
		stringify: function ( value, replacer, space ) {
			// The stringify method takes a value and an optional replacer, and an optional
			// space parameter, and returns a JSON text. The replacer can be a function
			// that can replace values, or an array of strings that will select the keys.
			// A default replacer method can be provided. Use of the space parameter can
			// produce text that is more easily readable.

			var i;
			this.gap = '';
			this.indent = '';

			// If the space parameter is a number, make an indent string containing that
			// many spaces.
			if ( typeof space === 'number' ) {
				for ( i = 0; i < space; i += 1 ) {
					this.indent += ' ';
				}

			}
			else if ( typeof space === 'string' ) {
				// If the space parameter is a string, it will be used as the indent string.
				this.indent = space;
			}

			// If there is a replacer, it must be a function or an array.
			// Otherwise, throw an error.
			this.rep = replacer;
			if ( replacer && typeof replacer !== 'function' &&
					(typeof replacer !== 'object' ||
							typeof replacer.length !== 'number') ) {
				throw new Error( 'JSON.stringify' );
			}

			// Make a fake root object containing our value under the key of ''.
			// Return the result of stringifying the value.
			return this.str( '', {'': value} );

		},

		/**
		 * decodes a json string
		 * @private
		 * @param text
		 * @param reviver
		 */
		parse: function ( text, reviver ) {
			// The parse method takes a text and an optional reviver function, and returns
			// a JavaScript value if the text is a valid JSON text.
			var j;

			// The walk method is used to recursively walk the resulting structure so
			// that modifications can be made.
			function walk( holder, key ) {
				var k, v, value = holder[key];
				if ( value && typeof value === 'object' ) {
					for ( k in value ) {
						if ( Object.hasOwnProperty.call( value, k ) ) {
							v = walk( value, k );
							if ( v !== undefined ) {
								value[k] = v;
							}
							else {
								delete value[k];
							}
						}
					}
				}

				return reviver.call( holder, key, value );
			}

			// Parsing happens in four stages. In the first stage, we replace certain
			// Unicode characters with escape sequences. JavaScript handles many characters
			// incorrectly, either silently deleting them, or treating them as line endings.
			text = String( text );
			//this.cx.lastIndex = 0;
			if ( this.cx.test( text ) ) {
				text = text.replace( this.cx, function ( a ) {
					return '\\u' + ('0000' + a.charCodeAt( 0 ).toString( 16 )).slice( -4 );
				} );
			}

			// In the second stage, we run the text against regular expressions that look
			// for non-JSON patterns. We are especially concerned with '()' and 'new'
			// because they can cause invocation, and '=' because it can cause mutation.
			// But just to be safe, we want to reject all unexpected forms.

			// We split the second stage into 4 regexp operations in order to work around
			// crippling inefficiencies in IE's and Safari's regexp engines. First we
			// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
			// replace all simple value tokens with ']' characters. Third, we delete all
			// open brackets that follow a colon or comma or that begin the text. Finally,
			// we look to see that the remaining characters are only whitespace or ']' or
			// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.
			if ( /^[\],:{}\s]*$/.test( text.replace( /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@' ).
					replace( /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']' ).
					replace( /(?:^|:|,)(?:\s*\[)+/g, '' ) ) ) {
				// In the third stage we use the eval function to compile the text into a
				// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
				// in JavaScript: it can begin a block or an object literal. We wrap the text
				// in parens to eliminate the ambiguity.
				j = eval( '(' + text + ')' );

				// In the optional fourth stage, we recursively walk the new structure, passing
				// each name/value pair to a reviver function for possible transformation.
				return typeof reviver === 'function' ? walk( {'': j}, '' ) : j;
			}

			// If the text is not JSON parseable, then a SyntaxError is thrown.
			throw new SyntaxError( 'JSON.parse' );

		},

        get: function ( urlStr, callback, jsonpParam ){

            console.log('json.get: '+urlStr);

            var url = new lola.URL(urlStr);

            //determine how to load json
            if (url.protocol == "____" ||
                (false && url.protocol == lola.url.protocol && url.domain == lola.url.domain) ){
                console.log('    same domain');
                //same protocol & domain... just do async call
                var r = new lola.http.AsyncRequest(urlStr);
                if (callback) {
                    $(r).addListener('result', function(event){
                        console.log('    result');
                        var obj = lola.json.parse( event.data.responseText );
                        callback(obj);
                    } );
                }

                r.load();

            }
            else {
                console.log('    cross domain');
                jsonpParam = jsonpParam ? jsonpParam : "jsonp";
                //assume this is a jsonp call and the server supports it.
                var uid = this.ruid++;
                lola.json.handleResponse[uid] = function( obj ){
                    callback(obj);
                    delete lola.json.handleResponse[uid];
                };
                url.vars[jsonpParam] = "lola.json.handleResponse["+uid+"]";
                lola.loadScript( url.toString() );
            }
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
		 * upgrades prototypes and is then deleted
		 * @private
		 */
		upgradePrototypes: function() {

			if ( typeof Date.prototype.toJSON !== 'function' ) {
				Date.prototype.toJSON = function ( key ) {
					return isFinite( this.valueOf() ) ?
							this.getUTCFullYear() + '-' +
									lola.string.padFront( this.getUTCMonth() + 1,"0",2 ) + '-' +
									lola.string.padFront( this.getUTCDate(),"0",2 ) + 'T' +
									lola.string.padFront( this.getUTCHours(),"0",2 ) + ':' +
									lola.string.padFront( this.getUTCMinutes(),"0",2 ) + ':' +
									lola.string.padFront( this.getUTCSeconds(),"0",2 ) + 'Z' : null;
				};

				String.prototype.toJSON =
						Number.prototype.toJSON =
								Boolean.prototype.toJSON = function ( key ) {
									return this.valueOf();
								};
			}
		}

	};

	//==================================================================
	// Class Prototypes
	//==================================================================

	json.upgradePrototypes();
	delete json.upgradePrototypes;

	//register module
	lola.registerModule( json );

})( lola );
/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Color Math
 *  Description: Color Math module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Math Color Module
	 * @implements {lola.Module}
	 * @memberof lola.math
	 */
	var color = {

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
			lola.debug('lola.color::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization



			//remove initialization method
			delete lola.math.color.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.color::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization



			//remove initialization method
			delete lola.math.color.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "math.color";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['math'];
		},


		/**
		 * converts red,green,blue values to hue,saturation,lightness
		 * @param {Number} r
		 * @param {Number} g
		 * @param {Number} b
		 * @return {Object}
		 */
		rgb2hsl: function( r, g, b ) {
			var hue = 0;
			var saturation = 0;
			var lightness = 0;

			//make sure values are in range
			r = (r < 0) ? 0 : r;
			r = (r > 1) ? 1 : r;
			g = (g < 0) ? 0 : g;
			g = (g > 1) ? 1 : g;
			b = (b < 0) ? 0 : b;
			b = (b > 1) ? 1 : b;

			//set lightness
			var colorMax = (r > g) ? ((b > r) ? b : r) : ((b > g) ? b : g);
			var colorMin = (r < g) ? ((b < r) ? b : r) : ((b < g) ? b : g);
			lightness = colorMax;

			//set saturation
			if ( colorMax != 0 )
				saturation = (colorMax - colorMin) / colorMax;

			//set hue
			if ( saturation > 0 ) {
				var red = (colorMax - r) / (colorMax - colorMin);
				var green = (colorMax - g) / (colorMax - colorMin);
				var blue = (colorMax - b) / (colorMax - colorMin);
				if ( r == colorMax )
					hue = blue - green;

				else if ( g == colorMax )
					hue = 2 + red - blue;

				else
					hue = 4 + green - red;

				hue = hue / 6;

				while ( hue < 0 ) {
					hue++;
				}

			}

			return {h:hue, s:saturation, l:lightness };
		},

		/**
		 * converts red,green,blue values to hex string
		 * @param {Number} r
		 * @param {Number} g
		 * @param {Number} b
		 * @return {String}
		 */
		rgb2hex: function( r, g, b ) {
			var str = "";

			//make sure values are in range
			r = (r < 0) ? 0 : r;
			r = (r > 1) ? 1 : r;
			g = (g < 0) ? 0 : g;
			g = (g > 1) ? 1 : g;
			b = (b < 0) ? 0 : b;
			b = (b > 1) ? 1 : b;

			var red = Math.round( r * 255 );
			var green = Math.round( g * 255 );
			var blue = Math.round( b * 255 );

			var digits = "0123456789ABCDEF";

			var lku = [];
			lku.push((red - (red % 16)) / 16);
			lku.push( red % 16);
			lku.push((green - (green % 16)) / 16);
			lku.push( green % 16);
			lku.push((blue - (blue % 16)) / 16);
			lku.push( blue % 16);


			lku.forEach( function(i){
				str += digits.charAt( i );
			});

			return str;
		},


		/**
		 * converts red,green,blue values to int
		 * @param {Number} r
		 * @param {Number} g
		 * @param {Number} b
		 * @return {int}
		 */
		rgb2int: function( r, g, b ) {
			return parseInt("0x"+lola.math.color.rgb2hex(r,g,b));
		},

		/**
		 * converts hue,saturation,lightness values to red,green,blue
		 * @param {Number} h
		 * @param {Number} s
		 * @param {Number} l
		 * @return {Object}
		 */
		hsl2rgb: function( h, s, l ) {
			//make sure values are in range
			h = (h < 0) ? 0 : h;
			h = (h > 1) ? 1 : h;
			s = (s < 0) ? 0 : s;
			s = (s > 1) ? 1 : s;
			l = (l < 0) ? 0 : l;
			l = (l > 1) ? 1 : l;

			var red = 0;
			var green = 0;
			var blue = 0;

			if ( s == 0 ) {
				red = b;
				green = red;
				blue = red;
			}
			else {
				var _h = (h - Math.floor( h )) * 6;
				var _f = _h - Math.floor( _h );

				var _p = l * (1.0 - s);
				var _q = l * (1.0 - s * _f);
				var _t = l * (1.0 - (s * (1 - _f)));

				switch ( Math.floor( _h ) ) {
					case 0:
						red = l;
						green = _t;
						blue = _p;
						break;
					case 1:
						red = _q;
						green = l;
						blue = _p;
						break;
					case 2:
						red = _p;
						green = l;
						blue = _t;
						break;
					case 3:
						red = _p;
						green = _q;
						blue = l;
						break;
					case 4:
						red = _t;
						green = _p;
						blue = l;
						break;
					case 5:
						red = l;
						green = _p;
						blue = _q;
						break;
				}
			}
			return {r:red,g:green,b:blue};
		},

		/**
		 * converts hue,saturation,lightness values to uint
		 * @param {Number} h
		 * @param {Number} s
		 * @param {Number} l
		 * @return {int}
		 */
		hsl2int: function( h, s, l ) {
			var rgb = color.hsl2rgb( h, s, l );
			return color.rgb2int( rgb.r, rgb.g, rgb.b );
		},

		/**
		 * converts hue,saturation,lightness values to hex
		 * @param {Number} h
		 * @param {Number} s
		 * @param {Number} l
		 * @return {String}
		 */
		hsl2hex: function( h, s, l ) {
			var rgb = color.hsl2rgb( h, s, l );
			return color.rgb2hex( rgb.r, rgb.g, rgb.b );
		},

		/**
		 * converts int values to rgb
		 * @param {int} value
		 * @return {Object}
		 */
		int2rgb: function( value ) {
			var str = "";

			//make sure value is in range
			value = (value > 0xFFFFFF) ? 0xFFFFFF : value;
			value = (value < 0x000000) ? 0x000000 : value;

			var red = ((value >> 16) & 0xFF) / 255;
			var green = ((value >> 8) & 0xFF) / 255;
			var blue = ((value) & 0xFF) / 255;


			return {r:red,g:green,b:blue};
		},

		/**
		 * converts int values to hsl
		 * @param {int} value
		 * @return {Object}
		 */
		int2hsl: function( value ) {
			var rgb = color.int2rgb( value );
			return color.rgb2hsl( rgb.r, rgb.g, rgb.b );
		},

		/**
		 * converts int values to hex string
		 * @param {int} value
		 * @return {String}
		 */
		int2hex: function( value ) {
			var rgb = color.int2rgb( value );
			return color.rgb2hex( rgb.r, rgb.g, rgb.b );
		},

		/**
		 * converts hex values to int
		 * @param {String} value
		 * @return {int}
		 */
		hex2int: function( value ) {
			//special case for 3 digit color
			var str;
			if ( value.length == 3 ) {
				str = value[0] + value[0] + value[1] + value[1] + value[2] + value[2]
			}
			else {
				str = value;
			}

			return parseInt( "0x" + str );
		},

		/**
		 * converts hex values to rgb
		 * @param {String} value
		 * @return {Object}
		 */
		hex2rgb: function( value ) {
			return color.int2rgb( color.hex2int( value ) );
		},

		/**
		 * converts hex values to hsl
		 * @param {String} value
		 * @return {Object}
		 */
		hex2hsl: function( value ) {
			return color.int2hsl( color.hex2int( value ) );
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
	lola.registerModule( color );

})( lola );

/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Point Math
 *  Description: Point Math module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Point Math Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var point = {

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
			lola.debug( 'lola.graphics::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.math.point.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.graphics::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.math.point.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "math.point";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ["math","graphics"];
		},

		/**
		 * adds arguments to p1
		 * @param {lola.geometry.Point} p1
		 * @return {lola.geometry.Point}
		 */
		add: function( p1 ){
			var r = new lola.geometry.Point(p1.x,p1.y);
			var len =  arguments.length;
			for (var i=1; i<len; i++) {
				var arg = arguments[i];
				if (typeof arg == "number") {
					r.x += arg;
					r.y += arg;
				}
				else {
					r.x += arg.x;
					r.y += arg.y;
				}
			}
			return r;
		},


		/**
		 * subtract args from p1
		 * @param {lola.geometry.Point} p1
		 * @return {lola.geometry.Point}
		 */
		subtract: function( p1 ){
			var r = new lola.geometry.Point(p1.x,p1.y);
			var len =  arguments.length;
			for (var i=1; i<len; i++) {
				var arg = arguments[i];
				if (typeof arg == "number") {
					r.x -= arg;
					r.y -= arg;
				}
				else {
					r.x -= arg.x;
					r.y -= arg.y;
				}
			}
			return r;
		},

		/**
		 * multiply p1 by args
		 * @param {lola.geometry.Point} p1
		 * @param {lola.geometry.Point|Number} p2
		 * @return {lola.geometry.Point}
		 */
		multiply: function( p1 ){
			var r = new lola.geometry.Point(p1.x,p1.y);
			var len =  arguments.length;
			for (var i=1; i<len; i++) {
				var arg = arguments[i];
				if (typeof arg == "number") {
					r.x *= arg;
					r.y *= arg;
				}
				else {
					r.x *= arg.x;
					r.y *= arg.y;
				}
			}
			return r;
		},

		/**
		 * divide p1 by args
		 * @param {lola.geometry.Point} p1
		 * @param {lola.geometry.Point|Number} p2
		 * @return {lola.geometry.Point}
		 */
		divide: function( p1 ){
			var r = new lola.geometry.Point(p1.x,p1.y);
			var len =  arguments.length;
			for (var i=1; i<len; i++) {
				var arg = arguments[i];
				if (typeof arg == "number") {
					r.x /= arg;
					r.y /= arg;
				}
				else {
					r.x /= arg.x;
					r.y /= arg.y;
				}
			}
			return r;
		},

		/**
		 * raise p to the po
		 * @param {lola.geometry.Point} p
		 * @param {lola.geometry.Point} po
		 * @return {lola.geometry.Point}
		 */
		pow: function( p, po ){
			return new lola.geometry.Point( Math.pow( p.x, po ), Math.pow( p.y, po ) );
		},

		/**
		 * calculates the absolute distance between p1 and p2
		 * @param {lola.geometry.Point} p1
		 * @param {lola.geometry.Point} p2
		 * @return {Number}
		 */
		distance: function( p1, p2 ) {
			return Math.sqrt( Math.pow(p2.x-p1.x,2) + Math.pow(p2.y-p1.y,2)  );
		},

		/**
		 * offsets a point at the specified angle by the specified distance
		 * @param {lola.geometry.Point} p
		 * @param {Number} angle angle in radians
		 * @param {Number} distance
		 */
		offsetPoint: function( p, angle, distance ){
			var offset = new lola.geometry.Point( p.x, p.y );
			offset.x += Math.cos( angle ) * distance;
			offset.y += Math.sin( angle ) * distance;
			return offset;
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
	lola.registerModule( point );

})( lola );
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

/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Vector Math
 *  Description: Vector Math module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Vector Math Module
	 * @implements {lola.Module}
	 * @memberof lola.math
	 */
	var vector = {

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
			lola.debug( 'lola.math.vector::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.math.vector.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.math.vector::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.math.vector.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "math.vector";
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
	lola.registerModule( vector );

})( lola );
/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: JSON Template
 *  Description: JSON Template module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * template Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var template = {

		//==================================================================
		// Attributes
		//==================================================================
        /**
         * map of hooks & template hooks
         */
        hooks: {},

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug('lola.template::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.template.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.template::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization

            //get all predefined templates
            var start = lola.now();
            $('script[type="text/x-lola-template"]').forEach( function( item ){
                template.add( item.id, item.innerHTML );
            });
            var complete = lola.now();
            lola.debug( "templates parsed in "+(complete-start)+" ms" );


			//remove initialization method
			delete lola.template.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "template";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['json'];
		},

        /**
         * creates and maps a template hook from the given string
         * @param {String} id template id
         * @param {String} str template contents
         */
        add: function( id, str ) {
            if (!id || id == "getValue")
                throw new Error("invalid template id");
            this.hooks[ id ] = new template.TemplateHook( str );

        },

        /**
         * add value hook
         * @param {String} id
         * @param {Function} fn function( value ):String
         */
        addHook: function( id, fn ){
            if (!id || id == "getValue")
                throw new Error("invalid hook id");

            this.hooks[ id ] = new template.Hook( fn );
        },

        /**
         * returns hook instance
         * @param {String} id
         * @return {lola.template.Hook}
         */
        getHook: function(id){
            if ( !this.hooks[ id ] )
                throw new Error('hook "'+id+'" not found.');
            return this.hooks[ id ];
        },

        /**
         * applies the named template hook to the data
         * @param {String} name template name
         * @param {Object} data
         * @return {String}
         */
        apply: function( name, data ){
          var str = "";
          var tmp = lola.template.getHook( name );
          if (tmp){
              str = tmp.evaluate( data );
          }
          return str;
        },

		//==================================================================
		// Classes
		//==================================================================
        /**
         * internal tag object
         * ENUMERATED REPLACEMENT VALUES
         * Boolean ${property[trueValue|falseValue]}
         * String Enum ${property[a:aValue,b:bValue,c:cValue,DEFAULT:defaultValue]}
         * Integer Enum explicit ${property[3:threeValue,5:fiveValue,DEFAULT:defaultValue]}
         * Integer Enum implicit ${property[zeroValue,oneValue,twoValue]}
         *
         * SUB-TEMPLATES / HOOKS
         * ${property->name}
         * ${property[...]->name}
         * @class
         * @param {String} str
         */
        Tag: function( str ) {
            return this.init( str );
        },

        /**
         * internal hook object
         * @class
         * @param {Function} fn
         */
        Hook: function( fn ){
            return this.init( fn );
        },

        /**
         * internal template object
         * @class
         * @param {String} str
         */
        TemplateHook: function( str ) {
            return this.init( str );
        },

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
                 * sets selector elements' html to the result of evaluating
                 * the named template against the data object
                 * @param {String} name
                 * @param {Object} data
                 */
                applyTemplate: function( name, data ){
                    this.html( lola.template.apply(name,data) );
                }
			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================
    template.Tag.prototype = {

        rGetParts: /^([A-Za-z_$][A-Za-z0-9_$]*)(\[[^\]]+\])?(->[A-Za-z_$][A-Za-z0-9_$]*)?/,
        property: "",
        options: {},
        hookName: "",

        /**
         * initialize Tag Object
         * @param {String} str
         */
        init: function( str ){
            if (str)
                this.parse( str );

            return this;
        },

        /**
         * parses tag string
         * @param {String} str
         * @private
         */
        parse: function( str ){
            var parts = str.match( this.rGetParts );
            if (parts){
                this.property = parts[1];
                this.parseOptions(parts[2]);
                this.hookName = parts[3]?parts[3].replace(/-\>/g,""):"";
            }
        },

        /**
         * parses raw tag options
         * @param {String} raw
         * @private
         */
        parseOptions: function(raw){
            if (raw){
                raw = raw.slice(1,-1).trim();
                var opts = raw.split(',');
                var index = 0;
                var options = {};
                opts.forEach( function(item){
                    var iparts = item.split(':');
                    if (iparts.length > 1){
                        options[ iparts[0].trim() ]= iparts[1].trim();
                    }
                    else {
                        options[ String(index) ] = iparts[0].trim();
                    }
                    index++;
                });
                this.options = options;
            }
            else{
                this.options = {};
            }
        },
        /**
         * outputs tag string
         * @return {String}
         */
        toString: function(){
            var keys = Object.keys(this.options);
            var options = this.options;
            var opts = [];
            this.options.forEach( function( item, key ){
                opts.push( key +":"+ item );
            });
            return this.property+"["+opts.join(",")+"]"+(this.hookName==""?"":"->"+this.hookName);
        },

        /**
         * gets evaluated value if tag
         * @param {Object} data
         * @param {int} index
         */
        evaluate: function( data, index ){
            index = index || 0;
            var value = data[ this.property ];

            if (Object.keys(this.options).length > 0){
                var type = lola.type.get( value );
                switch(type){
                    case "boolean":
                        value = this.options[ value ? "0" : "1" ];
                        break;

                    default:
                        value = this.options[ value ];
                        break;
                }
            }

            //execute hook if set
            if (this.hookName != ""){
                var hook = lola.template.getHook( this.hookName );
                value = hook.evaluate( value );
            }

            return value;

        }

    };

    template.Hook.prototype = {
        /**
         * hooks function
         * @private
         */
        fn: null,

        /**
         * hook initializer
         * @param {Function} fn
         */
        init: function( fn ){
            if ( typeof fn === "function" ){
                this.fn = fn;
            }
            else {
                throw new Error("invalid hook.")
            }
            return this;
        },

        /**
         * run hook on passed value
         * @param {*} value
         * @return {String}
         */
        evaluate: function( value ) {
            //return value
            return this.fn.apply( lola.window, arguments );
        }
    };

    template.TemplateHook.prototype = {
        /**
         * tag regex
         * @private
         * @type {RegExp}
         */
        rTag: /\$\{([^\}]+)\}/,

        /**
         * template blocks
         * @private
         * @type {Array}
         */
        blocks: [],

        /**
         * count of blocks
         * @private
         * @type {int}
         */
        blockCount: 0,

        /**
         * template hook initializer
         * @private
         * @param {String} str
         */
        init: function( str ){
            if (str) {
                this.parse(str);
            }

            return this;
        },

        /**
         * parses the passed template string
         * @param {String} str
         */
        parse: function( str ){
            var blocks = [];

            //get first tag index
            var index = str.search( this.rTag );

            //loop while tags exist
            while ( index >= 0 ){
                var result = str.match( this.rTag );
                var pre = str.substring( 0, index );
                if (pre)
                    blocks.push( pre );
                blocks.push( new template.Tag( result[1] ) );
                str = str.substring( index + result[0].length );

                //get next tag index
                index = str.search( this.rTag );
            }

            //add remaining chunk
            if (str)
                blocks.push( str );

            this.blocks = blocks;
            this.blockCount = blocks.length;
        },

        /**
         * evaluates the passed value
         * @param {*} value
         * @return {String}
         */
        evaluate: function( value ) {
            var built = [];
            var count = this.blockCount;
            var blocks = this.blocks;
            var type = lola.type.get( value );
            if ( type != "array" ){
                value = [ value ];
            }
            value.forEach( function( item, index ){
                var i=0;
                while ( i < count ){
                    var block = blocks[i];
                    if (typeof block === "string"){
                        //just push the string
                        built.push( String(block) );
                    }
                    else{
                        //replace tag with value
                        built.push( block.evaluate( item, index ) );
                    }
                    i++;
                }
            });

            return built.join("");
        }

    };

	//register module
	lola.registerModule( template );

})( lola );

/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Test
 *  Description: test module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
    var $ = lola;
    /**
     * Test Module
     * @implements {lola.Module}
     * @memberof lola
     */
    var test = {

        //==================================================================
        // Attributes
        //==================================================================
        src: "tests.xml",
        index: -1,
        executables: [],
        current: null,

        //==================================================================
        // Methods
        //==================================================================
        /**
         * preinitializes module
         * @private
         * @return {void}
         */
        preinitialize: function() {
            lola.debug('lola.test::preinitialize');
            if ( !lola ) throw new Error( 'lola not defined!' );

            //do module preinitialization



            //remove initialization method
            delete lola.test.preinitialize;
        },

        /**
         * initializes module
         * @public
         * @return {void}
         */
        initialize: function() {
            lola.debug('lola.test::initialize');
            //this framework is dependent on lola framework
            if ( !lola ) throw new Error( 'lola not defined!' );

            //do module initialization



            //remove initialization method
            delete lola.test.initialize;
        },

        /**
         * get module's namespace
         * @public
         * @return {String}
         */
        getNamespace: function() {
            return "test";
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
         * sets the test source
         * @param {String} src
         */
        setSource: function( src ){
            test.src = src;
        },

        /**
         * load all tests
         */
        start: function(){
            //load test source
            console.log('lola.test.run: '+test.src);
            var req = new lola.http.SyncRequest( test.src );
            req.load();
            var xml = req.responseXML();
            test.executables = [];

            //parse test source
            if (xml.documentElement.tagName == "tests"){
                var root = xml.documentElement;
                var count = root.childNodes.length;
                for ( var i = 0; i < count; i++ ){
                    var n = root.childNodes[i];
                    //console.log( n.nodeType, n.nodeName.toLowerCase() );
                    if ( n.nodeType == 1){
                        switch( n.nodeName.toLowerCase() ){
                            case 'script':
                                //this is a setup or teardown script
                                var script = new test.Script(n)
                                test.executables.push( script );
                                break;
                            case 'test':
                                //this is a test
                                var t = new test.Test(n);
                                test.executables.push( t );
                                break;
                        }
                    }
                }
            }
            test.index = -1;
            test.next();
        },

        /**
         * run next executable
         */
        next: function(){
            test.index++;
            //console.log( test.index, '/', test.executables.length );
            if ( test.index < test.executables.length ){
                var executable = test.executables[ test.index ];
                lola.test.current = executable;
                var completed = executable.execute();
                if (completed){
                    setTimeout( function(){ test.next();}, 10);
                }
            }
            else {
                test.complete();
            }
        },

        /**
         * called when all groups have executed
         * @private
         */
        complete: function(){
            console.log('lola.test.complete');
        },

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
            var methods = {};
            return methods;

        },


        //==================================================================
        // Classes
        //==================================================================
        /**
         * @private
         * @param {Node} node
         */
        Script: function( node ){
            return this.init(node);
        },

        /**
         * @private
         * @param {Node} node
         */
        Test: function( node ){
            return this.init(node);
        }

    };

    //==================================================================
    // Class Prototypes
    //==================================================================
    test.Script.prototype = {
        name: "",
        value: "",

        init: function( node ){
            if ((node.hasAttribute('name')))
                this.name = node.attributes.getNamedItem("name").nodeValue;

            var str = "";
            for( var i = 0; i<node.childNodes.length; i++){
                str += node.childNodes[i].data;
            }
            this.value = str;

            return this;
        },

        execute: function(){
            console.log('executing', '"'+this.name+'"', 'script');
            //try {
                lola.evaluate( this.value );
            //}
            //catch( e ){
            //   console.error('error evaluating', this.name, 'script:', e.message );
            //}

            return true;
        }
    };

    test.Test.prototype = {
        name: undefined,
        result: undefined,
        assert: "==",
        compareTo: undefined,
        test: undefined,
        async: false,
        passed: undefined,
        error: "",

        init: function( node ){

            this.name = node.attributes.getNamedItem("name").nodeValue;

            if (node.hasAttribute('async'))
                this.async = node.attributes.getNamedItem("async").nodeValue == "true";

            if (node.hasAttribute('equals')){
                this.assert = "equals";
            }
            else if (node.hasAttribute('strictlyEquals')){
                this.assert = "strictlyEquals";
            }
            else if (node.hasAttribute('doesNotEqual')){
                this.assert = "doesNotEqual";
            }
            else if (node.hasAttribute('greaterThan')){
                this.assert = "greaterThan";
            }
            else if (node.hasAttribute('lessThan')){
                this.assert = "lessThan";
            }
            else if (node.hasAttribute('greaterThanOrEquals')){
                this.assert = "greaterThanOrEquals";
            }
            else if (node.hasAttribute('lessThanOrEquals')){
                this.assert = "lessThanOrEquals";
            }

            var rawValue = node.attributes.getNamedItem( this.assert ).nodeValue;
            var type = node.attributes.getNamedItem("type").nodeValue;
            switch ( type ){
                case "float":
                    this.compareTo = parseFloat( rawValue );
                    break;
                case "int":
                    this.compareTo = parseInt( rawValue );
                    break;
                case "bool":
                    this.compareTo = rawValue === "true";
                    break;
                default:
                    this.compareTo = String( rawValue );
                    break;
            }

            var str = "";
            for( var i = 0; i<node.childNodes.length; i++){
                str += node.childNodes[i].data;
            }
            this.test = str;

            return this;
        },

        execute: function(){
            console.log( this.name );
            try {
                if ( this.async ){
                    lola.evaluate( this.test );
                    return false;
                }
                else {
                    this.result = eval( this.test );
                    this.compare();
                    return true;
                }
            }
            catch( e ){
                this.passed = false;
                this.error = 'failed due to error: '+e.message;
                console.error( '    ', this.error );
                console.log ( '    ', e );
                return true;
            }
        },

        setResult: function( val ){
            this.result = val;
            this.compare();
            lola.test.next();
        },

        compare:function(){
            switch (this.assert){
                case "equals":
                    this.passed = this.result == this.compareTo;
                    if (!this.passed)
                        this.error = "assertion false: "+this.result+" == "+this.compareTo;
                    break;
                case "strictlyEquals":
                    this.passed = this.result === this.compareTo;
                    if (!this.passed)
                        this.error = "assertion false: "+this.result+" === "+this.compareTo;
                    break;
                case "doesNotEqual":
                    this.passed = this.result != this.compareTo;
                    if (!this.passed)
                        this.error = "assertion false: "+this.result+" != "+this.compareTo;
                    break;
                case "greaterThan":
                    this.passed = this.result > this.compareTo;
                    if (!this.passed)
                        this.error = "assertion false: "+this.result+" > "+this.compareTo;
                    break;
                case "lessThan":
                    this.passed = this.result < this.compareTo;
                    if (!this.passed)
                        this.error = "assertion false: "+this.result+" < "+this.compareTo;
                    break;
                case "greaterThanOrEquals":
                    this.passed = this.result >= this.compareTo;
                    if (!this.passed)
                        this.error = "assertion false: "+this.result+" >= "+this.compareTo;
                    break;
                case "lessThanOrEquals":
                    this.passed = this.result <= this.compareTo;
                    if (!this.passed)
                        this.error = "assertion false: "+this.result+" <= "+this.compareTo;
                    break;
                default:
                    this.passed = this.result == this.compareTo;
                    if (!this.passed)
                        this.error = "assertion false: "+this.result+" == "+this.compareTo;
                    break;
            }

            if (this.passed) {
                //console.log( '    ','passed');
            }
            else {
                this.error = 'failed, '+this.error;
                console.error( '    ', this.error );
            }
        }
    };


    //register module
    lola.registerModule( test );

})( lola );

/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Tween
 *  Description: Tween module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Tween Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var tween = {

        //==================================================================
        // Attributes
		//==================================================================
        /**
         * map of active tween targets
         * @private
         */
        targets: {},

        /**
         * tween uid generato
         * @private
         */
        tweenUid: 0,

        /**
         * tween uid generato
         * @private
         */
        freeTweenIds: [],

        /**
         * map of tweens
         * @private
         */
        tweens: {},

        /**
         * map of tween types
         * @private
         */
        hooks: {},

        /**
         * indicates whether module is ticking
         */
        active: false,

        getFrameType: 0,
        //==================================================================
		// Methods
		//==================================================================
        /**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug('lola.tween::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

            //get optimized animation timer function
            if ( window.requestAnimationFrame )
                lola.tween.getFrameType = 1;
            if ( window.mozRequestAnimationFrame )
                lola.tween.getFrameType = 2;
            else if ( window.webkitRequestAnimationFrame )
                lola.tween.getFrameType = 3;
            else if ( window.oRequestAnimationFrame )
                lola.tween.getFrameType = 4;


			//do module preinitialization
            //NOTE: This doesn't work in all browsers
            /*if ( window.requestAnimationFrame ) {
                lola.tween.requestTick = function(){ lola.window.requestAnimationFrame( lola.tween.tick ); };
                lola.tween.requestFrame = function( callback ){ lola.window.requestAnimationFrame( callback ); };
            }
            else if ( window.mozRequestAnimationFrame ){
                lola.tween.requestTick = function(){ lola.window.mozRequestAnimationFrame( lola.tween.tick ); };
                lola.tween.requestFrame = function( callback ){ lola.window.mozRequestAnimationFrame( callback ); };
            }
            else if ( window.webkitRequestAnimationFrame ){
                lola.tween.requestTick = function(){ lola.window.webkitRequestAnimationFrame( lola.tween.tick ); };
                lola.tween.requestFrame = function( callback ){ lola.window.webkitRequestAnimationFrame( callback ); };
            }
            else if ( window.oRequestAnimationFrame ){
                lola.tween.requestTick = function(){ lola.window.oRequestAnimationFrame( lola.tween.tick ); };
                lola.tween.requestFrame = function( callback ){ lola.window.oRequestAnimationFrame( callback ); };
            }*/

			//remove initialization method
			delete lola.tween.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.tween::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization



			//remove initialization method
			delete lola.tween.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "tween";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['css','event','easing'];
		},

        /**
         * start ticking
         * @private
         */
        startTicking: function(){
            if (!lola.tween.active){
                lola.tween.active = true;
                lola.tween.requestTick();
            }
        },

        /**
         * set callback for animation frame
         * @private
         */
        requestTick: function(){
            lola.tween.requestFrame( lola.tween.tick );
        },

        /**
         * set callback for animation frame
         * @param {Function} callback
         */
        requestFrame: function(callback){
            switch ( lola.tween.getFrameType ) {
                case 1:
                    lola.window.requestAnimationFrame( callback );
                    break;
                case 2:
                    lola.window.mozRequestAnimationFrame( callback );
                    break;
                case 3:
                    lola.window.webkitRequestAnimationFrame( callback );
                    break;
                case 4:
                    lola.window.oRequestAnimationFrame( callback );
                    break;
                default:
                    setTimeout( callback, 20 );
                    break;
            }
        },

        /**
         * registers a tween with the framework
         * @param {lola.tween.Tween} tween
         * @return {uint} tween identifier
         */
        registerTween: function( tween ){
            var tid = this.freeTweenIds.length > 0 ? this.freeTweenIds.pop() : this.tweenUid++;
            this.tweens[tid] = tween;
            return tid;
        },

        /**
         * starts the referenced tween
         * @param {uint} id
         */
        start: function( id ){
            if (this.tweens[ id ]){
                this.tweens[id].start();
                lola.event.trigger(this.tweens[id],'tweenstart',false,false);
            }
        },

        /**
         * stops the referenced tween
         * @param {uint} id
         */
        stop: function( id ){
            if (this.tweens[ id ]){
                this.tweens[id].stop();
                lola.event.trigger(this.tweens[id],'tweenstop',false,false);
            }

        },

        /**
         * pauses the referenced tween
         * @param {uint} id
         */
        pause: function( id ){
            if (this.tweens[ id ]){
                this.tweens[id].pause();
                lola.event.trigger(this.tweens[id],'tweenpause',false,false);
            }
        },

        /**
         * resumes the referenced tween
         * @param {uint} id
         */
        resume: function( id ){
            if (this.tweens[ id ]){
                this.tweens[id].resume();
                lola.event.trigger(this.tweens[id],'tweenresume',false,false);
            }
        },

        /**
         * adds targets to referenced tween
         * @param {uint} tweenId
         * @param {Object|Array} objects
         * @param {Object} properties
         * @param {Boolean} collisions
         */
        addTarget: function( tweenId, objects, properties, collisions ){
            if (this.tweens[ tweenId ]){
                collisions = collisions === true;
                if (lola.type.get(objects) != 'array')
                    objects = [objects];

                var ol = objects.length;
                for (var i=0; i<ol; i++) {
                    var obj = objects[i];
                    var id = $(obj).identify().attr('id');
                    if (!this.targets[id])
                        this.targets[id] = {};
                    for (var p in properties){
                        if (p == "style"){
                            for (var s in properties[p] ){
                                if (collisions || this.targets[id]['style:'+s] == null ){
                                    if (!properties[p][s].from && !obj.style[s]){
                                        //try to get "from" value
                                        var f = lola.css.style( obj, s );
                                        if (typeof properties[p][s] == "object" ){
                                            properties[p][s].from = f;
                                        }
                                        else {
                                            var t = String(properties[p][s]);
                                            properties[p][s] = {from:f,to:t};
                                        }
                                    }
                                    if (!this.targets[id]['style:'+s])
                                        this.targets[id]['style:'+s] = [];
                                    if (collisions)
                                        this.targets[id]['style:'+s].push( this.getTweenObject( tweenId, obj.style, s, properties[p][s] ));
                                    else
                                        this.targets[id]['style:'+s] = [this.getTweenObject( tweenId, obj.style, s, properties[p][s] )];

                                }
                            }
                        }
                        else {

                            if (!this.targets[id][p])
                                this.targets[id][p] = [];
                            if (collisions)
                                this.targets[id][p].push( this.getTweenObject( tweenId, obj, p, properties[p] ));
                            else
                                this.targets[id][p] = [this.getTweenObject( tweenId, obj, p, properties[p] )];

                        }

                    }
                }
            }
            else{
                throw new Error("tween not found");
            }
        },

        /**
         * gets a TweenObject for specified target and property
         * @param {uint} tweenId
         * @param {Object} target
         * @param {String} property
         * @param {*} value
         * @private
         */
        getTweenObject: function( tweenId, target, property, value ){
            //console.log("getTweenObject", tweenId, target, property, value );
            //get initial value
            var from,to,delta;
            if ( value.from ) {
                from = value.from;
            }
            else if (typeof value == "function"){
                from = value.call( target );
            }
            else{
                from = target[ property ];
            }
            //console.log('from', from);
            //we can only tween if there's a from value
            var deltaMethod = 0;
            if (from != null && from != undefined) {
                //get to value
                if (lola.type.isPrimitive( value )) {
                    to = value;
                }
                else if (value.to) {
                    deltaMethod = 0;
                    to = value.to;
                }
                else if (value.add) {
                    deltaMethod = 1;
                    to = value.add;
                }
                else if (value.by) {
                    deltaMethod = 1;
                    to = value.by;
                }
            }
            else{
                throw new Error('invalid tween parameters')
            }
            //console.log('to', to);

            //break down from and to values to tweenable values
            //and determine how to tween values
            var type, proxy;
            if ( lola.tween.hooks[ property ] ) {
                type = lola.tween.hooks[ property ];
            }
            else {
                for ( var i in lola.tween.types ) {
                    type = lola.tween.types[i];
                    if ( type.match.test( String( to ) ) && type.match.test( String( from ) ) ) {
                        break;
                    }
                    else {
                        type = null;
                    }
                }
            }

            if ( type ) {
                // test parsed objects to see if they can be tweened
                to = type.parse( to );
                from = type.parse( from );
                delta = type.getDelta( to, from, deltaMethod );
                proxy = type.proxy;
                if ( !type.canTween( from, to ) ) {
                    type = null;
                }
            }
            if (!type) {
                proxy = lola.tween.setAfterProxy;
                delta = to;
            }
            //console.log('type', type);


            return new tween.TweenObject( tweenId, target, property, from, delta, proxy );
        },

        /**
         * executes a frame tick for tweening engine
         * @private
         */
        tick: function(){
           //iterate through tweens and check for active state
            //if active, run position calculation on tweens
            var activityCheck = false;
            var now = lola.now();
            //console.log('tick: '+now);
            var twn = lola.tween.tweens;

            for (var k in twn){
                if (twn[k].active){
                    activityCheck = true;
                    if ( !twn[k].complete )
                        twn[k].calculate( now );
                    else{
                        //catch complete on next tick
                        lola.event.trigger(twn[k],'tweencomplete',false,false);
                        delete twn[k];
                        lola.tween.freeTweenIds.push( parseInt(k) );
                    }
                }
            }

            //apply tween position to targets
            var trg = lola.tween.targets;
            for (var t in trg){
                //console.log(t);
                var c1 = 0;
                for ( var p in trg[t] ){
                    //console.log("    ",p);
                    var tmp = [];
                    var to;
                    while (to = trg[t][p].shift()){
                        //console.log("        ",to);
                        //console.log("        ",twn[to.tweenId])
                        if (to && twn[to.tweenId] && twn[to.tweenId].active){
                            to.apply( twn[to.tweenId].value );
                            tmp.push( to );
                        }
                    }
                    trg[t][p] = tmp;

                    if ( trg[t][p].length == 0){
                        delete trg[t][p];
                    }
                    else{
                        c1++;
                    }
                }
                if (c1 == 0)
                    delete trg[t];

            }

            if (activityCheck){
                lola.tween.requestTick();
            }
            else {
                lola.tween.active = false;
            }

        },
        /**
         * sets a property after tween is complete,
         * used for non-tweenable properties
         * @private
         * @param target
         * @param property
         * @param from
         * @param delta
         * @param progress
         */
        setAfterProxy: function( target, property, from, delta, progress ) {
            if ( progress >= 1  )
                target[property] = delta;
        },



        //==================================================================
        // Tween Types
        //==================================================================
        types: {
            simple: {
                match: lola.regex.isNumber,
                parse: function(val){
                    return parseFloat( val );
                },
                canTween: function(a,b){
                    return (a && b);
                },
                getDelta: function( to, from, method) {
                    if( method ){
                       return to;
                    }
                    else{
                        return to - from;
                    }
                },
                proxy: null
            },

            dimensional: {
                match: lola.regex.isDimension,
                parse: function(val){
                    var parts = String( val ).match( lola.regex.isDimension );
                    return { value: parseFloat( parts[1] ), units: parts[2] };
                },
                canTween: function(a,b){
                    return ((a && b) && ((a.units == b.units)||(a.units == "" && b.units != "")));
                },
                getDelta: function( to, from, method) {
                    if( method ){
                        return {value:to.value, units:to.units};
                    }
                    else{
                        return {value:to.value - from.value, units:to.units};
                    }
                },
                proxy: function( target, property, from, delta, progress ) {
                    target[property] = (from.value + delta.value * progress) + delta.units;
                }
            },

            color: {
                match: lola.regex.isColor,
                parse: function(val){
                    //console.log ('color.parse: ',val);
                    var color = new lola.css.Color( val );
                    //console.log( '    ', color.rgbValue );
                    return color.rgbValue;
                },
                canTween: function( a, b ) {
                   //console.log ('color.canTween: ',( a && b ));
                   return ( a && b );
                },
                getDelta: function( to, from, method ) {
                    if( method ){
                        //console.log ('color.getDelta '+method+': ', { r:to.r, g:to.g, b:to.b, a:to.a });
                        return { r:to.r, g:to.g, b:to.b, a:to.a };
                    }
                    else{
                        //console.log ('color.getDelta '+method+': ', { r:to.r-from.r, g:to.g-from.g, b:to.b-from.b, a:to.a-from.a });
                        return { r:to.r-from.r, g:to.g-from.g, b:to.b-from.b, a:to.a-from.a };
                    }
                },

                proxy: function( target, property, from, delta, progress ) {
                    var r = ((from.r + delta.r * progress) * 255) | 0;
                    var g = ((from.g + delta.g * progress) * 255) | 0;
                    var b = ((from.b + delta.b * progress) * 255) | 0;
                    var a = (from.a + delta.a * progress);
                    //console.log ('color.proxy: ',from, delta, progress, r, g, b, a);

                    if ( lola.support.colorAlpha )
                        target[property] = "rgba(" + [r,g,b,a].join( ',' ) + ")";
                    else
                        target[property] = "rgb(" + [r,g,b].join( ',' ) + ")";
                }
            }

        },

        //==================================================================
        // Classes
        //==================================================================
        Tween: function( duration, easing, delay ) {
            this.init( duration, easing, delay );
            return this;
        },

        TweenObject: function( tweenId, target, property, initialValue, deltaValue, proxy ){
            this.init( tweenId, target, property, initialValue, deltaValue, proxy );
            return this;
        },



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
                tweenStyle: function( properties, duration, delay, easing, collisions ){
                    var targets = [];
                    this.forEach( function(item){
                        targets.push( item.style );
                    });
                    var tweenId = lola.tween.registerTween( new tween.Tween( duration, easing, delay ) );
                    lola.tween.addTarget( tweenId, targets, properties, collisions );
                    lola.tween.start(tweenId);
                },

                tween: function( properties, duration, delay, easing, collisions ){
                    var targets = [];
                    this.forEach( function(item){
                        targets.push( item );
                    });
                    var tweenId = lola.tween.registerTween( new tween.Tween( duration, easing, delay ) );
                    lola.tween.addTarget( tweenId, targets, properties, collisions );
                    lola.tween.start(tweenId);
                }
			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================
    tween.Tween.prototype = {
        startTime: -1,
        pauseTime: -1,
        lastCalc: 0,
        duration: 1000,
        delay: 0,
        value: 0,
        easing: null,
        active: false,
        complete: false,

        init: function( duration, easing, delay ) {
            this.duration = duration;
            this.easing = easing;
            this.delay = delay;
            if (!easing){
                this.easing = {exec:function(t,v,c,d){ return (t/d)*c + v;} };
            }
        },

        calculate: function( now ){
            var elapsed = now - this.startTime - this.delay;
            if (elapsed >= this.duration){
                elapsed = this.duration;
                this.complete = true;
                this.active = true;
            }
            this.value = elapsed ? this.easing.exec( elapsed, 0, 1, this.duration ) : 0;
        },

        start: function(){
            //console.log('Tween.start');
            this.active = true;
            this.startTime = lola.now();
            lola.tween.startTicking();
        },
        stop: function(){
            this.active = false;
            this.complete = true;
        },
        pause: function(){
            this.active = false;
            this.pauseTime = lola.now();
        },
        resume: function(){
            this.active = false;
            this.startTime += lola.now() - this.pauseTime;
            lola.tween.startTicking();
        }


    };

    tween.TweenObject.prototype = {
        target: null,
        property: null,
        tweenId: -1,
        initialValue: null,
        deltaValue: null,
        proxy: null,
        units: "",
        init: function( tweenId, target, property, initialValue, deltaValue, proxy ){
            this.target = target;
            this.property = property;
            this.tweenId = tweenId;
            this.initialValue = initialValue;
            this.deltaValue = deltaValue;
            this.proxy = proxy;
        },

        apply: function( value ){
            //console.log('apply: '+value);
            if (this.proxy){
                this.proxy( this.target, this.property, this.initialValue, this.deltaValue, value );
            }
            else {
                this.target[ this.property ] = this.initialValue + this.deltaValue * value;
            }
        }
    };





	//register module
	lola.registerModule( tween );

})( lola );

