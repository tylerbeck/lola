/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Agent: Test Page Agent
 *  Description:
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
    var $ = lola;
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
        var namespace = "page";

        /**
         * agent's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [];

        /**
         * agent's client
         * @private
         * @type {Object}
         */
        var client = null;

        /**
         * selected output div
         */
        var $output;

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
         * @param {*} cl
         */
        this.sign = function( cl ) {
            var $client = $(cl);
            $client.identify();
            if ( client == null) {

                //not signed yet
                client = cl;
                $client.putData( {}, namespace );

                //add listeners & do setup
                setup();
            }
        };

        /**
         * drops a client
         * @param {*} cl
         */
        this.drop = function( cl ) {
            var $client = $(client);
            if (client == cl ) {
                $client.removeData( namespace );

                //remove listeners & do teardown

                //remove client
                client = null;
            }
        };

        function setup(){
            //set output div
            $output = $('#output');
            if ($output.length == 0)
                $output = $('body');

            //set output function
            lola.test.setLogFn( log );
            lola.test.setErrorFn( error );

            //start tests
            lola.test.start();
        }

        function log(){
            //output( 'info', [].splice.call(arguments,0).join(' ') );
        }

        function error(){
            output( 'error', [].splice.call(arguments,0).join(' ') );
        }

        function output( className, msg ){
            var div = document.createElement('div');
            msg = msg.replace(/[\n\r]/g, "<br/>" );

            $(div).addClass( className ).html( msg );
            $output.appendChild( div );
        }

        /**
         * agent initializer
         */
        this.initialize = function(){
            lola("body").assignAgent( namespace );
        };

    };

	//register module
	lola.agent.registerAgent( new Agent() );

})( lola );

