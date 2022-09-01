// config database
import database from './config/database';
// starting express app
import initApp from './config/express';

const app = initApp();

// starting server
const serv = async () => {
  try {
    // database init
    await database();
    console.log('database connected');
    // run server
    app.listen(process.env.PORT ?? 3000);
    console.log("server started on port", process.env.PORT || 3000);
  } catch (err: unknown) {
    console.log(err)
  }
};

serv();