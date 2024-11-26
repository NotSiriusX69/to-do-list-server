import { Connection } from "tedious";
import { retrieveConfig } from "./connection.js";
import { Request, TYPES } from "tedious";

// Check if the user exists and validate the password (without hashing)
export async function checkUserExistence(username, password) {
  const config = await retrieveConfig();

  return new Promise((resolve, reject) => {
    const connection = new Connection(config);

    connection.on("connect", (err) => {
      if (err) return reject(new Error(`Connection error: ${err.message}`));

      const query = `SELECT Username FROM Users WHERE Username = @Username AND Password = @Password`;
      const request = new Request(query, (err, rowCount) => {
        connection.close(); // Ensure the connection is always closed
        if (err) return reject(new Error(`Query error: ${err.message}`));
        resolve(rowCount > 0); // Return true if user exists
      });

      request.addParameter("Username", TYPES.NVarChar, username);
      request.addParameter("Password", TYPES.NVarChar, password);

      connection.execSql(request);
    });

    connection.connect();
  });
}

// Get UserID based on Username
export async function getUserID(username) {
  const config = await retrieveConfig();

  return new Promise((resolve, reject) => {
    const connection = new Connection(config);

    connection.on("connect", (err) => {
      if (err) return reject(new Error(`Connection error: ${err.message}`));

      const query = `SELECT UserID FROM Users WHERE Username = @Username`;
      let userID;

      const request = new Request(query, (err) => {
        connection.close();
        if (err) return reject(new Error(`Query error: ${err.message}`));
      });

      request.on("row", (columns) => {
        userID = columns.find((col) => col.metadata.colName === "UserID").value;
      });

      request.on("requestCompleted", () => resolve(userID || null));

      request.addParameter("Username", TYPES.NVarChar, username);
      connection.execSql(request);
    });

    connection.connect();
  });
}

// Get Username based on UserID
export async function getUsername(userID) {
  const config = await retrieveConfig();

  return new Promise((resolve, reject) => {
    const connection = new Connection(config);

    connection.on("connect", (err) => {
      if (err) return reject(new Error(`Connection error: ${err.message}`));

      const query = `SELECT Username FROM Users WHERE userID = @userID`;
      let userName;

      const request = new Request(query, (err) => {
        connection.close();
        if (err) return reject(new Error(`Query error: ${err.message}`));
      });

      request.on("row", (columns) => {
        userName = columns.find(
          (col) => col.metadata.colName === "Username"
        ).value;
      });

      request.on("requestCompleted", () => resolve(userName || null));

      request.addParameter("UserID", TYPES.Int, userID);
      connection.execSql(request);
    });

    connection.connect();
  });
}

// create new user in the database
export async function createNewUser(username, email, password) {
  const config = await retrieveConfig();

  return new Promise((resolve, reject) => {
    const connection = new Connection(config);

    connection.on("connect", (err) => {
      if (err) return reject(new Error(`Connection error: ${err.message}`));

      const query = `INSERT INTO Users (Username, Email, Password) VALUES (@Username, @Email, @Password)`;

      const request = new Request(query, (err) => {
        connection.close();
        if (err) return reject(new Error(`Query error: ${err.message}`));
        resolve(true);
      });

      request.addParameter("Username", TYPES.NVarChar, username);
      request.addParameter("Email", TYPES.NVarChar, email);
      request.addParameter("Password", TYPES.NVarChar, password);

      connection.execSql(request);
    });

    connection.connect();
  });
}

// retrieve tasks of user based on userID
export async function getUserTasks(userID) {
  const config = await retrieveConfig();

  return new Promise((resolve, reject) => {
    const connection = new Connection(config);

    connection.on("connect", (err) => {
      if (err) return reject(new Error(`Connection error: ${err.message}`));

      const query = `SELECT TaskID, Name, Description FROM Tasks WHERE UserID = @UserID`;
      const tasks = [];

      const request = new Request(query, (err) => {
        connection.close();
        if (err) return reject(new Error(`Query error: ${err.message}`));
      });

      request.on("row", (columns) => {
        const task = columns.reduce((obj, col) => {
          obj[col.metadata.colName] = col.value;
          return obj;
        }, {});
        tasks.push(task);
      });

      request.on("requestCompleted", () => resolve(tasks));

      request.addParameter("UserID", TYPES.Int, userID);
      connection.execSql(request);
    });

    connection.connect();
  });
}

// Create Task
export async function createTask(userID, name, description) {
  const config = await retrieveConfig();

  return new Promise((resolve, reject) => {
    const connection = new Connection(config);

    connection.on("connect", (err) => {
      if (err) {
        console.error("Connection Error:", err); // Log connection errors
        return reject(new Error(`Connection Error: ${err}`));
      }

      console.log("Database connected - createTask"); // Log successful connection

      const query = `INSERT INTO Tasks (UserID, Name, Description) VALUES (@UserID, @Name, @Description)`;

      const request = new Request(query, (err) => {
        connection.close();
        if (err) {
          console.error("Query Error:", err); // Log query errors
          return reject(new Error(`Query Error: ${err}`));
        }
        console.log("Task inserted successfully"); // Log success
        resolve(true);
      });

      request.addParameter("UserID", TYPES.Int, userID);
      request.addParameter("Name", TYPES.NVarChar, name);
      request.addParameter("Description", TYPES.NVarChar, description);

      connection.execSql(request);
    });

    connection.connect();
  });
}

// Update Task
export async function updateTask(taskID, name, description) {
  const config = await retrieveConfig();

  return new Promise((resolve, reject) => {
    const connection = new Connection(config);

    connection.on("connect", (err) => {
      if (err) {
        console.error("Connection Error:", err); // Log connection errors
        return reject(new Error(`Connection Error: ${err}`));
      }

      console.log("Database Connected - updateTask");

      const query = `UPDATE Tasks SET Name = @Name, Description = @Description WHERE TaskID = @TaskID`;

      const request = new Request(query, (err) => {
        connection.close();

        if (err) {
          console.error("Query Error: ", err);
          return reject(new Error(`Query Error: ${err}`));
        }

        console.log("Task updated successfully"); // Log success
        resolve(true);
      });

      request.addParameter("TaskID", TYPES.Int, taskID);
      request.addParameter("Name", TYPES.NVarChar, name);
      request.addParameter("Description", TYPES.NVarChar, description);

      connection.execSql(request);
    });

    connection.connect();
  });
}

// get Task by ID
export async function getTaskInfo(taskID) {
  const config = await retrieveConfig();

  return new Promise((resolve, reject) => {
    const connection = new Connection(config);

    connection.on("connect", (err) => {
      if (err) {
        console.log(`Connection error: ${err.message}`);
        return reject(new Error(`Connection error: ${err.message}`));
      }

      const query = `SELECT Name, Description FROM Tasks WHERE TaskID = @TaskID`;
      let task = {};

      const request = new Request(query, (err) => {
        connection.close();
        if (err) {
          console.log(`Query error: ${err.message}`);
          return reject(new Error(`Query error: ${err.message}`));
        }
      });

      request.on("row", (columns) => {
        task = columns.reduce((obj, col) => {
          obj[col.metadata.colName] = col.value;
          return obj;
        }, {});
      });

      request.on("requestCompleted", () => resolve(task));

      request.addParameter("TaskID", TYPES.Int, taskID);
      connection.execSql(request);
    });

    connection.connect();
  });
}

// Delete Task By ID
export async function deleteTaskByID(id) {
  const config = await retrieveConfig();

  return new Promise((resolve, reject) => {
    const connection = new Connection(config);

    connection.on("connect", (err) => {
      if (err) {
        console.error("Connection error:", err.message);
        return reject(err);
      }

      console.log("Connected to the database - deleteTaskByID");

      const query = `DELETE FROM Tasks WHERE TaskID = @TaskID`;
      const request = new Request(query, (err) => {
        connection.close(); // Ensure connection is closed
        if (err) {
          console.error("Query error:", err.message);
          return reject(err);
        }
        console.log("Task deleted successfully");
        resolve(true);
      });

      request.addParameter("TaskID", TYPES.Int, id);
      connection.execSql(request);
    });

    connection.on("error", (err) => {
      console.error("Connection error:", err.message);
      reject(err);
    });

    connection.connect();
  });
}
