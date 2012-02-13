/***********************************************************************
 * Lola JavaScript Framework Module
 *
 *       Module: $name
 *  Description: $description
 *       Author: Copyright ${YEAR}, ${USER}
 *
 ***********************************************************************/
(function( lola ) {
    /**
     * MODULE Module
     * @namespace lola.MODULE
     */
	var Module = function(){
        var self = this;

		//==================================================================
		// Attributes
		//==================================================================

        /**
         * module's namespace
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
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		this.preinitialize = function() {
			lola.debug('lola.MODULE::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module preinitialization



			//remove initialization method
			delete lola.MODULE.preinitialize;
		};

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		this.initialize = function() {
			lola.debug('lola.MODULE::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization



			//remove initialization method
			delete lola.MODULE.initialize;
		};

        //==================================================================
        // Selection Methods
        //==================================================================
        /**
         * module's selector methods
         * @type {Object}
         */
        this.selectorMethods = {


        };


        //==================================================================
		// Classes
		//==================================================================



	};

	//register module
	lola.registerModule( new Module() );

})( lola );

