var arcgis = require('arcgis-rest-client');
var Promise = require('bluebird');

var pointsUrl = 'http://jwestman1.esri.com:6080/arcgis/rest/services/Sandbox/AGSNode/FeatureServer/0';
var polygonsUrl = 'http://jwestman1.esri.com:6080/arcgis/rest/services/Sandbox/AGSNode/FeatureServer/1';

var geometryUrl = 'http://jwestman1.esri.com/arcgis/rest/services/Utilities/Geometry/GeometryServer';

var wkid = 4326;

// DEFERRED wrapper functions -------------------------------------------------

function def_getFeatureCount(url) {
  //console.log('def_getFeatureCount ', url);

  return new Promise(function (resolve, reject) {
    arcgis.connectFeatureServer(url, function (err, featureService) {
      // Query 
      featureService.queryCount({ 'where': '1=1' }, function (err, result) {
        if (err) {
          reject(err.message);
        }
        if (result || result === 0) {
          resolve(result);
        }
      });
    });
  });
}

function def_deleteFeatures(url, oids, where) {
  //oids as string '24,25'  or where as string '1=1'

  //console.log('def_deleteFeatures ', url);

  return new Promise(function (resolve, reject) {
    arcgis.connectFeatureServer(url, function (err, featureService) {
      // Delete
      var options = oids ? { 'objectIds': oids } : { 'where': where };
      //console.log(options);

      featureService.del(options, function (err, result) {
        if (err) {
          reject(err.message);
        }
        if (result) {
          //console.log(result || 'Nothing');
          resolve(result);
        }
      });
    });
  });
}

function def_getFeatures(url, options) {
  console.log('def_getFeatures ', options);

  return new Promise(function (resolve, reject) {
    arcgis.connectFeatureServer(url, function (err, featureService) {
      // Query 
      featureService.query(options, function (err, result) {
        if (err) {
          reject(err.message);
        }
        if (result) {
          resolve(result);
        }
      });
    });
  });
}

function def_getLabelPoints(polygons) {
  //console.log('def_getLabelPoints ', JSON.stringify(polygons));

  return new Promise(function (resolve, reject) {
    arcgis.connectGeometryServer(geometryUrl, function (err, geometryService) {
      // LabelPoints 
      geometryService.labelPoints({ 'polygons': JSON.stringify(polygons), 'sr': wkid }, function (err, result) {
        if (err) {
          reject(err.message);
        }
        if (result) {
          resolve(result);
        }
      });
    });
  });
}

function def_addPointFeatures(features) {
  //console.log('def_addPointFeatures ', JSON.stringify(features));

  return new Promise(function (resolve, reject) {
    arcgis.connectFeatureServer(pointsUrl, function (err, featureService) {
      // Add  
      featureService.add(features, function (err, result) {
        if (err) {
          reject(err.message);
        }
        if (result) {
          resolve(result);
        }
      });
    });
  });
}

// Worker functions ------------------------------------------------------------
function processPolygons() {

  //FETCH POLYGONS - Server default MaxRecordCount: 1000
  def_getFeatures(polygonsUrl, { 'where': '1=1', 'outFields': 'OBJECTID, NAME, ID', 'returnGeometry': true }).then(
    //success
    function (featureset) {
      //FOREACH feature
      featureset.features.forEach(function (feature, idx) {
        console.log(feature.attributes[featureset.objectIdFieldName], 'coords', feature.geometry.rings[0].length);
        //GET LABEL POINT
        def_getLabelPoints([feature.geometry]).then(
          //success
          function (response) {
            //DROP OBJECTID
            delete feature.attributes[featureset.objectIdFieldName];
            //MAKE NEW POINT
            var newfeature = {
              'attributes': feature.attributes,
              'geometry': response.labelPoints[0]
            };
            //ADD POINT FEATURE
            def_addPointFeatures([newfeature]).then(
              //success
              function (status) {
                console.log('Add Point', status);
                // Done when last point added
                if (idx === featureset.features.length - 1) {
                  console.log('Done!');
                }
              },
              //error
              function (msg) {
                console.log('Add Point Feature Error = ' + msg);
              }
            );
          },
          //error
          function (msg) {
            console.log('Get Label Point Error = ' + msg);
          }
        ); // end def_getLabelPoints
       
      }); // end featureset.foreach
    },
    //error
    function (msg) {
      console.log('Get Polygon Features Error = ' + msg);
    }
  );

} // end processPolygons

// EXECUTION-BLOCK ============================================================
console.log('Starting...');

// invoke GetCount of Points
// if count > 0 then delete, then processPolygons
def_getFeatureCount(pointsUrl).then(
  //success
  function (count) {
    console.log('Existing Point Count = ' + count);
    // existing count > 0 delete old points
    if (count) {
      def_deleteFeatures(pointsUrl, null, '1=1').then(
        //success
        function (status) {
          console.log('Delete Existing Points status:', status);
          processPolygons();
        },
        //error
        function (msg) {
          console.log('Delete Existing Points Error = ' + msg);
        }
      );
    } else {
      // existing count = 0 just process polygons
      processPolygons();
    }
  },
  //error
  function (msg) {
    console.log('Get Existing Points Error = ' + msg);
  }
);



