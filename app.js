const express = require("express");

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Started.... :<)");
    });
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
};
initializeDBServer();

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const convertObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `
                SELECT * 
                    FROM todo 
                WHERE 
                    category='${category}' and priority='${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(data.map((eachItem) => convertObject(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
                SELECT *
                        FROM todo
                    WHERE 
                        category='${category}' and status='${status}';`;
          data = await db.all(getTodosQuery);
          response.send(data.map((eachItem) => convertObject(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    case hasSearchProperty(request.query):
      getTodosQuery = `
                SELECT *
                    FROM todo
                WHERE todo like '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      response.send(data.map((eachItem) => convertObject(eachItem)));

      break;

    case hasPriorityAndStatusProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
                SELECT *
                    FROM todo  
                WHERE
                 status = '${status}' AND priority = '${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(data.map((eachItem) => convertObject(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `
        SELECT *
            FROM todo 
        WHERE 
            priority = '${priority}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachItem) => convertObject(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `
        SELECT *
            FROM todo 
        WHERE 
            status = '${status}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachItem) => convertObject(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `
            SELECT *
                FROM todo
            WHERE 
                category='${category}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachItem) => convertObject(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      getTodosQuery = `
      SELECT * 
        FROM todo;`;
      data = await db.all(getTodosQuery);
      response.send(data.map((eachItem) => convertObject(eachItem)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT *
        FROM todo
    WHERE id=${todoId};`;
  const getTodoResponse = await db.get(getTodoQuery);
  response.send(convertObject(getTodoResponse));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const dateQuery = `
        SELECT *
            FROM todo
        WHERE due_date='${newDate}';`;
    const dateResponse = await db.all(dateQuery);
    response.send(dateResponse.map((eachItem) => convertObject(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || priority === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `
                INSERT INTO
                    todo (id, todo, category, priority, status, due_date)
                VALUES
                    (${id}, '${todo}', '${category}', '${priority}', '${status}', '${postDueDate}') `;
          await db.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  const previousTodoQuery = `
    SELECT *
        FROM todo
    WHERE id=${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updateTodoQuery = null;
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
                UPDATE todo SET
                    todo='${todo}', priority='${priority}', status='${status}', category='${category}',
                    due_date='${dueDate}'
                WHERE id=${todoId};`;

        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = `
        UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
        due_date='${dueDate}' WHERE id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send(`Priority Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case requestBody.todo !== undefined:
      updateTodoQuery = `
          UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',due_date='${dueDate}'
          WHERE id=${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
          UPDATE todo SET
                    todo='${todo}', priority='${priority}', status='${status}', category='${category}',
                    due_date='${dueDate}' WHERE id=${todoId};`;

        await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
        UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
        due_date='${newDueDate}'
        WHERE
            id=${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }

      break;
  }
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
        todo
    WHERE
        id = ${todoId}`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
