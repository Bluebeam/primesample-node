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
export class IndexRoute extends BaseRoute {

  /**
   * Create the routes.
   *
   * @class IndexRoute
   * @method create
   * @static
   */
  public static create(router: Router) {
    //log
    console.log("[IndexRoute::create] Creating index route.");

    //add home page route
    router.get("/", authCheck, (req: Request, res: Response, next: NextFunction) => {
      new IndexRoute().index(req, res, next);
    });
  }

  /**
   * Constructor
   *
   * @class IndexRoute
   * @constructor
   */
  constructor() {
    super();
  }

  /**
   * The home page route.
   *
   * @class IndexRoute
   * @method index
   * @param req {Request} The express Request object.
   * @param res {Response} The express Response object.
   * @next {NextFunction} Execute the next method.
   */
  public index(req: Request, res: Response, next: NextFunction) {
    request.get("https://studioapi.bluebeam.com/publicapi/v1/projects", {
        'auth': {
          'bearer': req.user.accessToken
        }
      }, (err, response, body) => {
        //console.log('error:', error); // Print the error if one occurred
        //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        console.log('body:', body); // Print the HTML for the Google homepage.
        let obj = JSON.parse(body);
        if (err || ((response && response.statusCode) >= 400)) {
          res.redirect("/error");
        } else {
          //set custom title
          this.title = "Session Roundtripper - Create Session";

          //set message
          let options: Object = {
            "userId": req.user.id,
            "projects": obj.Projects
          };

          //render template
          this.render(req, res, "index", options);
        }
      });
  }
}