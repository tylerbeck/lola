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
    window['lola'] = function( selector, context ){

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * @private
		 * @type {int}
		 */
		this.window = window;

		/**
		 * @private
		 * @type {int}
		 */
		var guid = 0;

		/**
		 * @private
		 * @type {Boolean}
		 */
		var initialized = false;

		/**
		 * @private
		 * @type {Array}
		 */
		var initializers = [];

		/**
		 * @private
		 * @type {Object}
		 */
		var dependencies = {};

		/**
		 * @private
		 * @type {Array}
		 */
		var safeDeleteHooks = [];

		/**
		 * @public
		 * @type {lola.URL}
		 */
		this.url = {};

		/**
		 * @private
		 * @type {Boolean}
		 */
		var debugMode = false;

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * framework initialization function
		 * @param wnd {Object} reference to window
		 */
		this.initialize = function( wnd ) {
			if (!this.initialized) {
                this.debug('lola::initialize');
                this.initialized  = true;
                window = wnd;

				var i;

				//remove auto initialization listeners
				if ( document.addEventListener ) {
					document.removeEventListener( "DOMContentLoaded", initialize, false );
				}
				else if ( document.attachEvent ) {
					document.detachEvent( "onreadystatechange", initialize );
				}

				//check dependencies
                checkDependencies(dependencies);

				//execute initialization stack
				var stackSize = initializers.length;

				for ( i = 0; i < stackSize; i++ ) {
					if (this.hasFn(initializers,i)){
                        initializers[i]();
						delete initializers[i];
					}
				}
			}
		};

        /**
         * checks a dependency map for modules
         * @param {Object} map
         */
        function checkDependencies( map ){
            var fails = [];
            for ( var k in map ) {
                var missing = checkModules( map[k] );
                if ( missing.length > 0 )
                    fails.push(k+': '+missing.join(', '));
            }
            if ( fails.length > 0 ) {
                throw new Error( "module dependency checks failed for: \n\t" + fails.join( "\n\t" ) );
            }
        }

        /**
         * checks if modules are registered and returns missing modules
         * @param {Array} modules
         * @return {Array} missing modules
         */
        function checkModules( modules ){
            var missing = [];

            Object.forEach(modules, function(item){
                if (!lola.hasPackage( lola, item ))
                    missing.push(item);
            });

            return missing;
        }

		/**
		 * creates/gets and returns the object lineage defined in chain param
		 * @public
		 * @param {!Object} base object on which to build chain
		 * @param {!String} chain "." seperated namespace / package
		 * @return {Object}
		 */
		this.getPackage = function( base, chain ) {
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
		};

        /**
         * checks the existence of the object lineage defined in chain param
         * @public
         * @param {!Object} base object on which to build chain
         * @param {!String} chain "." seperated namespace / package
         * @return {Boolean}
         */
        this.hasPackage = function( base, chain ) {
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
        };

		/**
		 * extends the target with properties from the source
		 * @public
		 * @param target {Object}
		 * @param source {Object}
		 * @param overwrite {Boolean|undefined}
		 * @param errors {Boolean|undefined}
		 * @return {void}
		 */
		this.extend = function( target, source, overwrite, errors ) {
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
		this.evaluate = function( expression, node ) {
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
		};

		/**
		 * loads a script from a url src
		 * @param {String} src the uri of the script to load
		 * @param {Function|undefined} callback the function to call after the script has loaded
		 */
		this.loadScript = function( src, callback ) {
			var	node = document.getElementsByTagName( 'head' )[0];
			if ( !node )
				node = document.documentElement;

			var script = document.createElement( 'script' );

            if (typeof callback == "function")
                this.event.addListener(script, 'load', function(){callback.apply()} );

            script.src = src;
			node.insertBefore( script, node.firstChild );
		};



		/**
		 * registers a module with the Lola Framework
		 * @public
		 * @param {lola.Module} module
		 * @return {void}
		 */
		this.registerModule = function( Module ) {
            var module = new Module();
            var ns = module.getNamespace();
            this.debug('lola::registerModule - ' + ns );

			//add module dependencies
            if (this.hasFn( module, "getDependencies" ))
                dependencies[ns] =  module.getDependencies();

			//add module to namespace
            this.getPackage( this, ns ) = module;
			this.extend( this.getPackage( this, ns ), module, false, false );

			//add selector methods
            if (this.hasFn( module, "getSelectorMethods" )){
                this.extend( this.Selector.prototype, module.getSelectorMethods(), false, false );
                delete module['getSelectorMethods'];
            }

			//add initializer
			if ( this.hasFn( module, "initialize" ) ) {
				this.addInitializer( function() {
					module.initialize();
				} );
			}

			//run preinitialization method if available
            if ( this.hasFn( module, "preinitialize" ) ) {
				module.preinitialize();
			}
		};

		/**
		 * delete a property on an object and removes framework references
		 * @public
		 * @param {Object} object object on which to delete property
		 * @param {String} property property to delete
		 * @return {void}
		 */
		this.safeDelete = function( object, property ) {
			var obj = (property) ? object[ property ] : object;
			for ( var i = safeDeleteHooks.length - 1; i >= 0; i-- ) {
                if (obj){
                    var hook = this.safeDeleteHooks[i];
                    hook.fn.call( hook.scope, obj );
                }
			}

			if ( object && property ){
                //object[ property ] = null;
                delete object[ property ];
            }

		};

		/**
		 * Object prototype's to string method
		 * @param {Object} object
		 * @return {String}
		 */
		this.toString = Object.prototype.toString;


        /**
         * returns true if object has a function with the given name
         * @param {Object} obj
         * @param {String} fnName
         * @return {Boolean}
         */
        this.hasFn = function( obj, fnName ){
            return ( obj && obj[ fnName ] && typeof obj[ fnName ] == "function");
        };

        /**
         * adds function to initialization stack
         * @param {Function} fn
         */
        this.addInitializer = function( fn ){
            initializers.push( fn );
        };

        /**
         * outputs debug statement
         */
        this.debug = function(/*args*/){
			if (debugMode) {
				console.log("["+this.now()+"]", arguments.join(' '));
			}
		};

        /**
         * get current time in milliseconds
         * @return {uint}
         */
        this.now = function(){
            return (new Date()).getTime();
        };

        /**
         * used in selector methods to determine whether to return an array
         * or an object
         * @param v
         * @return {*}
         * @private
         */
		this.__ = function( v ){
			return (v.length == 1) ? v[0] : v;
		};

		//==================================================================
		// Prototype Upgrades
		//==================================================================
		/**
		 * upgrades object prototype
		 */
        this.upgradeObjectPrototype = function() {

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
		};

		//==================================================================
		// Classes
		//==================================================================
		/**
		 * Selector class
		 * @param {String} selector selector string
		 * @param {Object|undefined} context for selection
		 * @constructor
		 */
		this.Selector = function( selector, context ) {
			return this.initialize( selector, context );
		};

		/**
		 * Lola Module Interface
		 * @interface
		 */
		this.Module = function() {
            return this;
		};

        /**
         * URL Class
         * @class
         * @param str
         */
        this.URL = function( str ){
            return this.init( str );
        };

        return new this.Selector( selector, context );

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
	//var main = function( selector, context ) {
	//	return new lola.Selector( selector, context );
	//};

    window['$'] = lola;
    window['lola'] = lola;

	lola.upgradeObjectPrototype();
	delete lola.upgradeObjectPrototype;


	//lola.extend( main, lola, true );
	//lola = main;

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


