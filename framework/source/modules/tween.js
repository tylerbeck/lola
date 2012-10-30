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
         * tween uid generator
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
            var anim = new $.animation.Animation( tick, self );
            $.animation.register(namespace, anim);
            if ( Object.keys( tweens ).length > 0 ){
                startTicking();
            }
        };

        /**
         * start ticking
         */
        function startTicking(){
            $.animation.start( namespace );
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
            //console.log('$.tween.start',id,tweens[ id ]);
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
            //console.log('tween.addTarget',targets);
            if (tweens[ tweenId ]){
                collisions = collisions === true;
                if ($.type.get(objects) != 'array')
                    objects = [objects];

                var ol = objects.length;
                for (var i=0; i<ol; i++) {
                    var obj = objects[i];
                    //console.log('   ',obj);
                    var id = $(obj).identify().attr('id');
                    if (!targets[id])
                        targets[id] = {};
                    for (var g in properties){
                        //console.log('      ',g);
                        if (properties.hasOwnProperty(g)){
                            var propg = properties[g];
                            // p should be lola selector methods eg style, attr, classes
                            if (!targets[id][g])
                                targets[id][g] = {};
                            for (var p in propg ){
                                if (propg.hasOwnProperty(p)){
                                    //console.log('         ',p);
                                    if (collisions || targets[id][g][p] == null ){
                                        if (!targets[id][g][p])
                                            targets[id][g][p] = [];

                                        if (collisions)
                                            targets[id][g][p].push( self.getTweenObject( tweenId, obj, g, p, propg[p] ) );
                                        else
                                            targets[id][g][p] = [ self.getTweenObject( tweenId, obj, g, p, propg[p] ) ];
                                    }
                                }
                            }
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
        this.getTweenObject = function( tweenId, target, group, property, value ){
            //console.log("this.getTweenObject", tweenId, target, group, property, value );
            //get initial value
            var from,to,delta;

            if (!value.from){
                //try to get "from" value
                var f = $(target)[group]( property );
                //console.log('test f:',f);
                //console.log()
                if (typeof value == "object" ){
                    value.from = f;
                }
                else {
                    var t = String(value);
                    value = {from:f,to:t};
                }
            }

            if ( value.from ) {
                from = value.from;
                //console.log('    using value.from');
            }
            else if (typeof value == "function"){
                from = value.call( target );
                //console.log('    using value.call( target )');
            }
            else{
                from = $(target)[group]( property );
                //console.log('    using $(target)[group]( property )');
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
            if ( hooks[ group ] ) {
                type = hooks[ group ];
            }
            else {
                for ( var i in types ) {
                    if (types.hasOwnProperty(i)){
                        //console.log('checking type', i);
                        type = types[i];
                        //console.log('    testing type', i, type.match.test( String( from ) ), type.match.test( String( to ) ) );
                        if ( i == group ){
                            break;
                        }
                        if ( type.match === true || (type.match && type.match.test( String( to ) ) && type.match.test( String( from ) ) )) {
                            break;
                        }
                        else {
                            type = null;
                        }
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
                //console.log('       ', from, to );
                if ( !type.canTween( from, to ) ) {
                    type = null;
                }
            }
            if (!type) {
                proxy = $.tween.setAfterProxy;
                delta = to;
            }

            var result = new self.TweenObject( tweenId, target, group, property, from, delta, proxy );
            //console.log(result);
            return result;
        };

        /**
         * executes a frame tick for tweening engine
         * @private
         */
        function tick( now, delta, elapsed ){
            //console.log('$.tween.tick', now, $.now(), delta, elapsed );
            //iterate through tweens and check for active state
            //if active, run position calculation on tweens
            var activityCheck = false;
            //console.log('tick: '+now);

            var tFn, gFn, pFn;
            tFn = undefined;
            gFn = function(t,g){ return true; };
            pFn = function(t,g,p,obj){
                var dispatcher = obj[0].target;
                if (dispatcher){
                    $.event.trigger(dispatcher,'tweencomplete',false,false);
                }
                return true;
            };

            for (var k in tweens){
                if (tweens.hasOwnProperty(k) && tweens[k].active){
                    activityCheck = true;
                    if ( !tweens[k].complete )
                        tweens[k].calculate( now );
                    else{
                        //catch complete on next tick

                        //trigger events
                        $.event.trigger(tweens[k],'tweencomplete',false,false);
                        iterateTargets( tFn, gFn, pFn );

                        delete tweens[k];
                        freeTweenIds.push( parseInt(k) );
                    }
                }
            }

            //apply tween position to targets
            var gCount = 0;
            var pCount = 0;
            tFn = function(t){
                if (gCount == 0){
                    delete targets[t];
                }
                gCount = 0;
                return true;
            };
            gFn = function(t,g){
                if (pCount == 0){
                    delete targets[t][g];
                }
                else{
                    gCount++;
                }
                pCount = 0;
                return true;
            };
            pFn = function(t,g,p,obj){
                var tmp = [];
                var trg;
                while (trg = obj.shift()){
                    //console.log("      TweenObject",to);
                    //console.log("      Tween",tweens[to.tweenId]);
                    if (trg && tweens[trg.tweenId] && tweens[trg.tweenId].active){
                        trg.apply( tweens[trg.tweenId].value );
                        tmp.push( trg );
                    }
                }
                targets[t][g][p] = tmp;

                if ( targets[t][g][p].length == 0){
                    delete targets[t][g][p];
                }
                else{
                    pCount++;
                }
                return true;
            };

            iterateTargets( tFn, gFn, pFn );

            return activityCheck;
        }

        /**
         * iterate through target tree
         * @param tFn
         * @param gFn
         * @param pFn
         */
        function iterateTargets( tFn, gFn, pFn ){
            for (var t in  targets){
                //target level
                if (targets.hasOwnProperty(t)){
                    var tar = targets[t];
                    for (var g in tar){
                        if (tar.hasOwnProperty(g)){
                            var targ = tar[g];
                            for (var p in targ){
                                if (targ.hasOwnProperty(p)){
                                    var obj = targ[p];
                                    if (pFn && !pFn( t, g, p, obj )) break;
                                }
                            }
                            if (gFn && !gFn( t, g )) break;
                        }
                    }
                    if (tFn && !tFn(t)) break;
                }
            }
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
        function setAfterProxy( obj, progress ) {
            if ( progress >= 1  )
                obj.$target[ obj.type ]( obj.property, obj.initialValue + obj.deltaValue);
        }

        /**
         * adds a tween type
         * @param {String} id
         * @param {Object} obj
         */
        this.addTweenType = function( id, obj ) {
            types[ id ] = obj;
        };

        this.getTargets = function(){
            return targets;
        };

        //==================================================================
        // Tween Types
        //==================================================================
        this.addTweenType('simple', {
            match: $.regex.isNumber,
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
            proxy: function( obj, progress ){
                obj.$target[ obj.type ]( obj.property, obj.initialValue + obj.deltaValue * progress );
            }
        });

        this.addTweenType('dimensional', {
            match: $.regex.isDimension,
            parse: function(val){
                var parts = String( val ).match( $.regex.isDimension );
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
            proxy: function( obj, progress ) {
                var i = obj.initialValue;
                var d = obj.deltaValue;
                obj.$target[ obj.type ]( obj.property, (i.value + d.value * progress) + d.units);
            }
        });

        this.addTweenType('color', {
            match: $.regex.isColor,
            parse: function(val){
                //console.log ('color.parse: ',val);
                var color = new $.css.Color( val );
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
            proxy: function( obj, progress ) {
                var i = obj.initialValue;
                var d = obj.deltaValue;
                var r = ((i.r + d.r * progress) * 255) | 0;
                var g = ((i.g + d.g * progress) * 255) | 0;
                var b = ((i.b + d.b * progress) * 255) | 0;
                var a = (i.a + d.a * progress);
                //console.log ('color.proxy: ',from, delta, progress, r, g, b, a);

                if ( $.support.colorAlpha )
                    obj.$target[ obj.type ]( obj.property, "rgba(" + [r,g,b,a].join( ',' ) + ")");
                else
                    obj.$target[ obj.type ]( obj.property, "rgb(" + [r,g,b].join( ',' ) + ")");
            }
        });

        this.addTweenType('class', {
            match: false,
            parse: function(val){
                return val;
            },
            canTween: function(a,b){
                return true;
            },
            getDelta: function( to, from, method) {
                return to;
            },
            proxy: function( obj, progress ) {
                var $t = obj.$target;
                if (progress < 1){
                    if ( !$t.hasClass(obj.property) )
                        $t.addClass(obj.property);
                }
                else{
                    if ( $t.hasClass(obj.property) )
                        $t.removeClass(obj.property);
                }
            }
        });

        this.addTweenType('event', {
            match: false,
            parse: function(val){
                return val;
            },
            canTween: function(a,b){
                return true;
            },
            getDelta: function( to, from, method) {
                return to;
            },
            proxy: function( obj, progress ) {
                var $t = obj.$target;
                if (progress >= 1){
                    $t.trigger(obj.property,false,false, obj.deltaValue );
                }
                else if (progress <= 0){
                    $t.trigger(obj.property,false,false, obj.initialValue );
                }
            }
        });

        this.addTweenType('setafter', {
            match: true,
            parse: function(val){
                return val;
            },
            canTween: function(a,b){
                return true;
            },
            getDelta: function( to, from, method) {
                return to;
            },
            proxy: setAfterProxy
        });



        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {
            tween: function( properties, duration, delay, easing, collisions, returnId ){
                var tweenId = self.registerTween( new self.Tween( duration, easing, delay ) );
                self.addTarget( tweenId, this.getAll(), properties, collisions );
                self.start(tweenId);

                if (returnId === true)
                    return tweenId;

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
                    this.easing = $.easing.get( easing );
                else
                    this.easing = $.easing.get('default');
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
                this.value = elapsed ? this.easing.exec( elapsed, 0, 1, this.duration ) : 0;
            },

            start: function(){
                //console.log('Tween.start', this.active);
                if (!this.active){
                    this.active = true;
                    this.startTime = $.now();
                    startTicking();
                    $.event.trigger(this,'tweenstart',false,false);
                }
            },
            stop: function(){
                this.active = false;
                this.complete = true;
                $.event.trigger(this,'tweenstop',false,false);
            },
            pause: function(){
                if (this.active){
                    this.active = false;
                    this.pauseTime = $.now();
                    $.event.trigger(this,'tweenpause',false,false);
                }
            },
            resume: function(){
                if (!this.active){
                    this.active = true;
                    this.startTime += $.now() - this.pauseTime;
                    startTicking();
                    $.event.trigger(this,'tweenresume',false,false);
                }
            }


        };


        this.TweenObject = function( tweenId, target, type, property, initialValue, deltaValue, proxy ){
            this.init( tweenId, target, type, property, initialValue, deltaValue, proxy );
            return this;
        };
        this.TweenObject.prototype = {
            $target: null,
            target: null,
            type: null,
            property: null,
            tweenId: -1,
            initialValue: null,
            deltaValue: null,
            proxy: null,
            units: "",

            init: function( tweenId, target, type, property, initialValue, deltaValue, proxy ){
                this.$target = $(target);
                this.target = target;
                this.type = type;
                this.property = property;
                this.tweenId = tweenId;
                this.initialValue = initialValue;
                this.deltaValue = deltaValue;
                this.proxy = proxy;
                //console.log('proxy', proxy);
            },

            apply: function( value ){
                //console.log('TweenObject::apply',this.property, value);
                this.proxy( this, value );
            }
        };

    };

	//register module
	lola.registerModule( new Module() );

})( lola );

