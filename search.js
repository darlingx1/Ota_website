(function () {
  const searchInput = document.getElementById('search-input');
  const searchWrapper = document.getElementById('search-wrapper');
  const dropdown = document.getElementById('search-dropdown');
  const resultsList = document.getElementById('search-results');
  const emptyState = document.getElementById('search-empty');
  const spinner = document.getElementById('search-spinner');

  if (!searchInput) return;

  let debounceTimer;

  function formatFollowers(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }

  function getInitial(name) {
    return (name || '?')[0].toUpperCase();
  }

  function renderResults(users) {
    resultsList.innerHTML = '';
    if (!users.length) {
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');
    users.forEach(u => {
      const a = document.createElement('a');
      a.href = `other_profile.html?id=${u.id}`;
      a.className = 'search-user-item';
      a.innerHTML = `
        <div>
          ${u.avatar_url
            ? `<img class="search-avatar" src="${u.avatar_url}" alt="${u.display_name}"/>`
            : `<div class="search-avatar-fallback">${getInitial(u.display_name)}</div>`
          }
        </div>
        <div style="flex:1;min-width:0;">
          <div class="search-username">${u.display_name}</div>
          <div class="search-followers"><span>${formatFollowers(u.followers_count ?? 0)}</span> followers</div>
        </div>
        <span class="material-symbols-outlined" style="color:#464757;font-size:16px;">arrow_forward_ios</span>
      `;
      resultsList.appendChild(a);
    });
  }

  async function searchUsers(query) {
    const { data, error } = await window.supabaseClient
      .from('profiles')
      .select('id, display_name, avatar_url, followers_count')
      .ilike('display_name', `%${query}%`)
      .limit(5);
    if (error) { console.error('[search.js]', error.message); return []; }
    return data || [];
  }

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    clearTimeout(debounceTimer);
    if (!query) { dropdown.classList.add('hidden'); hideSpinner(); return; }
    showSpinner();
    debounceTimer = setTimeout(async () => {
      const users = await searchUsers(query);
      hideSpinner();
      renderResults(users);
      dropdown.classList.remove('hidden');
    }, 300);
  });

  document.addEventListener('click', (e) => {
    if (!searchWrapper.contains(e.target)) dropdown.classList.add('hidden');
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { dropdown.classList.add('hidden'); searchInput.blur(); }
  });

  function showSpinner() { spinner.classList.remove('hidden'); }
  function hideSpinner() { spinner.classList.add('hidden'); }
})();