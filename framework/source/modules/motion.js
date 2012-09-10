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
	    var $ = lola;
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

        var groups = {};

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


        //==================================================================
        // Methods
        //==================================================================
        /**
         * module initializer
         */
        this.initialize = function(){
            $.syslog('motion::initialize');

            delete self.initialize;
        };

        /**
         * registers a motion group
         * @param name
         * @param options
         */
        this.register = function( name, options ){
            if (!groups[ name ]){
                var group = new Group( name );
                if ( options.frames ) group.frames( options.frames );
                if ( options.maxRate ) group.maxRate( options.maxRate );
                if ( options.timed ) group.timed( options.timed );
                if ( options.loop ) group.loop( options.loop );
                if ( options.step ) group.step( options.step );

                groups[ name ] = group;
            }

            //TODO: add inline targets
        };

        function getGroups( names ){
            var result = [];
            if (names == undefined){
                names = groups.keys();
            }
            else if (typeof names == "string"){
                names = [names];
            }

            if (Array.isArray(names)){
                names.forEach( function( name ){
                    if (groups[ name ])
                        result.push( name );
                })

            }

            return result;
        }

        /**
         * removes a motion group
         * @param groupNames
         */
        this.remove = function( groupNames ){
            var names = getGroups( groupNames );
            names.forEach( function(name){
                var group = groups[name];
                group.destroy();
                delete groups[name];
            });
        };

        /**
         * gets a motion group
         * @param name
         */
        this.get = function( name ){
            return groups[name];
        };

        /**
         * adds targets to the specified group
         * @param groupName
         * @param objects
         * @param options
         */
        this.addTargets = function( groupName, objects, options ){
            var group = groups[groupName];
            if (group){
                group.addTargets( objects, options );
            }
        };

        /**
         * removes targets from specified groups
         * @param targets
         * @param groupNames
         */
        this.removeTargets = function( targets, groupNames ){
            var names = getGroups( groupNames );
            names.forEach( function(item){
                var group = groups[item];
                if (group){
                    group.removeTargets( targets );
                }
            });
        };

        /**
         * sets target position for specified groups
         * @param value
         * @param groupNames
         */
        this.position = function( value, groupNames ){
            var names = getGroups( groupNames );
            names.forEach( function(name){
                if (groups[name]){
                    groups[name].position( value );
                }
            });
        };


        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {
            motionRange: function( groupName, options ){
                self.addTargets( groupName, this.getAll(), options );
                return this;
            }
        };


        //==================================================================
        // Classes
        //==================================================================
        var Group = function( name ){
			var $ = lola;
            var self = this;
            var anim = new $.animation.Animation( tick, self );
            $.animation.register( namespace+'.'+name, anim );
            var frameCount = 10000;
            var maxRate = 5000;
            var loop = false;
            var doLoop = false;
            var timed = false;
            var stepFn;
            var targetPosition = 0;
            var lastPosition = 0;
            var targets = [];
            var count = 0;

            /**
             * sets end position for keyed motion
             * @param {int} value
             */
            self.frames = function( value ){
                if (value){
                    frameCount = parseInt(value);
                }
                return frameCount;
            };

            /**
             * sets target position for keyed motion
             * @param {int} val
             */
            self.position = function( value ){
                //console.log( value );
                if ( value != undefined ){
                    targetPosition = Math.round( value );
                    anim.start();
                }
                return targetPosition;
            };

            /**
             * sets maximum progression rate per secont
             * @param {int} value
             */
            self.maxRate = function( value ){
                if ( value != undefined ){
                    maxRate = value;
                }
                return maxRate;
            };

            self.timed = function( value ){
                if ( value != undefined )
                    timed = ( value === true );

                return timed;
            };

            self.loop = function( value ){
                if ( value != undefined )
                    loop = ( value === true );

                return loop;
            };

            self.step = function( value ){
                if ( value != undefined )
                    stepFn = (typeof value == 'function') ? value : false;

                return stepFn;
            };



            self.start = function(){
                if (timed){
                    doLoop = loop;
                    self.position( frameCount );
                }
            };

            self.stop = function(){
                doLoop = false;
                targetPosition = lastPosition;
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
                        self.update( lastPosition + rate );
                        active = true;
                    }
                    else if ( abs < 1){
                        self.update( targetPosition );
                    }
                    else {
                        self.update( lastPosition + d );
                        active = true;
                    }
                }

                if (timed && doLoop){
                    active = true;
                }

                return active;
            }

            /**
             * updates all targets with the current position
             * @param {Number} position
             */
            self.update = function( position ){
                var positive = position > lastPosition;
                position = Math.round( Math.min( frameCount, Math.max(0,position) ) );
                if ( timed && doLoop && position == frameCount ){
                    position = 0;
                }
                var i = 0;
                while( i < count ){
                    targets[i].position( position, positive );
                    i++;
                }

                if (stepFn)
                    stepFn(position);

                lastPosition = position;
            };

            /**
             * adds keyed motion targets
             * @param objects
             * @param options
             */
            self.addTargets = function( objects, options ){
                if (!Array.isArray(objects))
                    objects = [objects];

                var start = (options.start) ? options.start : 0;
                var end = (options.end) ? options.end : frameCount;
                var ease = $.easing.get( options.ease ? options.ease : 'linear' );

                delete options.start;
                delete options.end;
                delete options.ease;

                //getTweenObject = function( tweenId, target, group, property, value, dispatcher ){
                objects.forEach( function(obj){
                    for (var g in options){
                        if (options.hasOwnProperty(g)){
                            var optGroup = options[g];
                            for (var p in optGroup ){
                                if (optGroup.hasOwnProperty(p)){
                                    var pObj = Array.isArray(optGroup[p]) ? optGroup[p] : [optGroup[p]];
                                    pObj.forEach(function(item){
                                        var s = item.start == undefined ? start : item.start;
                                        var e = item.end == undefined ? end : item.end;
                                        var es =  item.ease == undefined ? ease : $.easing.get(item.ease);
                                        var st = item.step;
                                        targets.push( new RangeTween( obj, g, p, item, es, s, e, st ) );
                                    });
                                }
                            }
                        }
                    }
                });

                count = targets.length;
            };

            /**
             * removes targets from group
             * @param objects
             */
            self.removeTargets = function( objects ){
                var newTargets = [];
                targets.forEach( function(item){
                    if ( objects.indexOf( item.obj ) == -1 ){
                        newTargets.push( item );
                    }
                });
                targets = newTargets;
            };

            /**
             * destroy group - unregister animation and targets
             */
            self.destroy = function(){
                targets = [];
                $.animation.remove( namespace+'.'+name );
            }

        };

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
	        var $ = lola;
	        var self = this;
            var tweenObject = new $.tween.getTweenObject( -1, target, group, property, value );
            var active = false;
            var delta = end - start;
            var lastPosition = 0;

            if (typeof step != 'function')
                step = false;

            /**
             * set the position of this target
             * @param position
             * @param positive
             */
            self.position = function( position, positive ){
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

                lastPosition = position;

            }
        };

    };

    //register module
    lola.registerModule(new Module());

})(lola);

