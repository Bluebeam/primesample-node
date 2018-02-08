/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Bluebeam Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as bodyParser from "body-parser";
import * as session from "express-session";
import * as express from "express";
import * as logger from "morgan";
import * as path from "path";
import * as errorHandler from "errorhandler";
import * as passport from "passport";
import * as passportOAuth2 from "passport-oauth2";
import * as request from "request";
import * as moment from "moment";
import encoding from "encoding-down";
import levelup, { LevelUp } from "levelup";
import leveldown from "leveldown";
import * as levelstore from "level-session-store";

import { IndexRoute } from "./routes/index";
import { LoginRoute } from "./routes/login";
import { CreateRoute } from "./routes/create";
import { ErrorRoute } from "./routes/error";
import { FinishRoute } from "./routes/finish";

import { access } from "fs";
import { PassportStatic } from "passport";

import * as auth from "./auth"

interface Config {
  clientId: string
  clientSecret: string
  url: string
  secret: string
}

var config: Config;

try {
  config = require("../config.json");
} 
catch (e) {
  config = {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    url: process.env.URL,
    secret: process.env.SECRET 
  };
}

const LevelStore = levelstore(session);
const OAuth2Strategy = passportOAuth2.Strategy;

/**
 * The server.
 *
 * @class Server
 */
export class Server {

  public app: express.Application;
  public db: LevelUp;

  /**
   * Bootstrap the application.
   *
   * @class Server
   * @method bootstrap
   * @static
   * @return {ng.auto.IInjectorService} Returns the newly created injector for this app.
   */
  public static bootstrap(): Server {
    return new Server();
  }

  /**
   * Constructor.
   *
   * @class Server
   * @constructor
   */
  constructor() {
    //create expressjs application
    this.app = express();

    //configure application
    this.config();

    //add routes
    this.routes();

    //add api
    this.api();
  }

  /**
   * Create REST API routes
   *
   * @class Server
   * @method api
   */
  public api() {
    //empty for now
  }

  /**
   * Configure application
   *
   * @class Server
   * @method config
   */
  public config() {
    //add static paths
    this.app.use(express.static(path.join(__dirname, "public")));

    //configure pug
    this.app.set("views", path.join(__dirname, "views"));
    this.app.set("view engine", "pug");

    //mount logger
    this.app.use(logger("dev"));

    //mount json form parser
    this.app.use(bodyParser.json());

    //mount query string parser
    this.app.use(bodyParser.urlencoded({
      extended: true
    }));

    // LevelDB
    this.db = levelup(encoding(leveldown("./users"), { valueEncoding: 'json' }));
    let store: session.Store = new LevelStore("./sessions") as any as session.Store;

    this.app.use(session({ store: store, secret: config.secret, resave: true, saveUninitialized: true, cookie: {httpOnly: false, maxAge: 300*60*60*1000} } ));

    // catch 404 and forward to error handler
    this.app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
        err.status = 404;
        next(err);
    });

    //error handling
    this.app.use(errorHandler());

    this.app.use(passport.initialize());
    this.app.use(passport.session());

    passport.serializeUser<any, any>((user, done) => {
      console.log("[server::config::serializeUser");
      this.db.put(user.id, user, function(err) {
        console.log("Stored: ", user);
        done(err, user.id)
      });
    });
    
    passport.deserializeUser((id, done) => {
        console.log("[server::config::deserializeUser");
        this.db.get(id, function(err, value) {
          console.log("[server::config::deserializeUser]: Retrieved: ", value.id);
          done(err, value);
        });
    });
    
    let strategy = new OAuth2Strategy({
      authorizationURL: 'https://authserver.bluebeam.com/auth/oauth/authorize',
      tokenURL: 'https://authserver.bluebeam.com/auth/token',
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: config.url + "/callback",
    },
    function(accessToken, refreshToken, params, profile, done) {
      let expiration = moment().add(params.expires_in, 'seconds').toJSON();
      return done(null, {"id": params.userName, "accessToken": accessToken, "expiration": expiration, "refreshToken": refreshToken});
    });
    
    // Our own middleware to handle refresh tokens
    auth.initialize(strategy, (accessToken, refreshToken, params) => {
      let expiration = moment().add(params.expires_in, 'seconds').toJSON();
      let user = {"id": params.userName, "accessToken": accessToken, "expiration": expiration, "refreshToken": refreshToken};
      this.db.put(user.id, user, function(err) {
        console.log("[server::config]: Storing user after refreshing token.", user);
      });
      return user;
    });

    passport.use(strategy);
  }

  /**
   * Create and return Router.
   * 
   * @class Server
   * @method config
   * @return void
   */
  private routes() {
    let router: express.Router;
    router = express.Router();

    //IndexRoute
    IndexRoute.create(router);
    LoginRoute.create(router);
    CreateRoute.create(router);
    ErrorRoute.create(router);
    FinishRoute.create(router);

    //passport routes
    router.get('/oauth', passport.authenticate('oauth2', { scope: ['full_user', 'jobs'] }));
    router.get('/callback', passport.authenticate('oauth2', { successRedirect: '/', failureRedirect: '/error'}));

    //use router middleware
    this.app.use(router);
  }
}
