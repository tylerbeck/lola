(function( lola ) {
	var $ = lola;
	/**
	 * Drag Agent
	 * @implements {lola.Module}
	 * @memberof lola.agent
	 */
	var drag = {

		//==================================================================
		// Attributes
		//==================================================================
        /**
         * map of agent's clients
         * @private
         * @type {Object}
         */
        clients: {},

        /**
         * current drag target
         * @private
         */
        target: null,

        /**
         * bounds
         * @private
         */
        bounds: null,

        /**
         * dragging flag
         * @private
         */
        dragging: false,

        /**
         * drag offset
         * @private
         */
        offset: null,

		//==================================================================
		// Methods
		//==================================================================
		/**
		 * preinitializes module
		 * @private
		 * @return {void}
		 */
		preinitialize: function() {
			lola.debug('lola.agent.drag::preinitialize');
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do agent preinitialization



			//remove initialization method
			delete lola.agent.drag.preinitialize;
		},

		/**
		 * initializes module
		 * @public
		 * @return {void}
		 */
		initialize: function() {
			lola.debug('lola.agent.drag::initialize');
			//this framework is dependent on lola framework
			if ( !lola ) throw new Error( 'lola not defined!' );

			//do agent initialization
            $(".draggable").assignAgent( this.getNamespace() );

			//remove initialization method
			delete lola.agent.drag.initialize;
		},

		/**
		 * get module's namespace
		 * @public
		 * @return {String}
		 */
		getNamespace: function() {
			return "drag";
		},

		/**
		 * get module's dependencies
		 * @public
		 * @return {Array}s
		 * @default []
		 */
		getDependencies: function() {
			return ['event','data','graphics'];
		},

        /**
         * signs a client
         * @param {*} client
         */
        sign: function( client ) {
            var $client = $(client);
            $client.identify();
            if (this.clients[ client.id ] == null) {

                //not a client yet
                this.clients[ client.id ] = client;
                $client.putData( {}, this.getNamespace() );

                //add listeners
                $client.addListener( 'mousedown', this.startDrag, true, undefined, this );

            }
        },

        /**
         * drops a client
         * @param {*} client
         */
        drop: function( client ) {
            var $client = $(client);
            if (this.clients[ client.id ] ) {
                $client.removeData( this.getNamespace() );

                //remove listeners

                delete this.clients[ client.id ];
            }
        },

        setBounds: function( xMin, xMax, yMin, yMax) {
            this.bounds = {
                xMin:xMin,
                xMax:xMax,
                yMin:yMin,
                yMax:yMax
            };
        },
        getBounds: function() {
            return {
                xMin:this.bounds.xMin,
                xMax:this.bounds.xMax,
                yMin:this.bounds.yMin,
                yMax:this.bounds.yMax
            };
        },

        resetBounds: function( xMin, xMax, yMin, yMax) {
            this.bounds = null;
        },

        startDrag: function( event ) {
            this.target = event.currentTarget;
            this.offset = new lola.graphics.Point(-event.localX,-event.localY);
            this.dragging = false;

            var $target = $(event.currentTarget);
            var data = $target.getData(this.getNamespace(), true );
            data.position = new lola.graphics.Point(event.globalX, event.globalY);
            data.parent = $target.parent();
            data.zIndex = $target.style('zIndex');
            data.cursor = $target.style('cursor');
            $target.style('zIndex', 10000 );
            $target.style('cursor', 'none' );


            $(document).addListener('mousemove', this.doDrag, true, undefined, this );
            $(document).addListener('mouseup', this.endDrag, true, undefined, this );
        },

        doDrag: function( event ){
            var $target = $(this.target);

            if (!this.dragging) {
                this.dragging = true;
                $target.style('position', 'absolute');
                $('body').appendChild(this.target);
                $target.trigger( "dragstart", false, false );
            }

            var newX = event.globalX + this.offset.x;
            var newY = event.globalY + this.offset.y;

            if (this.bounds) {
                newX = lola.math.normalizeRange( this.bounds.xMin, newX, this.bounds.xMax );
                newY = lola.math.normalizeRange( this.bounds.yMin, newY, this.bounds.yMax );
            }
            else {
                newX = event.globalX;
                newY = event.globalY;
            }

            $target.style('left',newX+'px');
            $target.style('top',newY+'px');

            $target.trigger( "dragmove", false, false, { x:newX, y:newY } );
        },

        endDrag: function( event ){
            var $target = $(this.target);
            var data = $target.getData(this.getNamespace(), true );
            $target.style('cursor', data.cursor );
            $target.style('zIndex', data.zIndex );
            this.dragging = false;
            this.target = null;
            $(document).removeListener('mousemove', this.doDrag, true );
            $(document).removeListener('mouseup', this.endDrag, true );
            $target.trigger( "dragend", false, false );

        }

	};

	//register module
	lola.agent.registerAgent( drag );

})( lola );

