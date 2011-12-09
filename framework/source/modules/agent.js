(function( lola ) {
	var $ = lola;
	/**
	 * @description Ag Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var agent = {

		//==================================================================
		// Attributes
		//==================================================================
		/**
		 * @description registration index
		 * @private
		 */
		index: 0,

		/**
		 * @description registration map
		 * @private
		 */
		map: {},

		/**
		 * @description initializers
		 * @private
		 */
		initializers: [],

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug('lola.agent::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization
			lola.safeDeleteHooks.push( {scope:this, fn:this.drop} );


			//remove initialization method
			delete lola.agent.preinitialize;
		},

		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.agent::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

            //execute agent initialization stack
            var stackSize = lola.agent.initializers.length;

            for ( i = 0; i < stackSize; i++ ) {
                var initializer = lola.agent.initializers[i];
                if (typeof initializer == "function"){
                    initializer();
                }

                delete lola.agent.initializers[i];
            }


			//remove initialization method
			delete lola.agent.initialize;
		},

		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "agent";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return ['event','data'];
		},


		/**
		 * @description used to register an agent with the framework
		 * @param {Object} agent object that implements the agent interface
		 */
		register: function( agent ) {
            var name = agent.getName();
			console.info('register agent: '+name);
			if (name && agent.sign && agent.drop) {
				//setup namespace
				var pkg = lola.getPkgChain( lola.agent, name );

				//copy module methods and attributes
				lola.extend( pkg, agent, true );

				//map agent
				this.map[ name ] = pkg;

				//add initializer
				if ( agent.initialize && typeof agent.initialize === "function" ) {
					lola.agent.initializers.push( function() {
						agent.initialize();
					} );
				}

				//run preinitialization method if available
				if ( agent.preinitialize && typeof agent.preinitialize === "function" ) {
					agent.preinitialize();
				}

			}
			else {
				console.error( 'invalid agent implementation: '+name );
			}

		},

		/**
		 * @description assign a client to an agent
		 * @param {Object} client
		 * @param {String} name name of registered agent
		 */
		assign: function( client, name ) {
			var agent = lola.agent.map[ name ];
			if (agent){
				agent.sign( client );
			}
			else {
				throw new Error("unknown agent: "+name);
			}
		},

		/**
		 * @description drop a client from an agent
		 * @param {Object} client
		 * @param {String} name name of registered agent
		 */
		drop: function( client, name ) {
			var agents = {};
			if (name == !undefined){
				agents = lola.agent.map;
			}
			else if (typeof name == 'string'){
				name.split(',').forEach( function(item){
					agents[ item ] = lola.agent.map[ item ];
				});
			}

			for (var i in agents){
				var agent = agents[i];
				if (agent){
					agent.drop( client );
				}
			}
		},


		//==================================================================
		// Classes
		//==================================================================



		//==================================================================
		// Selection Methods
		//==================================================================
		/**
		 * @description get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * @description module's selector methods
			 * @type {Object}
			 */
			var methods = {

				/**
				 * @description assigns an agent to selector elements
				 * @param {String} agentName name of registered agent
				 */
				assignAgent: function( agentName ) {
					this.foreach( function(item){
						lola.agent.assign( item, agentName );
					});
					return this;
				},

				/**
				 * @description drops client from agent
				 * @param {String} agentName name of registered agent
				 */
				dropAgent: function( agentName ) {
					this.foreach( function(item){
						lola.agent.drop( item, agentName );
					})
				}

			};

			return methods;

		}
	};

	//==================================================================
	// Class Prototypes
	//==================================================================




	//register module
	lola.registerModule( agent );

})( lola );

