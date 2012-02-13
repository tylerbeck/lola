/***********************************************************************
 * Lola JavaScript Framework Command
 *
 *      Command: $name
 *  Description: $description
 *       Author: Copyright ${YEAR}, ${USER}
 *
 ***********************************************************************/
(function( lola ) {
    var Command = function(){
    	var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * command's name
         * @type {String}
         * @private
         */
        var name = "$name";
        
        //==================================================================
		// Getters / Setters
		//==================================================================
		/**
		 * gets command name
		 */
		this.getName = function(){
			return name;
		};
		
        
        //==================================================================
		// Methods
		//==================================================================
		/**
		 * executes Command
		 * @param {Object} params
		 */
		this.execute = function( params ){
			//execute command logic
		};
		
        /**
         * trigger status event
         * @param msg
         */
        function status( msg ) {
        
            lola.event.trigger( self, 'status', false, false, msg );
        }

        /**
         * trigger result event
         * @param data
         */
        function result( data ) {

            lola.event.trigger( self, 'result', false, false, data );
        }

        /**
         * trigger fault event from command
         * @param fault
         */
        function fault( fault ) {

            lola.event.trigger( self, 'fault', false, false, fault );
        }


		
        //==================================================================
		// Initialization
		//==================================================================
		
		return this;
		
    };
    
    lola.command.register( Command );
})(lola);
