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
					if (lola.hasFn(lola.initializers,i)){
						lola.initializers[i]();
						delete lola.initializers[i];
					}
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
            if (lola.hasFn( module, "getDependencies" ))
			    lola.dependencies[ns] =  module.getDependencies();

			//add module to namespace
			lola.extend( lola.getPackage( lola, ns ), module, false, false );

			//add selector methods
            if (lola.hasFn( module, "getSelectorMethods" )){
                lola.extend( lola.Selector.prototype, module.getSelectorMethods(), false, false );
                delete module['getSelectorMethods'];
            }

			//add initializer
			if ( lola.hasFn( module, "initialize" ) ) {
				lola.addInitializer( function() {
					module.initialize();
				} );
			}

			//run preinitialization method if available
            if ( lola.hasFn( module, "preinitialize" ) ) {
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
         * returns true if object has a function with the given name
         * @param {Object} obj
         * @param {String} fnName
         * @return {Boolean}
         */
        hasFn: function( obj, fnName ){
            return ( obj && obj[ fnName ] && typeof obj[ fnName ] == "function");
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


