/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Command
 *  Description: Command module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
    /**
     * Command Module
     * @namespace lola.cmd
     */
    var Module = function(){
	    var $ = lola;
	    var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "cmd";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [];

        /**
         * registry of commands
         * @private
         */
        var registry = {};

        /**
         * holds calls to unloaded commands
         * @private
         */
        var callLater = {};


        //==================================================================
        // Getters & Setters
        //==================================================================
        /**
         * get module's namespace
         * @return {String}
         */
        this.namespace = function() {
            return namespace;
        };

        /**
         * get module's dependencies
         * @return {Array}
         */
        this.dependencies = function() {
            return dependencies;
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * registers command with the module
         * @param {Class|String} cmd the command class or url of the class' js file
         * @param {String} name the name with which to register the command
         */
        this.register = function( cmd, name ) {
            if ( typeof cmd != "string" && name == undefined  ){
                var tmp = new cmd();
                name = tmp.getName();
            }

            $.debug('register command: '+name);
            if ( registry[name] != null && typeof registry[name] != "string" )
                console.warn( 'command "'+name+'" has already been registered... overwriting' );

            //register command class or url
            registry[name] = cmd;

            $.event.addListener( self, name, executeCommand  );
        };

        this.call = function( name, params, onResult, onFault, onStatus ){
            var responder = new self.Responder( onResult, onFault, onStatus );
            self.execute( name, params, responder );
        };

        /**
         * executes a registered command
         * @param {String} name registered command name
         * @param {Object} params parameter object to be passed to command
         * @param {lola.cmd.Responder} responder responder object to handle command events
         */
        this.execute = function( name, params, responder ){
            if (registry[name]) {
                if ( typeof registry[name] == "string" ) {
                    //add execution params to call later queue for the unloaded command
                    if ( !callLater[ name ] ){
                        //try to load command
                        $.loadScript( registry[name], function(e){
                            if ( $.hasFn( registry, name ) ) {
                                //command successfully loaded - iterate through queued calls
                                var s = callLater[ name ].length;
                                for (var i = 0; i < s; i++){
                                    var o = callLater[ name ][i];
                                    self.execute( o.name, o.params, o.responder );
                                }
                                delete callLater[ name ];
                            }
                            else {
                                throw new Error('The command loaded from "'+registry[name]+'" is not named "'+name+'"');
                            }
                        });
                        callLater[ name ] = [];
                    }

                    var cmdObj = {name:name, params:params, responder:responder};
                    callLater[ name ].push( cmdObj );
                }
                else {
                    //try to execute command
                    var cmdClass = registry[ name ];
                    if (cmdClass) {
                        var cmd = new cmdClass();
                        if (responder) {
                            $.event.addListener( cmd, 'result', responder.handleResult );
                            $.event.addListener( cmd, 'fault', responder.handleFault );
                            $.event.addListener( cmd, 'status', responder.handleStatus );
                        }
                        cmd.execute( params );
                    }
                }
            }
            else {
                throw new Error('Unknown command type: '+name);
            }
            return responder;
        };

        /**
         * handles executing commands triggered via event model
         * @private
         * @param event
         */
        function executeCommand( event ){
            self.execute( event.type, event.data.parameters, event.data.responder );
        }

        //==================================================================
        // Classes
        //==================================================================
        /**
         * Responder class handles command events
         * @class
         * @param {Function} resultHandler
         * @param {Function} faultHandler
         * @param {Function} statusHandler
         */
        this.Responder = function( resultHandler, faultHandler, statusHandler ){

            /**
             * last response event
             * @private
             */
            var lastResponse = undefined;

            /**
             * get last response
             * @return {Object|undefined}
             */
            this.getLastResponse = function(){
                return lastResponse;
            };

            /**
             * handle status events from command
             * @private
             * @param {Object} event
             */
            this.handleStatus = function( event ){
                if (!lastResponse || lastResponse.type == 'status' )
                    lastResponse = event;
                if (typeof statusHandler == 'function')
                    statusHandler.apply( $.window, [event] );
            };

            /**
             * handle result events from command
             * @private
             * @param {Object} event
             */
            this.handleResult = function( event ){
                lastResponse = event;
                if (typeof resultHandler == 'function')
                    resultHandler.apply($.window, [event] );
            };

            /**
             * handle fault events from command
             * @private
             * @param {Object} event
             */
            this.handleFault = function( event ){
                lastResponse = event;
                if (typeof faultHandler == 'function')
                    faultHandler.apply($.window, [event] );
            };

            return this;

        };

        /**
         * Data object for executing commands via event model
         * @param {Object} parameters parameter object
         * @param {lola.cmd.Responder} responder responder object
         */
        this.Data = function( parameters, responder ){
            this.parameters =function (){
                return parameters;
            };
            this.responder =function (){
                return responder;
            };
        };
    };

	//register module
	lola.registerModule( new Module() );

})( lola );
