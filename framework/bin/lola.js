/***********************************************************************
 * Lola JavaScript Framework
 *
 *  Description: Base Construct Head
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
"use strict";
( function( window ) {
    var startTime = (new Date()).getTime();

    if (window.console == undefined ){
        var console = {};
        console.log = function(){};
	    window.console = console;
    }

    /**
     * @namespace lola
     * @description: Lola Framework core is used to load modules and for top-level framework attributes and methods
     * @param {String} selector selector string
     * @param {Object|undefined} context for selection
     * @return {lola.Selector}
     */
    var lola = function( selector, context ){
        return new lola.Selector( selector, context );
    };

    /**
     * window reference
     */
    lola.window = window;

    /**
     * initialization status
     */
    var initialized = false;
    lola.isInitialized = function(){
        return initialized;
    };

    /**
     * extends the target with properties from the source
     * @public
     * @param target {Object}
     * @param source {Object}
     * @param overwrite {Boolean|undefined}
     * @param errors {Boolean|undefined}
     * @param deep {Boolean|undefined}
     * @param ignore {Array|undefined}
     * @return {void}
     */
    lola.extend = function( target, source, overwrite, errors, deep, ignore ) {
        //TODO: make deep copy an option
        if ( overwrite == undefined ) overwrite = false;
        if ( errors == undefined ) errors = false;
        if ( deep == undefined ) deep = false;
        if ( ignore == undefined ) ignore = [];
        for ( var k in source ) {
            if (ignore.indexOf(k) == -1){
                if ( overwrite || target[ k ] == null )
                    target[ k ] = source[ k ];
                else if ( errors )
                    throw new Error( "property " + k + " already exists on extend target!" );
            }
        }
    };

    /**
     * creates/gets and returns the object lineage defined in chain param
     * @public
     * @param {!Object} base object on which to build chain
     * @param {!String} chain "." seperated namespace / package
     * @param {!Object} obj object to set in lineage
     * @return {Object}
     */
    lola.getPackage = function( base, chain, obj ) {
        //lola.syslog('lola::getPackage');
        var result = base;
        if ( typeof chain === 'string' ) {
            var parts = chain.split( '.' );
            var part;
            while ( part = parts.shift() ) {
                if ( result[part] == null  )
                    result[part] = {};
                if ( parts.length == 0 && obj )
                    result[part] = obj;
                result = result[part];
            }
        }
        return result;
    };

    /**
     * registers a module with the Lola Framework
     * @public
     * @param {Object} module
     * @param {Boolean} extend
     * @return {void}
     */
    lola.registerModule = function( module, extend ) {
        extend = extend == undefined ? false : extend;
        var namespace = module.namespace();

        //add module to namespace
        if (extend)
            lola.extend( lola.getPackage( lola, namespace ), module, false, false );
        else {
            lola.getPackage( lola, namespace, module );
        }


        //add module dependencies
        if (this.hasFn( module, "dependencies" )){
            lola.addDependencies( namespace, module.dependencies() );
        }

        //add selector methods
        if ( module.selectorMethods ){
            lola.extend( lola.Selector.prototype, module.selectorMethods, false, false );
            delete module.selectorMethods;
        }

        //add initializer
        if ( lola.hasFn( module, "initialize" ) ) {
            lola.addInitializer( module.initialize );
        }

        lola.syslog('module registered:', namespace );

    };

    /**
     * framework initialization method (self deleting)
     */
    lola.initialize = function(){
        //remove auto initialization listeners
        if ( document.addEventListener ) {
            document.removeEventListener( "DOMContentLoaded", lola.initialize, false );
            lola.window.removeEventListener( "load", lola.initialize, false );
        }
        else if ( document.attachEvent ) {
            document.detachEvent( "onreadystatechange", lola.initialize );
            lola.window.detachEvent( "onload", lola.initialize );
        }

        //check dependencies
        lola.checkDependencies();

        //execute initialization stack
        lola.executeInitializers();

        initialized = true;

        var elapsedTime = (new Date()).getTime() - startTime;
        delete lola['initialize'];
        lola.syslog('initialization completed in', elapsedTime, 'ms');
    };

    window['lola'] = lola;
    window['$'] = lola;

})(window);
/***********************************************************************
 * Lola JavaScript Framework
 *
 *  Description: Prototype upgrades
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
// keys JS 1.6 ---------------------------------------------
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
// forEach JS 1.6 ------------------------------------------
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
    Array.prototype.reduce = function reduce(accumulator){
        var i, l = this.length, curr;

        if(typeof accumulator !== "function") // ES5 : "If IsCallable(callbackfn) is false, throw a TypeError exception."
            throw new TypeError("First argument is not callable");

        if((l == 0 || l === null) && (arguments.length <= 1))// == on purpose to test 0 and false.
            throw new TypeError("Array length is 0 and no second argument");

        if(arguments.length <= 1){
            curr = this[0]; // Increase i to start searching the secondly defined element in the array
            i = 1; // start accumulating at the second element
        }
        else{
            curr = arguments[1];
        }

        for(i = i || 0 ; i < l ; ++i){
            if(i in this)
                curr = accumulator.call(undefined, curr, this[i], i, this);
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

// ? -------------------------------------------------------
if ( !String.prototype.trim ) {
    String.prototype.trim = function () {
        return String( this ).replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' );
    };
}


/***********************************************************************
 * Lola JavaScript Framework
 *
 *  Description: Selector Constructor
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function(lola){
    /**
     * Selector class
     * @class
     * @param {*} selector
     * @param {Node|Element|Object} context
     */
    lola.Selector = function( selector, context ){
        var i = 0;
        if ( Array.isArray( selector ) ) {
            var sl = selector.length;
            for (i=0; i<sl; i++){
                this[i] = sl[i];
            }
        }
        else if ( typeof selector === 'object' ){
            this[i] = selector;
            i++;
        }
        else if ( typeof selector === "string" ){
            if (window['Sizzle']) {
                var siz = Sizzle( selector, context );
                for (i=0; i<sl; i++){
                    this[i] = siz[i];
                }
            }
            else {
                try {
                    if (!context)
                        context = document;
                    //TODO Optimize: this can be made faster in most browsers
                    var nodeList =  context.querySelectorAll( selector );
                    var nl = nodeList.length;
                    for (i=0; i<nl; i++){
                        this[i] = nodeList.item(i);
                    }
                    this.length = i;
                }
                catch (e){
                    console.warn('Exception:', selector );
                }
            }
        }
        else if (typeof selector == "function") {
           lola.addInitializer( selector );
        }
	    else if (selector == undefined && context == undefined ){
	        this[0] = lola;
	        i++;
        }
        this.length = i;

        return this;
    };
    lola.Selector.prototype = {};
    lola.Selector.prototype.forEach = Array.prototype.forEach;
    //lola.Selector.prototype.concat = Array.prototype.concat;
    lola.Selector.prototype.every = Array.prototype.every;
    lola.Selector.prototype.filter = Array.prototype.filter;
    lola.Selector.prototype.indexOf = Array.prototype.indexOf;
    lola.Selector.prototype.join = Array.prototype.join;
    lola.Selector.prototype.lastIndexOf = Array.prototype.lastIndexOf;
    lola.Selector.prototype.map = Array.prototype.map;
    lola.Selector.prototype.push = Array.prototype.push;
    lola.Selector.prototype.pop = Array.prototype.pop;
    lola.Selector.prototype.shift = Array.prototype.shift;
    lola.Selector.prototype.unshift = Array.prototype.unshift;
    lola.Selector.prototype.slice = Array.prototype.slice;
    lola.Selector.prototype.splice = Array.prototype.splice;
    lola.Selector.prototype.reverse = Array.prototype.reverse;
})(lola);

/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Core
 *  Description: Core module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
( function( lola ) {

    /**
     * @namespace lola
     */
	var Module = function(){
	    var $ = lola;
	    var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "";

        /**
         * module dependencies
         * @type {Object}
         * @private
         */
        var dependencies = {};

        /**
         * global unique identifier
         * @private
         */
        var guid = 0;

        /**
         * @private
         * @type {Array}
         */
        var initializers = [];

        /**
         * @private
         * @type {Array}
         */
        var safeDeleteHooks = [];

	    self.DEBUG_NONE = 0;
	    self.DEBUG_ERROR = 1;
	    self.DEBUG_WARN = 2;
	    self.DEBUG_INFO = 3;
	    self.DEBUG_DEBUG = 4;
	    self.DEBUG_ALL = 5;

	    /**
         * @private
         * @type {int}
         */
        var debugLevel = self.DEBUG_NONE;


	    /**
         * @private
         * @type {lola.URL}
         */
        var url;


        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };

        /**
         * gets url Object
         * @return {lola.URL}
         */
        this.url = function(){
            return url;
        };

        /**
         * sets url Object
         * @param {String} str
         */
        this.setURL = function( str ){
            url = new self.URL( str );
	        if ( url.vars['debug'] != undefined ){
		        var debug = url.vars['debug'];
		        switch( debug.toLowerCase() ){
			        case "all":
				        debugLevel = self.DEBUG_ALL;
				        break;
			        case "true":
			        case "debug":
				        debugLevel = self.DEBUG_DEBUG;
				        break;
			        case "info":
				        debugLevel = self.DEBUG_INFO;
				        break;
			        case "warn":
				        debugLevel = self.DEBUG_WARN;
				        break;
			        case "error":
				        debugLevel = self.DEBUG_ERROR;
				        break;
			        case "none":
				        debugLevel = self.DEBUG_NONE;
				        break;
			        default:
				        debugLevel = parseInt( url.vars['debug'] );
				        break;
		        }
	        }
        };

        /**
         * gets debug level
         * @return {int}
         */
        this.debugLevel = function(){
            return debugLevel;
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * gets next guid
         * @return {uint}
         */
        this.getGUID = function(){
            return guid++;
        };

        /**
         * adds function to initialization stack
         * @param {Function} fn
         */
        this.addInitializer = function( fn ){
            if ($.isInitialized())
                fn( $ );
            else {
                initializers.push( fn );
            }
        };

        /**
         * adds function to safedelete stack
         * @param {Function} fn
         */
        this.addSafeDeleteHook = function( fn, scope ){
            safeDeleteHooks.push( {fn:fn, scope:scope} );
        };

        /**
         * adds function to safedelete stack
         * @param {String} namespace
         * @param {Array} dependsOn
         */
        this.addDependencies = function( namespace, dependsOn ){
            dependencies[namespace] = dependsOn;
        };

        /**
         * delete a property on an object and removes framework references
         * @param {Object} object object on which to delete property
         * @param {String|undefined} property property to delete
         * @return {void}
         */
        this.safeDelete = function( object, property ) {
            var obj = (property) ? object[ property ] : object;
            for ( var i = safeDeleteHooks.length - 1; i >= 0; i-- ) {
                if (obj){
                    var hook = safeDeleteHooks[i];
                    hook.fn.call( hook.scope, obj );
                }
            }

            if ( object && property ){
                delete object[ property ];
            }

        };

        /**
         * checks a dependency map for modules
         * @param {Object} map
         */
        this.checkDependencies = function( map ){
            map = map ? map : dependencies;
            var fails = [];
            for ( var k in map ) {
                var missing = hasModules( map[k] );
                if ( missing.length > 0 )
                    fails.push(k+': '+missing.join(', '));
            }
            if ( fails.length > 0 ) {
                throw new Error( "module dependency checks failed for: \n\t" + fails.join( "\n\t" ) );
            }
        };

        //TODO: add lazy loading of unloaded dependent modules

        /**
         * checks if modules are registered and returns missing modules
         * @private
         * @param {Array} modules
         * @return {Array} missing modules
         */
        function hasModules( modules ){
            var missing = [];

            Object.forEach(modules, function(item){
                if (!$.hasPackage( $, item ))
                    missing.push(item);
            });

            return missing;
        }

        /**
         * framework initialization function
         */
        this.executeInitializers = function() {
            $.syslog('core::executeInitializers');
            var i;
            var stackSize = initializers.length;

            for ( i = 0; i < stackSize; i++ ) {
                if ($.hasFn(initializers,i)){
                    initializers[i]( $ );
                    delete initializers[i];
                }
            }
        };

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

            if ( $.support.domEval ) {
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
                $.event.addListener(script, 'load', function(){callback.apply()} );

            script.src = src;
            node.insertBefore( script, node.firstChild );

        };

        /**
         * checks the existence of the object lineage defined in chain param
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
         * returns true if object has a function with the given name
         * @param {Object} obj
         * @param {String} fnName
         * @return {Boolean}
         */
        this.hasFn = function( obj, fnName ){
            return ( obj && obj[ fnName ] && typeof obj[ fnName ] == "function");
        };

	    /**
	     * get error object to expose stack
	     */
	    function getErrorObj(){
		    try{ throw Error("")}catch(err){ return err }
	    }

	    /**
	     * gets error object arguments
	     * @param args
	     * @return {Array}
	     */
	    function logArguments( args ){
		    var err = getErrorObj();
		    //var caller_line = err.stack.split("\n")[4];
		    //var index = caller_line.indexOf("at ");
		    //var clean = caller_line.slice(index+2, caller_line.length);
		    var stack = (err.stack)?err.stack.split("\n" ).slice(3):[];
		    var stackObj = {};
		    var i = stack.length;
		    while (i) {
			    i--;
			    stackObj[i] = stack[i];
		    }
		    var pre = ["["+ $.now()+"][", stackObj,"] " ];
		    var argArray = Array.prototype.slice.call(args);
		    return pre.concat( argArray );
	    }

	    /**
	     * output to log, independent of log-level and debug status
	     */
	    this.log = function(/*args*/){
			console.log.apply(console, logArguments(arguments) );
	    };

	    /**
	     * output to log if log-level is DEBUG_ALL
	     */
	    this.syslog = function(/*args*/){
		    if ( debugLevel >= self.DEBUG_ALL ){
			    console.log.apply(console, logArguments(arguments) );
		    }
	    };

	    /**
	     * output to log if log-level is DEBUG_DEBUG
	     */
	    this.debug = function(/*args*/){
		    if ( debugLevel >= self.DEBUG_DEBUG )
			    console.log.apply(console, logArguments(arguments) );
	    };
	    /**
	     * output to log if log-level is DEBUG_INFO
	     */
	    this.info = function(/*args*/){
		    if ( debugLevel >= self.DEBUG_INFO )
			    console.info.apply(console, logArguments(arguments) );
	    };

	    /**
	     * output to log if log-level is DEBUG_WARN
	     */
	    this.warn = function(/*args*/){
		    if ( debugLevel >= self.DEBUG_WARN ){
			    console.warn.apply(console, logArguments(arguments) );
		    }
	    };

	    /**
	     * output to log if log-level is DEBUG_ERROR
	     */
	    this.error = function(/*args*/){
		    if ( debugLevel >= self.DEBUG_ERROR ){
			    console.error.apply(console, logArguments(arguments) );
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

	    /**
	     * launches fullscreen mode
	     * @param element
	     */
	    this.fullscreen = function(element) {
		    $.debug('fullscreen',element);
		    if(element.requestFullScreen) {
			    element.requestFullScreen();
		    } else if(element.mozRequestFullScreen) {
			    element.mozRequestFullScreen();
		    } else if(element.webkitRequestFullScreen) {
			    element.webkitRequestFullScreen();
		    }
	    };

	    /**
	     * exits fullscreen mode
	     */
	    this.cancelFullscreen = function(){
		    if (document.cancelFullScreen) {
			    document.cancelFullScreen();
		    } else if (document.mozCancelFullScreen) {
			    document.mozCancelFullScreen();
		    } else if (document.webkitCancelFullScreen) {
			    document.webkitCancelFullScreen();
		    }
	    };




	    //==================================================================
        // Selector Methods
        //==================================================================
        this.selectorMethods = {

            /**
             * assigns guid to elements
             * @return {lola.Selector}
             */
            identify: function() {
                this.forEach( function( item ) {
                    if ( !item.id )
                        item.id = "lola-guid-" + $.getGUID()
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
                return this[ index ];
            },

            /**
             * returns selector with element at the specified index
             * @param {int} index
             * @return {lola.Selector}
             */
            at: function( index ) {
                if ( index == undefined )
                    index = 0;
                return $(this[ index ]);
            },

            /**
             * returns all of the selected elements
             * @return {Array}
             */
            getAll: function() {
                return this.slice(0);
            },

            /**
             * returns element count
             * @return {int}
             */
            count: function() {
                return this.length;
            },

            /**
             *concatenates the elements from one or more
             * @param {lola.Selector|Array|Object} obj object to concatenate
             * @param {Boolean|undefined} unique
             * @return {lola.Selector}
             */
            concat: function( obj, unique ) {
                var self = this;

                if ( obj instanceof $.Selector ){
                    obj.forEach( function(item){
                        self.unshift( item );
                    })
                }
                else if (Array.isArray( obj )){
                    obj.forEach( function(item){
                        self.unshift( item );
                    })
                }
                else{
                    self.unshift( obj );
                }

                if (unique == undefined || unique === true){
                    var uni = $.array.unique( this );
                    this.splice(0,this.length);
                    uni.forEach( function(item){
                        self.push( item );
                    })
                }
                return this;
            },

            /**
             * iterates over elements and applys argument 0 and returns values
             * @private
             */
            g: function( /*arguments*/ ){
                return $.__( this.i.apply( this, arguments ) );
            },

            /**
             * iterates over elements and applys argument 0 and returns this
             * @private
             */
            s: function( /*arguments*/ ){
                this.i.apply( this, arguments );
                return this;
            },

            /**
             * iterates over elements and applys argument 0 and returns
             * this if the last argument is undefined, otherwise returns
             * values
             *
             * @private
             */
            _: function( /*arguments*/ ){
                //console.log('_: ', arguments);
                var result = this.i.apply( this, arguments );
                return ( arguments[arguments.length - 1] == undefined ) ? $.__( result ) : this;
            },


            i: function( ){
                //console.log('_iterate: ', arguments);
                var values = [];
                var selector = this;
                var l = arguments.length;
                //console.log(l);
                if (l){
                    var fn = arguments[0];
                    var args = [];
                    for (var i=1; i<l; i++){
                        args.push( arguments[i] );
                    }
                    this.forEach( function( item ){
                        //console.log('args', [ item ].concat(args));
                        values.push( fn.apply( selector, [ item ].concat(args) ) );
                    });

                }
                return values;
            }



        };

        //==================================================================
        // Classes
        //==================================================================
        /**
         * URL Class
         * @class
         * @param {String} url
         */
        this.URL = function( url ){
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

            return this;
        };
        this.URL.prototype = {
            protocol: "",
            domain:"",
            path:"",
            page:"",
            vars:{},
            hash:"",

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



        return this;
    };

    var core = new Module();
    core.setURL( lola.window.location.href );
    lola.registerModule( core, true );

})( lola );/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Support
 *  Description: Support module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	/**
	 * Support Module
	 * @namespace lola.array
	 */
	var Module = function(){
		var $ = lola;
        var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "support";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [];

        //set locally
        this.domEval = false;
        this['style'] = false;
        this.cssFloat = false;
        this.colorAlpha = false;
        this.deleteExpando = true;
        this.msEvent = false;
        this.domEvent = true;
        this.dataset = false;
        this.canvas = false;
        this.animationFrameType = 0;
        this.cssRules = false;


        //==================================================================
        // Getters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };


        //==================================================================
        // Methods
        //==================================================================
        this.initialize = function(){
            $.syslog( 'lola.support::initialize' );
            self.cssRules = ( (document.styleSheets.length > 0 && document.styleSheets[0].cssRules) || document.createStyleSheet == undefined  ) ? true : false;

	        var div = document.createElement( 'div' );
	        div.innerHTML = "<div data-test='yes'></div>";

        };

        //==================================================================
        // Run Checks
        //==================================================================

        //domEval
        var root = document.documentElement;
        var script = document.createElement( 'script' );
        var uid = "scriptCheck" + (new Date).getTime();
        script.type = "text/javascript";
        try {
            script.appendChild( document.createTextNode( 'lola.window.' + uid + '=true;' ) );
        }
        catch( e ){}

        root.insertBefore( script, root.firstChild );
        root.removeChild( script );

        self.domEval = $.window[ uid ];
        try {
            delete $.window[ uid ];
        }
        catch(e){
            $.window[ uid ] = null;
        }

        //create div for testing
        var div = document.createElement( 'div' );
        div.innerHTML = "<div style='color:black;opacity:.25;float:left;background-color:rgba(255,0,0,0.5);display:none;position: absolute;' test='true' data-test='yes' data-test2=\"yes\" >test</div>";
		var target = div.firstChild;

        //style tests
        self['style'] = (typeof target.getAttribute( 'style' ) === 'string');
        self.cssFloat = /^left$/.test( target.style.cssFloat );
        self.colorAlpha = /^rgba.*/.test( target.style.backgroundColor );

		//dataset support
		if ( target.hasOwnProperty && target.hasOwnProperty('dataset') && target.dataset['test'] == 'yes'){
			self.dataset = true;
		}


		//delete expandos
        try {
            delete target.test;
        }
        catch( e ) {
            self.deleteExpando = false;
        }

		//event model
        if ( document.addEventListener )
            self.domEvent = true;
        else if ( document.attachEvent )
            self.msEvent = true;

        //animation frame type
        if ( window.requestAnimationFrame )
            self.animationFrameType = 1;
        else if ( window.mozRequestAnimationFrame )
            self.animationFrameType = 2;
        else if ( window.webkitRequestAnimationFrame )
            self.animationFrameType = 3;
        else if ( window.oRequestAnimationFrame )
            self.animationFrameType = 4;

        //canvas
        var canvas = document.createElement('canvas');
        self.canvas = /canvas/.test( Object.prototype.toString.call(canvas).toLowerCase() );


    };

    //register module
    lola.registerModule( new Module() );

})( lola );

/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Array
 *  Description: Array module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	/**
	 * Array Module
     * @namespace lola.array
	 */
	var Module = function(){
		var $ = lola;
		var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "array";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [];


        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };


        //==================================================================
        // Methods
        //==================================================================

        /**
         * checks an array of objects for a property with value
         * @public
         * @param {Array<Object>} array array to check
         * @param {String} property property to inspect
         * @param value value to match
         * @return {Boolean}
         */
        this.hasObjectWithProperty = function ( array, property, value ) {
            var callback = function( item, index, arr ) {
                return item[property] == value;
            };
            return array.some( callback );
        };

        /**
         * returns a unique copy of the array
         * @public
         * @param array
         * @return {Array}
         */
        this.unique = function ( array ) {
            var tmp = [];
            for (var i = array.length-1; i >= 0; i--){
                if (tmp.indexOf( array[i] ) == -1){
                    tmp.push( array[i] );
                }
            }

            return tmp;
        };

        /**
         * checks if array contains object
         * @public
         * @param {Array} array
         * @return {Boolean}
         */
        this.isIn = function ( array, value ) {
            return array.indexOf( value ) >= 0;
        };

        /**
         * removes null values from array
         * @public
         * @param {Array} array
         * @return {Array}
         */
        this.pruneNulls = function( array ) {
            var tmp = [];
            array.forEach( function(item){
                if ( item != null ){
                    tmp.push( item );
                }
            });
            return tmp;
        };


        /**
         * creates a sort function for property
         * @private
         * @param {String} property
         * @return {Function}
         */
        function getSortFunction( property ){
            return function( a, b ) {
                var x = a[property];
                var y = b[property];
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            };
        }

        /**
         * sort an array on a property
         * @param {Array} array
         * @param {String} property
         */
        this.sortOn = function( property, array ){
            return array.sort( getSortFunction(property) );
        };


        /**
         *
         * @param a
         * @param b
         * @param c
         * @param d
         */
        this.doSomething = function( a, b, c, d ){


        };



        //==================================================================
        // Selector Methods
        //==================================================================
        this.selectorMethods = {
            //TODO: See if explicit declaration of the array selector methods is still required
            /**
             * iterates each element in Selector and applies callback.
             * @param {Function} callback function callback( item, index, array ):void
             *
            forEach: function( callback ) {
                this.forEach( callback );
                return this;
            },

            /**
             * iterates each element in Selector and checks that every callback returns true.
             * @param {Function} callback function callback( item, index, array ):Boolean
             *
            every: function( callback ) {
                return this.every( callback );
            },

            /**
             * iterates each element in Selector and checks that at least one callback returns true.
             * @param {Function} callback function callback( item, index, array ):Boolean
             *
            some: function( callback ) {
                return this.some( callback );
            }*/
        };

    };


	//register module
	lola.registerModule( new Module() );

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

	/**
	 * Type Module
	 * @namespace lola.type
	 */
	var Module = function() {
		var $ = lola;
        var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "type";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [];

        /**
         * map of types
         * @private
         * @type {Object}
         */
        var map = {};

        /**
         * primitive types
         * @private
         * @type {Array}
         */
        var primitives = ["boolean","number","string","undefined","null"];



        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };

        //==================================================================
        // Methods
        //==================================================================
        /**
         * creates map of object and element types
         * @private
         */
         function createMap() {

            var objTypes = "String Number Date Array Boolean RegExp Function Object Undefined Null";
            var tagTypes =  "a abbr acronym address applet area article aside audio "+
                "b base bdi bdo big body br button "+
                "canvas caption center cite code col colgroup command "+
                "datalist dd del details dfn dir div dl dt "+
                "em embed "+
                "fieldset figcaption figure font footer form frame frameset "+
                "h1 h2 h3 h4 h5 h6 head header hgroup hr html "+
                "i iframe img input ins "+
                "kbd "+
                "label legend li link "+
                "map mark menu meta meter "+
                "nav noframes noscript "+
                "ol optgroup option output "+
                "p param pre progress "+
                "q "+
                "rp rt ruby "+
                "s samp script section select small source span strike strong style sub summary sup svg "+
                "table tbody td textarea tfoot th thead time title tr track tt "+
                "u ul "+
                "var video "+
                "wbr"+
                "xmp";
            var specialTagTypes ="object";

            objTypes.split(' ').forEach( mapObject );
            tagTypes.split(' ').forEach( mapTag );
            specialTagTypes.split(' ').forEach( mapSpecialTag );

            var tn = document.createTextNode( 'test' );
            var cn = document.createComment( 'test' );
            var tntype = Object.prototype.toString.call( tn );
            var cntype = Object.prototype.toString.call( cn );
            var windowtype = Object.prototype.toString.call( $.window );
            map[ tntype ] = 'textnode';
            map[ cntype ] = 'commentnode';
            map[ windowtype ] = 'window';
            //TODO: add isTextNode and isCommentNode selector functions
            //TODO: add support for blockquote
        }

        /**
         * maps tag type
         * @param item
         * @param index
         * @private
         */
        function mapTag( item, index ) {
            var tag = document.createElement( item );
            var type = Object.prototype.toString.call( tag );
            var name = type.replace( /\[object HTML/g, "" ).replace( /Element\]/g, "" );
            name = name == "" ? "Element" : name;
            map[ type ] = name.toLowerCase();
            var isfn = "lola.Selector.prototype['is" + name + "'] = " +
                "function(index){ return this.isType('" + name.toLowerCase() + "',index); };";
            $.evaluate( isfn );
        }

        /**
         * maps special tag types
         * @param item
         * @param index
         * @private
         */
        function mapSpecialTag( item, index ) {
            var tag = document.createElement( item );
            var type = Object.prototype.toString.call( tag );
            var name = type.replace( /\[object /g, "" ).replace( /Element\]/g, "" ); // keep HTML
            name = name == "" ? "Element" : name;
            map[ type ] = name.toLowerCase();
            var isfn = "lola.Selector.prototype['is" + name + "'] = " +
                "function(index){ return this.isType('" + name.toLowerCase() + "',index); };";
            $.evaluate( isfn );
        }

        /**
         * maps object types
         * @param item
         * @param index
         * @private
         */
        function mapObject( item, index ) {
            var type = "[object " + item + "]";
            map[ type ] = item.toLowerCase();
            var isfn = "lola.Selector.prototype['is" + item + "'] = " +
                "function(index){ return this.isType('" + item.toLowerCase() + "',index); };";
            $.evaluate( isfn );
        }

        /**
         * gets the specified object's type
         * @param {Object} object
         * @return {String}
         */
        this.get = function( object ) {
            //if ( object ) {
                var type = map[ Object.prototype.toString.call( object ) ];
                if ( type )
                    return type;
                return 'other';
            //}
            //else if ( object === undefined )
            //return 'null';
        };

        this.isPrimitive = function( object ) {
            return primitives.indexOf(self.get(object)) >= 0;
        };

        //==================================================================
        // Selector Methods
        //==================================================================
        this.selectorMethods = {
            /**
             * gets the type if the specified index
             * @return {Array}
             */
            getType: function() {
                return this.g( self.get );
            },

            /**
             * checks if element at index is a type, or all elements are a type
             * @param {String} type
             * @param {int|undefined} index
             */
            isType: function( type, index ) {
                if (index != undefined && index >= 0 ) {
                    return self.get( this[index]) === type;
                }
                else {
                    return this.every( function( item ){
                        return self.get(item) === type;
                    } );
                }
            },

            /**
             * checks if element at index is a primitive, or all elements are primitives
             * @param {int|undefined} index
             */
            isPrimitive: function( index ) {
                if (index != undefined && index >= 0 ) {
                    return self.isPrimitive( this.getType(index) );
                }
                else {
                    return this.every( function( item ){
                        return self.isPrimitive(item) >= 0;
                    } );
                }
            }

        };

        //==================================================================
        // Preinitialize
        //==================================================================
        createMap();


    };


	//register module
	lola.registerModule( new Module() );

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
	/**
	 * DOM Module
	 * @namespace lola.dom
	 */
	var Module = function(){
		var $ = lola;
		var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "dom";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [];

        /**
         * map of attribute getter/setter hooks
         * @private
         * @type {Object}
         */
        var attributeHooks = {};


        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * sets or gets an node attribute
         * @param {Object} object the object on which to access the attribute
         * @param {String} name the name of the attribute
         * @param {*} value (optional) value to set
         * @param {Boolean} value (optional) value to set
         */
        this.attr = function( object, name, value, useHooks ) {
            //console.log('dom.attr');
            if ( useHooks !== false && attributeHooks[name] ) {
                return attributeHooks[name].apply( object, arguments );
            }
            else if (object) {
                if ( value || value == "") {   //set value
                    if ($.type.isPrimitive(value)) {
                        return object[name] = value;
                    }
                    else {
                        throw new Error('attribute values must be primitives');
                    }
                }
                else {
                    return object[ name ];
                }
            }
        };

        /**
         * add hook to event hooks
         * @param {String|Array} attrs
         * @param {Function} hook
         */
        this.addAttrHook = function( attrs, hook ){
            if (!Array.isArray(attrs)){
                attrs = [attrs];
            }
            attrs.forEach( function(attr){
                attributeHooks[ attr ] = hook;
            });
        };


        /**
         * Attribute hook for dispatching change event on value set
         * @param object
         * @param name
         * @param value
         */
        function attrDispatchChange( object, name, value ){
            var oldValue = self.attr(object, name, undefined, false);
            if (value != undefined){
                var result = self.attr(object, name, value, false);
                if (oldValue != value)
                    $.event.trigger( object, 'change', false, false );
                return result;
            }

            return oldValue;
        }

        /**
         * deletes expando properties
         * @param {Object} object
         * @param {String} name
         */
        this.deleteExpando =function( object, name ) {
            if ( $.support.deleteExpando )
                delete object[name];
            else
                object[name] = null;
        };

        /**
         * determines if element a is descendant of element b
         * @param {Node} a
         * @param {Node} b
         */
        this.isDescendant = function ( a, b ) {
            return self.isAncestor( b, a );
        };

        /**
         * determines if element a is an ancestor of element b
         * @param {Node} a
         * @param {Node} b
         */
        this.isAncestor = function ( a, b ) {
            var ancestor = b;
            while ( ancestor && (ancestor = ancestor.parentNode) && ancestor.nodeName != "BODY" ) {
                if (a == ancestor) return true;
            }
            return false;
        };

        /**
         * utility function: dispatches contentChanged event for target
         * @param $target
         * @return {lola.Selector}
         */
        function contentChanged( $target ){
            $target.trigger('contentchanged', true);
            return $target;
        }

        //==================================================================
        // Selector Methods
        //==================================================================

        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {

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
	         * returns first element as selector
	         * @return {*|lola.Selector}
	         */
	        first: function(){
		        return this.at(0);
	        },

	        /**
	         * returns last element as selector
	         * @return {*|lola.Selector}
	         */
	        last: function(){
		        return this.at(this.length-1);
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
                    return $.__(values);
                }
                else {
                    this.forEach( function( item ) {
                        if (item.childNodes){
                            var cnl = item.childNodes.length;
                            for ( var i=0; i<cnl; i++ ) {
                                var child = item.childNodes.item(i);
                                $.safeDelete( child );
                            }
                            switch ( $.type.get( content ) ) {
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
                    return contentChanged( this );
                }
            },

            /**
             *  appends node to last selection element in DOM
             * @param {Element} node
             * @return {lola.Selector}
             */
            appendChild: function( node ) {
                if ( this.length > 0 ) {
                    //console.log("appendChild:",node);
                    var p = this.last().get();
                    if ( p && p.appendChild )
                        p.appendChild( node );
                }
                return contentChanged( this );
            },

            /**
             *  prepends node to first selection element in DOM
             * @param {Element} node
             * @return {lola.Selector}
             */
            prependChild: function( node ) {
	            if ( this.length > 0 ) {
		            //console.log("appendChild:",node);
		            var p = this.first().get();
		            if ( p && p.insertBefore )
			            p.insertBefore( node, p.firstElementChild );
	            }
                return contentChanged( this );
            },

            /**
             *  clones first selection element
             * @param {Boolean} deep
             * @return {Element}
             */
            cloneNode: function( deep ) {
                if ( this.length > 0 ) {
                    return this.get().cloneNode( deep );
                }
                return null;
            },

            /**
             *  inserts node before first selected element
             * @param {Element} node
             * @return {lola.Selector}
             */
            insertBefore: function( node ) {
                if ( this.length > 0 ) {
                    this.first().parent().insertBefore( node, this[0] );
                }
	            contentChanged(this.first().generation());
                return this;
            },

            /**
             *  inserts node after last selected element
             * @param {Element} node
             * @return {lola.Selector}
             */
            insertAfter: function( node ) {
                if ( this.length > 0 ) {
	                var p = this.last().parent();
	                if ( this.last().get() == p.lastElementChild ){
		                p.appendChild( node );
	                }
	                else{
		                p.insertBefore( node, this.last().get().nextSibling );
	                }
                }
	            contentChanged(this.first().generation());
	            return this;
            },

            /**
             *  removes node from first element in DOM
             * @param {Element} node
             * @return {lola.Selector}
             */
            removeChild: function( node ) {
                if ( this.length > 0 ) {
                    $.safeDelete( node );
                    this.get().removeChild( node );
                }
                return contentChanged( this );
            },

            /**
             *  replaces node in first element in DOM
             * @param {Element} newChild
             * @param {Element} oldChild
             * @return {lola.Selector}
             */
            replaceChild: function( newChild, oldChild ) {
                if ( this.length > 0 ) {
                    $.safeDelete( oldChild );
                    //TODO: check if call to below line is needed
                    //$.data.destroyCache( oldChild, true );
                    this.get().replaceChild( newChild, oldChild );
                }
                return contentChanged( this );
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
                        self.attr( item, name, value );
                    } );
                    return this;
                }
                else {
                    var values = [];
                    this.forEach( function( item ) {
                        values.push( self.attr( item, name ) );
                    } );
                    return $.__(values);
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
             * @param {String|undefined} newParent
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
                    return $.__(values);
                }
            },

            /**
             * gets index of elements
             */
            nodeIndex: function(){
                var values = [];
                this.forEach( function( item, index ) {
                    if (item.previousSibling){
                        var i = 0;
                        while( (item = item.previousSibling) != null ){
	                        if (item.nodeType === 1)
	                            i++;
                        }
                        values.push( i );
                    }
                    else{
                        values.push( 0 );
                    }

                } );
                return lola.__(values);
            },

            /**
             *  deletes expando property on elements
             * @param {String} name
             * @return {lola.Selector}
             */
            deleteExpando: function( name ) {
                return this.s( self.deleteExpando, name );
            },

            isAncestor: function( elem ){
                  return this.s( self.isAncestor, elem );
            }
        };

        self.addAttrHook(['value','checked','selected'], attrDispatchChange );

    };


	//register module
	lola.registerModule( new Module() );

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
	/**
	 * Data Module
	 * @namespace lola.data
	 */
	var Module = function(){
		var $ = lola;
		var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "data";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ['dom','type'];

        /**
         * cache for all data storage
         * @private
         */
        var cache = {};

        /**
         * uid for data references
         * @private
         */
        var uid = 1;

        /**
         * attribute for data storage uid
         * @private
         */
         var cacheIDProp = "LOLA-DATA-UID";

        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };

        //==================================================================
        // Methods
        //==================================================================
        /**
         * get next data uid
         * @return {int}
         * @private
         */
        function nextUid() {
            return uid++;
        }

        /**
         * links element with data cache
         * @param {Object} object
         * @param {Boolean|undefined} create defaults to true,
         * set to false to prevent creating a cache if one doesn't already exist
         * @private
         */
        function getCacheId( object, create ) {
            create = (create == undefined) ? true : create;
            //assume if create cache is being called that ther is no cache
            var cacheId = $.dom.attr( object, cacheIDProp );
            if ( cacheId == null ) {
                switch ( $.type.get( object ) ) {
                    case 'function':
                    case 'object':
                        cacheId = object[cacheIDProp];
                        if ( cacheId == null && create ) {
                            cacheId = nextUid();
                            object[cacheIDProp] = cacheId;
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
                        cacheId = $.dom.attr( object, cacheIDProp );
                        if ( cacheId == null && create ) {
                            cacheId = nextUid();
                            $.dom.attr( object, cacheIDProp, cacheId );
                        }
                        break;
                }
            }
            return cacheId;
        }

        /**
         * gets an objects data for the specified namespace
         * @param {Object} object the object for which to retrieve data
         * @param {String} namespace the namespace to retrieve
         * @param {Boolean|undefined} create namespace data for object if not found,
         * defaults to false
         */
        this.get = function( object, namespace, create ) {
            var cacheId = getCacheId( object, false );
            if ( cache[namespace] == null || cacheId == null ) {
                if (create) {
                    var obj = {};
                    return self.set( object, obj, namespace, false );
                }
                else {
                    return null;
                }
            }
            else
                return cache[namespace][cacheId];
        };

        /**
         * gets data for entire namespace
         * @param {String} namespace the namespace to get from data cache
         */
        this.getNamespaceData = function( namespace ) {
            return cache[ namespace ];
        };

        /**
         * replaces/updates existing object data
         * @param {Object} object
         * @param {Object} data
         * @param {String} namespace namespace to put data
         * @param {Boolean|undefined} overwite overwite existing data, defaults to false
         */
        this.set = function( object, data, namespace, overwite ) {
            //check for existing cache
            var cacheId = getCacheId( object, true );

            if ( cache[namespace] == null )
                cache[namespace] = {};

            if ( overwite || cache[namespace][cacheId] == null )
                cache[namespace][cacheId] = data;
            else
                $.extend(cache[namespace][cacheId], data, true );

            return cache[namespace][cacheId];
        };

        /**
         * removes object data
         * @param {Object} object
         * @param {String|undefined} namespace namespace to remove data,
         * removes data from all namespaces if undefined
         * @param {Boolean|undefined} recurse recurse childNodes to delete data
         */
        this.remove = function( object, namespace, recurse ) {
            //remove object data
            var cacheId = getCacheId( object, false );
            if ( cacheId ) {
                if ( namespace == null || namespace == undefined ) {
                    namespace = [];
                    for ( var ns in cache ) {
                        namespace.push( ns );
                    }
                }
                else {
                    if ( $.type.get(namespace) != "array" )
                        namespace = [namespace];
                }

                namespace.forEach( function( nsp ) {
                    delete cache[nsp][cacheId];
                } )

            }
            if (recurse === undefined)
                recurse = true;

            if ( recurse ) {
                if ( object.childNodes && $.type.get(object.childNodes) == "array") {
                    object.childNodes.forEach( function( item ) {
                        self.remove( item, namespace, true );
                    } )
                }
            }

        };

        this.dataset = function( elem, name, value ){
            if (value != undefined ){
                if ($.support.dataset){
                    elem.dataset[name] = value;
                }
                else{
                    $(elem).attr('data-'+name, value);
                }
            }
            else{
                if ($.support.dataset){
                    try {
                        return elem.dataset[name];
                    }
                    catch(e){}
                    return undefined;
                }
                else{
                    return $(elem).attr('data-'+name);
                }
            }
        };

        //==================================================================
        // Selector Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {

            /**
             * get data for elements
             * @param {String} namespace
             * @param {Boolean|undefined} create create data object if null
             * @return {Array}
             */
            getData: function( namespace, create ) {
                return this.g( self.get, namespace, create );
            },

            /**
             * put data for elements
             * @param {Object} data data to put in cache for elements (overwrites)
             * @param {String} namespace
             * @return {*}
             */
            putData: function( data, namespace ) {
                return this.s( self.set, data, namespace );
            },

            /**
             * updates data for elements
             * @param {Object} data
             * @param {String} namespace
             * @return {*}
             */
            updateData: function( data, namespace ) {
                return this.s( self.set, data, namespace, false );
            },

            /**
             * remove specified namespaces from data cache
             * @param {Array|String|undefined} namespace
             * @param {Boolean|undefined} recurse recurse childNodes, defaults to false
             * @return {*}
             */
            removeData: function( namespace, recurse ) {
                return this.s( self.remove, namespace, recurse );
            },

            /**
             * remove specified namespaces from data cache
             * @param {Boolean|undefined} recurse recurse childNodes, defaults to false
             * @return {lola.Selector}
             */
            removeAllData: function( recurse ) {
                return this.removeData( null, recurse );
            },

            dataset: function( name, value ){
                return this._( self.dataset, name, value );
            }
        };

        //==================================================================
        // Preinitialize
        //==================================================================
        $.addSafeDeleteHook( this.remove, this );

    };


	//register module
	lola.registerModule( new Module() );

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
	/**
	 * Utility Module
	 * @namespace lola.util
	 */
	var Module = function(){
		var $ = lola;
		var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "util";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [];


        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };

        //==================================================================
        // Methods
        //==================================================================
        /**
         * copies primitives from source to target
         * @param source
         * @param target
         */
        this.copyPrimitives = function( source, target ){
            for (var k in source){
                if ($.type.isPrimitive(source[k])){
	                try{ target[k] = source[k] }
	                catch(e){}
                }
            }
        };

        /**
         * checks for required arguments
         * @param {String} group
         * @param {Array} required
         * @param {Array} info
         * @return {Boolean}
         */
        this.checkArgs = function ( group, required, info ) {
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
                if ($.type.get(info) == 'array'){
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
        };

        /**
         * gets and sets an inline property for client
         * @private
         * @param {*} scope
         * @param {String} name
         * @param {String} type
         * @param {*} defaultValue
         * @return {*}
         */
        this.getInlineValue = function( scope, name, type, defaultValue ){
            var $inline = $('script[type="text/x-$-'+name+'"]', scope );
            if ( $inline.length ){
                //inline property was found
                var value = eval( $inline[0].innerHTML );
                if ( $.type.get( value ) === type.toLowerCase() ){
                    return value;
                }
            }
            return defaultValue;
        };

        /**
         * converts node list to array
         * @param {NodeList} nl
         */
        this.nodeList2Array = function( nl ){
            try {
                return Array.prototype.slice.call( nl, 0 );
            }
            catch(e){
                var arr = [];
                for (var i = nl.length; i--; arr.unshift(nl[i]) ){
                    //intentionally empty
                }
                return arr;
            }
        };


        //==================================================================
        // Selection Methods
        //==================================================================

        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {

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

    };

	//register module
	lola.registerModule( new Module() );

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
	/**
	 * String Module
	 * @implements {lola.Module}
	 * @namespace lola.string
	 */
	var Module = function(){
		var $ = lola;
		var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "string";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [];


        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };

        //==================================================================
        // Methods
        //==================================================================
        /**
         * pads the front of a string with the specified character to the specified length
         * @param {String|int} str
         * @param {String} chr character to use in pad, can be multiple characters for escaped chrs
         * @param {int} size padded length
         */
        this.padFront = function ( str, chr, size ) {
            str = str.toString();
            var l = str.length;
            var p = [str];
            while ( l < size ) {
                p.push(chr);
                l++;
            }
            return p.join("");
        };

        /**
         * pads the end of a string with the specified character to the specified length
         * @param {String|int} str
         * @param {String} chr character to use in pad, can be multiple characters for escaped chrs
         * @param {int} size padded length
         */
        this.padEnd = function ( str, chr, size ) {
            str = str.toString();
            var l = str.length;
            var p = [str];
            while ( l < size ) {
                p.unshift(chr);
                l++;
            }
            return p.join("");
        };

        /**
         * converts hyphenated strings to camelCase
         * @param {String} str
         */
        this.camelCase = function ( str ) {
            str = String(str);
            var parts = str.split( "-" );
            var pl = parts.length;
            for ( var i = 1; i<pl; i++ ) {
                if ( parts[i].length > 0 )
                    parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
            }

            return parts.join("");
        };

        /**
         * converts hyphenated strings to camelCase
         * @param {String} str
         */
        this.dashed = function ( str ) {
            var chs = str.split('');
            var ch;
            var parts = [];
            while ( ch = chs.shift() ){
                if (ch == ch.toUpperCase())
                    parts.push( "-" );
                parts.push( ch.toLowerCase() );
            }
            return parts.join("");
        };

        /**
         * makes a string more difficult to read
         * @param {String} str
         * @param {Number|undefined} passes
         */
        this.obfuscate = function ( str, passes ) {
            var codes = new Array(str.length);
            var chars = str.split("");
            chars.forEach( function(c,i){
                codes[i] = str.charCodeAt(i);
            } );
            if (!passes) passes = 1;
            while (passes){
                codes.forEach( function(c,i){
                    c += (i%8)*(i%2 == 0 ? 1:-1 );
                    codes[i] = c;
                    chars[i] = String.fromCharCode(c);
                } );
                passes--;
            }
            return chars.join('');
            //return codes.join('|');
        };

        /**
         * makes a string more difficult to read
         * @param {String} str
         * @param {Number|undefined} passes
         */
        this.unobfuscate = function ( str, passes ) {
            var codes = new Array(str.length);
            var chars = str.split("");
            chars.forEach( function(c,i){
                codes[i] = str.charCodeAt(i);
            });

            if (!passes) passes = 1;
            while (passes){
                codes.forEach( function(c,i){
                    c -= (i%8)*(i%2 == 0 ? 1:-1 );
                    codes[i] = c;
                } );
                passes--;
            }

            codes.forEach( function(c,i){
                chars[i] = String.fromCharCode(c);
            });

            return chars.join("");
        };

         /**
          *  encodes text as base 64 string
          * This encoding function is from Philippe Tenenhaus's example at http://www.philten.com/us-xmlhttprequest-image/
          * @param inputStr
          */
        this.base64Encode = function( inputStr ){

            var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            var outputStr = "";
            var i = 0;

            while (i < inputStr.length){
                //all three "& 0xff" added below are there to fix a known bug
                //with bytes returned by xhr.responseText
                var byte1 = inputStr.charCodeAt(i++) & 0xff;
                var byte2 = inputStr.charCodeAt(i++) & 0xff;
                var byte3 = inputStr.charCodeAt(i++) & 0xff;

                var enc1 = byte1 >> 2;
                var enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);

                var enc3, enc4;
                if (isNaN(byte2)){
                    enc3 = enc4 = 64;
                }
                else {
                    enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
                    enc4 = (isNaN(byte3)) ?  64 : byte3 & 63;
                }

                outputStr += b64.charAt(enc1) + b64.charAt(enc2) + b64.charAt(enc3) + b64.charAt(enc4);
            }

            return outputStr;
        }

    };


	//register module
	lola.registerModule( new Module() );

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
	/**
	 * Regular Expression Module
	 * @namespace lola.regex
	 */
	var Module = function(){
		var $ = lola;
		var self = this;

		//==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "regex";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [];

        /**
         * looks for extra spaces
         */
        this.extraSpace = /\s\s+/g;

        /**
         * is a valid number
         */
        this.isNumber = /^-?\d*(?:\.\d+)?$/;

        /**
         * is a number with units
         */
        this.isDimension = /^(-?\d*(?:\.\d+)?)(%|in|cm|mm|em|ex|pt|pc|px)$/;

        /**
         * is css color (color names not matched)
         */
        this.isColor = /^(#|rgb|rgba|hsl|hsla)(.*)$/;

        /**
         * is css hex color
         */
        this.isHexColor = /^#([A-F0-9]{3,6})$/;

        /**
         * is css rgb or rgba color
         */
        this.isRGBColor = /^rgba?\(([^\)]+)\)$/;

        /**
         * is css hsl or hsla color
         */
        this.isHSLColor = /^hsla?\(([^\)]+)\)$/;



        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };

        //==================================================================
        // Selector Methods
        //==================================================================

        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {

        }



    };


	//register module
	lola.registerModule( new Module() );

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

	/**
	 * Event Module
	 * @namespace lola.event
	 */
	var Module = function(){
		var $ = lola;
		var self = this;
        //==================================================================
        // Attributes
        //==================================================================

        this.PRIORITY_BEFORE = 1;
        this.PRIORITY_FIRST = 0x400000;
        this.PRIORITY_NORMAL = 0x800000;
        this.PRIORITY_LAST= 0xC00000;
        this.PRIORITY_AFTER = 0xFFFFFF;

        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "event";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ['data','util','type'];

        /**
         * event maping
         * @type {Object}
         * @private
         */
        var map = { 'mousewheel':['mousewheel','DOMMouseScroll'] };

        /**
         * event hooks
         * @type {Object}
         * @private
         */
        var hooks = {};

        /**
         * event listener uid
         * @type {int}
         * @private
         */
        var uid = 0;

        /**
         * namespace to use in data
         */
        var dataNamespace = "_"+namespace;


        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };

        //==================================================================
        // Methods
        //==================================================================
        /**
         * add hook to event hooks
         * @param {String} type
         * @param {Object} object
         */
        this.addHook = function( type, object ){
            hooks[ type ] = object;
        };

        /**
         * add a framework event listener
         * @param {Object} target
         * @param {String} type
         * @param {Function} handler
         * @param {Boolean|undefined} useCapture
         * @param {uint|undefined} priority default 0xFFFFFF
         * @param {Object|undefined} scope
         * @param {Boolean|undefined} useHooks
         */
        this.addListener = function( target, type, handler, useCapture, priority, scope, useHooks ) {
            var required = [['target',target],['type',type],['handler',handler]];
            var info = [target,'type: '+type,'useCapture: '+useCapture];
            if ( $.util.checkArgs('ERROR: lola.event.addListener( '+type+' )', required, info) ){
                if (useHooks !== false && hooks[type] != null){
                    var hook = hooks[type];
                    return hook.addListener( target, type, handler, useCapture, priority, hook );
                }
                else {
                    var data = $.data.get( target, dataNamespace );
                    if ( !data ) {
                        data = { capture:{}, bubble:{} };
                        $.data.set( target, data, dataNamespace, true );
                    }

                    var phase = self.phaseString( target, useCapture );
                    priority = priority || self.PRIORITY_NORMAL;
                    scope = scope || target;

                    //assign handler a uid so it can be easily referenced
                    if ( !handler.uid )
                        handler.uid = ++uid;

                    if ( data[phase][type] == null )
                        data[phase][type] = {};

                    data[phase][type][handler.uid] = {priority:priority, uid:handler.uid, handler:handler, scope:scope };


                    //since duplicate dom listeners are discarded just add listener every time
                    // function checks if event listener can actually be added
                    if ( phase == 'capture' )
                        self.addDOMListener( target, type, captureHandler, true );
                    else
                        self.addDOMListener( target, type, bubbleHandler, false );

                    return uid;
                }
            }
        };

        /**
         * remove a framework event listener
         * @param {Object} target
         * @param {String} type
         * @param {Function} handler
         * @param {Boolean|undefined} useCapture
         * @param {Boolean|undefined} useHooks
         */
        this.removeListener = function( target, type, handler, useCapture, useHooks ) {
            var required = [['target',target],['type',type],['handler',handler]];
            var info = [target,'type: '+type,'useCapture: '+useCapture];
            if ( $.util.checkArgs('ERROR: lola.event.removeListener( '+type+' )', required, info) ){
                if (useHooks !== false && hooks[type] != null){
	                hooks[type]['removeListener'].call( hooks[type], target, type, handler, useCapture );
                }
                else {
                    var data = $.data.get( target, dataNamespace );
                    if ( !data ) data = { capture:{}, bubble:{} };
                    var phase = self.phaseString( target, useCapture );
                    //get handler uid
                    var uid = $.type.get( handler ) == 'function' ? handler.uid : handler;
                    if (data && data[phase] && data[phase][type] ){
	                    delete data[phase][type][uid];
                        //if there are no more listeners in stack remove handler
                        // function checks if event listener can actually be removed
                        if ( data[phase][type] && Object.keys( data[phase][type] ).length == 0 ) {
	                        delete data[phase][type];
                            if ( phase == 'capture' )
                                self.removeDOMListener( target, type, captureHandler, true );
                            else
                                self.removeDOMListener( target, type, bubbleHandler, false );

                        }
                    }
                }
            }
        };

        /**
         * removes all listeners associated with handler
         * @param {String|Array} types
         * @param {Function} handler
         * @param {Boolean|undefined} useCapture
         */
        this.removeHandler = function( handler, types, useCapture ) {
            //console.info( '$.event.removeHandler: '+type+' '+capture );
            var required = [['handler',handler]];
            var info = [];
            if ( $.utils.checkArgs('ERROR: lola.event.removeHandler', required, info) ){
                //get handler uid
                var uid = ""+($.type.get( handler ) == 'function' ? handler.uid : handler);

                //get event data
                var data = $.data.getNamespace( dataNamespace );
                if ( data ) {
                    var ctypes = (useCapture == undefined) ? ['capture','bubble'] : useCapture ? ['capture'] : ['bubble'];
                    //iterate data
                    for ( var oid in data ) {
                        if ( types != undefined )
                            types = $.type.get( types ) == 'array' ? types : [types];
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
                                self.removeDOMListener( target, type, (phase == 'capture') ? captureHandler : bubbleHandler, (phase == 'capture') );
                        }
                    }
                }
            }
        };

        /**
         * internal capture listener
         * @param {Object} event
         * @private
         */
        function captureHandler( event ) {
            event = event || $.window.event;
            handler( event, 'capture' )
        }

        /**
         * internal bubble listener
         * @param {Object} event
         * @private
         */
        function bubbleHandler( event ) {
            event = event || $.window.event;
            handler( event, 'bubble' )
        }

        /**
         * internal listener
         * @private
         * @param {Object} event
         * @param {String} phase
         */
        function handler( event, phase ) {
            event = event ? event : window.event;
           //console.log( '$.event.handler: '+event.type+' '+phase );

            var e = (event.originalEvent) ? event : new LolaEvent( event, {} );
            var data = $.data.get( e.currentTarget, dataNamespace );
            if ( data && data[phase] && data[phase][event.type] ) {
                //console.info('    found event');
                var stack = [];
                for ( var uid in data[phase][event.type] ) {
                    stack.push( data[phase][event.type][uid] );
                }
                //stack = stack.sort( $.util.prioritySort );
                stack = $.array.sortOn( 'priority', stack );
                for ( var i in stack ) {
                    if ( e._immediatePropagationStopped )
                        break;
                    var obj = stack[i];
                    if ( obj.handler )
                        obj.handler.call( obj.scope, e );
                    else
                        delete data[phase][event.type][obj.uid];
                }
            }
        }

        /**
         * triggers a framework event on an object
         * @param {Object} object
         * @param {String} type
         * @param {Boolean|undefined} bubbles
         * @param {Boolean|undefined} cancelable
         * @param {Object|undefined} data
         */
        this.trigger = function( object, type, bubbles, cancelable, data ) {
            //console.log('$.event.trigger:',type, object);
            var args = [object, type];
            var names = ['target','type'];
            var group = 'lola.event.trigger: type='+type+' bubbles='+bubbles;
            if ( $.util.checkArgs(args, names, group) ){
                //console.log('   valid');
                if ( bubbles == undefined )
                    bubbles = true;
                if ( cancelable == undefined )
                    cancelable = true;

                var event = type;
                if ( $.type.get( event ) === 'string' ) {
                    //console.log('   event is string');
                    event = document.createEvent( "Event" );
                    event.initEvent( type, bubbles, cancelable );
                    event.data = data;
                }

                if ( object.dispatchEvent ) {
                    //console.log('   dispatching object event');
                    object.dispatchEvent( event );
                }
                else {
                    //console.log('   dispatching $ event');
                    event = new LolaEvent( event, object );
                    handler( event, 'capture' );
                    if (bubbles)
                        handler( event, 'bubble' );
                }
            }
        };

        /**
         * add a DOM event listener
         * @param {Object} target
         * @param {String} type
         * @param {Function} handler
         * @param {Boolean|undefined} useCapture
         */
        this.addDOMListener = function( target, type, handler, useCapture ) {
            type = map[type] ? map[type] : [type];
            type.forEach( function(t) {
                try {
                    if ( $.support.domEvent && target.addEventListener )
                        target.addEventListener( t, handler, useCapture );
                    else if ( $.support.msEvent && target.attachEvent )
                        target.attachEvent( 'on' + t, handler );
                    else if ( target['on' + t.toLowerCase()] == null )
                        target['on' + type.toLowerCase()] = handler;
                }
                catch( error ) {
	                //errors here are because we can't add dom events to some object types
                    //$.syslog( 'lola.event.addDOMListener error:', target, t, handler, useCapture );
                }
            } );
        };

        /**
         * remove a DOM event listener
         * @param {Object} target
         * @param {String} type
         * @param {Function} handler
         * @param {Boolean|undefined} useCapture
         */
        this.removeDOMListener = function( target, type, handler, useCapture ) {
            type = map[type] ? map[type] : [type];
            type.forEach( function(t) {
                try {
                    if ( $.support.domEvent && target.removeEventListener )
                        target.removeEventListener( t, handler, useCapture );
                    else if ( $.support.msEvent && target.detachEvent )
                        target.detachEvent( 'on' + t, handler );
                    else if ( target['on' + t.toLowerCase()] == null )
                        delete target['on' + t.toLowerCase()];
                }
                catch( error ) {
	                //errors here are because we can't remove dom events from some object types
	                //$.syslog( 'lola.event.removeDOMListener error:', target, t, handler, useCapture );
                }
            } );
        };

        /**
         * gets the dom target
         * @param {Object} event
         * @param {Object} target
         * @return {Object}
         */
        this.getDOMTarget = function( event, target ) {
            if ( event ) {
                if ( event.currentTarget )
                    target = event.currentTarget;
                else if ( event.srcElement )
                    target = event.srcElement;

                if ( target && target.nodeType == 3 ) // defeat Safari bug
                    target = target.parentNode;
            }
            return target;
        };

        /**
         * @descrtiption returns key code for key events
         * @param {Event} e
         * @return {int}
         */
        this.getDOMKeycode = function( e ) {
            var code;

            if ( e.keyCode )
                code = e.keyCode;
            else if ( e.which )
                code = e.which;

            return code;
        };

        /**
         * returns key string for key events
         * @param {Event} e
         * @return {String}
         */
        this.getDOMKey = function( e ) {
            var code = self.getDOMKeycode(e);
            if (code > 0xFFFF) {
                code -= 0x10000;
                return String.fromCharCode(0xD800 + (code >> 10), 0xDC00 +
                    (code & 0x3FF));
            }
            else {
                return String.fromCharCode(code);
            }
        };


        /**
         * returns x,y coordinates relative to document
         * @param {Event} e
         * @return {Object}
         */
        this.getDOMGlobalXY = function( e ) {
            //console.log('getDOMGlobalXY:',e);
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
        };

        /**
         * returns x,y coordinates relative to currentTarget
         * @param {Event} e
         * @return {Object}
         */
        this.getDOMLocalXY = function( e ) {
            //TODO: find better way of getting local X & Y for mouse events
            var xPos = e.offsetX || undefined;
            var yPos = e.offsetY || undefined;

            if (e.currentTarget != undefined && (xPos == undefined || yPos == undefined)){
                var trgOffset = $.geometry.getOffset( e.currentTarget );
                var clickPt = self.getDOMGlobalXY( e );

                xPos = clickPt.x - trgOffset.x;
                yPos = clickPt.y - trgOffset.y;
            }
            return {x:xPos,y:yPos};
        };

        /**
         * returns actual event phase to use
         * @param {Object} target
         * @param {Boolean|undefined} useCapture
         * @return {String}
         */
        this.phaseString = function( target, useCapture ) {
            return ((useCapture && ($.support.domEvent || $.support.msEvent)) || (!target.dispatchEvent && !target.attachEvent)) ? 'capture' : 'bubble';
        };

        /**
         * prevent default event action
         * @param {Event} e
         * @return {Boolean}
         */
        this.preventDefault = function( e ){
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
        };

        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {

            /**
             * adds a framework event listener
             * @param {String} type
             * @param {Function} handler
             * @param {Boolean|undefined} useCapture
             * @param {uint|undefined} priority
             * @param {Object|undefined} scope
             */
            addListener: function( type, handler, useCapture, priority, scope ) {
	            return this.s( self.addListener, type, handler, useCapture, priority, scope );
            },

	        /**
             * removes a framework event listener
             * @param {String} type
             * @param {Function} handler
             * @param {Boolean|undefined} useCapture
             */
            removeListener: function( type, handler, useCapture ) {
                return this.s( self.removeListener, type, handler, useCapture );
            },

            /**
             * removes all listeners associated with handler
             * @param {Function} handler
             * @param {Array|undefined} types event types to remove for handler, undefined removes all
             * @param {String|undefined} phase
             */
            removeHandler: function( handler, types, phase ) {
                return this.s( self.removeHandler, handler, types, phase );
            },

            /**
             * triggers an framework event on an object
             * @param {String} type
             * @param {Boolean|undefined} bubbles
             * @param {Boolean|undefined} cancelable
             * @param {Object|undefined} data
             */
            trigger: function( type, bubbles, cancelable, data ) {
                return this.s( self.trigger, type, bubbles, cancelable, data );
            }
        };

		//alias for addListener
		this.selectorMethods.on = this.selectorMethods.addListener;

		//==================================================================
        // Classes
        //==================================================================
        /**
         * LolaEvent class used with internal events
         * @class
         * @param {Object} event
         * @param {Object} target
         */
        var LolaEvent = function( event, target ) {
            return this.init( event, target );
        };
        LolaEvent.prototype = {

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
                //target, source, overwrite, errors, deep, ignore
                lola.extend( this, event, false, false,false,['layerX','layerY']);
                this.originalEvent = event;
                /*if ( target ) {
                    this.target = target;
                }*/
                this.target = event.target;
                this.currentTarget = self.getDOMTarget( event, target );
                var gpos = self.getDOMGlobalXY( event );
                this.globalX = gpos.x;
                this.globalY = gpos.y;

                var lpos = self.getDOMLocalXY( event );
                this.localX = lpos.x;
                this.localY = lpos.y;

                this.key = self.getDOMKey( event );

                if (event.wheelDelta || event.axis){
                    var wdo = { x:event.wheelDeltaX, y:event.wheelDeltaY };
                    if (event.axis){
                        wdo.x = -3 * ((event.axis === 2) ? 0 : event.detail);
                        wdo.y = -3 * ((event.axis === 1) ? 0 : event.detail);
                    }
                }

                this.wheelDelta = wdo;

                return this;
            },

            /**
             * prevents an events default behavior
             */
            preventDefault: function(){
                if (this.originalEvent.preventDefault)
                    this.originalEvent.preventDefault();
                return false;
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
         * event alias hook
         */
        this.AliasHook = function( events ){
	        var $ = lola;

	        this.addListener = function( target, type, handler, useCapture, priority, scope ){
                //$.syslog('alias hook addListener',type);
                var uid;
                events.forEach( function(item){
                    //$.syslog('    ',item);
                    uid = $.event.addListener( target, item, handler, useCapture, priority, scope, false );
                });

                return uid;
            };

            this.removeListener = function( target, type, handler, useCapture ){
                //$.syslog('alias hook removeListener',type);
                events.forEach( function(item){
                    //$.syslog('    ',item);
                    uid = $.event.removeListener( target, item, handler, useCapture, false );
                });
            };

        };
        this.addHook( 'transitionend',
            new this.AliasHook([ 'transitionend',
                'webkitTransitionEnd',
                'oTransitionEnd']) );

        /**
         * mousewheel hook
         */
        this.addHook( 'mousewheel',
            new this.AliasHook([ 'mousewheel',
                'DOMMouseScroll']) );

        /**
         * delayed hover intent event hook
         * @event hover
         */
        var HoverHook = function() {
	        var $ = lola;
	        var hookEvent = "hover";
            var ns = 'eventHover';

            function getData( target ){
                var wait = $.dom.attr( target, "hoverDelay" );
                wait = (wait == null || wait == undefined) ? 250 : parseInt(wait);
                var data = $.data.get( target, ns );
                if ( !data ) {
                    data = { hasIntent:false, wait:wait, timeout:-1 };
                    $.data.set( target, data, ns, true );
                }
                return data;
            }

            function mouseOver( event ){
                self.addListener( event.currentTarget, 'mouseout', mouseOut, false, 0 );
                var data = getData( event.currentTarget );
                data.hasIntent = true;
                if (data.timeout < 0)
                    data.timeout = setTimeout( function(){confirm(event.currentTarget);}, data.wait );
            }

            function mouseOut( event ){
                self.removeListener( event.currentTarget, 'mouseout', mouseOut, false );
                var data = getData( event.currentTarget );
                data.hasIntent = false;
            }

            function confirm( target ){
                self.removeListener( target, 'mouseout', mouseOut, false, 0 );
                var data = getData( target );
                data.timeout = -1;
                if (data.hasIntent){
                    self.trigger( target, hookEvent );
                }
            }

            this.addListener = function( target, type, handler, useCapture, priority, scope ){
                var uid = self.addListener( target, hookEvent, handler, useCapture, priority, scope, false );
                getData( target );
                self.addListener( target, 'mouseover', mouseOver, false, 0, this );
                return uid;
            };

            this.removeListener = function( target, type, handler, useCapture ){
                var edata = $.data.get( target, dataNamespace );
                self.removeListener( target, hookEvent, handler, useCapture, false );
                var phase = self.phaseString( target, useCapture );
                //check for other hook listeners before removeing
                if (edata[phase][hookEvent] == null || Object.keys(edata[phase][hookEvent]).length == 0){
                    self.removeListener( target, 'mouseover', mouseOver, false );
                    $.data.remove( target, ns );
                }
            };


            return this;
        };
        this.addHook( 'hover', new HoverHook() );

        /**
         * mouse enter state event
         * @event mouseenterstate
         */
        var MouseEnterStateHook = function(){
	        var $ = lola;
	        var e1 = 'domouseenter';
            var e2 = 'domouseleave';
            var ns = 'eventMouseEnterState';

            function getData( target ){
                var data = $.data.get( target, ns );
                if ( !data ) {
                    data = { within:false };
                    $.data.set( target, data, ns, true );
                }
                return data;
            }

            function getEnhancedType ( type ){
                if (!$.support.msEvent) {
                    type = 'do'+type;
                }
                return type;
            }

            function mouseOver( event ){
                var data = getData( event.currentTarget );
                if (!data.within && event.currentTarget != event.relatedTarget){
                    data.within = true;
                    self.trigger( event.currentTarget, e1, false );
                }
            }

            function mouseOut( event ){
                var data = getData( event.currentTarget );
                if ( data.within &&
                    !$.dom.isAncestor( event.currentTarget, event.relatedTarget ) &&
                    event.currentTarget != event.relatedTarget ){
                    data.within = false;
                    self.trigger( event.currentTarget, e2, false );
                }
            }

            this.addListener = function( target, type, handler, useCapture, priority, scope ){
                //IE has it already
                if (!$.support.msEvent){
                    //deal with other browsers
                    self.addListener( target, 'mouseover', mouseOver, useCapture, priority, scope );
                    self.addListener( target, 'mouseout', mouseOut, useCapture, priority, scope );
                }
                return self.addListener( target, getEnhancedType( type ), handler, useCapture, priority, scope, false );
            };

            this.removeListener = function( target, type, handler, useCapture ){

                var edata = $.data.get( target, dataNamespace );
                var phase = self.phaseString( target, useCapture );
                type = getEnhancedType( type );
                self.removeListener( target, type, handler, useCapture, false );

                //check for other hook listeners before removeing
                if (!$.support.msEvent &&
                    edata[phase][type] == null ||
                    edata[phase][type].keys().length == 0){
                    //deal with other browsers
                    self.removeListener( target, 'mouseover', mouseOver, useCapture );
                    self.removeListener( target, 'mouseout', mouseOut, useCapture );
                }
            }
        };
        var mesh = new MouseEnterStateHook();
        this.addHook( 'mouseenterstate', mesh );

        /**
         * mouse leave event
         * @event mouseleave
         */
        this.addHook( 'mouseleave', mesh );

        /**
         * mouse enter event
         * @event mouseleave
         */
        this.addHook( 'mouseenter', mesh );

    };

	//register module
	lola.registerModule( new Module() );

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
	/**
	 * Math Module
	 * @namespace lola.math
	 */
	var Module = function(){
		var $ = lola;
		var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "math";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ["util"];



        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };


        //==================================================================
        // Methods
        //==================================================================

        /**
         * normalize radians to 0 to 2 * PI
         * @param {Number} value radian value
         * @return {Number}
         */
        this.normalizeRadians = function( value ) {
            var unit = 2 * Math.PI;
            while (value < unit)
                value += unit;
            return value % unit;
        };

        /**
         * normalize degrees to 0 to 360
         * @param {Number} value radian value
         * @return {Number}
         */
        this.normalizeDegrees = function( value ) {
            while (value < 360)
                value += 360;
            return value % 360;
        };

        /**
         * normalize a value within a range
         * @param {Number} min
         * @param {Number} value
         * @param {Number} max
         * @return {Number}
         */
        this.normalizeRange = function( min, value, max ){
            return Math.max( min, Math.min( max, value ) );
        };


        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {

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
                return this.totalValue( getVal ) / this.length;
            }

        };
    };

	//register module
	lola.registerModule( new Module() );

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

	/**
	 * Math Color Module
	 * @namespace lola.math.color
	 */
	var Module = function(){
		var $ = lola;
		var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "math.color";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ["math"];



        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * converts red,green,blue values to hue,saturation,lightness
         * @param {Number} r
         * @param {Number} g
         * @param {Number} b
         * @return {Object}
         */
        this.rgb2hsl = function( r, g, b ) {
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
        };

        /**
         * converts red,green,blue values to hex string
         * @param {Number} r
         * @param {Number} g
         * @param {Number} b
         * @return {String}
         */
        this.rgb2hex = function( r, g, b ) {
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
        };

        /**
         * converts red,green,blue values to int
         * @param {Number} r
         * @param {Number} g
         * @param {Number} b
         * @return {int}
         */
        this.rgb2int = function( r, g, b ) {
            return parseInt("0x"+self.rgb2hex(r,g,b));
        };

        /**
         * converts hue,saturation,lightness values to red,green,blue
         * @param {Number} h
         * @param {Number} s
         * @param {Number} l
         * @return {Object}
         */
        this.hsl2rgb = function( h, s, l ) {
            //make sure values are in range
            h = (h < 0) ? 0 : h;
            h = (h > 1) ? 1 : h;
            //h = h%1;
            s = (s < 0) ? 0 : s;
            s = (s > 1) ? 1 : s;
            l = (l < 0) ? 0 : l;
            l = (l > 1) ? 1 : l;

            var red = 0;
            var green = 0;
            var blue = 0;

            if ( l != 0 ){
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
        };

        /**
         * converts hue,saturation,lightness values to uint
         * @param {Number} h
         * @param {Number} s
         * @param {Number} l
         * @return {int}
         */
        this.hsl2int = function( h, s, l ) {
            var rgb = self.hsl2rgb( h, s, l );
            return self.rgb2int( rgb.r, rgb.g, rgb.b );
        };

        /**
         * converts hue,saturation,lightness values to hex
         * @param {Number} h
         * @param {Number} s
         * @param {Number} l
         * @return {String}
         */
        this.hsl2hex = function( h, s, l ) {
            var rgb = self.hsl2rgb( h, s, l );
            return self.rgb2hex( rgb.r, rgb.g, rgb.b );
        };

        /**
         * converts int values to rgb
         * @param {int} value
         * @return {Object}
         */
        this.int2rgb = function( value ) {
            //make sure value is in range
            value = (value > 0xFFFFFF) ? 0xFFFFFF : value;
            value = (value < 0x000000) ? 0x000000 : value;

            var red = ((value >> 16) & 0xFF) / 255;
            var green = ((value >> 8) & 0xFF) / 255;
            var blue = ((value) & 0xFF) / 255;


            return {r:red,g:green,b:blue};
        };

        /**
         * converts int values to hsl
         * @param {int} value
         * @return {Object}
         */
        this.int2hsl = function( value ) {
            var rgb = self.int2rgb( value );
            return self.rgb2hsl( rgb.r, rgb.g, rgb.b );
        };

        /**
         * converts int values to hex string
         * @param {int} value
         * @return {String}
         */
        this.int2hex = function( value ) {
            var rgb = self.int2rgb( value );
            return self.rgb2hex( rgb.r, rgb.g, rgb.b );
        };

        /**
         * converts hex values to int
         * @param {String} value
         * @return {int}
         */
        this.hex2int = function( value ) {
            //special case for 3 digit color
            var str;
            if ( value.length == 3 ) {
                str = value[0] + value[0] + value[1] + value[1] + value[2] + value[2]
            }
            else {
                str = value;
            }

            return parseInt( "0x" + str );
        };

        /**
         * converts hex values to rgb
         * @param {String} value
         * @return {Object}
         */
        this.hex2rgb = function( value ) {
            return self.int2rgb( this.hex2int( value ) );
        };

        /**
         * converts hex values to hsl
         * @param {String} value
         * @return {Object}
         */
        this.hex2hsl = function( value ) {
            return self.int2hsl( this.hex2int( value ) );
        };

    };

	//register module
	lola.registerModule( new Module() );

})( lola );

/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Animation
 *  Description: Animation module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
    /**
     * Animation Module
     * @namespace lola.animation
     */
    var Module = function(){
	    var $ = lola;
	    var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "animation";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ['event'];

        /**
         * map of active animation targets
         * @private
         */
        var targets = {};

        /**
         * animation uid generator
         * @private
         */
        var animationUid = 0;

        /**
         * animation uid generator
         * @private
         */
        var freeAnimationIds = [];

        /**
         * map of animations
         * @private
         */
        var animations = {};

        /**
         * indicates whether module is ticking
         * @private
         */
        var active = false;

        /**
         * frame type
         * @private
         */
        var getFrameType = 0;

        /**
         * timeout for browsers that don't support animationFrame
         * @private
         */
        var timeout = 1000 / 30;


        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };

        /**
         * get next animation id
         * @return {int}
         */
        function nextAID() {
            return animationUid++;
        }


        //==================================================================
        // Methods
        //==================================================================
        this.initialize = function(){
            getFrameType = $.support.animationFrameType;
        };

        /**
         * start ticking
         */
        function startTicking(){
            //console.log('startTicking:',active);
            if (!active){
                active = true;
                requestTick();
            }
        }

        /**
         * set callback for animation frame
         * @private
         */
        function requestTick(){
            requestFrame( tick );
        }

        /**
         * set callback for animation frame
         * @param {Function} callback
         */
        function requestFrame(callback){
            if ( getFrameType == 1 )
                $.window.requestAnimationFrame( callback );
            else if ( getFrameType == 2 )
                $.window.mozRequestAnimationFrame( callback );
            else if ( getFrameType == 3 )
                $.window.webkitRequestAnimationFrame( callback );
            else if ( getFrameType == 4 )
                $.window.oRequestAnimationFrame( callback );
            else
                setTimeout( callback, timeout );
        }

        /**
         * registers a animation with the framework
         * @param name
         * @param {lola.animation.Animation} animation
         */
        this.register = function( name, animation ){
            //console.log('$.animation.registerAnimation', name, animation );
            animations[ name ] = animation;
        };

        /**
         * removes a registered animation
         */
        this.remove = function( name ){
            //console.log('$.animation.registerAnimation', name, animation );
            if (animations[name]){
                delete animations[name];
            }
        };

        /**
         * starts the referenced animation
         * @param {uint} name
         * @private
         */
        this.start = function( name ){
            //console.log('$.animation.start', name );
            if (animations[ name ]){

                animations[ name ].start();
            }
        };

        /**
         * stops the referenced animation
         * @param {uint} name
         */
        this.stop = function( name ){
            //console.log('$.animation.stop', name );
            if (animations[ name ]){
                animations[ name ].stop();
            }
        };

        /**
         * pauses the referenced animation
         * @param {uint} name
         */
        this.pause = function( name ){
            //console.log('$.animation.pause', name );
            if (animations[ name ]){
                animations[ name ].pause();
            }
        };

        /**
         * resumes the referenced animation
         * @param {uint} name
         */
        this.resume = function( name ){
            //console.log('$.animation.resume', name );
            if (animations[ name ]){
                animations[ name ].resume();
            }
        };


        /**
         * executes a frame tick for animationing engine
         * @private
         */
        function tick(){
           //iterate through animations and check for active state
            //if active, run position calculation on animations
            var activityCheck = false;
            var now = $.now();
            //console.log('$.animation.tick', now );

            for (var k in animations){
                //console.log('   ',k,animations[k].isActive());
                if (animations[k].isActive()){
                    activityCheck = true;
                    if ( !animations[k].isComplete() ){
                        //console.log('   ','not complete');
                        animations[k].enterFrame( now );
                    }
                    else{
                        //console.log('   ','complete');
                        //catch complete on next tick
                        $.event.trigger(animations[k],'animationcomplete',false,false);
                        delete animations[k];
                        freeAnimationIds.push( parseInt(k) );
                    }
                }
            }

            if (activityCheck){
                requestTick();
            }
            else {
                active = false;
            }
        }

        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {

        };


        //==================================================================
        // Classes
        //==================================================================
        this.Animation = function( tickFn, tickScope ) {
	        var $ = lola;
            var startTime = -1;
            var pauseTime = -1;
            var delay = 0;
            var lastTime = -1;
            var active = false;
            var complete = false;
            var tick = (typeof tickFn === "function")?tickFn:function(){ return false;};

            this.enterFrame = function( now ){
                var delta = now - lastTime;
                var elapsed = now - startTime;
                lastTime = now;
                active = tick.call( tickScope, now, delta, elapsed );
            };

            this.isActive = function(){
                return active;
            };
            this.isComplete = function(){
                return complete;
            };

            this.start = function(){
                if (!active){
                    this.restart();
                }
            };

            this.pause = function(){
                if (active){
                    active = false;
                    pauseTime = $.now();
                    $.event.trigger( self, 'animationpause',false,false);
                }
            };

            this.resume = function(){
                if (!active){
                    active = true;
                    startTime += $.now() - pauseTime;
                    startTicking();
                    $.event.trigger( self, 'animationresume',false,false);
                }
            };

            this.restart = function(){
                active = true;
                complete = false;
                startTime = lastTime = $.now();
                startTicking();
                $.event.trigger( self, 'animationstart',false,false);
            };

            this.stop = function(){
                active = false;
                complete = true;
                $.event.trigger( self, 'animationstop',false,false);
            };

            return this;
        };


    };

	//register module
	lola.registerModule( new Module() );

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
	/**
	 * CSS Module
	 * @namespace lola.css
	 */
    var Module = function(){
		var $ = lola;
		var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "css";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ["type","math.color"];

        /**
         * cache for fixed/mapped style properties
         * @private
         */
        var propertyCache = {};

        /*
         * cache for fixed/mapped selectors
         * @private
         */
        //var selectorCache = {};

        /**
         * style property hooks
         * @private
         */
        var propertyHooks = {};
        this.getPropertyHooks = function(){ return propertyHooks; };

        /**
         * references to dynamic stylesheets
         * @private
         */
        var stylesheets = {};


        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * initializes module
         * @public
         * @return {void}
         */
        this.initialize = function() {
            $.syslog( 'lola.css::initialize' );

            //add default hooks
            var dimensionals = "padding margin background-position-x background-position-y border-top-width border-right-width border-bottom-width "+
                "border-left-width border-width bottom font-size height left line-height list-style-position "+
                "margin margin-top margin-right margin-bottom margin-left max-height max-width min-height "+
                "min-width outline-width padding padding-top padding-right padding-bottom padding-left right "+
                "text-indent top width";

            dimensionals.split(' ').forEach( function( item ){
                self.registerStyleHook( item, dimensionalHook );
            });

            //add default mappings
            propertyCache['float'] = ($.support.cssFloat) ? 'cssFloat' : 'styleFloat';

            //register default hooks
            var getOffsetStyle = function( node, style, value, type ){
                var result = self.style( node, style, value, false );
                if (result == "auto"){
                    //get actual value
                    var offset = $.geometry.getOffset( node, node.offsetParent );
                    return offset[type]+'px';
                }
                return result;
            };
            self.registerStyleHook( 'top', function( node, style, value ){
                return getOffsetStyle(node, style, value, 'y');
            });
            self.registerStyleHook( 'left', function( node, style, value ){
                return getOffsetStyle(node, style, value, 'x');
            });

            //remove initialization method
            delete self.initialize;
        };

        /**
         * returns whether or not an object can have styles applied
         * @param {*} obj
         */
        function canStyle( obj ) {
            //TODO: Implement canStyle function
            return obj != false;
        }

        /*
         * gets mapped selector string
         * @param {String} selector
         * @return {String}

        function getSelector( selector ) {
            if ( !selectorCache[selector] )
                selectorCache[selector] = $.string.camelCase( selector );
            return selectorCache[selector];
        }*/

        /**
         * gets mapped selector string
         * @param {String} property
         * @return {String}
         */
        function getProperty( property ) {
            if ( !propertyCache[property] )
                propertyCache[property] = $.string.camelCase( property );
            return propertyCache[ property ];
        }

        /**
         * gets/sets style on an object
         * @public
         * @param {Node} node styleable object
         * @param {String} style style property
         * @param {*} value leave undefined to get style
         * @param {Boolean} useHooks set to
         * @return {*}
         */
        this['style'] = function( node, style, value, useHooks ) {

            //make sure style can be set
            var prop = getProperty( style );
            if ( canStyle( node ) ) {
                if ( propertyHooks[ prop ] != null && useHooks !== false ) {
                    return propertyHooks[prop].apply( node, arguments );
                }
                else {
	                var result;
                    if ( value == undefined ){
	                    result =  self.rawStyle( node, prop );
	                    if ( !result || result == "" ){
		                    result = self.getComputedStyle( node, prop );
	                    }
	                    return result;
                    }
                    else
                        return self.rawStyle( node, prop, value );
                }
            }

            return false;
        };

        /**
         * gets raw style of an object
         * @public
         * @param {Node} node styleable object
         * @param {String} style style property
         * @param {*}value
         * @return {String|undefined|Boolean}
         */
        this.rawStyle = function( node, style, value ){
	        if ( canStyle( node ) ) {
		        var prop = getProperty( style );
		        if (value == undefined)
			        return node.style[prop];
		        else
			        return node.style[ prop ] = value;
	        }
	        return false;
        };

		/**
		 * gets computed style for node
		 * @param node
		 * @param style
		 * @return {*}
		 */
        this.getComputedStyle = function( node, style ){
            var compStyle,result;
            var prop = getProperty( style );
            if ( document.defaultView && document.defaultView.getComputedStyle ) {
                //console.log( document.defaultView );
                //console.log( document.defaultView.getComputedStyle );
                compStyle = document.defaultView.getComputedStyle( node, undefined );
            }

            if (compStyle){
                //console.log( 'using getComputedStyle', compStyle );
                result = compStyle.getPropertyValue( lola.string.dashed(prop) );
                if (result == "" && compStyle[prop] == undefined )
                    result = undefined;
            }
            else if ( typeof(document.body.currentStyle) !== "undefined") {
                //console.log( 'using currentStyle', node["currentStyle"] );
                result = node["currentStyle"][prop];
            }
            else {
                result = undefined;
            }

            return result;
        };


        /**
         * registers hook for style property
         * @param {String} style
         * @param {Function} fn function(obj, style, value):*
         */
        this.registerStyleHook = function( style, fn ){
            var prop = getProperty( style );
            propertyHooks[ prop ] = fn;
        };

        /**
         * sets a dimension style with or without units
         * gets a dimensional style with no units
         * @param alias
         * @param {String|Array} style
         * @private
         */
        this.registerStyleAlias = function( alias, style ){
            $.debug('registerStyleAlias', alias, style );
	        var styles = ( $.type.get(style) == "array") ? style : [style];
            var fnc = function( o, s, v ){
                var result;
                if (v == undefined) {
                    result = self.rawStyle( o, styles[0] );
                }
                else {
	                styles.forEach( function( s ){
		                result = self.rawStyle( o, s, v );
	                });
                }
                return result;
            };

            self.registerStyleHook( alias, fnc );
        };

        /**
         * sets a dimension style with or without units
         * gets a dimensional style with no units
         * @param obj
         * @param style
         * @param value
         * @private
         */
        function dimensionalHook( obj, style, value ){
            var result;
            if (value == undefined) {
                result = self.rawStyle( obj, style );
	            if ( !result || result == "" ){
		            result = self.getComputedStyle( obj, style );
	            }
	            if (String(result).match($.regex.isDimension))
                    result = parseFloat(result.replace( $.regex.isDimension, "$1"));
            }
            else {
                value = (String(value).match($.regex.isDimension) || value == 'auto' || value == 'inherit') ? value : value+"px";
                result = self.rawStyle( obj, style, value );
            }

            return result;
        }

        /**
         * adds a stylesheet to the document head with an optional source
         * @param {String|undefined} id reference id for stylesheet
         * @param {String|undefined} source url for external stylesheet
         */
        this.addStyleSheet = function( id, source ) {
            $.syslog('addStyleSheet',$.support.cssRules, id, source );
            var stylesheet;
            if ($.support.cssRules){
                stylesheet = document.createElement( 'style' );
                $.dom.attr(stylesheet, "type", "text/css");
            }
            else{
                stylesheet = document.createStyleSheet();
            }
            var head = document.getElementsByTagName("head")[0];
            head.appendChild( stylesheet );


            if (source) {
                stylesheet.source = source;
            }
            if (id) {
                self.registerStyleSheet( stylesheet, id );
            }
        };


        /**
         * registers a stylesheet with the css module
         * @param {Node} stylesheet stylesheet object reference
         * @param {String} id the id with which to register stylesheet
         */
        this.registerStyleSheet = function( stylesheet, id ) {
            stylesheets[ id ] = stylesheet;
        };

        /**
         * adds a selector to a stylesheet
         * @param {String} selector
         * @param {Object} styles an object containing key value pairs of style properties and values
         * @param {String|Object|undefined} stylesheet registered stylesheet id or stylesheet reference
         * @return {Object}
         */
        this.addSelector = function( selector, styles, stylesheet ) {
            if ($.type.get(stylesheet) == "string" ){
                stylesheet = stylesheets["_default"];
            }
            stylesheet = stylesheet || stylesheets["_default"];
            styles = styles || [];

            var ri = $.support.cssRules ? stylesheet.cssRules.length : stylesheet.rules.length;
            if ( stylesheet.addRule )
                stylesheet.addRule( selector, null, ri );
            else
                stylesheet.insertRule( selector + ' { }', ri );

            var rule = $.support.cssRules ? stylesheet.cssRules[ri] : stylesheet.rules[ri];
            if ( styles ){
                var props = styles.keys();
                props.forEach( function( item ){
                    self.style( rule, item, styles[item] );
                });
            }

            return rule;
        };

        /**
         * performs action on matching rules
         * @param {String} selector
         * @param {Function} action
         * @param {String} media
         */
        this.performRuleAction = function( selector, action, media ) {
            selector = selector.toLowerCase();
            media = media ? media.toLowerCase() : '';
            for ( var si = 0; si < document.styleSheets.length; si++ ) {
                var ss = document.styleSheets[si];
                //match media
                if ( !media || media == ss.mediaText ) {
                    var rules = ($.support.cssRules) ? ss.cssRules : ss.rules;
                    for ( var ri in rules ) {
                        if ( rules.hasOwnProperty(ri)){
                            if ( rules[ri] && rules[ri].selectorText ) {
                                if ( rules[ri].selectorText.toLowerCase() == selector ) {
                                    //console.info( 'matched rule: ' + rules[ri].selectorText );
                                    action( si, ri );
                                }
                            }
                        }
                    }
                }
            }
        };

        /**
         * returns an array of matching rules
         * @param {String} selector
         * @param {String} media
         * @return {Array}
         */
        this.getRules = function( selector, media ) {
            var rules = [];
            self.performRuleAction( selector, function( si, ri ) {
                if ( $.support.cssRules )
                    rules.push( document.styleSheets[ si ].cssRules[ ri ] );
                else
                    rules.push( document.styleSheets[ si ].rules[ ri ] );
            }, media );
            return rules;
        };

        /**
         * updates rules in matching selectors
         * @param {String} selector
         * @param {Object} styles an object containing key value pairs of style properties and values
         * @param {String} media
         * @return {Array}
         */
        this.updateRules = function( selector, styles, media ) {
            var rules = self.getRules( selector, media );
            var props = styles.keys();
            props.forEach( function( item ){
                rules.forEach( function( rule ){
                    self.style( rule, item, styles[item] );
                });
            });

            return rules;
        };

        /**
         * deletes matching rules
         * @param selector
         * @param media
         */
        this.deleteRules = function( selector, media ) {
            self.performRuleAction( selector, function( si, ri ) {
                if ( $.support.cssRules )
                    document.styleSheets[ si ].deleteRule( ri );
                else
                    document.styleSheets[ si ].removeRule( ri );
            }, media );
        };

        /**
         * gets or sets an objects classes
         * @param {Node} obj
         * @param {String|Array|undefined} classes leave undefined to get classes
         * @return {Array}
         */
        this.classes = function( obj, classes ) {
            if ( classes != undefined ) {
                //console.log('setting classes:', classes);
                if ( $.type.get( classes ) != 'array' ) {
                    if ( $.type.get( classes ) == 'string' )
                        classes = [classes];
                    else
                        classes = [];
                }
                obj.className = classes.join( " " );
                return classes;

            }
            else {
                var names = (obj && obj.className) ? obj.className.replace( $.regex.extraSpace , " " ): "";
                return names.split( " " ).reverse();
            }
        };

        /**
         * returns
         * @param obj
         * @param className
         */
        this.hasClass = function( obj, className ) {
            var names = self.classes( obj );
            return $.array.isIn( names, className );
        };

        /**
         * adds class to object if not already added
         * @param {Node} obj
         * @param {String} className
         */
        this.addClass = function( obj, className ) {
            //console.log('$.addClass: ',obj, className);
            var names = self.classes( obj );
            if ( names.indexOf( className ) == -1 ) {
                names.push( className );
                self.classes( obj, names );
            }
        };

        /**
         * removes a class from an object
         * @param {Node} obj
         * @param {String} className
         */
        this.removeClass = function( obj, className ) {
            var names = self.classes( obj );
            //console.log('$.removeClass: ', className);
            var index = names.indexOf( className );
            if ( index >= 0 ) {
                names.splice( index, 1 );
                self.classes( obj, names );
            }
        };

        /**
         * removes an objects style property
         * @param obj
         * @param style
         */
        this.clearStyle = function( obj, style ) {
            delete obj.style[ getProperty( style ) ];
        };

        var prefixes = ["-webkit-", "-moz-", "-ms-", "-o-"];
        this.prefix = function( type, updateStyleSheets ){
            var prf = "";
            var $div =  $( document.createElement('div') );
            //$.debug("prefix css:",type);
            prefixes.forEach( function( prefix ){
                var val = $div.style( prefix + type );
                //$.debug("    ",prefix + type+":", lola.type.get(val), val);
                if (val != null && val != undefined){
                    //add alias hook
                    self.registerStyleAlias( prefix+type, type );

                    if (updateStyleSheets){
                        //update stylesheets
                        //TODO: update prefixes in stylesheets
                    }
                }
            });
        };



        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {
	        /**
	         * sets or gets element css property
	         * @param {String} property
	         * @param {*} value
	         */
	        style: function( property, value ) {
		        return this._( self.style, property, value );
	        },

	        /**
	         * sets or gets element css property
	         * @param {String} property
	         * @param {*} value
	         */
	        rawStyle: function( property, value ) {
		        return this._( self.rawStyle, property, value );
	        },

	        /**
             * sets or gets classes for elements
             * @param {String|Array|undefined} values
             */
            classes: function( values ) {
                return this._( self.classes, values );
            },

            /**
             * checks that all elements in selector have class
             * @param {String} name
             */
            hasClass: function( name ) {
                return this.every( function( item ) {
                    return self.hasClass( item, name )
                } );
            },

            /**
             * adds class to all elements
             * @param {String} name
             */
            addClass: function( name ) {
                return this.s( self.addClass, name );
            },

            /**
             * removes class from all elements
             * @param {String} name
             */
            removeClass: function( name ) {
                return this.s( self.removeClass, name );
            }

        };

        //==================================================================
        // Classes
        //==================================================================
        this.Color = function( value ){
	        var $ = lola;
	        var self = this;
            var c = $.math.color;
            /**
             * rgba color value object
             * @private
             */
            var rgb;

            /**
             * hsl color value object
             * @private
             */
            var hsl;

            /**
             * hex color value object
             * @private
             */
            var hex;

            /**
             * get rgba object
             * @return {Object}
             */
            this.getRgbValue = function(){
                return rgb;
            };

            /**
             * get hsla object
             * @return {Object}
             */
            this.getHslValue = function(){
                return hsl;
            };

            /**
             * get hsla object
             * @return {Object}
             */
            this.getHexValue = function(){
                return hex;
            };

            /**
             * parses style color values
             * @public
             * @param {String|Object} val
             */
            function parseValue( val ) {
                if (typeof val == "string"){
                    var cparts = val.match( $.regex.isColor );
                    if ( cparts ) {
                        var parts;
                        switch ( cparts[1] ) {
                            case '#':
                                parts = val.match( $.regex.isHexColor );
                                hex = ( parts != null ) ? parts[1] : "000000";
                                rgb = c.hex2rgb(hex);
                                hsl = c.rgb2hsl( rgb.r, rgb.g, rgb.b );
                                rgb.a = hsl.a = 1;
                                break;
                            case 'rgb':
                            case 'rgba':
                                rgb = parseRGBColorString( val );
                                hex = c.rgb2hex( rgb.r, rgb.g, rgb.b );
                                hsl = c.rgb2hsl( rgb.r, rgb.g, rgb.b );
                                break;
                            case 'hsl':
                            case 'hsla':
                                hsl = parseHSLColorString( val );
                                rgb = c.hsl2rgb(hsl.h,hsl.s,hsl.l);
                                hex = c.rgb2hex(rgb.r, rgb.g, rgb.b);
                                rgb.a = hsl.a;
                                break;
                        }
                    }
                }
                else{
                    if ( val.r != undefined && val.g != undefined && val.b != undefined){
                        //rgba
                        rgb = val;
                        hex = c.rgb2hex( rgb.r, rgb.g, rgb.b );
                        hsl = c.rgb2hsl( rgb.r, rgb.g, rgb.b );
                    }
                    else if ( val.h != undefined && val.s != undefined && val.l != undefined){
                        hsl = val;
                        rgb = c.hsl2rgb(hsl.h,hsl.s,hsl.l);
                        hex = c.rgb2hex(rgb.r, rgb.g, rgb.b);
                    }

                    if (val.a != undefined){
                        rgb.a = val.a;
                        hsl.a = val.a;
                    }
                    else{
                        rgb.a = 1;
                        hsl.a = 1;
                    }
                }
            }

            /**
             * parses an HSL or HSLA color
             * @param {String} val
             * @private
             * @return {Object}
             */
            function parseHSLColorString( val ) {
                var c = { h:0, s:0, l:0, a:1 };
                var parts = val.match( $.regex.isHSLColor );
                if ( parts != null ) {
                    var v = parts[1].replace( /\s+/g, "" );
                    v = v.split( ',' );
                    c.h = parseColorPart( v[0], 360  );
                    c.s = parseColorPart( v[1], 1  );
                    c.l = parseColorPart( v[2], 1  );
                    c.a = (v.length > 3) ? parseColorPart( v[3], 1 ) : 1;
                }
                return c;
            }

            /**
             * parses an RGB or RGBA color
             * @param {String} val
             * @private
             * @return {Object}
             */
            function parseRGBColorString( val ) {
                var c = { r:0, g:0, b:0, a:1 };
                var parts = val.match( $.regex.isRGBColor );
                if ( parts != null ) {
                    var v = parts[1].replace( /\s+/g, "" );
                    v = v.split( ',' );
                    c.r = parseColorPart( v[0], 255  );
                    c.g = parseColorPart( v[1], 255  );
                    c.b = parseColorPart( v[2], 255  );
                    c.a = (v.length > 3) ? parseColorPart( v[3], 1 ) : 1;
                }
                return c;
            }

            /**
             * parses color part value
             * @private
             * @param {String} val
             * @param divisor
             * @return {Number}
             */
            function parseColorPart( val, divisor ) {
                if ( val ) {
                    if ( val.indexOf( '%' ) > 0 )
                        return parseFloat( val.replace( /%/g, "" ) ) / 100;
                    else
                        return parseFloat( val ) / divisor;
                }
                return 0;
            }

            /**
             * returns the uint value of color object
             * @return {uint}
             */
            this.toInt = function() {
                return parseInt("0x" + hex );
            };

            /**
             * outputs a css color hex string
             * @return {String}
             */
            this.toHexString = function() {
                return "#" + hex;
            };

            /**
             * outputs a css color hsl string
             * @param {Boolean} alpha
             * @return {String}
             */
            this.toHslString = function( alpha ) {
                return (alpha?"hsla":"hsl")+"("+
                    Math.round( hsl.h * 360 )+","+
                    Math.round( hsl.s * 100 )+"%,"+
                    Math.round( hsl.l * 100 )+"%"+
                    (alpha?","+hsl.a:"")+")";
            };

            /**
             * outputs a css color hsla string
             * @return {String}
             */
            this.toHslaString = function() {
                return self.toHslString( true );
            };

            /**
             * outputs a css color rgb string
             * @param {Boolean} alpha
             * @return {String}
             */
            this.toRgbString = function(alpha) {
                return (alpha?"rgba":"rgb")+"("+
                    Math.round( rgb.r * 255 )+","+
                    Math.round( rgb.g * 255 )+","+
                    Math.round( rgb.b * 255 )+
                    (alpha?","+rgb.a:"")+")";
            };

            /**
             * outputs a css color rgba string
             * @return {String}
             */
            this.toRgbaString = function() {
                return self.toRgbString(true)
            };

            parseValue(value);
            return this;
        };


        //==================================================================
        // Preinitialization
        //==================================================================
        //TODO:this breaks in IE browsers and needs to be fixed
        //add default stylesheet for dynamic rules
        //self.addStyleSheet( "_default" );

    };

	//register module
	lola.registerModule( new Module() );

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
	/**
	 * HTTP Request Module
	 * @namespace lola.http
	 */
    var Module = function(){
		var $ = lola;
		var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "http";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ["event","type","string"];

        /**
         * storage for cached xsl requests
         * @private
         */
        var xslCache = {};


        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * @descripiton applies transformation using results of two requests
         * @public
         * @param {Request} xmlDoc
         * @param {Request} xslDoc
         * @param {Object} xslParams
         */
        this.transform = function( xmlDoc, xslDoc, xslParams ) {
            var children,k;
            if ( window.ActiveXObject ) {
                //TODO: Test this in IE I've got no clue if it will work or not.
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
                    if (xslParams.hasOwnProperty(k)){
                        xsltProcessor.setParameter( k, xslParams[k] ); //null, k, xslParams[k] );
                    }
                }
                var resultDocument = xsltProcessor.transformToFragment( xmlDoc, document );
                if ( resultDocument ) {
                    children = resultDocument.childNodes;
                }
            }

            return children;
        };

        /**
         * caches xsl request
         * @public
         * @param {String} id
         * @param {lola.http.Request} xsl
         */
        this.cacheXsl = function( id, xsl ){
            xslCache[ id ] = xsl;
        };

        /**
         * replaces "<" ">" "&" with "&lt;" "&gt;" "&amp;"
         * @param {String} str
         */
        this.encode = function( str ) {
            if ( typeof str == 'string' ) {
                str = str.replace( /</g, '&lt;' );
                str = str.replace( />/g, '&gt;' );
                str = str.replace( /&/g, '&amp;' );
            }
            return str;
        };

        /**
         * replaces "&lt;" "&gt;" "&amp;" with "<" ">" "&"
         * @param {String} str
         */
        this.unencode = function( str ) {
            if ( typeof str == 'string' ) {
                str = str.replace( /\$lt;/g, '<' );
                str = str.replace( /&gt;/g, '>' );
                str = str.replace( /&amp;/g, '&' );
            }
            return str;
        };

        /**
         * returns a parameterized string
         * @param paramObj
         * @return {String}
         */
        this.getParamString = function( paramObj ){
            if ( paramObj != undefined ) {
                if ( $.type.get( paramObj ) != 'string' ) {
                    var temp = [];
                    for ( var k in paramObj ) {
                        if (paramObj.hasOwnProperty(k)){
                            temp.push( k + "=" + self.encode( paramObj[k] ) );
                        }
                    }
                    return temp.join( '&' );
                }
            }

            return "";
        };


        //==================================================================
        // Selection Methods
        //==================================================================

        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {
            applyTransform: function( transform, interimContent, faultContent ) {
                this.html( interimContent );
                this.forEach( function(item){
                    $.event.addListener( transform, 'result', function( event ) {
                        $( item ).html( event.data );
                    } );
                    $.event.addListener( transform, 'fault', function() {
                        $( item ).html( faultContent );
                    } );
                });

                transform.send();

                return this;
            },
            /**
             * loads a request's content into elements
             * @param {lola.http.AsyncRequest|lola.http.Request|lola.http.SyncRequest} request
             * @param {Object} requestParams
             * @param {*} interimContent
             * @param {*} faultContent
             */
            applyRequest: function( request, requestParams, interimContent, faultContent ) {
                this.html( interimContent );
                this.forEach( function(item){
                    $.event.addListener( request, 'result', function( event ) {
                        $( item ).html( event.currentTarget.responseText() );
                    } );
                    $.event.addListener( request, 'fault', function() {
                        $( item ).html( faultContent );
                    } );
                });

                request.send();
                return this;
            },

            /**
             * loads http content into elements asynchronously
             * @param {String} url
             * @param {*} interimContent
             * @param {*} faultContent
             */
            loadContent: function( url, interimContent, faultContent ){
                var request = new $.http.AsyncRequest( url, 'get', [] );
                this.applyRequest( request, {}, interimContent, faultContent);
                return this;
            }
        };


        //==================================================================
        // Classes
        //==================================================================
        /**
         * Base HTTP Request Class
         * @class
         * @private
         * @param {String} url request url
         * @param {String} method request method
         * @param {Array} headers request headers
         * @param {Boolean} async execute request asyncronously
         * @param {String} user credentials username
         * @param {String} password credentials password
         */
        var Request = function( url, method, headers, async, user, password ) {
	        var $ = lola;
	        var parent = self;
            var self = this;
            /**
             * DOM xmlhttprequest
             * @private
             */
            var request = false;

            /**
             * readyFlag
             * @private
             */
            var ready = false;

            /**
             * returns readystate
             * @return {Boolean}
             */
            this.ready = function(){
                return ready;
            };

            /**
             * initializes class
             * @private
             */
            function initialize(){
                method = method || 'POST';
                headers = headers || [];
                async = async == undefined ? true : async;
                user = user || null;
                password = password || null;
            }

            /**
             * gets correct request object
             * @private
             */
            var getRequestObject = function() {
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
            };

            function overrideMimeType( type ){
                if (request.hasOwnProperty('overrideMimeType')){
                    request.overrideMimeType( type );
                    return true;
                }

                return false;
            }

            /**
             * send request
             * @public
             * @param {Object|String|undefined} data
             * @return {lola.http.Request}
             */
            this.send = function( data ) {
                request = getRequestObject();
                request.open( method, url, async, user, password );
                for ( var k in headers ) {
                    if (headers.hasOwnProperty(k)){
                        request.setRequestHeader( k, headers[k] );
                    }
                }
                request.onreadystatechange = function() {
                    readyStateChange.call( self )
                };
                request.send( data );

                return request;
            };

            /**
             * ready state change listener
             * @private
             */
            function readyStateChange() {
                if ( request ) {
                    switch ( request.readyState ) {
                        case 0:
                            //uninitialized
                            break;
                        case 1:
                            //loading
                            $.event.trigger( self, 'loading', true, true, request );
                            break;
                        case 2:
                            //loaded
                            $.event.trigger( self, 'loaded', true, true, request );
                            break;
                        case 3:
                            //interactive
                            $.event.trigger( self, 'interactive', true, true, request );
                            break;
                        case 4:
                            //complete
                            $.event.trigger( self, 'statecomplete', true, true, request );
                            if ( request.status == 200 && !ready ) {
                                ready = true;
                                $.event.trigger( self, 'result', true, true, request );
                            }
                            else if ( request.status >= 400 ) {
                                console.info( 'AsyncRequest.readyStateChange.fault:', url );
                                $.event.trigger( self, 'fault', false, false, request );
                            }
                            break;
                    }
                }
            }

            /**
             * get raw response text
             * @return {String}
             */
            this.responseText = function() {
                if ( ready || !async)
                    return request.responseText;
                else
                    return false;
            };

            /**
             * get response xml document
             * @return {XML}
             */
            this.responseXML = function() {
                if ( ready || !async )
                    return request.responseXML;
                else
                    return false;
            };


            initialize();

            return this;
        };

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
        this.AsyncRequest = function( url, method, headers, user, password ) {
            return new Request( url, method, headers, true, user, password );
        };

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
        this.SyncRequest = function( url, method, headers, user, password ) {
            return new Request( url, method, headers, false, user, password );
        };

        /**
         * AJAX Transform Class
         * @param {lola.http.Request} xml request object
         * @param {lola.http.Request|String} xsl request object or string id for cached xsl
         * @param {Object} transformParams
         * @param {String|undefined} xslCacheId if set xsl will be cached with the specified id
         */
        this.Transform = function( xml, xsl, transformParams, xslCacheId ) {
	        var $ = lola;
	        var parent = self;
            var self = this;
            /**
             * holds transformation result
             * @type {Array}
             */
            var resultNodes = [];

            /**
             * result nodes getter
             * @return {Array}
             */
            this.resultNodes = function(){
                return resultNodes;
            };

            /**
             * initializes class
             * @private
             */
            function initialize() {
                xslCacheId = xslCacheId || "";
                if ( $.type.get( xsl ) == 'string' ) {
                    var xslId = xsl;
                    xsl = parent.getCachedXsl( xslId );
                    if ( !xsl ) {
                        throw new Error( 'unknown xsl cache id: "' + xslId + '"' );
                    }
                }
                else {
                    this.xsl = xsl;
                }

                if ( this.xsl && this.xml ) {
                    $.event.addListener( this.xsl, 'result', checkStates, true, 0, this );
                    $.event.addListener( this.xsl, 'fault', handleXSLFault, true, 0, this );
                    $.event.addListener( this.xml, 'result', checkStates, true, 0, this );
                    $.event.addListener( this.xml, 'fault', handleXMLFault, true, 0, this );

                    checkStates();
                }
                else {
                    throw new Error( 'transform error!' );
                }
            }

            /**
             * checks the states of both requests to see if the transform can be applied
             * @private
             */
            function checkStates() {
                if ( xml.ready() && xsl.ready() ) {
                    //cache xsl request if id set
                    if (xslCacheId && xslCacheId != "") {
                        parent.cacheXsl( xslCacheId, xsl );
                    }

                    //both requests are ready, do transform
                    resultNodes = parent.transform( xml.responseXML(), xsl.responseXML(), transformParams );
                    $.event.trigger( self, 'result', true, true, resultNodes );
                }
            }

            /**
             *  handles xsl fault
             * @private
             */
            function handleXSLFault() {
                $.event.trigger( self, 'fault', true, true, 'xsl fault' );
            }

            /**
             *  handles xml fault
             * @private
             */
            function handleXMLFault() {
                $.event.trigger( self, 'fault', true, true, 'xml fault' );
            }

            /**
             * sends the transform requests if not yet sent
             * @public
             */
            this.send = function( xmlParams, xslParams ) {
                if ( !xml.ready() ) {
                    xml.send( xmlParams );
                }
                if ( !xsl.ready() ){
                    xsl.send( xslParams );
                }
            };

            /**
             *  cancels transform request... aborts requests and removes listeners
             * @public
             */
            this.cancel = function() {
                $.event.removeListener( xsl, 'result', checkStates, true );
                $.event.removeListener( xsl, 'fault', handleXSLFault, true );
                $.event.removeListener( xml, 'result', checkStates, true );
                $.event.removeListener( xml, 'fault', handleXMLFault, true );
                try {
                    xsl.abort();
                }
                catch(e){}
                try {
                    xml.abort();
                }
                catch(e){}
            };

            initialize();

            return this;
        };

    };


	//register module
	lola.registerModule( new Module() );

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
	/**
	 * JSON Module adapted from json.org code
	 * @implements {lola.Module}
	 * @memberof lola
	 */
    var Module = function(){
		var $ = lola;
		var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "json";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ["http"];

        /**
         * json parsing vars
         * @private
         */
        var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        var gap = null;
        var indent = null;
        var meta = {    // table of character substitutions
                '\b': '\\b',
                '\t': '\\t',
                '\n': '\\n',
                '\f': '\\f',
                '\r': '\\r',
                '"' : '\\"',
                '\\': '\\\\'
        };
        var rep = null;

        /**
         * map used for JSONp callbacks
         * @type {Object}
         * @private
         */
        var handleResponse = {};

        var ruid = 0;

        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };


        //==================================================================
        // Methods
        //==================================================================

        /**
         * json parsing method
         * @private
         * @param {String} string
         */
        function escapeQuotes( string ) {
            // If the string contains no control characters, no quote characters, and no
            // backslash characters, then we can safely slap some quotes around it.
            // Otherwise we must also replace the offending characters with safe escape
            // sequences.
            //this.escapable.lastIndex = 0;
            return escapable.test( string ) ?
                '"' + string.replace( escapable, function ( a ) {
                    var c = self.meta[a];
                    return typeof c === 'string' ? c :
                        '\\u' + ('0000' + a.charCodeAt( 0 ).toString( 16 )).slice( -4 );
                } ) + '"' :
                '"' + string + '"';
        }

        /**
         * json parsing method
         * @private
         * @param {String} key
         * @param {Object} holder
         */
        function str( key, holder ) {
            var i,          // The loop counter.
                k,          // The member key.
                v,          // The member value.
                length,
                mind = self.gap,
                partial,
                value = holder[key];

            // If the value has a toJSON method, call it to obtain a replacement value.
            if ( value && typeof value === 'object' &&
                typeof value.toJSON === 'function' ) {
                value = value.toJSON( key );
            }

            // If we were called with a replacer function, then call the replacer to
            // obtain a replacement value.
            if ( typeof rep === 'function' ) {
                value = rep.call( holder, key, value );
            }

            // What happens next depends on the value's type.
            switch ( typeof value ) {
                case 'string':
                    return escapeQuotes( value );

                case 'number':
                    // JSON numbers must be finite. Encode non-finite numbers as null.
                    return isFinite( value ) ? String( value ) : 'null';

                case 'boolean':
                case 'null':
                    // If the value is a boolean or null, convert it to a string. Note:
                    // typeof null does not produce 'null'. The case is included here in
                    // the remote chance that self gets fixed someday.
                    return String( value );

                case 'object':
                    // If the type is 'object', we might be dealing with an object or an array or null.
                    // Due to a specification blunder in ECMAScript, typeof null is 'object',
                    // so watch out for that case.
                    if ( !value ) {
                        return 'null';
                    }

                    // Make an array to hold the partial results of stringifying this object value.
                    self.gap += self.indent;
                    partial = [];

                    // Is the value an array?
                    if ( Object.prototype.toString.apply( value ) === '[object Array]' ) {

                        // The value is an array. Stringify every element. Use null as a placeholder
                        // for non-JSON values.
                        length = value.length;
                        for ( i = 0; i < length; i += 1 ) {
                            partial[i] = str( i, value ) || 'null';
                        }

                        // Join all of the elements together, separated with commas, and wrap them in
                        // brackets.
                        v = partial.length === 0 ? '[]' :
                            gap ? '[\n' + gap +
                                partial.join( ',\n' + gap ) + '\n' +
                                mind + ']' :
                                '[' + partial.join( ',' ) + ']';
                        gap = mind;
                        return v;
                    }

                    // If the replacer is an array, use it to select the members to be stringified.
                    if ( rep && typeof rep === 'object' ) {
                        length = rep.length;
                        for ( i = 0; i < length; i += 1 ) {
                            k = rep[i];
                            if ( typeof k === 'string' ) {
                                v = str( k, value );
                                if ( v ) {
                                    partial.push( escapeQuotes( k ) + (gap ? ': ' : ':') + v );
                                }
                            }
                        }
                    }
                    else {
                        // Otherwise, iterate through all of the keys in the object.
                        for ( k in value ) {
                            if ( Object.hasOwnProperty.call( value, k ) ) {
                                v = str( k, value );
                                if ( v ) {
                                    partial.push( escapeQuotes( k ) + (gap ? ': ' : ':') + v );
                                }
                            }
                        }
                    }

                    // Join all of the member texts together, separated with commas,
                    // and wrap them in braces.

                    v = partial.length === 0 ? '{}' :
                        gap ? '{\n' + gap + partial.join( ',\n' + gap ) + '\n' +
                            mind + '}' : '{' + partial.join( ',' ) + '}';
                    gap = mind;
                    return v;
            }

            return undefined;
        }

        /**
         * json encodes a javascript object
         * @public
         * @param {Object} obj
         * @return {String}
         */
        this.encode = function ( obj ) {
            return stringify( obj );
        };

        /**
         * decodes a json string
         * @public
         * @param {String} text
         * @return {Object}
         */
        this.decode = function ( text ) {
            return parse( text );
        };

        /**
         * json encodes a javascript object
         * @private
         * @param {Object} value
         * @param {Object} replacer
         * @param {String} space
         * @return {String}
         */
        function stringify( value, replacer, space ) {
            // The stringify method takes a value and an optional replacer, and an optional
            // space parameter, and returns a JSON text. The replacer can be a function
            // that can replace values, or an array of strings that will select the keys.
            // A default replacer method can be provided. Use of the space parameter can
            // produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

            // If the space parameter is a number, make an indent string containing that
            // many spaces.
            if ( typeof space === 'number' ) {
                for ( i = 0; i < space; i += 1 ) {
                    indent += ' ';
                }

            }
            else if ( typeof space === 'string' ) {
                // If the space parameter is a string, it will be used as the indent string.
                indent = space;
            }

            // If there is a replacer, it must be a function or an array.
            // Otherwise, throw an error.
            rep = replacer;
            if ( replacer && typeof replacer !== 'function' &&
                (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number') ) {
                throw new Error( 'JSON.stringify' );
            }

            // Make a fake root object containing our value under the key of ''.
            // Return the result of stringifying the value.
            return str( '', {'': value} );

        }

        /**
         * decodes a json string
         * @private
         * @param text
         * @param reviver
         */
        function parse ( text, reviver ) {
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
            if ( cx.test( text ) ) {
                text = text.replace( cx, function ( a ) {
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

        }

        /**
         * makes an http request or adds script tag with jsonp callback
         * @param {String} urlStr
         * @param {Function} callback
         * @param {String} jsonpParam
         */
        this.get = function( urlStr, callback, jsonpParam ){
            $.syslog('json.get: '+urlStr);

            var url = new $.URL(urlStr);

            //determine how to load json
            if (url.protocol == "____" ||
                (false && url.protocol == $.url.protocol && url.domain == $.url.domain) ){
                //console.log('    same domain');
                //same protocol & domain... just do async call
                var r = new $.http.AsyncRequest(urlStr);
                if (callback) {
                    $(r).addListener('result', function(event){
                        $.syslog('    result');
                        var obj = self.parse( event.data.responseText );
                        callback(obj);
                    } );
                }

                r.send();

            }
            else {
                $.syslog('    cross domain');
                jsonpParam = jsonpParam ? jsonpParam : "jsonp";
                //assume this is a jsonp call and the server supports it.
                var uid = ruid++;
                self.handleResponse[uid] = function( obj ){
                    callback(obj);
                    delete self.handleResponse[uid];
                };
                url.vars[jsonpParam] = "lola.json.handleResponse["+uid+"]";
                $.loadScript( url.toString() );
            }
        };


        //==================================================================
        // Selection Methods
        //==================================================================
        this.selectorMethods = {};


        //==================================================================
        // Prototype Upgrades
        //==================================================================
        if ( typeof Date.prototype.toJSON !== 'function' ) {
            Date.prototype.toJSON = function ( key ) {
                return isFinite( this.valueOf() ) ?
                    this.getUTCFullYear() + '-' +
                        $.string.padFront( this.getUTCMonth() + 1,"0",2 ) + '-' +
                        $.string.padFront( this.getUTCDate(),"0",2 ) + 'T' +
                        $.string.padFront( this.getUTCHours(),"0",2 ) + ':' +
                        $.string.padFront( this.getUTCMinutes(),"0",2 ) + ':' +
                        $.string.padFront( this.getUTCSeconds(),"0",2 ) + 'Z' : null;
            };

            String.prototype.toJSON =
                Number.prototype.toJSON =
                    Boolean.prototype.toJSON = function ( key ) {
                        return this.valueOf();
                    };
        }


    };

	//register module
	lola.registerModule( new Module() );

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
    /**
     * Agent Module
     * @namespace lola.agent
     */
    var Module = function(){
	    var $ = lola;
	    var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "agent";

        /**
         * agents' dependencies (non-standard implementation)
         * @type {Object}
         * @private
         */
        var dependencies = {};

        /**
         * registration index
         * @private
         */
        var index = 0;

        /**
         * registration map
         * @private
         */
        var map = {};

        /**
         * initializers
         * @private
         */
        var agentDependencies = {};

        /**
         * initializers
         * @private
         */
        var initializers = [];



        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return ['event','data'];
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * initializes module
         * @public
         * @return {void}
         */
        this.initialize = function() {
            $.syslog('lola.agent::initialize');

            //check agent dependencies
            $.checkDependencies( this.dependencies );

            //execute agent initialization stack
            var stackSize = initializers.length;

            for ( var i = 0; i < stackSize; i++ ) {
                if ($.hasFn( initializers, i )){
                    initializers[i]();
                    delete initializers[i];
                }
            }

            //remove initialization method
            delete self.initialize;
        };

        /**
         * used to register an agent with the framework
         * @param {Object} agent object that implements the agent interface
         */
        this.registerAgent = function( agent ) {
            var ns = agent.namespace();
            $.syslog('register agent: '+ns);
            if ( ns && $.hasFn( agent,"sign" ) && $.hasFn( agent,"drop" ) ) {
                //setup module
                var pkg = $.getPackage( $.agent, ns, agent );

                //add dependencies
                if ($.hasFn(agent,'getDependencies'))
                    this.dependencies[ 'agent.'+ns ] = agent.getDependencies();

                //map agent
                map[ ns ] = pkg;

                //add initializer
                if ($.hasFn( agent,'initialize' )) {
                    initializers.push( function() {
                        agent.initialize();
                    });
                }

                //run preinitialization method if available
                if ($.hasFn( agent,'preinitialize' )) {
                    agent.preinitialize();
                }

            }
            else {
                console.error( 'invalid agent implementation: '+name );
            }
        };

        /**
         * assign a client to an agent
         * @param {Object} client
         * @param {String} name name of registered agent
         */
        this.assign = function( client, name ) {
            var agent = map[ name ];
            if (agent){
                agent.sign( client );
            }
            else {
                throw new Error("unknown agent: "+name);
            }
        };

        /**
         * drop a client from an agent
         * @param {Object} client
         * @param {String} name name of registered agent
         */
        this.drop = function( client, name ) {
            var agents = {};
            if (name == undefined){
                agents = map;
            }
            else if (typeof name == 'string'){
                name.split(',').forEach( function(item){
                    agents[ item ] = map[ item ];
                });
            }

            for (var i in agents){
                var a = agents[i];
                if (a){
                    a.drop( client );
                }
            }
        };

        //==================================================================
        // Selection Methods
        //==================================================================
        this.selectorMethods = {

            /**
             * assigns an agent to selector elements
             * @param {String} agentName name of registered agent
             */
            assignAgent: function( agentName ) {
                return this.s( self.assign, agentName );
            },

            /**
             * drops client from agent
             * @param {String} agentName name of registered agent
             */
            dropAgent: function( agentName ) {
                return this.s( self.drop, agentName );
            }

        };

        //==================================================================
        // Preinitialization
        //==================================================================
        $.addSafeDeleteHook( this.drop, this );

    };



	//register module
	lola.registerModule( new Module() );

})( lola );

/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Command
 *  Description: Command module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
    /**
     * Command Module
     * @namespace lola.cmd
     */
    var Module = function(){
	    var $ = lola;
	    var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "cmd";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [];

        /**
         * registry of commands
         * @private
         */
        var registry = {};

        /**
         * holds calls to unloaded commands
         * @private
         */
        var callLater = {};


        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * registers command with the module
         * @param {Class|String} cmd the command class or url of the class' js file
         * @param {String} name the name with which to register the command
         */
        this.register = function( cmd, name ) {
            if ( typeof cmd != "string" && name == undefined  ){
                var tmp = new cmd();
                name = tmp.getName();
            }

            $.syslog('register command: '+name);
            if ( registry[name] != null && typeof registry[name] != "string" )
                console.warn( 'command "'+name+'" has already been registered... overwriting' );

            //register command class or url
            registry[name] = cmd;

            $.event.addListener( self, name, executeCommand  );
        };

        this.call = function( name, params, onResult, onFault, onStatus ){
            var responder = new self.Responder( onResult, onFault, onStatus );
            self.execute( name, params, responder );
        };

        /**
         * executes a registered command
         * @param {String} name registered command name
         * @param {Object} params parameter object to be passed to command
         * @param {lola.cmd.Responder} responder responder object to handle command events
         */
        this.execute = function( name, params, responder ){
            if (registry[name]) {
                if ( typeof registry[name] == "string" ) {
                    //add execution params to call later queue for the unloaded command
                    if ( !callLater[ name ] ){
                        //try to load command
                        $.loadScript( registry[name], function(e){
                            if ( $.hasFn( registry, name ) ) {
                                //command successfully loaded - iterate through queued calls
                                var s = callLater[ name ].length;
                                for (var i = 0; i < s; i++){
                                    var o = callLater[ name ][i];
                                    self.execute( o.name, o.params, o.responder );
                                }
                                delete callLater[ name ];
                            }
                            else {
                                throw new Error('The command loaded from "'+registry[name]+'" is not named "'+name+'"');
                            }
                        });
                        callLater[ name ] = [];
                    }

                    var cmdObj = {name:name, params:params, responder:responder};
                    callLater[ name ].push( cmdObj );
                }
                else {
                    //try to execute command
                    var cmdClass = registry[ name ];
                    if (cmdClass) {
                        var cmd = new cmdClass();
                        if (responder) {
                            $.event.addListener( cmd, 'result', responder.handleResult );
                            $.event.addListener( cmd, 'fault', responder.handleFault );
                            $.event.addListener( cmd, 'status', responder.handleStatus );
                        }
                        cmd.execute( params );
                    }
                }
            }
            else {
                throw new Error('Unknown command type: '+name);
            }
            return responder;
        };

        /**
         * handles executing commands triggered via event model
         * @private
         * @param event
         */
        function executeCommand( event ){
            self.execute( event.type, event.data.parameters, event.data.responder );
        }

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
        this.Responder = function( resultHandler, faultHandler, statusHandler ){

            /**
             * last response event
             * @private
             */
            var lastResponse = undefined;

            /**
             * get last response
             * @return {Object|undefined}
             */
            this.getLastResponse = function(){
                return lastResponse;
            };

            /**
             * handle status events from command
             * @private
             * @param {Object} event
             */
            this.handleStatus = function( event ){
                if (!lastResponse || lastResponse.type == 'status' )
                    lastResponse = event;
                if (typeof statusHandler == 'function')
                    statusHandler.apply( $.window, [event] );
            };

            /**
             * handle result events from command
             * @private
             * @param {Object} event
             */
            this.handleResult = function( event ){
                lastResponse = event;
                if (typeof resultHandler == 'function')
                    resultHandler.apply($.window, [event] );
            };

            /**
             * handle fault events from command
             * @private
             * @param {Object} event
             */
            this.handleFault = function( event ){
                lastResponse = event;
                if (typeof faultHandler == 'function')
                    faultHandler.apply($.window, [event] );
            };

            return this;

        };

        /**
         * Data object for executing commands via event model
         * @param {Object} parameters parameter object
         * @param {lola.cmd.Responder} responder responder object
         */
        this.Data = function( parameters, responder ){
            this.parameters =function (){
                return parameters;
            };
            this.responder =function (){
                return responder;
            };
        };
    };

	//register module
	lola.registerModule( new Module() );

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
    /**
     * Array Module
     * @namespace lola.template
     */
    var Module = function(){
	    var $ = lola;
	    var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "template";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ["json"];

        /**
         * map of hooks & template hooks
         * @private
         */
        var hooks = {};


        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * initializes module
         * @public
         * @return {void}
         */
        this.initialize = function() {
            $.syslog('lola.template::initialize');

            //do module initialization
            //get all predefined templates
            var start = $.now();
            $('script[type="text/x-lola-template"]').forEach( function( item ){
                self.add( item.id, item.innerHTML );
            });
            var complete = $.now();
            $.syslog( "templates parsed in "+(complete-start)+" ms" );


            //remove initialization method
            delete self.initialize;
        };

        /**
         * creates and maps a template hook from the given string
         * @param {String} id template id
         * @param {String} str template contents
         */
        this.add = function( id, str ) {
            if (!id || id == "getValue")
                throw new Error("invalid template id");
            hooks[ id ] = new TemplateHook( str );
        };

        /**
         * add value hook
         * @param {String} id
         * @param {Function} fn function( value ):String
         */
        this.addHook = function( id, fn ){
            if (!id || id == "getValue")
                throw new Error("invalid hook id");

            hooks[ id ] = new Hook( fn );
        };

        /**
         * returns hook instance
         * @param {String} id
         * @return {lola.template.Hook}
         */
        function getHook(id){
            if ( !hooks[ id ] )
                throw new Error('hook "'+id+'" not found.');
            return hooks[ id ];
        }

        /**
         * applies the named template hook to the data
         * @param {String} name template name
         * @param {Object} data
         * @return {String}
         */
        this.apply = function( name, data ){
            var str = "";
            var tmp = getHook( name );
            if (tmp){
                str = tmp.evaluate( data );
            }
            return str;
        };


        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {
            /**
             * sets selector elements' html to the result of evaluating
             * the named template against the data object
             * @param {String} name
             * @param {Object} data
             */
            applyTemplate: function( name, data ){
                this.html( $.template.apply(name,data) );
            }
        };

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
        function Tag( str ) {
	        var $ = lola;
	        var parent = self;
            var self = this;
            /**
             * part splitter
             * @private
             */
            var rGetParts = /^([A-Za-z_$][A-Za-z0-9_$]*)(\[[^\]]+\])?(->[A-Za-z_$][A-Za-z0-9_$]*)?/;

            /**
             * tag property
             * @private
             */
            var property = "";

            /**
             * tag options
             * @private
             */
            var options = {};

            /**
             * tag hook
             */
            var hookName = "";


            /**
             * parses tag string
             * @param {String} str
             * @private
             */
            function parse( str ){
                var parts = str.match( this.rGetParts );
                if (parts){
                    property = parts[1];
                    parseOptions(parts[2]);
                    hookName = parts[3]?parts[3].replace(/-\>/g,""):"";
                }
            }

            /**
             * parses raw tag options
             * @param {String} raw
             * @private
             */
            function parseOptions(raw){
                if (raw){
                    raw = raw.slice(1,-1).trim();
                    var o = raw.split(',');
                    var index = 0;
                    var opts = {};
                    o.forEach( function(item){
                        var iparts = item.split(':');
                        if (iparts.length > 1){
                            opts[ iparts[0].trim() ]= iparts[1].trim();
                        }
                        else {
                            opts[ String(index) ] = iparts[0].trim();
                        }
                        index++;
                    });
                    options = opts;
                }
                else{
                    options = {};
                }
            }

            /**
             * outputs tag string
             * @return {String}
             */
            this.toString = function(){
                var keys = Object.keys(options);
                var opts = [];
                options.forEach( function( item, key ){
                    opts.push( key +":"+ item );
                });
                return property+"["+opts.join(",")+"]"+(hookName==""?"":"->"+hookName);
            };

            /**
             * gets evaluated value if tag
             * @param {Object} data
             * @param {int} index
             */
            this.evaluate = function( data, index ){
                index = index || 0;

                var value = (property == "INDEX") ? index : data[ property ];

                if (Object.keys(options).length > 0){
                    var type = $.type.get( value );
                    switch(type){
                        case "boolean":
                            value = options[ value ? "0" : "1" ];
                            break;

                        default:
                            value = options[ value ];
                            break;
                    }
                }

                //execute hook if set
                if (hookName != ""){
                    var hook = getHook( hookName );
                    value = hook.evaluate( value, index );
                }

                return value;

            };

            if (str)
                this.parse( str );

            return this;

        }

        /**
         * internal hook object
         * @class
         * @param {Function} fn
         */
        function Hook( fn ){
	        var $ = lola;
	        if ( typeof fn != "function" )
                throw new Error("invalid hook.");

            /**
             * run hook on passed value
             * @param {*} value
             * @return {String}
             */
            this.evaluate = function( value, index ) {
                //return value
                return fn.apply( $.window, arguments );
            }
        }

        /**
         * internal template object
         * @class
         * @param {String} tmpStr
         */
        function TemplateHook( tmpStr ) {
	        var $ = lola;
	        /**
             * tag regex
             * @private
             * @type {RegExp}
             */
            var rTag = /\$\{([^\}]+)\}/;

            /**
             * template blocks
             * @private
             * @type {Array}
             */
             var blocks = [];

            /**
             * count of blocks
             * @private
             * @type {int}
             */
             var blockCount = 0;

            /**
             * parses the passed template string
             * @param {String} str
             */
            function parse( str ){
                var blks = [];

                //get first tag index
                var index = str.search( rTag );

                //loop while tags exist
                while ( index >= 0 ){
                    var result = str.match( rTag );
                    var pre = str.substring( 0, index );
                    if (pre)
                        blks.push( pre );
                    blks.push( new Tag( result[1] ) );
                    str = str.substring( index + result[0].length );

                    //get next tag index
                    index = str.search( rTag );
                }

                //add remaining chunk
                if (str)
                    blks.push( str );

                blocks = blks;
                blockCount = blks.length;
            }

            /**
             * evaluates the passed value
             * @param {*} value
             * @param {int} index
             * @return {String}
             */
            this.evaluate = function( value, index ) {
                var built = [];
                var type = $.type.get( value );
                if ( type != "array" ){
                    value = [ value ];
                }
                value.forEach( function( item, index ){
                    var i=0;
                    while ( i < blockCount ){
                        var block = blocks[i];
                        if (typeof block === "string"){
                            //just push the string
                            built.push( block );
                        }
                        else{
                            //replace tag with value
                            built.push( block.evaluate( item, index ) );
                        }
                        i++;
                    }
                });

                return built.join("");
            };

            if (tmpStr) {
                parse(tmpStr);
            }

            return this;
        }


    };



	//register module
	lola.registerModule( new Module() );

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
    /**
     * Geometry Module
     * @namespace lola.geometry
     */
    var Module = function(){
	    var $ = lola;
	    var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "geometry";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ['regex'];

        /**
         * drop px regex
         * @private
         */
        var rDropPx = /px/g;


        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * returns offset of object relative to descendant or root
         * @param {Element} elem
         * @param {Element|undefined} relativeTo get offset relative to this element
         *
         */
        this.getOffset = function( elem, relativeTo ) {
            //console.groupCollapsed( 'get offset' );
            var point = new self.Point( elem.offsetLeft, elem.offsetTop );
            //console.log('element offset '+point);
            if ( elem.offsetParent ) {
                var parent = self.getOffset( elem.offsetParent );
                //console.log('adding parent offset '+parent);
                point = point.add( parent );
            }
            if ( relativeTo ){
                var relative = self.getOffset( relativeTo );
                //console.log('subtracting relative offset '+relative);
                point = point.subtract( relative );
            }
            //console.log('result: '+point);
            //console.groupEnd();
            return point;
        };

        /**
         * gets or sets the width of an element
         * @param {Element} elem
         * @param {Number|undefined} value
         */
        this.width = function( elem, value ) {
            //console.log('$.geometry.width', arguments );
            if ( value != undefined ){
                //setting
                var bl = $.css.style(elem,"borderLeft");
                var br = $.css.style(elem,"borderRight");
                var pl = $.css.style(elem,"paddingLeft");
                var pr = $.css.style(elem,"paddingRight");
                value -= bl+br+pl+pr;

                return $.css.style( elem, 'width', value);
            }
            else{
                //getting
               if ( elem.offsetWidth )
                    return elem.offsetWidth;
                else
                    return elem.clientWidth;
            }
        };

        /**
         * gets or sets the inner width of an element
         * @param {Element} elem
         * @param {Number|undefined} value
         */
        this.innerWidth = function( elem, value ) {
            var w;
            if ( $(elem).getType() == "window" ){
                w = -1;
                if(elem.innerWidth)
                    w = elem.innerWidth;
                else{
                    var ed = elem.document;
                    if(ed.documentElement && ed.documentElement.clientWidth)
                        w = ed.documentElement.clientWidth;
                    else if(ed.body)
                        w = ed.body.clientWidth;
                }
                return w;
            }
            else if ( value != undefined ){
                //setting
                return $.css.style( elem, 'width', value);
            }
            else{
                //getting
                if ( elem.offsetWidth )
                    w = elem.offsetWidth;
                else
                    w = elem.clientWidth;

                var bl = $.css.style(elem,"borderLeft");
                var br = $.css.style(elem,"borderRight");
                var pl = $.css.style(elem,"paddingLeft");
                var pr = $.css.style(elem,"paddingRight");
                w -= bl+br+pl+pr;

                return w;
            }
        };

        /**
         * gets or sets the height of an element
         * @param {Element} elem
         * @param {Number|undefined} value
         */
        this.height = function( elem, value ) {
            if ( value != undefined ){
                //setting
                var bt = $.css.style(elem,"borderTop");
                var bb = $.css.style(elem,"borderBottom");
                var pt = $.css.style(elem,"paddingTop");
                var pb = $.css.style(elem,"paddingBottom");
                value -= bt+bb+pt+pb;

                return $.css.style( elem, 'height', value);
            }
            else{
                //getting
                if ( elem.offsetHeight )
                    return elem.offsetHeight;
                else
                    return elem.clientHeight;
            }
        };

        /**
         * gets or sets the inner height of an element
         * @param {Element} elem
         * @param {Number|undefined} value
         */
        this.innerHeight = function( elem, value ) {
            var h;
            if ( $(elem).getType() == "window" ){
                h = -1;
                if(elem.innerHeight)
                    h = elem.innerHeight;
                else{
                    var ed = elem.document;
                    if(ed.documentElement && ed.documentElement.clientHeight)
                        h = ed.documentElement.clientHeight;
                    else if(ed.body)
                        h = ed.body.clientHeight;
                }
                return h;
            }
            else if ( value != undefined ){
                //setting
                return $.css.style( elem, 'height', value);
            }
            else{
                //getting
                if ( elem.offsetHeight )
                    h = elem.offsetHeight;
                else
                    h = elem.clientHeight;

                var bt = $.css.style(elem,"borderTop");
                var bb = $.css.style(elem,"borderBottom");
                var pt = $.css.style(elem,"paddingTop");
                var pb = $.css.style(elem,"paddingBottom");
                h -= bt+bb+pt+pb;

                return h;

            }
        };

        //==================================================================
        // Selector Methods
        //==================================================================

        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {

            /**
             * returns offset of elements
             * @param {Element|undefined} descendant get offset relative to descendant
             */
            offset: function( relativeTo ){
                return this.g( self.getOffset, relativeTo );
            },

            /**
             * returns widths of elements
             * @param value
             */
            width: function( value ){
                return this._( self.width, value );
            },

            /**
             * returns widths of elements
             * @param value
             */
            height: function( value ){
                return this._( self.height, value );
            },

            /**
             * returns widths of elements
             * @param value
             */
            innerWidth: function( value ){
                return this._( self.innerWidth, value );
            },

            /**
             * returns widths of elements
             * @param value
             */
            innerHeight: function( value ){
                return this._( self.innerHeight, value );
            }

        };


        //==================================================================
        // Classes
        //==================================================================
        /**
         * Point class
         * @class
         * @param {Number|undefined} x x coordinate
         * @param {Number|undefined} y y coordinate
         */
        this.Point = function( x, y ) {
            this.x = x;
            this.y = y;
            return this;
        };
        this.Point.prototype = {
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
             * @return {lola.geometry.Vector}
             */
            toVector: function(){
                var a = Math.atan2( this.y, this.x );
                var v = Math.sqrt( this.x*this.x + this.y*this.y );
                return new self.Vector(v,a);
            },

            /**
             * converts point to object notation
             * @return {String}
             */
            toString: function(){
                return "{x:"+this.x+",y:"+this.y+"}";
            },

            /**
             * returns a copy of this point
             */
            copy: function(){
                return new self.Point( this.x, this.y );
            },

            /**
             * performs function on point
             * @param fn
             * @param args
             */
            operate: function( fn, args ){
                //console.groupCollapsed( 'operate' );
                var r = this.copy();
                //console.log('start with: ', r);
                var len =  args.length;
                //console.log('there are',len,'arguments');
                for (var i=0; i<len; i++) {
                    var arg = args[i];
                    if (typeof arg == "number") {
                        //console.log('arg is number: ', arg);
                        r.x = fn(r.x,arg);
                        r.y = fn(r.y,arg);
                    }
                    else {
                        //console.log('arg is point: ', arg);
                        r.x = fn(r.x,arg.x);
                        r.y = fn(r.y,arg.y);
                    }
                }
                //console.log('end with: ', r);
                //console.groupEnd();
                return r;
            },

            /**
             * adds arguments to point (returns new point)
             * @return {lola.geometry.Point}
             */
            add: function( /*...arguments*/ ){
                return this.operate( function(a,b){return a+b;}, arguments );
            },

            /**
             * subtracts arguments from point (returns new point)
             * @return {lola.geometry.Point}
             */
            subtract: function( /*...arguments*/ ){
                return this.operate( function(a,b){return a-b;}, arguments );
            },

            /**
             * multiplies point by arguments (returns new point)
             * @return {lola.geometry.Point}
             */
            multiply: function( /*...arguments*/ ){
                return this.operate( function(a,b){return a*b;}, arguments );
            },

            /**
             * divides point by arguments (returns new point)
             * @return {lola.geometry.Point}
             */
            divide: function( /*...arguments*/ ){
                return this.operate( function(a,b){return a/b;}, arguments );
            },

            /**
             * raises point by arguments (returns new point)
             * @return {lola.geometry.Point}
             */
            pow: function( /*...arguments*/ ){
                return this.operate( function(a,b){return Math.pow(a,b);}, arguments );
            },

            /**
             * offsets point at the specified angle by the specified distance
             * @param {lola.geometry.Point} p
             * @param {Number} angle angle in radians
             * @param {Number} distance
             */
            offsetPoint: function( angle, distance ){
                var offset = this.copy();
                offset.x += Math.cos( angle ) * distance;
                offset.y += Math.sin( angle ) * distance;
                return offset;
            },

            /**
             * calculates the absolute distance to point
             * @param {lola.geometry.Point} p
             * @return {Number}
             */
            distance: function( p ) {
                return Math.sqrt( Math.pow(p.x-this.x,2) + Math.pow(p.y-this.y,2)  );
            }
        };

        /**
         * Spline class
         * @class
         * @param {Array|undefined} points array of spline points
         * @param {uint} flags
         */
        this.Spline = function( points, flags ){
            /**
             * array of {lola.geometry.SplinePoint}
             * @type {Array}
             * @private
             */
            points = points?points:[];

            /**
             * spline flags
             * @type {Boolean}
             */
            flags = flags == undefined ? self.Spline.BEGIN|self.Spline.END : flags;

            /**
             * adds a point at the specified index.
             * if index is not passed, point will be added at last position
             * @param {lola.geometry.SplinePoint} splinePoint
             * @param {uint|undefined} index
             */
            this.addPoint = function( splinePoint, index ){
                if ( index == undefined )
                    index = points.length;

                points.splice(index,0,splinePoint);
            };

            /**
             * removes the point at the specified index.
             * @param {uint} index
             */
            this.removePoint = function( index ){
                if ( index != undefined )
                    points.splice(index,1,undefined);
            };

            /**
             * updates/replaces a point at the specified index.
             * @param {lola.geometry.SplinePoint} splinePoint
             * @param {uint} index
             */
            this.updatePoint = function( splinePoint, index ){
                if ( index != undefined )
                    points.splice(index,1,splinePoint);
            };

            /**
             * gets the splinePoint at the specified index.
             * @param {uint} index
             */
            this.getPoint = function( index ){
                if ( index < points.length )
                    return points[ index ];
                return null;
            };

            /**
             * gets all splinePoints.
             */
            this.getPoints = function(){
                return points;
            };

            /**
             * draws spline
             * @param {Boolean} close draw a closed spline
             * @param {Object|String|undefined} ctx
             */
            this.draw = function( ctx, flgs ){
                flgs = flgs == undefined ? flags : flgs;
                var sl = points.length;
                //console.log('drawSpline: '+sl);
                if (sl > 1) {
                    var p = [];
                    //console.log(pts);
                    points.forEach( function(item){
                        p.push( item.getControl1(),item.getAnchor(),item.getControl2() );
                    });
                    var pl = p.length;

                    if (flgs & self.Spline.CONTROLS){
                        var d = function(q,r){
                            ctx.beginPath();
                            ctx.moveTo(p[q].x, p[q].y);
                            ctx.lineTo(p[r].x, p[r].y);
                            ctx.stroke();
                            ctx.closePath();
                        };
                        /*for (var n=0; n<pl-3; n+=3){
                            d(n,n+1);
                            d(n+1,n+2);
                        } */
                        d(1,2);
                        d(3,4);
                        //d(n,n+1);
                    }

                    if (!(flgs & self.Spline.NOBEGIN))
	                    ctx.beginPath();
                    ctx.moveTo( p[1].x,p[1].y );
                    for (var i=2; i<pl-3; i+=3){
                        ctx.bezierCurveTo(
                            p[i].x,p[i].y,
                            p[i+1].x,p[i+1].y,
                            p[i+2].x,p[i+2].y
                        );
                    }

                    if (flgs & self.Spline.CLOSED){
                        ctx.bezierCurveTo(
                            p[pl-1].x,p[pl-1].y,
                            p[0].x,p[0].y,
                            p[1].x,p[1].y
                        );
                    }

                    if (flgs & self.Spline.FILL){
                        ctx.fill();
                    }

                    if (flgs & self.Spline.STROKE){
                        ctx.stroke();
                    }

	                if (!(flgs & self.Spline.NOEND))
		                ctx.closePath();

                }
                else{
                    throw new Error('not enough spline points');
                }
            };

            /**
             * translates and / or scales a spline based on the specified bounding points
             * @param {lola.geometry.Point} oldMin
             * @param {lola.geometry.Point} oldMax
             * @param {lola.geometry.Point} newMin
             * @param {lola.geometry.Point} newMax
             * @param {Boolean|undefined} flipX
             * @param {Boolean|undefined} flipY
             * @return {lola.geometry.Spline}
             */
            this.normalize = function( oldMin, oldMax, newMin, newMax, flipX, flipY ){

                flipX = flipX === true;
                flipY = flipY === true;

                var norm = new  self.Spline();
                var spts = this.getPoints();
                var l = spts.length;
                var oldSize = oldMax.subtract( oldMin );
                var newSize = newMax.subtract( newMin );

                var normalizePoint = function( pt ){
                    pt = pt.subtract( oldMin ).divide( oldSize );
                    if (flipX) pt.x = 1-pt.x;
                    if (flipY) pt.y = 1-pt.y;
                    return pt.multiply( newSize ).add( newMin );
                };

                for (var i=0; i<l; i++ ){
                    //get points
                    var cp1 = spts[i].getControl1();
                    var anch = spts[i].getAnchor();
                    var cp2 = spts[i].getControl2();

                    //normalize points
                    var nanch = normalizePoint( anch );
                    var ncv1 = nanch.subtract( normalizePoint( cp1 ) ).toVector();
                    var ncv2 = normalizePoint( cp2 ).subtract( nanch ).toVector();
                    //var ncv2 = nanch.subtract( normalizePoint( cp2 ) ).toVector();

                    var np = new self.SplinePoint( nanch.x, nanch.y, ncv1.velocity, ncv1.angle, ncv2.velocity, ncv2.angle );
                    norm.addPoint( np );
                }

                return norm;
            };

	        /**
	         * converts object to object list of strings
	         * @return {Object}
	         */
	        this.listPoints= function(){
		        var pts = {};
		        var ct = 0;
		        points.forEach(function(item){
			        pts[ct++] = item.toString();
		        });
		        return pts;
	        };

	        return this;
        };
	    this.Spline.CLOSED = 0x1;
	    this.Spline.FILL = 0x2;
        this.Spline.STROKE = 0x4;
        this.Spline.CONTROLS =0x8;
	    this.Spline.NOBEGIN = 0x10;
	    this.Spline.NOEND = 0x11;


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
        this.SplinePoint = function( anchorX, anchorY, entryStrength, entryAngle, exitStrength, exitAngle ) {

            /**
             * splinepoint anchor point
             * @type {lola.geometry.Point|undefined}
             */
            var anchor;

            /**
             * splinepoint entry vector
             * @type {lola.geometry.Vector|undefined}
             */
            var entry;

            /**
             * splinepoint exit vector
             * @type {lola.geometry.Vector|undefined}
             */
            var exit;

	        /**
	         * sets the SplinePont's entry and exit angles
	         * if exitAngle is omitted, exitAngle is set to entryAngle + PI both
	         * @param {Number|undefined} entryAngle
	         * @param {Number|undefined} exitAngle
	         */
	        this.setAngle = function( entryAngle, exitAngle) {
		        entry.angle = entryAngle;
		        exit.angle = exitAngle==undefined?entryAngle+Math.PI:exitAngle;
	        };

	        /**
	         * sets the SplinePont's entry vector
	         * @param {lola.geometry.Vector} vector
	         */
	        this.setEntry = function( vector ) {
		        entry = vector;
	        };

	        /**
	         * sets the SplinePont's exit vector
	         * @param {lola.geometry.Vector} vector
	         */
	        this.setExit = function( vector ) {
		        exit = vector;
	        };

	        /**
             * gets the spline point's anchor
             * @return {lola.geometry.Point}
             */
            this.getAnchor =function(){
                return anchor;
            };

            /**
             * gets the spline point's entry control point
             * @param {Boolean} vector
             * @return {lola.geometry.Point}
             */
            this.getControl1 = function( vector ){
                if (vector) return entry;
                return anchor.subtract( entry.toPoint() );
            };

            /**
             * gets the spline point's exit control point
             * @param {Boolean} vector
             * @return {lola.geometry.Point}
             */
            this.getControl2 = function( vector ){
                if (vector) return exit;
                return anchor.add( exit.toPoint() );
            };

	        /**
	         * converts object to readable string
	         * @return {String}
	         */
	        this.toString = function(){
		        return [anchor,entry,exit].join(" ");
	        };

            //initialize
            anchor = new self.Point( anchorX, anchorY );
            entry = new self.Vector( entryStrength, entryAngle );
            exit = new self.Vector( exitStrength, exitAngle==undefined?entryAngle+Math.PI:exitAngle );
            return this;
        };

        /**
         * Vector class
         * @class
         * @param velocity
         * @param angle
         */
        this.Vector = function( velocity, angle ){

            /**
             * velocity or length of the vector
             * @type {Number}
             */
            this.velocity = velocity;

            /**
             * angle of vector (horizontal pointing right is 0 radians)
             * @type {Number}
             */
            this.angle = angle;

            /**
             * returns a copy of this vector
             */
            this.copy = function(){
                return new self.Vector( this.velocity, this.angle );
            };

	        /**
	         * adds two vectors
	         * @param v
	         */
            this.add = function( v ){
	            var c = this.copy();
                c.velocity += v.velocity;
                c.angle += v.angle;
	            return c;
            };

            /**
             * converts a vector to a (0,0) based point
             * @return {lola.geometry.Point}
             */
            this.toPoint = function() {
                return new self.Point(
                    Math.cos(this.angle)*this.velocity,
                    Math.sin(this.angle)*this.velocity
                )
            };

	        /**
	         * converts vector to object notation
	         * @return {String}
	         */
	        this.toString = function(){
		        return "{v:"+this.velocity+",a:"+this.angle+"}";
	        };



	        return this;
        };

    };

	//register module
	lola.registerModule( new Module() );


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
    /**
     * Graphics Module
     * @namespace lola.graphics
     */
    var Module = function(){
	    var $ = lola;
	    var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "graphics";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ['util'];

        /**
         * default context
         * @private
         */
        var context = null;

        /**
         *  context map
         * @private
         */
        var map = {};

        /**
         *  context reset object
         * @private
         */
        var reset = {};

        /**
         *  style map
         * @private
         */
        var styles = {};

        /**
         * routine map
         * @private
         */
        var routines = {};

        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * maps context of specified canvas
         * @param {Element} canvas
         * @param {String|undefined} id
         */
        this.registerContext = function( canvas, id ){
            var ctx = canvas.getContext('2d');
            id = (id==undefined)?$(canvas).identify().attr('id'):id;
            //console.log('register context:',id);
            var gdata = $(canvas).getData( "_"+namespace, true );
            if (gdata.contexts == null)
                gdata.contexts = [];
            gdata.contexts.push( id );

            map[ id ] = ctx;
        };

        /**
         * unmaps  context for specified canvas
         * @param canvas
         */
        this.removeContext = function( canvas ){
            var gdata = $(canvas).getData( "_"+namespace, false );
            if (gdata && gdata.contexts) {
                var id;
                while ( id = gdata.contexts.pop() ){
                    delete map[ id ];
                }
            }
        };

        /**
         * get a mapped context
         * @param {String} id
         * @return {Object}
         */
        this.getContext = function(id) {
            return map[id];
        };

        /**
         * resolves string to context
         * if a context is passed the same context is returned.
         * if nothing is found the current default context is returned
         * @param {Object|String|undefined} ctx
         */
        function resolveContext( ctx ) {
            if (typeof ctx === "string")
                ctx = self.getContext( ctx );

            return ctx || context;
        }

        /**
         * @description sets the current default context
         * @param {Object|String} ctx
         * @return {Object}
         */
        this.setContext = function( ctx ) {
            context = resolveContext( ctx );
	        return context;
        };

        /**
         * returns a context to its original state
         * @param {Object|String|undefined} ctx
         */
        this.resetContext = function( ctx ) {
            if (typeof ctx == "string")
                context = resolveContext(ctx);

            if (context) $.util.copyPrimitives( reset, context );
        };

        /**
         * copies properties of styleObject into style cache with given name
         * @param {String} name
         * @param {Object} styleObj
         */
        this.registerStyle = function( name, styleObj ) {
            var obj = {};
            $.util.copyPrimitives( styleObj, obj );
            styles[ name ] = obj;
        };

        /**
         * removes style with specified name
         * @param {String} name
         */
        this.removeStyle = function(  name ) {
            delete styles[ name ];
        };

        /**
         * registers a repeatable drawing routine
         * @param {String} name
         * @param {Function} fnc function that accepts ctx to draw
         */
        this.registerRoutine = function( name, fnc ) {
            routines[ name ] = fnc;
        };

        /**
         * removes routine with specified name
         * @param {String} name
         */
        this.removeRoutine = function(  name ) {
            delete this.routines[ name ];
        };

        /**
         * execute a drawing routine
         * @param {String} name
         */
        this.executeRoutine = function( name ) {
            if ( $.hasFn(routines,name) ){
                routines[name]( context );
            }
        };

        /**
         * copies properties of styleObject into style cache with given name
         * @param {Object|String} style
         * @param {Object|String|undefined} ctx
         */
        this.applyStyle = function( style, ctx ) {
            ctx = resolveContext( ctx );
            var sty = (typeof style == "string") ?  styles[ style ] || reset : style;
            $.util.copyPrimitives( reset, ctx );
            $.util.copyPrimitives( sty, ctx );
        };

        /**
         * draws drawable objects in current context
         * @param {Object|Array} objects
         */
        this.draw = function( object, flags ){
            if ( $.hasFn( object, 'draw')){
                object.draw( context, flags );
            }
        };

        /**
         * clears a context
         * @param ctx
         */
        this.clear = function( ctx ){
            ctx = resolveContext( ctx );
            ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);
        };

        /**
         * creates methods on context on this
         * @param prop
         */
        function createContextMethod( prop ){
            self[ prop ] = function(){
                //console.log('proxy method:',prop);
                var ctx = resolveContext( null );
                if (ctx){
                    ctx[ prop ].apply( ctx, arguments );
                    //console.log('    proxy method applied');
                }
            }
        }
        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {
            registerContext: function(){
                return this.s( self.registerContext );
            }
        };


        //==================================================================
        // Preinitialization
        //==================================================================

        if ($.support.canvas){
            $.addSafeDeleteHook( self.removeContext, self );

            //get reset context
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            for ( var prop in ctx ){
                //if (ctx.hasOwnProperty(prop)){
                    if ( $.type.isPrimitive( ctx[ prop ] ) ){
                        reset[ prop ] = ctx[ prop ];
                    }
                    else if ($.type.get( ctx[prop] ) == 'function'){
                        createContextMethod( prop );
                    }
                //}
            }
        }

    };

	//register module
	lola.registerModule( new Module() );

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
    /**
     * Easing Module
     * @namespace lola.array
     */
    var Module = function(){
	    var $ = lola;
	    var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "easing";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ["geometry"];

        /**
         * defined easing methods
         * @private
         */
        var methods = {};

        /**
         * spline sampling resolution
         * @private
         */
        var defaultResolution = 25;

        /**
         * default easing method
         * @private
         */
        var defaultEase = "ease";

        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's namespace
         * @return {String}
         */
        this.methods = function() {
            return methods;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };

        /**
         * sets the default easing method
         * @param {String} ids
         */
        this.setDefaultEase = function( id ){
            if (methods[ id ]){
                defaultEase = id;
                methods['default'] = methods[id];
            }
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * preinitializes module
         * @private
         * @return {void}
         */
        function preinitialize() {
            var start = $.now();
            $.syslog( 'lola.easing::preinitialize' );

            //do module initialization
            //easing that simulates css timing
            self.registerSimpleEasing("none", 0, 0, 1, 1);
            self.registerSimpleEasing("linear", 0, 0, 1, 1);
            self.registerSimpleEasing("ease", .25, .1, .25, 1);
            self.registerSimpleEasing("ease-in", .42, 0, 1, 1);
            self.registerSimpleEasing("ease-out", 0, 0, .58, 1);
            self.registerSimpleEasing("ease-in-out", .42, 0, .58, 1);

            //create easeInOut functions for types with easeIn and easeOut
            Object.keys(optimized).forEach( function(k){
                if (optimized[k].hasOwnProperty('easeIn') && optimized[k].hasOwnProperty('easeOut')) {
                    var ei = optimized[k]["easeIn"];
                    var eo = optimized[k]["easeOut"];
                    var eio = function( t, v, c, d ){
                        return (t < d / 2) ? ( ei(t,v,c/2,d/2) ) : (eo( t - d/2, ei(d,v,c/2,d),c/2,d/2));
                    };

                    self.registerEasingFn(k+'-in', ei );
                    self.registerEasingFn(k+'-out', eo );
                    self.registerEasingFn(k+'-in-out', eio );
                }
            } );
            var complete = $.now();
            $.syslog('easing preinitialization took',(complete-start), 'ms');
            self.setDefaultEase('ease-in-out');
        }

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
        function cubicBezier( t, p0, p1, p2, p3 ) {
            var inv = 1 - t;
            return p0.multiply( inv * inv * inv ).add(
                p1.multiply( 3 * inv * inv * t ),
                p2.multiply( 3 * inv * t * t ),
                p3.multiply( t * t * t )
            );
        }

        /**
         * samples a splines points for use in time based easing
         * @private
         * @param {lola.geometry.Spline} spline
         * @param {uint} resolution per spline section
         */
        function sampleSpline( spline, resolution ) {
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
                        var sample = cubicBezier(
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
        }
        this.sampleSpline = sampleSpline;

        /**
         * registers the an easing method using the given parameters
         * @param id
         * @param spline
         * @param resolution
         * @param overwrite
         */
        this.registerEasingSpline = function( id, spline, resolution, overwrite  ){
            resolution = resolution?resolution:defaultResolution;
            overwrite = overwrite === true;

            var first = spline.getPoint(0).getAnchor();
            var last = spline.getPoint( (spline.getPoints().length - 1) ).getAnchor();
            if ( first.x == 0 && first.y == 0 && last.x == 1 && last.y == 1 ){
                //Todo: make sure spline can be fit to cartesian function

                var Ease = function(){
                    this.getSpline = function(){ return spline; };
                    var s = sampleSpline( spline, resolution );
                    this.getSamples = function(){ return s; };
                    var l = s.length;
                    this.exec = function( t,v,c,d ){
                        t/=d;
                        var i = 0;
                        //TODO: use a more efficient time search algorithm
                        while( t>=s[i].x && i < l ){
                            i++;
                            if ( t <= s[i].x ){
                                var low = s[i-1];
                                var high = s[i];
                                var p = (t - low.x) / (high.x - low.x);
                                return v+c*(low.y+p*(high.y-low.y));
                            }
                        }

                        return 0;
                    };

                    return this;
                };

                if ( !methods[ id ] || overwrite ){
                    methods[ id ] = new Ease();
                }else{
                    throw new Error("easing id already taken");
                }

            }else{
                throw new Error("invalid easing spline");
            }
        };

        /**
         * registers a single section cubic-bezier easing method
         * @param id
         * @param p1x
         * @param p1y
         * @param p2x
         * @param p2y
         */
        this.registerSimpleEasing = function(id,p1x,p1y,p2x,p2y){
            var geo = $.geometry;
            var spline = new geo.Spline();
            var c1 = new geo.Point( p1x, p1y );
            var c2 = new geo.Point( 1-p2x, 1-p2y );
            var v1 = c1.toVector();
            var v2 = c2.toVector();
            spline.addPoint( new geo.SplinePoint( 0, 0, 0, 0, v1.velocity, v1.angle ) );
            spline.addPoint( new geo.SplinePoint( 1, 1, v2.velocity, v2.angle, 0, 0 ) );
            self.registerEasingSpline( id, spline );
        };

        /**
         * registers an easing function
         * @param {String} id
         * @param {Function} fn
         */
        this.registerEasingFn = function( id, fn ){
            var Ease = function(){
                this.name = id;
                this.exec = fn;
                return this;
            };

            methods[ id ] = new Ease();
        };

        /**
         * gets a regsitered easing function
         * @param {String} id
         */
        this.get = function( id ){
            //console.log("$.easing.get: "+id);
            if (methods[ id ]){
                return methods[ id ];
            }
            else {
                $.warn('easing method "'+id+'" not found.');
                return methods[ defaultEase ];
            }
        };

        this.getAll = function(){ return methods; };


        //------------------------------------------------------------------
        // optimised easing functions
        //------------------------------------------------------------------
        /*
         t - time in millis
         v - initial value
         c - value change
         d - duration in millis
         */
        //---------------------------------
        this.params = {
            back: { a: 2.7, b: 1.7 }
        };

        var optimized = {
            back: {
                easeIn: function( t, v, c, d ) {
                    return c * (t /= d) * t * (self.params.back.a * t - self.params.back.b) + v;
                },
                easeOut: function( t, v, c, d ) {
                    return c * ((t = t / d - 1) * t * (self.params.back.a * t + self.params.back.b) + 1) + v;
                }
            },
            //---------------------------------
            bounce: {
                easeIn: function( t, v, c, d ) {
                    return c - optimized.bounce.easeOut( d - t, 0, c, d ) + v;
                },
                easeOut: function( t, v, c, d ) {
                    return ((t /= d) < (1 / 2.75)) ?
                        (c * (7.5625 * t * t) + v) :
                        ( (t < (2 / 2.75)) ?
                            (c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + v) :
                            ( (t < (2.5 / 2.75)) ?
                                (c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + v) :
                                (c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + v)));
                }
            },
            //---------------------------------
            circular: {
                easeIn: function( t, v, c, d ) {
                    return -c * (Math.sqrt( 1 - (t /= d) * t ) - 1) + v;
                },
                easeOut: function( t, v, c, d ) {
                    return c * Math.sqrt( 1 - (t = t/d - 1) * t ) + v;
                }
            },
            //---------------------------------
            cubic: {
                easeIn: function( t, v, c, d ) {
                    return c * (t /= d) * t * t + v;
                },
                easeOut: function( t, v, c, d ) {
                    return c * ((t = t / d - 1) * t * t + 1) + v;
                }
            },
            //---------------------------------
            elastic: {
                easeIn: function( t, v, c, d ) {
                    if ( t == 0 ) return v;
                    if ( (t /= d) == 1 ) return v + c;
                    var p,a,s;
                    p = d * 0.3;
                    a = c;
                    s = p / 4;
                    return -(a * Math.pow( 2, 10 * (t -= 1) ) * Math.sin( (t * d - s) * (2 * Math.PI) / p )) + v;
                },
                easeOut: function( t, v, c, d ) {
                    if ( t == 0 ) return v;
                    if ( (t /= d) == 1 ) return v + c;
                    var s,a,p;
                    p = d * 0.3;
                    a = c;
                    s = p / 4;
                    return a * Math.pow( 2, -10 * t ) * Math.sin( (t * d - s) * (2 * Math.PI) / p ) + c + v;
                }
            },
           //---------------------------------
            exponential: {
                easeIn: function( t, v, c, d ) {
                    return (t == 0) ? v : (c * Math.pow( 2, 10 * (t / d - 1) ) + v);
                },
                easeOut: function( t, v, c, d ) {
                    return (t == d) ? (v + c) : (c * (-Math.pow( 2, -10 * t / d ) + 1) + v);
                }
            },
            //---------------------------------
            quadratic: {
                easeIn: function( t, v, c, d ) {
                    return c * (t /= d) * t + v;
                },
                easeOut: function( t, v, c, d ) {
                    return -c * (t /= d) * (t - 2) + v;
                }
            },
            //---------------------------------
            quartic: {
                easeIn: function( t, v, c, d ) {
                    return c * (t /= d) * t * t * t + v;
                },
                easeOut: function( t, v, c, d ) {
                    return -c * ((t = t / d - 1) * t * t * t - 1) + v;
                }
            },
            //---------------------------------
            quintic: {
                easeIn: function( t, v, c, d ) {
                    return c * (t /= d) * t * t * t * t + v;
                },
                easeOut: function( t, v, c, d ) {
                    return c * ((t = t / d - 1) * t * t * t * t + 1) + v;
                }
            },
            //---------------------------------
            septic: {
                easeIn: function( t, v, c, d ) {
                    return c * (t /= d) * t * t * t * t * t * t + v;
                },
                easeOut: function( t, v, c, d ) {
                    return c * ((t = t / d - 1) * t * t * t * t * t * t + 1) + v;
                }
            },
            //---------------------------------
            sine: {
                easeIn: function( t, v, c, d ) {
                    return -c * Math.cos( t / d * (Math.PI / 2) ) + c + v;
                },
                easeOut: function( t, v, c, d ) {
                    return c * Math.sin( t / d * (Math.PI / 2) ) + v;
                }
            }
        };


        preinitialize();

        return this;

    };


	//register module
	lola.registerModule( new Module() );

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
    /**
     * Tween Module
     * @namespace lola.array
     */
    var Module = function(){
	    var $ = lola;
	    var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "tween";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ['animation','css','event','easing'];

        /**
         * map of active tween targets
         * @private
         */
        var targets = {};

        /**
         * tween uid generator
         * @private
         */
        var tweenUid = 0;

        /**
         * tween uid generato
         * @private
         */
        var freeTweenIds = [];

        /**
         * map of tweens
         * @private
         */
        var tweens = {};

        /**
         * map of tween types
         * @private
         */
        var hooks = {};

        /**
         * indicates whether module is ticking
         * @private
         */
        var active = false;

        /**
         * tween types
         * @private
         */
        var types = {};

        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };

        /**
         * get next tween id
         * @return {int}
         */
        function nextTID() {
            return tweenUid++;
        }


        //==================================================================
        // Methods
        //==================================================================
        /**
         * module initializer
         */
        this.initialize = function(){
            var anim = new $.animation.Animation( tick, self );
            $.animation.register(namespace, anim);
            if ( Object.keys( tweens ).length > 0 ){
                startTicking();
            }
        };

        /**
         * start ticking
         */
        function startTicking(){
            $.animation.start( namespace );
        }

        /**
         * registers a tween with the framework
         * @param {lola.tween.Tween} tween
         * @return {uint} tween identifier
         */
        this.registerTween = function( tween ){
            var tid = freeTweenIds.length > 0 ? freeTweenIds.pop() : nextTID();
            tweens[tid] = tween;
            return tid;
        };

        /**
         * starts the referenced tween
         * @param {uint} id
         * @private
         */
        this.start = function( id ){
            //console.log('$.tween.start',id,tweens[ id ]);
            if (tweens[ id ]){
                tweens[ id ].start();
            }
        };

        /**
         * stops the referenced tween
         * @param {uint} id
         */
        this.stop = function( id ){
            if (tweens[ id ]){
                tweens[id].stop();
            }
        };

        /**
         * pauses the referenced tween
         * @param {uint} id
         */
        this.pause = function( id ){
            if (tweens[ id ]){
                tweens[id].pause();
            }
        };

        /**
         * resumes the referenced tween
         * @param {uint} id
         */
        this.resume = function( id ){
            if (tweens[ id ]){
                tweens[id].resume();
            }
        };

        /**
         * adds targets to referenced tween
         * @param {uint} tweenId
         * @param {Object|Array} objects
         * @param {Object} properties
         * @param {Boolean} collisions
         * @private
         */
        this.addTarget = function( tweenId, objects, properties, collisions ){
            //console.log('tween.addTarget',targets);
            if (tweens[ tweenId ]){
                collisions = collisions === true;
                if ($.type.get(objects) != 'array')
                    objects = [objects];

                var ol = objects.length;
                for (var i=0; i<ol; i++) {
                    var obj = objects[i];
                    //console.log('   ',obj);
                    var id = $(obj).identify().attr('id');
                    if (!targets[id])
                        targets[id] = {};
                    for (var g in properties){
                        //console.log('      ',g);
                        if (properties.hasOwnProperty(g)){
                            var propg = properties[g];
                            // p should be lola selector methods eg style, attr, classes
                            if (!targets[id][g])
                                targets[id][g] = {};
                            for (var p in propg ){
                                if (propg.hasOwnProperty(p)){
                                    //console.log('         ',p);
                                    if (collisions || targets[id][g][p] == null ){
                                        if (!targets[id][g][p])
                                            targets[id][g][p] = [];

                                        if (collisions)
                                            targets[id][g][p].push( self.getTweenObject( tweenId, obj, g, p, propg[p] ) );
                                        else
                                            targets[id][g][p] = [ self.getTweenObject( tweenId, obj, g, p, propg[p] ) ];
                                    }
                                }
                            }
                        }
                    }
                }

            }
            else{
                throw new Error("tween not found");
            }
        };

        /**
         * gets a TweenObject for specified target and property
         * @param {uint} tweenId
         * @param {Object} target
         * @param {String} property
         * @param {*} value
         * @param {*} dispatcher element that dispatches complete event
         * @private
         */
        this.getTweenObject = function( tweenId, target, group, property, value ){
            //console.log("this.getTweenObject", tweenId, target, group, property, value );
            //get initial value
            var from,to,delta;

            if (!value.from){
                //try to get "from" value
                var f = $(target)[group]( property );
                //console.log('test f:',f);
                //console.log()
                if (typeof value == "object" ){
                    value.from = f;
                }
                else {
                    var t = String(value);
                    value = {from:f,to:t};
                }
            }

            if ( value.from ) {
                from = value.from;
                //console.log('    using value.from');
            }
            else if (typeof value == "function"){
                from = value.call( target );
                //console.log('    using value.call( target )');
            }
            else{
                from = $(target)[group]( property );
                //console.log('    using $(target)[group]( property )');
            }
            //console.log('    from',  String(from));
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
            //console.log('    to',  String(to));

            //break down from and to values to tweenable values
            //and determine how to tween values
            var type, proxy;
            if ( hooks[ group ] ) {
                type = hooks[ group ];
            }
            else {
                for ( var i in types ) {
                    if (types.hasOwnProperty(i)){
                        //console.log('checking type', i);
                        type = types[i];
                        //console.log('    testing type', i, type.match.test( String( from ) ), type.match.test( String( to ) ) );
                        if ( i == group ){
                            break;
                        }
                        if ( type.match === true || (type.match && type.match.test( String( to ) ) && type.match.test( String( from ) ) )) {
                            break;
                        }
                        else {
                            type = null;
                        }
                    }
                }
            }

            if ( type ) {
                // test parsed objects to see if they can be tweened
                to = type.parse( to );
                from = type.parse( from );
                delta = type.getDelta( to, from, deltaMethod );
                proxy = type.proxy;
                //console.log('   canTween', type.canTween( from, to ) );
                //console.log('       ', from, to );
                if ( !type.canTween( from, to ) ) {
                    type = null;
                }
            }
            if (!type) {
                proxy = $.tween.setAfterProxy;
                delta = to;
            }

            var result = new self.TweenObject( tweenId, target, group, property, from, delta, proxy );
            //console.log(result);
            return result;
        };

        /**
         * executes a frame tick for tweening engine
         * @private
         */
        function tick( now, delta, elapsed ){
            //console.log('$.tween.tick', now, $.now(), delta, elapsed );
            //iterate through tweens and check for active state
            //if active, run position calculation on tweens
            var activityCheck = false;
            //console.log('tick: '+now);

            var tFn, gFn, pFn;
            tFn = undefined;
            gFn = function(t,g){ return true; };
            pFn = function(t,g,p,obj){
                var dispatcher = obj[0].target;
                if (dispatcher){
                    $.event.trigger(dispatcher,'tweencomplete',false,false);
                }
                return true;
            };

            for (var k in tweens){
                if (tweens.hasOwnProperty(k) && tweens[k].active){
                    activityCheck = true;
                    if ( !tweens[k].complete )
                        tweens[k].calculate( now );
                    else{
                        //catch complete on next tick

                        //trigger events
                        $.event.trigger(tweens[k],'tweencomplete',false,false);
                        iterateTargets( tFn, gFn, pFn );

                        delete tweens[k];
                        freeTweenIds.push( parseInt(k) );
                    }
                }
            }

            //apply tween position to targets
            var gCount = 0;
            var pCount = 0;
            tFn = function(t){
                if (gCount == 0){
                    delete targets[t];
                }
                gCount = 0;
                return true;
            };
            gFn = function(t,g){
                if (pCount == 0){
                    delete targets[t][g];
                }
                else{
                    gCount++;
                }
                pCount = 0;
                return true;
            };
            pFn = function(t,g,p,obj){
                var tmp = [];
                var trg;
                while (trg = obj.shift()){
                    //console.log("      TweenObject",to);
                    //console.log("      Tween",tweens[to.tweenId]);
                    if (trg && tweens[trg.tweenId] && tweens[trg.tweenId].active){
                        trg.apply( tweens[trg.tweenId].value );
                        tmp.push( trg );
                    }
                }
                targets[t][g][p] = tmp;

                if ( targets[t][g][p].length == 0){
                    delete targets[t][g][p];
                }
                else{
                    pCount++;
                }
                return true;
            };

            iterateTargets( tFn, gFn, pFn );

            return activityCheck;
        }

        /**
         * iterate through target tree
         * @param tFn
         * @param gFn
         * @param pFn
         */
        function iterateTargets( tFn, gFn, pFn ){
            for (var t in  targets){
                //target level
                if (targets.hasOwnProperty(t)){
                    var tar = targets[t];
                    for (var g in tar){
                        if (tar.hasOwnProperty(g)){
                            var targ = tar[g];
                            for (var p in targ){
                                if (targ.hasOwnProperty(p)){
                                    var obj = targ[p];
                                    if (pFn && !pFn( t, g, p, obj )) break;
                                }
                            }
                            if (gFn && !gFn( t, g )) break;
                        }
                    }
                    if (tFn && !tFn(t)) break;
                }
            }
        }

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
        function setAfterProxy( obj, progress ) {
            if ( progress >= 1  )
                obj.$target[ obj.type ]( obj.property, obj.initialValue + obj.deltaValue);
        }

        /**
         * adds a tween type
         * @param {String} id
         * @param {Object} obj
         */
        this.addTweenType = function( id, obj ) {
            types[ id ] = obj;
        };

        this.getTargets = function(){
            return targets;
        };

        //==================================================================
        // Tween Types
        //==================================================================
        this.addTweenType('simple', {
            match: $.regex.isNumber,
            parse: function(val){
                return parseFloat( val );
            },
            canTween: function(a,b){
                return ( a != undefined && b != undefined  );
            },
            getDelta: function( to, from, method) {
                if( method ){
                    return to;
                }
                else{
                    return to - from;
                }
            },
            proxy: function( obj, progress ){
                obj.$target[ obj.type ]( obj.property, obj.initialValue + obj.deltaValue * progress );
            }
        });

        this.addTweenType('dimensional', {
            match: $.regex.isDimension,
            parse: function(val){
                var parts = String( val ).match( $.regex.isDimension );
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
            proxy: function( obj, progress ) {
                var i = obj.initialValue;
                var d = obj.deltaValue;
                obj.$target[ obj.type ]( obj.property, (i.value + d.value * progress) + d.units);
            }
        });

        this.addTweenType('color', {
            match: $.regex.isColor,
            parse: function(val){
                //console.log ('color.parse: ',val);
                var color = new $.css.Color( val );
                //console.log( '    ', color.rgbValue );
                return color.getRgbValue();
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
            proxy: function( obj, progress ) {
                var i = obj.initialValue;
                var d = obj.deltaValue;
                var r = ((i.r + d.r * progress) * 255) | 0;
                var g = ((i.g + d.g * progress) * 255) | 0;
                var b = ((i.b + d.b * progress) * 255) | 0;
                var a = (i.a + d.a * progress);
                //console.log ('color.proxy: ',from, delta, progress, r, g, b, a);

                if ( $.support.colorAlpha )
                    obj.$target[ obj.type ]( obj.property, "rgba(" + [r,g,b,a].join( ',' ) + ")");
                else
                    obj.$target[ obj.type ]( obj.property, "rgb(" + [r,g,b].join( ',' ) + ")");
            }
        });

        this.addTweenType('class', {
            match: false,
            parse: function(val){
                return val;
            },
            canTween: function(a,b){
                return true;
            },
            getDelta: function( to, from, method) {
                return to;
            },
            proxy: function( obj, progress ) {
                var $t = obj.$target;
                if (progress < 1){
                    if ( !$t.hasClass(obj.property) )
                        $t.addClass(obj.property);
                }
                else{
                    if ( $t.hasClass(obj.property) )
                        $t.removeClass(obj.property);
                }
            }
        });

        this.addTweenType('event', {
            match: false,
            parse: function(val){
                return val;
            },
            canTween: function(a,b){
                return true;
            },
            getDelta: function( to, from, method) {
                return to;
            },
            proxy: function( obj, progress ) {
                var $t = obj.$target;
                if (progress >= 1){
                    $t.trigger(obj.property,false,false, obj.deltaValue );
                }
                else if (progress <= 0){
                    $t.trigger(obj.property,false,false, obj.initialValue );
                }
            }
        });

        this.addTweenType('setafter', {
            match: true,
            parse: function(val){
                return val;
            },
            canTween: function(a,b){
                return true;
            },
            getDelta: function( to, from, method) {
                return to;
            },
            proxy: setAfterProxy
        });



        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {
            tween: function( properties, duration, delay, easing, collisions, returnId ){
                var tweenId = self.registerTween( new self.Tween( duration, easing, delay ) );
                self.addTarget( tweenId, this.getAll(), properties, collisions );
                self.start(tweenId);

                if (returnId === true)
                    return tweenId;

                return this;
            }
        };


        //==================================================================
        // Classes
        //==================================================================
        this.Tween = function( duration, easing, delay ) {
            this.init( duration, easing, delay );
            return this;
        };
        this.Tween.prototype = {
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
                if (typeof easing == "function")
                    this.easing = easing;
                else if (typeof easing == "string")
                    this.easing = $.easing.get( easing );
                else
                    this.easing = $.easing.get('default');
                this.delay = delay || 0;
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
                //console.log('Tween.start', this.active);
                if (!this.active){
                    this.active = true;
                    this.startTime = $.now();
                    startTicking();
                    $.event.trigger(this,'tweenstart',false,false);
                }
            },
            stop: function(){
                this.active = false;
                this.complete = true;
                $.event.trigger(this,'tweenstop',false,false);
            },
            pause: function(){
                if (this.active){
                    this.active = false;
                    this.pauseTime = $.now();
                    $.event.trigger(this,'tweenpause',false,false);
                }
            },
            resume: function(){
                if (!this.active){
                    this.active = true;
                    this.startTime += $.now() - this.pauseTime;
                    startTicking();
                    $.event.trigger(this,'tweenresume',false,false);
                }
            }


        };


        this.TweenObject = function( tweenId, target, type, property, initialValue, deltaValue, proxy ){
            this.init( tweenId, target, type, property, initialValue, deltaValue, proxy );
            return this;
        };
        this.TweenObject.prototype = {
            $target: null,
            target: null,
            type: null,
            property: null,
            tweenId: -1,
            initialValue: null,
            deltaValue: null,
            proxy: null,
            units: "",

            init: function( tweenId, target, type, property, initialValue, deltaValue, proxy ){
                this.$target = $(target);
                this.target = target;
                this.type = type;
                this.property = property;
                this.tweenId = tweenId;
                this.initialValue = initialValue;
                this.deltaValue = deltaValue;
                this.proxy = proxy;
                //console.log('proxy', proxy);
            },

            apply: function( value ){
                //console.log('TweenObject::apply',this.property, value);
                this.proxy( this, value );
            }
        };

    };

	//register module
	lola.registerModule( new Module() );

})( lola );

/***********************************************************************
 * Lola JavaScript Framework Module
 *
 *       Module: Motion Range Control
 *  Description: scrolling control module
 *       Author: Copyright 2012, tylerbeck
 *
 ***********************************************************************/
(function (lola) {
    var $ = lola;

    /**
     * Motion Range Module
     * @namespace lola.motion
     */
    var Module = function () {
	    var $ = lola;
	    var self = this;

	    //==================================================================
        // Attributes
        //==================================================================

        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "motion";

        /**
         * agent's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ["tween"];

        var groups = {};

        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function () {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function () {
            return dependencies;
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * module initializer
         */
        this.initialize = function(){
            $.syslog('motion::initialize');

            delete self.initialize;
        };

        /**
         * registers a motion group
         * @param name
         * @param options
         */
        this.register = function( name, options ){
            if (!groups[ name ]){
                var group = new Group( name );
                if ( options.frames ) group.frames( options.frames );
                if ( options.maxRate ) group.maxRate( options.maxRate );
                if ( options.timed ) group.timed( options.timed );
                if ( options.loop ) group.loop( options.loop );
                if ( options.step ) group.step( options.step );

                groups[ name ] = group;
            }

            //TODO: add inline targets
        };

        function getGroups( names ){
            var result = [];
            if (names == undefined){
                names = groups.keys();
            }
            else if (typeof names == "string"){
                names = [names];
            }

            if (Array.isArray(names)){
                names.forEach( function( name ){
                    if (groups[ name ])
                        result.push( name );
                })

            }

            return result;
        }

        /**
         * removes a motion group
         * @param groupNames
         */
        this.remove = function( groupNames ){
            var names = getGroups( groupNames );
            names.forEach( function(name){
                var group = groups[name];
                group.destroy();
                delete groups[name];
            });
        };

        /**
         * gets a motion group
         * @param name
         */
        this.get = function( name ){
            return groups[name];
        };

        /**
         * adds targets to the specified group
         * @param groupName
         * @param objects
         * @param options
         */
        this.addTargets = function( groupName, objects, options ){
            var group = groups[groupName];
            if (group){
                group.addTargets( objects, options );
            }
        };

        /**
         * removes targets from specified groups
         * @param targets
         * @param groupNames
         */
        this.removeTargets = function( targets, groupNames ){
            var names = getGroups( groupNames );
            names.forEach( function(item){
                var group = groups[item];
                if (group){
                    group.removeTargets( targets );
                }
            });
        };

        /**
         * sets target position for specified groups
         * @param value
         * @param groupNames
         */
        this.position = function( value, groupNames ){
            var names = getGroups( groupNames );
            names.forEach( function(name){
                if (groups[name]){
                    groups[name].position( value );
                }
            });
        };


        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {
            motionRange: function( groupName, options ){
                self.addTargets( groupName, this.getAll(), options );
                return this;
            }
        };


        //==================================================================
        // Classes
        //==================================================================
        var Group = function( name ){
			var $ = lola;
            var self = this;
            var anim = new $.animation.Animation( tick, self );
            $.animation.register( namespace+'.'+name, anim );
            var frameCount = 10000;
            var maxRate = 5000;
            var loop = false;
            var doLoop = false;
            var timed = false;
            var stepFn;
            var targetPosition = 0;
            var lastPosition = 0;
            var targets = [];
            var count = 0;

            /**
             * sets end position for keyed motion
             * @param {int} value
             */
            self.frames = function( value ){
                if (value){
                    frameCount = parseInt(value);
                }
                return frameCount;
            };

            /**
             * sets target position for keyed motion
             * @param {int} val
             */
            self.position = function( value ){
                //console.log( value );
                if ( value != undefined ){
                    targetPosition = Math.round( value );
                    anim.start();
                }
                return targetPosition;
            };

            /**
             * sets maximum progression rate per secont
             * @param {int} value
             */
            self.maxRate = function( value ){
                if ( value != undefined ){
                    maxRate = value;
                }
                return maxRate;
            };

            self.timed = function( value ){
                if ( value != undefined )
                    timed = ( value === true );

                return timed;
            };

            self.loop = function( value ){
                if ( value != undefined )
                    loop = ( value === true );

                return loop;
            };

            self.step = function( value ){
                if ( value != undefined )
                    stepFn = (typeof value == 'function') ? value : false;

                return stepFn;
            };



            self.start = function(){
                if (timed){
                    doLoop = loop;
                    self.position( frameCount );
                }
            };

            self.stop = function(){
                doLoop = false;
                targetPosition = lastPosition;
            };


            /**
             * animation tick function
             * @param now
             * @param delta
             * @param elapsed
             */
            function tick( now, delta, elapsed ){
                //console.log('tick[', now,']', targetPosition, lastPosition);
                var active = false;

                if (targetPosition != lastPosition){
                    //get current delta to target
                    var d = targetPosition - lastPosition;
                    var sign = d < 0 ? -1 : 1;

                    //move half the distance now
                    d /= 2;

                    var rate = maxRate * ( delta / 1000 );
                    var abs = d * sign;

                    if (abs > rate){
                        rate *= sign;
                        self.update( lastPosition + rate );
                        active = true;
                    }
                    else if ( abs < 1){
                        self.update( targetPosition );
                    }
                    else {
                        self.update( lastPosition + d );
                        active = true;
                    }
                }

                if (timed && doLoop){
                    active = true;
                }

                return active;
            }

            /**
             * updates all targets with the current position
             * @param {Number} position
             */
            self.update = function( position ){
                var positive = position > lastPosition;
                position = Math.round( Math.min( frameCount, Math.max(0,position) ) );
                if ( timed && doLoop && position == frameCount ){
                    position = 0;
                }
                var i = 0;
                while( i < count ){
                    targets[i].position( position, positive );
                    i++;
                }

                if (stepFn)
                    stepFn(position);

                lastPosition = position;
            };

            /**
             * adds keyed motion targets
             * @param objects
             * @param options
             */
            self.addTargets = function( objects, options ){
                if (!Array.isArray(objects))
                    objects = [objects];

                var start = (options.start) ? options.start : 0;
                var end = (options.end) ? options.end : frameCount;
                var ease = $.easing.get( options.ease ? options.ease : 'linear' );

                delete options.start;
                delete options.end;
                delete options.ease;

                //getTweenObject = function( tweenId, target, group, property, value, dispatcher ){
                objects.forEach( function(obj){
                    for (var g in options){
                        if (options.hasOwnProperty(g)){
                            var optGroup = options[g];
                            for (var p in optGroup ){
                                if (optGroup.hasOwnProperty(p)){
                                    var pObj = Array.isArray(optGroup[p]) ? optGroup[p] : [optGroup[p]];
                                    pObj.forEach(function(item){
                                        var s = item.start == undefined ? start : item.start;
                                        var e = item.end == undefined ? end : item.end;
                                        var es =  item.ease == undefined ? ease : $.easing.get(item.ease);
                                        var st = item.step;
                                        targets.push( new RangeTween( obj, g, p, item, es, s, e, st ) );
                                    });
                                }
                            }
                        }
                    }
                });

                count = targets.length;
            };

            /**
             * removes targets from group
             * @param objects
             */
            self.removeTargets = function( objects ){
                var newTargets = [];
                targets.forEach( function(item){
                    if ( objects.indexOf( item.obj ) == -1 ){
                        newTargets.push( item );
                    }
                });
                targets = newTargets;
            };

            /**
             * destroy group - unregister animation and targets
             */
            self.destroy = function(){
                targets = [];
                $.animation.remove( namespace+'.'+name );
            }

        };

        /**
         * Class used for storing keyed motion targets
         * @param target
         * @param group
         * @param property
         * @param value
         * @param ease
         * @param start
         * @param end
         */
        var RangeTween = function( target, group, property, value, ease, start, end, step ){
	        var $ = lola;
	        var self = this;
            var tweenObject = new $.tween.getTweenObject( -1, target, group, property, value );
            var active = false;
            var delta = end - start;
            var lastPosition = 0;

            if (typeof step != 'function')
                step = false;

            /**
             * set the position of this target
             * @param position
             * @param positive
             */
            self.position = function( position, positive ){
                var value = undefined;
                if ( position >= start && position <= end ){
                    active = true;
                    value = ease.exec( position-start, 0, 1, delta);
                }
                else if ( active ){
                    active = false;
                    value = positive ? 1 : 0;
                }
                else{
                    //prevent skipping this objects range and not setting anything
                    if (positive && lastPosition < start && position > end ){
                        value = 1;
                    }
                    else if (!positive && lastPosition > end && position < start ){
                        value = 0;
                    }
                }
                if (value != undefined){
                    tweenObject.apply( value );
                    if (step)
                        step( value, this );
                }

                lastPosition = position;

            }
        };

    };

    //register module
    lola.registerModule(new Module());

})(lola);

/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Chart
 *  Description: Chart module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function (lola) {
    /**
     * Chart Module
     * @namespace lola.chart
     */
    var Module = function(){
	    var $ = lola;
	    var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "chart";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ['graphics'];


        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };


        //==================================================================
        // Methods
        //==================================================================

        //==================================================================
        // Classes
        //==================================================================
        this.Grid = function(x,y,width,height,spacing,flags){

            function init(x,y,width,height,spacing,flags){
                x = x || 0;
                y = y || 0;
                width = width || 100;
                height = height || 100;
                spacing = spacing || 10;
                flags = (flags==undefined)?3:flags;
            }

            this.draw = function( ctx, flgs ){
                flgs = flgs == undefined ? flags : flgs;

                var i;
                //vertical
                if (flgs & self.Grid.VERTICAL){
                    for (i=x+spacing; i<=width+x; i+=spacing){
                        ctx.beginPath();
                        ctx.moveTo(i,y);
                        ctx.lineTo(i,y+height);
                        ctx.stroke();
                        ctx.closePath();
                    }
                }
                //horizontal
                if (flgs & self.Grid.HORIZONTAL){
                    for (i=y+spacing; i<=height+y; i+=spacing){
                        ctx.beginPath();
                        ctx.moveTo(x,i);
                        ctx.lineTo(x+width,i);
                        ctx.stroke();
                        ctx.closePath();
                    }
                }
            };

            init(x,y,width,height,spacing,flags);

            return this;
        };
        this.Grid.HORIZONTAL = 0x1;
        this.Grid.VERTICAL = 0x2;


        this.Axis =function(x,y,size,label,labelOffset,flags ){
            function init(x,y,size,label,labelOffset,flags){
                x = x || 0;
                y = y || 0;
                size = size || 100;
                label = label;
                if( labelOffset ) labelOffset = labelOffset;
                flags = (flags==undefined)?0x2:flags;
            }

            this.draw = function( ctx, flgs ){
                flgs = flgs == undefined ? flags : flgs;
                ctx.beginPath();
                ctx.moveTo( x, y );
                if (flgs & self.Axis.VERTICAL){
                    //vertical axis
                    ctx.lineTo( x, y+size );
                }
                else {
                    //horizontal axis
                    ctx.lineTo( x+size, y );
                }
                ctx.stroke();
                ctx.closePath();

                if (label) {
                    if (flgs & self.Axis.VERTICAL) {
                        //label at bottom
                        ctx.textAlign = "center";
                        ctx.fillText( label, x + labelOffset.x, y + size + labelOffset.y );
                    }
                    else {
                        ctx.textAlign = "right";
                        ctx.fillText( label, x + labelOffset.x, y + labelOffset.y );
                    }
                }
            };


            init(x,y,size,label,labelOffset,flags);
            return this;
        };
        this.Axis.VERTICAL = 0x1;

    };


    //register module
    lola.registerModule( new Module() );

})(lola);
/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Time Value of Money
 *  Description: Time Value of Money Math module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
    /**
     * Array Module
     * @namespace lola.array
     */
    var Module = function(){
	    var $ = lola;
	    var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "math.tvm";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [];


        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * present value
         * @param fv future value
         * @param rate rate per term
         * @param term
         */
        this.pv = function( fv, rate, term ) {
            return fv / Math.pow( 1 + rate, term );
        };

        /**
         * future value
         * @param pv present value
         * @param rate rate per term
         * @param term
         */
        this.fv = function( pv, rate, term ) {
            return pv * Math.pow( 1 + rate, term );
        };


        /**
         * present value of an annuity
         * @param a annuity
         * @param rate rate per term
         * @param term
         */
        this.pva = function( a, rate, term ) {
            return a * (1 - ( 1 / Math.pow( 1 + rate, term ) ) ) / rate;
        };

        /**
         * future value of an annuity
         * @param a annuity
         * @param rate rate per term
         * @param term
         */
        this.fva = function( a, rate, term ) {
            return a * (Math.pow( 1 + rate, term ) - 1) / rate;
        };

        /**
         * payment
         * @param pv present value
         * @param rate rate per term
         * @param term
         * @param fv future value
         */
        this.payment = function( pv, rate, term, fv ) {
            var rp = Math.pow( 1 + rate, term );
            return  pv * rate / ( 1 - (1 / rp)) - fv * rate / (rp - 1);
        };


    };



	//register module
	lola.registerModule( new Module() );

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
    /**
     * Test Module
     * @namespace lola.test
     */
    var Module = function(){

	    var $ = lola;
	    var self = this;

        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "test";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [];

        /**
         * source for tests
         * @private
         */
        var src = "tests.xml";

        /**
         * current executable index
         * @private
         */
        var index = -1;

        /**
         * executables
         * @private
         */
        var executables = [];

        /**
         * current executable
         * @private
         */
        var current = null;

        /**
         * function used to output test results
         * @private
         */
        var logFn = function(){
            console.log( Array.prototype.slice.call(arguments, 0).join(' ') );
        };
        var errorFn = function(){
            console.error( Array.prototype.slice.call(arguments, 0).join(' ') );
        };

        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };

        /**
         * sets the output function
         * @param {Function} fn
         */
        this.setLogFn = function( fn ){
            logFn = fn;
        };
        /**
         * sets the output function
         * @param {Function} fn
         */
        this.setErrorFn = function( fn ){
            errorFn = fn;
        };

        /**
         * sets the test source
         * @param {String} source
         */
        this.setSource = function( source ){
            src = source;
        };

        /**
         * gets the current executeable
         */
        this.current = function(){
            return current;
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * load and run all tests
         */
        this.start = function(){
            //load test source
            executables = [];
            logFn('lola.test.run: '+src);
            loadExternalXML( src );
            index = -1;
            next();
            return "";
        };

        /**
         * loads external test xml source
         * @param source
         */
        function loadExternalXML( source ){

            var req = new $.http.SyncRequest( source );
            req.send();
            var xml = req.responseXML();
            var list = [];

            //parse test source
            if (xml.documentElement.tagName == "tests"){
                var root = xml.documentElement;
                var count = root.childNodes.length;
                for ( var i = 0; i < count; i++ ){
                    var n = root.childNodes[i];
                    //logFn( n.nodeType, n.nodeName.toLowerCase() );
                    if ( n.nodeType == 1){
                        switch( n.nodeName.toLowerCase() ){
                            case 'script':
                                //this is a setup or teardown script
                                var script = new Script(n);
                                list.push( script );
                                break;
                            case 'test':
                                //this is a test
                                var t = new Test(n);
                                list.push( t );
                                break;
                            case 'xml':
                                //this is a test
                                var x = new ExternalXML(n);
                                list.push( x );
                                break;
                        }
                    }
                }
            }
            list.unshift( 0 );
            list.unshift( index + 1 );

            executables.splice.apply(executables, list );
        }

        /**
         * run next executable
         */
        function next(){
            index++;
            //logFn( test.index, '/', test.executables.length );
            if ( index < executables.length ){
                var executable = executables[ index ];
                current = executable;
                var completed = executable.execute();
                if (completed){
                    setTimeout( function(){ next();}, 2);
                }
            }
            else {
                complete();
            }
        }


        /**
         * called when all groups have executed
         * @private
         */
        function complete(){
            $.syslog('lola.test.complete');

        }

        //==================================================================
        // Classes
        //==================================================================
        /**
         * @private
         * @class
         * @param {Node} node
         */
        function Script( node ){
	        var $ = lola;
	        var name = "";
            var value = "";

            this.execute = function(){
                logFn('executing', '"'+name+'"', 'script');
                //try {
                $.evaluate( value );
                //}
                //catch( e ){
                //   errorFn('error evaluating', name, 'script:', e.message );
                //}

                return true;
            };

            if ((node.hasAttribute('name')))
                name = node.attributes.getNamedItem("name").nodeValue;

            var str = "";
            for( var i = 0; i<node.childNodes.length; i++){
                str += node.childNodes[i].data;
            }
            value = str;

            return this;
        }

        /**
         * @private
         * @class
         * @param {Node} node
         */
        function Test( node ){
	        var $ = lola;
	        var name;
            var result;
            var assert = "==";
            var compareTo;
            var test;
            var async = false;
            var passed;
            var error = "";

            this.execute = function(){
                logFn( name );
                try {
                    if ( async ){
                        $.evaluate( test );
                        return false;
                    }
                    else {
                        result = eval( test );
                        compare();
                        return true;
                    }
                }
                catch( e ){
                    passed = false;
                    error = 'failed due to error: '+e.message;
                    errorFn( '    ', error );
                    logFn ( '    ', e );
                    return true;
                }
            };

            this.setResult = function( val ){
                result = val;
                compare();
                next();
            };

            function compare(){
                switch (assert){
                    case "equals":
                        passed = result == compareTo;
                        if (!passed)
                            error = "assertion false: "+result+" == "+compareTo;
                        break;
                    case "strictlyEquals":
                        passed = result === compareTo;
                        if (!passed)
                            error = "assertion false: "+result+" === "+compareTo;
                        break;
                    case "doesNotEqual":
                        passed = result != compareTo;
                        if (!passed)
                            error = "assertion false: "+result+" != "+compareTo;
                        break;
                    case "greaterThan":
                        passed = result > compareTo;
                        if (!passed)
                            error = "assertion false: "+result+" > "+compareTo;
                        break;
                    case "lessThan":
                        passed = result < compareTo;
                        if (!passed)
                            error = "assertion false: "+result+" < "+compareTo;
                        break;
                    case "greaterThanOrEquals":
                        passed = result >= compareTo;
                        if (!passed)
                            error = "assertion false: "+result+" >= "+compareTo;
                        break;
                    case "lessThanOrEquals":
                        passed = result <= compareTo;
                        if (!passed)
                            error = "assertion false: "+result+" <= "+compareTo;
                        break;
                    default:
                        passed = result == compareTo;
                        if (!passed)
                            error = "assertion false: "+result+" == "+compareTo;
                        break;
                }

                if (passed) {
                    //logFn( '    ','passed');
                }
                else {
                    error = 'failed, '+error;
                    errorFn( '    ', "["+name+"] "+error );
                }
            }

            function init( node ){

                name = node.attributes.getNamedItem("name").nodeValue;

                if (node.hasAttribute('async'))
                    async = node.attributes.getNamedItem("async").nodeValue == "true";

                if (node.hasAttribute('equals')){
                    assert = "equals";
                }
                else if (node.hasAttribute('strictlyEquals')){
                    assert = "strictlyEquals";
                }
                else if (node.hasAttribute('doesNotEqual')){
                    assert = "doesNotEqual";
                }
                else if (node.hasAttribute('greaterThan')){
                    assert = "greaterThan";
                }
                else if (node.hasAttribute('lessThan')){
                    assert = "lessThan";
                }
                else if (node.hasAttribute('greaterThanOrEquals')){
                    assert = "greaterThanOrEquals";
                }
                else if (node.hasAttribute('lessThanOrEquals')){
                    assert = "lessThanOrEquals";
                }

                var rawValue = node.attributes.getNamedItem( assert ).nodeValue;
                var type = node.attributes.getNamedItem("type").nodeValue;
                switch ( type ){
                    case "float":
                        compareTo = parseFloat( rawValue );
                        break;
                    case "int":
                        compareTo = parseInt( rawValue );
                        break;
                    case "bool":
                        compareTo = rawValue === "true";
                        break;
                    default:
                        compareTo = String( rawValue );
                        break;
                }

                var str = "";
                for( var i = 0; i<node.childNodes.length; i++){
                    str += node.childNodes[i].data;
                }
                test = str;
            }
            init(node);
            return this;
        }

        /**
         * @private
         * @class
         * @param {Node} node
         */
        function ExternalXML( node ){
	        var $ = lola;
	        var source;

            if ((node.hasAttribute('src')))
                source = node.attributes.getNamedItem("src").nodeValue;

            this.execute = function(){
                var ls = $.string;
            	var div = ls.padFront( ls.padEnd("\nsource\n",'=',56), '=',104);
                logFn(div);
                if (source){
                    loadExternalXML( source );
                }
                return true;
            };

        }

    };


    //register module
    lola.registerModule( new Module() );

})( lola );

/***********************************************************************
 * Lola JavaScript Framework
 *
 *  Description: Base Construct Tail
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ){
    if ( document.readyState === "complete" ) {
        lola.initialize( window );
    }
    else {
        if ( document.addEventListener ) {
            document.addEventListener( "DOMContentLoaded", lola.initialize, false );
            lola.window.addEventListener( "load", lola.initialize, false );
        }
        else if ( document.attachEvent ) {
            document.attachEvent( "onreadystatechange", lola.initialize );
            lola.window.attachEvent( "onload", lola.initialize );
        }
    }

})(lola);