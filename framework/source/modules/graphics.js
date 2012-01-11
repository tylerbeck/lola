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
            if ( lola.hasFn(this.routines,name) ){
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
            if ( lola.hasFn( object, 'draw')){
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
