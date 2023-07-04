# Share-a-Meal API

Welcome to Share-a-Meal API! This API allows you to share meals with others, making it a unique and exciting way to connect with people through the joy of food. Whether you're organizing a potluck, looking for someone to share your culinary masterpiece with, or just want to experience new flavors, Share-a-Meal has got you covered!

Getting Started
To get started with Share-a-Meal API, follow these simple steps:

Prerequisites
Before using the API, make sure you have the following installed:

- Node.js (version 18 or higher)
- MySQL database

Libraries Used
Share-a-Meal API leverages the power of the following libraries:

- express: A powerful web framework for building APIs.
- jsonwebtoken: A library for generating and verifying JSON Web Tokens (JWT).
- Joi: A validation library for ensuring the integrity of data.
- mysql: A MySQL driver for Node.js.
- mysql2: A MySQL client for Node.js with improved performance.
- tracer: A logging library for generating logs.
- dotenv: A library for loading environment variables from a .env file.
- bcrypt: A library for hashing passwords and comparing hashed passwords for secure password storage.
- Chai: An assertion library for testing.
- Mocha: A JavaScript test framework.

Installation
To run the Share-a-Meal API on your local machine, follow these steps:

1. Clone this repository to your local machine.
2. Install the dependencies by running `npm install`.
3. Set up the necessary environment variables. Please refer to the `.env` file for the required variables.
4. Start the API server by running `node app.js` or using npm `npm start dev`.
5. To run the tests of the API use `npm start test`.
6. The API will be accessible at `http://localhost:3000`.

Configuration
Before running the Share-a-Meal API, make sure to create a `.env` file in the root directory of the project. Configure the following environment variables in the `.env` file:

```
DB_HOST=localhost
DB_USER=username
DB_PASSWORD=password
DB_DATABASE=database_name
JWT_SECRET_KEY=your_secret_key
```

API Documentation
For a detailed understanding of the available endpoints and their functionalities, please refer to our comprehensive API documentation created with Postman: [Share-a-Meal API Documentation](https://documenter.getpostman.com/view/26980814/2s93zE3Ko5)

We hope you enjoy using Share-a-Meal API and have a great time sharing meals with others! If you have any questions or feedback, feel free to reach out to us. Happy meal-sharing! 🍔 🥗 🍰
