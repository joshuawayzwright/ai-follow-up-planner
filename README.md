# AI Follow-Up Planner

Plan polite follow-ups for new enquiries, quotes you've sent and past clients. You get the dates, ready-to-send messages and a calendar file, so nothing slips through the cracks.

**[Open the app](https://joshuawayzwright.github.io/ai-follow-up-planner/)**

## Features

- Three plans: **new enquiry**, **quote sent** and **past client** (review, check-in, rebook, referral)
- Four steps each, with the date, channel (SMS, call or email) and purpose
- Messages filled in with their name, your service and your business
- Moves weekend follow-ups to Monday if you want
- **Add to calendar:** downloads an `.ics` file with a reminder for each step (works with Google Calendar, Apple Calendar and Outlook)
- An AI prompt that rewrites the messages in your voice without changing the plan
- Every plan ends by closing the loop, and the marketing messages include an opt-out

## Follow up responsibly

Only follow up with people who contacted you, and stop when they say no. Marketing messages need consent and a working way to opt out under the Spam Act 2003.

## Privacy

Everything runs in your browser. The app has no server, accounts, cookies, analytics or tracking, and it doesn't send what you type anywhere. Nothing is saved: close the tab and it's gone. A strict Content Security Policy blocks the page from loading anything from other sites.

## What "AI" means here

This app **doesn't call an AI model**. It does the maths and structure itself, then gives you a ready-to-paste prompt for the AI assistant you already use (ChatGPT, Claude, Gemini and so on). The prompt tells the assistant not to change your numbers.

## Run it yourself

No build step and no dependencies.

```bash
git clone https://github.com/joshuawayzwright/ai-follow-up-planner.git
cd ai-follow-up-planner
python3 -m http.server 8080   # then open http://localhost:8080
```

You can also just open `index.html` in a browser.

## Tests

```bash
npm test      # or: node --test "tests/*.test.js"
```

The tests cover the calculation logic in `lib.js`. CI runs them on every push and pull request.

## Files

| File | What it does |
|---|---|
| `index.html` | The page |
| `lib.js` | Calculations and text output (pure functions, tested) |
| `app.js` | Connects the form to `lib.js` |
| `style.css` | Styles, light and dark mode, print layout |
| `tests/` | Unit tests (Node's built-in test runner) |

## Licence

[MIT](LICENSE). Made by [Joshua Wright](https://github.com/joshuawayzwright) for [The Solo Service Provider](https://thesoloserviceprovider.com.au/), which has more toolkits for sole traders.

This is a planning aid, not legal, tax or financial advice.
