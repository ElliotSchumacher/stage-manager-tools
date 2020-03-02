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
const CLIENT_ERROR_MSG = "You have made an invalid request";
const SERVER_ERROR = 500;
const SERVER_ERROR_MSG = "There has been an error on the server";
const SESSION_NUMBER_LENGTH = 9;
const SALT_ROUNDS = 10;

/*
 * Checks to see if the given username and password match any user in the system.
 * Type: Post
 * Body: username, password
 * Response type: text
 */
app.post("/login", async function(req, res) {
  res.type("text");
  let username = req.body.username;
  let password = req.body.password;
  if (!username || !password) {
    bodyParams = ["username", "password"];
    res.status(CLIENT_ERROR).send(getMissingParameterMessage(bodyParams));
  } else {
    // Check to see if user 
    checkUserCredintials(username, password);
  }
});

app.post("/signup", async function(req, res) {
  res.type("text");
  let username = req.body.username;
  let password = req.body.password;
  let hint = req.body.hint;
  if (!username || !password || !hint) {
    bodyParams = ["username", "password", "hint"];
    res.status(CLIENT_ERROR).send(getMissingParameterMessage(bodyParams));
  } else {
    try {
      let duplicate = false;
      await bcrpyt.hash(password, SALT_ROUNDS).then(async function(passwordHash) {
        duplicate = await insertUser(username, passwordHash, hint);
      });
      console.log(duplicate);
      
      if (duplicate) {
        res.status(CLIENT_ERROR).send("Username already taken.");
      } else {
        res.send("User successfully added.");
      }
      console.log("End of signup");
      
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
 * @return {string} - The error message that should be returned to the client.
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
  return response;
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
  // hash password
  let hashedPassword = null;
  // query for password using username 
  let query = "SELECT password FROM Users WHERE username = ?";
  let [row] = await db.query(query, [username]);
  // check if hashed password matches stored password
  console.log(row);
  // return true if password match
  
  
}

/* 
 * 
 */
async function usernameExist(username) {
  let [row] = await db.query("SELECT username FROM ");
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

/*
 */
async function insertUser(username, password, hint) {  
  let duplicate = false;
  try {
    let placeholders = [username, password, hint];
    let query = "INSERT INTO Users (username, password, hint) VALUES (?, ?, ?)";
    let [row] = await db.query(query, placeholders);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      console.log("here");
      
      duplicate = true;
    } else {
      console.error(error);
    }
  }
  console.log("Duplicate return: " + duplicate);
  
  return duplicate;
}

app.use(express.static("public"));

const PORT = process.env.PORT || 8000;
app.listen(PORT);
