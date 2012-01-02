/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Easing
 *  Description: Easing module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Easing Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var easing = {

		//==================================================================
		// Attributes
		//==================================================================
        methods: {},

        defaultResolution: 1000,

        defaultEase: "ease",

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug( 'lola.easing::preinitialize' );
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization

			//remove initialization method
			delete lola.easing.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug( 'lola.easing::initialize' );
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization
            this.registerSimpleEasing("none", 0, 0, 1, 1);
            this.registerSimpleEasing("ease", .25, .1, .25, 1);
            this.registerSimpleEasing("linear", 0, 0, 1, 1);
            this.registerSimpleEasing("ease-in", .42, 0, 1, 1);
            this.registerSimpleEasing("ease-out", 0, 0, .58, 1);
            this.registerSimpleEasing("ease-in-out", .42, 0, .58, 1);


			//remove initialization method
			delete lola.easing.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "easing";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ["math.point","geometry"];
		},


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
		cubicBezier: function( t, p0, p1, p2, p3 ) {
			var inv = 1 - t;
			return lola.math.point.add(
					lola.math.point.multiply( p0, inv * inv * inv ),
					lola.math.point.multiply( p1, 3 * inv * inv * t ),
					lola.math.point.multiply( p2, 3 * inv * t * t ),
					lola.math.point.multiply( p3, t * t * t )
			);

		},

        /**
         * samples a splines points for use in time based easing
         * @private
         * @param {lola.geometry.spline} spline
         * @param {uint} resolution per spline section
         */
        sampleSpline: function( spline, resolution ) {
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
                        var sample = this.cubicBezier(
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
        },

        /**
         * registers the an easing method using the given parameters
         * @param id
         * @param spline
         * @param resolution
         * @param overwrite
         */
        register: function( id, spline, resolution, overwrite  ){
            resolution = 10;//resolution?resolution:easing.defaultResolution;
            overwrite = overwrite === true;

            var first = spline.getPoint(0).getAnchor();
            var last = spline.getPoint( (spline.getPoints().length - 1) ).getAnchor();
            if ( first.x == 0 && first.y == 0 && last.x == 1 && last.y == 1 ){
                //Todo: make sure spline can be fit to cartesian function

                var Ease = function(){
                    return this;
                };

                var samples = easing.sampleSpline( spline, 1000 );

                Ease.prototype = {
                    samples: samples,
                    sampleCount: samples.length,
                    lastIndex: 1,
                    exec: function( t,v,c,d ){
                        t/=d;
                        var s = this.samples;
                        var i = this.lastIndex;
                        var l = this.sampleCount;
                        //TODO: use a more efficient time search algorithm
                        while( t>s[i].x && i < l ){
                            i++;
                            if ( t <= s[i].x ){
                                var low = s[i-1];
                                var high = s[i];
                                var p = (t - low.x) / (high.x - low.x);
                                this.lastIndex = i;
                                return v+c*(low.y+p*(high.y-low.y));
                            }
                        }
                    }
                };

                if ( !easing.methods[ id ] || overwrite ){
                    lola.easing.methods[ id ] = Ease;
                }else{
                    throw new Error("easing id already taken");
                }

            }else{
                throw new Error("invalid easing spline");
            }
        },

        /**
         * registers a single section cubic-bezier easing method
         * @param id
         * @param p1x
         * @param p1y
         * @param p2x
         * @param p2y
         */
        registerSimpleEasing: function(id,p1x,p1y,p2x,p2y){
            var geo = lola.geometry;
            var spline = new geo.Spline();
            var c1 = new geo.Point( p1x, p1y );
            var c2 = new geo.Point( p2x, p2y );
            var v1 = c1.toVector();
            var v2 = c2.toVector();
            spline.addPoint( new geo.SplinePoint( 0, 0, 0, 0, v1.velocity, v1.angle ) );
            spline.addPoint( new geo.SplinePoint( 1, 1, v2.velocity, v2.angle, 1, 1 ) );
            easing.register( id, spline );
        },

        /**
         * gets a regsitered easing function
         * @param {String} id
         */
        get: function( id ){
            //console.log("lola.easing.get: "+id);
            if (this.methods[ id ]){
                return new this.methods[ id ]();
            }
            else {
                console.warn('easing method "'+id+'" not found.');
                return new this.methods[ this.defaultEase ]();
            }
        },

        /**
         * sets the default easing method
         * @param {String} ids
         */
        setDefaultEase: function( id ){
            if (this.methods[ id ]){
                this.defaultEase = id;
            }
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

			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================


	//register module
	lola.registerModule( easing );

})( lola );

