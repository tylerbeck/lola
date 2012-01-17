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
                point = point.add( parent );
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
                return new self.Vector(v,a);
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
            /**
             * array of {lola.geometry.SplinePoint}
             * @type {Array}
             * @private
             */
            points = points?points:[];

            /**
             * spline flags
             * @type {Boolean}
             */
            flags = flags == undefined ? 0 : flags;

            /**
             * adds a point at the specified index.
             * if index is not passed, point will be added at last position
             * @param {lola.geometry.SplinePoint} splinePoint
             * @param {uint|undefined} index
             */
            this.addPoint = function( splinePoint, index ){
                if ( index == undefined )
                    index = points.length;

                points.splice(index,0,splinePoint);
            };

            /**
             * removes the point at the specified index.
             * @param {uint} index
             */
            this.removePoint = function( index ){
                if ( index != undefined )
                    points.splice(index,1,undefined);
            };

            /**
             * updates/replaces a point at the specified index.
             * @param {lola.geometry.SplinePoint} splinePoint
             * @param {uint} index
             */
            this.updatePoint = function( splinePoint, index ){
                if ( index != undefined )
                    points.splice(index,1,splinePoint);
            };

            /**
             * gets the splinePoint at the specified index.
             * @param {uint} index
             */
            this.getPoint = function( index ){
                if ( index < points.length )
                    return points[ index ];
                return null;
            };

            /**
             * gets all splinePoints.
             */
            this.getPoints = function(){
                return points;
            };

            /**
             * draws spline
             * @param {Boolean} close draw a closed spline
             * @param {Object|String|undefined} ctx
             */
            this.draw = function( ctx, flgs ){
                flgs = flgs == undefined ? flags : flgs;
                var sl = points.length;
                //console.log('drawSpline: '+sl);
                if (sl > 1) {
                    var p = [];
                    //console.log(pts);
                    points.forEach( function(item){
                        p.push( item.getControl1(),item.getAnchor(),item.getControl2() );
                    });
                    var pl = p.length;


                    if (flgs &  self.Spline.CONTROLS){
                        var d = function(q,r){
                            ctx.beginPath();
                            ctx.moveTo(p[q].x, p[q].y);
                            ctx.lineTo(p[r].x, p[r].y);
                            ctx.stroke();
                            ctx.closePath();
                        };
                        d(1,2);
                        for (var n=3; n<pl-3; n+=3){
                            d(n,n+1);
                            d(n+1,n+2)
                        }
                        d(n,n+1);
                    }

                    ctx.beginPath();
                    ctx.moveTo( p[1].x,p[1].y );
                    for (var i=2; i<pl-3; i+=3){
                        ctx.bezierCurveTo(
                            p[i].x,p[i].y,
                            p[i+1].x,p[i+1].y,
                            p[i+2].x,p[i+2].y
                        );
                    }

                    if (flags &  self.Spline.CLOSED){
                        ctx.bezierCurveTo(
                            p[pl-1].x,p[pl-1].y,
                            p[0].x,p[0].y,
                            p[1].x,p[1].y
                        );
                    }

                    if (flags &  self.Spline.FILL){
                        ctx.fill();
                    }

                    if (flags &  self.Spline.STROKE){
                        ctx.stroke();
                    }

                    ctx.closePath();

                }
                else{
                    throw new Error('not enough spline points');
                }
            };

            /**
             * translates and / or scales a spline based on the specified bounding points
             * @param {lola.geometry.Point} oldMin
             * @param {lola.geometry.Point} oldMax
             * @param {lola.geometry.Point} newMin
             * @param {lola.geometry.Point} newMax
             * @param {Boolean|undefined} flipX
             * @param {Boolean|undefined} flipY
             * @return {lola.geometry.Spline}
             */
            this.normalize = function( oldMin, oldMax, newMin, newMax, flipX, flipY ){

                flipX = flipX === true;
                flipY = flipY === true;

                var norm = new  self.Spline();
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
            };


            return this;
        };
        this.Spline.CLOSED = 0x1;
        this.Spline.FILL = 0x2;
        this.Spline.STROKE = 0x4;
        this.Spline.CONTROLS =0x8;

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

            /**
             * splinepoint anchor point
             * @type {lola.geometry.Point|undefined}
             */
            var anchor;

            /**
             * splinepoint entry vector
             * @type {lola.geometry.Vector|undefined}
             */
            var entry;

            /**
             * splinepoint exit vector
             * @type {lola.geometry.Vector|undefined}
             */
            var exit;

            /**
             * sets the SplinePont's entry and exit angles
             * if exitAngle is omitted the same angle is set for both
             * @param {Number} entryAngle
             * @param {Number|undefined} exitAngle
             */
            this.setAngle = function( entryAngle, exitAngle) {
                entry.angle = entryAngle;
                exit.angle = exitAngle==undefined?entryAngle:exitAngle;
            };

            /**
             * gets the spline point's anchor
             * @return {lola.geometry.Point}
             */
            this.getAnchor =function(){
                return anchor;
            };

            /**
             * gets the spline point's entry control point
             * @return {lola.geometry.Point}
             */
            this.getControl1 = function(){
                return anchor.subtract( entry.toPoint() );
            };

            /**
             * gets the spline point's exit control point
             * @return {lola.geometry.Point}
             */
            this.getControl2 = function(){
                return anchor.add( exit.toPoint() );
            };

            //initialize
            anchor = new self.Point( anchorX, anchorY );
            entry = new self.Vector( entryStrength, entryAngle );
            exit = new self.Vector( exitStrength, exitAngle==undefined?entryAngle:exitAngle );
            return this;
        };

        /**
         * Vector class
         * @class
         * @param velocity
         * @param angle
         */
        this.Vector = function( velocity, angle ){

            /**
             * velocity or length of the vector
             * @type {Number}
             */
            this.velocity = velocity;

            /**
             * angle of vector (horizontal pointing right is 0 radians)
             * @type {Number}
             */
            this.angle = angle;

            /**
             * converts a vector to a (0,0) based point
             * @return {lola.geometry.Point}
             */
            this.toPoint = function() {
                return new self.Point(
                    Math.cos(this.angle)*this.velocity,
                    Math.sin(this.angle)*this.velocity
                )
            };

            return this;
        };

    };

	//register module
	lola.registerModule( new Module() );


})( lola );
