/***********************************************************************
 *    Framework: lola JavaScript Framework
 *       Module: Template
 *  Description: templating engine
 *          Author: Copyright 2011, Tyler Beck
 ***********************************************************************/
(function( lola ) {
	var $ = lola;
	var Module = {
		//==================================================================
		// Attributes
		//==================================================================
		//module namespace
		namespace: 'template',

		//dependencies
		dependencies: [],


		//place-holders
		delimiters: ['${','{'],
		escapedDelimiters: ['\\$\\{','\\}'],
		indexId: "INDEX",

		//templates
		map: {},

		//hooks
		hooks: {},

		//initialization flag
		initialized: false,

		//==================================================================
		// Methods
		//==================================================================
		//------------------------------------------------------------------
		// initialize - module initialization function
		//------------------------------------------------------------------
		initialize: function() {
			if ( !lola.template.initialized ) {
				//console.info('lola.template.initialize');

				//this framework is dependent on lola framework
				if ( !lola ) throw new Error( 'lola not defined!' );


				lola.template.initialized = true;
			}
		},

		//------------------------------------------------------------------
		// addHook - adds replacement value hook
		//------------------------------------------------------------------
		addHook: function( name, fn ) {
			if ( typeof fn === 'function' ) {
				lola.template.hooks[name] = fn;
			}
			else {
				throw new TypeError( 'expected function, got ' + fn );
			}
		},

		//------------------------------------------------------------------
		// load
		//------------------------------------------------------------------
		load: function( node ) {
			var children = node.childNodes;
			if ( children ) {
				for ( var i = 0; i < children.length; i++ ) {
					var child = children[i];
					//check if valid template node
					if ( child.nodeName == 'DIV' ) {
						var id = child['id'].replace( /\-template/g, "" );

						if ( $( child ).hasClass( 'table-content' ) ) {
							//this is a special case (search "table innerHTML" for details)
							//get the contents of the table body
							child = child.getElementsByTagName( 'tbody' )[0];
						}
						var template = lola.template.create( unescape( lola.unencode( child.innerHTML ) ) );
						lola.template.map[ id ] = template;

					}
				}
			}
		},

		//------------------------------------------------------------------
		// break string into template definition
		//------------------------------------------------------------------
		create: function( str ) {
			var ed = lola.template.escapedDelimiters;
			var d = lola.template.delimiters;
			var ind = lola.template.indexId;

			//uncomment scripts
			str = str.replace( /\<\!\-\-SCRIPT/g, "\<script language='javascript' type='text/javascript'\>" );
			str = str.replace( /SCRIPT\-\-\>/g, "\<\/script\>" );

			//remove comments (no comments should be in templates)
			str = str.replace( /\<\!\-\-/g, "" );
			str = str.replace( /\-\-\>/g, "" );

			//get insert points
			var fpatt = new RegExp( "(" + ed[0] + ")" + "([^" + ed[1] + "]+)" + "(" + ed[1] + ")" );
			var spatt = new RegExp( /([^\(]+)\(?([^\)]*)?\)?\|?([a-zA-Z0-9\-_\|]*)/ );
			var olpatt = new RegExp( /[^\[]+\[[^\]]+\],?/g );
			var opatt = new RegExp( /([^\[]+)\[([^\]]+)\],?/ );
			var index = str.search( fpatt );
			var builder = [];
			while ( index >= 0 ) {
				var result = str.match( fpatt );
				var tag = result[2];
				var parts = tag.match( spatt );
				var opts = false;
				if ( parts[2] && parts[2] != "" ) {
					var list = parts[2].match( olpatt );
					if ( list ) {
						opts = {};
						for ( var i = 0; i < list.length; i++ ) {
							var oparts = list[i].match( opatt );
							opts[oparts[1]] = oparts[2];
						}
					}
				}
				var hooks = false;
				if ( parts[3] && parts[3] != "" ) {
					hooks = parts[3].split( "|" );
				}
				builder.push( str.substring( 0, index ) );
				builder.push( {index:index, property:"" + parts[1], options:opts, hooks:hooks} );
				str = str.substring( index + result[0].length );

				//get next insertion index
				index = str.search( fpatt );
			}
			builder.push( str );

			return builder;
		},

		//------------------------------------------------------------------
		// applyHooks - applies insert's hooks on value
		//------------------------------------------------------------------
		applyHooks: function( value, obj, index ) {

			for ( var key in obj.hooks ) {
				var fn = lola.page.hooks[ obj.hooks[key] ];
				if ( fn )
					value = fn( value, obj, index );
			}

			return value;
		},

		//------------------------------------------------------------------
		// apply - recursively applies data to template;
		//		   returns string
		//------------------------------------------------------------------
		apply: function( name, data, ordinal ) {
			if ( ordinal == null )
				ordinal = 0;

			if ( lola.template.map[ name ] != null ) {
				return lola.template.process( lola.template.map[ name ], data, ordinal );
			}
			else throw new Error( "Unknown template: " + name );

		},

		//------------------------------------------------------------------
		// process - recursively applies data to template
		//		   string; returns string
		//------------------------------------------------------------------
		process: function( builder, data, index ) {
			if ( index == null )
				index = 0;

			var built = [];

			if ( builder.length > 0 ) {
				for ( var part in builder ) {
					if ( !lola( builder[part] ).isString() ) {
						//get part
						var obj = builder[part];

						//get data value
						var value = (obj.property == lola.template.indexId) ? index : data[obj.property];
						if ( obj.hooks )
							value = lola.template.applyHooks( value, obj, index );
						if ( value == null ) value = "";

						var subtmp;

						//get replacement value
						switch ( $( value ).getType() ) {
							case 'number':
							case 'string':
							case 'boolean':
								if ( insert.options == null ) {
									built.push( value );
								}
								else {
									var enumVal = insert.options[ value ];
									if ( enumVal == null )
										enumVal = insert.options['DEFAULT'];
									if ( enumVal == null )
										enumVal = "";
									built.push( enumVal );
								}
								break;

							case 'object':
								subtmp = insert.options['TEMPLATE'];
								if ( subtmp )
									built.push( lola.template.apply( subtmp, value ) );
								break;

							case 'array':
								subtmp = insert.options['TEMPLATE'];
								if ( subtmp ) {
									if ( value.length > 0 ) {
										var n = 0;
										do {
											built.push( lola.template.apply( subtmp, value[n], n ) );
											n++;
										}
										while ( n < list.length );
									}
								}
								break;

							default:
								break;
						}
					}
					else {
						built.push( args );
					}

				}
			}

			return built.join();
		},

		//==================================================================
		// Selection Methods
		//==================================================================
		SelectionPrototype: {
			applyTemplate: function( name, data ){
				html = lola.template.apply( name, data );
				this.html( html );
			}
		}

	};

	lola.registerModule( Module );
})( lola );

