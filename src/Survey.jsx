import React, { useState, useRef, useEffect } from "react";

// survey.nori-market.shop — community menu survey
const BRAND = "Nori's Market";

// Base domain from env or fallback to WordPress CMS domain
const BASE_URL = import.meta.env?.VITE_API_URL || "https://cms.nori-market.shop";
// Ensure the REST API endpoint path is cleanly appended
const API_URL = BASE_URL.includes("/wp-json/") 
  ? BASE_URL 
  : `${BASE_URL.replace(/\/$/, "")}/wp-json/nori/v1/survey`;

// The page the QR opens when staff scan it (hosted on your WordPress domain).
const STAFF_SCANNER_URL = "https://cms.nori-market.shop/staff-scanner.html";

// Integrated questions array — feel free to modify or add options directly here!
const QUESTIONS = [
  // SECTION 1: CORE BRAND & SANDWICH BUILDER
  {
    key: "appeal",
    type: "scale",
    title: "How into a $6 sub & smoothie spot in the neighborhood are you?",
    hint: "1 = meh · 5 = take my money",
    ends: ["Meh", "Take my money"],
  },
  {
    key: "sub_bread",
    type: "chips",
    title: "What bread base would you build on?",
    hint: "Tap your main choice.",
    options: ["Italian White", "Honey Oat", "Whole Wheat", "Gluten-Free Wrap", "Brioche Sub Roll"],
  },
  {
    key: "sub_protein",
    type: "multi",
    title: "Which sub proteins would you actually order?",
    hint: "Tap as many as you like.",
    options: [
      "Smoked Turkey", "Roast Beef", "Salami & Pepperoni", "Tuna Salad",
      "Chicken Cutlet", "Plant-Based Chickpea", "Vegan Deli Slices", "Meatballs"
    ],
    other: true,
  },
  {
    key: "sub_cheese",
    type: "chips",
    title: "Favorite cheese to melt on top?",
    options: ["Provolone", "Swiss", "Sharp Cheddar", "Pepper Jack", "Vegan Cheese", "No Cheese"],
  },
  {
    key: "sub_veggies",
    type: "multi",
    title: "Which veggies and crunch factors do you need?",
    hint: "Tap all that apply.",
    options: [
      "Shredded Lettuce", "Sliced Tomatoes", "Red Onions", "Pickles",
      "Jalapeños", "Banana Peppers", "Baby Spinach", "Black Olives", "Cucumbers"
    ],
  },
  {
    key: "sub_sauce",
    type: "multi",
    title: "Sauce & drizzle preference?",
    options: [
      "House Herb Vinaigrette", "Spicy Mayo", "Garlic Aioli", "Honey Mustard",
      "Hot Honey", "Oil & Vinegar", "Ranch", "Chipotle Mayo"
    ],
    other: true,
  },
  {
    key: "sub_toasted",
    type: "single",
    title: "How do you like your sub served?",
    options: ["Warm & Extra Toasted", "Lightly Warmed", "Cold / Fresh Cut"],
  },
  {
    key: "sub_custom_name",
    type: "text",
    title: "Name your dream signature $6 sub creation",
    hint: "Optional — go wild. The kitchen team reads these!",
    placeholder: "e.g. The Tara Blvd Spicy Stack…",
    optional: true,
  },
  {
    key: "smoothies",
    type: "multi",
    title: "Which real-fruit smoothies sound best to pair with it?",
    options: [
      "Mango Passion", "Strawberry Banana", "Wild Berry Blast", "Green Detox (Spinach/Kale)",
      "Tropical Pineapple", "Peanut Butter Banana", "Cold Brew Mocha", "Protein Power"
    ],
    other: true,
  },

  // SECTION 2: LOCAL FARMERS' MARKET INTEREST
  {
    key: "farmer_appeal",
    type: "scale",
    title: "How appealing is a weekly Farmers' Market at Nori's?",
    hint: "1 = Not interested · 5 = Would shop weekly",
    ends: ["Not interested", "Would shop weekly"],
  },
  {
    key: "farmer_goods",
    type: "multi",
    title: "Which local farm goods would bring you out?",
    hint: "Select everything you'd buy locally.",
    options: [
      "Organic Produce & Greens", "Fresh Farm Eggs", "Local Honey & Jams",
      "Artisanal Fresh Breads", "Handcrafted Soaps & Body Care", "Fresh Cut Flowers", "Herbal Teas"
    ],
    other: true,
  },
  {
    key: "farmer_freq",
    type: "single",
    title: "How often would you stop by the Farmers' Market?",
    options: ["Every Weekend", "Twice a Month", "Once a Month", "Occasionally"],
  },

  // SECTION 3: COMMUNITY CART-SHARE (BULK ORGANIC GROCERIES)
  {
    key: "cartshare_appeal",
    type: "scale",
    title: "Interest in 'Community Cart-Share' bulk wholesale orders?",
    hint: "Group up with neighbors to order organic staples at wholesale pricing (1 = Meh, 5 = Love it)",
    ends: ["Meh", "Love it"],
  },
  {
    key: "cartshare_group",
    type: "chips",
    title: "Who would you group-buy or share a cart with?",
    options: ["Neighbors / Block", "Coworkers", "Family / Friends", "Church / Civic Group", "Just Myself"],
  },
  {
    key: "cartshare_organizer",
    type: "single",
    title: "Would you be open to organizing a neighborhood cart group?",
    hint: "Organizers get extra perks & discounts on their family grocery orders.",
    options: ["Yes, sign me up as a host!", "Maybe, tell me more", "No, just want to participate"],
  },

  // SECTION 4: FREQUENCY & EXTRAS
  {
    key: "frequency",
    type: "single",
    title: "Overall, how often will you visit Nori's Market?",
    options: ["A few times a week", "About once a week", "A few times a month", "Just trying it out"],
  },
  {
    key: "extras",
    type: "multi",
    title: "What else would make you a regular?",
    options: [
      "Rewards / Loyalty Points", "Online Pre-Ordering", "Local Delivery",
      "Notary & Mobile Drop-off", "Breakfast Items", "Outdoor Seating", "Late Hours"
    ],
    other: true,
  },
];

const TOTAL = QUESTIONS.length;

export default function NoriSurvey() {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState({});
  const [contact, setContact] = useState({ name: "", email: "", area: "", phone: "", updates: true });
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
  const pick = (k, v) => { setAnswer(k, v); setTimeout(next, 220); };

  async function submitResponses() {
    let gen = "NORI-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contact, hp: "", answers }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.code) gen = data.code;
      }
    } catch (e) {
      // preview fallback
    }
    setCode(gen);
    next();
  }

  const q = step >= 0 && step < TOTAL ? QUESTIONS[step] : null;

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

      {/* Top Header — Full edge-to-edge */}
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

      {/* Main Container — Spans 100% width without body margin */}
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
            <p className="sv-qmeta">Question {step + 1} of {TOTAL}</p>
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

            <label className="sv-label">Email *</label>
            <input className={"sv-input" + (emailErr ? " err" : "")} type="email" value={contact.email}
              onChange={(e) => { setContact({ ...contact, email: e.target.value }); setEmailErr(""); }}
              placeholder="you@email.com" />
            {emailErr && <p className="sv-err-msg">{emailErr}</p>}

            <label className="sv-label">Phone (For SMS Drop Alerts) <span className="sv-opt-tag">optional</span></label>
            <input className="sv-input" type="tel" value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="(404) 555-0199" />

            <label className="sv-label">Neighborhood <span className="sv-opt-tag">optional</span></label>
            <input className="sv-input" value={contact.area}
              onChange={(e) => setContact({ ...contact, area: e.target.value })} placeholder="e.g. Jonesboro / Tara Blvd" />

            <label className="sv-check">
              <input type="checkbox" checked={contact.updates}
                onChange={(e) => setContact({ ...contact, updates: e.target.checked })} />
              <span>Keep me posted on partner drops and specials.</span>
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
            <h2 className="sv-h1 sv-done-h1">Thanks for shaping Nori's Market.</h2>
            <p className="sv-lede sv-done-lede">
              Here's your ticket. We'll email a copy{contact.name ? `, ${contact.name}` : ""} —
              show it at the counter or use it online when we launch!
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

            <p className="sv-done-note">One ticket per person · redeemable at opening · $6 subs &amp; smoothies</p>
          </section>
        )}
      </main>

      <footer className="sv-foot">{BRAND} · neighborhood marketplace &amp; cafe network</footer>
    </div>
  );
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap');

/* Force HTML and Body to 0 margin/padding to flush completely against the viewport */
html, body {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  overflow-x: hidden !important;
}

.sv-root{
  --nori:#163a2b;--nori-900:#0e2a1f;--nori-700:#1e4a37;
  --leaf:#82ab3d;--leaf-deep:#5f8a2a;
  --citrus:#f2a63b;--tomato:#e04a2c;
  --paper:#f6f1e6;--paper-2:#efe6d3;--ink:#1b271f;--foam:#f7f3e9;
  --display:'Anton',Impact,sans-serif;--body:'DM Sans',system-ui,sans-serif;
  font-family:var(--body);color:var(--ink);background:var(--paper);
  font-synthesis:none;min-height:100vh;min-height:100dvh;line-height:1.5;-webkit-font-smoothing:antialiased;
  display:flex;flex-direction:column;
  width:100vw;margin:0;padding:0;
}
.sv-root *{box-sizing:border-box;}
.sv-root button{font-family:inherit;cursor:pointer;}

.sv-top{
  display:flex;align-items:center;justify-content:space-between;
  padding:1rem 1.5rem;background:var(--nori);color:var(--foam);
  width:100%;box-sizing:border-box;
}
.sv-brand{font-family:var(--display);font-weight:800;font-size:1.35rem;letter-spacing:.02em;
  text-transform:uppercase;display:flex;align-items:center;gap:.4rem;}
.sv-brand-mark{color:var(--leaf);font-family:var(--body);}
.sv-count{font-weight:700;font-size:.85rem;color:rgba(247,243,233,.75);letter-spacing:.05em;}
.sv-progress{height:6px;background:var(--paper-2);width:100%;}
.sv-progress-bar{height:100%;background:var(--citrus);transition:width .3s ease;}

.sv-main{
  flex:1;display:flex;justify-content:center;
  padding:2rem 1.5rem 3rem;width:100%;box-sizing:border-box;
}
.sv-card{width:100%;max-width:720px;}

.sv-eyebrow{font-weight:700;font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;
  color:var(--leaf-deep);margin:.4rem 0 .8rem;}
.sv-h1{font-family:var(--display);font-weight:800;text-transform:uppercase;
  font-size:clamp(2.2rem,8vw,3.6rem);line-height:.96;color:var(--nori);margin:0 0 1rem;outline:none;}
.sv-lede{font-size:1.1rem;color:#3d4a3f;margin:0 0 1.4rem;line-height:1.5;}
.sv-lede b{color:var(--nori);}
.sv-facts{list-style:none;display:flex;flex-wrap:wrap;gap:.6rem;padding:0;margin:0 0 1.8rem;}
.sv-facts li{background:var(--paper-2);border-radius:999px;padding:.4rem .9rem;
  font-weight:700;font-size:.8rem;color:var(--nori);}

.sv-qmeta{font-weight:700;font-size:.76rem;letter-spacing:.14em;text-transform:uppercase;
  color:var(--leaf-deep);margin:.2rem 0 .5rem;}
.sv-qtitle{font-size:clamp(1.5rem,5vw,2.2rem);font-weight:700;line-height:1.18;
  color:var(--nori);margin:0 0 .5rem;outline:none;}
.sv-hint{font-size:1rem;color:#6a7663;margin:0 0 1.4rem;}

/* scale */
.sv-scale{margin-top:.5rem;}
.sv-scale-row{display:flex;gap:.6rem;}
.sv-scale-dot{flex:1;aspect-ratio:1;border:2px solid var(--nori);background:#fff;border-radius:50%;
  font-family:var(--display);font-weight:800;font-size:1.4rem;color:var(--nori);
  transition:transform .1s ease,background .15s ease,color .15s ease;}
.sv-scale-dot:hover{transform:translateY(-2px);}
.sv-scale-dot.on{background:var(--citrus);border-color:var(--citrus);color:var(--nori-900);}
.sv-scale-ends{display:flex;justify-content:space-between;margin-top:.6rem;
  font-size:.85rem;color:#6a7663;font-weight:600;}

/* single (stacked) */
.sv-stack{display:flex;flex-direction:column;gap:.7rem;}
.sv-opt{text-align:left;background:#fff;border:2px solid rgba(22,58,43,.16);border-radius:12px;
  padding:1rem 1.2rem;font-size:1.05rem;font-weight:600;color:var(--ink);
  transition:transform .1s ease,border-color .15s ease,background .15s ease;}
.sv-opt:hover{transform:translateY(-2px);border-color:var(--leaf);}
.sv-opt.on{border-color:var(--citrus);background:#fff7ea;}

/* chips */
.sv-chips{display:flex;flex-wrap:wrap;gap:.6rem;}
.sv-chip{background:#fff;border:2px solid rgba(22,58,43,.16);border-radius:999px;
  padding:.65rem 1rem;font-size:1rem;font-weight:600;color:var(--ink);
  transition:transform .1s ease,border-color .15s ease,background .15s ease,color .15s ease;}
.sv-chip:hover{transform:translateY(-2px);border-color:var(--leaf);}
.sv-chip.on{background:var(--nori);border-color:var(--nori);color:var(--foam);}

/* inputs */
.sv-input,.sv-textarea{width:100%;background:#fff;border:2px solid rgba(22,58,43,.18);
  border-radius:12px;padding:.9rem 1.1rem;font-family:inherit;font-size:1rem;color:var(--ink);
  margin-top:.8rem;}
.sv-input:focus,.sv-textarea:focus{outline:none;border-color:var(--citrus);}
.sv-input.err{border-color:var(--tomato);}
.sv-textarea{resize:vertical;}
.sv-label{display:block;font-weight:700;font-size:.92rem;color:var(--nori);margin-top:1.1rem;}
.sv-opt-tag{font-weight:500;color:#8a9683;font-size:.8rem;}
.sv-err-msg{color:var(--tomato);font-size:.88rem;font-weight:600;margin:.4rem 0 0;}
.sv-check{display:flex;gap:.6rem;align-items:flex-start;margin-top:1.2rem;
  font-size:.95rem;color:#3d4a3f;cursor:pointer;}
.sv-check input{margin-top:.15rem;width:1.1rem;height:1.1rem;accent-color:var(--nori);}

/* buttons */
.sv-btn{border:none;font-weight:700;font-size:1rem;border-radius:12px;padding:.95rem 1.4rem;
  transition:transform .12s ease,box-shadow .2s ease;}
.sv-btn:hover{transform:translateY(-2px);}
.sv-btn-lg{font-size:1.1rem;padding:1.1rem 1.5rem;}
.sv-btn-block{display:block;width:100%;margin-top:1.5rem;}
.sv-btn-citrus{background:var(--citrus);color:var(--nori-900);box-shadow:0 5px 0 0 #c9832a;}
.sv-btn-tomato{background:var(--tomato);color:var(--foam);box-shadow:0 5px 0 0 #b23a20;}
.sv-btn-nori{background:var(--nori);color:var(--foam);box-shadow:0 5px 0 0 #0c2016;}
.sv-back{display:block;margin:1.2rem auto 0;background:none;border:none;
  color:#6a7663;font-weight:600;font-size:.92rem;padding:.4rem;}
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

.sv-foot{text-align:center;padding:1.2rem;font-size:.8rem;color:#8a9683;
  border-top:1px solid rgba(22,58,43,.1);width:100%;box-sizing:border-box;}

.sv-root :focus-visible{outline:3px solid var(--citrus);outline-offset:2px;}

@media (prefers-reduced-motion:reduce){ .sv-root *{transition:none!important;} }
`;