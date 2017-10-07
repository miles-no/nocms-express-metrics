'use strict';

const prometheus = require('prom-client');
const gcStats = require('prometheus-gc-stats');

module.exports = function(options) {
  prometheus.collectDefaultMetrics();
  gcStats(prometheus.registry);

  const reqLabelNames = ['method', 'status'];

  const requests = new prometheus.Counter({
    name: 'nocms_express_requests_total',
    help: 'Total number of requests',
    labelNames: reqLabelNames
  });

  const requestDuration = new prometheus.Gauge({
    name: 'nocms_express_request_duration_seconds',
    help: 'Duration per request',
    labelNames: reqLabelNames
  });

  return function(req, res, next) {
    const end = requestDuration.startTimer();

    res.end = function () {
      const reqLabels = {
        method: req.method,
        status: res.status
      };

      requests.inc(reqLabels, 1, new Date());
      end(reqLabels);
    };

    next()
  }
}
