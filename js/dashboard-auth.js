import { Auth } from './auth.js';

function leave(path) { location.replace(new URL(path, document.baseURI).href); }
Auth.init().then(function (account) {
  if (!account) return leave('signin/');
  if (account.role === 'admin') return leave('control/');
  if (account.role === 'professor') location.hash = '#/professor';
  document.body.classList.add('studymaf-dashboard-ready');
}).catch(function () { leave('signin/'); });
