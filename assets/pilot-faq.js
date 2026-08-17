(() => {
  const search = document.getElementById('faq-search');
  const list = document.getElementById('faq-list');
  const result = document.getElementById('faq-result');
  const empty = document.getElementById('faq-empty');
  const filters = Array.from(document.querySelectorAll('[data-faq-filter]'));
  if (!search || !list || !result || !empty || filters.length === 0) return;

  const items = Array.from(list.querySelectorAll('details'));
  // De vragen staan gegroepeerd per onderwerp. Een groep zonder overgebleven vragen
  // verdwijnt, anders blijft er een kop met een leeg vlak eronder staan.
  const groups = Array.from(list.querySelectorAll('[data-faq-group]'));
  let activeFilter = 'all';

  const applyFilter = () => {
    const query = search.value.trim().toLocaleLowerCase('nl-NL');
    let visible = 0;
    items.forEach((item) => {
      const matchesCategory = activeFilter === 'all' || (item.dataset.faqCategory || '').split(' ').includes(activeFilter);
      const matchesQuery = !query || item.textContent.toLocaleLowerCase('nl-NL').includes(query);
      const matches = matchesCategory && matchesQuery;
      item.hidden = !matches;
      if (matches) visible += 1;
    });
    groups.forEach((group) => {
      const shown = Array.from(group.querySelectorAll('details')).filter((item) => !item.hidden).length;
      group.hidden = shown === 0;
      const counter = group.querySelector('[data-faq-group-count]');
      if (counter) counter.textContent = shown === 1 ? '1 vraag' : `${shown} vragen`;
    });
    result.textContent = visible === 1 ? '1 vraag en antwoord' : `${visible} vragen en antwoorden`;
    empty.hidden = visible !== 0;
  };

  search.addEventListener('input', applyFilter);
  filters.forEach((button) => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.faqFilter || 'all';
      filters.forEach((filter) => filter.setAttribute('aria-pressed', String(filter === button)));
      applyFilter();
    });
  });
})();
