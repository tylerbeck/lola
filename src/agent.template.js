/***********************************************************************
 *       Agent:
 *  Description:
 *       Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;

	var Agent = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		name: "template",

		//==================================================================
		// Methods
		//==================================================================

		//------------------------------------------------------------------
		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize
		//------------------------------------------------------------------
		initialize: function() {
			//add initialization code
		},

		//------------------------------------------------------------------
		// setup
		//------------------------------------------------------------------
		setup: function() {
			//add setup code
		},

		//------------------------------------------------------------------
		// sign
		//------------------------------------------------------------------
		sign: function( client ) {
			var agent = lola.agent.template;
			var $client = $(client);
			if (agent.clients[ client.id ] == null) {
				//not a client yet
				agent.clients[ client.id ] = client;
				var data = {};
				$client.putData( data, agent.name );
				//add listeners

			}
		},

		//------------------------------------------------------------------
		// drop
		//------------------------------------------------------------------
		drop: function( client ) {
			var agent = lola.agent.template;
			var $client = $(client);
			var data = $client.getData( agent.name, true );
			if (agent.clients[ client.id ] ) {
				$client.removeData( agent.name );
				//remove listeners

				delete agent.clients[ client.id ];
			}
		}




	};
	lola.agent.register( Agent );
})( lola );
