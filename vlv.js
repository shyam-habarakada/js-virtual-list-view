function jsvlv(width,height,contentSource,delegate) {
    
    var _i = this,
        _elId = ("vlv" + Math.round(Math.random() * 1000000)), 
        _t = '<div id="<%= id %>" class="vlv-container"' +
             ' style="width:<%=width %>px;height:<%=height %>px;"></div>',
        _$el = $(_.template(_t, { id: _elId, width: width, height: height })),
        _el = _$el[0],
        _container = null,
        _$content = $('<div class="vlv-content"></div>'), 
        _content = _$content[0],          
        _frozen = false,
        _viewportItems = [],
        _viewportStartIndex = 0,
        _viewportLastIndex = -1,
        _contentHeight = 0,
        _scrollDistance = 0,
        _scrollDistancePending = 0,
        _showing = false,
        _numberOfRows = contentSource ? contentSource.numberOfRows() : 0;
        
    function onItemClick(index,element) {
        if(_frozen) { return; }
        // todo: add support for element outerHeight changing after this event
        delegate.onSelectRow(index,element);
    }
    
    function addContentClickHandler(index,element) {
        element.addEventListener("click", function(e){ onItemClick(index,element); }, false);        
    }

    function removeContentClickHandler(index,element) {
        element.removeEventListener("click", function(e){ onItemClick(index,element); }, false);        
    }
        
    function animateScrollDistance() {
        var dy;
        if(Math.abs(_scrollDistancePending) < 2) {
            _scrollDistance += _scrollDistancePending;
            _scrollDistancePending = 0;
        } else {
            dy = Math.round(_scrollDistancePending * 0.6);
            _scrollDistance += dy;
            _scrollDistancePending -= dy;        
        }
    }

    function scroll() {
        _i.dbgdmp();
        var index;
        animateScrollDistance();
        _content.style.top = _scrollDistance + "px";
        if(_scrollDistance < 0) {
            index = _viewportEndIndex + 1;
            while(height - _scrollDistance - _contentHeight > 0) {
                if(index < _numberOfRows) {
                    push(index); 
                    index++;
                } else {
                    _scrollDistance = height - _contentHeight;
                    _content.style.top = _scrollDistance + "px";
                    break;
                }
            }
            // todo: trim the top
        } else {
            if(_scrollDistance > 0) {
                _content.style.top = "0px";
                _scrollDistance = 0;
            }
            // todo: trim the bottom and insert back to the top
        }

        if(_scrollDistancePending != 0) {
            requestAnimationFrame(scroll);
        }
    }
    
    function onMouseWheel(e) {
        e.preventDefault();
        if(_frozen) { return; }
        e.stopPropagation();
        _scrollDistancePending += e.wheelDeltaY;
        requestAnimationFrame(scroll);
    }

    function onKeyDown(e) {
        console.log(e.keyCode);
        var handled = false;
        if(_frozen) { return; }
        // up or down arrow
        if (e.keyCode == 38) {
            _scrollDistancePending += 15;
            requestAnimationFrame(scroll);
            handled = true;
        } else if (e.keyCode == 40) {
            _scrollDistancePending -= 15;
            requestAnimationFrame(scroll);
            handled = true;
        }

        if(handled) {
            e.preventDefault();
            e.stopPropagation();
        }
    }
    
    // add to bottom
    function push(index) {
        var ce = contentSource.contentForRowAtIndex(index),
            h;
        _content.appendChild(ce);
        h = $(ce).outerHeight(true);
        _contentHeight += h;
        _viewportItems.push({ index: index, element: ce, height: h });
        addContentClickHandler(index,ce);
        _viewportEndIndex = index;
    }

    // insert at top
    function unshift(index) {
        var ce = contentSource.contentForRowAtIndex(index),
            h;
        _content.insertBefore(ce,_content.firstChild);
        h = $(ce).outerHeight(false)
        _contentHeight += h;
        _viewportItems.unshift({ index: index, element: ce, height: h });
        addContentClickHandler(index,ce);
        _viewportStartIndex = index;
    }
    
    // remove from bottom
    function pop() {
        var elInfo = _viewportItems.pop();
        removeContentClickHandler(elInfo.index,elInfo.element);
        _content.removeChild(elInfo.element);
        _contentHeight -= elementInfo.height;
        _viewportEndIndex--;
    }

    // remove from top
    function shift(contentInfo) {
        var elInfo = _viewportItems.shift();
        removeContentClickHandler(elInfo.index,elInfo.element);
        _content.removeChild(elInfo.element);
        _contentHeight -= elementInfo.height;
        _viewportStartIndex++;
    }
    
    function fill() {
        var ce,h,
            i = 0;
        while(_contentHeight < height && i < _numberOfRows) {
            push(i);
            i++;
        };
    }

    function reset() {
        while (_content.firstChild) {
          _content.removeChild(_content.firstChild);
        }
        _content.style.top = "0px";
        _viewportItems = [];
        _viewportStartIndex = 0;        
        _viewportEndIndex = -1;
        _contentHeight = 0;
        _scrollDistance = 0;
        _numberOfRows = contentSource ? contentSource.numberOfRows() : 0;
    }
    
    _i.getElement = function() {
        return _el;
    }
    
    _i.show = function(container) {
        _el.appendChild(_content);
        _el.addEventListener("mousewheel",onMouseWheel,true);
        document.addEventListener("keydown",onKeyDown,true);
        container.appendChild(_el);
        _showing = true;
        _container = container;
        reset();
        fill();
    }
    
    _i.hide = function() {
        // todo: cleanup content bindings and elements
        _el.removeEventListener("mousewheel",onMouseWheel,true);
        document.removeEventListener("keydown",onKeyDown,true);
        if(_showing) {
            _container && _container.removeChild(_el);
            _showing = false;
        } 
    }
    
    _i.reload = function() {
        reset();
        fill();
    }

    _i.freeze = function() {
        _frozen = true;
    }

    _i.unfreeze = function() {
        _frozen = false;
    }
    
    _i.dbgdmp = function() {
        console.log({ 
            content : _viewportItems,
            scrollDistance: _scrollDistance,
            scrollDistancePending: _scrollDistancePending,
            contentHeight: _contentHeight,
            firstIndex: _viewportStartIndex,
            lastIndex: _viewportEndIndex,
            contentTop: _content.style.top
        });
    }

    return _i;
}
