/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Tween
 *  Description: Tween module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Tween Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var tween = {

        //==================================================================
        // Attributes
		//==================================================================
        /**
         * map of active tween targets
         * @private
         */
        targets: {},

        /**
         * tween uid generato
         * @private
         */
        tweenUid: 0,

        /**
         * tween uid generato
         * @private
         */
        freeTweenIds: [],

        /**
         * map of tweens
         * @private
         */
        tweens: {},

        /**
         * map of tween types
         * @private
         */
        hooks: {},

        /**
         * indicates whether module is ticking
         */
        active: false,

        getFrameType: 0,
        //==================================================================
		// Methods
		//==================================================================
        /**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug('lola.tween::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );


			//do module preinitialization
            //NOTE: This doesn't work in all browsers
            /*if ( window.requestAnimationFrame ) {
                lola.tween.requestTick = function(){ lola.window.requestAnimationFrame( lola.tween.tick ); };
                lola.tween.requestFrame = function( callback ){ lola.window.requestAnimationFrame( callback ); };
            }
            else if ( window.mozRequestAnimationFrame ){
                lola.tween.requestTick = function(){ lola.window.mozRequestAnimationFrame( lola.tween.tick ); };
                lola.tween.requestFrame = function( callback ){ lola.window.mozRequestAnimationFrame( callback ); };
            }
            else if ( window.webkitRequestAnimationFrame ){
                lola.tween.requestTick = function(){ lola.window.webkitRequestAnimationFrame( lola.tween.tick ); };
                lola.tween.requestFrame = function( callback ){ lola.window.webkitRequestAnimationFrame( callback ); };
            }
            else if ( window.oRequestAnimationFrame ){
                lola.tween.requestTick = function(){ lola.window.oRequestAnimationFrame( lola.tween.tick ); };
                lola.tween.requestFrame = function( callback ){ lola.window.oRequestAnimationFrame( callback ); };
            }*/

			//remove initialization method
			delete lola.tween.preinitialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "tween";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['css','event','easing'];
		},

        /**
         * start ticking
         * @private
         */
        startTicking: function(){
            if (!lola.tween.active){
                lola.tween.active = true;
                lola.tween.requestTick();
            }
        },

        /**
         * set callback for animation frame
         * @private
         */
        requestTick: function(){
            lola.tween.requestFrame( lola.tween.tick );
        },

        /**
         * set callback for animation frame
         * @param {Function} callback
         */
        requestFrame: function(callback){
            switch ( lola.tween.getFrameType ) {
                case 1:
                    lola.window.requestAnimationFrame( callback );
                    break;
                case 2:
                    lola.window.mozRequestAnimationFrame( callback );
                    break;
                case 3:
                    lola.window.webkitRequestAnimationFrame( callback );
                    break;
                case 4:
                    lola.window.oRequestAnimationFrame( callback );
                    break;
                default:
                    setTimeout( callback, 20 );
                    break;
            }
        },

        /**
         * registers a tween with the framework
         * @param {lola.tween.Tween} tween
         * @return {uint} tween identifier
         */
        registerTween: function( tween ){
            var tid = this.freeTweenIds.length > 0 ? this.freeTweenIds.pop() : this.tweenUid++;
            this.tweens[tid] = tween;
            return tid;
        },

        /**
         * starts the referenced tween
         * @param {uint} id
         */
        start: function( id ){
            if (this.tweens[ id ]){
                this.tweens[id].start();
                lola.event.trigger(this.tweens[id],'tweenstart',false,false);
            }
        },

        /**
         * stops the referenced tween
         * @param {uint} id
         */
        stop: function( id ){
            if (this.tweens[ id ]){
                this.tweens[id].stop();
                lola.event.trigger(this.tweens[id],'tweenstop',false,false);
            }

        },

        /**
         * pauses the referenced tween
         * @param {uint} id
         */
        pause: function( id ){
            if (this.tweens[ id ]){
                this.tweens[id].pause();
                lola.event.trigger(this.tweens[id],'tweenpause',false,false);
            }
        },

        /**
         * resumes the referenced tween
         * @param {uint} id
         */
        resume: function( id ){
            if (this.tweens[ id ]){
                this.tweens[id].resume();
                lola.event.trigger(this.tweens[id],'tweenresume',false,false);
            }
        },

        /**
         * adds targets to referenced tween
         * @param {uint} tweenId
         * @param {Object|Array} objects
         * @param {Object} properties
         * @param {Boolean} collisions
         */
        addTarget: function( tweenId, objects, properties, collisions ){
            if (this.tweens[ tweenId ]){
                collisions = collisions === true;
                if (lola.type.get(objects) != 'array')
                    objects = [objects];

                var ol = objects.length;
                for (var i=0; i<ol; i++) {
                    var obj = objects[i];
                    var id = $(obj).identify().attr('id');
                    if (!this.targets[id])
                        this.targets[id] = {};
                    for (var p in properties){
                        if (p == "style"){
                            for (var s in properties[p] ){
                                if (collisions || this.targets[id]['style:'+s] == null ){
                                    if (!properties[p][s].from && !obj.style[s]){
                                        //try to get "from" value
                                        var f = lola.css.style( obj, s );
                                        if (typeof properties[p][s] == "object" ){
                                            properties[p][s].from = f;
                                        }
                                        else {
                                            var t = String(properties[p][s]);
                                            properties[p][s] = {from:f,to:t};
                                        }
                                    }
                                    if (!this.targets[id]['style:'+s])
                                        this.targets[id]['style:'+s] = [];
                                    if (collisions)
                                        this.targets[id]['style:'+s].push( this.getTweenObject( tweenId, obj.style, s, properties[p][s] ));
                                    else
                                        this.targets[id]['style:'+s] = [this.getTweenObject( tweenId, obj.style, s, properties[p][s] )];

                                }
                            }
                        }
                        else {

                            if (!this.targets[id][p])
                                this.targets[id][p] = [];
                            if (collisions)
                                this.targets[id][p].push( this.getTweenObject( tweenId, obj, p, properties[p] ));
                            else
                                this.targets[id][p] = [this.getTweenObject( tweenId, obj, p, properties[p] )];

                        }

                    }
                }
            }
            else{
                throw new Error("tween not found");
            }
        },

        /**
         * gets a TweenObject for specified target and property
         * @param {uint} tweenId
         * @param {Object} target
         * @param {String} property
         * @param {*} value
         * @private
         */
        getTweenObject: function( tweenId, target, property, value ){
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
            //console.log('from', from);
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
            //console.log('to', to);

            //break down from and to values to tweenable values
            //and determine how to tween values
            var type, proxy;
            if ( lola.tween.hooks[ property ] ) {
                type = lola.tween.hooks[ property ];
            }
            else {
                for ( var i in lola.tween.types ) {
                    type = lola.tween.types[i];
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
                if ( !type.canTween( from, to ) ) {
                    type = null;
                }
            }
            if (!type) {
                proxy = lola.tween.setAfterProxy;
                delta = to;
            }
            //console.log('type', type);


            return new tween.TweenObject( tweenId, target, property, from, delta, proxy );
        },

        /**
         * executes a frame tick for tweening engine
         * @private
         */
        tick: function(){
           //iterate through tweens and check for active state
            //if active, run position calculation on tweens
            var activityCheck = false;
            var now = lola.now();
            //console.log('tick: '+now);
            var twn = lola.tween.tweens;

            for (var k in twn){
                if (twn[k].active){
                    activityCheck = true;
                    if ( !twn[k].complete )
                        twn[k].calculate( now );
                    else{
                        //catch complete on next tick
                        lola.event.trigger(twn[k],'tweencomplete',false,false);
                        delete twn[k];
                        lola.tween.freeTweenIds.push( parseInt(k) );
                    }
                }
            }

            //apply tween position to targets
            var trg = lola.tween.targets;
            for (var t in trg){
                //console.log(t);
                var c1 = 0;
                for ( var p in trg[t] ){
                    //console.log("    ",p);
                    var tmp = [];
                    var to;
                    while (to = trg[t][p].shift()){
                        //console.log("        ",to);
                        //console.log("        ",twn[to.tweenId])
                        if (to && twn[to.tweenId] && twn[to.tweenId].active){
                            to.apply( twn[to.tweenId].value );
                            tmp.push( to );
                        }
                    }
                    trg[t][p] = tmp;

                    if ( trg[t][p].length == 0){
                        delete trg[t][p];
                    }
                    else{
                        c1++;
                    }
                }
                if (c1 == 0)
                    delete trg[t];

            }

            if (activityCheck){
                lola.tween.requestTick();
            }
            else {
                lola.tween.active = false;
            }

        },
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
        setAfterProxy: function( target, property, from, delta, progress ) {
            if ( progress >= 1  )
                target[property] = delta;
        },



        //==================================================================
        // Tween Types
        //==================================================================
        types: {
            simple: {
                match: lola.regex.isNumber,
                parse: function(val){
                    return parseFloat( val );
                },
                canTween: function(a,b){
                    return (a && b);
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
            },

            dimensional: {
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
            },

            color: {
                match: lola.regex.isColor,
                parse: function(val){
                    //console.log ('color.parse: ',val);
                    var color = new lola.css.Color( val );
                    //console.log( '    ', color.rgbValue );
                    return color.rgbValue;
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
            }

        },

        //==================================================================
        // Classes
        //==================================================================
        Tween: function( duration, easing, delay ) {
            this.init( duration, easing, delay );
            return this;
        },

        TweenObject: function( tweenId, target, property, initialValue, deltaValue, proxy ){
            this.init( tweenId, target, property, initialValue, deltaValue, proxy );
            return this;
        },



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
                tweenStyle: function( properties, duration, delay, easing, collisions ){
                    var targets = [];
                    this.forEach( function(item){
                        targets.push( item.style );
                    });
                    var tweenId = lola.tween.registerTween( new tween.Tween( duration, easing, delay ) );
                    lola.tween.addTarget( tweenId, targets, properties, collisions );
                    lola.tween.start(tweenId);
                },

                tween: function( properties, duration, delay, easing, collisions ){
                    var targets = [];
                    this.forEach( function(item){
                        targets.push( item );
                    });
                    var tweenId = lola.tween.registerTween( new tween.Tween( duration, easing, delay ) );
                    lola.tween.addTarget( tweenId, targets, properties, collisions );
                    lola.tween.start(tweenId);
                }
			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================
    tween.Tween.prototype = {
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
            this.easing = easing;
            this.delay = delay;
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
            //console.log('Tween.start');
            this.active = true;
            this.startTime = lola.now();
            lola.tween.startTicking();
        },
        stop: function(){
            this.active = false;
            this.complete = true;
        },
        pause: function(){
            this.active = false;
            this.pauseTime = lola.now();
        },
        resume: function(){
            this.active = false;
            this.startTime += lola.now() - this.pauseTime;
            lola.tween.startTicking();
        }


    };

    tween.TweenObject.prototype = {
        target: null,
        property: null,
        tweenId: -1,
        initialValue: null,
        deltaValue: null,
        proxy: null,
        units: "",
        init: function( tweenId, target, property, initialValue, deltaValue, proxy ){
            this.target = target;
            this.property = property;
            this.tweenId = tweenId;
            this.initialValue = initialValue;
            this.deltaValue = deltaValue;
            this.proxy = proxy;
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





	//register module
	lola.registerModule( tween );

})( lola );

