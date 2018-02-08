/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Bluebeam Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as request from "request";

export interface ProjectFilesResponse {
    Id: number
    UploadUrl: string
    UploadContentType: string
}

export interface CheckoutToSessionResponse {
    SessionId: string
    Id: number
}

export interface SharedLinkResponse {
    Id: string
    ShareLink: string
}

export interface JobFlattenResponse {
    Id: string
}

export class Projects {

    /**
     * Initiates an upload to the root folder in a Studio Project. 
     *
     * @class Projects
     * @method startFileUpload
     * @param token Studio Prime access token
     * @param projectId Studio Project ID
     * @param filename Filename of file to be uploaded
     * @returns ProjectFileResponse which contains the AWS S3 Upload URL
     */
    public static startFileUpload(token: string, projectId: string, filename: string): Promise<ProjectFilesResponse> {
        console.log("[Projects::startFileUpload]");
        return new Promise((resolve, reject) => {
            let req: Object = {
                Name: filename,
                ParentFolderId: 0
            }; 

            request.post(`https://studioapi.bluebeam.com/publicapi/v1/projects/${projectId}/files`, {
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
                        let resp: ProjectFilesResponse = JSON.parse(body);
                        resolve(resp);
                    }
                }
            });
        });
    }

    /**
     * Uploads a file to AWS S3 
     *
     * @class Projects
     * @method uploadToAWS
     * @param resp ProjectFilesResponse returned from startFileUpload
     * @param file Contents of the file as a Buffer
     * @param size Size in bytes of the file
     * @returns void
     */
    public static uploadToAWS(resp: ProjectFilesResponse, file: Buffer, size: number): Promise<void> {
        console.log("[Projects::uploadToAws]");
        return new Promise((resolve, reject) => {
            request.put(resp.UploadUrl, {
                body: file,
                headers: {"content-type": resp.UploadContentType, "content-length": size, "x-amz-server-side-encryption": "AES256" }
            }, function (err, response, body) {
                console.log(err);
                console.log(body);
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Downloads a file snapshot from AWS S3
     *
     * @class Projects
     * @method downloadSnapshot
     * @param fromUrl AWS Url
     * @returns Downloaded file contents as a Buffer
     */
    public static downloadSnapshot(fromUrl: string) : Promise<Buffer> {
        console.log("[Sessions::downloadSnapshot]");
        return new Promise((resolve, reject) => {
            request.get(fromUrl, {
                    encoding: null  // Passing in encoding as null forces body to be a Buffer
                }, function(err, res, body) {
                    if (err) {
                        reject(err);
                    } else {
                        if (res.statusCode >= 400) {
                            reject(res.statusCode);
                        } else {
                            resolve(body);
                        }
                    }
            })
        });
    }

    /**
     * Confirm that a file was successfully uploaded to AWS S3.
     *
     * @class Projects
     * @method confirmUpload
     * @param token Studio Prime access token
     * @param projectId Studio Project ID
     * @param projectFileId Studio Project File ID
     * @returns void
     */
    public static confirmUpload(token: string, projectId: string, projectFileId: number): Promise<void> {
        console.log("[Projects::confirmUpload]");
        return new Promise((resolve, reject) => {
            request.post(`https://studioapi.bluebeam.com/publicapi/v1/projects/${projectId}/files/${projectFileId}/confirm-upload`, {
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
                        resolve();
                    }
                }
            });
        });
    }

    /**
     * Checks out a Studio Project File into a Session
     *
     * @class Projects
     * @method checkoutFileToSession
     * @param token Studio Prime access token
     * @param sessionId Studio Session ID
     * @param projectId Studio Project ID
     * @param fileId Studio Project File ID
     * @returns Returns a CheckoutToSessionResponse which contains the Session File ID
     */
    public static checkoutFileToSession(token: string, sessionId: string, projectId: string, fileId: number): Promise<CheckoutToSessionResponse> {
        console.log("[Projects::checkoutFileToSession]");
        return new Promise((resolve, reject) => {
            let req: Object = {
                SessionId: sessionId,
            }; 
            request.post(`https://studioapi.bluebeam.com/publicapi/v1/projects/${projectId}/files/${fileId}/checkout-to-session`, {
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
                        let resp: CheckoutToSessionResponse = JSON.parse(body);
                        resolve(resp);
                    }
                }
            });
        });
    }

    /**
     * Checks in a Studio Project File. Note that this function does not upload a new revision, it is analogous to startFileUpload.
     *
     * @class Projects
     * @method checkinProjectFile
     * @param token Studio Prime access token
     * @param projectId Studio Project ID
     * @param fileProjectId Studio Project File ID
     * @returns Returns a ProjectFilesResponse which contains the AWS upload Url
     */
    public static checkinProjectFile(token: string, projectId: string, fileProjectId: number): Promise<ProjectFilesResponse> {
        console.log("[Projects::checkinProjectFile]");
        return new Promise((resolve, reject) => {
            request.post(`https://studioapi.bluebeam.com/publicapi/v1/projects/${projectId}/files/${fileProjectId}/checkin`, {
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
                        let resp: ProjectFilesResponse = JSON.parse(body);
                        resolve(resp);
                    }
                }
            });
        });
    }

    /**
     * Confirms that the file has been successfully uploaded as part of the Checkin process.
     *
     * @class Projects
     * @method checkinProjectFile
     * @param token Studio Prime access token
     * @param projectId Studio Project ID
     * @param fileProjectId Studio Project File ID
     * @param comment The Checkin Comment
     * @returns void
     */
    public static confirmProjectCheckin(token: string, projectId: string, fileProjectId: number, comment: string): Promise<void> {
        console.log("[Projects::confirmProjectCheckin]");
        return new Promise((resolve, reject) => {
            let req: Object = {
                Comment: comment,
            }; 

            request.post(`https://studioapi.bluebeam.com/publicapi/v1/projects/${projectId}/files/${fileProjectId}/confirm-checkin`, {
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
                        resolve();
                    }
                }
            });
        });
    }

    /**
     * Gets a link straight to the file that can be shared 
     *
     * @class Projects
     * @method getSharedLink
     * @param token Studio Prime access token
     * @param projectId Studio Project ID
     * @param fileProjectId Studio Project File ID
     * @returns Returns a SharedLinkResponse with the share link
     */
    public static getSharedLink(token: string, projectId: string, fileProjectId: number): Promise<SharedLinkResponse> {
        console.log("[Projects::getSharedLink]");
        return new Promise((resolve, reject) => {
            let req: Object = {
                ProjectFileID: fileProjectId,
            }; 

            request.post(`https://studioapi.bluebeam.com/publicapi/v1/projects/${projectId}/sharedlinks`, {
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
                        let resp: SharedLinkResponse = JSON.parse(body);
                        resolve(resp);
                    }
                }
            });
        });
    }

    /**
     * Kicks off a flatten job using default options
     *
     * @class Projects
     * @method flattenProjectFile
     * @param token Studio Prime access token
     * @param projectId Studio Project ID
     * @param fileId Studio Project File ID
     * @returns Returns a JobFlattenResponse which contains a Job ID. This ID could be used to poll the job status.
     */
    public static flattenProjectFile(token: string, projectId: string, fileId: number): Promise<JobFlattenResponse> {
        console.log("[Projects::flattenProjectFile]");
        return new Promise((resolve, reject) => {
            let req: Object = {
                Recoverable: true,
                PageRange: "-1",
                Options: {
                    Image: true,
                    Ellipse: true,
                    Stamp: true,
                    Snapshot: true,
                    TextAndCallout: true,
                    InkAndHighlighter: true,
                    LineAndDimension: true,
                    MeasureArea: true,
                    Polyline: true,
                    PolygonAndCloud: true,
                    Rectangle: true,
                    TextMarkups: true,
                    Group: true,
                    FileAttachment: true,
                    Flags: true,
                    Notes: true,
                    FormFields: true
                }
            }; 

            request.post(`https://studioapi.bluebeam.com/publicapi/v1/projects/${projectId}/files/${fileId}/jobs/flatten`, {
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
                        let resp: JobFlattenResponse = JSON.parse(body);
                        resolve(resp);
                    }
                }
            });
        });
    }
}

