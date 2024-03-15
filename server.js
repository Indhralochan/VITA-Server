const express = require('express');
const { request, response } = require('./app');
const app = require("./app");

const port = 4000;

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});