(function( lola ) {
	var $ = lola;
	/**
	 * @description Graphics Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var graphics = {

		//==================================================================
		// Attributes
		//==================================================================
        /**
         * @description default context
         * @private
         */
		ctx: null,

        /**
         * @description 2d context map
         * @private
         */
		map2d: {},

        /**
         * @description 2d context reset object
         * @private
         */
		reset2d: {},

        /**
         * @description 2d style map
         * @private
         */
        styles2d: {},

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.graphics::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization
			lola.safeDeleteHooks.push( {scope:this, fn:this.remove2dContext} );

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
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.graphics::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.graphics.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "graphics";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [ "math.point","math.vector" ];
		},

        /**
         * @description maps 2d context of specified canvas
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
         * @description unmaps 2d context for specified canvas
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
         * @description get a mapped context
         * @param {String} id
         * @return {Object}
         */
        get2dContext: function(id) {
            return this.map2d[id];
        },

        /**
         * @description resolves string to context
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
         * @description returns a context to its original state
         * @param {Object|String|undefined} ctx
         */
		reset2dContext: function( ctx ) {
			if (typeof ctx == "string")
				ctx = this.resolveContext(ctx);

			if (ctx) lola.util.copyPrimitives( this.reset2d, ctx );
		},

        /**
         * @description copies properties of styleObject into style cache with given name
         * @param {Object} styleObj
         * @param {String} name
         */
        registerStyle: function( styleObj, name ) {
            console.log('lola.graphics.registerStyle: '+name);
            var obj = {};
            lola.util.copyPrimitives( styleObj, obj );
            this.styles2d[ name ] = obj;
        },

        /**
         * @description removes style with specified name
         * @param {String} name
         */
        removeStyle: function(  name ) {
            delete this.styles2d[ name ];
        },

        /**
         * @description copies properties of styleObject into style cache with given name
         * @param {Object|String} style
         * @param {Object|String} ctx
         */
        applyStyle: function( style, ctx ) {
            console.log('lola.graphics.applyStyle');
            ctx = this.resolveContext( ctx );
            var styles = (typeof style == "string") ?  this.styles2d[ style ] || this.reset2d : style;
            lola.util.copyPrimitives( this.reset2d, ctx );
            lola.util.copyPrimitives( styles, ctx );
        },


		//==================================================================
		// Classes
		//==================================================================
        /**
         * @description Point class
         * @class
         * @param {Number|undefined} x x coordinate
         * @param {Number|undefined} y y coordinate
         */
		Point: function ( x, y ) {
			this.x = x;
			this.y = y;
			return this;
		},

        /**
         * @description Spline class
         * @class
         * @param {Array|undefined} points array of spline points
         */
		Spline: function( points ){
			this.points = points?points:[];
			return this;
		},

        /**
         * @description SplinePoint class
         * @class
         * @param anchorX
         * @param anchorY
         * @param entryStrength
         * @param entryAngle
         * @param exitStrength
         * @param exitAngle
         */
		SplinePoint: function( anchorX, anchorY, entryStrength, entryAngle, exitStrength, exitAngle ) {
			return this.init( anchorX, anchorY, entryStrength, entryAngle, exitStrength, exitAngle );
		},

        /**
         * @description Vector class
         * @class
         * @param velocity
         * @param angle
         */
		Vector: function ( velocity, angle ){
			this.velocity = velocity;
			this.angle = angle;
			return this;
		},




		//==================================================================
		// Selection Methods
		//==================================================================
		/**
		 * @description get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * @description module's selector methods
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
	graphics.Point.prototype = {
        /**
         * @description x coordinate
         * @type {Number}
         */
		x: undefined,

        /**
         * @description y coordinate
         * @type {Number}
         */
		y: undefined,

        /**
         * @description converts point to vector
         * @return {lola.graphics.Vector}
         */
		toVector: function(){
			var a = Math.atan2( this.y, this.x );
			var v = Math.sqrt( this.x*this.x + this.y+this.y );
			return new lola.graphics.vector(v,a);
		}
	};

	graphics.Spline.prototype = {
        /**
         * @description array of {lola.graphics.SplinePoint}
         * @type {Array}
         */
		points: [],

        /**
         * @description adds a point at the specified index.
         * if index is not passed, point will be added at last position
         * @param {lola.graphics.SplinePoint} splinePoint
         * @param {uint|undefined} index
         */
		addPoint: function( splinePoint, index ){
			if ( index == undefined )
				index = this.points.length;

			this.points.splice(index,0,splinePoint);
		},

        /**
         * @description removes the point at the specified index.
         * @param {uint} index
         */
		removePoint: function( index ){
			if ( index != undefined )
				this.points.splice(index,1,undefined);
		},

        /**
         * @description updates/replaces a point at the specified index.
         * @param {lola.graphics.SplinePoint} splinePoint
         * @param {uint} index
         */
		updatePoint: function( splinePoint, index ){
			if ( index != undefined )
			this.points.splice(index,1,splinePoint);
		},

        /**
         * @description gets the splinePoint at the specified index.
         * @param {uint} index
         */
		getPoint: function( index ){
			return this.points[ index ];
		},

        /**
         * @description draws spline
         * @param {Boolean} close draw a closed spline
         * @param {Object|String|undefined} ctx
         */
        draw: function(close, ctx){
            ctx = lola.graphics.resolveContext( ctx );
            close = (close === true);
            var sl = this.points.length;
            //console.log('drawSpline: '+sl);
            if (sl > 1) {
                var pts = [];
                //console.log(pts);
                this.points.forEach( function(item){
                    pts.push( item.getControl1() );
                    pts.push( item.getAnchor() );
                    pts.push( item.getControl2() );
                });
                ctx.moveTo( pts[1].x,pts[1].y );
                var pl = pts.length;
                for (var i=2; i<pl-3; i+=3){
                    ctx.bezierCurveTo(
                        pts[i].x,pts[i].y,
                        pts[i+1].x,pts[i+1].y,
                        pts[i+2].x,pts[i+2].y
                    );
                }

                if (close){
                    ctx.bezierCurveTo(
                        pts[pl-1].x,pts[pl-1].y,
                        pts[0].x,pts[0].y,
                        pts[1].x,pts[1].y
                    );
                }
            }
            else{
                throw new Error('not enough spline points');
            }
        }


	};

	graphics.SplinePoint.prototype = {

        /**
         * @description splinepoint anchor point
         * @type {lola.graphics.Point|undefined}
         */
		anchor: undefined,

        /**
         * @description splinepoint entry vector
         * @type {lola.graphics.Vector|undefined}
         */
		entry: undefined,

        /**
         * @description splinepoint exit vector
         * @type {lola.graphics.Vector|undefined}
         */
		exit: undefined,

        /**
         * @description initialization function
         * @param ax
         * @param ay
         * @param es
         * @param ea
         * @param xs
         * @param xa
         */
		init: function (ax, ay, es, ea, xs, xa){
			this.anchor = new lola.graphics.Point( ax, ay );
			this.entry = new lola.graphics.Vector( es, ea );
			this.exit = new lola.graphics.Vector( xs, xa==undefined?ea:xa );
		},

        /**
         * @description sets the SplinePont's entry and exit angles
         * if exitAngle is omitted the same angle is set for both
         * @param {Number} entryAngle
         * @param {Number|undefined} exitAngle
         */
		setAngle: function( entryAngle, exitAngle) {
			this.entry.angle = entryAngle;
			this.exit.angle = exitAngle==undefined?entryAngle:exitAngle;
		},

        /**
         * @description gets the spline point's anchor
         * @return {lola.graphics.Point}
         */
		getAnchor: function(){
			return this.anchor;
		},

        /**
         * @description gets the spline point's entry control point
         * @return {lola.graphics.Point}
         */
		getControl1: function(){
			return lola.math.point.subtract( this.anchor, this.entry.toPoint());
		},

        /**
         * @description gets the spline point's exit control point
         * @return {lola.graphics.Point}
         */
		getControl2: function(){
			return lola.math.point.add( this.anchor, this.exit.toPoint() );
		}

	};

	graphics.Vector.prototype = {
        /**
         * @description velocity or length of the vector
         * @type {Number}
         */
		velocity: undefined,

        /**
         * @description angle of vector (horizontal pointing right is 0 radians)
         * @type {Number}
         */
		angle: undefined,

        /**
         * @description converts a vector to a (0,0) based point
         * @return {lola.graphics.Point}
         */
		toPoint: function() {
			return new lola.graphics.Point(
					Math.cos(this.angle)*this.velocity,
					Math.sin(this.angle)*this.velocity
			)
		}
	};

	//register module
	lola.registerModule( graphics );

})( lola );
