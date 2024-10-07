Aquí tienes el archivo `README.md` para tu aplicación:

```markdown
# Backend Challenge API

This is a simple backend application built using Node.js and TypeScript. The app implements JWT-based authentication, a public greetings endpoint, and private endpoints to fetch user data. It has been deployed on [Render.com](https://render.com).

## Features

- JWT authentication (with token expiration).
- Public and private routes.
- Hardcoded users data.
- Deployed to the cloud using Render.com.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed.
- [npm](https://www.npmjs.com/) installed.
- Clone this repository:

```bash
git clone https://github.com/marioportelag/nodejs-app
cd nodejs-app
```

### Installing Dependencies

```bash
npm install
```


### Running the App

For development:

```bash
npm run dev
```

For production:

```bash
npm run start:prod
```

## API Endpoints

Here is a list of all available endpoints:

### Public Endpoints

1. **Greetings Endpoint**  
   **URL**: `GET /greetings`  
   **Response**:
   ```json
   {
     "message": "greetings"
   }
   ```

2. **Login Endpoint**  
   **URL**: `POST /login`  
   **Body**:  
   ```json
   {
     "username": "admin",
     "password": "password"
   }
   ```  
   **Response**:  
   ```json
   {
     "success": true,
     "token": "xxxxxxxxxxxxxxxxxxxxxx"
   }
   ```

### Private Endpoints (Require JWT token)

1. **Get User by ID**  
   **URL**: `GET /users/:id`  
   **Headers**:  
   `Authorization: Bearer <token>`  
   **Response (for user 25)**:
   ```json
   {
     "id": "25",
     "name": "camilo",
     "edad": "28"
   }
   ```

2. **Get All Users**  
   **URL**: `GET /users`  
   **Headers**:  
   `Authorization: Bearer <token>`  
   **Response**:
   ```json
   [
     {
       "id": "25",
       "name": "camilo",
       "edad": "28"
     },
     {
       "id": "26",
       "name": "juan",
       "edad": "32"
     }
   ]
   ```

## Deployment

The app has been deployed to [Render.com](https://render.com).

Render.com was chosen for its ease of use and simplicity when deploying Node.js applications. It offers free hosting for small-scale projects and automates the deployment process by connecting directly with GitHub. This makes it ideal for rapid development and cloud deployment without complex setup.


## Testing the application
The url for the deployed applications is https://practical-test-for-backend.onrender.com

In the root of the project you can find the postman collection (Collection.postman_collection.json) so you can test the application in a easy way.