import { escapeHTML } from '../../util.js';

document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const mensagem = document.getElementById('mensagem');
  mensagem.textContent = '';
  mensagem.style.color = "#ffb300";
  mensagem.classList.remove('sucesso', 'erro');
  const btn = this.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Entrando...";

  const usuario = document.getElementById('usuario').value;
  const senha = document.getElementById('senha').value;

  if (!usuario || usuario.length < 2) {
    mensagem.textContent = "Usuário inválido.";
    mensagem.classList.add('erro');
    btn.disabled = false;
    btn.textContent = "Login";
    return;
  }
  if (!senha || senha.length < 6) {
    mensagem.textContent = "Senha deve ter pelo menos 6 caracteres.";
    mensagem.classList.add('erro');
    btn.disabled = false;
    btn.textContent = "Login";
    return;
  }

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha })
    });

    const result = await response.json();

    if (response.ok) {
      mensagem.classList.add('sucesso');
      mensagem.textContent = 'Login realizado com sucesso!';
      setTimeout(() => {
        window.location.href = 'paginainicial.html';
      }, 1200);
      // Não armazene token no localStorage/sessionStorage!
    } else {
      mensagem.classList.add('erro');
      mensagem.textContent = escapeHTML(result.error || 'Usuário ou senha inválidos.');
    }
  } catch (error) {
    mensagem.classList.add('erro');
    mensagem.textContent = 'Erro ao tentar fazer login.';
  }
  btn.disabled = false;
  btn.textContent = "Login";
});
