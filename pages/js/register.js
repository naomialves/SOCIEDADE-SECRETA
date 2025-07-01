import { escapeHTML } from '../../util.js';

document.getElementById('registerForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const mensagem = document.getElementById('mensagem');
  mensagem.textContent = '';
  mensagem.style.color = "#ffb300";
  mensagem.classList.remove('sucesso', 'erro');
  const btn = this.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Enviando...";

  const data = {
    usuario: document.getElementById('usuario').value,
    email: document.getElementById('email').value,
    senha: document.getElementById('senha').value,
    data_nascimento: document.getElementById('data_nascimento').value,
    genero: document.getElementById('genero').value
  };

  // Validação frontend
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    mensagem.textContent = "Email inválido.";
    mensagem.style.color = "#ff5252";
    btn.disabled = false;
    btn.textContent = "Explore!";
    return;
  }
  if (!data.senha || data.senha.length < 6) {
    mensagem.textContent = "Senha deve ter pelo menos 6 caracteres.";
    mensagem.style.color = "#ff5252";
    btn.disabled = false;
    btn.textContent = "Explore!";
    return;
  }

  try {
    const response = await fetch("/api/register", { // rota padronizada
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (response.ok) {
      mensagem.textContent = escapeHTML(result.message || "Cadastro realizado!");
      mensagem.classList.add('sucesso');
      this.reset();
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1800);
    } else {
      mensagem.textContent = escapeHTML(result.error || "Erro ao cadastrar usuário.");
      mensagem.classList.add('erro');
    }
  } catch (error) {
    mensagem.textContent = "Erro ao cadastrar usuário.";
    mensagem.classList.add('erro');
  }
  btn.disabled = false;
  btn.textContent = "Explore!";
});