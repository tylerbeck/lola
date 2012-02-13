/***********************************************************************
 * Lola JavaScript Framework Command
 *
 *      Command: test3
 *  Description: test3
 *       Author: Copyright 2012, tbeck
 *
 ***********************************************************************/
(function (lola) {
    var Command = function () {
        var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * command's name
         * @type {String}
         * @private
         */
        var name = "test3";

        //==================================================================
        // Getters / Setters
        //==================================================================
        /**
         * gets command name
         */
        this.getName = function () {
            return name;
        };


        //==================================================================
        // Methods
        //==================================================================
        /**
         * executes Command
         * @param {Object} params
         */
        this.execute = function (params) {
            //execute command logic
            setTimeout( function(){ status('test3: executing');}, 1);
            setTimeout( function(){ status('test3: getting param a');}, 500 );
            setTimeout( function(){ status('test3: getting param b');}, 1000 );
            setTimeout( function(){ status('test3: dividing params');}, 1500 );
            setTimeout( function(){ result(params.a/params.b);}, 2000);

        };

        /**
         * trigger status event
         * @param msg
         */
        function status(msg) {

            lola.event.trigger(self, 'status', false, false, msg);
        }

        /**
         * trigger result event
         * @param data
         */
        function result(data) {

            lola.event.trigger(self, 'result', false, false, data);
        }

        /**
         * trigger fault event from command
         * @param fault
         */
        function fault(fault) {

            lola.event.trigger(self, 'fault', false, false, fault);
        }


        //==================================================================
        // Initialization
        //==================================================================

        return this;

    };

    lola.cmd.register(Command);
})(lola);
