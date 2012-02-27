var Scroller = function(element) {
    var self = this;
    var startTouchY = 0;
    var contentStartOffsetY = 0;
    var contentOffsetY = 0;

    animateTo(0);

    element.addEventListener('touchstart', this, false);
    element.addEventListener('touchmove', this, false);
    element.addEventListener('touchend', this, false);

    function handleEvent(e) {

        switch (e.type) {
            case "touchstart":
                onTouchStart(e);
                break;
            case "touchmove":
                onTouchMove(e);
                break;
            case "touchend":
                onTouchEnd(e);
                break;
        }
    }

    function onTouchStart(e) {
        // This will be shown in part 4.
        ////stopMomentum();

        startTouchY = e.touches[0].clientY;
        contentStartOffsetY = contentOffsetY;
    }

    function onTouchMove(e) {
        if (isDragging()) {
            var currentY = e.touches[0].clientY;
            var deltaY = currentY - startTouchY;
            var newY = deltaY + contentStartOffsetY;
            animateTo(newY);
        }
    }

    function onTouchEnd(e) {
        if (isDragging()) {
            if (shouldStartMomentum()) {
                // This will be shown in part 3.
                doMomentum();
            } else {
                snapToBounds();
            }
        }
    }

    function animateTo(offsetY) {
        contentOffsetY = offsetY;

        // We use webkit-transforms with translate3d because these animations
        // will be hardware accelerated, and therefore significantly faster
        // than changing the top value.
        element.style.webkitTransform = 'translate3d(0, ' + offsetY + 'px, 0)';
    }

    // Implementation of this method is left as an exercise for the reader.
    // You need to measure the current position of the scrollable content
    // relative to the frame. If the content is outside of the boundaries
    // then simply reposition it to be just within the appropriate boundary.
    function snapToBounds() {
        //do nothing for now
    }

    // Implementation of this method is left as an exercise for the reader.
    // You need to consider whether their touch has moved past a certain
    // threshold that should be considered 'dragging'.
    function isDragging() {
        return true;
    }

    // Implementation of this method is left as an exercise for the reader.
    // You need to consider the end velocity of the drag was past the
    // threshold required to initiate momentum.
    function shouldStartMomentum() {
        return false;
    }

    function getEndVelocity() {

    }

    function doMomentum() {
        // Calculate the movement properties. Implement getEndVelocity using the
        // start and end position / time.
        var velocity = getEndVelocity();
        var acceleration = velocity < 0 ? 0.0005 : -0.0005;
        var displacement = - (velocity * velocity) / (2 * acceleration);
        var time = - velocity / acceleration;

        // Set up the transition and execute the transform. Once you implement this
        // you will need to figure out an appropriate time to clear the transition
        // so that it doesn’t apply to subsequent scrolling.
        element.style.webkitTransition = '-webkit-transform ' + time +'ms cubic-bezier(0.33, 0.66, 0.66, 1)';

        var newY = contentOffsetY + displacement;
        contentOffsetY = newY;
        element.style.webkitTransform = 'translate3d(0, ' + newY + 'px, 0)';
    }



};
