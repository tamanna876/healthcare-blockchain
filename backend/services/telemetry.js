const telemetryState = {
  startedAt: Date.now(),
  requestsTotal: 0,
  errorsTotal: 0,
  authFailures: 0,
  totalLatencyMs: 0,
  routeStats: {},
};

function ensureRoute(routeKey) {
  if (!telemetryState.routeStats[routeKey]) {
    telemetryState.routeStats[routeKey] = {
      requests: 0,
      errors: 0,
      totalLatencyMs: 0,
      lastStatus: 200,
    };
  }
  return telemetryState.routeStats[routeKey];
}

function metricsMiddleware(req, res, next) {
  const start = Date.now();
  const routeKey = `${req.method} ${req.baseUrl || ''}${req.path || ''}`.trim();

  telemetryState.requestsTotal += 1;
  const route = ensureRoute(routeKey);
  route.requests += 1;

  res.on('finish', () => {
    const latencyMs = Date.now() - start;
    telemetryState.totalLatencyMs += latencyMs;
    route.totalLatencyMs += latencyMs;
    route.lastStatus = res.statusCode;

    if (res.statusCode >= 400) {
      telemetryState.errorsTotal += 1;
      route.errors += 1;
      if (res.statusCode === 401 || res.statusCode === 403) {
        telemetryState.authFailures += 1;
      }
    }
  });

  next();
}

function getObservabilitySnapshot() {
  const uptimeSeconds = Math.floor((Date.now() - telemetryState.startedAt) / 1000);
  const avgLatencyMs = telemetryState.requestsTotal
    ? Number((telemetryState.totalLatencyMs / telemetryState.requestsTotal).toFixed(2))
    : 0;

  const topRoutes = Object.entries(telemetryState.routeStats)
    .map(([route, stats]) => ({
      route,
      requests: stats.requests,
      errors: stats.errors,
      avgLatencyMs: stats.requests ? Number((stats.totalLatencyMs / stats.requests).toFixed(2)) : 0,
      lastStatus: stats.lastStatus,
    }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10);

  const errorRate = telemetryState.requestsTotal
    ? Number(((telemetryState.errorsTotal / telemetryState.requestsTotal) * 100).toFixed(2))
    : 0;

  return {
    uptimeSeconds,
    requestsTotal: telemetryState.requestsTotal,
    errorsTotal: telemetryState.errorsTotal,
    authFailures: telemetryState.authFailures,
    avgLatencyMs,
    errorRate,
    topRoutes,
  };
}

module.exports = { metricsMiddleware, getObservabilitySnapshot };
