/***********************************************************************
 * Lola JavaScript Framework Module
 *
 *       Module: Motion Range Control
 *  Description: scrolling control module
 *       Author: Copyright 2012, tylerbeck
 *
 ***********************************************************************/
(function (lola) {
    var $ = lola;

    /**
     * Motion Range Module
     * @namespace lola.motion
     */
    var Module = function () {
        var self = this;

        //==================================================================
        // Attributes
        //==================================================================

        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "motion";

        /**
         * agent's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ["tween"];

        /**
         * reference to animation object
         */
        var anim;

        /**
         * max frames per second for progression
         */
        var maxRate = 2000;

        /**
         * target position
         */
        var targetPosition = 0;

        /**
         * last position set on targets
         */
        var lastPosition = 0;

        /**
         * terminal position
         */
        var endPosition = 10000;

        /**
         * array of targets
         */
        var targets = [];

        /**
         * target.length
         */
        var count = 0;

        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function () {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function () {
            return dependencies;
        };

        /**
         * sets end position for keyed motion
         * @param {int} value
         */
        this.setEndPosition = function( value ){
            endPosition = value;
        };

        /**
         * sets target position for keyed motion
         * @param {int} val
         */
        this.setPosition = function( val ){
            //console.log( val );
            targetPosition = Math.round(val);
            anim.start();
        };

        /**
         * sets maximum progression rate per secont
         * @param {int} val
         */
        this.setMaxRate = function( val ){
            maxRate = val;
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * module initializer
         */
        this.initialize = function(){
            lola.debug('motion::initialize');
            anim = new lola.animation.Animation( tick, self );
            lola.animation.register( namespace, anim );
            delete self.initialize;
        };

        /**
         * animation tick function
         * @param now
         * @param delta
         * @param elapsed
         */
        function tick( now, delta, elapsed ){
            //console.log('tick[', now,']', targetPosition, lastPosition);
            var active = false;

            if (targetPosition != lastPosition){
                //get current delta to target
                var d = targetPosition - lastPosition;
                var sign = d < 0 ? -1 : 1;

                //move half the distance now
                d /= 2;

                var rate = maxRate * ( delta / 1000 );
                var abs = d * sign;

                if (abs > rate){
                    rate *= sign;
                    update( lastPosition + rate );
                    active = true;
                }
                else if ( abs < 1){
                    update( targetPosition );
                }
                else {
                    update( lastPosition + d );
                    active = true;
                }
            }

            return active;
        }

        /**
         * updates all targets with the current position
         * @param {Number} position
         */
        function update( position ){
            //console.log('update position:', position );
            var positive = position > lastPosition;
            position = Math.round(Math.min(endPosition,Math.max(0,position)));
            var i = 0;
            while( i < count ){
                targets[i].setPosition( position, positive );
                i++;
            }
            lastPosition = position;
        }

        /**
         * adds keyed motion targets
         * @param objects
         * @param properties
         */
        this.addTarget = function( objects, options ){
            if (!Array.isArray(objects))
                objects = [objects];

            var start = (options.start) ? options.start : 0;
            var end = (options.end) ? options.end : range;
            var ease = lola.easing.get( options.ease ? options.ease : 'linear' );
            var step = options.step;
            delete options.start;
            delete options.end;
            delete options.ease;
            delete options.step;

            //getTweenObject = function( tweenId, target, group, property, value, dispatcher ){
            objects.forEach( function(obj){
               for (var g in options){
                   if (options.hasOwnProperty(g)){
                       var optGroup = options[g];
                       for (var p in optGroup ){
                           if (optGroup.hasOwnProperty(p)){
                               var s = options[g][p].start == undefined ? start : options[g][p].start;
                               var e = options[g][p].end == undefined ? end : options[g][p].end;
                               var es = options[g][p].ease == undefined ? ease : options[g][p].ease;
                               targets.push( new RangeTween( obj, g, p, options[g][p], es, s, e, step ) );
                           }
                       }
                   }
               }
            });

            count = targets.length;
        };

        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {
            motionRange: function( options ){
                self.addTarget( this.getAll(), options );
            }

        };


        //==================================================================
        // Classes
        //==================================================================
        /**
         * Class used for storing keyed motion targets
         * @param target
         * @param group
         * @param property
         * @param value
         * @param ease
         * @param start
         * @param end
         */
        var RangeTween = function( target, group, property, value, ease, start, end, step ){
            var self = this
            var tweenObject = new lola.tween.getTweenObject( -1, target, group, property, value );
            var active = false;
            var delta = end - start;

            if (typeof step != 'function')
                step = false;

            /**
             * set the position of this target
             * @param position
             * @param positive
             */
            self.setPosition = function( position, positive ){
                var value = undefined;
                if ( position >= start && position <= end ){
                    active = true;
                    value = ease.exec( position-start, 0, 1, delta);
                }
                else if ( active ){
                    active = false;
                    value = positive ? 1 : 0;
                }
                else{
                    //prevent skipping this objects range and not setting anything
                    if (positive && lastPosition < start && position > end ){
                        value = 1;
                    }
                    else if (!positive && lastPosition > end && position < start ){
                        value = 0;
                    }
                }
                if (value != undefined){
                    tweenObject.apply( value );
                    if (step)
                        step( value, this );
                }

            }
        };

    };

    //register module
    lola.registerModule(new Module());

})(lola);

