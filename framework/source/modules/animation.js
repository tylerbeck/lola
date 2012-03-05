/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Animation
 *  Description: Animation module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
    /**
     * Animation Module
     * @namespace lola.animation
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
        var namespace = "animation";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ['event'];

        /**
         * map of active animation targets
         * @private
         */
        var targets = {};

        /**
         * animation uid generator
         * @private
         */
        var animationUid = 0;

        /**
         * animation uid generator
         * @private
         */
        var freeAnimationIds = [];

        /**
         * map of animations
         * @private
         */
        var animations = {};

        /**
         * indicates whether module is ticking
         * @private
         */
        var active = false;

        /**
         * frame type
         * @private
         */
        var getFrameType = 0;

        /**
         * timeout for browsers that don't support animationFrame
         * @private
         */
        var timeout = 1000 / 30;


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
         * get next animation id
         * @return {int}
         */
        function nextAID() {
            return animationUid++;
        }


        //==================================================================
        // Methods
        //==================================================================
        this.initialize = function(){
            getFrameType = lola.support.animationFrameType;
        };

        /**
         * start ticking
         */
        function startTicking(){
            //console.log('startTicking:',active);
            if (!active){
                active = true;
                requestTick();
            }
        }

        /**
         * set callback for animation frame
         * @private
         */
        function requestTick(){
            requestFrame( tick );
        }

        /**
         * set callback for animation frame
         * @param {Function} callback
         */
        function requestFrame(callback){
            if ( getFrameType == 1 )
                lola.window.requestAnimationFrame( callback );
            else if ( getFrameType == 2 )
                lola.window.mozRequestAnimationFrame( callback );
            else if ( getFrameType == 3 )
                lola.window.webkitRequestAnimationFrame( callback );
            else if ( getFrameType == 4 )
                lola.window.oRequestAnimationFrame( callback );
            else
                setTimeout( callback, timeout );
        }

        /**
         * registers a animation with the framework
         * @param name
         * @param {lola.animation.Animation} animation
         */
        this.register = function( name, animation ){
            //console.log('lola.animation.registerAnimation', name, animation );
            animations[ name ] = animation;
        };

        /**
         * removes a registered animation
         */
        this.remove = function( name ){
            //console.log('lola.animation.registerAnimation', name, animation );
            if (animations[name]){
                delete animations[name];
            }
        };

        /**
         * starts the referenced animation
         * @param {uint} name
         * @private
         */
        this.start = function( name ){
            //console.log('lola.animation.start', name );
            if (animations[ name ]){

                animations[ name ].start();
            }
        };

        /**
         * stops the referenced animation
         * @param {uint} name
         */
        this.stop = function( name ){
            //console.log('lola.animation.stop', name );
            if (animations[ name ]){
                animations[ name ].stop();
            }
        };

        /**
         * pauses the referenced animation
         * @param {uint} name
         */
        this.pause = function( name ){
            //console.log('lola.animation.pause', name );
            if (animations[ name ]){
                animations[ name ].pause();
            }
        };

        /**
         * resumes the referenced animation
         * @param {uint} name
         */
        this.resume = function( name ){
            //console.log('lola.animation.resume', name );
            if (animations[ name ]){
                animations[ name ].resume();
            }
        };


        /**
         * executes a frame tick for animationing engine
         * @private
         */
        function tick(){
           //iterate through animations and check for active state
            //if active, run position calculation on animations
            var activityCheck = false;
            var now = lola.now();
            //console.log('lola.animation.tick', now );

            for (var k in animations){
                //console.log('   ',k,animations[k].isActive());
                if (animations[k].isActive()){
                    activityCheck = true;
                    if ( !animations[k].isComplete() ){
                        //console.log('   ','not complete');
                        animations[k].enterFrame( now );
                    }
                    else{
                        //console.log('   ','complete');
                        //catch complete on next tick
                        lola.event.trigger(animations[k],'animationcomplete',false,false);
                        delete animations[k];
                        freeAnimationIds.push( parseInt(k) );
                    }
                }
            }

            if (activityCheck){
                requestTick();
            }
            else {
                active = false;
            }
        }

        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {

        };


        //==================================================================
        // Classes
        //==================================================================
        this.Animation = function( tickFn, tickScope ) {
            var startTime = -1;
            var pauseTime = -1;
            var delay = 0;
            var lastTime = -1;
            var active = false;
            var complete = false;
            var tick = (typeof tickFn === "function")?tickFn:function(){ return false;};

            this.enterFrame = function( now ){
                var delta = now - lastTime;
                var elapsed = now - startTime;
                lastTime = now;
                active = tick.call( tickScope, now, delta, elapsed );
            };

            this.isActive = function(){
                return active;
            };
            this.isComplete = function(){
                return complete;
            };

            this.start = function(){
                if (!active){
                    this.restart();
                }
            };

            this.pause = function(){
                if (active){
                    active = false;
                    pauseTime = lola.now();
                    lola.event.trigger( self, 'animationpause',false,false);
                }
            };

            this.resume = function(){
                if (!active){
                    active = true;
                    startTime += lola.now() - pauseTime;
                    startTicking();
                    lola.event.trigger( self, 'animationresume',false,false);
                }
            };

            this.restart = function(){
                active = true;
                complete = false;
                startTime = lastTime = lola.now();
                startTicking();
                lola.event.trigger( self, 'animationstart',false,false);
            };

            this.stop = function(){
                active = false;
                complete = true;
                lola.event.trigger( self, 'animationstop',false,false);
            };

            return this;
        };


    };

	//register module
	lola.registerModule( new Module() );

})( lola );

