import express from "express";
import session from "express-session";
import cors from "cors";
import {
  checkUserExistence,
  createNewUser,
  getUserID,
  getUserTasks,
  deleteTaskByID,
  createTask,
  updateTask,
  getTaskInfo,
  getUsername,
} from "./database/queries.js";

const app = express();
const corsOptions = {
  origin:
    "http://localhost:5173/",
  credentials: true,
};

app.use(
  session({
    secret: "test", // to be changed for a more secure approach
    name: "user-session",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // for https
      maxAge: 60000 * 60 * 60, // age of cookie
      httpOnly: true, // prevent js access
    }, // for production set to true
  })
);

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  console.log(req.session);
});

app.get("/check-session", (req, res) => {
  if (req.session && req.session.isLoggedIn) {
    return res.status(200).json({ isLoggedIn: true });
  } else {
    return res.status(401).json({ isLoggedIn: false });
  }
});

app.get("/get-username", async (req, res) => {
  try {
    if (req.session && req.session.isLoggedIn) {
      const username = await getUsername(req.session.userID);

      return res.status(200).json({ username });
    } else {
      return res.status(401).json({ message: "unAuthorized" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the user exists with the provided username and password
    const userExists = await checkUserExistence(username, password);
    console.log("user ", userExists);

    if (!userExists) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    req.session.isLoggedIn = true;
    req.session.username = username;

    const userID = await getUserID(req.session.username);

    req.session.userID = userID;

    return res.status(200).json({ isLoggedIn: true });
  } catch (err) {
    console.error("Error in login route:", err);
    res
      .status(500)
      .json({ message: "Internal Server Error - checkUsernameExistence" });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userCreated = await createNewUser(username, email, password);
    console.log(userCreated);

    if (!userCreated) {
      return res.status(400).json({ message: "Error creating user" });
    }

    // try catch for getting user ID
    try {
      const userID = await getUserID(username);
      if (userID) {
        req.session.userID = userID;
      } else {
        res.status(401).json({ message: "UserID not Found - getUserID" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error - getUserID" });
    }

    // create session for created user
    req.session.isLoggedIn = true;
    req.session.username = username;

    return res.status(200).json({ isLoggedIn: true });
  } catch (error) {
    console.error("Error in signup route:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/logout", (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ message: "Logout Failed" });
      }

      res.clearCookie("user-session");
      res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/get-tasks", async (req, res) => {
  try {
    if (!req.session.userID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const tasks_data = await getUserTasks(req.session.userID);

    return res.status(200).json({ tasks_data });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error - get-tasks" });
  }
});

app.post("/create-task", async (req, res) => {
  try {
    if (!req.session.userID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const UserID = req.session.userID;
    const taskData = req.body;

    console.log(req.session);

    const isCreated = await createTask(
      UserID,
      taskData.taskName,
      taskData.taskDescription
    );

    if (isCreated) {
      return res.status(200).json({ message: "Task Created Succesfully" });
    } else {
      return res.status(500).json({ message: "Task Creation Failed" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put("/update-task/:task_id", async (req, res) => {
  try {
    const task_id = Number(req.params.task_id);
    const { updatedTaskName, updatedTaskDesc } = req.body;
    console.log(updatedTaskName, " ", updatedTaskDesc);

    if (!req.session.userID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isUpdated = await updateTask(
      task_id,
      updatedTaskName,
      updatedTaskDesc
    );

    if (isUpdated) {
      return res.status(200).json({ message: "Task Updated Succesfully" });
    } else {
      return res.status(500).json({ message: "Task Update Failed" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/delete-task/:task_id", async (req, res) => {
  const { task_id } = req.params;
  try {
    const deleteTask = await deleteTaskByID(task_id);
    console.log("TEst", deleteTask);
    if (deleteTask) {
      return res.status(200).json({ message: "Task Deleted" });
    }
    return res.status(500).json({ message: "Error in deleting task" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error - get-tasks" });
  }
});

app.get("/get-task/:task_id", async (req, res) => {
  try {
    const task_id = Number(req.params.task_id);
    if (!req.session.userID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const task_data = await getTaskInfo(task_id);

    if (task_data) {
      return res.status(200).json({ task_data });
    } else {
      return res.status(500).json({ message: "Task retrieval Failed" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
