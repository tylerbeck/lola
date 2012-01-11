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
        }

    };

	//register module
	lola.registerModule( template );

})( lola );

