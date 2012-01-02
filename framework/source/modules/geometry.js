/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Geometry Module
 *  Description: Geometry module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * math.geom Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var geometry = {

		//==================================================================
		// Attributes
		//==================================================================



		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.geometry::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization


			//remove initialization method
			delete lola.geometry.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.math.geom::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization


			//remove initialization method
			delete lola.geometry.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "geometry";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['math'];
		},

        /**
         * translates and / or scales a spline based on the specified bounding points
         * @param {lola.geometry.Spline} spline
         * @param {lola.geometry.Point} oldMin
         * @param {lola.geometry.Point} oldMax
         * @param {lola.geometry.Point} newMin
         * @param {lola.geometry.Point} newMax
         * @param {Boolean|undefined} flipX
         * @param {Boolean|undefined} flipY
         */
        normalizeSpline: function( spline, oldMin, oldMax, newMin, newMax, flipX, flipY ){

            flipX = flipX === true;
            flipY = flipY === true;

            var pm = lola.math.point;
            var norm = new lola.geometry.Spline();
            var spts = spline.getPoints();
            var l = spts.length;
            var oldSize = pm.subtract( oldMax, oldMin );
            var newSize = pm.subtract( newMax, newMin );

            var normalizePoint = function( pt ){
                pt = pm.divide( pm.subtract( pt, oldMin ), oldSize );
                if (flipX) pt.x = 1-pt.x;
                if (flipY) pt.y = 1-pt.y;
                return pm.multiply( pt, newSize );
            };

            for (var i=0; i<l; i++ ){
                //get points
                var cp1 = spts[i].getControl1();
                var anch = spts[i].getAnchor();
                var cp2 = spts[i].getControl2();

                //normalize points
                var nanch = normalizePoint( anch );
                var ncv1 = pm.subtract( nanch, normalizePoint( cp1 ) ).toVector();
                var ncv2 = pm.subtract( normalizePoint( cp2 ), nanch ).toVector();


                var np = new lola.geometry.SplinePoint( nanch.x, nanch.y, ncv1.velocity, ncv1.angle, ncv2.velocity, ncv2.angle );
                norm.addPoint( np );
            }

            return norm;
        },

		//==================================================================
		// Classes
		//==================================================================
        /**
         * Point class
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
         * Spline class
         * @class
         * @param {Array|undefined} points array of spline points
         * @param {uint} flags
         */
        Spline: function( points, flags ){
            this.points = points?points:[];
            this.flags = flags == undefined ? 0 : flags;
            return this;
        },

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
        SplinePoint: function( anchorX, anchorY, entryStrength, entryAngle, exitStrength, exitAngle ) {
            return this.init( anchorX, anchorY, entryStrength, entryAngle, exitStrength, exitAngle );
        },

        /**
         * Vector class
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

			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================
    geometry.Point.prototype = {
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
         * @return {lola.math.geom.Vector}
         */
        toVector: function(){
            var a = Math.atan2( this.y, this.x );
            var v = Math.sqrt( this.x*this.x + this.y*this.y );
            return new lola.geometry.Vector(v,a);
        },

        /**
         * converts point to object notation
         * @return {String}
         */
        toString: function(){
            return "{x:"+this.x+",y:"+this.y+"}";
        }
    };

    geometry.Spline.CLOSED = 0x1;
    geometry.Spline.FILL = 0x2;
    geometry.Spline.STROKE = 0x4;
    geometry.Spline.CONTROLS =0x8;
    geometry.Spline.prototype = {
        /**
         * array of {lola.geometry.SplinePoint}
         * @type {Array}
         * @private
         */
        points: [],

        /**
         * spline flags
         * @type {Boolean}
         */
        flags: 0x0,

        /**
         * adds a point at the specified index.
         * if index is not passed, point will be added at last position
         * @param {lola.geometry.SplinePoint} splinePoint
         * @param {uint|undefined} index
         */
        addPoint: function( splinePoint, index ){
            if ( index == undefined )
                index = this.points.length;

            this.points.splice(index,0,splinePoint);
        },

        /**
         * removes the point at the specified index.
         * @param {uint} index
         */
        removePoint: function( index ){
            if ( index != undefined )
                this.points.splice(index,1,undefined);
        },

        /**
         * updates/replaces a point at the specified index.
         * @param {lola.geometry.SplinePoint} splinePoint
         * @param {uint} index
         */
        updatePoint: function( splinePoint, index ){
            if ( index != undefined )
                this.points.splice(index,1,splinePoint);
        },

        /**
         * gets the splinePoint at the specified index.
         * @param {uint} index
         */
        getPoint: function( index ){
            return this.points[ index ];
        },

        /**
         * gets all splinePoints.
         */
        getPoints: function(){
            return this.points;
        },

        /**
         * draws spline
         * @param {Boolean} close draw a closed spline
         * @param {Object|String|undefined} ctx
         */
        draw: function( ctx, flags ){
            flags = flags == undefined ? this.flags : flags;
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
                var pl = pts.length;


                if (flags & geometry.Spline.CONTROLS){

                    ctx.beginPath();
                    ctx.moveTo(pts[1].x, pts[1].y);
                    ctx.lineTo(pts[2].x, pts[2].y);
                    ctx.stroke();
                    ctx.closePath();

                    for (var n=3; n<pl-3; n+=3){
                        var n2 = n+1;
                        var n3 = n+2;
                        ctx.beginPath();
                        ctx.moveTo(pts[n].x, pts[n].y);
                        ctx.lineTo(pts[n2].x, pts[n2].y);
                        ctx.stroke();
                        ctx.closePath();

                        ctx.beginPath();
                        ctx.moveTo(pts[n2].x, pts[n2].y);
                        ctx.lineTo(pts[n3].x, pts[n3].y);
                        ctx.stroke();
                        ctx.closePath();
                    }

                    ctx.beginPath();
                    ctx.moveTo(pts[n].x, pts[n].y);
                    ctx.lineTo(pts[n+1].x, pts[n+1].y);
                    ctx.stroke();
                    ctx.closePath();

                }

                ctx.beginPath();
                ctx.moveTo( pts[1].x,pts[1].y );
                for (var i=2; i<pl-3; i+=3){
                    ctx.bezierCurveTo(
                        pts[i].x,pts[i].y,
                        pts[i+1].x,pts[i+1].y,
                        pts[i+2].x,pts[i+2].y
                    );
                }

                if (flags & geometry.Spline.CLOSED){
                    ctx.bezierCurveTo(
                        pts[pl-1].x,pts[pl-1].y,
                        pts[0].x,pts[0].y,
                        pts[1].x,pts[1].y
                    );
                }

                if (flags & geometry.Spline.FILL){
                    ctx.fill();
                }

                if (flags & geometry.Spline.STROKE){
                    ctx.stroke();
                }

                ctx.closePath();

            }
            else{
                throw new Error('not enough spline points');
            }
        }

    };

    geometry.SplinePoint.prototype = {

        /**
         * splinepoint anchor point
         * @type {lola.geometry.Point|undefined}
         */
        anchor: undefined,

        /**
         * splinepoint entry vector
         * @type {lola.geometry.Vector|undefined}
         */
        entry: undefined,

        /**
         * splinepoint exit vector
         * @type {lola.geometry.Vector|undefined}
         */
        exit: undefined,

        /**
         * initialization function
         * @param ax
         * @param ay
         * @param es
         * @param ea
         * @param xs
         * @param xa
         */
        init: function (ax, ay, es, ea, xs, xa){
            this.anchor = new lola.geometry.Point( ax, ay );
            this.entry = new lola.geometry.Vector( es, ea );
            this.exit = new lola.geometry.Vector( xs, xa==undefined?ea:xa );
        },

        /**
         * sets the SplinePont's entry and exit angles
         * if exitAngle is omitted the same angle is set for both
         * @param {Number} entryAngle
         * @param {Number|undefined} exitAngle
         */
        setAngle: function( entryAngle, exitAngle) {
            this.entry.angle = entryAngle;
            this.exit.angle = exitAngle==undefined?entryAngle:exitAngle;
        },


        /**
         * gets the spline point's anchor
         * @return {lola.geometry.Point}
         */
        getAnchor: function(){
            return this.anchor;
        },

        /**
         * gets the spline point's entry control point
         * @return {lola.geometry.Point}
         */
        getControl1: function(){
            return lola.math.point.subtract( this.anchor, this.entry.toPoint());
        },

        /**
         * gets the spline point's exit control point
         * @return {lola.geometry.Point}
         */
        getControl2: function(){
            return lola.math.point.add( this.anchor, this.exit.toPoint() );
        }

    };

    geometry.Vector.prototype = {
        /**
         * velocity or length of the vector
         * @type {Number}
         */
        velocity: undefined,

        /**
         * angle of vector (horizontal pointing right is 0 radians)
         * @type {Number}
         */
        angle: undefined,

        /**
         * converts a vector to a (0,0) based point
         * @return {lola.geometry.Point}
         */
        toPoint: function() {
            return new lola.geometry.Point(
                Math.cos(this.angle)*this.velocity,
                Math.sin(this.angle)*this.velocity
            )
        }
    };


	//register module
	lola.registerModule( geometry );

})( lola );
