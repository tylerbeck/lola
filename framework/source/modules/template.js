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
            $.debug('lola.template::initialize');

            //do module initialization
            //get all predefined templates
            var start = $.now();
            $('script[type="text/x-lola-template"]').forEach( function( item ){
                self.add( item.id, item.innerHTML );
            });
            var complete = $.now();
            $.debug( "templates parsed in "+(complete-start)+" ms" );


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

