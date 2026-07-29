import React, { useState, useRef, useEffect } from "react";

// survey.nori-market.shop — community menu survey
// Flow: intro -> 10 questions -> contact capture -> 20%-off ticket
// Backend wiring lives in ONE place (submitResponses) — see the comment there.

const BRAND = "Nori's Market";

// Set VITE_API_URL in Amplify (Environment variables) or a local .env file.
// Falls back to the placeholder in this preview.
const API_URL =
  import.meta.env?.VITE_API_URL ||
  "https://cms.nori-market.shop/wp-json/nori/v1/survey";

// The page the QR opens when staff scan it (hosted on your WordPress domain).
const STAFF_SCANNER_URL = "https://cms.nori-market.shop/staff-scanner.html";

const QUESTIONS = [
  {
    key: "appeal",
    type: "scale",
    title: "How into a $6 sub & smoothie spot in the neighborhood are you?",
    hint: "1 = meh · 5 = take my money",
    ends: ["Meh", "Take my money"],
  },
  {
    key: "subs",
    type: "multi",
    title: "Which subs would you actually order?",
    hint: "Tap as many as you like.",
    options: ["Italian", "Turkey & herb", "Roast beef", "Ham & cheese",
      "Meatball parm", "Buffalo chicken", "Chicken caesar", "BLT",
      "Tuna", "Veggie", "Vegan / plant-based"],
    other: true,
  },
  {
    key: "smoothies",
    type: "multi",
    title: "And which smoothies sound good?",
    options: ["Mango", "Strawberry banana", "Mixed berry", "Green (spinach/kale)",
      "Tropical / pineapple", "Peanut butter banana", "Coffee / mocha",
      "Protein", "Açaí bowl-style"],
    other: true,
  },
  {
    key: "diet",
    type: "multi",
    title: "Any dietary needs we should nail?",
    hint: "So there's always something for you.",
    options: ["Vegan", "Vegetarian", "Gluten-free", "Dairy-free",
      "High-protein", "Keto / low-carb", "No restrictions"],
  },
  {
    key: "price6",
    type: "single",
    title: "We're planning $6 flat for subs and smoothies. That feels…",
    options: ["A great deal", "Fair", "A little high", "Too expensive"],
  },
  {
    key: "priceExpect",
    type: "chips",
    title: "What do you usually pay for a good sub elsewhere?",
    hint: "Roughly — just a gut check.",
    options: ["$5", "$6", "$7", "$8", "$9", "$10+"],
  },
  {
    key: "frequency",
    type: "single",
    title: "How often would you grab something from us?",
    options: ["A few times a week", "About once a week", "A few times a month",
      "Once in a while", "Just trying it out"],
  },
  {
    key: "dayparts",
    type: "multi",
    title: "When would you most likely stop by?",
    options: ["Breakfast", "Lunch", "After school / work", "Dinner",
      "Late night", "Weekends"],
  },
  {
    key: "extras",
    type: "multi",
    title: "What else would make you a regular?",
    hint: "Foods or services you'd love to see.",
    options: ["Rewards / loyalty", "Online ordering", "Delivery", "Catering",
      "Coffee & espresso", "Breakfast items", "Fresh salads", "Grain bowls",
      "Wraps", "Kids options", "Outdoor seating", "Late hours"],
    other: true,
  },
  {
    key: "dream",
    type: "text",
    title: "Dream sub or smoothie you wish existed?",
    hint: "Optional — go wild. The kitchen reads these.",
    placeholder: "e.g. a spicy Italian with hot honey…",
    optional: true,
  },
];

const TOTAL = QUESTIONS.length;

export default function NoriSurvey() {
  // step: -1 intro, 0..TOTAL-1 questions, TOTAL capture, TOTAL+1 done
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState({});
  const [contact, setContact] = useState({ name: "", email: "", area: "", updates: true });
  const [emailErr, setEmailErr] = useState("");
  const [code, setCode] = useState("");
  const topRef = useRef(null);

  useEffect(() => {
    if (topRef.current) topRef.current.focus();
    window.scrollTo?.(0, 0);
  }, [step]);

  const setAnswer = (k, v) => setAnswers((a) => ({ ...a, [k]: v }));
  const toggleMulti = (k, opt) =>
    setAnswers((a) => {
      const cur = a[k] || [];
      return { ...a, [k]: cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt] };
    });

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(-1, s - 1));
  const pick = (k, v) => { setAnswer(k, v); setTimeout(next, 220); }; // auto-advance

  async function submitResponses() {
    // Optimistic local code so the ticket always renders — even in this preview
    // or if the network hiccups. The server's code wins when it responds.
    let gen = "NORI-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contact, hp: "", answers }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.code) gen = data.code; // real coupon from Epos Now flow
      }
    } catch (e) {
      // offline / preview — keep the local code
    }
    setCode(gen);
    next();
  }

  const q = step >= 0 && step < TOTAL ? QUESTIONS[step] : null;

  // QR encodes a link to the staff page with the code as a query param.
  // A hosted image API keeps this dependency-free; see the learning notes for
  // how to swap in a local QR library for full offline/privacy.
  const redeemUrl = `${STAFF_SCANNER_URL}?code=${encodeURIComponent(code)}`;
  const qrSrc =
    "https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=" +
    encodeURIComponent(redeemUrl);

  return (
    <div className="sv-root">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap"
      />
      <style>{styles}</style>

      {/* top bar */}
      <header className="sv-top">
        <span className="sv-brand"><span className="sv-brand-mark">◍</span>{BRAND}</span>
        {step >= 0 && step < TOTAL && (
          <span className="sv-count">{step + 1} / {TOTAL}</span>
        )}
      </header>
      {step >= 0 && step < TOTAL && (
        <div className="sv-progress" aria-hidden>
          <div className="sv-progress-bar" style={{ width: `${((step) / TOTAL) * 100}%` }} />
        </div>
      )}

      <main className="sv-main">
        {/* INTRO */}
        {step === -1 && (
          <section className="sv-card sv-intro">
            <p className="sv-eyebrow">Help write the menu</p>
            <h1 className="sv-h1" tabIndex={-1} ref={topRef}>Your two minutes,<br />our whole menu.</h1>
            <p className="sv-lede">
              We're becoming your neighborhood sub-and-smoothie counter — and the
              neighborhood should build the menu. Answer a few quick questions and
              we'll hand you <b>20% off your first order</b> when we open.
            </p>
            <ul className="sv-facts">
              <li>10 quick taps</li><li>About 2 minutes</li><li>20% off at the end</li>
            </ul>
            <button className="sv-btn sv-btn-citrus sv-btn-lg" onClick={next}>
              Start the survey →
            </button>
          </section>
        )}

        {/* QUESTIONS */}
        {q && (
          <section className="sv-card">
            <p className="sv-qmeta">Question {step + 1}</p>
            <h2 className="sv-qtitle" tabIndex={-1} ref={topRef}>{q.title}</h2>
            {q.hint && <p className="sv-hint">{q.hint}</p>}

            {q.type === "scale" && (
              <div className="sv-scale">
                <div className="sv-scale-row">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      className={"sv-scale-dot" + (answers[q.key] === n ? " on" : "")}
                      onClick={() => pick(q.key, n)}
                      aria-label={`${n} of 5`}
                    >{n}</button>
                  ))}
                </div>
                <div className="sv-scale-ends"><span>{q.ends[0]}</span><span>{q.ends[1]}</span></div>
              </div>
            )}

            {(q.type === "single") && (
              <div className="sv-stack">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    className={"sv-opt" + (answers[q.key] === opt ? " on" : "")}
                    onClick={() => pick(q.key, opt)}
                  >{opt}</button>
                ))}
              </div>
            )}

            {q.type === "chips" && (
              <div className="sv-chips">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    className={"sv-chip" + (answers[q.key] === opt ? " on" : "")}
                    onClick={() => pick(q.key, opt)}
                  >{opt}</button>
                ))}
              </div>
            )}

            {q.type === "multi" && (
              <>
                <div className="sv-chips">
                  {q.options.map((opt) => {
                    const on = (answers[q.key] || []).includes(opt);
                    return (
                      <button
                        key={opt}
                        className={"sv-chip" + (on ? " on" : "")}
                        onClick={() => toggleMulti(q.key, opt)}
                        aria-pressed={on}
                      >{opt}</button>
                    );
                  })}
                  {q.other && (() => {
                    const on = (answers[q.key] || []).includes("Other");
                    return (
                      <button
                        className={"sv-chip" + (on ? " on" : "")}
                        onClick={() => toggleMulti(q.key, "Other")}
                        aria-pressed={on}
                      >+ Other</button>
                    );
                  })()}
                </div>
                {q.other && (answers[q.key] || []).includes("Other") && (
                  <input
                    className="sv-input"
                    placeholder="Tell us…"
                    value={answers[q.key + "__other"] || ""}
                    onChange={(e) => setAnswer(q.key + "__other", e.target.value)}
                  />
                )}
                <button className="sv-btn sv-btn-nori sv-btn-block" onClick={next}>
                  {(answers[q.key] || []).length ? "Next →" : "Skip →"}
                </button>
              </>
            )}

            {q.type === "text" && (
              <>
                <textarea
                  className="sv-textarea"
                  rows={3}
                  placeholder={q.placeholder}
                  value={answers[q.key] || ""}
                  onChange={(e) => setAnswer(q.key, e.target.value)}
                />
                <button className="sv-btn sv-btn-nori sv-btn-block" onClick={next}>
                  {answers[q.key] ? "Next →" : "Skip →"}
                </button>
              </>
            )}

            <button className="sv-back" onClick={back}>← Back</button>
          </section>
        )}

        {/* CONTACT CAPTURE */}
        {step === TOTAL && (
          <section className="sv-card">
            <p className="sv-eyebrow">Last step</p>
            <h2 className="sv-qtitle" tabIndex={-1} ref={topRef}>Where do we send your 20% off?</h2>
            <p className="sv-hint">We'll email your ticket and a heads-up when we open. No spam.</p>

            <label className="sv-label">Name <span className="sv-opt-tag">optional</span></label>
            <input className="sv-input" value={contact.name}
              onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder="First name" />

            <label className="sv-label">Email</label>
            <input className={"sv-input" + (emailErr ? " err" : "")} type="email" value={contact.email}
              onChange={(e) => { setContact({ ...contact, email: e.target.value }); setEmailErr(""); }}
              placeholder="you@email.com" />
            {emailErr && <p className="sv-err-msg">{emailErr}</p>}

            <label className="sv-label">Neighborhood <span className="sv-opt-tag">optional</span></label>
            <input className="sv-input" value={contact.area}
              onChange={(e) => setContact({ ...contact, area: e.target.value })} placeholder="e.g. West End" />

            <label className="sv-check">
              <input type="checkbox" checked={contact.updates}
                onChange={(e) => setContact({ ...contact, updates: e.target.checked })} />
              <span>Keep me posted on the opening and specials.</span>
            </label>

            <button className="sv-btn sv-btn-tomato sv-btn-block sv-btn-lg" onClick={() => {
              const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim());
              if (!ok) { setEmailErr("Please enter a valid email so we can send your ticket."); return; }
              submitResponses();
            }}>Get my 20% off ticket →</button>
            <button className="sv-back" onClick={back}>← Back</button>
          </section>
        )}

        {/* DONE — TICKET */}
        {step === TOTAL + 1 && (
          <section className="sv-card sv-done">
            <p className="sv-eyebrow" tabIndex={-1} ref={topRef}>You're on the list</p>
            <h2 className="sv-h1 sv-done-h1">Thanks for shaping the menu.</h2>
            <p className="sv-lede sv-done-lede">
              Here's your ticket. We'll email a copy{contact.name ? `, ${contact.name}` : ""} —
              show it at the counter on opening week.
            </p>

            <div className="sv-ticket">
              <div className="sv-ticket-top">
                <span className="sv-ticket-brand">{BRAND}</span>
                <span className="sv-ticket-serial">community</span>
              </div>
              <div className="sv-ticket-mid">
                <span className="sv-ticket-off">20%</span>
                <span className="sv-ticket-off-label">off your first order</span>
              </div>
              <div className="sv-ticket-perf" aria-hidden>
                <span className="sv-notch l" /><span className="sv-notch r" />
              </div>
              <div className="sv-ticket-stub">
                <span className="sv-ticket-code">{code}</span>
              </div>
            </div>

            <div className="sv-qr">
              <img
                className="sv-qr-img"
                src={qrSrc}
                alt={"Coupon QR code for " + code}
                width="180"
                height="180"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <p className="sv-qr-cap">Scan at the counter — or show code <b>{code}</b></p>
            </div>

            <p className="sv-done-note">One ticket per person · redeemable at opening · subs &amp; smoothies $6</p>
          </section>
        )}
      </main>

      <footer className="sv-foot">{BRAND} · community menu survey</footer>
    </div>
  );
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap');

.sv-root{
  --nori:#163a2b;--nori-900:#0e2a1f;--nori-700:#1e4a37;
  --leaf:#82ab3d;--leaf-deep:#5f8a2a;
  --citrus:#f2a63b;--tomato:#e04a2c;
  --paper:#f6f1e6;--paper-2:#efe6d3;--ink:#1b271f;--foam:#f7f3e9;
  --display:'Anton',Impact,sans-serif;--body:'DM Sans',system-ui,sans-serif;
  font-family:var(--body);color:var(--ink);background:var(--paper);
  font-synthesis:none;min-height:100vh;min-height:100dvh;line-height:1.5;-webkit-font-smoothing:antialiased;
  display:flex;flex-direction:column;
}
.sv-root *{box-sizing:border-box;}
.sv-root button{font-family:inherit;cursor:pointer;}

.sv-top{
  display:flex;align-items:center;justify-content:space-between;
  padding:.9rem 1.1rem;background:var(--nori);color:var(--foam);
}
.sv-brand{font-family:var(--display);font-weight:800;font-size:1.25rem;letter-spacing:.02em;
  text-transform:uppercase;display:flex;align-items:center;gap:.4rem;}
.sv-brand-mark{color:var(--leaf);font-family:var(--body);}
.sv-count{font-weight:700;font-size:.82rem;color:rgba(247,243,233,.75);letter-spacing:.05em;}
.sv-progress{height:5px;background:var(--paper-2);}
.sv-progress-bar{height:100%;background:var(--citrus);transition:width .3s ease;}

.sv-main{flex:1;display:flex;justify-content:center;padding:1.2rem 1rem 2rem;}
.sv-card{width:100%;max-width:560px;}

.sv-eyebrow{font-weight:700;font-size:.74rem;letter-spacing:.16em;text-transform:uppercase;
  color:var(--leaf-deep);margin:.4rem 0 .8rem;}
.sv-h1{font-family:var(--display);font-weight:800;text-transform:uppercase;
  font-size:clamp(2rem,7vw,3rem);line-height:.96;color:var(--nori);margin:0 0 1rem;outline:none;}
.sv-lede{font-size:1.05rem;color:#3d4a3f;margin:0 0 1.3rem;}
.sv-lede b{color:var(--nori);}
.sv-facts{list-style:none;display:flex;flex-wrap:wrap;gap:.5rem;padding:0;margin:0 0 1.6rem;}
.sv-facts li{background:var(--paper-2);border-radius:999px;padding:.32rem .8rem;
  font-weight:700;font-size:.76rem;color:var(--nori);}

.sv-qmeta{font-weight:700;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;
  color:var(--leaf-deep);margin:.2rem 0 .5rem;}
.sv-qtitle{font-size:clamp(1.4rem,4.5vw,1.9rem);font-weight:700;line-height:1.15;
  color:var(--nori);margin:0 0 .5rem;outline:none;}
.sv-hint{font-size:.95rem;color:#6a7663;margin:0 0 1.3rem;}

/* scale */
.sv-scale{margin-top:.5rem;}
.sv-scale-row{display:flex;gap:.6rem;}
.sv-scale-dot{flex:1;aspect-ratio:1;border:2px solid var(--nori);background:#fff;border-radius:50%;
  font-family:var(--display);font-weight:800;font-size:1.4rem;color:var(--nori);
  transition:transform .1s ease,background .15s ease,color .15s ease;}
.sv-scale-dot:hover{transform:translateY(-2px);}
.sv-scale-dot.on{background:var(--citrus);border-color:var(--citrus);color:var(--nori-900);}
.sv-scale-ends{display:flex;justify-content:space-between;margin-top:.6rem;
  font-size:.8rem;color:#6a7663;font-weight:600;}

/* single (stacked) */
.sv-stack{display:flex;flex-direction:column;gap:.6rem;}
.sv-opt{text-align:left;background:#fff;border:2px solid rgba(22,58,43,.16);border-radius:12px;
  padding:.95rem 1.1rem;font-size:1.02rem;font-weight:600;color:var(--ink);
  transition:transform .1s ease,border-color .15s ease,background .15s ease;}
.sv-opt:hover{transform:translateY(-2px);border-color:var(--leaf);}
.sv-opt.on{border-color:var(--citrus);background:#fff7ea;}

/* chips */
.sv-chips{display:flex;flex-wrap:wrap;gap:.55rem;}
.sv-chip{background:#fff;border:2px solid rgba(22,58,43,.16);border-radius:999px;
  padding:.6rem .95rem;font-size:.96rem;font-weight:600;color:var(--ink);
  transition:transform .1s ease,border-color .15s ease,background .15s ease,color .15s ease;}
.sv-chip:hover{transform:translateY(-2px);border-color:var(--leaf);}
.sv-chip.on{background:var(--nori);border-color:var(--nori);color:var(--foam);}

/* inputs */
.sv-input,.sv-textarea{width:100%;background:#fff;border:2px solid rgba(22,58,43,.18);
  border-radius:12px;padding:.85rem 1rem;font-family:inherit;font-size:1rem;color:var(--ink);
  margin-top:.8rem;}
.sv-input:focus,.sv-textarea:focus{outline:none;border-color:var(--citrus);}
.sv-input.err{border-color:var(--tomato);}
.sv-textarea{resize:vertical;}
.sv-label{display:block;font-weight:700;font-size:.9rem;color:var(--nori);margin-top:1rem;}
.sv-opt-tag{font-weight:500;color:#8a9683;font-size:.8rem;}
.sv-err-msg{color:var(--tomato);font-size:.85rem;font-weight:600;margin:.4rem 0 0;}
.sv-check{display:flex;gap:.6rem;align-items:flex-start;margin-top:1.1rem;
  font-size:.92rem;color:#3d4a3f;cursor:pointer;}
.sv-check input{margin-top:.15rem;width:1.1rem;height:1.1rem;accent-color:var(--nori);}

/* buttons */
.sv-btn{border:none;font-weight:700;font-size:1rem;border-radius:12px;padding:.9rem 1.3rem;
  transition:transform .12s ease,box-shadow .2s ease;}
.sv-btn:hover{transform:translateY(-2px);}
.sv-btn-lg{font-size:1.08rem;padding:1.05rem 1.4rem;}
.sv-btn-block{display:block;width:100%;margin-top:1.4rem;}
.sv-btn-citrus{background:var(--citrus);color:var(--nori-900);box-shadow:0 5px 0 0 #c9832a;}
.sv-btn-tomato{background:var(--tomato);color:var(--foam);box-shadow:0 5px 0 0 #b23a20;}
.sv-btn-nori{background:var(--nori);color:var(--foam);box-shadow:0 5px 0 0 #0c2016;}
.sv-back{display:block;margin:1.1rem auto 0;background:none;border:none;
  color:#6a7663;font-weight:600;font-size:.9rem;padding:.4rem;}
.sv-back:hover{color:var(--nori);}

/* done ticket */
.sv-done{text-align:center;}
.sv-done-h1{font-size:clamp(1.8rem,6vw,2.6rem);}
.sv-done-lede{margin-left:auto;margin-right:auto;max-width:38ch;}
.sv-ticket{max-width:340px;margin:.4rem auto 0;background:#fff;border-radius:14px;overflow:hidden;
  box-shadow:0 18px 44px rgba(22,58,43,.22);text-align:center;transform:rotate(-1.5deg);}
.sv-ticket-top{display:flex;justify-content:space-between;align-items:center;
  padding:.8rem 1.1rem;background:var(--tomato);color:var(--foam);}
.sv-ticket-brand{font-family:var(--display);font-weight:800;text-transform:uppercase;letter-spacing:.03em;}
.sv-ticket-serial{font-weight:700;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;}
.sv-ticket-mid{padding:1.5rem 1rem .5rem;display:flex;flex-direction:column;align-items:center;}
.sv-ticket-off{font-family:var(--display);font-weight:800;font-size:4.4rem;line-height:.8;color:var(--nori);}
.sv-ticket-off-label{font-weight:700;text-transform:uppercase;letter-spacing:.12em;
  font-size:.72rem;color:var(--leaf-deep);margin-top:.4rem;}
.sv-ticket-perf{position:relative;height:1.3rem;margin:.5rem 0;}
.sv-ticket-perf::before{content:"";position:absolute;top:50%;left:13px;right:13px;
  border-top:2px dashed rgba(22,58,43,.28);}
.sv-notch{position:absolute;top:50%;transform:translateY(-50%);width:22px;height:22px;
  border-radius:50%;background:var(--paper);}
.sv-notch.l{left:-11px;}.sv-notch.r{right:-11px;}
.sv-ticket-stub{padding:1rem;background:repeating-linear-gradient(45deg,transparent 0 8px,rgba(22,58,43,.03) 8px 16px);}
.sv-ticket-code{font-family:var(--display);font-weight:800;font-size:1.7rem;letter-spacing:.14em;color:var(--tomato);}
.sv-done-note{font-size:.82rem;color:#6a7663;margin:1.3rem 0 0;}

.sv-qr{margin-top:1.4rem;}
.sv-qr-img{width:180px;height:180px;background:#fff;border-radius:12px;padding:10px;
  box-shadow:0 8px 22px rgba(22,58,43,.14);}
.sv-qr-cap{font-size:.85rem;color:#4b584a;margin:.7rem 0 0;}
.sv-qr-cap b{color:var(--nori);letter-spacing:.06em;}

.sv-foot{text-align:center;padding:1rem;font-size:.78rem;color:#8a9683;
  border-top:1px solid rgba(22,58,43,.1);}

.sv-root :focus-visible{outline:3px solid var(--citrus);outline-offset:2px;}

@media (prefers-reduced-motion:reduce){ .sv-root *{transition:none!important;} }
`;
