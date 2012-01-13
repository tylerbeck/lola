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
	 * @namespace lola.array
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
        var dependencies = [];

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
 *       Module: Array
 *  Description: Array module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Array Module
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
            //TODO: See if explicit declaration of the array selector methods is still required
            /**
             * iterates each element in Selector and applies callback.
             * @param {Function} callback function callback( item, index, array ):void
             */
            forEach: function( callback ) {
                this.forEach( callback );
                return this;
            },

            /**
             * iterates each element in Selector and checks that every callback returns true.
             * @param {Function} callback function callback( item, index, array ):Boolean
             */
            every: function( callback ) {
                return this.every( callback );
            },

            /**
             * iterates each element in Selector and checks that at least one callback returns true.
             * @param {Function} callback function callback( item, index, array ):Boolean
             */
            some: function( callback ) {
                return this.some( callback );
            }

        };

    };


	//register module
	lola.registerModule( new Array() );

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
	var Type = function() {

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

            objTypes.split(' ').forEach( mapObject );
            tagTypes.split(' ').forEach( mapTag );
            specialTagTypes.split(' ').forEach( mapSpecialTag );

            var tn = document.createTextNode( 'test' );
            var cn = document.createComment( 'test' );
            var tntype = Object.prototype.toString.call( tn );
            var cntype = Object.prototype.toString.call( cn );
            map[ tntype ] = 'textnode';
            map[ cntype ] = 'commentnode';

            //TODO: add isTextNode and isCommentNode selector functions
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
            lola.evaluate( isfn );
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
            lola.evaluate( isfn );
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
            lola.evaluate( isfn );
        }

        /**
         * gets the specified object's type
         * @param {Object} object
         * @return {String}
         */
        this.get = function( object ) {
            if ( object ) {
                var type = map[ Object.prototype.toString.call( object ) ];
                if ( type )
                    return type;
                return 'other ';
            }
            return 'null';
        };

        this.isPrimitive = function( object ) {
            return primitives.indexOf(this.get(object)) >= 0;
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
                    return lola.type.get( this[index]) == type;
                }
                else {
                    return this.every( function( item ){
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
                        return lola.type.isPrimitive(item) >= 0;
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
	lola.registerModule( new Type() );

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
	var DOM = function(){

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
         */
        this.attr = function( object, name, value ) {
            //console.log('dom.attr');
            if ( attributeHooks[name] ) {
                return attributeHooks[name].apply( object, arguments );
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
        };

        /**
         * deletes expando properties
         * @param {Object} object
         * @param {String} name
         */
        this.deleteExpando =function( object, name ) {
            if ( lola.support.deleteExpando )
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
            return this.isAncestor( b, a );
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
                if ( this.length > 0 ) {
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
                if ( this.length > 0 ) {
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
                if ( this.length > 0 ) {
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
                if ( this.length > 0 ) {
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
                if ( this.length > 0 ) {
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
                if ( this.length > 0 ) {
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


    };


	//register module
	lola.registerModule( new DOM() );

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
	 * @namespace lola.data
	 */
	var Data = function(){

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
            return lola.data.uid++;
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
            var cacheId = lola.dom.attr( object, lola.data.cacheIDProp );
            if ( cacheId == null ) {
                switch ( lola.type.get( object ) ) {
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
                        cacheId = lola.dom.attr( object, lola.data.cacheIDProp );
                        if ( cacheId == null && create ) {
                            cacheId = lola.data.nextUid();
                            lola.dom.attr( object, lola.data.cacheIDProp, cacheId );
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
                    return this.set( object, obj, namespace, false );
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
            return cache[namespace];
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
                lola.extend(cache[namespace][cacheId], data, true );

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
                    if ( lola.type.get(namespace) != "array" )
                        namespace = [namespace];
                }

                namespace.forEach( function( nsp ) {
                    delete cache[nsp][cacheId];
                } )

            }
            if (recurse === undefined)
                recurse = true;

            if ( recurse ) {
                if ( object.childNodes ) {
                    object.childNodes.forEach( function( item ) {
                        lola.data.remove( item, namespace, true );
                    } )
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

        //==================================================================
        // Preinitialize
        //==================================================================
        lola.addSafeDeleteHook( this.remove, this );

    };


	//register module
	lola.registerModule( new Data() );

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