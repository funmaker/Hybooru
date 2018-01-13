import express from "express";
import expressHandlebars from 'express-handlebars';
import * as webpackHelper from "./server/helpers/webpackHelper";

const app = express();
const hbs = expressHandlebars.create({});

if (process.env.NODE_ENV !== 'production') {
    console.log('DEVOLOPMENT ENVIRONMENT: Turning on WebPack Middleware...');
    webpackHelper.useWebpackMiddleware(app)
} else {
    console.log('PRODUCTION ENVIRONMENT');
    app.use('/client.bundle.js', express.static('client.bundle.js'));
    app.use('/style.bundle.css', express.static('style.bundle.css'));
}

app.use('static', express.static('static'));

app.use(require('./server/helpers/reactHelper').reactMiddleware);

app.use('/', require("./server/routes/index"));

const port = process.env.DOCKERIZED ? 80 : 3000;
app.listen(port);
console.log(`Listening on port ${port}`);