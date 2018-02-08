
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Bluebeam Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Request, Response, NextFunction } from "express";
import * as passportOAuth2 from "passport-oauth2";
import * as moment from "moment";

// Out of the box, the OAuth2 passport strategy does not handle refresh tokens. This middleware handler reuses the 
// oauth2 object from the OAuth2 passport in order to call getOAuthAccess token using the refresh token.

var oauth2 : any
var callback : any

export let initialize = (strategy: passportOAuth2.Strategy, c: any) => {
    oauth2 = (strategy as any)._oauth2;
    callback = c
}

export let authCheck = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {     
        let expiration = moment(req.user.expiration);
        if (expiration.isBefore(moment())) { 
            console.log("[auth::authCheck]: Refreshing token.");

            let params = { grant_type : "refresh_token"};
            oauth2.getOAuthAccessToken(req.user.refreshToken, params, function(err, accessToken, refreshToken, params) {
                if (err) {
                    console.log(err);
                    res.redirect("/login");
                    return;
                }

                req.user = callback(accessToken, refreshToken, params);
                
                return next();
            });
        } else {
            return next();
        }
    } else {
        console.log("[auth::authCheck]: Not authenticated. Redirecting to login.");
        res.redirect("/login");
    }
};