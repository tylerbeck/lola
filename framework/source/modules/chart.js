/***********************************************************************
 * Lola JavaScript Framework
 *
 *       Module: Chart
 *  Description: Chart module
 *       Author: Copyright 2011-2012, Tyler Beck
 *
 ***********************************************************************/
(function (lola) {
    /**
     * Chart Module
     * @namespace lola.chart
     */
    var Module = function(){
        var self = this;
        //==================================================================
        // Attributes
        //==================================================================
        /**
         * module's namespace
         * @type {String}
         * @private
         */
        var namespace = "chart";

        /**
         * module's dependencies
         * @type {Object}
         * @private
         */
        var dependencies = ['graphics'];


        //==================================================================
        // Getters & Setters
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


        //==================================================================
        // Methods
        //==================================================================

        //==================================================================
        // Classes
        //==================================================================
        this.Grid = function(x,y,width,height,spacing,flags){
            return this.init(x,y,width,height,spacing,flags);
        };
        this.Grid.HORIZONTAL = 0x1;
        this.Grid.VERTICAL = 0x2;
        this.Grid.prototype = {
            x:0,
            y:0,
            width:100,
            height:100,
            spacing:10,
            flags:3,
            init: function(x,y,width,height,spacing,flags){
                this.x = x || 0;
                this.y = y || 0;
                this.width = width || 100;
                this.height = height || 100;
                this.spacing = spacing || 10;
                this.flags = (flags==undefined)?3:flags;

                return this;
            },

            draw: function( ctx, flags ){
                flags = flags == undefined ? this.flags : flags;

                var i;
                //vertical
                if (flags & self.Grid.VERTICAL){
                    for (i=this.x+this.spacing; i<=this.width+this.x; i+=this.spacing){
                        ctx.beginPath();
                        ctx.moveTo(i,this.y);
                        ctx.lineTo(i,this.y+this.height);
                        ctx.stroke();
                        ctx.closePath();
                    }
                }
                //horizontal
                if (flags & self.Grid.HORIZONTAL){
                    for (i=this.y+this.spacing; i<=this.height+this.y; i+=this.spacing){
                        ctx.beginPath();
                        ctx.moveTo(this.x,i);
                        ctx.lineTo(this.x+this.width,i);
                        ctx.stroke();
                        ctx.closePath();
                    }
                }
            }
        };


        this.Axis =function(x,y,size,label,labelOffset,flags ){
            return this.init(x,y,size,label,labelOffset,flags);
        };
        this.Axis.VERTICAL = 0x1;
        this.Axis.prototype = {
            x:0,
            y:0,
            size: 100,
            label: undefined,
            labelOffset: {x:0,y:0},
            flags: 0x2,
            init: function(x,y,size,label,labelOffset,flags){
                this.x = x || 0;
                this.y = y || 0;
                this.size = size || 100;
                this.label = label;
                if( labelOffset ) this.labelOffset = labelOffset;
                this.flags = (flags==undefined)?0x0:flags;
                return this;
            },

            draw: function( ctx, flags ){
                flags = flags == undefined ? this.flags : flags;
                ctx.beginPath();
                ctx.moveTo( this.x, this.y );
                if (flags & self.Axis.VERTICAL){
                    //vertical axis
                    ctx.lineTo( this.x, this.y+this.size );
                }
                else {
                    //horizontal axis
                    ctx.lineTo( this.x+this.size, this.y );
                }
                ctx.stroke();
                ctx.closePath();

                if (this.label) {
                    if (flags & self.Axis.VERTICAL) {
                        //label at bottom
                        ctx.textAlign = "center";
                        ctx.fillText( this.label, this.x + this.labelOffset.x, this.y + this.size + this.labelOffset.y );
                    }
                    else {
                        ctx.textAlign = "right";
                        ctx.fillText( this.label, this.x + this.labelOffset.x, this.y + this.labelOffset.y );
                    }
                }
            }
        };

    };


    //==================================================================
    // Class Prototypes
    //==================================================================



    //register module
    lola.registerModule( new Module() );

})(lola);
