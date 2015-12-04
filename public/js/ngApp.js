/* global window, Chart, document */
'use strict';

(function(angular) {

  var app = angular.module('InsightsApp', ['ngRoute']);
  app.config(function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '/views/search.html',
        controller: 'SearchController'
      })
      .when('/details/:id', {
        templateUrl: '/views/details.html',
        controller: 'DetailsController'
      })
      .when('/analysis/:id', {
        templateUrl: '/views/analysis.html',
        controller: 'AnalysisController'
      })
      .otherwise({
        redirectTo: '/'
      });

    $locationProvider.html5Mode(false).hashPrefix('!');
  });

  app.controller('SearchController', ['$scope', '$timeout', '$routeParams', '$location', '$log', 'DataService',
    function($scope, $timeout, $routeParams, $location, $log, DataService) {

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

  app.controller('DetailsController', ['$scope', '$routeParams', '$location', 'DataService',
    function($scope, $routeParams, $location, DataService) {
      $scope.loading = true;
      $scope.analyzing = false;

      DataService.getDetails($routeParams.id, function(success, data) {
        $scope.loading = false;
        if (success) {
          $scope.details = data.details; 
        } else {
          $scope.error = data;
        }
      });

      function getAnalysisText() {
        return  $scope.details.content;
      }

      $scope.analyzeText = function() {
        $scope.analyzing = true;

        DataService.submitAnalysis({
          _id: $scope.details.id,
          title: $scope.details.title,
          content: getAnalysisText()
        }, 
        function(success, data) {
          $scope.analyzing = false;

          if (success && data) {
            $scope.changeView('analysis', true);
          } else {
            $scope.analysisError = "Error analyzing text";
          }
        });
      };

      // This should be refactored and put in a super controller or class because both controllers use it
      $scope.changeView = function(pageName, id) {
        id = typeof id === 'boolean' ? $routeParams.id : typeof id === 'string' ? id : '';
        $location.path('/' + pageName + '/' + id);
      };

      $scope.handleError = function(err) {
        console.log(err); 
      };

    }
  ]);

  app.controller('AnalysisController', ['$scope', '$timeout', '$routeParams', '$location', 'DataService',
    function($scope, $timeout, $routeParams, $location, DataService) {
      
      $scope.loading = true;
      $scope.contentVisible = false;

      DataService.getData($routeParams.id, function(success, data) {
        $scope.loading = false;

        if (success) {
          $scope.analysis = data;
          $timeout(function() {
            initCharts(data.PISummary);
          });
        } else {
          $scope.error = data;
        }
      });

      var chartOptions = {
        segmentShowStroke: false,
        percentageInnerCutout: 40,
        animantionStept: 60,
        animationEasing: 'easeInOutQuad',
        animateRotate: true,
        animateScale: false
      };
      var chartColors = ['#ff4000', '#ffc000', '#ff0040', '#008080', '#bfff00'];

      function initCharts(data) {
        for (var i = 0, len = data.length; i < len; i++) {
          new Chart(document.getElementById('analysis-chart-' + i)
                .getContext('2d'))
                .Doughnut(getChartData(data[i], i), chartOptions);
        }
      }

      function getChartData(data, i) {
        var num = Math.round(data.percentage * 100);
        return [
          {
            value: num,
            color: chartColors[i]
          },
          {
            value: 100 - num,
            color: 'rgba(255,255,255,0.1)'
          }
        ];
      }

      $scope.toggleContent = function() {
        $scope.contentVisible = !$scope.contentVisible;
      };

      $scope.tweet = function() {
        DataService.tweet({
          tweet: "Analysis for " + $scope.analysis.title + " #BluemixOnPluralsight" + location.href
        }, function(success, data) {
          if (success) {
            $route.reload(); 
          } else {
            $scope.error = data;
          }
        }); 
      };

      // This should be refactored and put in a super controller or class because both controllers use it
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

      var baseUrl = "https://nodeinsightsworkflows.eu-gb.mybluemix.net/";
      var searchData;

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
        },

        getDetails: function(id, res) {
          $http.get(location.origin + '/details/' + id)
            .success(function(data) {
              if (data.details) {
                res(true, data);
              } else {
                res(false, data.error || "Error fetching search details");
              }
            })
            .error(function(err) {
              res(false, err && err.error || err || "Error fetching search details");
            });
        },

        submitAnalysis: function(data, res) {
          var url = baseUrl + 'process-author';
          $http.post(url, data)
            .success(function(data) {
              res(true, data);
            })
            .error(function(data) {
              res(false, data);
            });
        },

        getData: function(id, res) {
          $http.get(baseUrl + 'get-author-data?_id=' + id)
            .success(function(data) {
              res(true, data);
            })
            .error(function(err) {
              res(false, err && err.error || err || "Error fetching search details");
            });
        },

        tweet: function(tweet, res) {
          $http.post(baseUrl + 'insight-tweet', tweet)
            .success(function(data) {
              res(true, data);
            })
            .error(function(data) {
              res(false, data);
            });
        }
      };
    }
  ]);

}(window.angular));
