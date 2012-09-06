/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Support
 *  Description: Support module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	/**
	 * Support Module
	 * @namespace lola.array
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
        var namespace = "support";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = [];

        //set locally
        this.domEval = false;
        this['style'] = false;
        this.cssFloat = false;
        this.colorAlpha = false;
        this.deleteExpando = true;
        this.msEvent = false;
        this.domEvent = true;
        this.dataset = false;
        this.canvas = false;
        this.animationFrameType = 0;
        this.cssRules = false;


        //==================================================================
        // Getters
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
        this.initialize = function(){
            $.debug( 'lola.support::initialize' );
            self.cssRules = ( (document.styleSheets.length > 0 && document.styleSheets[0].cssRules) || document.createStyleSheet == undefined  ) ? true : false;
        };

        //==================================================================
        // Run Checks
        //==================================================================

        //domEval
        var root = document.documentElement;
        var script = document.createElement( 'script' );
        var uid = "scriptCheck" + (new Date).getTime();
        script.type = "text/javascript";
        try {
            script.appendChild( document.createTextNode( 'lola.window.' + uid + '=true;' ) );
        }
        catch( e ){}

        root.insertBefore( script, root.firstChild );
        root.removeChild( script );

        self.domEval = $.window[ uid ];
        try {
            delete $.window[ uid ];
        }
        catch(e){
            $.window[ uid ] = null;
        }

        //create div for testing
        var div = document.createElement( 'div' );
        div.innerHTML = "<div style='color:black;opacity:.25;float:left;background-color:rgba(255,0,0,0.5);' test='true' data-test='yes' >test</div>";
        var target = div.firstChild;

        //style tests
        self['style'] = (typeof target.getAttribute( 'style' ) === 'string');
        self.cssFloat = /^left$/.test( target.style.cssFloat );
        self.colorAlpha = /^rgba.*/.test( target.style.backgroundColor );

        //delete expandos
        try {
            delete target.test;
        }
        catch( e ) {
            self.deleteExpando = false;
        }

        //dataset support
        if ( div.hasOwnProperty && div.hasOwnProperty('dataset') && div.dataset['test'] == 'yes'){
            self.dataset = true;
        }

        //event model
        if ( document.addEventListener )
            self.domEvent = true;
        else if ( document.attachEvent )
            self.msEvent = true;

        //animation frame type
        if ( window.requestAnimationFrame )
            self.animationFrameType = 1;
        else if ( window.mozRequestAnimationFrame )
            self.animationFrameType = 2;
        else if ( window.webkitRequestAnimationFrame )
            self.animationFrameType = 3;
        else if ( window.oRequestAnimationFrame )
            self.animationFrameType = 4;

        //canvas
        var canvas = document.createElement('canvas');
        self.canvas = /canvas/.test( Object.prototype.toString.call(canvas).toLowerCase() );



    };

    //register module
    lola.registerModule( new Module() );

})( lola );

