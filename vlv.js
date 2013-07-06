function jsvlv(width,height,contentSource,delegate) {
    
    var _i = this,   
        _el = null,
        _elId = ("vlv" + Math.round(Math.random() * 1000000)), 
        _t = '<div id="<%= id %>" class="vlv-container"' +
             ' style="width:<%=width %>px;height:<%=height %>px;"></div>',
        _$el = $(_.template(_t, { id: _elId, width: width, height: height })),
        _el = _$el[0],
        _container = null,
        _content = $('<div class="vlv-content"></div>')[0],          
        _frozen = false,
        _viewportItems = [],
        _viewportStartIndex = 0,
        _viewportLastIndex = -1,
        _contentHeight = 0,
        _scrollDistance = 0,
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
        
    function scroll() {
        var dy = _scrollDistance,
            index;
        _content.style.top = dy + "px";
        if(dy < 0) {
            index = _viewportEndIndex + 1;
            while(height - dy - _contentHeight > 0) {
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
    }
    
    function onMouseWheel(e) {
        e.preventDefault();
        if(_frozen) { return; }
        e.stopPropagation();
        _scrollDistance += e.wheelDeltaY;
        requestAnimationFrame(scroll);
    }
    
    // add to bottom
    function push(index) {
        var ce = contentSource.contentForRowAtIndex(index),
            h;
        _content.appendChild(ce);
        h = $(ce).outerHeight(false)
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
        container.appendChild(_el);
        _showing = true;
        _container = container;
        reset();
        fill();
    }
    
    _i.hide = function() {
        // todo: cleanup content bindings and elements
        _el.removeEventListener("mousewheel",onMouseWheel,true);
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
            contentHeight: _contentHeight,
            firstIndex: _viewportStartIndex,
            lastIndex: _viewportEndIndex
        });
    }

    return _i;
}
