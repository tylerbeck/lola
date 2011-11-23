(function( lola ) {
	var $ = lola;
	/**
	 * @description DOM Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var dom = {

		//==================================================================
		// Attributes
		//==================================================================

		/**
		 * @description map of attribute getter/setter hooks
		 * @private
		 * @type {Array}
		 */
		attributeHooks: {},

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * @description initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.dom::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization

			//remove initialization method
			delete lola.dom.initialize;


		},
		/**
		 * @description get module's namespace
		 * @public
		 * @return {String}
		 * @default dom
		 */
		getNamespace: function() {
			return "dom";
		},

		/**
		 * @description get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},


		/**
		 * @description sets or gets an node attribute
		 * @param {Object} object the object on which to access the attribute
		 * @param {String} name the name of the attribute
		 * @param {*} value (optional) value to set
		 */
		attr: function( object, name, value ) {
			if ( this.attributeHooks[name] ) {
				return this.attributeHooks[name].apply( object, arguments );
			}
			else {
				if ( value || value == "") {   //set value
					//TODO: Replace this type check with isPrimitive after implementing lola.type
					if (typeof value == "string" || typeof value == "number" || typeof value == "boolean") {
						return object[name] = value;
					}
					else {
						throw new Error('attribute values must be primitives');
					}
				}
				else {
					return object[name];
				}
			}
		},

		/**
		 * @description deletes expando properties
		 * @param {Object} object
		 * @param {String} name
		 */
		deleteExpando: function( object, name ) {
			if ( lola.support.deleteExpando )
				delete object[name];
			else
				object[name] = null;
		},

		//------------------------------------------------------------------
		// isDescendant - determines if a is descendant of b
		//------------------------------------------------------------------
		/**
		 * @description determines if element a is descendant of element b
		 * @param {Node} a
		 * @param {Node} b
		 */
		isDescendant: function ( a, b ) {
			return lola.dom.isAncestor( b, a );
		},

		/**
		 * @description determines if element a is an ancestor of element b
		 * @param {Node} a
		 * @param {Node} b
		 */
		isAncestor: function ( a, b ) {
			var ancestor = b;
			while ( ancestor && (ancestor = ancestor.parentNode) && ancestor.nodeName != "BODY" ) {
				if (a == ancestor) return true;
			}
			return false;
		},



		//==================================================================
		// Selector Methods
		//==================================================================
		/**
		 * @description get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * @description module's selector methods
			 * @type {Object}
			 */
			var methods = {

				/**
				 * @description  gets sub selection
				 * @return {lola.Selector}
				 */
				find: function( selector ) {
					var $instance = $([]);
					this.forEach( function(item){
						var $tmp = $(selector, item);
						$instance.concat( $tmp );
					});

					return $instance;
				},

				/**
				 * @description  generation selection
				 * @return {lola.Selector}
				 */
				generation: function( count ) {
					if (!count)
						count = 1;

					var $instance = $([]);
					this.forEach( function(item){
						var ancestor = item;
						var index = 0;
						while( ancestor = ancestor.parentNode && index < count ){
							index++;
						}
						if (ancestor)
							$instance.concat( [ancestor] );
					});

					return $instance;
				},

				/**
				 * @description  sets or gets html on elements
				 * @return {lola.Selector|Array}
				 */
				html: function( content ) {
					if ( arguments.length == 0 ) {
						var values = [];
						this.forEach( function( item ) {
							values.push( (item) ? item.innerHTML : null );
						} );
						return values;
					}
					else {
						this.forEach( function( item ) {
							for ( var child in item.childNodes ) {
								lola.safeDelete( child );
							}
							switch ( lola.type.get( content ) ) {
								case 'null':
								case 'undefined':
									item.innerHTML = "";
									break;
								case 'string':
									item.innerHTML = content;
									break;
								case 'array':
									item.innerHTML = "";
									for ( var c in content ) {
										item.appendChild( c );
									}
									break;
								default:
									console.info( item );
									console.info( content );
									item.innerHTML = "";
									item.appendChild( content );
									break;
							}
						} );
						return this;
					}
				},

				/**
				 * @description  appends node to first selection element in DOM
				 * @param {Element} node
				 * @return {lola.Selector}
				 */
				appendChild: function( node ) {
					if ( this.elements.length > 0 ) {
						this.get().appendChild( node );
					}

					return this;
				},

				/**
				 * @description  prepends node to first selection element in DOM
				 * @param {Element} node
				 * @return {lola.Selector}
				 */
				prependChild: function( node ) {
					if ( this.elements.length > 0 ) {
						this.get().insertBefore( node, this.get().firstChild );
					}

					return this;
				},

				/**
				 * @description  clones first selection element
				 * @param {Boolean} deep
				 * @return {Element}
				 */
				cloneNode: function( deep ) {
					if ( this.elements.length > 0 ) {
						return this.get().cloneNode( deep );
					}
					return null;
				},

				/**
				 * @description  inserts node before first element in DOM
				 * @param {Element} node
				 * @return {lola.Selector}
				 */
				insertBefore: function( node ) {
					if ( this.elements.length > 0 ) {
						this.get().insertBefore( node );
					}
					return this;
				},

				/**
				 * @description  removes node from first element in DOM
				 * @param {Element} node
				 * @return {lola.Selector}
				 */
				removeChild: function( node ) {
					if ( this.elements.length > 0 ) {
						lola.safeDelete( node );
						this.get().removeChild( node );
					}
					return this;
				},

				/**
				 * @description  replaces node in first element in DOM
				 * @param {Element} newChild
				 * @param {Element} oldChild
				 * @return {lola.Selector}
				 */
				replaceChild: function( newChild, oldChild ) {
					if ( this.elements.length > 0 ) {
						lola.safeDelete( oldChild );
						//TODO: check if call to below line is needed
						//lola.data.destroyCache( oldChild, true );
						this.get().replaceChild( newChild, oldChild );
					}
					return this;
				},

				/**
				 * @description  sets or gets attributes
				 * @param {String} name
				 * @param {*} value
				 * @return {lola.Selector|Array}
				 */
				attr: function( name, value ) {
					if ( value != undefined ) {
						this.forEach( function( item ) {
							lola.dom.attr( item, name, value );
						} );
						return this;
					}
					else {
						var values = [];
						this.forEach( function( item ) {
							values.push( lola.dom.attr( item, name ) );
						} );
						return values;
					}
				},

				/**
				 * @description  removes attribute from elements
				 * @param {String} name
				 * @return {lola.Selector}
				 */
				removeAttr: function( name ) {
					this.forEach( function( item ) {
						item.removeAttribute( name );
					} );
					return this;
				},

				/**
				 * @description  sets new parent elements
				 * @param {String} newParent
				 * @return {lola.Selector|Array}
				 */
				parent: function( newParent ) {
					if ( newParent != undefined ) {
						this.forEach(function(item){
							$(newParent).appendChild( item );
						});
						return this;
					}
					else {

						var values = [];
						this.forEach( function( item ) {
							values.push( item?item.parentNode:null );
						} );
						return values;
					}
				},

				/**
				 * @description  deletes expando property on elements
				 * @param {String} name
				 * @return {lola.Selector}
				 */
				deleteExpando: function( name ) {
					this.forEach( function( item ) {
						lola.deleteExpando( item, name );
					} );
					return this;
				}



			};

			return methods;

		}

	};


	//register module
	lola.registerModule( dom );

})( lola );

