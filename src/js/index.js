var ko = require('knockout')
  , App = require('./view-models/app')
  , app = new App();

window.app = app; // for debugging

ko.applyBindings(app);
