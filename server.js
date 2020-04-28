/**
 */
"use strict";

const express = require("express");
const multer = require("multer");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

const app = express();
const db = mysql.createPool({
  host: process.env.DB_URL || 'localhost',
  port: process.env.DB_PORT || '8889',
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'smTools'
});

app.use(multer().none());

const CLIENT_ERROR = 400;
const CLIENT_ERROR_JSON = {"error": "You have made an invalid request"};
const ACCESS_DENIED_ERROR = 401;
const ACCESS_DENIED_JSON = {"error": "Invalid login credentials"};
const SERVER_ERROR = 500;
const SERVER_ERROR_MSG = {"error": "There has been an error on the server"};
const SESSION_NUMBER_LENGTH = 9;
const SALT_ROUNDS = 10;

/*
 * Checks to see if the given username and password match any user
 * in the system.
 * Type: Post
 * Body: username, password
 * Response type: JSON
 */
app.post("/login", async function(req, res) {
  res.type("json");
  let username = req.body.username;
  let password = req.body.password;
  if (!username || !password) {
    bodyParams = ["username", "password"];
    res.status(CLIENT_ERROR).send(getMissingParameterMessage(bodyParams));
  } else {
    try {
      if(await checkUserCredintials(username, password)) {
        let sessionNumber = await updateSessionNumber(username);
        res.send({"sessionNumber": sessionNumber});
      } else {
        res.status(ACCESS_DENIED_ERROR).send(ACCESS_DENIED_MSG);
      }
    } catch (error) {
      console.error(error);
      res.status(SERVER_ERROR).send(SERVER_ERROR_MSG);
    }
  }
});

/*
 * Adds a new user to the system.
 * Type: Post
 * Body: username, password, hint
 * Response Type: json
 */
app.post("/signup", async function(req, res) {
  res.type("json");
  let username = req.body.username;
  let password = req.body.password;
  let hint = req.body.hint;
  if (!username || !password || !hint) {
    bodyParams = ["username", "password", "hint"];
    res.status(CLIENT_ERROR).send(getMissingParameterMessage(bodyParams));
  } else {
    try {
      let duplicate = await usernameExist(username);
      if (duplicate) {
        res.status(CLIENT_ERROR).send("Username already taken.");
      } else {
        await insertUser(username, password, hint);
        res.send("User successfully added.");
      }
    } catch (error) {
      console.error(error);
      res.status(SERVER_ERROR).send(SERVER_ERROR_MSG);
    }
  }
});

/*
 * Returns the error message that should be shared with the user should there be
 * a code 400 error.
 * @param {object[]} parameters - An array containing objects with the name of
 *                                the field and the value passed.
 * @return {JSON} - The error message that should be returned to the client.
 */
function getMissingParameterMessage(parameters) {
  let response;
  if (parameters.length === 0) {
    response = CLIENT_ERROR_MSG;
  } else {
    response = "Invalid parameters: " + parameters[0];
    for(let index = 1; index < parameters.length; index++) {
      response += ", " + parameters[index];
    }
  }
  return {"error": response};
}

/*
 * Searches the Users database to see if there is a user with the given
 * username and password in the database.
 * @param {string} username - The username for the user to be searched for.
 * @param {string} password - The password for the user to be searched for.
 * @return {object} - A JSON object containing two elements. A boolean whether or not
 *                    the username and password match a user, and a boolean whether
 *                    a username is found without a matching password.
 */
async function checkUserCredintials(username, password) {
  if(await usernameExist(username)) {
    // query for password using username 
    let query = "SELECT password FROM Users WHERE username = ?";
    let [row] = await db.query(query, [username]);
    let storedPassword = row[0]["password"];
    return await bcrypt.compare(password, storedPassword);
  } else {
    return false;
  }
}

/* 
 * Returns true if the username is in the users database already.
 * @param {String} username - The name of the user to check for.
 * @return {int} - True if the username is found and false if not.
 */
async function usernameExist(username) {
  let query = "SELECT COUNT(username) FROM Users WHERE username = ?";
  let placeholders = [username];
  let [rows] = await db.query(query, placeholders);
  let userCount = rows[0]['COUNT(username)'];
  return userCount > 0;
} 

/*
 * Adds the user to the database with the password hashed.
 * @param {String} username - The username to be added for the new user.
 * @param {String} password - The password to be added for the new user.
 * @param {String} hint - The hint to be added for the new user.
 */
async function insertUser(username, password, hint) {
  const hash = bcrypt.hashSync(password, SALT_ROUNDS);
  let placeholders = [username, hash, hint];
  let query = "INSERT INTO Users (username, password, hint) VALUES (?, ?, ?)";
  await db.query(query, placeholders);
}

/*
 * Assigns a user a random session number and returns that number.
 * @param {String} username - The username of the user that will be assigned
 *                            the new session number.
 * @return {int} - The random session number assigned to the user.
 */
async function updateSessionNumber(username) {
  let sessionNumber = getNewSessionNumber();
  let placeholders = [sessionNumber, username];
  let query = "UPDATE Users SET session_number = ? WHERE username = ?";
  await db.query(query, placeholders);
  return sessionNumber;
}

/*
 * Returns a new session number between 0 (inclusive) and 1000000000 (exclusive).
 * @return {int} - A new random session number.
 */
function getNewSessionNumber() {
  let sessionNumber = Math.pow(10, SESSION_NUMBER_LENGTH) * Math.random();
  sessionNumber = Math.floor(sessionNumber);
  return sessionNumber;
}

app.use(express.static("public"));

const PORT = process.env.PORT || 8000;
app.listen(PORT);
