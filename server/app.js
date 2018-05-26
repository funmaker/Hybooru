import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import http from 'http';
import {router} from "./routes/index";
import {reactMiddleware} from "./helpers/reactHelper";
import HTTPError from "./helpers/HTTPError";

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(compression());
app.use('/static', express.static('static'));
if(process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));
	app.use(require('./helpers/webpackHelper').mount());
} else {
	app.use('/client.js', express.static('client.js'));
	app.use('/style.css', express.static('style.css'));
}

app.use(reactMiddleware);

app.use('/', router);

app.use((req, res, next) => {
	next(new HTTPError(404));
});

// noinspection JSUnusedLocalSymbols
app.use((err, req, res, next) => {
	console.error(err);
	
	const code = err.HTTPcode || 500;
	const result = {};
	result.error = {
		code: code,
		message: err.publicMessage || http.STATUS_CODES[code],
		stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
	};
	res.status(code).react(result);
});

export default app;