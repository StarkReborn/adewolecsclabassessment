/**
 * planner.js — Academic Planner.
 *
 * Data model: array of task objects:
 *   { id: string, text: string, done: boolean, createdAt: number }
 *
 * Persistence: localStorage key "cos106.planner.v1".
 *
 * Security note: user-supplied text is always rendered with textContent,
 * never with innerHTML. No untrusted HTML is ever injected.
 *
 * This is a client-side planner. Data lives in the current browser only.
 * There is no account, no sync, and no server.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'cos106.planner.v1';
  var tasks = [];
  var storageAvailable = true;

  // ---- Storage layer -----------------------------------------------------

  function detectStorage() {
    try {
      var probe = '__cos106_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadTasks() {
    if (!storageAvailable) return [];
    var raw;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return [];
    }
    if (!raw) return [];
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.warn('[planner] Could not parse stored tasks; starting fresh.');
      return [];
    }
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(function (t) {
        return t && typeof t.id === 'string' && typeof t.text === 'string';
      })
      .map(function (t) {
        return {
          id: t.id,
          text: t.text,
          done: Boolean(t.done),
          createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now()
        };
      });
  }

  function saveTasks() {
    if (!storageAvailable) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.warn('[planner] Could not save tasks:', e);
    }
  }

  // ---- ID generation -----------------------------------------------------

  var idCounter = 0;
  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    // Fallback: unique by timestamp + counter, checked for collision.
    var id;
    do {
      idCounter += 1;
      id = 'task-' + Date.now().toString(36) + '-' + idCounter;
    } while (tasks.some(function (t) { return t.id === id; }));
    return id;
  }

  // ---- Rendering ---------------------------------------------------------

  function render() {
    var list = document.getElementById('task-list');
    var empty = document.getElementById('task-empty');
    var countEl = document.getElementById('task-count');
    var countPlural = document.getElementById('task-count-plural');
    var doneEl = document.getElementById('task-done-count');
    if (!list) return;

    list.textContent = '';

    tasks.forEach(function (task) {
      list.appendChild(buildTaskItem(task));
    });

    var total = tasks.length;
    var done = tasks.filter(function (t) { return t.done; }).length;
    if (countEl) countEl.textContent = String(total);
    if (countPlural) countPlural.textContent = total === 1 ? '' : 's';
    if (doneEl) doneEl.textContent = String(done);

    if (empty) empty.hidden = total !== 0;
  }

  /**
   * Build one <li> for a task. All user text is inserted via textContent.
   */
  function buildTaskItem(task) {
    var li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.id = task.id;
    li.dataset.done = task.done ? 'true' : 'false';

    var span = document.createElement('span');
    span.className = 'task-item__text';
    span.textContent = task.text;

    var actions = document.createElement('div');
    actions.className = 'task-item__actions';

    var toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'task-item__btn';
    toggleBtn.textContent = task.done ? 'Undo' : 'Complete';
    toggleBtn.setAttribute(
      'aria-label',
      (task.done ? 'Mark incomplete: ' : 'Mark complete: ') + task.text
    );
    toggleBtn.addEventListener('click', function () {
      toggleTask(task.id);
    });

    var deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'task-item__btn task-item__btn--danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', 'Delete task: ' + task.text);
    deleteBtn.addEventListener('click', function () {
      deleteTask(task.id);
    });

    actions.appendChild(toggleBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(span);
    li.appendChild(actions);
    return li;
  }

  // ---- Task operations ---------------------------------------------------

  function addTask(text) {
    var trimmed = String(text || '').trim();
    if (!trimmed) return { ok: false, error: 'Please enter a task description.' };
    if (trimmed.length > 140) {
      return { ok: false, error: 'Task is too long (max 140 characters).' };
    }
    // Prevent obvious duplicate active tasks (same text, same done state).
    var duplicate = tasks.some(function (t) {
      return t.text === trimmed && t.done === false;
    });
    if (duplicate) {
      return { ok: false, error: 'That task is already on your list.' };
    }
    tasks.unshift({
      id: makeId(),
      text: trimmed,
      done: false,
      createdAt: Date.now()
    });
    saveTasks();
    render();
    return { ok: true };
  }

  function toggleTask(id) {
    var index = tasks.findIndex(function (t) { return t.id === id; });
    if (index === -1) return;
    tasks[index].done = !tasks[index].done;
    saveTasks();
    render();
    announce(
      tasks[index].done
        ? 'Marked complete: ' + tasks[index].text
        : 'Marked incomplete: ' + tasks[index].text
    );
  }

  function deleteTask(id) {
    var index = tasks.findIndex(function (t) { return t.id === id; });
    if (index === -1) return;
    var removed = tasks.splice(index, 1)[0];
    saveTasks();
    render();
    announce('Deleted: ' + removed.text);
  }

  function announce(message) {
    var feedback = document.getElementById('task-feedback');
    if (!feedback) return;
    feedback.textContent = message;
    // Clear after a moment so it does not linger indefinitely.
    window.setTimeout(function () {
      if (feedback.textContent === message) feedback.textContent = '';
    }, 2600);
  }

  // ---- Wiring ------------------------------------------------------------

  document.addEventListener('DOMContentLoaded', function () {
    storageAvailable = detectStorage();
    tasks = loadTasks();
    render();

    var notice = document.getElementById('storage-notice');
    if (!storageAvailable && notice) notice.hidden = false;

    var form = document.getElementById('task-form');
    var input = document.getElementById('task-input');
    var error = document.getElementById('task-input-error');
    if (!form || !input) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (error) {
        error.hidden = true;
        error.textContent = '';
      }
      var result = addTask(input.value);
      if (!result.ok) {
        if (error) {
          error.textContent = result.error;
          error.hidden = false;
        }
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      input.value = '';
      input.focus();
      announce('Task added.');
    });

    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true' && input.value.trim()) {
        input.removeAttribute('aria-invalid');
        if (error) {
          error.hidden = true;
          error.textContent = '';
        }
      }
    });
  });
})();