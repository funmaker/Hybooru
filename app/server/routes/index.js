import os from 'os';
export const router = require('express-promise-router')();

router.get('/', (req, res) => {
    const initialData = {};

    initialData.kek = `Welcome to boilerplate on ${os.hostname()}!`;

    res.react(initialData);
});

