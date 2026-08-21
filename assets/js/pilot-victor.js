(function () {
  'use strict';

  const scriptUrl = document.currentScript && document.currentScript.src;
  const victorImageUrl = scriptUrl
    ? new URL('../img/victor-widget-160.webp', scriptUrl).href
    : 'assets/img/victor-widget-160.webp';
  const pageFile = (window.location.pathname || '').split('/').pop() || 'index.html';
  const storageKey = `myshiftpilot_victor_pilot_chat_v1:${pageFile}`;
  const PILOT_TOPICS = [
    { id: 'availability', label: 'Is MyShiftpilot al beschikbaar?', answer: 'MyShiftpilot is nog niet algemeen beschikbaar. We testen de eerste versie met een beperkte groep horecabedrijven die de roosterfuncties in hun eigen praktijk gebruiken.', linkUrl: 'faq.html', linkLabel: 'Bekijk de FAQ' },
    { id: 'apply', label: 'Voor wie is de pilot bedoeld?', answer: 'De pilot is bedoeld voor zakelijke horecabedrijven die medewerkers en diensten inroosteren. Ieder horecabedrijf kan een aanvraag doen; daarna bespreken we persoonlijk of de huidige pilotscope en het moment bij u passen.', linkUrl: '/#pilot-aanvraag', linkLabel: 'Meld uw bedrijf aan' },
    { id: 'participation', label: 'Wat gebeurt er direct na mijn aanvraag?', answer: 'We bekijken uw aanvraag en nemen persoonlijk contact op voor een kennismaking. We bespreken hoe u nu roostert, waar u tegenaan loopt en wat u met MyShiftpilot zou willen testen.', linkUrl: 'pilot.html', linkLabel: 'Bekijk hoe de pilot werkt' },
    { id: 'no-automatic-access', label: 'Zit ik na een aanvraag ergens aan vast?', answer: 'Nee. Een aanvraag is geen bestelling. Als u start, is de volledige pilot gratis en is er geen betaalverplichting of automatische verlenging.', linkUrl: 'pilot.html', linkLabel: 'Bekijk hoe de pilot werkt' },
    { id: 'talk-first', label: 'Waar kan ik terecht als ik eerst wil overleggen?', answer: 'Gebruik het contactformulier of mail ons. U kunt eerst persoonlijk bespreken of de pilot interessant is voor uw bedrijf voordat u een aanvraag doet.', linkUrl: 'contact.html', linkLabel: 'Stel een vraag' },
    { id: 'scope', label: 'Wat kan ik tijdens de pilot precies testen?', answer: 'De huidige pilotscope bestaat uit personeelsroosters maken, wijzigen en delen. In MyShiftpilot zitten daarnaast onderdelen als beschikbaarheid, verlof, ruilen, klokken en agendakoppeling. Die horen niet automatisch bij iedere pilot; welke functionaliteit voor uw bedrijf wordt geactiveerd, spreken we vooraf af.', linkUrl: 'faq.html', linkLabel: 'Bekijk de FAQ' },
    { id: 'expectations', label: 'Wat verwachten jullie tijdens een pilot?', answer: 'We vragen u MyShiftpilot daadwerkelijk in uw roosterproces te gebruiken en eerlijk te vertellen wat goed werkt, wat onduidelijk is en wat beter kan. De concrete tijdsinvestering en werkwijze bespreken we vooraf.', linkUrl: 'faq.html', linkLabel: 'Lees de afspraken in de FAQ' },
    { id: 'feedback', label: 'Wat gebeurt er met mijn feedback?', answer: 'Uw feedback helpt ons bepalen welke onderdelen van MyShiftpilot we als volgende verbeteren. We kunnen niet iedere wens direct uitvoeren, maar we bespreken duidelijk welke signalen we meenemen.', linkUrl: 'faq.html', linkLabel: 'Lees de FAQ' },
    { id: 'cost', label: 'Wat kost de pilot en hoe lang duurt die?', answer: 'De volledige pilot is gratis. Voor de start leggen we schriftelijk vast hoe lang u test en welke roosterfuncties u gebruikt. Er zijn geen betaalgegevens, facturen of automatische verlenging.', linkUrl: 'faq.html', linkLabel: 'Lees de afspraken in de FAQ' },
    { id: 'after-pilot', label: 'Wat gebeurt er na de pilot?', answer: 'Aan het einde bespreken we wat goed werkte, wat beter kan en of een vervolg voor beide kanten logisch is. De gratis pilot gaat niet automatisch over in doorlopend gebruik of een betaald abonnement.', linkUrl: 'pilot.html', linkLabel: 'Bekijk hoe de pilot werkt' },
  ];
  // De FAQ-regressietest gebruikt deze publieke, onveranderlijke weergave om te bewaken
  // dat Victor woordelijk dezelfde pilotantwoorden houdt.
  window.MyShiftpilotPilotTopics = Object.freeze(PILOT_TOPICS.map(({ label, answer }) => Object.freeze({ label, answer })));

  // Hogere score = waarschijnlijkere vervolgvraag binnen de pilotflow.
  const FOLLOW_UP_SCORES = {
    availability: { apply: 100, scope: 80, participation: 60 },
    apply: { participation: 100, cost: 75, scope: 50 },
    participation: { scope: 100, expectations: 75, cost: 55 },
    'no-automatic-access': { participation: 100, cost: 80, apply: 55 },
    'talk-first': { apply: 100, participation: 80, scope: 45 },
    scope: { expectations: 100, feedback: 80, apply: 50 },
    expectations: { feedback: 100, scope: 75, cost: 45 },
    feedback: { scope: 100, 'after-pilot': 75, expectations: 55 },
    cost: { apply: 100, participation: 75, 'after-pilot': 50 },
    'after-pilot': { feedback: 100, cost: 75, apply: 50 },
  };

  const MOUSE_GLOW_SELECTOR = [
    '.pilot-card',
    '.benefit',
    '.process-card',
    '.fit-card',
    '.faq-expectations article',
    '.faq-list details',
    '.contact-form-card',
    '.form-shell',
    '.cta-banner',
    '.f-card',
    '.fcard',
    '.step',
    '.problem-inner',
    '.about-brief-inner',
    '.home-faq-inner',
    '.home-faq-list details',
    '.founder',
    '.legal-block',
    // De kleine blokjes binnen een sectie volgden de cursor nog niet; daardoor voelde
    // alleen de helft van de kaarten op een pagina levend aan.
    '.problem-list li',
    '.about-person',
    '.ah-stat',
    '.tl-row',
    '.scope-steps li',
    '.vs-asks li',
    '.contact-subject-option',
    '.faq-filter button',
    '.tf-step-chip',
    '.contact-info-card',
    '.pilot-facts li',
    '.pilot-assurances li',
    '.hero-pilot-note',
  ].join(',');

  function bindMouseGlow(element) {
    if (!element || element.dataset.pilotMouseGlowBound === 'true') return;
    element.dataset.pilotMouseGlowBound = 'true';
    element.classList.add('pilot-mouse-glow');

    const layer = document.createElement('span');
    layer.className = 'pilot-mouse-glow__layer';
    if (element instanceof HTMLDetailsElement && element.firstElementChild) {
      element.insertBefore(layer, element.firstElementChild.nextElementSibling);
    } else {
      element.insertBefore(layer, element.firstChild);
    }

    // Kleine blokken zitten in een blok dat zelf ook gloeit. Zonder deze check lichten
    // beide tegelijk op en verdrinkt het kleine blokje in de gloed van zijn paneel.
    const ownsPointer = (event) => (
      typeof event.target.closest !== 'function' || event.target.closest('.pilot-mouse-glow') === element
    );

    // Eén vaste straal werkte alleen op kaartformaat: in een paneel van 1220x540 werd
    // het een spikkel en in een rij van 70px hoog een veeg van rand tot rand. De plas
    // volgt daarom de korte zijde, met de lange zijde als bovengrens zodat hij nooit
    // buiten het element valt, en een ondergrens voor pillen.
    const glowSize = (bounds) => {
      const kort = Math.min(bounds.width, bounds.height);
      const lang = Math.max(bounds.width, bounds.height);
      // De ondergrens voorkomt een spikkel in een pil; de lange zijde staat daar
      // achter zodat een smalle chip nooit een plas krijgt die breder is dan hijzelf.
      return Math.round(Math.min(Math.max(90, Math.min(kort * 1.7, lang * 0.95)), lang, 480));
    };

    const applyBounds = (bounds) => {
      element.style.setProperty('--pilot-glow-size', `${glowSize(bounds)}px`);
    };

    const update = (event) => {
      if (!ownsPointer(event)) {
        element.classList.remove('pilot-mouse-glow-active');
        return;
      }
      const bounds = element.getBoundingClientRect();
      applyBounds(bounds);
      element.style.setProperty('--pilot-mouse-x', `${event.clientX - bounds.left}px`);
      element.style.setProperty('--pilot-mouse-y', `${event.clientY - bounds.top}px`);
      element.classList.add('pilot-mouse-glow-active');
    };

    element.addEventListener('pointerenter', () => {
      applyBounds(element.getBoundingClientRect());
      element.classList.add('pilot-mouse-glow-active');
    });
    element.addEventListener('pointermove', update);
    element.addEventListener('pointerleave', () => element.classList.remove('pilot-mouse-glow-active'));
  }

  function bindMouseGlows() {
    document.querySelectorAll(MOUSE_GLOW_SELECTOR).forEach(bindMouseGlow);
  }

  function escapeHtml(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || 'null');
      return parsed && Array.isArray(parsed.messages) ? { messages: parsed.messages.filter(Boolean) } : { messages: [] };
    } catch { return { messages: [] }; }
  }
  function saveState(state) { try { localStorage.setItem(storageKey, JSON.stringify({ messages: state.messages || [] })); } catch {} }
  function clearState() { try { localStorage.removeItem(storageKey); } catch {} }

  function getRankedFollowUpIds(topicId) {
    const scores = FOLLOW_UP_SCORES[topicId] || {};
    return Object.entries(scores)
      .filter(([id]) => PILOT_TOPICS.some((topic) => topic.id === id))
      .sort(([firstId, firstScore], [secondId, secondScore]) => secondScore - firstScore || firstId.localeCompare(secondId))
      .slice(0, 2)
      .map(([id]) => id);
  }

  const host = document.createElement('div');
  host.className = 'victor-site-widget';
  host.setAttribute('data-open', 'false');
  host.setAttribute('data-public-site', 'true');
  host.setAttribute('data-pilot-site', 'true');
  host.innerHTML = `
    <button type="button" class="victor-site-widget__launcher" aria-expanded="false" aria-label="Open Victor, MyShiftpilot-gids" title="VICTOR, uw gids voor MyShiftpilot">
      <span class="victor-site-widget__launcher-avatar"><img src="${escapeHtml(victorImageUrl)}" alt="" aria-hidden="true"></span><span class="victor-site-widget__launcher-online" aria-hidden="true"></span>
    </button>
    <section class="victor-site-widget__panel" aria-label="Victor, MyShiftpilot-gids">
      <div class="victor-site-widget__header"><span class="victor-site-widget__header-avatar"><img src="${escapeHtml(victorImageUrl)}" alt="" aria-hidden="true"></span><div class="victor-site-widget__header-copy"><div class="victor-site-widget__title">VICTOR</div><div class="victor-site-widget__header-subtitle">Uw gids voor MyShiftpilot</div></div><button type="button" class="victor-site-widget__icon-button" aria-label="Sluit Victor">×</button></div>
      <div class="victor-site-widget__messages" aria-live="polite" aria-atomic="false"></div>
      <div class="victor-site-widget__quick" data-visible="true"><p class="victor-site-widget__quick-label">Kies een vraag over deze pilot</p><div class="victor-site-widget__quick-list"></div></div>
      <div class="victor-site-widget__composer"><div class="victor-site-widget__composer-meta"><button type="button" class="victor-site-widget__reset">Andere vraag</button></div></div>
    </section>`;
  document.body.appendChild(host);

  const openButton = host.querySelector('.victor-site-widget__launcher');
  const closeButton = host.querySelector('.victor-site-widget__icon-button');
  const messagesNode = host.querySelector('.victor-site-widget__messages');
  const quickNode = host.querySelector('.victor-site-widget__quick');
  const questionList = host.querySelector('.victor-site-widget__quick-list');
  const resetButton = host.querySelector('.victor-site-widget__reset');
  let state = readState();
  let asking = false;

  function setOpen(isOpen, restoreFocus) {
    host.setAttribute('data-open', isOpen ? 'true' : 'false');
    openButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (!isOpen && restoreFocus) openButton.focus();
  }
  function renderQuickActions() {
    const hasConversation = state.messages.length > 0;
    quickNode.setAttribute('data-visible', hasConversation ? 'false' : 'true');
    quickNode.hidden = hasConversation;
    questionList.innerHTML = PILOT_TOPICS.map((topic) => `<button type="button" class="victor-site-widget__question" data-pilot-topic="${escapeHtml(topic.id)}"${asking ? ' disabled' : ''}>${escapeHtml(topic.label)}</button>`).join('');
    resetButton.disabled = asking;
  }
  function renderMessage(message) {
    const isAssistant = message.role === 'assistant';
    const actionLink = isAssistant && message.linkUrl ? `<a class="victor-site-widget__contact-link" href="${escapeHtml(message.linkUrl)}">${escapeHtml(message.linkLabel)}</a>` : '';
    const followUps = isAssistant && Array.isArray(message.followUpIds)
      ? message.followUpIds.map((id) => PILOT_TOPICS.find((topic) => topic.id === id)).filter(Boolean)
        .map((topic) => `<button type="button" class="victor-site-widget__follow-up" data-pilot-topic="${escapeHtml(topic.id)}"${asking ? ' disabled' : ''}>${escapeHtml(topic.label)}</button>`).join('')
      : '';
    const actions = actionLink ? `<div class="victor-site-widget__message-actions">${actionLink}</div>` : '';
    const followUpMarkup = followUps ? `<div class="victor-site-widget__follow-ups"><p class="victor-site-widget__follow-ups-label">Vraag door</p><div class="victor-site-widget__follow-ups-list">${followUps}</div></div>` : '';
    return `<div class="victor-site-widget__message victor-site-widget__message--${isAssistant ? 'assistant' : 'user'}"><div class="victor-site-widget__message-copy">${escapeHtml(message.content)}</div>${actions}${followUpMarkup}</div>`;
  }
  function renderMessages() {
    const starter = state.messages.length ? '' : '<div class="victor-site-widget__empty"><div class="victor-site-widget__message victor-site-widget__message--assistant"><div class="victor-site-widget__message-copy">Hoi, ik ben VICTOR. MyShiftpilot is nog in ontwikkeling, maar de eerste functies voor roosters maken, wijzigen en delen kunt u via deze beperkte pilot al in de praktijk testen. Kies hieronder een onderwerp.</div></div></div>';
    const typing = `<div class="victor-site-widget__typing" data-visible="${asking ? 'true' : 'false'}">Victor zoekt het antwoord op deze site…</div>`;
    messagesNode.innerHTML = `${starter}${state.messages.map(renderMessage).join('')}${typing}`;
    messagesNode.scrollTop = messagesNode.scrollHeight;
    renderQuickActions();
  }
  function askTopic(topic) {
    if (!topic || asking) return;
    asking = true;
    state.messages = state.messages.concat({ role: 'user', content: topic.label });
    saveState(state);
    renderMessages();
    window.setTimeout(() => {
      state.messages = state.messages.concat({ role: 'assistant', content: topic.answer, linkUrl: topic.linkUrl, linkLabel: topic.linkLabel, followUpIds: getRankedFollowUpIds(topic.id) });
      saveState(state);
      asking = false;
      renderMessages();
    }, 280);
  }
  openButton.addEventListener('click', () => setOpen(host.getAttribute('data-open') !== 'true'));
  closeButton.addEventListener('click', () => setOpen(false, true));
  resetButton.addEventListener('click', () => {
    if (asking) return;
    state = { messages: [] };
    clearState();
    renderMessages();
  });
  quickNode.addEventListener('click', (event) => {
    const button = event.target.closest('[data-pilot-topic]');
    askTopic(PILOT_TOPICS.find((item) => item.id === button?.getAttribute('data-pilot-topic')));
  });
  messagesNode.addEventListener('click', (event) => {
    const button = event.target.closest('[data-pilot-topic]');
    askTopic(PILOT_TOPICS.find((item) => item.id === button?.getAttribute('data-pilot-topic')));
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && host.getAttribute('data-open') === 'true') setOpen(false, true); });
  document.addEventListener('pointerdown', (event) => { if (host.getAttribute('data-open') === 'true' && !host.contains(event.target)) setOpen(false); });
  bindMouseGlows();
  renderMessages();
})();
