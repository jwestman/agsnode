var debug = require('debug')('agsclient');
var request = require('superagent');
require('superagent-proxy')(request);
var _ = require('underscore');

/* FEATURESERVER ============================================================= */
var FeatureServer = function (fsUrl, fsInfo, options) {
    this.fsUrl = fsUrl;
    this.fsInfo = fsInfo;
    this.options = options;
};

// callback(err, fl)
module.exports.connectFeatureServer = function (fsUrl, options, callback) {
    if (!callback) {
        callback = options;
    }

    try {
        var req = request
            .get(fsUrl);

        if (options.proxy) {
            req = req.proxy(options.proxy);
        }

        req
            .query({ f: 'json' })
            .accept('json')
            .on('error', function (err) {
                debug('!!!!');
                return callback(err);
            })
            .end(function (res) {
            	var fsInfo;

                try {
                    fsInfo = JSON.parse(res.text);
                } catch (e) {
                    return callback(new Error('Passed URL seems to be not an Arcgis FeatureServer REST endpoint'));
                }

                if (!(fsInfo.type && fsInfo.type === 'Feature Layer')) {
                    return callback(new Error('Passed URL seems to be not an Arcgis FeatureServer REST endpoint'));
                }

                return callback(null, new FeatureServer(fsUrl, fsInfo, options));
            });
    } catch (e) {
        return callback(new Error('Incorrect URL or similar error.'));
    }
};

FeatureServer.prototype.query = function (options, callback) {
    var params = _.defaults(options, {
        outFields: '*',
        returnGeometry: false
    });

    if (_.isArray(params.objectIds)) {
        params.objectIds = params.objectIds.join(', ');
    }

    params.f = 'json';

    var req = request
        .get(this.fsUrl + '/query');

    if (this.options.proxy) {
        req = req.proxy(this.options.proxy);
    }

    req
        .query(params)
        .on('error', function (err) {
            return callback(err);
        })
        .end(function (res) {
            if (!res.ok) {
                return callback(new Error('Query error (serer response not ok).'));
            }

            var resBody;

            try {
                resBody = JSON.parse(res.text);
            } catch (e) {
                return callback(new Error('Query error (JSON parse error).'));
            }

            if (!!resBody.error) {
                // todo: error.message содержит больше данных
                return callback(new Error('ArcGISServer: ' + resBody.error.message));
            }

            return callback(null, resBody);
        });
};

FeatureServer.prototype.queryCount = function (options, callback) {
    options.returnCountOnly = true;
    this.query(options, function (err, result) {
        if (err) {
            return callback(err);
        }

        if (!result.hasOwnProperty('count')) {
            return callback(new Error('Query result error: no count property returned.'));
        }

        return callback(null, result.count);
    });
};

FeatureServer.prototype.add = function (features, callback) {
    var req = request
        .post(this.fsUrl + '/addFeatures');

    if (this.options.proxy) {
        req = req.proxy(this.options.proxy);
    }

    req
        .type('form')
        .send({ f: 'json' })
        .send({ features: JSON.stringify(features) })
        .on('error', function (err) {
            return callback(err);
        })
        .end(function (res) {
            if (!res.ok) {
                return callback(new Error('Query error (server response not ok).'));
            }

            var resBody;

            try {
                resBody = JSON.parse(res.text);
            } catch (e) {
                return callback(new Error('Query error (JSON parse error).'));
            }

            if (!!resBody.error) {
                debug('*** arcgis err, full body ***');
                debug(resBody);
                debug('*****************************');
                return callback(new Error('ArcGISServer: ' + resBody.error.message));
            }

            if (!resBody.addResults) {
                return callback(new Error('Add error.'));
            }

            return callback(null, resBody.addResults);
        });
};

FeatureServer.prototype.del = function (options, callback) {
    var params = options;
    params.f = 'json';
    params.rollbackOnFailure = true;

    var req = request
        .post(this.fsUrl + '/deleteFeatures');

    if (this.options.proxy) {
        req = req.proxy(this.options.proxy);
    }

    req 
        .type('form')
        .send(params)
        .on('error', function (err) {
            return callback(err);
        })
        .end(function (res) {
            if (!res.ok) {
                return callback(new Error('Query error (server response not ok).'));
            }

            var resBody;

            try {
                resBody = JSON.parse(res.text);
            } catch (e) {
                return callback(new Error('Query error (JSON parse error).'));
            }

            if (!!resBody.error) {
                debug('*** arcgis err, full body ***');
                debug(resBody);
                debug('*****************************');
                return callback(new Error('ArcGISServer: ' + resBody.error.message));
            }

            /*if (!resBody.deleteResults) {
             return callback(new Error('Delete error.'));
             }*/

            // delete "where" returns {success: t/f}, 
            // delete "objectids" return deleteResults[ {success:t/f, oid:123},...]
            return callback(null, resBody.deleteResults || resBody.success);
        });
};

FeatureServer.prototype.delete = function (options, callback) {
    console.info('arcgis rest client: FeatureServer.delete is deprecated. User "del" instead');
    this.del(options, callback);
};

FeatureServer.prototype.update = function (features, callback) {
    request
        .post(this.fsUrl + '/updateFeatures')
        .type('form')
        .send({ f: 'json' })
        .send({ features: JSON.stringify(features) })
        .on('error', function (err) {
            return callback(err);
        })
        .end(function (res) {
            if (!res.ok) {
                return callback(new Error('Query error (server response not ok).'));
            }

            var resBody;

            try {
                resBody = JSON.parse(res.text);
            } catch (e) {
                return callback(new Error('Query error (JSON parse error).'));
            }

            if (!!resBody.error) {
                debug('*** arcgis err, full body ***');
                debug(resBody);
                debug('*****************************');
                return callback(new Error('ArcGISServer: ' + resBody.error.message));
            }

            if (!resBody.updateResults) {
                return callback(new Error('Update error.'));
            }

            return callback(null, resBody.updateResults);
        });
};



/* GEOMETRYSERVER ============================================================= */
var GeometryServer = function (gsUrl, gsInfo, options) {
  this.gsUrl = gsUrl;
  this.gsInfo = gsInfo;
  this.options = options;
};

// callback(err, fl)
module.exports.connectGeometryServer = function (gsUrl, options, callback) {
  if (!callback) {
    callback = options;
  }

  try {
    var req = request
        .get(gsUrl);

    if (options.proxy) {
      req = req.proxy(options.proxy);
    }

    req
        .query({ f: 'json' })
        .accept('json')
        .on('error', function (err) {
          debug('!!!!');
          return callback(err);
        })
        .end(function (res) {
          var gsInfo;

          try {
            gsInfo = JSON.parse(res.text);
          } catch (e) {
            return callback(new Error('Passed URL seems to be not an Arcgis GeometryServer REST endpoint'));
          }

          //if (!(gsInfo.type && gsInfo.type === 'Feature Layer')) {
          //  return callback(new Error('Passed URL seems to be not an Arcgis GeometryServer REST endpoint'));
          //}

          return callback(null, new GeometryServer(gsUrl, gsInfo, options));
        });
  } catch (e) {
    return callback(new Error('Incorrect URL or similar error.'));
  }
};

GeometryServer.prototype.labelPoints = function (params, callback) {
  params.f = 'json';

  var req = request
      .get(this.gsUrl + '/labelPoints');

  if (this.options.proxy) {
    req = req.proxy(this.options.proxy);
  }

  req
      .query(params)
      .on('error', function (err) {
        return callback(err);
      })
      .end(function (res) {
        if (!res.ok) {
          return callback(new Error('LabelPoints error (server response not ok).'));
        }

        var resBody;

        //console.log(res.text);

        try {
          resBody = JSON.parse(res.text);
        } catch (e) {
          return callback(new Error('LabelPoints error (JSON parse error).'));
        }

        if (!!resBody.error) {
          return callback(new Error('ArcGISServer: ' + resBody.error.message));
        }

        return callback(null, resBody);
      });
};
