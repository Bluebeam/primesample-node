/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Bluebeam Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./route";

/**
 * / route
 *
 * @class User
 */
export class LoginRoute extends BaseRoute {

  /**
   * Create the routes.
   *
   * @class IndexRoute
   * @method create
   * @static
   */
  public static create(router: Router) {
    //log
    console.log("[LoginRoute::create] Creating login route.");

    //add home page route
    router.get("/login", (req: Request, res: Response, next: NextFunction) => {
      new LoginRoute().index(req, res, next);
    });
  }

  /**
   * Constructor
   *
   * @class LoginRoute
   * @constructor
   */
  constructor() {
    super();
  }

  /**
   * The login page route.
   *
   * @class LoginRoute
   * @method index
   * @param req {Request} The express Request object.
   * @param res {Response} The express Response object.
   * @next {NextFunction} Execute the next method.
   */
  public index(req: Request, res: Response, next: NextFunction) {
    //set custom title
    this.title = "Login";

    //set message
    let options: Object = {
      "message": "Login Route"
    };

    //render template
    this.render(req, res, "login", options);
  }
}