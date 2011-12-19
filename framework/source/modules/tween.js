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
            if ( window.requestAnimationFrame ) {
                lola.tween.requestTick = function(){ lola.window.requestAnimationFrame( lola.tween.tick ); };
                lola.tween.requestFrame = function( callback ){ lola.window.requestAnimationFrame( callback ); };
            }
            if ( window.mozRequestAnimationFrame ){
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
            }

			//remove initialization method
			delete lola.tween.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.tween::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization



			//remove initialization method
			delete lola.tween.initialize;
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
			return [];
		},

        /**
         * set callback for animation frame
         * @private
         */
        requestTick: function(){
            setTimeout( function(){ lola.tween.tick.call(lola.tween); }, 20 );
        },

        /**
         * set callback for animation frame
         * @param {Function} callback
         */
        requestFrame: function(callback){
            setTimeout( callback, 20 );
        },

        registerTween: function( tween ){
            var tid = this.freeTweenIds.length > 0 ? this.freeTweenIds.pop() : this.tweenUid++;
            this.tweens[tid] = tween;
            return tid;
        },

        start: function( id ){
            if (this.tweens[ id ]){
                this.tweens[id].start();
                if (!this.active){
                    this.active = true;
                    this.requestTick();
                }
            }
        },

        stop: function( id ){
            if (this.tweens[ id ]){
                this.tweens[id].stop();
            }
        },

        pause: function( id ){
            if (this.tweens[ id ]){
                this.tweens[id].pause();
            }
        },
        resume: function( id ){
            if (this.tweens[ id ]){
                this.tweens[id].resume();
                if (!this.active){
                    this.active = true;
                    this.requestTick();
                }
            }
        },

        addTarget: function( tweenId, objects, properties, overwrite ){
            if (this.tweens[ tweenId ]){
                overwrite = overwrite != false;
                if (lola.type.get(objects) != 'array')
                    objects = [objects];

                var ol = objects.length;
                for (var i=0; i<ol; i++) {
                    var obj = objects[i];
                    var id = $(obj).identify().attr('id');
                    if (!this.targets[id])
                        this.targets[id] = {};
                    for (var p in properties){
                        if (overwrite || this.targets[id][p] == null ){
                            this.targets[id][p] = this.getTweenObject( tweenId, obj, p, properties[p] );
                        }
                    }
                }
            }
            else{
                throw new Error("tween not found");
            }
        },

        getTweenObject: function( tweenId, target, property, value ){
            console.log("getTweenObject", tweenId, target, property, value );
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
            console.log('from', from);
            //we can only tween if there's a from value
            var deltaMethod = 0;
            if (from != null && from != undefined) {
                //get to value
                if (lola.type.isPrimitive( value )) {
                    to = value;
                }
                else if (value.to) {
                    to = value.to;
                }
                else if (value.add) {
                    deltaMethod = 1;
                    to = value.add;
                }
                else if (value.subtract) {
                    deltaMethod = 2;
                    to = value.subtract;
                }
            }
            else{
                throw new Error('invalid tween parameters')
            }
            console.log('to', to);

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
            console.log('type', type);


            return new tween.TweenObject( tweenId, target, property, from, delta, proxy );
        },

        tick: function(){
           //iterate through tweens and check for active state
            //if active, run position calculation on tweens
            var activityCheck = false;
            var now = lola.now();
            var t = this.tweens;
            for (var k in t){
                if (t[k].active){
                    activityCheck = true;
                    if ( !t[k].complete )
                        t[k].calculate( now );
                    else{
                        delete t[k];
                        lola.tween.freeTweenIds.push( parseInt(k) );
                    }
                }

            }

            //apply tween position to targets
            for (var t in this.targets){
                var c = 0;
                for ( var p in this.targets[t] )
                {
                    c++;
                    var to = this.targets[t][p];
                    if (this.tweens[to.tweenId].active) {
                        to.apply( this.tweens[to.tweenId].value );
                        if ( this.tweens[to.tweenId].complete )
                            delete this.targets[t][p];
                    }
                }
                if (c == 0)
                    delete this.targets[t];

            }

            if (activityCheck){
                this.requestTick();
                this.active = true;
            }
            else {
                this.active = false;
            }

        },

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
                    switch( method ){
                        case 1:
                            return to;
                            break;
                        case 2:
                            return 0 - to;
                            break;

                    }
                    return to - from;
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
                    switch( method ){
                        case 1:
                            return {value:to.value, units:to.units};
                            break;
                        case 2:
                            return {value:0 - to.value, units:to.units};
                            break;

                    }
                    return {value:to.value - from.value, units:to.units};
                },
                proxy: function( target, property, from, delta, progress ) {
                    target[property] = (from.value + delta.value * progress) + delta.units;
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
                tweenStyle: function( properties, duration, delay, easing, overwrite ){
                    var targets = [];
                    this.forEach( function(item){
                       targets.push( item.style );
                    });
                    var tweenId = lola.tween.registerTween( new tween.Tween( duration, easing, delay ) );
                    lola.tween.addTarget( tweenId, targets, properties, overwrite );
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
                this.easing = function(t,v,c,d){ return (t/d)*c + v;};
            }
        },

        calculate: function( now ){
            var elapsed = now - this.startTime - this.delay;
            if (elapsed >= this.duration){
                elapsed = this.duration;
                this.complete = true;
            }

            this.value = elapsed ? this.easing( elapsed, 0, 1, this.duration ) : 0;
        },

        start: function(){
            console.log('Tween.start');
            this.active = true;
            this.startTime = lola.now();
            if (!lola.tween.active) {
                lola.tween.requestTick();
            }

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
            if (!lola.tween.active) {
                lola.tween.requestTick();
            }
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
            console.log('tween.apply',value);
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
