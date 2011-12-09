(function(window){
	/**
	 * @namespace lola
	 * framework root object
	 * @customOne this is custom 1
	 * @customTwo this is custom 2
	 */
	var lola = {
//		/**
//		 * @class
//		 * this is class one
//		 */
//		ClassOne: function(){
//			return this.init();
//		},
//
//		/**
//		 * @class
//		 * this is class two
//		 */
//		ClassTwo: function(){
//			return this.init();
//		},
//
//		/**
//		 * this is method one
//		 * @param {String} param1
//		 * @param {String} param2
//		 * @return {String}
//		 */
//		methodOne: function(param1,param2) {
//			return param1+param2;
//		},
//
//		/**
//		 * this is method two
//		 * @param {String} param1
//		 * @param {String} param2
//		 * @return {String}
//		 */
//		methodTwo: function(param1,param2) {
//			return param1+param2;
//		},

		/**
		 * selector
		 */
		selector: {
			/**
			 *  a
			 */
			a: "A",

			/**
			 *  b
			 */
			b: "B",

			/**
			 *  c
			 */
			c: "C"
		}
	};

//	core.ClassOne.prototype = {
//		/**
//		 * @private
//		 */
//		init: function(){
//			return this;
//		},
//
//		/**
//		 * method 1A
//		 * @return {int}
//		 */
//		method1A: function(){
//			return 4;
//		}
//
//	};
//
//	core.ClassTwo.prototype = {
//		/**
//		 * @private
//		 */
//		init: function(){
//			return this;
//		},
//
//		/**
//		 * method 2A
//		 * @return {int}
//		 */
//		method2A: function(){
//			return 4;
//		}
//	};

	/**
	 * @memberof lola
	 * Array Module
	 */
	var array = {

		getMethods:function() {

			/**
			 * module's selector methods
			 * @type {Object}
			 */
			var methods = {
				/**
				 *  d
				 */
				d: "D",

				/**
				 *  e
				 */
				e: "E",

				/**
				 * f
				 */
				f: "F"
			};

			return methods;
		}
	}

})(window);
