import path from 'node:path';
import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import './models';
import { rotaNaoEncontrada, tratarErros } from './middlewares/error.middleware';
import { routes } from './routes';

z.config(z.locales.pt());

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', routes);
app.use('/api', rotaNaoEncontrada);

app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'] }));

app.use(rotaNaoEncontrada);
app.use(tratarErros);
