/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Geometry Module
 *  Description: Geometry module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
    /**
     * Array Module
     * @namespace lola.geometry
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
        var namespace = "geometry";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ['regex'];

        /**
         * drop px regex
         * @private
         */
        var rDropPx = /px/g;



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
         * returns offset of object
         * @param {Element} elem
         * @param {Boolean|undefined} absolute if true returns absolute position
         */
        this.getOffset = function( elem, absolute ) {
            if ( !absolute )
                absolute = false;
            var point = new self.Point( elem.offsetLeft, elem.offsetTop );
            if ( absolute && elem.offsetParent ) {
                var parent = self.getOffset( elem.offsetParent, true );
                point = lola.math.point.add( point, parent );
            }
            return point;
        };

        /**
         * gets position relative to root
         * @param {Element} elem
         */
        this.absolutePosition = function( elem ){
            return self.getOffset( elem, true );
        };

        /**
         * get position relative to offsetParent
         * @param {Element} elem
         */
        this.relativePosition = function( elem ){
            return self.getOffset( elem, false );
        };

        /**
         * gets or sets the width of an element
         * @param {Element} elem
         * @param {Number|undefined} value
         */
        this.width = function( elem, value ) {
            if (value){
                //setting
                var bl = lola.css.style(elem,"borderLeft");
                var br = lola.css.style(elem,"borderRight");
                var pl = lola.css.style(elem,"paddingLeft");
                var pr = lola.css.style(elem,"paddingRight");
                value -= bl+br+pl+pr;

                return lola.css.style( elem, 'width', value);
            }
            else{
                //getting
                if ( elem.offsetWidth )
                    return elem.offsetWidth;
                else
                    return elem.clientWidth;
            }
        };

        /**
         * gets or sets the height of an element
         * @param {Element} elem
         * @param {Number|undefined} value
         */
        this.height = function( elem, value ) {
            if (value){
                //setting
                var bl = lola.css.style(elem,"borderTop");
                var br = lola.css.style(elem,"borderBottom");
                var pl = lola.css.style(elem,"paddingTop");
                var pr = lola.css.style(elem,"paddingBottom");
                value -= bl+br+pl+pr;

                return lola.css.style( elem, 'height', value);
            }
            else{
                //getting
                if ( elem.offsetHeight )
                    return elem.offsetHeight;
                else
                    return elem.clientHeight;
            }
        };


        //==================================================================
        // Classes
        //==================================================================
        /**
         * Point class
         * @class
         * @param {Number|undefined} x x coordinate
         * @param {Number|undefined} y y coordinate
         */
        this.Point = function( x, y ) {
            this.x = x;
            this.y = y;
            return this;
        };
        this.Point.prototype = {
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
             * @return {lola.geometry.Vector}
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
            },

            /**
             * returns a copy of this point
             */
            copy: function(){
                return new self.Point( this.x, this.y );
            },

            /**
             * performs function on point
             * @param fn
             * @param args
             */
            operate: function( fn, args ){
                var r = this.copy();
                var len =  args.length;
                for (var i=1; i<len; i++) {
                    var arg = arguments[i];
                    if (typeof arg == "number") {
                        r.x = fn(r.x,arg);
                        r.y = fn(r.y,arg);
                    }
                    else {
                        r.x = fn(r.x,arg.x);
                        r.y = fn(r.y,arg.y);
                    }
                }

                return r;
            },

            /**
             * adds arguments to point (returns new point)
             * @return {lola.geometry.Point}
             */
            add: function( /*...arguments*/ ){
                return this.operate( function(a,b){return a+b;}, arguments );
            },

            /**
             * subtracts arguments from point (returns new point)
             * @return {lola.geometry.Point}
             */
            subtract: function( /*...arguments*/ ){
                return this.operate( function(a,b){return a-b;}, arguments );
            },

            /**
             * multiplies point by arguments (returns new point)
             * @return {lola.geometry.Point}
             */
            multiply: function( /*...arguments*/ ){
                return this.operate( function(a,b){return a*b;}, arguments );
            },

            /**
             * divides point by arguments (returns new point)
             * @return {lola.geometry.Point}
             */
            divide: function( /*...arguments*/ ){
                return this.operate( function(a,b){return a/b;}, arguments );
            },

            /**
             * raises point by arguments (returns new point)
             * @return {lola.geometry.Point}
             */
            pow: function( /*...arguments*/ ){
                return this.operate( function(a,b){return Math.pow(a,b);}, arguments );
            },

            /**
             * offsets point at the specified angle by the specified distance
             * @param {lola.geometry.Point} p
             * @param {Number} angle angle in radians
             * @param {Number} distance
             */
            offsetPoint: function( angle, distance ){
                var offset = this.copy();
                offset.x += Math.cos( angle ) * distance;
                offset.y += Math.sin( angle ) * distance;
                return offset;
            },

            /**
             * calculates the absolute distance to point
             * @param {lola.geometry.Point} p
             * @return {Number}
             */
            distance: function( p ) {
                return Math.sqrt( Math.pow(p.x-this.x,2) + Math.pow(p.y-this.y,2)  );
            }
        };

        /**
         * Spline class
         * @class
         * @param {Array|undefined} points array of spline points
         * @param {uint} flags
         */
        this.Spline = function( points, flags ){
            this.points = points?points:[];
            this.flags = flags == undefined ? 0 : flags;
            return this;
        };
        this.Spline.CLOSED = 0x1;
        this.Spline.FILL = 0x2;
        this.Spline.STROKE = 0x4;
        this.Spline.CONTROLS =0x8;
        this.Spline.prototype = {
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
            },


            /**
             * translates and / or scales a spline based on the specified bounding points
             * @param {lola.geometry.Point} oldMin
             * @param {lola.geometry.Point} oldMax
             * @param {lola.geometry.Point} newMin
             * @param {lola.geometry.Point} newMax
             * @param {Boolean|undefined} flipX
             * @param {Boolean|undefined} flipY
             */
            normalize: function( oldMin, oldMax, newMin, newMax, flipX, flipY ){

                flipX = flipX === true;
                flipY = flipY === true;

                var norm = new self.Spline();
                var spts = this.getPoints();
                var l = spts.length;
                var oldSize = oldMax.subtract( oldMin );
                var newSize = newMax.subtract( newMin );

                var normalizePoint = function( pt ){
                    pt = pt.subtract( oldMin ).divide( oldSize );
                    if (flipX) pt.x = 1-pt.x;
                    if (flipY) pt.y = 1-pt.y;
                    return pt.multiply( newSize );
                };

                for (var i=0; i<l; i++ ){
                    //get points
                    var cp1 = spts[i].getControl1();
                    var anch = spts[i].getAnchor();
                    var cp2 = spts[i].getControl2();

                    //normalize points
                    var nanch = normalizePoint( anch );
                    var ncv1 = nanch.subtract( normalizePoint( cp1 ) ).toVector();
                    var ncv2 = normalizePoint( cp2 ).subtract( nanch ).toVector();


                    var np = new self.SplinePoint( nanch.x, nanch.y, ncv1.velocity, ncv1.angle, ncv2.velocity, ncv2.angle );
                    norm.addPoint( np );
                }

                return norm;
            }
        };

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
        this.SplinePoint = function( anchorX, anchorY, entryStrength, entryAngle, exitStrength, exitAngle ) {
            return this.init( anchorX, anchorY, entryStrength, entryAngle, exitStrength, exitAngle );
        };
        this.SplinePoint.prototype = {

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

        /**
         * Vector class
         * @class
         * @param velocity
         * @param angle
         */
        this.Vector = function( velocity, angle ){
            this.velocity = velocity;
            this.angle = angle;
            return this;
        };
        this.Vector.prototype = {
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

    };

	//register module
	lola.registerModule( new Module() );

})( lola );
