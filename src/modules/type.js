/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Type
 *  Description: type module
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {

		//==================================================================
		// Attributes
		//==================================================================
		//module registration namespace
		namespace: "type",

		//module dependencies
		dependencies: ['array'],

		//initialization flag
		initialized: false,

		//raw lists
		objTypes: "String Number Date Array Boolean RegExp Function Object",
		tagTypes: "a abbr acronym address applet area b base basefont bdo big blockquote body br button caption center cite code col colgroup dd del dfn dir div dl dt em fieldset font form frame frameset head h1 h2 h3 h4 h5 h6 hr html i iframe img input ins kbd label legend li link map menu meta noframes noscript ol optgroup option p param pre q s samp script select small span strike strong style sub sup table tbody td textarea tfoot th thead title tr tt u ul var",
		specialTagTypes:"object",
		//map of toString types -> element type
		map: {},

		//regex expressions
		rIsNumber: /^-?\d*(?:\.\d+)?$/,
		rIsDimension: /^(-?\d*(?:\.\d+)?)(%|in|cm|mm|em|ex|pt|pc|px)$/,
		rIsColor: /^(#|rgb|rgba|hsl|hsla)(.*)$/,
		rIsHexColor: /^#([A-F0-9]{3,6})$/,
		rIsRGBColor: /^rgba?\(([^\)]+)\)$/,
		rIsHSLColor: /^hsla?\(([^\)]+)\)$/,


		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.type.initialized ) {
				//console.info('lola.'+this.namespace+'.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );

				lola.type.createMap();

				lola.type.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// creates map of object and element types
		//------------------------------------------------------------------
		createMap: function() {
			//console.info( "Type Module: createMap" );
			lola.foreach( lola.type.tagTypes.split( " " ), lola.type.mapTag );
			lola.foreach( lola.type.specialTagTypes.split( " " ), lola.type.mapSpecialTag );
			lola.foreach( lola.type.objTypes.split( " " ), lola.type.mapObject );
			var tn = document.createTextNode( 'test' );
			var cn = document.createComment( 'test' );
			var tntype = lola.toString.call( tn );
			var cntype = lola.toString.call( cn );
			lola.type.map[ tntype ] = 'textnode';
			lola.type.map[ cntype ] = 'commentnode';
			//TODO: add isTextNode and isCommentNode selector functions
		},

		//------------------------------------------------------------------
		// maps tag type
		//------------------------------------------------------------------
		mapTag: function( item, index ) {
			var tag = document.createElement( item );
			var type = lola.toString.call( tag );
			var name = type.replace( /\[object HTML/g, "" ).replace( /Element\]/g, "" );
			name = name == "" ? "Element" : name;
			lola.type.map[ type ] = name.toLowerCase();
			var isfn = "Selector.prototype['is" + name + "'] = " +
					"function(index){ return this.isType('" + name.toLowerCase() + "',index); };";
			lola.evaluate( isfn );
		},

		//------------------------------------------------------------------
		// maps special tag type
		//------------------------------------------------------------------
		mapSpecialTag: function( item, index ) {
			var tag = document.createElement( item );
			var type = lola.toString.call( tag );
			var name = type.replace( /\[object /g, "" ).replace( /Element\]/g, "" ); // keep HTML
			name = name == "" ? "Element" : name;
			lola.type.map[ type ] = name.toLowerCase();
			var isfn = "Selector.prototype['is" + name + "'] = " +
					"function(index){ return this.isType('" + name.toLowerCase() + "',index); };";
			lola.evaluate( isfn );
		},

		//------------------------------------------------------------------
		// maps object type
		//------------------------------------------------------------------
		mapObject: function( item, index ) {
			var type = "[object " + item + "]";
			lola.type.map[ type ] = item.toLowerCase();
			var isfn = "Selector.prototype['is" + item + "'] = " +
					"function(index){ return this.isType('" + item.toLowerCase() + "',index); };";
			lola.evaluate( isfn );
		},

		//------------------------------------------------------------------
		// get - returns type string
		//------------------------------------------------------------------
		get: function( object ) {
			if ( object ) {
				var type = lola.type.map[ lola.toString.call( object ) ];
				if ( type )
					return type;
				return 'other ';
			}
			return 'null'
		},

		//------------------------------------------------------------------
		// list - outputs map str
		//------------------------------------------------------------------
		list: function() {
			var html = "";
			for ( var k in lola.type.map ) {
				html += "<div class='type'><span class='label'>" + k + "</span><span class='value'>" + lola.type.map[k] + "</span></div>";
			}
			return html;
		},


		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {
			//gets type of specified index
			getType: function( index ) {
				return String( lola.type.get( this.get( index ) ) );
			},

			//checks if specified index is of type
			isType: function( type, index ) {
				return lola.type.is( this.get( index ), type );
			}

			//NOTE: all isType functions are dynamically generated

		}

	};


	lola.registerModule( Module );
})( lola );
