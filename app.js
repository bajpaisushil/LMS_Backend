import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user.route.js';
import courseRoutes from './routes/course.route.js';
import paymentRoutes from  './routes/payment.route.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import morgan from 'morgan';
import { config } from 'dotenv';
config();

const app=express();
app.use(express.json());
console.log(process.env.FRONTEND_URL);
app.use(cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true
}))
// app.use(cors());
app.use(morgan('dev'))
app.use(cookieParser());
app.use('/ping', (req, res)=>{
    res.send('Pong');
})
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/payments', paymentRoutes);

app.all('*', (req, res)=>{
    res.status(404).send('OOPS! 404 Page not found');
})
app.use(errorMiddleware);


export default app;
