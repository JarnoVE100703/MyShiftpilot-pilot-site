(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) api.init(root.document, root.fetch.bind(root));
})(typeof window !== 'undefined' ? window : undefined, function () {
  'use strict';

  function getApiBase(documentRef) {
    const meta = documentRef.querySelector('meta[name="myshiftpilot-api-base"]');
    return String(meta && meta.getAttribute('content') || '').trim().replace(/\/$/, '');
  }

  function isCentralConfirmation(body) {
    return Boolean(
      body &&
      body.success === true &&
      body.storageMode === 'database' &&
      typeof body.id === 'string' &&
      body.id.trim()
    );
  }

  async function submitPilotLead(fetchImpl, apiBase, payload) {
    if (!apiBase) throw new Error('pilot_api_base_missing');
    const response = await fetchImpl(`${apiBase}/api/public/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    let body = null;
    try {
      body = await response.json();
    } catch (_error) {
      throw new Error('pilot_lead_invalid_response');
    }

    if (!response.ok || !isCentralConfirmation(body)) {
      throw new Error(body && body.error ? body.error : 'pilot_lead_not_confirmed');
    }
    return body;
  }

  function payloadFromForm(form) {
    const data = new FormData(form);
    const phone = String(data.get('phone') || '').trim();
    const payload = {
      name: String(data.get('name') || '').trim(),
      email: String(data.get('email') || '').trim(),
      company: String(data.get('company') || '').trim(),
      location: String(data.get('location') || '').trim(),
      businessType: String(data.get('businessType') || '').trim(),
      teamSize: String(data.get('teamSize') || '').trim(),
      currentPlanningMethod: String(data.get('currentPlanningMethod') || '').trim(),
      challenge: String(data.get('challenge') || '').trim(),
      pilotInterest: String(data.get('pilotInterest') || '').trim(),
      source: 'pilot_landing_form',
      website: String(data.get('website') || '').trim()
    };
    if (phone) payload.phone = phone;
    return payload;
  }

  function validationMessageFor(control) {
    const validity = control && control.validity;
    if (!validity) return '';

    const name = control.name;
    const value = String(control.value || '').trim();
    if ((control.required && !value) || validity.valueMissing) {
      return ({
        company: 'Vul de bedrijfsnaam in.',
        name: 'Vul de naam van de contactpersoon in.',
        email: 'Vul het zakelijke e-mailadres in.',
        location: 'Vul de vestigingsplaats in.',
        businessType: 'Kies het type horecabedrijf.',
        teamSize: 'Kies de teamgrootte.',
        currentPlanningMethod: 'Kies uw huidige werkwijze.',
        challenge: 'Beschrijf uw grootste roosteruitdaging.',
        pilotInterest: 'Kies of u MyShiftpilot in de praktijk wilt testen.'
      })[name] || 'Vul dit veld in.';
    }
    if (validity.typeMismatch && name === 'email') return 'Vul een geldig e-mailadres in.';
    if ((value && control.minLength > 0 && value.length < control.minLength) || validity.tooShort) {
      return ({
        company: 'Vul minimaal 2 tekens in voor de bedrijfsnaam.',
        name: 'Vul minimaal 2 tekens in voor de naam van de contactpersoon.',
        phone: 'Vul minimaal 6 tekens in of laat het telefoonnummer leeg.',
        location: 'Vul minimaal 2 tekens in voor de vestigingsplaats.',
        challenge: 'Beschrijf uw roosteruitdaging in minimaal 10 tekens.'
      })[name] || `Vul minimaal ${control.minLength} tekens in.`;
    }
    if (validity.tooLong) return `Gebruik maximaal ${control.maxLength} tekens.`;
    if (validity.valid) return '';
    return 'Controleer dit veld.';
  }

  function validateControl(control) {
    if (!control || typeof control.setCustomValidity !== 'function') return true;
    control.setCustomValidity('');
    const message = validationMessageFor(control);
    control.setCustomValidity(message);
    return !message;
  }

  function normalizeControl(control) {
    if (!control || typeof control.value !== 'string' || control.tagName === 'SELECT') return;
    control.value = control.value.trim();
  }

  function isCompactViewport(windowRef) {
    return Boolean(
      windowRef &&
      typeof windowRef.matchMedia === 'function' &&
      windowRef.matchMedia('(max-width: 768px)').matches
    );
  }

  let compactScrollFrame = null;

  function scrollCompactViewport(windowRef, targetTop, onSettled) {
    if (compactScrollFrame !== null) windowRef.cancelAnimationFrame(compactScrollFrame);

    const startTop = windowRef.scrollY;
    const distance = targetTop - startTop;
    const reduceMotion = windowRef.matchMedia && windowRef.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (Math.abs(distance) < 2 || reduceMotion) {
      windowRef.scrollTo(0, targetTop);
      compactScrollFrame = null;
      if (onSettled) onSettled();
      return;
    }

    const startedAt = windowRef.performance.now();
    const duration = 300;
    const step = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = progress * progress * (3 - 2 * progress);
      windowRef.scrollTo(0, startTop + distance * eased);
      if (progress < 1) {
        compactScrollFrame = windowRef.requestAnimationFrame(step);
      } else {
        compactScrollFrame = null;
        if (onSettled) onSettled();
      }
    };
    compactScrollFrame = windowRef.requestAnimationFrame(step);
  }

  function alignPilotForm(windowRef, documentRef, form, options) {
    if (!windowRef || !documentRef || !form || typeof windowRef.scrollTo !== 'function') return;
    const settings = options || {};
    const compactViewport = isCompactViewport(windowRef);
    const header = documentRef.querySelector('.hdr');
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const viewportHeight = windowRef.innerHeight || documentRef.documentElement.clientHeight;
    const formContent = form.querySelector('.ticket-form') || form;
    const formRect = formContent.getBoundingClientRect();
    const maxScroll = Math.max(0, documentRef.documentElement.scrollHeight - viewportHeight);
    const desiredOffset = Math.max(headerHeight + 18, (viewportHeight - formRect.height) / 2);
    let targetTop = Math.min(Math.max(windowRef.scrollY + formRect.top - desiredOffset, 0), maxScroll);

    // Het aanmeldblok is schermvullend en centreert zijn eigen inhoud. Leg daarom de
    // bovenrand van het blok tegen de viewport, precies zoals de ankersprong naar
    // #pilot-aanvraag doet; anders landt de klik hoger en valt de sectiekop weg.
    // Past het formulier zo niet volledig in beeld (korte schermen), dan blijft de
    // oude uitlijning gelden waarbij het formulier zelf gecentreerd wordt.
    const section = typeof form.closest === 'function' ? form.closest('#pilot-aanvraag') : null;
    if (section && typeof section.getBoundingClientRect === 'function') {
      const sectionTop = windowRef.scrollY + section.getBoundingClientRect().top;
      const formTopInBlock = windowRef.scrollY + formRect.top - sectionTop;
      if (formTopInBlock >= headerHeight + 18 && formTopInBlock + formRect.height <= viewportHeight - 18) {
        targetTop = Math.min(Math.max(sectionTop, 0), maxScroll);
      }
    }

    // Op een telefoon kan een lange browser-scroll tegelijk met de hash-navigatie en
    // toetsenbordfocus opnieuw starten. Gebruik daar één korte, eigen overgang;
    // desktops behouden de bestaande vloeiende uitlijning.
    const root = documentRef.documentElement;
    const originalScrollBehavior = compactViewport && root ? root.style.scrollBehavior : '';
    if (compactViewport && root) root.style.scrollBehavior = 'auto';
    const restoreScrollBehavior = () => {
      if (compactViewport && root) root.style.scrollBehavior = originalScrollBehavior;
    };
    if (compactViewport && settings.smooth !== false) {
      scrollCompactViewport(windowRef, targetTop, restoreScrollBehavior);
    } else {
      windowRef.scrollTo({ top: targetTop, behavior: settings.smooth === false || compactViewport ? 'auto' : 'smooth' });
      if (compactViewport && root) windowRef.requestAnimationFrame(restoreScrollBehavior);
    }

    if (settings.focus && !compactViewport) {
      windowRef.setTimeout(() => {
        const firstField = form.querySelector('input:not([type="hidden"]), select, textarea');
        if (firstField && typeof firstField.focus === 'function') firstField.focus({ preventScroll: true });
      }, settings.smooth === false ? 0 : 420);
    }
  }

  function bindPilotFormLinks(windowRef, documentRef, form) {
    if (!windowRef || !documentRef.querySelectorAll) return;
    documentRef.querySelectorAll('a[href="#pilot-aanvraag"]').forEach((link) => {
      if (link.dataset.pilotFormBound === 'true') return;
      link.dataset.pilotFormBound = 'true';
      link.addEventListener('click', (event) => {
        event.preventDefault();
        alignPilotForm(windowRef, documentRef, form, { smooth: true, focus: true });
      });
    });
  }

  function initPilotSteps(windowRef, documentRef, form, formControls) {
    const contactStep = form.querySelector('[data-pilot-step="contact"]');
    const planningStep = form.querySelector('[data-pilot-step="planning"]');
    const nextButton = form.querySelector('[data-pilot-next]');
    const backButton = form.querySelector('[data-pilot-back]');
    const indicators = Array.from(form.querySelectorAll('[data-pilot-indicator]'));
    if (!contactStep || !planningStep || !nextButton || !backButton || !indicators.length) return null;

    let currentStep = 'contact';
    const setStep = (step, options) => {
      currentStep = step === 'planning' ? 'planning' : 'contact';
      contactStep.hidden = currentStep !== 'contact';
      planningStep.hidden = currentStep !== 'planning';
      indicators.forEach((indicator) => {
        const indicatorStep = indicator.dataset.pilotIndicator;
        indicator.classList.toggle('active', indicatorStep === currentStep);
        indicator.classList.toggle('done', currentStep === 'planning' && indicatorStep === 'contact');
      });
      if (options && options.focus) {
        const firstField = (currentStep === 'planning' ? planningStep : contactStep).querySelector('input, select, textarea');
        if (firstField && typeof firstField.focus === 'function') firstField.focus({ preventScroll: true });
      }
    };

    const validateContactStep = () => {
      formControls.forEach(normalizeControl);
      formControls.forEach(validateControl);
      const fields = Array.from(contactStep.querySelectorAll('input, select, textarea'));
      for (const field of fields) {
        if (typeof field.checkValidity === 'function' && !field.checkValidity()) {
          field.reportValidity();
          if (typeof field.focus === 'function') field.focus();
          return false;
        }
      }
      return true;
    };

    const goToPlanning = () => {
      if (!validateContactStep()) return false;
      setStep('planning', { focus: true });
      alignPilotForm(windowRef, documentRef, form, { smooth: false, focus: false });
      return true;
    };

    nextButton.addEventListener('click', goToPlanning);
    backButton.addEventListener('click', () => {
      setStep('contact', { focus: true });
      alignPilotForm(windowRef, documentRef, form, { smooth: false, focus: false });
    });
    setStep('contact');

    return { getCurrentStep: () => currentStep, goToPlanning };
  }

  function init(documentRef, fetchImpl) {
    const form = documentRef.getElementById('pilot-form');
    if (!form || form.dataset.pilotBound === 'true') return;
    form.dataset.pilotBound = 'true';

    const windowRef = documentRef.defaultView;
    bindPilotFormLinks(windowRef, documentRef, form);
    if (windowRef && windowRef.location && windowRef.location.hash === '#pilot-aanvraag') {
      windowRef.requestAnimationFrame(() => {
        alignPilotForm(windowRef, documentRef, form, { smooth: false, focus: true });
        // Hash direct opruimen: anders springt iedere reload of terugkeer opnieuw naar het formulier.
        if (windowRef.history && typeof windowRef.history.replaceState === 'function') {
          windowRef.history.replaceState(null, '', windowRef.location.pathname + windowRef.location.search);
        }
      });
    }

    const submitButton = form.querySelector('[data-pilot-submit]');
    const status = documentRef.getElementById('pilot-form-status');
    const success = documentRef.getElementById('pilot-form-success');
    const formControls = Array.from(form.querySelectorAll('input, select, textarea'));
    formControls.forEach((control) => {
      control.addEventListener('invalid', () => validateControl(control));
      control.addEventListener('input', () => validateControl(control));
      control.addEventListener('change', () => validateControl(control));
    });
    const pilotSteps = initPilotSteps(windowRef, documentRef, form, formControls);
    const honeypot = documentRef.createElement('input');
    honeypot.name = 'website';
    honeypot.type = 'text';
    honeypot.autocomplete = 'off';
    honeypot.tabIndex = -1;
    honeypot.setAttribute('aria-hidden', 'true');
    honeypot.className = 'form-honeypot';
    form.appendChild(honeypot);
    submitButton.type = 'submit';
    submitButton.disabled = false;

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      status.textContent = '';
      if (pilotSteps && pilotSteps.getCurrentStep() === 'contact') {
        pilotSteps.goToPlanning();
        return;
      }
      formControls.forEach(normalizeControl);
      formControls.forEach(validateControl);
      if (!form.reportValidity()) return;

      submitButton.disabled = true;
      submitButton.querySelector('span').textContent = 'Pilotaanvraag wordt verstuurd…';
      try {
        await submitPilotLead(fetchImpl, getApiBase(documentRef), payloadFromForm(form));
        success.hidden = false;
        form.classList.add('success');
        if (typeof success.focus === 'function') success.focus();
        form.querySelectorAll('input, select, textarea, button').forEach((control) => {
          control.disabled = true;
        });
      } catch (_error) {
        status.textContent = 'Versturen lukt nu niet. Uw aanvraag is niet ontvangen. Probeer het later opnieuw of mail naar info@myshiftpilot.nl.';
      } finally {
        if (!form.classList.contains('success')) {
          submitButton.disabled = false;
          submitButton.querySelector('span').textContent = 'Verstuur pilotaanvraag';
        }
      }
    });
  }

  return { alignPilotForm, getApiBase, init, isCentralConfirmation, payloadFromForm, submitPilotLead };
});
