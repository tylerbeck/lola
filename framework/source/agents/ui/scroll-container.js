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
        var namespace = "scroll-container";

        /**
         * agent's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ['event','data','graphics','geometry'];

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
            var content = document.createElement('div');
            content.className = "scroll-content";
            content.innerHTML = client.innerHTML;
            client.innerHTML = "";
            $client.addListener('contentchanged', handleClientContentChanged, false );
            $client.appendChild( content );
            $client.style('overflow','hidden');

            var track = document.createElement('div');
            var grip = document.createElement('div');
            $(grip).putData({boundsFn:gripBoundingFn},'drag');
            $(grip).assignAgent('drag');
            track.className = "scroll-track";
            grip.className = "scroll-grip draggable";
            $(track).appendChild( grip );
            $client.appendChild( track );
            $client.addListener('mousewheel', handleMouseWheel );
            $(grip).addListener('dragmove', handleGripMove );
            $(window).addListener('resize', handleClientContentChanged, false );
            //handleClientContentChanged();
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

        function gripBoundingFn( t, x, y ){
            //console.log( x, y );
            var $t = $(t);
            var maxY = $($t.parent()).height() - $t.height();

            return {x:0,y:lola.math.normalizeRange(0,y,maxY)}
        }

        function handleClientContentChanged( event ){
            var $client = $(event.currentTarget);
            var $grip =  $client.find('.scroll-grip');
            var $track =  $client.find('.scroll-track');
            var $content = $client.find('.scroll-content');

            if ($grip.length > 0){
                var clh =  $client.height();
                var gh = clh - ($content.height() - clh );
                gh = Math.max(100,Math.min($client.height()-10,gh ));
                console.log('grip:',gh);
                $grip.style( 'height', gh );
            }

        }

        function handleGripMove( event ){
            console.log(event);
            event.preventDefault();
            return false;
        }

        function handleMouseWheel( event ){
            console.log(event);
            event.preventDefault();
            return false;
        }


    };



    //register module
	lola.agent.registerAgent( new Agent() );

})( lola );

