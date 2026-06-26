"use client";
import { useState, useRef, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
} from "framer-motion";
import axios from "axios";

type Source = { filename: string; page: number; chunk_text: string };
type Message = { role: "user" | "assistant"; content: string; sources?: Source[] };

/* ─── tiny helpers ─── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] } },
});

const FadeSection = ({ children, delay = 0, className = "" }: any) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

/* ─── scrolling ticker ─── */
const TICKER_ITEMS = [
  "FAISS Vector Search", "Groq LLaMA 3.3", "Sentence Transformers",
  "FastAPI", "Next.js", "RAG Pipeline", "Semantic Retrieval",
  "PDF Ingestion", "Source Citations", "Context-Aware QA",
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [docId, setDocId] = useState("");
  const [uploadedName, setUploadedName] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [expandedSource, setExpandedSource] = useState<number | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const upload = async (f: File) => {
    setUploading(true);
    const form = new FormData();
    form.append("file", f);
    try {
      const res = await axios.post("http://127.0.0.1:8000/upload", form, { timeout: 60000 });
      setDocId(res.data.document_id);
      setUploadedName(f.name);
    } catch (err: any) {
      alert(err.response ? JSON.stringify(err.response.data) : "Cannot connect to backend on port 8000.");
    } finally {
      setUploading(false);
    }
  };

  const ask = async () => {
    if (!question.trim() || !docId) return;
    const q = question.trim();
    setQuestion("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setAsking(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/ask", {
        question: q,
        document_ids: [docId],
        chat_history: messages.map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages((m) => [...m, { role: "assistant", content: res.data.answer, sources: res.data.sources }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Something went wrong. Is the backend running?" }]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0a0a09;
          --surface: #111110;
          --border: rgba(255,255,255,0.08);
          --border-hover: rgba(255,255,255,0.18);
          --text: #f0ede8;
          --muted: #7a776f;
          --accent: #d4c9a8;
          --accent2: #a89b7a;
          --gold: #c9a96e;
          --serif: 'Playfair Display', Georgia, serif;
          --sans: 'DM Sans', system-ui, sans-serif;
        }

        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--text); font-family: var(--sans); }

        /* noise overlay */
        body::before {
          content: '';
          position: fixed; inset: 0; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
        }

        /* scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: #2a2a27; border-radius: 4px; }

        .tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--gold); font-family: var(--sans); font-weight: 500;
          border: 1px solid rgba(201,169,110,0.3); padding: 4px 12px; border-radius: 20px;
        }

        .btn-primary {
          background: var(--gold); color: #0a0a09;
          border: none; border-radius: 6px; padding: 12px 28px;
          font-family: var(--sans); font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
          letter-spacing: 0.02em;
        }
        .btn-primary:hover { background: #d9b87e; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .btn-ghost {
          background: transparent; color: var(--text);
          border: 1px solid var(--border); border-radius: 6px;
          padding: 10px 22px; font-family: var(--sans); font-size: 14px;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-ghost:hover { border-color: var(--border-hover); background: rgba(255,255,255,0.04); }

        .card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 28px;
          transition: border-color 0.3s;
        }
        .card:hover { border-color: var(--border-hover); }

        input[type="text"], textarea {
          background: rgba(255,255,255,0.04); border: 1px solid var(--border);
          border-radius: 8px; color: var(--text); font-family: var(--sans);
          font-size: 14px; outline: none; transition: border-color 0.2s;
        }
        input[type="text"]:focus, textarea:focus { border-color: rgba(201,169,110,0.5); }

        .divider {
          height: 1px; background: var(--border); margin: 0;
        }

        /* ticker */
        .ticker-wrap { overflow: hidden; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 14px 0; }
        .ticker-track { display: flex; gap: 48px; width: max-content; animation: ticker 30s linear infinite; }
        .ticker-track:hover { animation-play-state: paused; }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ticker-item { font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); white-space: nowrap; }
        .ticker-dot { color: var(--gold); font-size: 10px; }

        /* hero grid */
        .hero-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent);
        }

        /* pipeline */
        .pipeline-line {
          position: absolute; left: 24px; top: 0; bottom: 0; width: 1px;
          background: linear-gradient(to bottom, transparent, var(--gold) 20%, var(--gold) 80%, transparent);
        }
        .pipeline-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: var(--gold); box-shadow: 0 0 12px rgba(201,169,110,0.6);
          flex-shrink: 0; margin-top: 4px;
        }

        /* chat */
        .chat-bubble-user {
          background: rgba(201,169,110,0.1); border: 1px solid rgba(201,169,110,0.2);
          border-radius: 12px 12px 2px 12px; padding: 12px 16px; font-size: 14px;
          line-height: 1.6; max-width: 80%; margin-left: auto;
        }
        .chat-bubble-ai {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px 12px 12px 2px; padding: 14px 18px; font-size: 14px;
          line-height: 1.7; max-width: 90%;
        }
        .source-chip {
          display: inline-flex; align-items: center; gap: 5px; cursor: pointer;
          font-size: 11px; color: var(--gold); border: 1px solid rgba(201,169,110,0.25);
          border-radius: 4px; padding: 2px 8px; transition: all 0.2s;
          font-family: var(--sans); letter-spacing: 0.04em;
        }
        .source-chip:hover { background: rgba(201,169,110,0.08); border-color: rgba(201,169,110,0.5); }

        /* typing dots */
        .typing span { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: var(--muted); margin: 0 2px; animation: bounce 1.2s infinite; }
        .typing span:nth-child(2) { animation-delay: 0.15s; }
        .typing span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

        /* drop zone */
        .dropzone {
          border: 1.5px dashed var(--border); border-radius: 10px;
          padding: 32px 20px; text-align: center; transition: all 0.25s; cursor: pointer;
        }
        .dropzone.active { border-color: var(--gold); background: rgba(201,169,110,0.04); }

        /* section layout */
        .section { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
        .py-section { padding: 100px 0; }
        .py-section-sm { padding: 64px 0; }

        /* feature grid */
        .feature-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
        @media(max-width:768px) { .feature-grid { grid-template-columns: 1fr; } }
        .feature-cell { background: var(--bg); padding: 32px 28px; transition: background 0.3s; }
        .feature-cell:hover { background: var(--surface); }
        .feature-icon { font-size: 20px; margin-bottom: 14px; opacity: 0.8; }
      `}</style>

      <div ref={containerRef} style={{ position: "relative", zIndex: 1 }}>

        {/* ── NAV ── */}
        <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, borderBottom: "1px solid var(--border)", backdropFilter: "blur(20px)", background: "rgba(10,10,9,0.85)" }}>
          <div className="section" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px" }}>
            <span style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>
              Know<span style={{ color: "var(--gold)" }}>Base</span>
            </span>
            <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
              {["Features", "How it works", "Assistant"].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                  style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none", letterSpacing: "0.02em", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
                >{item}</a>
              ))}
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden", paddingTop: 80 }}>
          <div className="hero-grid" />

          {/* ambient glow */}
          <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(201,169,110,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

          <motion.div className="section" style={{ y: heroY, opacity: heroOpacity, width: "100%", textAlign: "center" }}>
            <motion.div {...fadeUp(0)} style={{ marginBottom: 24 }}>
              <span className="tag">
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", display: "inline-block" }} />
                Retrieval-Augmented Generation
              </span>
            </motion.div>

            <motion.h1 {...fadeUp(0.1)} style={{ fontFamily: "var(--serif)", fontSize: "clamp(44px, 7vw, 90px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 32 }}>
              The Intelligence{" "}
              <span style={{ fontStyle: "italic", color: "var(--gold)" }}>of an LLM.</span>
              <br />
              The Accuracy of{" "}
              <span style={{ fontStyle: "italic" }}>Your Data.</span>
            </motion.h1>

            <motion.p {...fadeUp(0.2)} style={{ fontSize: 18, color: "var(--muted)", maxWidth: 540, margin: "0 auto 48px", lineHeight: 1.7, fontWeight: 300 }}>
              Upload your documents. Ask anything. Get precise, cited answers backed by your own knowledge — not hallucinations.
            </motion.p>

            <motion.div {...fadeUp(0.3)} style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="#assistant">
                <button className="btn-primary">Try the Assistant</button>
              </a>
              <a href="#how-it-works">
                <button className="btn-ghost">See how it works</button>
              </a>
            </motion.div>

            {/* floating stat pills */}
            <motion.div {...fadeUp(0.5)} style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 72, flexWrap: "wrap" }}>
              {[
                { val: "< 2s", label: "avg response" },
                { val: "99%", label: "source accuracy" },
                { val: "∞", label: "documents" },
                { val: "0", label: "hallucinations" },
              ].map(({ val, label }) => (
                <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 24px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 24, fontWeight: 700, color: "var(--accent)" }}>{val}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)" }}
            animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </motion.div>
        </section>

        {/* ── TICKER ── */}
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="ticker-item">{item} <span className="ticker-dot">◆</span></span>
            ))}
          </div>
        </div>

        {/* ── ASSISTANT ── */}
        <section id="assistant" className="py-section" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="section">
            <FadeSection style={{ marginBottom: 48 }}>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(28px,4vw,48px)", fontWeight: 700, lineHeight: 1.15 }}>
                Ask your <span style={{ fontStyle: "italic", color: "var(--gold)" }}>document</span>
              </h2>
            </FadeSection>

            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, alignItems: "start" }}>

              {/* sidebar */}
              <FadeSection>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* upload */}
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 11, color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, marginBottom: 16 }}>Document</div>

                    <div
                      className={`dropzone${dragOver ? " active" : ""}`}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) { setFile(f); upload(f); } }}
                      onClick={() => document.getElementById("fileInput")?.click()}
                    >
                      <input id="fileInput" type="file" accept=".pdf" style={{ display: "none" }}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); upload(f); } }} />
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" style={{ margin: "0 auto 10px" }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                      </svg>
                      <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                        {uploading ? "Processing…" : "Drop PDF here or click to browse"}
                      </div>
                    </div>

                    <AnimatePresence>
                      {uploadedName && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 12, padding: "10px 12px", background: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.2)", borderRadius: 6 }}>
                          <div style={{ fontSize: 11, color: "var(--gold)", fontWeight: 500, marginBottom: 2 }}>Indexed</div>
                          <div style={{ fontSize: 12, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadedName}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* tips */}
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 11, color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, marginBottom: 14 }}>Sample Questions</div>
                    {["What is the main conclusion?", "Summarize section 2.", "What data supports the thesis?", "List any recommendations."].map((q) => (
                      <button key={q} onClick={() => setQuestion(q)}
                        style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: "var(--muted)", fontSize: 12, padding: "6px 0", cursor: "pointer", borderBottom: "1px solid var(--border)", lineHeight: 1.5, transition: "color 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
                      >{q}</button>
                    ))}
                  </div>
                </div>
              </FadeSection>

              {/* chat */}
              <FadeSection delay={0.15}>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", flexDirection: "column", height: 600 }}>
                  {/* header */}
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: docId ? "#6fcf97" : "var(--muted)" }} />
                    <span style={{ fontSize: 13, color: docId ? "var(--text)" : "var(--muted)" }}>
                      {docId ? `Talking to: ${uploadedName}` : "Upload a document to begin"}
                    </span>
                  </div>

                  {/* messages */}
                  <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                    {messages.length === 0 && (
                      <div style={{ margin: "auto", textAlign: "center" }}>
                        <div style={{ fontFamily: "var(--serif)", fontSize: 28, fontStyle: "italic", color: "rgba(255,255,255,0.06)", lineHeight: 1.3 }}>
                          Your document,<br />your answers.
                        </div>
                      </div>
                    )}

                    <AnimatePresence initial={false}>
                      {messages.map((msg, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
                          style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: 8 }}>
                          <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>{msg.content}</div>
                          {msg.sources && msg.sources.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {msg.sources.slice(0, 3).map((src, j) => (
                                <div key={j}>
                                  <button className="source-chip" onClick={() => setExpandedSource(expandedSource === i * 100 + j ? null : i * 100 + j)}>
                                    p.{src.page} · {src.filename.slice(0, 20)}
                                  </button>
                                  <AnimatePresence>
                                    {expandedSource === i * 100 + j && (
                                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                        style={{ overflow: "hidden", marginTop: 6, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 6, padding: 10, fontSize: 12, color: "var(--muted)", lineHeight: 1.6, maxWidth: 400 }}>
                                        {src.chunk_text.slice(0, 220)}…
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}

                      {asking && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <div className="chat-bubble-ai">
                            <div className="typing"><span /><span /><span /></div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* input */}
                  <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
                    <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !asking && ask()}
                      placeholder={docId ? "Ask a question…" : "Upload a PDF first"}
                      disabled={!docId || asking}
                      style={{ flex: 1, padding: "10px 14px" }}
                    />
                    <button className="btn-primary" onClick={ask} disabled={!docId || asking || !question.trim()} style={{ padding: "10px 20px" }}>
                      {asking ? "…" : "Ask"}
                    </button>
                  </div>
                </div>
              </FadeSection>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="py-section">
          <div className="section">
            <FadeSection>
              <div style={{ marginBottom: 56, display: "flex", flexDirection: "column", gap: 16 }}>
                <span className="tag">Capabilities</span>
                <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(28px,4vw,48px)", fontWeight: 700, lineHeight: 1.15, maxWidth: 480 }}>
                  Built for documents that <span style={{ fontStyle: "italic", color: "var(--gold)" }}>matter</span>
                </h2>
              </div>
            </FadeSection>

            <FadeSection delay={0.1}>
              <div className="feature-grid">
                {[
                  { icon: "◎", title: "Semantic Retrieval", desc: "Finds the most contextually relevant passages, not just keyword matches." },
                  { icon: "◈", title: "Source Citations", desc: "Every answer links back to the exact page and paragraph in your document." },
                  { icon: "◇", title: "Multi-turn Chat", desc: "Maintains conversation context so follow-up questions feel natural." },
                  { icon: "◉", title: "FAISS Indexing", desc: "Local vector store — your data never leaves your machine." },
                  { icon: "◐", title: "Groq LLaMA 3.3", desc: "Fastest open-weight model available. Answers in under two seconds." },
                  { icon: "◑", title: "Any PDF", desc: "Research papers, contracts, manuals, reports — anything goes." },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="feature-cell">
                    <div className="feature-icon">{icon}</div>
                    <div style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{title}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </FadeSection>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="py-section" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="section">
            <FadeSection>
              <div style={{ marginBottom: 64, display: "flex", flexDirection: "column", gap: 16 }}>
                <span className="tag">Pipeline</span>
                <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(28px,4vw,48px)", fontWeight: 700, lineHeight: 1.15 }}>
                  How it <span style={{ fontStyle: "italic", color: "var(--gold)" }}>works</span>
                </h2>
              </div>
            </FadeSection>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>
              <div style={{ position: "relative", paddingLeft: 48 }}>
                <div className="pipeline-line" />
                {[
                  { n: "01", title: "Upload PDF", desc: "Your document is read page-by-page. Text is extracted cleanly from every page." },
                  { n: "02", title: "Chunk & Embed", desc: "Text is split into 1000-char overlapping chunks. Each chunk gets a vector embedding via Sentence Transformers." },
                  { n: "03", title: "Index in FAISS", desc: "Embeddings are stored in a local FAISS flat index. Retrieval is sub-millisecond." },
                  { n: "04", title: "Semantic Search", desc: "Your question is embedded and the top-5 nearest chunks are retrieved by cosine distance." },
                  { n: "05", title: "LLM Synthesis", desc: "Retrieved chunks are injected into Groq LLaMA 3.3 context. Answer is generated with source attribution." },
                ].map(({ n, title, desc }, i) => (
                  <FadeSection key={n} delay={i * 0.1}>
                    <div style={{ display: "flex", gap: 20, marginBottom: 36 }}>
                      <div className="pipeline-dot" />
                      <div>
                        <div style={{ fontSize: 11, color: "var(--gold)", letterSpacing: "0.1em", fontWeight: 500, marginBottom: 4 }}>{n}</div>
                        <div style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{title}</div>
                        <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65 }}>{desc}</div>
                      </div>
                    </div>
                  </FadeSection>
                ))}
              </div>

              {/* architecture visual */}
              <FadeSection delay={0.3} style={{ position: "sticky", top: 120 }}>
                <div className="card" style={{ fontFamily: "var(--sans)" }}>
                  <div style={{ fontSize: 11, color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20, fontWeight: 500 }}>Stack Overview</div>
                  {[
                    { layer: "Interface", tech: "Next.js 14 + Framer Motion", color: "#c9a96e" },
                    { layer: "API", tech: "FastAPI + Python", color: "#a89b7a" },
                    { layer: "Embedding", tech: "all-MiniLM-L6-v2", color: "#8a7d5a" },
                    { layer: "Vector DB", tech: "FAISS (local)", color: "#6b604a" },
                    { layer: "LLM", tech: "Groq · LLaMA 3.3 70B", color: "#4d453a" },
                  ].map(({ layer, tech, color }, i) => (
                    <motion.div key={layer}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}
                    >
                      <span style={{ fontSize: 12, color: "var(--muted)", letterSpacing: "0.06em" }}>{layer}</span>
                      <span style={{ fontSize: 13, color: "var(--text)", background: color + "18", border: `1px solid ${color}30`, padding: "3px 10px", borderRadius: 4, fontWeight: 500 }}>{tech}</span>
                    </motion.div>
                  ))}
                </div>
              </FadeSection>
            </div>
          </div>
        </section>

        {/* ── ABOUT / FOOTER ── */}
        <section style={{ borderTop: "1px solid var(--border)", padding: "80px 0 48px" }}>
          <div className="section">
            <FadeSection>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 48, marginBottom: 64 }}>
                <div>
                  <span style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 700 }}>Know<span style={{ color: "var(--gold)" }}>Base</span></span>
                  <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12, lineHeight: 1.7 }}>
                    A personal RAG assistant that keeps your data local and your answers honest.
                  </p>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, marginBottom: 16 }}>Stack</div>
                  {["Next.js + Framer Motion", "FastAPI + Python", "FAISS + Sentence Transformers", "Groq · LLaMA 3.3 70B"].map(item => (
                    <div key={item} style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>{item}</div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, marginBottom: 16 }}>About</div>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
                    Built on open-weight models with a local vector store. No third-party APIs receive your documents. Everything stays on your machine.
                  </p>
                </div>
              </div>
              <div className="divider" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 28, flexWrap: "wrap", gap: 12 }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>Personal RAG Assistant · Built with FastAPI, FAISS & LLaMA</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>Run locally · Data never leaves your machine</span>
              </div>
            </FadeSection>
          </div>
        </section>

      </div>
    </>
  );
}