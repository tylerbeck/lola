/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Tween
 *  Description: Tween module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
    /**
     * Tween Module
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
        var namespace = "tween";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ['animation','css','event','easing'];

        /**
         * map of active tween targets
         * @private
         */
        var targets = {};

        /**
         * tween uid generato
         * @private
         */
        var tweenUid = 0;

        /**
         * tween uid generato
         * @private
         */
        var freeTweenIds = [];

        /**
         * map of tweens
         * @private
         */
        var tweens = {};

        /**
         * map of tween types
         * @private
         */
        var hooks = {};

        /**
         * indicates whether module is ticking
         * @private
         */
        var active = false;

        /**
         * tween types
         * @private
         */
        var types = {};

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
         * get next tween id
         * @return {int}
         */
        function nextTID() {
            return tweenUid++;
        }


        //==================================================================
        // Methods
        //==================================================================
        /**
         * module initializer
         */
        this.initialize = function(){
            var anim = new lola.animation.Animation( tick, self );
            lola.animation.register(namespace, anim);
            if ( Object.keys( tweens ).length > 0 ){
                startTicking();
            }
        };

        /**
         * start ticking
         */
        function startTicking(){
            lola.animation.start( namespace );
        }

        /**
         * registers a tween with the framework
         * @param {lola.tween.Tween} tween
         * @return {uint} tween identifier
         */
        this.registerTween = function( tween ){
            var tid = freeTweenIds.length > 0 ? freeTweenIds.pop() : nextTID();
            tweens[tid] = tween;
            return tid;
        };

        /**
         * starts the referenced tween
         * @param {uint} id
         * @private
         */
        this.start = function( id ){
            //console.log('lola.tween.start',id,tweens[ id ]);
            if (tweens[ id ]){
                tweens[ id ].start();
            }
        };

        /**
         * stops the referenced tween
         * @param {uint} id
         */
        this.stop = function( id ){
            if (tweens[ id ]){
                tweens[id].stop();
            }
        };

        /**
         * pauses the referenced tween
         * @param {uint} id
         */
        this.pause = function( id ){
            if (tweens[ id ]){
                tweens[id].pause();
            }
        };

        /**
         * resumes the referenced tween
         * @param {uint} id
         */
        this.resume = function( id ){
            if (tweens[ id ]){
                tweens[id].resume();
            }
        };

        /**
         * adds targets to referenced tween
         * @param {uint} tweenId
         * @param {Object|Array} objects
         * @param {Object} properties
         * @param {Boolean} collisions
         * @private
         */
        this.addTarget = function( tweenId, objects, properties, collisions ){
            if (tweens[ tweenId ]){
                collisions = collisions === true;
                if (lola.type.get(objects) != 'array')
                    objects = [objects];

                var ol = objects.length;
                for (var i=0; i<ol; i++) {
                    var obj = objects[i];
                    var id = $(obj).identify().attr('id');
                    if (!targets[id])
                        targets[id] = {};
                    for (var p in properties){
                        if (p == "style"){
                            //TODO: use CSS3 transitions if available
                            for (var s in properties[p] ){
                                if (collisions || targets[id]['style:'+s] == null ){
                                    if (!properties[p][s].from && !obj.style[s]){
                                        //try to get "from" value
                                        var f = lola.css.style( obj, s );
                                        //console.log('  getting initial style')
                                        if (typeof properties[p][s] == "object" ){
                                            properties[p][s].from = f;
                                        }
                                        else {
                                            var t = String(properties[p][s]);
                                            properties[p][s] = {from:f,to:t};
                                        }
                                    }
                                    if (!targets[id]['style:'+s])
                                        targets[id]['style:'+s] = [];
                                    if (collisions)
                                        targets[id]['style:'+s].push( getTweenObject( tweenId, obj.style, s, properties[p][s], obj ));
                                    else
                                        targets[id]['style:'+s] = [ getTweenObject( tweenId, obj.style, s, properties[p][s], obj )];
                                }
                            }
                        }
                        else {

                            if (!this.targets[id][p])
                                this.targets[id][p] = [];
                            if (collisions)
                                this.targets[id][p].push( getTweenObject( tweenId, obj, p, properties[p], obj ));
                            else
                                this.targets[id][p] = [ getTweenObject( tweenId, obj, p, properties[p], obj )];

                        }

                    }
                }
            }
            else{
                throw new Error("tween not found");
            }
        };

        /**
         * gets a TweenObject for specified target and property
         * @param {uint} tweenId
         * @param {Object} target
         * @param {String} property
         * @param {*} value
         * @param {*} dispatcher element that dispatches complete event
         * @private
         */
        function getTweenObject( tweenId, target, property, value, dispatcher ){
            //console.log("getTweenObject", tweenId, target, property, value );
            //get initial value
            var from,to,delta;
            if ( value.from ) {
                from = value.from;
            }
            else if (typeof value == "function"){
                from = value.call( target );
            }
            else{
                from = target[ property ];
            }
            //console.log('    from',  String(from));
            //we can only tween if there's a from value
            var deltaMethod = 0;
            if (from != null && from != undefined) {
                //get to value
                if (lola.type.isPrimitive( value )) {
                    to = value;
                }
                else if (value.to) {
                    deltaMethod = 0;
                    to = value.to;
                }
                else if (value.add) {
                    deltaMethod = 1;
                    to = value.add;
                }
                else if (value.by) {
                    deltaMethod = 1;
                    to = value.by;
                }
            }
            else{
                throw new Error('invalid tween parameters')
            }
            //console.log('    to',  String(to));

            //break down from and to values to tweenable values
            //and determine how to tween values
            var type, proxy;
            if ( hooks[ property ] ) {
                type = hooks[ property ];
            }
            else {
                for ( var i in types ) {
                    type = types[i];
                    //console.log('    testing type', i, type.match.test( String( from ) ), type.match.test( String( to ) ) );
                    if ( type.match.test( String( to ) ) && type.match.test( String( from ) ) ) {
                        break;
                    }
                    else {
                        type = null;
                    }
                }
            }

            if ( type ) {
                // test parsed objects to see if they can be tweened
                to = type.parse( to );
                from = type.parse( from );
                delta = type.getDelta( to, from, deltaMethod );
                proxy = type.proxy;
                //console.log('   canTween', type.canTween( from, to ) );
                if ( !type.canTween( from, to ) ) {
                    type = null;
                }
            }
            if (!type) {
                proxy = lola.tween.setAfterProxy;
                delta = to;
            }
            //console.log('    type', type);

            return new self.TweenObject( tweenId, target, property, from, delta, proxy, dispatcher );
        }

        /**
         * executes a frame tick for tweening engine
         * @private
         */
        function tick( now, delta, elapsed ){
            //console.log('lola.tween.tick', now, lola.now(), delta, elapsed );
            //iterate through tweens and check for active state
            //if active, run position calculation on tweens
            var activityCheck = false;
            //console.log('tick: '+now);

            for (var k in tweens){
                if (tweens[k].active){
                    activityCheck = true;
                    if ( !tweens[k].complete )
                        tweens[k].calculate( now );
                    else{
                        //catch complete on next tick
                        //trigger events
                        lola.event.trigger(tweens[k],'tweencomplete',false,false);
                        for (var tr in targets){
                            for ( var pr in targets[tr] ){
                                var dispatcher = targets[tr][pr][0].dispatcher;
                                if (dispatcher){
                                    //console.log( dispatcher );
                                    lola.event.trigger(dispatcher,'tweencomplete',false,false);
                                    break;
                                }
                            }
                        }
                        delete tweens[k];
                        freeTweenIds.push( parseInt(k) );
                    }
                }
            }

            //apply tween position to targets
            for (var t in targets){
                //console.log('target:',t);
                var c1 = 0;
                for ( var p in targets[t] ){
                    //console.log("    ",p);
                    var tmp = [];
                    var to;
                    while (to = targets[t][p].shift()){
                        //console.log("        ",to);
                        //console.log("        ",tweens[to.tweenId])
                        if (to && tweens[to.tweenId] && tweens[to.tweenId].active){
                            to.apply( tweens[to.tweenId].value );
                            tmp.push( to );
                        }
                    }
                    targets[t][p] = tmp;

                    if ( targets[t][p].length == 0){
                        delete targets[t][p];
                    }
                    else{
                        c1++;
                    }
                }
                if (c1 == 0)
                    delete targets[t];

            }

            return activityCheck;
        }

        /**
         * sets a property after tween is complete,
         * used for non-tweenable properties
         * @private
         * @param target
         * @param property
         * @param from
         * @param delta
         * @param progress
         */
        function setAfterProxy( target, property, from, delta, progress ) {
            if ( progress >= 1  )
                target[property] = delta;
        }

        /**
         * adds a tween type
         * @param {String} id
         * @param {Object} obj
         */
        this.addTweenType = function( id, obj ) {
            types[ id ] = obj;
        };

        //==================================================================
        // Tween Types
        //==================================================================
        this.addTweenType('simple', {
                match: lola.regex.isNumber,
                parse: function(val){
                    return parseFloat( val );
                },
                canTween: function(a,b){
                    return ( a != undefined && b != undefined  );
                },
                getDelta: function( to, from, method) {
                    if( method ){
                        return to;
                    }
                    else{
                        return to - from;
                    }
                },
                proxy: null
            });

        this.addTweenType('dimensional', {
                match: lola.regex.isDimension,
                parse: function(val){
                    var parts = String( val ).match( lola.regex.isDimension );
                    return { value: parseFloat( parts[1] ), units: parts[2] };
                },
                canTween: function(a,b){
                    return ((a && b) && ((a.units == b.units)||(a.units == "" && b.units != "")));
                },
                getDelta: function( to, from, method) {
                    if( method ){
                        return {value:to.value, units:to.units};
                    }
                    else{
                        return {value:to.value - from.value, units:to.units};
                    }
                },
                proxy: function( target, property, from, delta, progress ) {
                    target[property] = (from.value + delta.value * progress) + delta.units;
                }
            });

        this.addTweenType('color', {
                match: lola.regex.isColor,
                    parse: function(val){
                    //console.log ('color.parse: ',val);
                    var color = new lola.css.Color( val );
                    //console.log( '    ', color.rgbValue );
                    return color.getRgbValue();
                },
                canTween: function( a, b ) {
                    //console.log ('color.canTween: ',( a && b ));
                    return ( a && b );
                },
                getDelta: function( to, from, method ) {
                    if( method ){
                        //console.log ('color.getDelta '+method+': ', { r:to.r, g:to.g, b:to.b, a:to.a });
                        return { r:to.r, g:to.g, b:to.b, a:to.a };
                    }
                    else{
                        //console.log ('color.getDelta '+method+': ', { r:to.r-from.r, g:to.g-from.g, b:to.b-from.b, a:to.a-from.a });
                        return { r:to.r-from.r, g:to.g-from.g, b:to.b-from.b, a:to.a-from.a };
                    }
                },

                proxy: function( target, property, from, delta, progress ) {
                    var r = ((from.r + delta.r * progress) * 255) | 0;
                    var g = ((from.g + delta.g * progress) * 255) | 0;
                    var b = ((from.b + delta.b * progress) * 255) | 0;
                    var a = (from.a + delta.a * progress);
                    //console.log ('color.proxy: ',from, delta, progress, r, g, b, a);

                    if ( lola.support.colorAlpha )
                        target[property] = "rgba(" + [r,g,b,a].join( ',' ) + ")";
                    else
                        target[property] = "rgb(" + [r,g,b].join( ',' ) + ")";
                }
            });



        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {
            /*tweenStyle: function( properties, duration, delay, easing, collisions ){
                var targets = [];
                this.forEach( function(item){
                    targets.push( item.style );
                });
                var tweenId = self.registerTween( new self.Tween( duration, easing, delay ) );
                self.addTarget( tweenId, targets, properties, collisions );
                self.start(tweenId);
            },*/

            tween: function( properties, duration, delay, easing, collisions ){
                var targets = [];
                this.forEach( function(item){
                    targets.push( item );
                });
                var tweenId = self.registerTween( new self.Tween( duration, easing, delay ) );
                self.addTarget( tweenId, targets, properties, collisions );
                self.start(tweenId);

                return this;
            }
        };


        //==================================================================
        // Classes
        //==================================================================
        this.Tween = function( duration, easing, delay ) {
            this.init( duration, easing, delay );
            return this;
        };
        this.Tween.prototype = {
            startTime: -1,
            pauseTime: -1,
            lastCalc: 0,
            duration: 1000,
            delay: 0,
            value: 0,
            easing: null,
            active: false,
            complete: false,

            init: function( duration, easing, delay ) {
                this.duration = duration;
                if (typeof easing == "function")
                    this.easing = easing;
                else if (typeof easing == "string")
                    this.easing = lola.easing.get( easing );
                else
                    this.easing = lola.easing.get('default');
                this.delay = delay || 0;
                if (!easing){
                    this.easing = {exec:function(t,v,c,d){ return (t/d)*c + v;} };
                }
            },

            calculate: function( now ){
                var elapsed = now - this.startTime - this.delay;
                if (elapsed >= this.duration){
                    elapsed = this.duration;
                    this.complete = true;
                    this.active = true;
                }
                console.log('value', this.value);
                this.value = elapsed ? this.easing.exec( elapsed, 0, 1, this.duration ) : 0;
            },

            start: function(){
                //console.log('Tween.start', this.active);
                if (!this.active){
                    this.active = true;
                    this.startTime = lola.now();
                    startTicking();
                    lola.event.trigger(this,'tweenstart',false,false);
                }
            },
            stop: function(){
                this.active = false;
                this.complete = true;
                lola.event.trigger(this,'tweenstop',false,false);
            },
            pause: function(){
                if (this.active){
                    this.active = false;
                    this.pauseTime = lola.now();
                    lola.event.trigger(this,'tweenpause',false,false);
                }
            },
            resume: function(){
                if (!this.active){
                    this.active = true;
                    this.startTime += lola.now() - this.pauseTime;
                    startTicking();
                    lola.event.trigger(this,'tweenresume',false,false);
                }
            }


        };


        this.TweenObject = function( tweenId, target, property, initialValue, deltaValue, proxy, dispatcher ){
            this.init( tweenId, target, property, initialValue, deltaValue, proxy, dispatcher );
            return this;
        };
        this.TweenObject.prototype = {
            target: null,
            property: null,
            tweenId: -1,
            initialValue: null,
            deltaValue: null,
            proxy: null,
            units: "",
            dispatcher: null,
            init: function( tweenId, target, property, initialValue, deltaValue, proxy, dispatcher ){
                this.target = target;
                this.property = property;
                this.tweenId = tweenId;
                this.initialValue = initialValue;
                this.deltaValue = deltaValue;
                this.proxy = proxy;
                this.dispatcher = dispatcher;
            },

            apply: function( value ){
                //console.log('apply: '+value);
                if (this.proxy){
                    this.proxy( this.target, this.property, this.initialValue, this.deltaValue, value );
                }
                else {
                    this.target[ this.property ] = this.initialValue + this.deltaValue * value;
                }
            }
        };

    };

	//register module
	lola.registerModule( new Module() );

})( lola );

