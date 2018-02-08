/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Bluebeam Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as request from "request";
import * as multer from "multer";
import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./route";
import { authCheck } from "../auth";
import { Projects, ProjectFilesResponse } from "../studio/projects"
import { Sessions, CreateSessionResponse } from "../studio/sessions"

const upload = multer()

/**
 * / route
 *
 * @class User
 */
export class CreateRoute extends BaseRoute {

  /**
   * Create the routes.
   *
   * @class IndexRoute
   * @method create
   * @static
   */
  public static create(router: Router) {
    //log
    console.log("[CreateRoute::create] Creating create route.");

    //add home page route
    router.post("/create", authCheck, upload.single('sessionFile'), (req: Request, res: Response, next: NextFunction) => {
      new CreateRoute().index(req, res, next);
    });
  }

  /**
   * Constructor
   *
   * @class CreateRoute
   * @constructor
   */
  constructor() {
    super();
  }

  /**
   * The create page route.
   *
   * @class CreateRoute
   * @method index
   * @param req {Request} The express Request object.
   * @param res {Response} The express Response object.
   * @next {NextFunction} Execute the next method.
   */
  public index(req: Request, res: Response, next: NextFunction) {

    let token: string = req.user.accessToken;
    let projectId: string = req.body.project;
    let sessionName: string = req.body.session;

    console.log("File: ", req.file);
    console.log("Project: ", projectId);
    console.log("Session Name: ", sessionName);

    var projectFilesResponse: ProjectFilesResponse;
    var sessionResponse: CreateSessionResponse;

    Projects.startFileUpload(token, projectId, req.file.originalname)
        .then((val) => {
            projectFilesResponse = val;
            return Projects.uploadToAWS(val, req.file.buffer, req.file.size);
        })
        .then(() => Projects.confirmUpload(token, projectId, projectFilesResponse.Id))
        .then(() => Sessions.createSession(token, sessionName))
        .then((val) => { 
            sessionResponse = val;
            return Projects.checkoutFileToSession(token, val.Id, projectId, projectFilesResponse.Id) 
        })
        .then((val) => {
            let options: Object = {
                "sessionId": sessionResponse.Id,
                "projectId": projectId,
                "sessionName": sessionName,
                "fileSessionId": val.Id,
                "fileProjectId": projectFilesResponse.Id
            };
        
            this.render(req, res, "create", options);
        })
        .catch((err) => {
            res.redirect("/error?description=" + err);
        });
  }
}