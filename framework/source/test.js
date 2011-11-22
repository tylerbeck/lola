(function(window){
	/**
	 * @namespace lola
	 * @description framework root object
	 * @customOne this is custom 1
	 * @customTwo this is custom 2
	 */
	var lola = {
//		/**
//		 * @class
//		 * @description this is class one
//		 */
//		ClassOne: function(){
//			return this.init();
//		},
//
//		/**
//		 * @class
//		 * @description this is class two
//		 */
//		ClassTwo: function(){
//			return this.init();
//		},
//
//		/**
//		 * @description this is method one
//		 * @param {String} param1
//		 * @param {String} param2
//		 * @return {String}
//		 */
//		methodOne: function(param1,param2) {
//			return param1+param2;
//		},
//
//		/**
//		 * @description this is method two
//		 * @param {String} param1
//		 * @param {String} param2
//		 * @return {String}
//		 */
//		methodTwo: function(param1,param2) {
//			return param1+param2;
//		},

		/**
		 * @description selector
		 */
		selector: {
			/**
			 * @description  a
			 */
			a: "A",

			/**
			 * @description  b
			 */
			b: "B",

			/**
			 * @description  c
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
//		 * @description method 1A
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
//		 * @description method 2A
//		 * @return {int}
//		 */
//		method2A: function(){
//			return 4;
//		}
//	};

	/**
	 * @memberof lola
	 * @description Array Module
	 */
	var array = {

		getMethods:function() {

			/**
			 * @description module's selector methods
			 * @type {Object}
			 */
			var methods = {
				/**
				 * @description  d
				 */
				d: "D",

				/**
				 * @description  e
				 */
				e: "E",

				/**
				 * @description f
				 */
				f: "F"
			};

			return methods;
		}
	}

})(window);
