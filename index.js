'use strict';
const gcStats = require('prometheus-gc-stats');

module.exports = (options) => {
  const prometheus = options.prometheus || require('prom-client');

  if(!options.noDefaultMetrics)  prometheus.collectDefaultMetrics();
  if(!options.noGcStats)         gcStats(prometheus.registry);

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
    let oldEnd = res.end;

    res.end = function () {
      const reqLabels = {
        method: req.method,
        status: res.statusCode ? res.statusCode.toString() : ''
      };

      requests.inc(reqLabels, 1, new Date());
      end(reqLabels);
      oldEnd.apply(res, arguments);
    };
    next()
  }
}
