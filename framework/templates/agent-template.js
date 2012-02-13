/***********************************************************************
 * Lola JavaScript Framework Agent
 *
 *       Agent: $name
 *  Description: $description
 *       Author: Copyright ${YEAR}, ${USER}
 *
 ***********************************************************************/
#set( $client = "$client" )
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
        var namespace = "$namespace";

        /**
         * agent's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [$dependencies];

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

                //setup client
                clients[ client.id ] = client;
                $client.putData( {}, namespace );

                //add listeners

            }
        };

        /**
         * drops a client
         * @param {*} client
         */
        this.drop = function( client ) {
            if (clients[ client.id ] ) {
                var $client = $(client);
                var data = $client.getData( namespace );
                //remove listeners

                //teardown client
                $client.removeData( namespace );
                delete clients[ client.id ];
            }
        };

        /**
         * checks if client exists
         * @param {*} client
         * @return {Boolean}
         */
        this.clientExists = function( client ){
            return ( client.id && clients[ client.id ] );
        };

        /**
         * agent initializer
         */
        this.initialize = function(){
            lola("$UIselector").assignAgent( namespace );
        };

    };

	//register module
	lola.agent.registerAgent( new Agent() );

})( lola );

