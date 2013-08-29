function jsvlvscrollbar(onchanged) {
  var _i = this,
      _t = '<div class="vlv-sb-pane"><div class="vlv-sb-slider"></div></div>',
      _$el = $(_t),
      _el = _$el[0],
      _$slider = $(".vlv-sb-slider", _el),
      _slider = _$slider[0],
      _container = null,
      _height = 0,
      _sliderHeight = 0,
      _position = 0,
      _value = 0,
      _dy = 0,
      _dragging = false,
      _disabled = false,
      _onchanged = onchanged || function() { /* noop */ };

  function clamp(p) {
    if(p < 0) {
      return 0;
    } else if(p > (_height - _sliderHeight)) {
      return _height - _sliderHeight;
    } else {
      return p;
    }
  }

  function updateSlider() {
    var p = clamp(_position + _dy);
    _slider.style.top = p + "px";
    _onchanged(p / (_height - _sliderHeight));
  }

  function ondrag(event) {
    _dy = event.gesture.deltaY;
    requestAnimationFrame(updateSlider);
  }

  function ondragstart(event) {
    _dragging = true;
  }

  function ondragend(event) {
    _dragging = false;
    _position = clamp(_position + _dy);
    _dy = 0;
  }

  _i.getElement = function() {
    return _el;
  }

  _i.set = function(value) {
    if(value < 0 || value > 1) throw "value must be between 0.0 and 1.0";
    if(!_dragging) {
      _value = value;
      _position = Math.round((_height - _sliderHeight) * value);
      requestAnimationFrame(updateSlider);
    }
  }

  _i.enable = function() {
    _$el.addClass('vlv-sb-active');
    _disabled = false;
    _height = _$el.height();
    _sliderHeight = _$slider.height();
    Hammer(_slider).on( "dragstart", ondragstart, { prevent_default: true });
    Hammer(_slider).on( "drag", ondrag, { prevent_default: true });
    Hammer(_slider).on( "dragend", ondragend, { prevent_default: true });
  }

  _i.disable = function()
  {
    Hammer(_slider).off( "dragstart", ondragstart, { prevent_default: true });
    Hammer(_slider).off( "drag", ondrag, { prevent_default: true });
    Hammer(_slider).off( "dragend", ondragend, { prevent_default: true });
    _$el.removeClass('vlv-sb-active');
    _disabled = true;
  }
}