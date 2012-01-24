/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Agent: AGENT
 *  Description:
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
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
        var namespace = "AGENT";

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

                //add listeners

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

                //remove listeners

                //remove client
                client = null;
            }
        };

        /**
         * agent initializer
         */
        this.initialize = function(){
            //lola(".AGENT").assignAgent( namespace );
        };

    };

	//register module
	lola.agent.registerAgent( new Agent() );

})( lola );

