import {Router} from "express";

export const services = Router();
export const ROUTES = Symbol("routes");
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "USE" | "PATCH" // TODO


export interface IRouteConfig {
  path: string;
  method: HttpMethod;
  handler: string | symbol;
}


export function Service(mountPoint: string): ClassDecorator {
  return (target => {
    const routes: IRouteConfig[] = (target.prototype as any)[ROUTES];
    const instance = new (target as any)();
    const service = Router();

    services.use(mountPoint, service);

    routes.forEach(route => {
      switch (route.method) {
        case "POST":
          service.post(route.path, instance[route.handler].bind(instance));
          break;
        case "PUT":
          service.put(route.path, instance[route.handler].bind(instance));
          break;
        case "GET":
          service.get(route.path, instance[route.handler].bind(instance));
          break;
        case "DELETE":
          service.delete(route.path, instance[route.handler].bind(instance));
          break;
        case "PATCH":
          service.patch(route.path, instance[route.handler].bind(instance));
          break;
        case "USE":
          service.use(route.path, instance[route.handler].bind(instance));
          break;
      }
    });

  });
}

export function Post(mountPoint?: string): MethodDecorator {
  return ((target: any, propertyKey, descriptor) => {

    const config: IRouteConfig = {
      path: mountPoint || ('/' + String(propertyKey)),
      method: 'POST',
      handler: propertyKey
    };

    if (!target[ROUTES]) target[ROUTES] = [];

    target[ROUTES].push(config);

    return descriptor;
  })
}

export function Get(mountPoint?: string): MethodDecorator {
  return ((target: any, propertyKey, descriptor) => {

    const config: IRouteConfig = {
      path: mountPoint || ('/' + String(propertyKey)),
      method: 'GET',
      handler: propertyKey
    };

    if (!target[ROUTES]) target[ROUTES] = [];

    target[ROUTES].push(config);

    return descriptor;
  })
}

export function Put(mountPoint?: string): MethodDecorator {
  return ((target: any, propertyKey, descriptor) => {

    const config: IRouteConfig = {
      path: mountPoint || ('/' + String(propertyKey)),
      method: 'PUT',
      handler: propertyKey
    };

    if (!target[ROUTES]) target[ROUTES] = [];

    target[ROUTES].push(config);

    return descriptor;
  })
}

export function Delete(mountPoint?: string): MethodDecorator {
  return ((target: any, propertyKey, descriptor) => {

    const config: IRouteConfig = {
      path: mountPoint || ('/' + String(propertyKey)),
      method: 'DELETE',
      handler: propertyKey
    };

    if (!target[ROUTES]) target[ROUTES] = [];

    target[ROUTES].push(config);

    return descriptor;
  })
}

export function Patch(mountPoint?: string): MethodDecorator {
  return ((target: any, propertyKey, descriptor) => {

    const config: IRouteConfig = {
      path: mountPoint || ('/' + String(propertyKey)),
      method: 'PATCH',
      handler: propertyKey
    };

    if (!target[ROUTES]) target[ROUTES] = [];

    target[ROUTES].push(config);

    return descriptor;
  })
}

export function Use(mountPoint?: string): MethodDecorator {
  return ((target: any, propertyKey, descriptor) => {

    const config: IRouteConfig = {
      path: mountPoint || ('/' + String(propertyKey)),
      method: 'USE',
      handler: propertyKey
    };

    if (!target[ROUTES]) target[ROUTES] = [];

    target[ROUTES].push(config);

    return descriptor;
  })
}
