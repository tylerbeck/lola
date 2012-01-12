(function( lola ) {
	var $ = lola;
	/**
	 * Array Module
	 * @implements {lola.Module}
	 * @memberof lola
	 */
	var array = {

		//==================================================================
		// Attributes
		//==================================================================


		//==================================================================
		// Methods
		//==================================================================
		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.array::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do module initialization



			//remove initialization method
			delete lola.array.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 * @default array
		 */
		getNamespace: function() {
			return "array";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}
		 * @default []
		 */
		getDependencies: function() {
			return [];
		},

		/**
		 * checks an array of objects for a property with value
		 * @public
		 * @param {Array<Object>} array array to check
		 * @param {String} property property to inspect
		 * @param value value to match
		 * @return {Boolean}
		 */
		hasObjectWithProperty: function ( array, property, value ) {
			var callback = function( item, index, arr ) {
				return item[property] == value;
			};
			return array.some( callback );
		},

		/**
		 * returns a unique copy of the array
		 * @public
		 * @param array
		 * @return {Array}
		 */
		unique: function ( array ) {
			var tmp = [];
			for (var i = array.length-1; i >= 0; i--){
				if (tmp.indexOf( array[i] ) == -1){
					tmp.push( array[i] );
				}
			}

			return tmp;
		},

		/**
		 * checks if array contains object
		 * @public
		 * @param {Array} array
		 * @return {Boolean}
		 */
		isIn: function ( array, value ) {
			return array.indexOf( value ) >= 0;
		},

		/**
		 * removes null values from array
		 * @public
		 * @param {Array} array
		 * @return {Array}
		 */
		pruneNulls: function( array ) {
			var tmp = [];
			array.forEach( function(item){
				if ( item != null ){
					tmp.push( item );
				}
			});
			return tmp;
		},


		/**
		 * creates a sort function for property
		 * @param {String} property
		 * @return {Function}
		 */
		getSortFunction: function( property ){
			return function( a, b ) {
				var x = a[property];
				var y = b[property];
				return ((x < y) ? -1 : ((x > y) ? 1 : 0));
			};
		},

		/**
		 * sort an array on a property
		 * @param {Array} array
		 * @param {String} property
		 */
		sortOn: function( property, array ){
			return array.sort( lola.array.getSortFunction(property) );
		},


		//==================================================================
		// Selector Methods
		//==================================================================
		/**
		 * get module's selectors
		 * @public
		 * @return {Object}
		 */
		getSelectorMethods: function() {

			/**
			 * module's selector methods
			 * @type {Object}
			 */
			var methods = {

				/**
				 * iterates each element in Selector and applies callback.
				 * @param {Function} callback function callback( item, index, array ):void
				 */
				forEach: function( callback ) {
                    this.elements.forEach( callback );
					return this;
				},

				/**
				 * iterates each element in Selector and checks that every callback returns true.
				 * @param {Function} callback function callback( item, index, array ):Boolean
				 */
				every: function( callback ) {
					return this.elements.every( callback );
				},

				/**
				 * iterates each element in Selector and checks that at least one callback returns true.
				 * @param {Function} callback function callback( item, index, array ):Boolean
				 */
				some: function( callback ) {
					return this.elements.some( callback );
				}

			};

			return methods;

		},


		//==================================================================
		// Prototype Upgrades
		//==================================================================
		/**
		 * upgrades array prototype and is then deleted
		 * @private
		 */
		upgradeArrayPrototype: function() {


		}


	};

	//update array prototype
	array.upgradeArrayPrototype();
	delete array['upgradeArrayPrototype'];

	//register module
	lola.registerModule( array );

})( lola );

