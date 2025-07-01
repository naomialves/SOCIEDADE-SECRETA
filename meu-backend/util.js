// Função para escapar HTML (evita XSS em mensagens)
export function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, function(m) {
    return ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m];
  });
}
