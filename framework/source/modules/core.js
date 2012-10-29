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
                        self.push( item );
                    })
                }
                else if (Array.isArray( obj )){
                    obj.forEach( function(item){
                        self.push( item );
                    })
                }
                else{
                    self.push( obj );
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

})( lola );