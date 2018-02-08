/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Bluebeam Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as request from "request";
import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./route";
import { authCheck } from "../auth";
import { Projects } from "../studio/projects";
import { Sessions } from "../studio/sessions";
import { IncomingMessage } from "http";

/**
 * / route
 *
 * @class User
 */
export class FinishRoute extends BaseRoute {

  /**
   * Create the routes.
   *
   * @class IndexRoute
   * @method create
   * @static
   */
  public static create(router: Router) {
    //log
    console.log("[FinishRoute::create] Creating finish route.");

    //add home page route
    router.post("/finish", authCheck, (req: Request, res: Response, next: NextFunction) => {
      new FinishRoute().index(req, res, next);
    });
  }

  /**
   * Constructor
   *
   * @class FinishRoute
   * @constructor
   */
  constructor() {
    super();
  }

  /**
   * The finish page route.
   *
   * @class FinishRoute
   * @method index
   * @param req {Request} The express Request object.
   * @param res {Response} The express Response object.
   * @next {NextFunction} Execute the next method.
   */
  public index(req: Request, res: Response, next: NextFunction) {
      
    let token: string = req.user.accessToken;
    let sessionId: string = req.body.sessionId;
    let projectId: string = req.body.projectId;
    let fileSessionId: number = req.body.fileSessionId;
    let fileProjectId: number = req.body.fileProjectId;

    console.log("SessionID: ", sessionId)
    console.log("FileSessionID: ", fileSessionId);

    var buffer: Buffer;
    
    Sessions.setSessionStatus(token, sessionId, "Finalizing")
        .then(() => Sessions.startSnapshot(token, sessionId, fileSessionId))
        .then(() => Sessions.waitForSnapshot(token, sessionId, fileSessionId))
        .then((val) => Projects.downloadSnapshot(val.DownloadUrl))
        .then((val) => {
            buffer = val;
            return Sessions.sessionDelete(token, sessionId)
        })
        .then(() => Projects.checkinProjectFile(token, projectId, fileProjectId))
        .then((val) => Projects.uploadToAWS(val, buffer, buffer.length))
        .then(() => Projects.confirmProjectCheckin(token, projectId, fileProjectId, "Checkin from Node Roundtripper"))
        .then(() => Projects.flattenProjectFile(token, projectId, fileProjectId))
        .then(() => Projects.getSharedLink(token, projectId, fileProjectId))
        .then((val) => {
            let options: Object = {
                "projectLink": val.ShareLink
            };

            this.render(req, res, "finish", options);
        })
        .catch((err) => {
            res.redirect("/error?description=" + err);
        });
  }
}