/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Support
 *  Description: Support module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	/**
	 * Support Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var Support = function(){

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

        /**
         * @private
         */
        var _domEval = false;

        /**
         * @private
         */
        var _style = false;

        /**
         * @private
         */
        var _cssFloat = false;

        /**
         * @private
         */
        var _colorAlpha = false;

        /**
         * @private
         */
        var _deleteExpando = true;

        /**
         * @private
         */
        var _msEvent = false;

        /**
         * @private
         */
        var _domEvent = true;

        /**
         * @private
         */
        var _animationFrameType = 0;


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

        /**
         * DOM eval support getter
         */
        this.domEval = function(){
            return _domEval;
        };

        /**
         * style support getter
         */
        this.style = function(){
            return _style;
        };

        /**
         * cssFloat support getter
         */
        this.cssFloat = function(){
            return _cssFloat;
        };

        /**
         * msEvent support getter
         */
        this.msEvent = function(){
            return _msEvent;
        };

        /**
         * domEvent support getter
         */
        this.domEvent = function(){
            return _domEvent;
        };

        /**
         * deleteExpando support getter
         */
        this.deleteExpando = function(){
            return _deleteExpando;
        };

        /**
         * anaimationFrame type getter
         */
        this.animationFrameType = function(){
            return _animationFrameType;
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

        _domEval = lola.window[ uid ];
        delete lola.window[ uid ];

        //create div for testing
        var div = document.createElement( 'div' );
        div.innerHTML = "<div style='color:black;opacity:.25;float:left;background-color:rgba(255,0,0,0.5);' test='true' >test</div>";
        var target = div.firstChild;

        //style tests
        _style = (typeof target.getAttribute( 'style' ) === 'string');
        _cssFloat = /^left$/.test( target.style.cssFloat );
        _colorAlpha = /^rgba.*/.test( target.style.backgroundColor );

        //delete expandos
        try {
            delete target.test;
        }
        catch( e ) {
            _deleteExpando = false;
        }

        //event model
        if ( document.addEventListener )
            this._domEvent = true;
        else if ( document.attachEvent )
            this._msEvent = true;

        //animation frame type
        if ( window.requestAnimationFrame )
            lola.tween.getFrameType = 1;
        else if ( window.mozRequestAnimationFrame )
            lola.tween.getFrameType = 2;
        else if ( window.webkitRequestAnimationFrame )
            lola.tween.getFrameType = 3;
        else if ( window.oRequestAnimationFrame )
            lola.tween.getFrameType = 4;


    };

    //register module
    lola.registerModule( new Support() );

})( lola );

