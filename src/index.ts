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

// app.get("/", async (req: express.Request, res: express.Response) => {
//     try {
//         res.send(
//             "Shopper"
//         );
//     } catch (err) {
//         console.log(err);
//     }
// });

// Rotas
app.use("/api", measureRouter);

app.use("/images", express.static(join(__dirname, "content")))

// Resposta para requisições que não existem
app.use(async (_, res: express.Response) => {
    res.status(404);
});

// Servidor
const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;