const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../lib.js');

const opts = { type: 'quote', startDate: '2026-11-19', name: 'Sam', service: 'lawn mowing', business: 'GC Lawns', sender: 'Josh' };

test('quote plan has four steps at the right offsets', () => {
  const s = F.buildSchedule(opts);
  assert.deepEqual(s.errors, []);
  assert.deepEqual(s.steps.map(x => x.date), ['2026-11-21', '2026-11-24', '2026-11-29', '2026-12-10']);
});

test('skipWeekends moves Saturday and Sunday to Monday', () => {
  const s = F.buildSchedule({ ...opts, skipWeekends: true });
  // 21 Nov 2026 is a Saturday, 29 Nov is a Sunday
  assert.equal(s.steps[0].date, '2026-11-23');
  assert.equal(s.steps[2].date, '2026-11-30');
  s.steps.forEach(x => {
    const day = new Date(x.date + 'T00:00:00Z').getUTCDay();
    assert.ok(day !== 0 && day !== 6, x.date + ' is a weekend');
  });
});

test('templates are filled and missing values become visible placeholders', () => {
  const s = F.buildSchedule({ ...opts, type: 'past' });
  assert.match(s.steps[0].message, /Hi Sam, thanks again for choosing GC Lawns for lawn mowing/);
  assert.match(s.steps[0].message, /\[reviewLink\]/);
});

test('marketing-style steps for past clients include an opt-out', () => {
  const s = F.buildSchedule({ ...opts, type: 'past' });
  assert.match(s.steps[2].message, /Reply STOP/);
  assert.match(s.steps[3].message, /Reply STOP/);
});

test('bad input gives errors, not a crash', () => {
  assert.deepEqual(F.buildSchedule({ ...opts, type: 'nope' }).errors, ['Choose a follow-up type.']);
  assert.deepEqual(F.buildSchedule({ ...opts, startDate: 'soon' }).errors, ['Enter a valid start date.']);
});

test('ICS escapes special characters', () => {
  assert.equal(F.icsEscape('a,b;c\\d\ne'), 'a\\,b\;c\\\\d\\ne');
});

test('ICS lines are folded to 75 octets, including multi-byte characters', () => {
  const folded = F.foldLine('DESCRIPTION:' + 'é'.repeat(100));
  folded.split('\r\n').forEach(line => assert.ok(Buffer.byteLength(line, 'utf8') <= 75));
  assert.equal(folded.replace(/\r\n /g, ''), 'DESCRIPTION:' + 'é'.repeat(100));
});

test('ICS file is valid-looking and has one event per step', () => {
  const s = F.buildSchedule(opts);
  const ics = F.toICS(opts, s, '20261119T000000Z');
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 4);
  assert.match(ics, /DTSTART;VALUE=DATE:20261121\r\nDTEND;VALUE=DATE:20261122/);
  assert.match(ics, /UID:sam-20261121-1@ai-follow-up-planner/);
  assert.ok(!/[^\r]\n/.test(ics), 'every line ends in CRLF');
});

test('text plan and AI prompt', () => {
  const s = F.buildSchedule(opts);
  const text = F.buildText(opts, s);
  assert.match(text, /1\. Sat 21\/11\/2026 · SMS/);
  assert.match(text, /Stop following up/);
  assert.match(F.buildAiPrompt(opts, s), /Keep the same dates/);
});
