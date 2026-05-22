let routeCache = {};

export function getRouteCache(key) {
  return routeCache[key];
}

export function setRouteCache(key, value) {
  routeCache[key] = value;
}

export function clearRouteCache() {
  routeCache = {};
}
