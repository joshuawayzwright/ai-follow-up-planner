(function () {
  'use strict';
  var F = window.FollowUpLib;
  var $ = function (id) { return document.getElementById(id); };
  var fields = ['type', 'name', 'service', 'startDate', 'sender', 'business', 'reviewLink'];
  var current = { options: null, schedule: null };

  function read() {
    var o = {};
    fields.forEach(function (f) { o[f] = $(f).value; });
    o.skipWeekends = $('skipWeekends').checked;
    return o;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function render() {
    var o = read();
    var s = F.buildSchedule(o);
    current.options = o;
    current.schedule = s;
    $('errors').textContent = s.errors.join(' ');
    var box = $('steps');
    box.textContent = '';
    s.steps.forEach(function (step) {
      var wrap = el('div', 'step');
      wrap.appendChild(el('h3', null, step.index + '. ' + F.formatDate(step.date)));
      wrap.appendChild(el('p', 'meta', step.channel + ' · ' + step.purpose));
      var pre = el('pre', 'output', step.message);
      wrap.appendChild(pre);
      var btn = el('button', 'link', 'Copy this message');
      btn.type = 'button';
      btn.addEventListener('click', function () { copy(step.message, 'Message ' + step.index + ' copied.'); });
      wrap.appendChild(btn);
      box.appendChild(wrap);
    });
  }

  function say(msg) { $('status').textContent = msg; }
  function copy(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { say(done); }, function () { say('Copy blocked: select the text and copy it instead.'); });
    } else { say('Copy isn\'t available here: select the text and copy it instead.'); }
  }

  function downloadIcs() {
    if (!current.schedule || current.schedule.errors.length) { say('Fix the form first.'); return; }
    var ics = F.toICS(current.options, current.schedule);
    var name = 'follow-up-' + (current.options.name || 'lead').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.ics';
    var url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    say('Downloaded ' + name + '. Open it to add the reminders to your calendar.');
  }

  $('startDate').value = new Date().toISOString().slice(0, 10);
  $('form').addEventListener('input', render);
  $('form').addEventListener('change', render);
  $('form').addEventListener('submit', function (e) { e.preventDefault(); });
  $('ics').addEventListener('click', downloadIcs);
  $('copy').addEventListener('click', function () {
    if (current.schedule && !current.schedule.errors.length) copy(F.buildText(current.options, current.schedule), 'Plan copied.');
  });
  $('copy-ai').addEventListener('click', function () {
    if (current.schedule && !current.schedule.errors.length) copy(F.buildAiPrompt(current.options, current.schedule), 'AI prompt copied. Paste it into your AI assistant.');
  });
  render();
})();
