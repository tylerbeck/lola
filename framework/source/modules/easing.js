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
        var defaultResolution = 25;

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
         * get module's namespace
         * @return {String}
         */
        this.methods = function() {
            return methods;
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
                methods['default'] = methods[id];
            }
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * preinitializes module
         * @private
         * @return {void}
         */
        function preinitialize() {
            var start = lola.now();
            lola.debug( 'lola.easing::preinitialize' );

            //do module initialization
            //easing that simulates css timing
            self.registerSimpleEasing("none", 0, 0, 1, 1);
            self.registerSimpleEasing("linear", 0, 0, 1, 1);
            self.registerSimpleEasing("ease", .25, .1, .25, 1);
            self.registerSimpleEasing("ease-in", .42, 0, 1, 1);
            self.registerSimpleEasing("ease-out", 0, 0, .58, 1);
            self.registerSimpleEasing("ease-in-out", .42, 0, .58, 1);

            //create easeInOut functions for types with easeIn and easeOut
            Object.keys(optimized).forEach( function(k){
                if (optimized[k].hasOwnProperty('easeIn') && optimized[k].hasOwnProperty('easeOut')) {
                    var ei = optimized[k]["easeIn"];
                    var eo = optimized[k]["easeOut"];
                    var eio = function( t, v, c, d ){
                        return (t < d / 2) ? ( ei(t,v,c/2,d/2) ) : (eo( t - d/2, ei(d,v,c/2,d),c/2,d/2));
                    };

                    self.registerEasingFn(k+'-in', ei );
                    self.registerEasingFn(k+'-out', eo );
                    self.registerEasingFn(k+'-in-out', eio );
                }
            } );
            var complete = lola.now();
            lola.debug('easing preinitialization took',(complete-start), 'ms');
            self.setDefaultEase('ease-in-out');
        }

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
         * @param {lola.geometry.Spline} spline
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
        this.sampleSpline = sampleSpline;

        /**
         * registers the an easing method using the given parameters
         * @param id
         * @param spline
         * @param resolution
         * @param overwrite
         */
        this.registerEasingSpline = function( id, spline, resolution, overwrite  ){
            resolution = resolution?resolution:defaultResolution;
            overwrite = overwrite === true;

            var first = spline.getPoint(0).getAnchor();
            var last = spline.getPoint( (spline.getPoints().length - 1) ).getAnchor();
            if ( first.x == 0 && first.y == 0 && last.x == 1 && last.y == 1 ){
                //Todo: make sure spline can be fit to cartesian function

                var Ease = function(){
                    this.getSpline = function(){ return spline; };
                    var s = sampleSpline( spline, resolution );
                    this.getSamples = function(){ return s; };
                    var l = s.length;
                    this.exec = function( t,v,c,d ){
                        t/=d;
                        var i = 0;
                        //TODO: use a more efficient time search algorithm
                        while( t>=s[i].x && i < l ){
                            i++;
                            if ( t <= s[i].x ){
                                var low = s[i-1];
                                var high = s[i];
                                var p = (t - low.x) / (high.x - low.x);
                                return v+c*(low.y+p*(high.y-low.y));
                            }
                        }

                        return 0;
                    };

                    return this;
                };

                if ( !methods[ id ] || overwrite ){
                    methods[ id ] = new Ease();
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
            var c2 = new geo.Point( 1-p2x, 1-p2y );
            var v1 = c1.toVector();
            var v2 = c2.toVector();
            spline.addPoint( new geo.SplinePoint( 0, 0, 0, 0, v1.velocity, v1.angle ) );
            spline.addPoint( new geo.SplinePoint( 1, 1, v2.velocity, v2.angle, 0, 0 ) );
            self.registerEasingSpline( id, spline );
        };

        /**
         * registers an easing function
         * @param {String} id
         * @param {Function} fn
         */
        this.registerEasingFn = function( id, fn ){
            var Ease = function(){
                this.name = id;
                this.exec = fn;
                return this;
            };

            methods[ id ] = new Ease();
        };

        /**
         * gets a regsitered easing function
         * @param {String} id
         */
        this.get = function( id ){
            //console.log("lola.easing.get: "+id);
            if (methods[ id ]){
                return methods[ id ];
            }
            else {
                lola.debug('easing method "'+id+'" not found.');
                return methods[ defaultEase ];
            }
        };

        this.getAll = function(){ return methods; };


        //------------------------------------------------------------------
        // optimised easing functions
        //------------------------------------------------------------------
        /*
         t - time in millis
         v - initial value
         c - value change
         d - duration in millis
         */
        //---------------------------------
        this.params = {
            back: { a: 2.7, b: 1.7 }
        };

        var optimized = {
            back: {
                easeIn: function( t, v, c, d ) {
                    return c * (t /= d) * t * (self.params.back.a * t - self.params.back.b) + v;
                },
                easeOut: function( t, v, c, d ) {
                    return c * ((t = t / d - 1) * t * (self.params.back.a * t + self.params.back.b) + 1) + v;
                }
            },
            //---------------------------------
            bounce: {
                easeIn: function( t, v, c, d ) {
                    return c - optimized.bounce.easeOut( d - t, 0, c, d ) + v;
                },
                easeOut: function( t, v, c, d ) {
                    return ((t /= d) < (1 / 2.75)) ?
                        (c * (7.5625 * t * t) + v) :
                        ( (t < (2 / 2.75)) ?
                            (c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + v) :
                            ( (t < (2.5 / 2.75)) ?
                                (c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + v) :
                                (c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + v)));
                }
            },
            //---------------------------------
            circular: {
                easeIn: function( t, v, c, d ) {
                    return -c * (Math.sqrt( 1 - (t /= d) * t ) - 1) + v;
                },
                easeOut: function( t, v, c, d ) {
                    return c * Math.sqrt( 1 - (t = t/d - 1) * t ) + v;
                }
            },
            //---------------------------------
            cubic: {
                easeIn: function( t, v, c, d ) {
                    return c * (t /= d) * t * t + v;
                },
                easeOut: function( t, v, c, d ) {
                    return c * ((t = t / d - 1) * t * t + 1) + v;
                }
            },
            //---------------------------------
            elastic: {
                easeIn: function( t, v, c, d ) {
                    if ( t == 0 ) return v;
                    if ( (t /= d) == 1 ) return v + c;
                    var p,a,s;
                    p = d * 0.3;
                    a = c;
                    s = p / 4;
                    return -(a * Math.pow( 2, 10 * (t -= 1) ) * Math.sin( (t * d - s) * (2 * Math.PI) / p )) + v;
                },
                easeOut: function( t, v, c, d ) {
                    if ( t == 0 ) return v;
                    if ( (t /= d) == 1 ) return v + c;
                    var s,a,p;
                    p = d * 0.3;
                    a = c;
                    s = p / 4;
                    return a * Math.pow( 2, -10 * t ) * Math.sin( (t * d - s) * (2 * Math.PI) / p ) + c + v;
                }
            },
           //---------------------------------
            exponential: {
                easeIn: function( t, v, c, d ) {
                    return (t == 0) ? v : (c * Math.pow( 2, 10 * (t / d - 1) ) + v);
                },
                easeOut: function( t, v, c, d ) {
                    return (t == d) ? (v + c) : (c * (-Math.pow( 2, -10 * t / d ) + 1) + v);
                }
            },
            //---------------------------------
            quadratic: {
                easeIn: function( t, v, c, d ) {
                    return c * (t /= d) * t + v;
                },
                easeOut: function( t, v, c, d ) {
                    return -c * (t /= d) * (t - 2) + v;
                }
            },
            //---------------------------------
            quartic: {
                easeIn: function( t, v, c, d ) {
                    return c * (t /= d) * t * t * t + v;
                },
                easeOut: function( t, v, c, d ) {
                    return -c * ((t = t / d - 1) * t * t * t - 1) + v;
                }
            },
            //---------------------------------
            quintic: {
                easeIn: function( t, v, c, d ) {
                    return c * (t /= d) * t * t * t * t + v;
                },
                easeOut: function( t, v, c, d ) {
                    return c * ((t = t / d - 1) * t * t * t * t + 1) + v;
                }
            },
            //---------------------------------
            sine: {
                easeIn: function( t, v, c, d ) {
                    return -c * Math.cos( t / d * (Math.PI / 2) ) + c + v;
                },
                easeOut: function( t, v, c, d ) {
                    return c * Math.sin( t / d * (Math.PI / 2) ) + v;
                }
            }
        };


        preinitialize();

        return this;

    };


	//register module
	lola.registerModule( new Module() );

})( lola );

