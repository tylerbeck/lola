/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Easing
 *  Description: Easing module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
    /**
     * Easing Module
     * @namespace lola.array
     */
    var Module = function(){
        var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "easing";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ["geometry"];

        /**
         * defined easing methods
         * @private
         */
        var methods = {};

        /**
         * spline sampling resolution
         * @private
         */
        var defaultResolution = 1000;

        /**
         * default easing method
         * @private
         */
        var defaultEase = "ease";

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
         * sets the default easing method
         * @param {String} ids
         */
        this.setDefaultEase = function( id ){
            if (methods[ id ]){
                defaultEase = id;
            }
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
            lola.debug( 'lola.easing::initialize' );

            //do module initialization
            self.registerSimpleEasing("none", 0, 0, 1, 1);
            self.registerSimpleEasing("ease", .25, .1, .25, 1);
            self.registerSimpleEasing("linear", 0, 0, 1, 1);
            self.registerSimpleEasing("ease-in", .42, 0, 1, 1);
            self.registerSimpleEasing("ease-out", 0, 0, .58, 1);
            self.registerSimpleEasing("ease-in-out", .42, 0, .58, 1);

            //remove initialization method
            delete self.initialize;
        };

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
        function cubicBezier( t, p0, p1, p2, p3 ) {
            var inv = 1 - t;
            return p0.multiply( inv * inv * inv ).add(
                p1.multiply( 3 * inv * inv * t ),
                p2.multiply( 3 * inv * t * t ),
                p3.multiply( t * t * t )
            );
        }

        /**
         * samples a splines points for use in time based easing
         * @private
         * @param {lola.geometry.spline} spline
         * @param {uint} resolution per spline section
         */
        function sampleSpline( spline, resolution ) {
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
                        var sample = cubicBezier(
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
        }

        /**
         * registers the an easing method using the given parameters
         * @param id
         * @param spline
         * @param resolution
         * @param overwrite
         */
        this.register = function( id, spline, resolution, overwrite  ){
            resolution = resolution?resolution:defaultResolution;
            overwrite = overwrite === true;

            var first = spline.getPoint(0).getAnchor();
            var last = spline.getPoint( (spline.getPoints().length - 1) ).getAnchor();
            if ( first.x == 0 && first.y == 0 && last.x == 1 && last.y == 1 ){
                //Todo: make sure spline can be fit to cartesian function

                var Ease = function(){
                    this.exec = function( t,v,c,d ){
                        t/=d;
                        var s = sampleSpline( spline, resolution );
                        var i = 1;
                        var l = s.length;
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
                    };

                    return this;
                };

                if ( !methods[ id ] || overwrite ){
                    methods[ id ] = Ease;
                }else{
                    throw new Error("easing id already taken");
                }

            }else{
                throw new Error("invalid easing spline");
            }
        };

        /**
         * registers a single section cubic-bezier easing method
         * @param id
         * @param p1x
         * @param p1y
         * @param p2x
         * @param p2y
         */
        this.registerSimpleEasing = function(id,p1x,p1y,p2x,p2y){
            var geo = lola.geometry;
            var spline = new geo.Spline();
            var c1 = new geo.Point( p1x, p1y );
            var c2 = new geo.Point( p2x, p2y );
            var v1 = c1.toVector();
            var v2 = c2.toVector();
            spline.addPoint( new geo.SplinePoint( 0, 0, 0, 0, v1.velocity, v1.angle ) );
            spline.addPoint( new geo.SplinePoint( 1, 1, v2.velocity, v2.angle, 1, 1 ) );
            self.register( id, spline );
        };

        /**
         * gets a regsitered easing function
         * @param {String} id
         */
        this.get = function( id ){
            //console.log("lola.easing.get: "+id);
            if (methods[ id ]){
                return new methods[ id ]();
            }
            else {
                console.warn('easing method "'+id+'" not found.');
                return new methods[ defaultEase ]();
            }
        };

    };


	//register module
	lola.registerModule( new Module() );

})( lola );

