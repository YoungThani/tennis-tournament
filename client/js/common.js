// Helpers shared by every page. Each page loads this file before its own script.

// Call our API. Sends/receives JSON and throws an Error with the server's message if something went wrong.
// Examples:
//   const players = await api('GET', '/api/players');
//   await api('POST', '/api/players', { name: 'Iga Swiatek', country: 'Poland' });
async function api(method, url, body) {
  const options = { method, headers: {} };
  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  // 204 = "done, nothing to send back" (e.g. after a delete)
  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

// Make text safe to put inside HTML, so a name like "<b>Bob</b>" shows as text instead of bold.
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

// ---------- Light / dark theme toggle ----------
// The saved theme is applied by a tiny script in each page's <head> (so there's no flash).
// Here we add the ☀️ / 🌙 button to the nav bar and handle clicks.
function setupThemeToggle() {
  const button = document.createElement('button');
  button.className = 'theme-toggle';

  function showIcon() {
    const isDark = document.documentElement.dataset.theme !== 'light';
    button.textContent = isDark ? '☀️' : '🌙'; // show the theme you'd switch TO
    button.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    button.setAttribute('aria-label', button.title);
  }

  button.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next); // remember the choice for next time
    } catch (e) {
      // private browsing can block storage; the toggle still works for this page
    }
    showIcon();
  });

  showIcon();
  document.querySelector('.nav').appendChild(button);
}

setupThemeToggle();

// Turn "2026-10-03T12:30:00.000Z" into something readable in the user's own timezone, e.g. "Sat 3 Oct, 6:00 pm"
function formatDate(isoString) {
  return new Date(isoString).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}
