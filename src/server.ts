import express from "express";
import {services} from "./decorators";
import * as middleware from "./middleware";

import "./services"

export const app = express();

Object.values(middleware).forEach(one => app.use(one));
app.use(services);

const {PORT = 3000} = process.env;

app.listen(PORT, () =>
  console.log(`Server is running http://localhost:${PORT}...`)
);
