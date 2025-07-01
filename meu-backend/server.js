import dotenv from "dotenv";
import bcrypt from "bcrypt";
import express from "express";
import cors from "cors";
import pg from "pg";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./auth.js";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import timeout from "connect-timeout";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const { Pool } = pg;

const app = express();

// Necessário para usar __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir arquivos estáticos da pasta 'pages'
app.use(express.static(path.join(__dirname, "../pages")));

// Rota para servir a página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../pages/paginainicial.html"));
});

// CORS restrito (ajuste para seu domínio real em produção)
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Rate limiting (protege contra brute force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite por IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Limite de tamanho do JSON recebido
app.use(express.json({ limit: "100kb" }));

// Helmet com CSP configurado e headers extras
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://unpkg.com"],
    styleSrc: ["'self'", "https://fonts.googleapis.com", "https://unpkg.com", "'unsafe-inline'"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:"],
    connectSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  }
}));
app.use(helmet.referrerPolicy({ policy: "strict-origin-when-cross-origin" }));
app.use(helmet.frameguard({ action: "deny" }));
app.use(helmet.noSniff());
app.use(helmet.xssFilter());

// Remove o header X-Powered-By
app.disable("x-powered-by");

// Timeout para evitar DoS
app.use(timeout("10s"));

app.use(morgan('dev'));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Forçar HTTPS em produção
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
});

// Use a variável de ambiente DATABASE_URL do Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use("/api", authRoutes(pool));

// Tratamento de erros genéricos
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    res.status(500).json({ error: "Erro interno do servidor." });
  } else {
    res.status(500).json({ error: err.message });
  }
});

export default app;
app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor rodando!");
});