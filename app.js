import { eq } from "drizzle-orm";
import { Mistral } from "@mistralai/mistralai";
import express from "express";
import "dotenv/config";

import { db } from "./db/index.js";
import { todosTable } from "./db/schema.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());
app.set('view engine', 'ejs');

const client = new Mistral({
    apiKey: process.env.API_KEY,
});

async function getAllTodos() {
    const todos = await db.select().from(todosTable);
    return todos;
}

async function createTodo(todo) {
    const [result] = await db
        .insert(todosTable)
        .values({
            todo,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .returning({ id: todosTable.id });

    return result.id;
}

async function deleteById(id) {
    await db.delete(todosTable).where(eq(todosTable.id, Number(id)));
    return "Deleted successfully";
}

async function getTodoById(id) {
    const [todo] = await db.select().from(todosTable).where(eq(todosTable.id, Number(id)));
    return todo ?? null;
}

async function updateTodo(input) {
    const { id, todo } = input;
    await db.update(todosTable)
        .set({ todo, updatedAt: new Date() })
        .where(eq(todosTable.id, Number(id)));
    return "Updated successfully";
}

const tools = {
    getAllTodos,
    createTodo,
    deleteById,
    getTodoById,
    updateTodo,
};

const SYSTEM_PROMPT = `
You are an AI To-Do List Assistant with START, PLAN, ACTION, OBSERVATION, and OUTPUT states.
Wait for the user prompt and first PLAN using the available tools.
After planning, perform the action with appropriate tools and wait for OBSERVATION.
Based on the ACTION and OBSERVATION, return the AI response according to the START prompt.
You can manage tasks by adding, viewing, updating, and deleting. You must strictly follow the JSON output format.

Todo DB Schema:
id: int and primary key
todo: string
createdAt: Date Time
updatedAt: Date Time

Available Tools:
- getAllTodos(): Returns all todos from the database
- createTodo(todo: string): Creates a new todo in the database
- deleteById(id: string): Deletes a todo by id
- getTodoById(id: string): Gets a single todo by id
- updateTodo(input: { id: string, todo: string }): Updates an existing todo by providing its id and the new task string

Example:
START
{"type":"user","user":"Add a task for shopping groceries"}
{"type":"plan","plan":"I will ask for the grocery items before creating the todo"}
{"type":"output","output":"Can you tell me what items you want to shop for?"}
{"type":"user","user":"I want to shop for milk, eggs, and bread"}
{"type":"plan","plan":"I will use createTodo to create a new todo in the database"}
{"type":"action","function":"createTodo","input":"Shopping for milk, eggs, and bread"}
{"type":"observation","observation":"2"}
{"type":"output","output":"Todo added successfully"}
{"type":"user","user":"Update task 2 to only buy milk"}
{"type":"plan","plan":"I will use updateTodo to modify task 2"}
{"type":"action","function":"updateTodo","input":{"id":"2","todo":"Buy milk"}}
{"type":"observation","observation":"Updated successfully"}
{"type":"output","output":"I have updated the task to 'Buy milk'."}
END
`;

const messages = [{ role: "system", content: SYSTEM_PROMPT }];

async function processChatMessage(userMsg) {
    const userMessage = {
        type: "user",
        user: userMsg,
    };

    messages.push({ role: "user", content: JSON.stringify(userMessage) });

    while (true) {
        let chat;
        try {
            chat = await client.chat.complete({
                model: "mistral-small-latest",
                messages,
                responseFormat: { type: "json_object" },
            });
        } catch (error) {
            console.error("AI Error:", error.message);
            return "Sorry, I am having trouble connecting to the service. Please try again later.";
        }

        const result = chat.choices[0].message.content;
        messages.push({ role: "assistant", content: result });

        let action;
        try {
            action = JSON.parse(result);
        } catch (error) {
            console.error("JSON Parse Error:", error.message);
            messages.push({ role: "user", content: JSON.stringify({ type: "error", error: "Invalid JSON format received from model" }) });
            continue;
        }

        if (action.type === "output") {
            return action.output;
        }

        if (action.type === "action") {
            const fn = tools[action.function];

            if (!fn) {
                const errorMessage = `Invalid tool call: ${action.function}`;
                console.error(errorMessage);
                messages.push({ role: "user", content: JSON.stringify({ type: "observation", observation: errorMessage }) });
                continue;
            }

            let observation;
            try {
                observation = await fn(action.input);
                if (typeof observation !== 'string' && typeof observation !== 'number') {
                    observation = JSON.stringify(observation);
                }
            } catch (error) {
                console.error(`Tool Error (${action.function}):`, error.message);
                observation = `Error: ${error.message}`;
            }

            const observationMessage = {
                type: "observation",
                observation,
            };

            messages.push({ role: "user", content: JSON.stringify(observationMessage) });
        } else if (action.type === "plan") {
            // Mistral returned a plan, we should send it back asking for an action or output according to strategy
            // But Mistral usually chains these or needs another completion. If we reach here, and not output/action,
            // we loop again. But we shouldn't push anything to messages if it's just a plan?
            // Actually, in the original code: 
            // `if (action.type === "action") {...} else { messages.push({ role: "user", content: error...}); }`
            // Wait, in the CLI app, if it was a "plan", it considered it an unexpected type?
            // Let's modify the CLI app logic slightly to let Mistral continue if it's a plan.
            // A plan does not require user input, we just let it generate the next action.
            // But the CLI only gave `user` role back if there was error.
            // Let's just push an empty observation for 'plan' to prompt next step.
            messages.push({ role: "user", content: JSON.stringify({ type: "observation", observation: "Proceed with the planned action or output." }) });
        } else {
            const errorMessage = `Unexpected action type: ${action.type}`;
            console.error(errorMessage);
            messages.push({ role: "user", content: JSON.stringify({ type: "observation", observation: errorMessage }) });
        }
    }
}

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        const reply = await processChatMessage(message);
        res.json({ reply });
    } catch (error) {
        console.error("Chat routing error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(port, () => {
    console.log(`🚀 AI Agent Server running at http://localhost:${port}`);
});
