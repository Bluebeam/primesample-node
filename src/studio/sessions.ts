/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Bluebeam Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as request from "request";
import * as moment from "moment";
import { Request } from "express";

export interface CreateSessionResponse {
    Id: string
}

export interface Session {
    Name: string
    Notification: boolean
    Restricted: boolean
    SessionEndDate: string
    OwnerEmailOrId: string
    Status: string
}

export interface SessionResponse {
    Id: string
    Name: string
    Restricted: boolean
    ExpirationDate: string
    SessionEndDate: string
    Version: number
    Created: string
    InviteUrl: string
    OwnerEmail: string
    Status: string
}

export interface SnapshotResponse {
    Status: string
    StatusTime: string
    LastSnapshotTime: string
    DownloadUrl: string
}

export class Sessions {

    /**
     * Creates a new Session with default options
     *
     * @class Sessions
     * @method createSession
     * @param token Studio Prime access token
     * @param sessionName Name for the new Session
     * @returns Returns a CreateSessionResponse which contains the ID of the new Session
     */
    public static createSession(token: string, sessionName: string): Promise<CreateSessionResponse> {
        console.log("[Sessions::createSession]");
        return new Promise((resolve, reject) => {
            let req: Object = {
                Name: sessionName,
                Notification: true,
                Restricted: false,
                SessionEndDate: moment().add(1, 'month').toJSON(),
                DefaultPermissions: [
                    {Type: "SaveCopy", Allow: "Allow"},
                    {Type: "PrintCopy", Allow: "Allow"},
                    {Type: "Markup", Allow: "Allow"},
                    {Type: "MarkupAlert", Allow: "Allow"},
                    {Type: "AddDocuments", Allow: "Allow"}
                ]
            }; 
            request.post(`https://studioapi.bluebeam.com/publicapi/v1/sessions`, {
                auth: {
                    bearer: token
                },
                body: JSON.stringify(req),
                headers: { "content-type": "application/json" }
            }, function (err, response, body) {
                if (err) {
                    reject(err);
                } else {
                    if (response.statusCode >= 400) {
                        reject(body);
                    } else {
                        let resp: CreateSessionResponse = JSON.parse(body);
                        resolve(resp);
                    }
                }
            });
        });
    }

    /**
     * Sets the Session Status. Setting a status of 'Finalizing' will for all active users out of the Session
     *
     * @class Sessions
     * @method setSessionStatus
     * @param token Studio Prime access token
     * @param sessionId ID of the Session
     * @param status Can be 'Active' or 'Finalizing'
     * @returns Returns a SessionResponse
     */
    public static setSessionStatus(token: string, sessionId: string, status: string) : Promise<SessionResponse> {
        console.log("[Sessions::setSessionStatus]");
        return new Promise((resolve, reject) => {
            let req: Object = {
                Status: status
            };

            request.put(`https://studioapi.bluebeam.com/publicapi/v1/sessions/${sessionId}`, {
                auth: {
                    bearer: token
                },
                body: JSON.stringify(req),
                headers: { "content-type": "application/json" }
            }, function (err, response, body) {
                if (err) {
                    reject(err);
                } else {
                    if (response.statusCode >= 400) {
                        reject(body);
                    } else {
                        let resp: SessionResponse = JSON.parse(body);
                        resolve(resp);
                    }
                }
            });
        });
    }

    /**
     * Starts a snapshot which is server side process of importing Session Markups into a self contained PDF File that can be downloaded.
     *
     * @class Sessions
     * @method startSnapshot
     * @param token Studio Prime access token
     * @param sessionId ID of the Session
     * @param fileId Session File ID
     * @returns void
     */
    public static startSnapshot(token: string, sessionId: string, fileId: number) : Promise<void> {
        console.log("[Sessions::startSnapshot]");
        return new Promise((resolve, reject) => {
            let url: string = `https://studioapi.bluebeam.com/publicapi/v1/sessions/${sessionId}/files/${fileId}/snapshot`;
            console.log(url);
            request.post(url, {
                auth: {
                    bearer: token
                },
            }, function (err, response, body) {
                if (err) {
                    reject(err);
                } else {
                    if (response.statusCode >= 400) {
                        reject(body);
                    } else {
                        console.log(body);
                        resolve();
                    }
                }
            })
        });
    }

    /**
     * Retrieves the status of a Snapshot
     *
     * @class Sessions
     * @method getSnapshotStatus
     * @param token Studio Prime access token
     * @param sessionId ID of the Session
     * @param fileId Session File ID
     * @returns Returns a SnapshotResponse which contains the status
     */
    public static getSnapshotStatus(token: string, sessionId: string, fileId: number) : Promise<SnapshotResponse> {
        console.log("[Sessions::getSnapshotStatus]");
        return new Promise((resolve, reject) => {
            request.get(`https://studioapi.bluebeam.com/publicapi/v1/sessions/${sessionId}/files/${fileId}/snapshot`, {
                auth: {
                    bearer: token
                },
            }, function (err, response, body) {
                if (err) {
                    reject(err);
                } else {
                    if (response.statusCode >= 400) {
                        reject(body);
                    } else {
                        let resp: SnapshotResponse = JSON.parse(body);
                        resolve(resp);
                    }
                }
            })
        });
    }

    /**
     * Polls the snapshot status at a 5s interval and waits for Error or Complete
     *
     * @class Sessions
     * @method waitForSnapshot
     * @param token Studio Prime access token
     * @param sessionId ID of the Session
     * @param fileId Session File ID
     * @returns Returns the final SnapshotResponse that is either in the Error or Complete state
     */
    public static waitForSnapshot(token: string, sessionId: string, fileId: number) : Promise<SnapshotResponse> {
        console.log("[Sessions::waitForSnapshot]");
        return Sessions.getSnapshotStatus(token, sessionId, fileId) 
            .then((val) => {
                console.log(val.Status);
                if (val.Status == "Error") {
                    return Promise.reject(val);
                } else if (val.Status == "Complete") {
                    return Promise.resolve(val);
                } else {
                    return (new Promise(resolve => setTimeout(resolve, 5000)))
                        .then(() => Sessions.waitForSnapshot(token, sessionId, fileId))
                }
            });
    }

    /**
     * Deletes a Session
     *
     * @class Sessions
     * @method sessionDelete
     * @param token Studio Prime access token
     * @param sessionId ID of the Session
     * @returns Returns void
     */
    public static sessionDelete(token: string, sessionId: string) : Promise<void> {
        console.log("[Sessions::sessionDelete]");
        return new Promise((resolve, reject) => {
            request.del(`https://studioapi.bluebeam.com/publicapi/v1/sessions/${sessionId}`, {
                auth: {
                    bearer: token
                },
            }, function (err, response, body) {
                if (err) {
                    reject(err);
                } else {
                    if (response.statusCode >= 400) {
                        reject(body);
                    } else {
                        console.log(body);
                        resolve();
                    }
                }
            })
        });
    }
}