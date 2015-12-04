'use strict';
(function(controllers) {
  var routeController = require('./routeController');
  
  controllers.init = function(app) {
    routeController.init(app);
  };

}(module.exports));
