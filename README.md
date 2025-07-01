# Sociedade Secreta

Projeto de cadastro e login com Node.js, Express, PostgreSQL e autenticação JWT.

## Como rodar o projeto

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/seu-repo.git
   cd seu-repo
   ```

2. **Instale as dependências:**
   ```bash
   cd meu-backend
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   - Copie o arquivo `.env.example` para `.env`:
     ```bash
     cp meu-backend/.env.example meu-backend/.env
     ```
   - Edite o arquivo `.env` e preencha com seus dados (NUNCA suba este arquivo para o repositório).

4. **Crie o banco de dados PostgreSQL:**
   - Crie a tabela `usuarios` conforme necessário.

5. **Inicie o backend:**
   ```bash
   npm start
   ```

6. **Acesse o frontend:**
   - Abra os arquivos HTML na pasta `pages` em seu navegador ou sirva-os via um servidor estático.

## Observações

- **NUNCA suba o arquivo `.env` com segredos reais.**
- O arquivo `.env.example` é apenas um modelo, não contém dados sensíveis.
- Não suba a pasta `node_modules/`, apenas `package.json` e `package-lock.json`.
- Revise sempre para não expor informações sensíveis no código ou comentários.

## Variáveis de ambiente

Veja o arquivo `meu-backend/.env.example` para os nomes e exemplos de variáveis necessárias.

---
