'use strict';
const gcStats = require('prometheus-gc-stats');

module.exports = (options) => {
  const prometheus = options.prometheus || require('prom-client');

  if(options.enableNodeMetrics)  prometheus.collectDefaultMetrics();
  if(options.enableGCMetrics)    gcStats(prometheus.registry);
  if(options.enableGCMetrics) {
    const startGc = gcStats(prometheus.registry);
    startGc();
  }

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
    if(req.path === '/metrics' || req.path === '/health') return next();

    const end = requestDuration.startTimer();
    let oldEnd = res.end;

    res.end = function () {
      const reqLabels = {
        method: req.method,
        status: res.statusCode ? res.statusCode.toString() : ''
      };

      requests.inc(reqLabels, 1);
      end(reqLabels);
      oldEnd.apply(res, arguments);
    };
    next()
  }
}
