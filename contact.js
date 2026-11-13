/**
 * contact.js — Contact form validation.
 *
 * Rules:
 *   - No field may be empty after trim().
 *   - Email must match a sensible format check.
 *   - Phone must be digits only (no spaces, +, punctuation, letters).
 *   - Message must be at least 10 characters long.
 *
 * This is a STATIC site. No backend is configured. On valid submit, the form
 * does NOT send data — it displays an honest confirmation explaining that
 * delivery requires a configured service.
 *
 * INTEGRATION POINT:
 *   When a form service (Formspree, Netlify Forms, Getform, etc.) is ready,
 *   set FORM_ENDPOINT below to that service's public form-action URL and
 *   replace the demo confirmation call inside `handleValidSubmit()` with a
 *   `fetch()` call to that endpoint. Never put a secret/API key in this file —
 *   only the public endpoint URL the service hands you.
 */
(function () {
  'use strict';

  // Public endpoint URL only — no secrets. Leave as null to keep the demo.
  var FORM_ENDPOINT = null; // e.g. 'https://formspree.io/f/xxxxxxx'

  // Simple but standards-informed email pattern.
  // Accepts local@domain.tld — deliberately rejects whitespace.
  var EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  var DIGITS_RE = /^[0-9]+$/;

  var MESSAGE_MIN = 10;

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var fields = {
      name: {
        input: document.getElementById('name'),
        error: document.getElementById('name-error')
      },
      email: {
        input: document.getElementById('email'),
        error: document.getElementById('email-error')
      },
      phone: {
        input: document.getElementById('phone'),
        error: document.getElementById('phone-error')
      },
      message: {
        input: document.getElementById('message'),
        error: document.getElementById('message-error')
      }
    };

    var status = document.getElementById('form-status');
    var success = document.getElementById('contact-success');
    var resetEdit = document.getElementById('contact-reset');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var results = validateAll(fields);
      var firstInvalid = null;

      Object.keys(results).forEach(function (key) {
        applyFieldState(fields[key], results[key]);
        if (!results[key].ok && !firstInvalid) firstInvalid = fields[key].input;
      });

      if (firstInvalid) {
        if (status) {
          status.dataset.state = 'error';
          status.textContent = 'Please correct the highlighted field(s) before continuing.';
        }
        firstInvalid.focus();
        return;
      }

      if (status) {
        status.dataset.state = 'ok';
        status.textContent = '';
      }
      handleValidSubmit(form, fields, success);
    });

    // Clear a field's error once the user starts correcting it.
    Object.keys(fields).forEach(function (key) {
      var f = fields[key];
      if (!f.input) return;
      f.input.addEventListener('input', function () {
        if (f.input.getAttribute('aria-invalid') === 'true') {
          f.input.removeAttribute('aria-invalid');
          if (f.error) {
            f.error.hidden = true;
            f.error.textContent = '';
          }
        }
      });
    });

    // Reset button: also clear errors and hide the success panel.
    form.addEventListener('reset', function () {
      Object.keys(fields).forEach(function (key) {
        var f = fields[key];
        if (!f.input) return;
        f.input.removeAttribute('aria-invalid');
        if (f.error) {
          f.error.hidden = true;
          f.error.textContent = '';
        }
      });
      if (status) {
        status.dataset.state = '';
        status.textContent = '';
      }
      if (success) success.hidden = true;
    });

    if (resetEdit && success) {
      resetEdit.addEventListener('click', function () {
        success.hidden = true;
        if (fields.name.input) fields.name.input.focus();
      });
    }
  });

  // ---- Validation --------------------------------------------------------

  function validateAll(fields) {
    var nameVal = fields.name.input.value;
    var emailVal = fields.email.input.value;
    var phoneVal = fields.phone.input.value;
    var msgVal = fields.message.input.value;

    return {
      name: validateName(nameVal),
      email: validateEmail(emailVal),
      phone: validatePhone(phoneVal),
      message: validateMessage(msgVal)
    };
  }

  function validateName(value) {
    var v = String(value || '').trim();
    if (!v) return { ok: false, message: 'Please enter your name.' };
    if (v.length < 2) return { ok: false, message: 'Name is too short.' };
    return { ok: true };
  }

  function validateEmail(value) {
    var v = String(value || '').trim();
    if (!v) return { ok: false, message: 'Please enter your email address.' };
    if (!EMAIL_RE.test(v)) {
      return { ok: false, message: 'Enter a valid email like name@domain.tld.' };
    }
    return { ok: true };
  }

  function validatePhone(value) {
    var v = String(value || '').trim();
    if (!v) return { ok: false, message: 'Please enter your phone number.' };
    if (!DIGITS_RE.test(v)) {
      return {
        ok: false,
        message: 'Phone must contain digits only — no spaces, "+", or punctuation.'
      };
    }
    if (v.length < 7) {
      return { ok: false, message: 'Phone number looks too short.' };
    }
    return { ok: true };
  }

  function validateMessage(value) {
    var v = String(value || '').trim();
    if (!v) return { ok: false, message: 'Please enter a message.' };
    if (v.length < MESSAGE_MIN) {
      return {
        ok: false,
        message: 'Message must be at least ' + MESSAGE_MIN + ' characters.'
      };
    }
    return { ok: true };
  }

  // ---- Applying state to a field ----------------------------------------

  function applyFieldState(field, result) {
    if (!field.input) return;
    if (result.ok) {
      field.input.removeAttribute('aria-invalid');
      if (field.error) {
        field.error.hidden = true;
        field.error.textContent = '';
      }
    } else {
      field.input.setAttribute('aria-invalid', 'true');
      if (field.error) {
        field.error.textContent = result.message;
        field.error.hidden = false;
      }
    }
  }

  // ---- Valid-submit handling --------------------------------------------

  function handleValidSubmit(form, fields, success) {
    if (FORM_ENDPOINT) {
      // Real endpoint configured — send as JSON. This branch is documented
      // but inactive by default. Uncomment and adapt to your provider.
      /*
      var payload = {
        name: fields.name.input.value.trim(),
        email: fields.email.input.value.trim(),
        phone: fields.phone.input.value.trim(),
        message: fields.message.input.value.trim()
      };
      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Request failed');
          showSuccess(success, form, 'Message sent.');
        })
        .catch(function () {
          var status = document.getElementById('form-status');
          if (status) {
            status.dataset.state = 'error';
            status.textContent = 'The message could not be sent. Please try again later.';
          }
        });
      */
    } else {
      showSuccess(success, form, null);
    }
  }

  function showSuccess(success, form, overrideMessage) {
    if (!success) return;
    form.hidden = true;
    success.hidden = false;
    // Update the message if a real endpoint returned a custom text.
    if (overrideMessage) {
      var h3 = success.querySelector('h3');
      if (h3) h3.textContent = overrideMessage;
    }
    // Move focus so screen readers announce the panel.
    success.focus();
  }
})();