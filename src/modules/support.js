/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Support
 *  Description: support module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "support",

		//module dependencies
		dependencies: [],

		//initialization flag
		initialized: false,

		// can script text nodes be appended to script nodes
		domEval: false,

		// can delete expando properties (set later)
		deleteExpando: true,

		// event model
		domEvent: false,

		// event model
		msEvent: false,

		//browser animation frame timing
		browserAnimationFrame: false,

		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.support.initialized ) {
				//console.info( 'lola.support.initialize' );

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				lola.support.initialized = true;
			}
		}
	};


	//DOM script eval support
	var root = document.documentElement;
	var script = document.createElement( 'script' );
	var uid = "scriptCheck" + (new Date).getTime();
	script.type = "text/javascript";
	try {
		script.appendChild( document.createTextNode( 'window.' + uid + '=true;' ) );
	}
	catch( e ) {
	}

	root.insertBefore( script, root.firstChild );
	root.removeChild( script );

	if ( window[ uid ] ) {
		Module.domEval = true;
		delete window[ uid ];
	}

	//create test div and test helpers for support tests
	var div = document.createElement( 'div' );
	var html = function( val ) {
		div.innerHTML = val;
	};


	html( "<div style='color:black;opacity:.25;float:left;background-color:rgba(255,0,0,0.5);' test='true'>test</div>" );
	var target = div.firstChild;
	var support = {

		//IE returns style object
		style: (typeof target.getAttribute( 'style' ) === 'string'),

		//account for web-kit locale bug
		// this is supported in modern browsers no need to test
		//opacity: /^0[\.,]25$/.test( target.style.opacity ),

		//float is reserved check whether to user cssFloat or styleFloat
		cssFloat: /^left$/.test( target.style.cssFloat ),

		//check color alpha channel support
		colorAlpha: /^rgba.*/.test( target.style.backgroundColor )

	};

	lola.extend( Module, support, true );

	//check for deletion of expando properties
	try {
		delete target.test;
	}
	catch( e ) {
		Module.deleteExpando = false;
	}

	//Event Model
	if ( document.addEventListener )
		Module.domEvent = true;
	else if ( document.attachEvent )
		Module.msEvent = true;


	lola.registerModule( Module );
})( lola );

