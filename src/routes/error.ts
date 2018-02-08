
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Bluebeam Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as request from "request";
import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./route";
import { authCheck } from "../auth";

/**
 * / route
 *
 * @class User
 */
export class ErrorRoute extends BaseRoute {

  /**
   * Create the routes.
   *
   * @class ErrorRoute
   * @method create
   * @static
   */
  public static create(router: Router) {
    //log
    console.log("[ErrorRoute::create] Creating error route.");

    //add home page route
    router.get("/error", (req: Request, res: Response, next: NextFunction) => {
      new ErrorRoute().index(req, res, next);
    });
  }

  /**
   * Constructor
   *
   * @class ErrorRoute
   * @constructor
   */
  constructor() {
    super();
  }

  /**
   * The create page route.
   *
   * @class ErrorRoute
   * @method index
   * @param req {Request} The express Request object.
   * @param res {Response} The express Response object.
   * @next {NextFunction} Execute the next method.
   */
  public index(req: Request, res: Response, next: NextFunction) {

    let options: Object = {
        "description": req.query.description
    }

    this.render(req, res, "error", options);
  }
}