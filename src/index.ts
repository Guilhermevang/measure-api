import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import measureRouter from './routes/measures-route';
import { join } from "path";

dotenv.config()
const app = express();

// CORS
app.use(
    cors({
        origin: ["*"],
        credentials: true,
    })
);
// Middlewares do Helmet
app.use(helmet());

app.use(express.json({limit: '200mb'}));
app.use(express.urlencoded({limit: '200mb', extended: true}));

// Rotas
app.use("/api", measureRouter);

app.use("/images", express.static("./content"));

// Servidor
const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;