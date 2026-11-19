/* Follow-up schedule, message templates and calendar export. Pure functions: no DOM, no network. */
(function (root) {
  'use strict';

  var PLANS = {
    enquiry: {
      label: 'New enquiry (no quote yet)',
      steps: [
        { day: 0, channel: 'Call or SMS', purpose: 'Reply fast and book a time to see the job',
          text: 'Hi {name}, thanks for getting in touch about {service}. I can come and take a look this week. What day suits you best? – {sender}, {business}' },
        { day: 1, channel: 'SMS', purpose: 'Gentle nudge if they haven\'t replied',
          text: 'Hi {name}, just checking you got my message about {service}. Happy to help whenever suits. – {sender}' },
        { day: 3, channel: 'Email', purpose: 'Useful info and an easy next step',
          text: 'Hi {name},\n\nIn case it helps, here\'s how I usually handle {service}: I check the job, give you a fixed written quote, and confirm a start date. No obligation.\n\nJust reply with a good time and I\'ll lock it in.\n\nCheers,\n{sender}\n{business}' },
        { day: 7, channel: 'SMS', purpose: 'Last check, then stop',
          text: 'Hi {name}, I\'ll close off your enquiry for now so I don\'t keep messaging. If you still need {service}, just reply and I\'ll pick it up. – {sender}' }
      ]
    },
    quote: {
      label: 'Quote sent',
      steps: [
        { day: 2, channel: 'SMS', purpose: 'Check the quote arrived and answer questions',
          text: 'Hi {name}, just making sure my quote for {service} came through OK. Any questions, ask away. – {sender}, {business}' },
        { day: 5, channel: 'Call', purpose: 'Talk it through and handle concerns',
          text: 'Call {name}. Ask: "Is there anything in the quote you\'d like me to explain or adjust?" Note any objection about price, timing or scope.' },
        { day: 10, channel: 'Email', purpose: 'Remind them of availability and validity',
          text: 'Hi {name},\n\nA quick note that I still have room in my schedule for {service}. Your quote is valid until the date shown on it.\n\nIf you\'d like to go ahead, just reply "yes" and I\'ll send booking details.\n\nThanks,\n{sender}\n{business}' },
        { day: 21, channel: 'SMS', purpose: 'Close the loop politely',
          text: 'Hi {name}, I\'ll mark your quote for {service} as closed for now. If anything changes, just reply and I\'ll update it for you. – {sender}' }
      ]
    },
    past: {
      label: 'Past client (job finished)',
      steps: [
        { day: 2, channel: 'SMS', purpose: 'Thank them and ask for a review',
          text: 'Hi {name}, thanks again for choosing {business} for {service}. If you were happy, a quick review would really help my small business: {reviewLink} – {sender}' },
        { day: 30, channel: 'SMS', purpose: 'Check everything is still good',
          text: 'Hi {name}, {sender} from {business} here. Just checking everything is still good after the {service}. Anything you need, let me know.' },
        { day: 90, channel: 'Email', purpose: 'Offer to rebook',
          text: 'Hi {name},\n\nIt\'s been about three months since your {service}. If you\'d like to book the next one, reply with a couple of days that suit and I\'ll fit you in.\n\nThanks,\n{sender}\n{business}\n\nDon\'t want these reminders? Reply STOP and I won\'t send any more.' },
        { day: 180, channel: 'Email', purpose: 'Ask for a referral',
          text: 'Hi {name},\n\nThanks for being a {business} customer. If you know anyone who needs {service}, I\'d be grateful if you passed on my details.\n\nCheers,\n{sender}\n\nDon\'t want these emails? Reply STOP and I won\'t send any more.' }
      ]
    }
  };

  function parseDate(iso) {
    var p = String(iso || '').split('-').map(Number);
    if (p.length !== 3 || p.some(function (x) { return !isFinite(x); })) return null;
    var d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    return isNaN(d.getTime()) ? null : d;
  }

  function iso(d) { return d.toISOString().slice(0, 10); }

  function addDays(d, n) { var c = new Date(d.getTime()); c.setUTCDate(c.getUTCDate() + n); return c; }

  /** Moves a Saturday or Sunday to the following Monday. */
  function skipWeekend(d) {
    var day = d.getUTCDay();
    if (day === 6) return addDays(d, 2);
    if (day === 0) return addDays(d, 1);
    return d;
  }

  function fill(template, vars) {
    return template.replace(/\{(\w+)\}/g, function (m, key) {
      var v = vars && vars[key];
      return v ? String(v).trim() : '[' + key + ']';
    });
  }

  /**
   * options: { type, startDate, skipWeekends, name, service, business, sender, reviewLink }
   */
  function buildSchedule(options) {
    var o = options || {};
    var plan = PLANS[o.type];
    if (!plan) return { errors: ['Choose a follow-up type.'], steps: [] };
    var start = parseDate(o.startDate);
    if (!start) return { errors: ['Enter a valid start date.'], steps: [] };
    var steps = plan.steps.map(function (s, i) {
      var date = addDays(start, s.day);
      if (o.skipWeekends) date = skipWeekend(date);
      return {
        index: i + 1,
        day: s.day,
        date: iso(date),
        channel: s.channel,
        purpose: s.purpose,
        message: fill(s.text, o)
      };
    });
    return { errors: [], label: plan.label, steps: steps };
  }

  function weekday(isoDate) {
    var d = parseDate(isoDate);
    return d ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()] : '';
  }

  function formatDate(isoDate) {
    var p = isoDate.split('-');
    return weekday(isoDate) + ' ' + p[2] + '/' + p[1] + '/' + p[0];
  }

  function buildText(options, schedule) {
    var out = ['FOLLOW-UP PLAN: ' + (options.name || '[name]') + ' · ' + schedule.label, ''];
    schedule.steps.forEach(function (s) {
      out.push(s.index + '. ' + formatDate(s.date) + ' · ' + s.channel + ' · ' + s.purpose);
      out.push(s.message.split('\n').map(function (l) { return '   ' + l; }).join('\n'));
      out.push('');
    });
    out.push('Stop following up as soon as they say no or ask you to stop.');
    return out.join('\n');
  }

  // --- iCalendar (RFC 5545) export ---

  function icsEscape(text) {
    return String(text).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }

  function utf8Length(ch) {
    var c = ch.codePointAt(0);
    return c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }

  /** Folds a content line so no line is longer than 75 octets. */
  function foldLine(line) {
    var out = [];
    var current = '';
    var bytes = 0;
    var limit = 75;
    Array.from(line).forEach(function (ch) {
      var len = utf8Length(ch);
      if (bytes + len > limit) {
        out.push(current);
        current = ' ';
        bytes = 1;
      }
      current += ch;
      bytes += len;
    });
    out.push(current);
    return out.join('\r\n');
  }

  function compactDate(isoDate) { return isoDate.replace(/-/g, ''); }

  function toICS(options, schedule, stamp) {
    var now = stamp || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    var slug = String(options.name || 'lead').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lead';
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//The Solo Service Provider//AI Follow-Up Planner//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    schedule.steps.forEach(function (s) {
      var next = iso(addDays(parseDate(s.date), 1));
      lines.push('BEGIN:VEVENT');
      lines.push('UID:' + slug + '-' + compactDate(s.date) + '-' + s.index + '@ai-follow-up-planner');
      lines.push('DTSTAMP:' + now);
      lines.push('DTSTART;VALUE=DATE:' + compactDate(s.date));
      lines.push('DTEND;VALUE=DATE:' + compactDate(next));
      lines.push('SUMMARY:' + icsEscape('Follow up ' + (options.name || 'lead') + ' (' + s.channel + ')'));
      lines.push('DESCRIPTION:' + icsEscape(s.purpose + '\n\n' + s.message));
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape('Follow up ' + (options.name || 'lead')), 'TRIGGER:PT9H', 'END:VALARM');
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.map(foldLine).join('\r\n') + '\r\n';
  }

  function buildAiPrompt(options, schedule) {
    return [
      'I am an Australian sole trader. Rewrite these follow-up messages so they sound like me: friendly, short and not pushy.',
      'Keep the same dates, channels and purpose for each step. Keep any opt-out wording.',
      'Do not add discounts, deadlines or claims I have not made. Keep SMS messages under 300 characters.',
      'Use Australian English.',
      '',
      buildText(options, schedule)
    ].join('\n');
  }

  var api = {
    PLANS: PLANS, parseDate: parseDate, skipWeekend: skipWeekend, fill: fill,
    buildSchedule: buildSchedule, buildText: buildText, formatDate: formatDate,
    icsEscape: icsEscape, foldLine: foldLine, toICS: toICS, buildAiPrompt: buildAiPrompt
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FollowUpLib = api;
})(this);
