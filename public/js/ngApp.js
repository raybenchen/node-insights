/* global window */
'use strict';

(function(angular) {

  var app = angular.module('InsightsApp', ['ngRoute']);
  app.config(function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '/views/search.html',
        controller: 'SearchController'
      })
      .otherwise({
        redirectTo: '/'
      });

    $locationProvider.html5Mode(false).hashPrefix('!');
  });

  app.controller('SearchController', ['$scope', '$timeout', '$routeParams', '$location', 'DataService',
    function($scope, $timeout, $routeParams, $location, DataService) {

      $scope.loading = true;
      $scope.error = false;

      DataService.getSearchData(function(success, data) {
        $scope.loading = false;
        if (!success) {
          $scope.error = data;
        }
      });

      $scope.searchData = function() {
        DataService.search($scope.searchQuery, function(data) {
          $timeout(function() {
            $scope.searchResults = data;
          });
        });
      };

      $scope.changeView = function(pageName, id) {
        id = typeof id === 'boolean' ? $routeParams.id : typeof id === 'string' ? id : '';
        $location.path('/' + pageName + '/' + id);
      };

      $scope.handleError = function(err) {
        console.log(err); 
      };

    }
  ]);

  app.service('DataService', ['$http', 
    function($http) {
  
      var baseUrl = "http://nodeinsightsworkflows.eu-gb.mybluemix.net/";
      var searchUrl;

      return {
        searchData: searchData,
        
        getSearchData: function(res) {
          $http.get(location.origin + '/searchData')
            .success(function(data) {
              searchData = data.searchData;
              res(true);
            })
            .error(function(err) {
              res(false, err.error || err || 'Error fetching search data');
            });
        },

        search: function(query, res) {
          if (query.length < 2) {
            res([]);
            return;
          }

          var count = 0;
          query = query.toLowerCase();
          res(searchData.filter(function(value) {
            if (count > 9) return;

            value = value.title.toLowerCase();
            if (value.indexOf(query) > -1) {
              count ++;
              return true;
            } else {
              return false; 
            }
          }));
        }
      };
    }
  ]);

}(window.angular));
