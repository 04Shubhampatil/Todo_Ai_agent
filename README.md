# TaskMaster AI - Todo Agent Web App

TaskMaster AI is a sophisticated, web-based intelligent agent designed to manage your daily tasks. Instead of manual forms and buttons, you interact entirely with an embedded AI Agent powered by Mistral AI, which interprets your commands and securely executes full CRUD operations on your PostgreSQL database.

## Features ✨
- **Conversational Interface**: Fully chat-driven input. Just say "Add a task to buy groceries" or "Update task 2 to something else."
- **Full CRUD Capabilities**: The Agent dynamically calls database operations underneath the hood to Create, Read, Update, and Delete your tasks.
- **Mistral AI Powered**: Utilizes `@mistralai/mistralai` logic in a continuous background loop to understand context, plan actions, run necessary backend functions, and converse smoothly.
- **Premium UI/UX**: Rendered securely on EJS templates. It features modern Glassmorphism, smooth animations, dynamic dark-mode gradients, and auto-scrolling chat views.
- **Drizzle ORM Integration**: High-performance type-safe PostgreSQL interactions.

## Tech Stack 🛠️
- **Backend:** Node.js, Express.js
- **Frontend:** EJS (Embedded JavaScript), Vanilla CSS3 / HTML5
- **Database:** PostgreSQL (via Docker Compose) and Drizzle ORM
- **AI Integration:** Mistral AI

## Getting Started 🚀

### 1. Prerequisites
Ensure you have the following installed to run this project:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [Docker](https://www.docker.com/) (For running PostgreSQL locally)
- A Mistral API Key.

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/04Shubhampatil/Todo_Ai_agent.git
cd Todo_Ai_agent
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory (or update the existing one) with the following variables:
```env
API_KEY=your_mistral_api_key_here
DATABASE_URL=postgres://postgres:admin@localhost:5432/todo
PORT=3000
```

### 4. Database Setup
Start up a local PostgreSQL instance via Docker using the provided compose file:
```bash
docker-compose up -d
```

Run Drizzle database migrations and schema generation:
```bash
npm run generate
npm run migrate
```
*(Optional)* You can visually inspect the database using Drizzle Studio:
```bash
npm run studio
```

### 5. Start the Application
Boot up the TaskMaster AI server:
```bash
npm start
```
Go to [http://localhost:3000](http://localhost:3000) in your browser and start chatting with your AI task assistant!

## Usage Examples 🤖
Try entering these prompts into the TaskMaster AI:
- *"Show me my current tasks."*
- *"Add a task to pick up the dry cleaning tomorrow."*
- *"I finished task number 1, you can delete it."*
- *"Update task 3 to say 'Buy oat milk' instead."*

## License
ISC
