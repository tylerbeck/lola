(function( lola ) {
	var $ = lola;
	/**
	 * AGENT Agent
	 * @implements {lola.Module}
	 * @memberof lola.agent
	 */
	var AGENT = {

		//==================================================================
		// Attributes
		//==================================================================
        /**
         * map of agent's clients
         * @private
         * @type {Object}
         */
        clients: {},


		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug('lola.agent.AGENT::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do agent preinitialization



			//remove initialization method
			delete lola.agent.AGENT.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.agent.AGENT::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do agent initialization



			//remove initialization method
			delete lola.agent.AGENT.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "AGENT";
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
         * signs a client
         * @param {*} client
         */
        sign: function( client ) {
            var $client = $(client);
            $client.identify();
            if (this.clients[ client.id ] == null) {

                //not a client yet
                this.clients[ client.id ] = client;
                var data = {};
                $client.putData( data, this.getNamespace() );

                //add listeners

            }
        },

        /**
         * drops a client
         * @param {*} client
         */
        drop: function( client ) {
            var $client = $(client);
            if (this.clients[ client.id ] ) {
                $client.removeData( this.getNamespace() );

                //remove listeners

                delete this.clients[ client.id ];
            }
        }



	};

	//register module
	lola.agent.registerAgent( AGENT );

})( lola );

