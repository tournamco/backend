const {nanoid} = require("nanoid");
const ApiErrors = require("../../../../common/userApi/UserApiErrors");

class Router {
    constructor() {
        // {
        //   path - Path for this subroute
        //   instance - Link to subrouter, overrides handler
        //   method - Which method this route can use
        //   handler - A function that is called (with JSONHTTPRequest and JSONHTTPResponse as
        //       parameters) when the route is used by a client
        // }
        this.stack = [];
    }

    handle(path, req, res) {
        const method = req.method;
        
        for(const route of this.stack) {
            if(!this.isMatchingRoute({path, method}, route)) continue;

            if(route.instance != undefined) {
                route.instance.handle(path.substring(route.path.length, path.length), req, res);
            }
            else {
                try {
                    const result = route.handler(req, res);

                    if(result instanceof Promise) {
                        result.catch(e => {
                            this.handleInternalServerError(e, req, res);
                        });
                    }
                } 
                catch(e) {
                    this.handleInternalServerError(e, req, res);
                }
            }

            return;
        }

        this.handleUnknownRoute(req, res);
    }

    isMatchingRoute({path, method}, route) {
        if(route.instance != undefined && path.startsWith(route.path)) {
            return true;
        }
        else if(path == route.path && (method == route.method || route.method == "*")) {
            return true;
        }

        return false;
    }

    handleUnknownRoute(req, res) {
        res.send(ApiErrors.NOT_FOUND);
    }

    handleInternalServerError(error, req, res) {
        const id = nanoid(12);

        logger.error(`A ${req.method} request to ${req.path} resulted in an error (${id}):`, error);

        res.send(Object.assign({}, ApiErrors.INTERNAL_SERVER_ERROR, {id}));
    }

    createSubrouter(path) {
        if(path.endsWith("/")) {
            throw Error("path cannot end with '/'");
        }

        const instance = new Router();

        this.stack.push({
            path, instance
        });

        return instance;
    }

    get(path, handler) {
        this.route(path, "GET", handler);
    }

    post(path, handler) {
        this.route(path, "POST", handler);
    }

    route(path, method = "*", handler) {
        if(!path.startsWith("/")) {
            throw Error("path must start with '/'");
        }

        this.stack.push({
            path, method, handler
        });
    }
}

module.exports = Router;