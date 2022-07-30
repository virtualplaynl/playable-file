var mraid = {
    getState: function() {
        return 'default';
    },
    addEventListener: function(evt, func) {
        if(evt == "ready") {
            func();
        }
        else if(evt == "exposureChange") {
            func(100);
        }
    },
    removeEventListener: function(func) {
    },
    open: function(url) {
        window.open(url);
    },
    isViewable: function() {
        return true;
    }
};