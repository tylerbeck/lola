/***********************************************************************
 * Lola JavaScript Framework
 *
 *  Description: Base Construct Tail
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function( lola ){
    if ( document.readyState === "complete" ) {
        lola.initialize( window );
    }
    else {
        if ( document.addEventListener ) {
            document.addEventListener( "DOMContentLoaded", lola.initialize, false );
            lola.window.addEventListener( "load", lola.initialize, false );
        }
        else if ( document.attachEvent ) {
            document.attachEvent( "onreadystatechange", lola.initialize );
            lola.window.attachEvent( "onload", lola.initialize );
        }
    }

})(lola);