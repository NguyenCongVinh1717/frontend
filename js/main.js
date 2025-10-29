// js/main.js
// Small helpers: messages and logout

function ensureMsgBox() {
  let el = document.getElementById('message');
  if (!el) {
    el = document.createElement('div');
    el.id = 'message';
    el.className = 'msg';
    el.setAttribute('role','status');
    el.setAttribute('aria-live','polite');
    el.innerHTML = '<div class="title"></div><div class="body"></div>';
    document.body.appendChild(el);
  }
  return el;
}

function _showMessage(text, {type='success', title=null, duration=3000} = {}){
  const el = ensureMsgBox();
  el.classList.remove('success','error','visible');
  el.querySelector('.title').textContent = title || (type==='error' ? 'Error' : 'Success');
  el.querySelector('.body').textContent = text || '';
  if (type==='error') el.classList.add('error'); else el.classList.add('success');
  requestAnimationFrame(()=> el.classList.add('visible'));
  clearTimeout(el._hide);
  el._hide = setTimeout(()=> el.classList.remove('visible'), duration);
}

function showMsg(text, opts={}){ _showMessage(text, Object.assign({type:'success'}, opts)); }
function showError(err, opts={}){
  let text = 'Operation failed';
  if (!err) text = 'Unknown error';
  else if (typeof err === 'string') text = err;
  else if (err.message) text = err.message;
  _showMessage(text, Object.assign({type:'error', title:'Failed', duration:6000}, opts));
}

function logoutToLogin() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('username');
  window.location.href = 'login.html';
}

// attach global logout button handlers if present
window.addEventListener('DOMContentLoaded', ()=>{
  const btn = document.getElementById('btnLogout');
  if (btn) btn.addEventListener('click', () => logoutToLogin());
});

window.showMsg = showMsg; window.showError = showError; window.logoutToLogin = logoutToLogin;
