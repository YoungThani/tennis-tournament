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

// ---------- Countries, flags and avatars ----------
// (COUNTRIES comes from countries.js, which each page loads before this file)

// Find a country by its code: findCountry('KZ') → { code: 'KZ', name: 'Kazakhstan', ioc: 'KAZ' }
function findCountry(code) {
  return COUNTRIES.find((c) => c.code === code);
}

// A small flag image, e.g. flag('PL'). Images come from flagcdn.com, a free flag service.
function flag(code) {
  if (!findCountry(code)) return ''; // unknown country: no flag
  return `<img class="flag" src="https://flagcdn.com/${code.toLowerCase()}.svg" alt="" loading="lazy">`;
}

// Full country name for a code ("PL" → "Poland"), or the text itself if it isn't a known code
function countryName(code) {
  return findCountry(code)?.name ?? code ?? '';
}

// 3-letter scoreboard code ("PL" → "POL")
function countryIoc(code) {
  return findCountry(code)?.ioc ?? code ?? '';
}

// The <option>s for a country dropdown, with the current one selected
function countryOptions(selected) {
  return COUNTRIES
    .map((c) => `<option value="${c.code}" ${c.code === selected ? 'selected' : ''}>${escapeHtml(c.name)}</option>`)
    .join('');
}

// A round avatar with the person's initials ("Iga Swiatek" → "IS").
// The colour is worked out from the name, so the same person always gets the same colour.
function avatar(name) {
  const initials = name.split(' ').filter(Boolean).map((word) => word[0]).slice(0, 2).join('').toUpperCase();
  let hue = 0;
  for (const letter of name) hue = (hue * 31 + letter.charCodeAt(0)) % 360;
  return `<span class="avatar" style="--hue: ${hue}">${escapeHtml(initials)}</span>`;
}

// Some people turn on "reduce motion" in their phone/computer settings. We respect that.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Slide-in on scroll ----------
// Call after a page first shows its data. Cards and table rows start hidden and slide up
// into place as they scroll into view. It only runs once per page, so the schedule's
// auto-refresh doesn't make everything slide in again every 5 seconds.
function revealOnScroll(container) {
  if (reduceMotion || container.dataset.revealed) return;
  container.dataset.revealed = 'yes';

  // IntersectionObserver tells us when an element scrolls into view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('reveal-in');
      observer.unobserve(el);
      // Once it has arrived, remove the helper classes so hover effects work normally
      setTimeout(() => {
        el.classList.remove('reveal', 'reveal-in');
        el.style.transitionDelay = '';
      }, 1200);
    });
  }, { threshold: 0.1 });

  container.querySelectorAll('.card, .broadcast, tbody tr').forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${Math.min(i, 8) * 70}ms`; // a little stagger: one after another
    observer.observe(el);
  });
}

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
