function jsvlv(width,height,contentSource,delegate) {
    
    var UP = -1,
        DOWN = 1,
        KEY_CODE_UP = 38,
        KEY_CODE_DOWN = 40,
        KEY_CODE_ENTER = 13,
        KEY_CODE_SPACE = 32;

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
        _viewportEndIndex = -1,
        _contentHeight = 0,
        _scrollDistance = 0,
        _scrollDistancePending = 0,
        _showing = false,
        _numberOfRows = contentSource ? contentSource.numberOfRows() : 0,
        _indexOfFocused = -1;
    
    // defaults
    delegate = delegate || {};
    delegate.onSelectRow = delegate.onSelectRow || function() {};
    delegate.onFocusRow = delegate.onFocusRow || function() {};
    delegate.onBlurRow = delegate.onBlurRow || function() {};

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
        var index,
            cIndex;
        animateScrollDistance();
        if(_scrollDistance < 0) {
            _content.style.top = _scrollDistance + "px";
            index = _viewportEndIndex + 1;
            while(height - _scrollDistance - _contentHeight > 0) {
                if(index < _numberOfRows) {
                    cIndex = _viewportItems[index - 1].index + 1;
                    push(cIndex); 
                    index++;
                } else {
                    if(_contentHeight > height) {
                        _scrollDistance = height - _contentHeight;
                        _content.style.top = _scrollDistance + "px";                        
                    } else {
                        _content.style.top = "0px";
                        _scrollDistance = 0;
                    }
                    break;
                }
            }
            // todo: trim the top
        } else if(_scrollDistance > 0) {
            _scrollDistance = 0;
            _scrollDistancePending = 0;
            _content.style.top = "0px";
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
        removeKeyboardFocus();
        _scrollDistancePending += e.wheelDeltaY;
        requestAnimationFrame(scroll);
    }

    function onKeyDown(e) {
        var handled = false;
        if(_frozen) { return; }
        switch(e.keyCode) {
            case KEY_CODE_UP:
                moveKeyboardFocus(UP);
                handled = true;
                break;
            case KEY_CODE_DOWN:
                moveKeyboardFocus(DOWN);
                handled = true;
                break;
            case KEY_CODE_ENTER:
            case KEY_CODE_SPACE:
                if(_indexOfFocused != -1) {
                    delegate.onSelectRow(_viewportItems[_indexOfFocused].index, _viewportItems[_indexOfFocused].element);
                    handled = true;
                }
                break;             
        }
        if(handled) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    function moveKeyboardFocus(direction) {
        var nextIndexOfFocus,
            cIndex;
        if(_indexOfFocused == -1) {
            _indexOfFocused = firstVisibleIndex();
            delegate.onFocusRow(_viewportItems[_indexOfFocused].index, _viewportItems[_indexOfFocused].element);
        } else {
            nextIndexOfFocus = _indexOfFocused + direction;
            if(nextIndexOfFocus >= 0 && nextIndexOfFocus < _numberOfRows ) {
                if(direction == DOWN && nextIndexOfFocus > _viewportEndIndex) {
                    cIndex = _viewportItems[_viewportEndIndex].index + 1;
                    push(nextIndexOfFocus);
                }
                delegate.onBlurRow(_viewportItems[_indexOfFocused].index, _viewportItems[_indexOfFocused].element);
                scrollToItemAtIndex(nextIndexOfFocus);
                delegate.onFocusRow(_viewportItems[nextIndexOfFocus].index, _viewportItems[nextIndexOfFocus].element);
                _indexOfFocused = nextIndexOfFocus;
            }
        }
    }

    function removeKeyboardFocus() {
        if(_indexOfFocused != -1) {
            delegate.onBlurRow(_viewportItems[_indexOfFocused].index, _viewportItems[_indexOfFocused].element);
            _indexOfFocused = -1;
        }
    }

    // fist visible index based on scroll position and current items in viewport
    function firstVisibleIndex() {
        var offsetAtTop = -_scrollDistance,
            h = 0,
            i = 0;
        for( ; i < _viewportItems.length; i++) {
            if(h >= offsetAtTop) { 
                break;
            } else {
                h += _viewportItems[i].height;
            }
        }
        return i;
    }

    function scrollToItemAtIndex(index) {
        var offset = 0,
            h = 0,
            i = 0,
            dy = 0;
        for( ; i < _viewportItems.length; i++) {
            h = _viewportItems[i].height;
            if(i == index) { 
                break;
            } else {
                offset += h;
            }
        }
        if(offset < -_scrollDistance) {
            // above the top edge
            _scrollDistancePending += -(_scrollDistance + offset);
            requestAnimationFrame(scroll);
        } else if(h + offset > (height - _scrollDistance)) {
            // below bottom edge
            _scrollDistancePending -= offset + h - height + _scrollDistance; 
            requestAnimationFrame(scroll);
        }
        // already visible. do nothing
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
        removeKeyboardFocus();
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
        var o = { 
            // content : _viewportItems,
            scrollDistance: _scrollDistance,
            scrollDistancePending: _scrollDistancePending,
            contentHeight: _contentHeight,
            firstIndex: _viewportStartIndex,
            lastIndex: _viewportEndIndex,
            indexOfFocused : _indexOfFocused,
            contentTop: _content.style.top
        };
        console.log(JSON.stringify(o));
    }

    return _i;
}
