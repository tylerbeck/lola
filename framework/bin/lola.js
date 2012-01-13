/***********************************************************************
 * Lola JavaScript Framework
 *
 *  Description: Base Construct Head
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
    var lola = function( selector, context ){
        return new lola.Selector( selector, context );
    };

    /**
     * window reference
     */
    lola.window = window;

    /**
     * extends the target with properties from the source
     * @public
     * @param target {Object}
     * @param source {Object}
     * @param overwrite {Boolean|undefined}
     * @param errors {Boolean|undefined}
     * @param deep {Boolean|undefined}
     * @return {void}
     */
    lola.extend = function( target, source, overwrite, errors, deep ) {
        //TODO: make deep copy an option
        if ( overwrite == undefined ) overwrite = false;
        if ( errors == undefined ) errors = false;
        if ( deep == undefined ) deep = false;
        for ( var k in source ) {
            if ( overwrite || target[ k ] == null )
                target[ k ] = source[ k ];
            else if ( errors )
                throw new Error( "property " + k + " already exists on extend target!" );
        }
    };

    /**
     * creates/gets and returns the object lineage defined in chain param
     * @public
     * @param {!Object} base object on which to build chain
     * @param {!String} chain "." seperated namespace / package
     * @return {Object}
     */
    lola.getPackage = function( base, chain ) {
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
     * registers a module with the Lola Framework
     * @public
     * @param {Object} module
     * @return {void}
     */
    lola.registerModule = function( module ) {
        var namespace = module.namespace();

        //add module to namespace
        lola.extend( lola.getPackage( lola, namespace ), module, false, false );

        //add module dependencies
        if (this.hasFn( module, "dependencies" )){
            lola.addDependencies( namespace, module.dependencies() );
        }

        //add selector methods
        if ( module[ "selectorMethods" ] ){
            lola.extend( lola.Selector.prototype, module[ "selectorMethods" ], false, false );
            delete module[ "selectorMethods" ];
        }

        //add initializer
        if ( lola.hasFn( module, "initialize" ) ) {
            lola.addInitializer( module.initialize );
        }

        lola.debug('module registered:', namespace );

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

        delete lola['initialize'];
    };

    window['lola'] = lola;
    window['$'] = lola;

})(window);
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
        if ( typeof selector === "string" ){
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
        else if ( Array.isArray( selector ) ) {
            var sl = selector.length;
            for (i=0; i<sl; i++){
                this[i] = sl[i];
            }
        }
        else {
            this[i] = selector;
            i++;
        }
        this.length = i;

        return this;
    };
    lola.Selector.prototype = Array.prototype;
})(lola);

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

(function( lola ) {
	var $ = lola;
	/**
	 * Array Module
	 * @implements {lola.Module}
     * @namespace lola.array
	 */
	var Array = function(){

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
        var dependencies = {};


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
         * @param {String} property
         * @return {Function}
         */
        this.getSortFunction = function( property ){
            return function( a, b ) {
                var x = a[property];
                var y = b[property];
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            };
        };

        /**
         * sort an array on a property
         * @param {Array} array
         * @param {String} property
         */
        this.sortOn = function( property, array ){
            return array.sort( lola.array.getSortFunction(property) );
        };



        //==================================================================
        // Selector Methods
        //==================================================================
        this.selectorMethods = {

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

    };


	//register module
	lola.registerModule( new Array() );

})( lola );

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
	var Core = function(){

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
         * module's dependencies
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

        /**
         * @private
         * @type {Boolean}
         */
        var debugMode = false;

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
         * @param {String} url
         */
        this.setURL = function( url ){
            url = new Core.URL( url );
            debugMode = url.vars['debug'] == "true";
        };

        /**
         * gets debug mode
         * @return {Boolean}
         */
        this.debugMode = function(){
            return debugMode;
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
            initializers.push( fn );
        };

        /**
         * adds function to safedelete stack
         * @param {Function} fn
         */
        this.addSafeDeleteHook = function( fn ){
            safeDeleteHooks.push( fn );
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
         * @param {String} property property to delete
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
         */
        this.checkDependencies = function(){

            var fails = [];
            for ( var k in dependencies ) {
                var missing = hasModules( dependencies[k] );
                if ( missing.length > 0 )
                    fails.push(k+': '+missing.join(', '));
            }
            if ( fails.length > 0 ) {
                throw new Error( "module dependency checks failed for: \n\t" + fails.join( "\n\t" ) );
            }
        };

        /**
         * checks if modules are registered and returns missing modules
         * @private
         * @param {Array} modules
         * @return {Array} missing modules
         */
        function hasModules( modules ){
            var missing = [];

            Object.forEach(modules, function(item){
                if (!lola.hasPackage( lola, item ))
                    missing.push(item);
            });

            return missing;
        }

        /**
         * framework initialization function
         */
        this.executeInitializers = function() {
            lola.debug('core::executeInitializers');
            var i;
            var stackSize = initializers.length;

            for ( i = 0; i < stackSize; i++ ) {
                if (lola.hasFn(initializers,i)){
                    initializers[i]();
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

            if ( lola.support.domEval ) {
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
                lola.event.addListener(script, 'load', function(){callback.apply()} );

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
         * outputs debug statement
         */
        this.debug = function(/*args*/){
            if (debugMode) {
                console.log("["+this.now()+"]", [].splice.call(arguments,0).join(' '));
            }
        };

        /**
         * Object prototype's to string method
         * @param {Object} object
         * @return {String}
         */
        this.toString = Object.prototype.toString;

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
                return this[ index ];
            },

            /**
             * returns all of the selected elements
             * @return {Array}
             */
            getAll: function() {
                return this;
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

                //TODO: figure out concatination

                /*if ( obj instanceof lola.Selector ) {
                 this.elements = this.concat( obj.getAll() );
                 }
                 else if ( obj instanceof Array ) {
                 var item;
                 while ( item = obj.pop() ) {
                 this.push( item );
                 }

                 }
                 else {
                 this.push( obj );
                 }

                 if (unique == undefined || unique === true){
                 var uni = lola.array.unique( this );
                 this.elements =;
                 }

                 */

                return this;
            }
        };


        return this;
    };


    //==================================================================
    // Classes
    //==================================================================
    /**
     * URL Class
     * @class
     * @param {String} url
     */
    Core.URL = function( url ){
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
    Core.URL.prototype = {
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


    var core = new Core();
    core.setURL( lola.window.location.href );
    lola.registerModule( core );

})( lola );/***********************************************************************
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
	var Support = function(){

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
        var dependencies = {};

        /**
         * @private
         */
        var _domEval = false;

        /**
         * @private
         */
        var _style = false;

        /**
         * @private
         */
        var _cssFloat = false;

        /**
         * @private
         */
        var _colorAlpha = false;

        /**
         * @private
         */
        var _deleteExpando = true;

        /**
         * @private
         */
        var _msEvent = false;

        /**
         * @private
         */
        var _domEvent = true;

        /**
         * @private
         */
        var _animationFrameType = 0;


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

        /**
         * DOM eval support getter
         */
        this.domEval = function(){
            return _domEval;
        };

        /**
         * style support getter
         */
        this.style = function(){
            return _style;
        };

        /**
         * cssFloat support getter
         */
        this.cssFloat = function(){
            return _cssFloat;
        };

        /**
         * msEvent support getter
         */
        this.msEvent = function(){
            return _msEvent;
        };

        /**
         * domEvent support getter
         */
        this.domEvent = function(){
            return _domEvent;
        };

        /**
         * deleteExpando support getter
         */
        this.deleteExpando = function(){
            return _deleteExpando;
        };

        /**
         * anaimationFrame type getter
         */
        this.animationFrameType = function(){
            return _animationFrameType;
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

        _domEval = lola.window[ uid ];
        delete lola.window[ uid ];

        //create div for testing
        var div = document.createElement( 'div' );
        div.innerHTML = "<div style='color:black;opacity:.25;float:left;background-color:rgba(255,0,0,0.5);' test='true' >test</div>";
        var target = div.firstChild;

        //style tests
        _style = (typeof target.getAttribute( 'style' ) === 'string');
        _cssFloat = /^left$/.test( target.style.cssFloat );
        _colorAlpha = /^rgba.*/.test( target.style.backgroundColor );

        //delete expandos
        try {
            delete target.test;
        }
        catch( e ) {
            _deleteExpando = false;
        }

        //event model
        if ( document.addEventListener )
            this._domEvent = true;
        else if ( document.attachEvent )
            this._msEvent = true;

        //animation frame type
        if ( window.requestAnimationFrame )
            lola.tween.getFrameType = 1;
        else if ( window.mozRequestAnimationFrame )
            lola.tween.getFrameType = 2;
        else if ( window.webkitRequestAnimationFrame )
            lola.tween.getFrameType = 3;
        else if ( window.oRequestAnimationFrame )
            lola.tween.getFrameType = 4;


    };

    //register module
    lola.registerModule( new Support() );

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