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

})( lola );