import React from "react";
import subdomain from 'express-subdomain';
import ReactDOMServer from 'react-dom/server';
import {StaticRouter} from "react-router";
import index from '../views/index.handlebars';
import App from "../../client/app";

const removeTags = /[&<>]/g;
const tagsToReplace = {
    '&': "&amp;",
    '<': "&lt;",
    '>': "&gt;",
};

export const apiSubdomain = subdomain('api', (req, res, next) => {
    req.api = true;
    next();
});

export function reactMiddleware(req, res, next) {
    res.react = initialData => {
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');

        if(req.api) {
            res.json(initialData)
        } else {
            const initialDataJSON = JSON.stringify(initialData).replace(removeTags, tag => tagsToReplace[tag] || tag);

            res.send(index({
                reactContent: ReactDOMServer.renderToString(
                    <StaticRouter location={req.originalUrl} context={{}}>
                        <App initialData={initialData} />
                    </StaticRouter>
                ),
                initialData: initialDataJSON,
                production: process.env.NODE_ENV === 'production',
            }));
        }
    };
    next();
}
