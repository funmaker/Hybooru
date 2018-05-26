import React from "react";
import ReactDOMServer from 'react-dom/server';
import {StaticRouter} from "react-router";
import index from '../views/index.handlebars';
import App from "../../client/app";
import HTTPError from "./HTTPError";

const removeTags = /[&<>]/g;
const tagsToReplace = {
	'&': "&amp;",
	'<': "&lt;",
	'>': "&gt;",
};

export function reactMiddleware(req, res, next) {
	res.react = initialData => {
		res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
		res.header('Expires', '-1');
		res.header('Pragma', 'no-cache');
		
		switch(req.accepts(['json', 'html'])) {
			case "json":
				res.json(initialData);
				break;
			
			case "html":
				const initialDataJSON = JSON.stringify(initialData).replace(removeTags, tag => tagsToReplace[tag] || tag);
				
				res.send(index({
					reactContent: ReactDOMServer.renderToString(
						<StaticRouter location={req.originalUrl} context={{}}>
							<App initialData={initialData}/>
						</StaticRouter>,
					),
					initialData: initialDataJSON,
					production: process.env.NODE_ENV === 'production',
				}));
				break;
			
			default:
				throw new HTTPError(406);
		}
	};
	next();
}
