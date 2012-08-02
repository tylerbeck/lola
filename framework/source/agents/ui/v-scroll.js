/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Agent: Drag Agent
 *  Description: handles javascript dragging
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
//TODO: THIS AGENT IS INCOMPLETE!
(function( lola ) {
    var Agent = function(){
        var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * agent's namespace
         * @type {String}
         * @private
         */
        var namespace = "v-scroll";

        /**
         * agent's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ['event','data','geometry'];

        /**
         * map of agent's clients
         * @private
         * @type {Object}
         */
        var clients = {};


        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get agent's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get agent's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * signs a client
         * @param {*} client
         */
        this.sign = function( client ) {
            var $client = $(client);
            $client.identify();
            if ( clients[ client.id ] == null) {

                //not a client yet
                clients[ client.id ] = client;
                $client.putData( {}, namespace );

                //setup
                self.setup( client );
            }
        };

        /**
         * drops a client
         * @param {*} client
         */
        this.drop = function( client ) {
            var $client = $(client);
            if (clients[ client.id ] ) {
                $client.removeData( namespace );

                //tear down
                self.teardown( client );


                delete clients[ client.id ];
            }
        };

        /**
         * sets up div for using scroll override
         * @param client
         */
        this.setup = function( client ){
            var $client = $(client);

        };

        /**
         * tears down scroll override div
         * @param client
         */
        this.teardown = function( client ){

        };


        this.initialize = function(){
            lola("."+namespace).assignAgent( namespace );
        };


	    var ScrollController = function( target ){
		    var self = this;
		    var position = 0;
		    var speed = 1;
		    var bounds = {min:0, max:20000};
		    var $scrollTrack;
		    var $grip;


		    function initialize(){

			    //initialize scrolling
			    $scrollTrack = $(target);
			    $grip = $( '.grip', target );
			    $grip.assignAgent('drag');
			    $grip.addListener('dragmove', handleDragMove );
			    var $w = $(window);
			    $w.addListener('touchstart',initTouch);

			    //setup mouse wheel
			    var $d = $(document);
			    $d.addListener( 'mousewheel', handleMousewheel, true );

		    }

		    function handleDragMove(event){
			    var t =  parseFloat( $grip.style('top' ).replace(/px/g,"") );
			    position = Math.round(bounds.min + (bounds.max-bounds.min) * ( t/($scrollTrack.height()-$grip.height()) ));
		    }

		    function handleMousewheel(event){
			    self.position( self.position()-event.wheelDelta );
		    }

		    function setBounds( min, max ){
			    bounds.min = min;
			    bounds.max = max;
		    }

		    this.position = function( val ){
			    if (val != undefined && val != position ){
				    position = lola.math.normalizeRange( bounds.min, val, bounds.max );
				    $grip.style('top', ((position-bounds.min)/(bounds.max-bounds.min) * ($scrollTrack.height()-$grip.height())) + 'px' );
			    }
			    return position;
		    };


		    //TOUCH METHODS AND PARAMETERS
		    var lastTouch = {};

		    function initTouch( event ){
			    console.log('initTouch');
			    var $w = $(window);
			    $w.removeListener( 'touchstart', initTouch );
			    $w.addListener( 'touchmove', handleTouchMove );
			    setLastTouch( event );
		    }

		    function setLastTouch( event ){
			    if ( event.touches.length )
				    lastTouch.time = lola.now();
			    //lastTouch.x = event.touches[0].pageX;
			    lastTouch.y = event.touches[0].pageY;
			    //$content.html( lastTouch.y );
			    event.preventDefault();
			    return false;
		    }

		    function handleTouchStart( event ){
			    $w.removeListener('touchstart', handleTouchStart );
			    $w.addListener('touchmove', handleTouchMove );
			    setLastTouch( event );
		    }

		    function handleTouchMove( event ){
			    var deltaY = event.pageY - lastTouch.y;
			    self.position( self.position() + deltaY );
			    setLastTouch( event );
		    }

		    function handleTouchEnd( event ){
			    $w.removeListener('touchmove', handleTouchMove );
			    $w.addListener('touchstart', handleTouchStart );

		    }

		    initialize();
	    };

    };

    //register module
	lola.agent.registerAgent( new Agent() );

})( lola );

