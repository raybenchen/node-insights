'use strict';

(function(routeController) {
  
  var authorData = require('./../data/authors.json');

  function fetchAuthor(id) {
    for (var i = 0; i < authorData.length; i++) {
      // in our json file we should store the id as string to make === work
      if (authorData[i].id === id) {
        return authorData[i]; 
      }
    }
  }

  routeController.init = function(app) {
     
    app.get('/searchdata', function(req, res) {
      res.json({
        searchData: authorData
      });
    });

    app.get('/details/:id', function(req, res) {
      var author = fetchAuthor(req.params.id);
      res.json({
        details: {
          id: author.id,
          title: author.title,
          content: author.content
        } 
      });
    });

  };

}(module.exports));
