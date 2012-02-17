/***********************************************************************
 * Lola JavaScript Framework
 *
 *  Description: Prototype upgrades
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
// keys JS 1.6 ---------------------------------------------
if ( !Object.keys ) {
    Object.keys = function ( object ) {
        var keys = [];
        for ( var name in object ) {
            if ( Object.prototype.hasOwnProperty.call( object, name ) ) {
                keys.push( name );
            }
        }
        return keys;
    };
}
// forEach JS 1.6 ------------------------------------------
if ( !Object.forEach ){
    Object.forEach = function( obj, fun  ) {
        "use strict";

        if ( obj === void 0 || obj === null )
            throw new TypeError();

        var t = Object( obj );
        if ( typeof fun !== "function" )
            throw new TypeError();

        var thisp = arguments[2];
        for ( var k in t ) {
            if (t.hasOwnProperty(k)){
                fun.call( thisp, t[k], k, t );
            }
        }
    };
}
// forEach JS 1.6 ------------------------------------------
if ( !Array.prototype.forEach ) {
    Array.prototype.forEach = function( fun /*, thisp */ ) {
        "use strict";

        if ( this === void 0 || this === null )
            throw new TypeError();

        var t = Object( this );
        var len = t.length >>> 0;
        if ( typeof fun !== "function" )
            throw new TypeError();

        var thisp = arguments[1];
        for ( var i = 0; i < len; i++ ) {
            if ( i in t )
                fun.call( thisp, t[i], i, t );
        }
    };
}
// indexOf JS 1.6 ------------------------------------------
if ( !Array.prototype.indexOf ) {
    Array.prototype.indexOf = function( searchElement /*, fromIndex */ ) {
        "use strict";

        if ( this === void 0 || this === null )
            throw new TypeError();

        var t = Object( this );
        var len = t.length >>> 0;
        if ( len === 0 )
            return -1;

        var n = 0;
        if ( arguments.length > 0 ) {
            n = Number( arguments[1] );
            if ( n !== n ) // shortcut for verifying if it's NaN
                n = 0;
            else if ( n !== 0 && n !== (1 / 0) && n !== -(1 / 0) )
                n = (n > 0 || -1) * Math.floor( Math.abs( n ) );
        }

        if ( n >= len )
            return -1;

        var k = n >= 0
            ? n
            : Math.max( len - Math.abs( n ), 0 );

        for ( ; k < len; k++ ) {
            if ( k in t && t[k] === searchElement )
                return k;
        }
        return -1;
    };
}
// lastIndexOf JS 1.6 --------------------------------------
if ( !Array.prototype.lastIndexOf ) {
    Array.prototype.lastIndexOf = function( searchElement /*, fromIndex*/ ) {
        "use strict";

        if ( this === void 0 || this === null )
            throw new TypeError();

        var t = Object( this );
        var len = t.length >>> 0;
        if ( len === 0 )
            return -1;

        var n = len;
        if ( arguments.length > 1 ) {
            n = Number( arguments[1] );
            if ( n !== n )
                n = 0;
            else if ( n !== 0 && n !== (1 / 0) && n !== -(1 / 0) )
                n = (n > 0 || -1) * Math.floor( Math.abs( n ) );
        }

        var k = n >= 0
            ? Math.min( n, len - 1 )
            : len - Math.abs( n );

        for ( ; k >= 0; k-- ) {
            if ( k in t && t[k] === searchElement )
                return k;
        }
        return -1;
    };
}
// filter JS 1.6 -------------------------------------------
if ( !Array.prototype.filter ) {
    Array.prototype.filter = function( fun /*, thisp */ ) {
        "use strict";

        if ( this === void 0 || this === null )
            throw new TypeError();

        var t = Object( this );
        var len = t.length >>> 0;
        if ( typeof fun !== "function" )
            throw new TypeError();

        var res = [];
        var thisp = arguments[1];
        for ( var i = 0; i < len; i++ ) {
            if ( i in t ) {
                var val = t[i]; // in case fun mutates this
                if ( fun.call( thisp, val, i, t ) )
                    res.push( val );
            }
        }

        return res;
    };
}
// every JS 1.6 --------------------------------------------
if ( !Array.prototype.every ) {
    Array.prototype.every = function( fun /*, thisp */ ) {
        "use strict";

        if ( this === void 0 || this === null )
            throw new TypeError();

        var t = Object( this );
        var len = t.length >>> 0;
        if ( typeof fun !== "function" )
            throw new TypeError();

        var thisp = arguments[1];
        for ( var i = 0; i < len; i++ ) {
            if ( i in t && !fun.call( thisp, t[i], i, t ) )
                return false;
        }

        return true;
    };
}
// map JS 1.6 ----------------------------------------------
if ( !Array.prototype.map ) {
    Array.prototype.map = function( fun /*, thisp */ ) {
        "use strict";

        if ( this === void 0 || this === null )
            throw new TypeError();

        var t = Object( this );
        var len = t.length >>> 0;
        if ( typeof fun !== "function" )
            throw new TypeError();

        var res = new Array( len );
        var thisp = arguments[1];
        for ( var i = 0; i < len; i++ ) {
            if ( i in t )
                res[i] = fun.call( thisp, t[i], i, t );
        }

        return res;
    };
}
// some JS 1.6 ---------------------------------------------
if ( !Array.prototype.some ) {
    Array.prototype.some = function( fun /*, thisp */ ) {
        "use strict";

        if ( this === void 0 || this === null )
            throw new TypeError();

        var t = Object( this );
        var len = t.length >>> 0;
        if ( typeof fun !== "function" )
            throw new TypeError();

        var thisp = arguments[1];
        for ( var i = 0; i < len; i++ ) {
            if ( i in t && fun.call( thisp, t[i], i, t ) )
                return true;
        }

        return false;
    };
}
// reduce ecma-5 -------------------------------------------
if ( !Array.prototype.reduce ) {
    Array.prototype.reduce = function reduce(accumulator){
        var i, l = this.length, curr;

        if(typeof accumulator !== "function") // ES5 : "If IsCallable(callbackfn) is false, throw a TypeError exception."
            throw new TypeError("First argument is not callable");

        if((l == 0 || l === null) && (arguments.length <= 1))// == on purpose to test 0 and false.
            throw new TypeError("Array length is 0 and no second argument");

        if(arguments.length <= 1){
            curr = this[0]; // Increase i to start searching the secondly defined element in the array
            i = 1; // start accumulating at the second element
        }
        else{
            curr = arguments[1];
        }

        for(i = i || 0 ; i < l ; ++i){
            if(i in this)
                curr = accumulator.call(undefined, curr, this[i], i, this);
        }

        return curr;
    };
}

// isArray ecma-5 ------------------------------------------
if ( !Array.isArray ) {
    Array.isArray = function( obj ) {
        return Object.prototype.toString.call( obj ) === "[object Array]" ||
            (obj instanceof Array);
    };
}

// ? -------------------------------------------------------
if ( !String.prototype.trim ) {
    String.prototype.trim = function () {
        return String( this ).replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' );
    };
}


