js-virtual-list-view
====================

A generic HTML component for rendering very large lists. Supports variable height elements. Currently depends on jQuery and _ (underscore) and we can consider refactoring those dependencies based on demand. Collaborators are needed. For example, I am not planning to add touch support for the scroll gesture until I need it, but someone else might want to do that.

Usage:

Assuming you have a document with container for the large list like,

    <div id="listContainer"></div>

And CSS like,

    BODY { padding: 40px; }

    #listContainer {
        width: 200px;
        height: 500px;   
        border: 1px dotted #fcc;
    }

The following sample page will pupulate the list with test data:

    // test data
    var testData = [],
        selected = [],
        bgcolors = ['#fcc','#ffc','#cff','#cfc'],
        size = 200;

    for(var i=0; i<size; i++) {
        testData.push({ id: i, label: "list item " + i, selectable: true });
    }

    // test data source
    var listDataSource = {
        /* contentSource methods */
        contentForRowAtIndex     :  function (index) {
                                        var randomHeight = 20 + Math.round(50 * Math.random()),
                                            randomBackground = bgcolors[Math.round(4 * Math.random())],
                                            e = $('<div class="vlv-content"' +
                                                  'style="height:' + randomHeight + 
                                                  'px;font-family:Helvetica;padding:5px;background-color:' +
                                                  randomBackground + ';"></div>')[0];
                                        e.textContent = testData[index].label;
                                        return e;
                                    },
        
        numberOfRows             :  function() { return testData.length; },

        /* delegate methods */
        onSelectRow              :  function(index, element) { 
                                        selected[index] = true;
                                        element.textContent += " *";
                                        element.style.backgroundColor = "#f66";
                                    },

        onFocusRow               :  function(index, element) { 
                                        element.textContent = testData[index].label + " (focus)";
                                    },

        onBlurRow                :  function(index, element) { 
                                        element.textContent = testData[index].label;
                                    }

    }

    var listContainer = $('#listContainer')[0],
        vlv = new jsvlv($(listContainer).width(), 
                        $(listContainer).height(), 
                        listDataSource, 
                        listDataSource /* is also the delegate */);

    vlv.show(listContainer);
    
The `recalculateContentHeight` method can be used to update the view when the content of any list items change their height. This will cause the scrollbar to be recalculated and shown or hidden based on the new content.

Developer Setup (OSX)
=====================

1. Clone the repo
2. Install yuicompressor
3. When done making changes, run `./mnfy` to update minified files

Test with `examples/vlv.html`. Feel free to add new tests.
