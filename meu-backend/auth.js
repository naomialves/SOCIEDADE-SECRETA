import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";

const router = express.Router();

// Simples controle de tentativas de login por IP (memória, reinicia ao reiniciar o servidor)
const loginAttempts = {};
const MAX_ATTEMPTS = 5;
const BLOCK_TIME = 15 * 60 * 1000; // 15 minutos

function isBlocked(ip) {
  const entry = loginAttempts[ip];
  if (!entry) return false;
  if (entry.blockedUntil && Date.now() < entry.blockedUntil) return true;
  if (entry.blockedUntil && Date.now() >= entry.blockedUntil) {
    delete loginAttempts[ip];
    return false;
  }
  return false;
}

function registerFailedAttempt(ip) {
  if (!loginAttempts[ip]) loginAttempts[ip] = { count: 0, blockedUntil: null };
  loginAttempts[ip].count++;
  if (loginAttempts[ip].count >= MAX_ATTEMPTS) {
    loginAttempts[ip].blockedUntil = Date.now() + BLOCK_TIME;
  }
}

function resetAttempts(ip) {
  delete loginAttempts[ip];
}

// Função de validação centralizada e completa
function validarCadastro({
  usuario, email, senha, data_nascimento, genero
}) {
  if (!usuario || usuario.length < 2 || !validator.isAlphanumeric(validator.blacklist(usuario, ' '), 'pt-BR')) return "Nome de usuário inválido.";
  if (!validator.isEmail(email || "")) return "Email inválido.";
  if (!senha || senha.length < 6) return "Senha deve ter pelo menos 6 caracteres.";
  if (!data_nascimento || !validator.isDate(data_nascimento)) return "Data de nascimento obrigatória.";
  if (!genero) return "Gênero obrigatório.";
  return null;
}

export default (pool) => {
  router.post("/register", async (req, res) => {
    // Sanitização
    const usuario = validator.trim(validator.escape(req.body.usuario || ""));
    const email = validator.normalizeEmail(req.body.email || "");
    const senha = req.body.senha || "";
    const data_nascimento = req.body.data_nascimento || "";
    const genero = validator.escape(req.body.genero || "");

    const erroValidacao = validarCadastro({
      usuario, email, senha, data_nascimento, genero
    });
    if (erroValidacao) return res.status(400).json({ error: erroValidacao });

    try {
      const exists = await pool.query(
        "SELECT 1 FROM usuarios WHERE usuario = $1 OR email = $2",
        [usuario, email]
      );
      if (exists.rows.length > 0) {
        return res.status(400).json({ error: "Usuário ou email já cadastrado." });
      }
      const senhaHash = await bcrypt.hash(senha, 12); // rounds aumentados
      await pool.query(
        `INSERT INTO usuarios 
        (usuario, email, senha, data_nascimento, genero)
        VALUES ($1,$2,$3,$4,$5)`,
        [usuario, email, senhaHash, data_nascimento, genero]
      );
      res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
    } catch (err) {
      res.status(500).json({ error: "Erro ao cadastrar usuário." });
    }
  });

  router.post("/login", async (req, res) => {
    const ip = req.ip;
    if (isBlocked(ip)) {
      return res.status(429).json({ error: "Muitas tentativas. Tente novamente mais tarde." });
    }
    // Sanitização
    const usuario = validator.trim(validator.escape(req.body.usuario || ""));
    const senha = req.body.senha || "";
    try {
      const result = await pool.query(
        "SELECT id, usuario, senha FROM usuarios WHERE usuario = $1 OR email = $1",
        [usuario]
      );
      if (result.rows.length === 0) {
        registerFailedAttempt(ip);
        return res.status(401).json({ error: "Usuário ou senha inválidos." });
      }
      const { id, usuario: nomeUsuario, senha: senhaHash } = result.rows[0];
      const senhaCorreta = await bcrypt.compare(senha, senhaHash);
      if (!senhaCorreta) {
        registerFailedAttempt(ip);
        return res.status(401).json({ error: "Usuário ou senha inválidos." });
      }
      resetAttempts(ip);
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: "Configuração de segurança ausente." });
      }
      // Gera JWT seguro
      const token = jwt.sign(
        { id, usuario: nomeUsuario },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
      // Envia o token em cookie httpOnly e também no corpo da resposta
      res.cookie("ss_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000
      });
      res.json({ message: "Login realizado com sucesso!", token });
    } catch (err) {
      res.status(500).json({ error: "Erro ao tentar fazer login." });
    }
  });

  // Exemplo de rota protegida
  router.get("/perfil", async (req, res) => {
    const token = req.cookies.ss_token || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Não autorizado." });
    try {
      if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET não definido");
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      // Buscar dados do usuário se quiser
      res.json({ usuario: payload.usuario, id: payload.id });
    } catch {
      res.status(401).json({ error: "Token inválido ou expirado." });
    }
  });

  return router;
};
