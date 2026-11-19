// 내 문장 모음 - 팝업 화면
// 역할: 저장한 카드 목록 보기·복사·삭제·편집(굵게/기울임/밑줄, 메모, 주제, 그림 자르기)·검색·필터·순서 바꾸기·색상 테마.
// 모든 데이터는 chrome.storage.local 에만 있고, 바깥 서버로 보내지 않는다.
"use strict";

const MAX = 50, NEAR = 45;
const $ = (id) => document.getElementById(id);
const hostOf = (u) => { try { return new URL(u).hostname; } catch { return ""; } };
const dateOf = (ts) => { const d = new Date(ts); return `${d.getMonth() + 1}/${d.getDate()}`; };
const short = (s) => { const one = String(s).replace(/\s+/g, " ").trim(); return one.length > 24 ? one.slice(0, 24) + "…" : one; };

// ---------- 색상 테마 5종 (본문 글자 대비 10:1 이상, 보조 글자 대비 5.8:1 이상) ----------
const THEMES = [
  { id: "lemon",    name: "레몬",   hl: "#fde68a", paper: "#fbf7ef", stripe: "#d9b44a", accent: "#7a5d1e" },
  { id: "mint",     name: "민트",   hl: "#bbf0cf", paper: "#f1f8f3", stripe: "#6fb08a", accent: "#2f6b4b" },
  { id: "sky",      name: "하늘",   hl: "#c7e0fb", paper: "#f0f5fb", stripe: "#6f9fcf", accent: "#2f5c8a" },
  { id: "lavender", name: "라벤더", hl: "#e0d7fb", paper: "#f6f3fc", stripe: "#9a86cf", accent: "#5b4596" },
  { id: "peach",    name: "복숭아", hl: "#fdd3c4", paper: "#fdf3ef", stripe: "#df8f74", accent: "#97462f" }
];

// ---------- 주제 자동 추천 (기기 안에서만 판단) ----------
// 점수 = ① 글·메모 속 주제 단어(3) ② 그림 파일 이름(6, 그림에 대한 가장 직접적인 단서)·페이지 주소(1)
//      ③ 같은 페이지에서 먼저 저장한 카드의 주제(2) ④ 내가 고쳐 준 주제에서 배운 단어(4)·사이트(2)
const TOPICS = [
  { name: "산책·자연", kw: ["산책", "걷", "걸어", "꽃", "바람", "언덕", "새벽", "하늘", "나무", "숲", "길가", "발밑", "바다", "햇살", "노을", "계절", "봄날", "가을"],
    url: ["walk", "sunrise", "flower", "nature", "tree", "sky", "garden"] },
  { name: "습관·성장", kw: ["습관", "매일", "목표", "성장", "나아지", "시작하", "과정", "루틴", "꾸준", "노력", "변화", "1%", "실천", "반복"], url: ["habit", "growth", "routine"] },
  { name: "독서·글", kw: ["책", "읽", "독서", "작가", "서점", "문장", "페이지", "단어", "글쓰"], url: ["book", "shelf", "read", "library", "notes"] },
  { name: "마음·감정", kw: ["마음", "기억", "간직", "행복", "감정", "위로", "사랑", "슬픔", "외로", "그리움", "설렘", "불안", "용기"], url: ["mind", "feel"] },
  { name: "일·집중", kw: ["일하", "집중", "업무", "회의", "생산성", "성과", "몰입", "계획", "마감", "휴대폰"], url: ["work", "focus", "productiv"] },
  { name: "관계·사람", kw: ["친구", "가족", "대화", "관계", "함께", "엄마", "아빠", "동료", "사람들"], url: ["people", "family"] },
  { name: "음식·커피", kw: ["커피", "차 한", "음식", "요리", "식사", "카페", "빵", "한 잔"], url: ["coffee", "cafe", "food", "recipe"] },
  { name: "여행", kw: ["여행", "공항", "비행기", "낯선 도시", "숙소", "여권", "떠나"], url: ["travel", "trip"] }
];
const DEFAULT_TOPIC = "일상";
// 주제 계열색 [배경, 글자] — 대비 6:1 이상, 눌렀을 때(흰 글자) 7:1 이상
const TOPIC_COLORS = {
  "산책·자연": ["#dcefd8", "#2e5e2a"], "습관·성장": ["#fbe5c8", "#7a4410"], "독서·글": ["#dfe6f7", "#2d4a86"],
  "마음·감정": ["#f8dbe4", "#8a2a4d"], "일·집중": ["#e3e0f5", "#4a3f8f"], "관계·사람": ["#fde1d3", "#8c3b1c"],
  "음식·커피": ["#efe2d3", "#6b4423"], "여행": ["#d6eef0", "#1f5f66"], "일상": ["#ebe8e2", "#4e473d"]
};
const EXTRA_COLORS = [["#e6f0d0", "#4a5d17"], ["#f3dcf0", "#7a2e6e"], ["#d9ecf8", "#1d5a80"]];
function topicColor(name) {
  if (TOPIC_COLORS[name]) return TOPIC_COLORS[name];
  let h = 0; for (const ch of name) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return EXTRA_COLORS[h % EXTRA_COLORS.length];
}
function paintTopic(el, name) { const [bg, fg] = topicColor(name); el.style.setProperty("--chip-bg", bg); el.style.setProperty("--chip-fg", fg); }

const PARTICLES = ["으로", "에서", "에게", "까지", "부터", "처럼", "보다", "이다", "하다", "했다", "한다", "은", "는", "이", "가", "을", "를", "에", "의", "도", "로", "와", "과", "만"];
const STOP = new Set(["그리고", "하지만", "그래서", "오늘", "우리", "나는", "정말", "있다", "없다", "같은", "이런", "저런", "그런", "대개", "생각", "조금씩"]);
function tokens(s) {
  return (s.match(/[가-힣A-Za-z0-9%]{2,}/g) || []).map((w) => {
    for (const p of PARTICLES) if (w.length > p.length + 1 && w.endsWith(p)) return w.slice(0, -p.length);
    return w;
  }).filter((w) => w.length >= 2 && !STOP.has(w));
}

// ---------- 상태 ----------
let clips = [];
let learned = { words: {}, hosts: {} };
let themeId = "lemon";
let filter = "all", typeFilter = "all", query = "";
let editingId = null;
let lastWrite = "";

function topicScores(item) {
  const text = (item.type === "text" ? item.content : "") + " " + (item.memo || "");
  const imgUrl = item.type === "image" ? (item.content.split(/[?#]/)[0].split("/").pop() || "").toLowerCase() : "";
  const pageUrl = (item.pageUrl || "").toLowerCase();
  const host = hostOf(item.pageUrl || "");
  const sc = {};
  const add = (t, n) => { sc[t] = (sc[t] || 0) + n; };
  for (const t of TOPICS) {
    for (const k of t.kw) if (text.includes(k)) add(t.name, 3);
    for (const k of t.url) { if (imgUrl.includes(k)) add(t.name, 6); if (pageUrl.includes(k)) add(t.name, 1); }
  }
  clips.forEach((c) => { if (c.id !== item.id && c.pageUrl && c.pageUrl === item.pageUrl && c.topic) add(c.topic, 2); });
  for (const w of new Set(tokens(text))) {
    const m = learned.words[w]; if (m) for (const t in m) add(t, 4 * Math.min(m[t], 3));
  }
  const hm = learned.hosts[host]; if (hm) for (const t in hm) add(t, 2 * Math.min(hm[t], 3));
  return sc;
}
function recommendTopic(item) {
  const sc = topicScores(item);
  let best = DEFAULT_TOPIC, bestScore = 0;
  for (const t in sc) if (sc[t] > bestScore) { best = t; bestScore = sc[t]; }
  return best;
}
function learnFrom(item, topic) {
  for (const w of new Set(tokens((item.type === "text" ? item.content : "") + " " + (item.memo || "")))) {
    learned.words[w] = learned.words[w] || {}; learned.words[w][topic] = (learned.words[w][topic] || 0) + 1;
  }
  const h = hostOf(item.pageUrl || "");
  if (h) { learned.hosts[h] = learned.hosts[h] || {}; learned.hosts[h][topic] = (learned.hosts[h][topic] || 0) + 1; }
  chrome.storage.local.set({ learned });
}
// 백그라운드가 막 저장한 카드(topic 없음)에 주제 채우기. 오래된 것부터 채워야 같은 페이지 참고가 맞음
function fillTopics() {
  let changed = false;
  for (let i = clips.length - 1; i >= 0; i--) {
    const c = clips[i];
    if (c.memo == null) { c.memo = ""; changed = true; }
    if (!c.topic) { c.topic = recommendTopic(c); c.topicAuto = true; changed = true; }
  }
  return changed;
}

async function persist() {
  lastWrite = JSON.stringify(clips);
  await chrome.storage.local.set({ clips });
}

// ---------- 테마 ----------
function applyTheme(id, fromUser) {
  const t = THEMES.find((x) => x.id === id) || THEMES[0];
  themeId = t.id;
  const r = document.documentElement.style;
  r.setProperty("--hl", t.hl); r.setProperty("--paper", t.paper); r.setProperty("--stripe", t.stripe); r.setProperty("--accent", t.accent);
  renderSwatches();
  $("toneBtn").title = `색상 바꾸기 (지금: ${t.name})`;
  if (fromUser) chrome.storage.local.set({ theme: t.id });
}
function toggleTone(open) {
  const pop = $("tonePop"), btn = $("toneBtn");
  const show = open ?? pop.hidden;
  pop.hidden = !show; btn.setAttribute("aria-expanded", String(show));
  if (show) pop.querySelector('[aria-checked="true"]')?.focus();
}
function renderSwatches() {
  const w = $("swatches"); w.replaceChildren();
  THEMES.forEach((t, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "sw"; b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(t.id === themeId));
    b.setAttribute("aria-label", t.name); b.title = t.name;
    b.style.setProperty("--sw-fill", t.hl); b.style.setProperty("--sw-edge", t.stripe);
    b.addEventListener("click", () => { applyTheme(t.id, true); toggleTone(false); $("toneBtn").focus(); });
    b.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const n = THEMES[(i + (e.key === "ArrowRight" ? 1 : THEMES.length - 1)) % THEMES.length];
      applyTheme(n.id, true); $("swatches").querySelectorAll(".sw")[THEMES.indexOf(n)].focus();
    });
    w.appendChild(b);
  });
}

// ---------- 검색 ----------
const terms = () => query.trim().toLowerCase().split(/\s+/).filter(Boolean);
function matches(c, ts) {
  const hay = [c.type === "text" ? c.content : "", c.memo || "", c.topic, "#" + c.topic, hostOf(c.pageUrl), c.type === "image" ? "그림 이미지" : "글"]
    .join(" ").toLowerCase();
  return ts.every((t) => hay.includes(t));
}
function highlight(el, ts) {
  ts = ts.map((t) => t.replace(/^#/, "")).filter(Boolean);
  if (!ts.length) return;
  const re = new RegExp(ts.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "gi");
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const text = node.nodeValue; re.lastIndex = 0;
    if (!re.test(text)) continue;
    re.lastIndex = 0;
    const frag = document.createDocumentFragment(); let last = 0, m;
    while ((m = re.exec(text))) {
      if (!m[0]) { re.lastIndex++; continue; }
      frag.append(text.slice(last, m.index));
      const mk = document.createElement("mark"); mk.className = "hit"; mk.textContent = m[0]; frag.append(mk);
      last = m.index + m[0].length;
    }
    frag.append(text.slice(last));
    node.replaceWith(frag);
  }
}

// ---------- 목록 ----------
const byType = () => (typeFilter === "all" ? clips : clips.filter((c) => c.type === typeFilter));
function renderTypeSeg() {
  const n = { all: clips.length, text: clips.filter((c) => c.type === "text").length, image: clips.filter((c) => c.type === "image").length };
  $("typeSeg").querySelectorAll("button").forEach((b) => {
    b.setAttribute("aria-checked", String(b.dataset.type === typeFilter));
    b.title = `${b.textContent} ${n[b.dataset.type]}개`;
  });
}
function renderFilters() {
  const counts = {};
  byType().forEach((c) => { counts[c.topic] = (counts[c.topic] || 0) + 1; });
  const topics = Object.keys(counts);
  if (filter !== "all" && !counts[filter]) filter = "all";
  const wrap = $("filters"); wrap.replaceChildren();
  wrap.hidden = topics.length < 2;
  if (wrap.hidden) return;
  const mk = (key, label, n) => {
    const b = document.createElement("button"); b.type = "button";
    b.setAttribute("aria-pressed", String(filter === key));
    if (key !== "all") { b.classList.add("t"); paintTopic(b, key); }
    b.append(document.createTextNode(label));
    const s = document.createElement("small"); s.textContent = n; b.appendChild(s);
    b.addEventListener("click", () => { filter = key; renderPopup(); });
    wrap.appendChild(b);
  };
  mk("all", "# 모든 주제", byType().length);
  topics.sort((a, b) => counts[b] - counts[a]).forEach((t) => mk(t, "# " + t, counts[t]));
}
function emptyBox(html) { const e = document.createElement("div"); e.className = "empty"; e.innerHTML = html; return e; }

function renderPopup() {
  const n = clips.length;
  const cnt = $("cnt");
  cnt.textContent = `${n} / ${MAX}`;
  cnt.className = "cnt" + (n >= MAX ? " full" : n >= NEAR ? " near" : "");
  $("notice").hidden = n < MAX;
  $("clearAll").hidden = n === 0;
  if (n === 0) $("confirm").hidden = true;
  $("searchWrap").hidden = n === 0;
  if (n === 0 && query) { query = ""; $("q").value = ""; }
  renderTypeSeg();
  renderFilters();
  const list = $("plist"); list.replaceChildren();
  if (n === 0) {
    list.appendChild(emptyBox("아직 저장한 문장이 없어요.<br>웹페이지에서 문장을 <b>드래그</b>하거나 그림 위에서<br><b>우클릭 → “ 내 문장 모음에 저장</b>을 눌러 보세요."));
    return;
  }
  const shown = filter === "all" ? byType() : byType().filter((c) => c.topic === filter);
  if (!shown.length) {
    list.appendChild(emptyBox(typeFilter === "image" ? "저장한 그림이 아직 없어요. 그림 위에서 우클릭해 저장해 보세요." : "저장한 글이 아직 없어요. 문장을 드래그한 뒤 우클릭해 저장해 보세요."));
    return;
  }
  const ts = terms();
  const found = ts.length ? shown.filter((c) => c.id === editingId || matches(c, ts)) : shown;
  $("qCount").textContent = ts.length ? `${found.length}개` : "";
  if (!found.length) {
    const e = emptyBox(""); e.textContent = `“${query.trim()}”에 맞는 카드가 없어요. 다른 단어로 찾거나 위 필터를 ‘전체’로 바꿔 보세요.`;
    list.appendChild(e); return;
  }
  for (const clip of found) list.appendChild(clip.id === editingId ? editCard(clip) : viewCard(clip, ts));
}

function viewCard(clip, ts) {
  const card = document.createElement("div");
  card.className = "card"; card.tabIndex = 0; card.dataset.id = clip.id;
  card.title = clip.type === "image" ? "누르면 이미지 주소 복사" : "누르면 문장 복사";

  const top = document.createElement("div"); top.className = "c-top";
  const chip = document.createElement("button"); chip.type = "button"; chip.className = "chip";
  chip.textContent = "# " + clip.topic; chip.title = "주제 바꾸기";
  paintTopic(chip, clip.topic);
  chip.addEventListener("click", (e) => { e.stopPropagation(); startEdit(clip.id, "topic"); });
  const acts = document.createElement("div"); acts.className = "acts";
  const ed = document.createElement("button"); ed.type = "button"; ed.textContent = "✎"; ed.title = "편집"; ed.setAttribute("aria-label", "이 카드 편집");
  ed.addEventListener("click", (e) => { e.stopPropagation(); startEdit(clip.id); });
  const del = document.createElement("button"); del.type = "button"; del.className = "del"; del.textContent = "✕"; del.title = "삭제"; del.setAttribute("aria-label", "이 카드 삭제");
  del.addEventListener("click", (e) => { e.stopPropagation(); deleteClip(clip.id); });
  const grip = document.createElement("button"); grip.type = "button"; grip.className = "grip"; grip.textContent = "⠿";
  grip.title = "끌어서 순서 바꾸기 (↑↓ 키도 돼요)"; grip.setAttribute("aria-label", "순서 바꾸기. 위아래 방향키로 옮겨요");
  attachDrag(grip, card, clip);
  const left = document.createElement("div"); left.className = "c-left"; left.append(grip, chip);
  acts.append(ed, del); top.append(left, acts); card.appendChild(top);

  if (clip.type === "image") card.appendChild(cropFrame(clip, clip.crop || DEFAULT_CROP, 170).frame);
  else {
    const p = document.createElement("p");
    if (clip.contentHtml) p.innerHTML = sanitize(clip.contentHtml); else p.textContent = clip.content;
    card.appendChild(p);
  }
  if (clip.memo) {
    const m = document.createElement("div"); m.className = "memo";
    if (clip.memoHtml) m.innerHTML = sanitize(clip.memoHtml); else m.textContent = clip.memo;
    card.appendChild(m);
  }
  const meta = document.createElement("div"); meta.className = "meta";
  meta.textContent = [clip.type === "image" ? "이미지" : "", hostOf(clip.pageUrl), dateOf(clip.savedAt), clip.edited ? "편집됨" : ""].filter(Boolean).join(" · ");
  card.appendChild(meta);
  if (ts && ts.length) [card.querySelector("p"), card.querySelector(".memo"), meta, chip].forEach((el) => el && highlight(el, ts));

  const go = () => copyClip(clip, card);
  card.addEventListener("click", go);
  card.addEventListener("keydown", (e) => { if (e.target === card && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); go(); } });
  return card;
}

// ---------- 그림 자르기 (원본 주소는 그대로, 보이는 영역만 저장) ----------
const RATIOS = { original: null, "1:1": 1, "4:3": 4 / 3, "16:9": 16 / 9 };
const DEFAULT_CROP = { ratio: "original", x: 50, y: 50, zoom: 1 };
const clamp = (v) => Math.max(0, Math.min(100, v));
const isSafeImageUrl = (u) => /^(https?:|data:image\/)/i.test(u);
function cropFrame(clip, crop, maxH) {
  const frame = document.createElement("div"); frame.className = "crop";
  if (!isSafeImageUrl(clip.content)) { frame.classList.add("broken"); frame.textContent = "표시할 수 없는 그림 주소예요"; return { frame, apply() {} }; }
  const im = document.createElement("img"); im.alt = clip.memo || "저장한 이미지"; im.draggable = false;
  im.referrerPolicy = "no-referrer"; im.src = clip.content;
  frame.appendChild(im);
  let cur = crop;
  const apply = (c) => {
    cur = c;
    const r = RATIOS[c.ratio] || (im.naturalWidth && im.naturalHeight ? im.naturalWidth / im.naturalHeight : 16 / 9);
    frame.style.aspectRatio = String(r);
    frame.style.width = `min(100%, ${Math.round(maxH * r)}px)`;
    im.style.objectPosition = `${c.x}% ${c.y}%`;
    im.style.transformOrigin = `${c.x}% ${c.y}%`;
    im.style.transform = `scale(${c.zoom})`;
  };
  im.addEventListener("load", () => apply(cur));
  im.addEventListener("error", () => {   // 원래 사이트에서 그림이 사라진 경우
    frame.classList.add("broken"); frame.style.width = ""; frame.style.aspectRatio = "";
    frame.textContent = "원본 그림을 찾을 수 없어요";
  });
  apply(crop);
  return { frame, apply };
}

// ---------- 글자 서식 (굵게 <b>·기울임 <i>·밑줄 <u>·줄바꿈 <br> 만 남김) ----------
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const plainToHtml = (t) => esc(t).replace(/\n/g, "<br>");
const HAS_FMT = /<(b|i|u)>/;
function sanitize(html) {
  const tpl = document.createElement("template"); tpl.innerHTML = html;
  const segs = [];
  const lastIsBr = () => !segs.length || segs[segs.length - 1].br;
  const walk = (node, f) => {
    for (const n of node.childNodes) {
      if (n.nodeType === 3) { if (n.nodeValue) segs.push({ t: n.nodeValue, ...f }); }
      else if (n.nodeType === 1) {
        const tag = n.tagName;
        if (tag === "BR") { segs.push({ br: true }); continue; }
        if (tag === "SCRIPT" || tag === "STYLE") continue;
        if ((tag === "DIV" || tag === "P" || tag === "LI") && !lastIsBr()) segs.push({ br: true });
        const st = n.style || {};
        const fw = st.fontWeight || "", fs = st.fontStyle || "", td = (st.textDecorationLine || st.textDecoration || "");
        const g = { ...f };
        if (tag === "B" || tag === "STRONG" || fw === "bold" || Number(fw) >= 600) g.b = true;
        if (fw === "normal" || (fw && Number(fw) < 600)) g.b = false;
        if (tag === "I" || tag === "EM" || fs === "italic") g.i = true;
        if (fs === "normal") g.i = false;
        if (tag === "U" || tag === "INS" || td.includes("underline")) g.u = true;
        walk(n, g);
      }
    }
  };
  walk(tpl.content, { b: false, i: false, u: false });
  while (segs.length && segs[segs.length - 1].br) segs.pop();
  const merged = [];
  for (const sg of segs) {
    const p = merged[merged.length - 1];
    if (p && !p.br && !sg.br && p.b === sg.b && p.i === sg.i && p.u === sg.u) p.t += sg.t; else merged.push({ ...sg });
  }
  return merged.map((sg) => {
    if (sg.br) return "<br>";
    let h = esc(sg.t);
    if (sg.u) h = `<u>${h}</u>`;
    if (sg.i) h = `<i>${h}</i>`;
    if (sg.b) h = `<b>${h}</b>`;
    return h;
  }).join("");
}
function htmlToPlain(html) { const d = document.createElement("div"); d.innerHTML = html.replace(/<br>/g, "\n"); return d.textContent; }
const FORMATS = [
  { cmd: "bold", label: "굵게", key: "B", html: "<b>B</b>" },
  { cmd: "italic", label: "기울임", key: "I", html: "<i>I</i>" },
  { cmd: "underline", label: "밑줄", key: "U", html: "<u>U</u>" }
];
function richField(card, id, label, html, placeholder, small) {
  const wrap = document.createElement("div"); wrap.className = "field";
  const top = document.createElement("div"); top.className = "rt-top";
  const lab = document.createElement("span"); lab.id = id + "L"; lab.textContent = label;
  const bar = document.createElement("div"); bar.className = "fmt-bar"; bar.setAttribute("role", "group"); bar.setAttribute("aria-label", `${label} 서식`);
  const ed = document.createElement("div"); ed.id = id; ed.className = "rt" + (small ? " small" : "");
  ed.contentEditable = "true"; ed.setAttribute("role", "textbox"); ed.setAttribute("aria-multiline", "true");
  ed.setAttribute("aria-labelledby", lab.id); ed.dataset.placeholder = placeholder; ed.innerHTML = html;
  const btns = FORMATS.map((f) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "fmt-btn"; b.innerHTML = f.html;
    b.title = `${f.label} (⌘${f.key} / Ctrl+${f.key})`; b.setAttribute("aria-label", f.label); b.setAttribute("aria-pressed", "false");
    b.addEventListener("mousedown", (e) => e.preventDefault());
    b.addEventListener("click", () => {
      if (!ed.contains(getSelection().anchorNode)) ed.focus();
      try { document.execCommand("styleWithCSS", false, false); document.execCommand(f.cmd); } catch {}
      sync();
    });
    bar.appendChild(b); return b;
  });
  function sync() {
    let inside = false; try { inside = ed.contains(getSelection().anchorNode); } catch {}
    FORMATS.forEach((f, k) => {
      let on = false; try { on = inside && document.queryCommandState(f.cmd); } catch {}
      btns[k].setAttribute("aria-pressed", String(on));
    });
    ed.classList.toggle("empty", !ed.textContent.trim());
  }
  ["keyup", "mouseup", "focus", "input"].forEach((ev) => ed.addEventListener(ev, sync));
  ed.addEventListener("paste", (e) => {
    e.preventDefault();
    document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
  });
  top.append(lab, bar); wrap.append(top, ed); card.appendChild(wrap);
  sync();
  return { el: ed, html: () => sanitize(ed.innerHTML), plain: () => htmlToPlain(sanitize(ed.innerHTML)).trim() };
}

// ---------- 끌어서 순서 바꾸기 ----------
async function commitOrder(focusId) {
  const ids = [...$("plist").querySelectorAll(".card")].map((c) => c.dataset.id);
  const set = new Set(ids);
  const slots = []; clips.forEach((c, i) => { if (set.has(c.id)) slots.push(i); });
  const byId = Object.fromEntries(clips.map((c) => [c.id, c]));
  const next = clips.slice();
  slots.forEach((slot, k) => { next[slot] = byId[ids[k]]; });
  const moved = next.some((c, i) => c !== clips[i]);
  if (moved) clips = next;
  renderPopup();
  if (focusId) $("plist").querySelector(`.card[data-id="${focusId}"] .grip`)?.focus();
  if (moved) await persist();
}
function attachDrag(grip, card, clip) {
  grip.addEventListener("click", (e) => e.stopPropagation());
  grip.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault(); e.stopPropagation();
    const list = $("plist");
    if (e.key === "ArrowUp" && card.previousElementSibling) list.insertBefore(card, card.previousElementSibling);
    else if (e.key === "ArrowDown" && card.nextElementSibling) list.insertBefore(card.nextElementSibling, card);
    else return;
    commitOrder(clip.id);
  });
  grip.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const list = $("plist");
    // 카드를 옮기면 손잡이가 문서에서 잠깐 빠져 포인터 캡처가 풀리므로, 문서 전체에서 움직임을 받음
    card.classList.add("dragging");
    const move = (ev) => {
      const others = [...list.querySelectorAll(".card:not(.dragging)")];
      let before = null;
      for (const c of others) { const r = c.getBoundingClientRect(); if (ev.clientY < r.top + r.height / 2) { before = c; break; } }
      if (before) { if (card.nextElementSibling !== before) list.insertBefore(card, before); }
      else if (list.lastElementChild !== card) list.appendChild(card);
      const lr = list.getBoundingClientRect();
      if (ev.clientY < lr.top + 28) list.scrollTop -= 10; else if (ev.clientY > lr.bottom - 28) list.scrollTop += 10;
    };
    const up = () => {
      document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up);
      card.classList.remove("dragging");
      commitOrder(clip.id);
    };
    document.addEventListener("pointermove", move); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up);
  });
}

// ---------- 편집 ----------
function allTopics() {
  const names = [...TOPICS.map((t) => t.name), DEFAULT_TOPIC];
  clips.forEach((c) => { if (c.topic && !names.includes(c.topic)) names.push(c.topic); });
  return names;
}
function startEdit(id, focus) {
  editingId = id; renderPopup();
  $("plist").querySelector(focus === "topic" ? "#eTopic" : "#eContent, #eMemo")?.focus();
}
function endEdit() { editingId = null; renderPopup(); }

function editCard(clip) {
  const card = document.createElement("div");
  card.className = "card editing"; card.dataset.id = clip.id;
  const rec = recommendTopic({ ...clip, memo: "" });
  let contentEd = null;
  if (clip.type === "text") contentEd = richField(card, "eContent", "내용", clip.contentHtml || plainToHtml(clip.content), "문장을 입력하세요", false);

  let crop = null;
  if (clip.type === "image") {
    crop = { ...DEFAULT_CROP, ...(clip.crop || {}) };
    const cf = cropFrame(clip, crop, 220);
    const fr = cf.frame;
    fr.classList.add("editable"); fr.tabIndex = 0; fr.id = "eCrop";
    fr.setAttribute("aria-label", "자를 위치. 끌거나 방향키로 옮겨요");
    card.appendChild(fr);
    const tools = document.createElement("div"); tools.className = "crop-tools";
    const ratios = document.createElement("div"); ratios.className = "ratios"; ratios.setAttribute("role", "group"); ratios.setAttribute("aria-label", "자르기 비율");
    const zoomWrap = document.createElement("label"); zoomWrap.className = "zoom"; zoomWrap.htmlFor = "eZoom"; zoomWrap.textContent = "확대";
    const zoomIn = document.createElement("input"); zoomIn.type = "range"; zoomIn.id = "eZoom"; zoomIn.min = "1"; zoomIn.max = "3"; zoomIn.step = "0.05";
    zoomWrap.appendChild(zoomIn);
    const refresh = () => {
      ratios.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.r === crop.ratio)));
      zoomIn.value = String(crop.zoom); cf.apply(crop);
    };
    [["original", "원본"], ["1:1", "1:1"], ["4:3", "4:3"], ["16:9", "16:9"]].forEach(([k, l]) => {
      const b = document.createElement("button"); b.type = "button"; b.dataset.r = k; b.textContent = l;
      b.addEventListener("click", () => { crop.ratio = k; refresh(); });
      ratios.appendChild(b);
    });
    zoomIn.addEventListener("input", () => { crop.zoom = Number(zoomIn.value); cf.apply(crop); });
    const reset = document.createElement("button"); reset.type = "button"; reset.className = "reset"; reset.textContent = "되돌리기";
    reset.addEventListener("click", () => { Object.assign(crop, DEFAULT_CROP); refresh(); });
    tools.append(ratios, zoomWrap, reset); card.appendChild(tools);
    let drag = null;
    fr.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, cx: crop.x, cy: crop.y }; fr.setPointerCapture(e.pointerId); });
    fr.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const r = fr.getBoundingClientRect();
      crop.x = clamp(drag.cx - ((e.clientX - drag.x) / r.width) * 150 / crop.zoom);
      crop.y = clamp(drag.cy - ((e.clientY - drag.y) / r.height) * 150 / crop.zoom);
      cf.apply(crop);
    });
    const end = () => { drag = null; };
    fr.addEventListener("pointerup", end); fr.addEventListener("pointercancel", end);
    fr.addEventListener("keydown", (e) => {
      const d = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] }[e.key];
      if (!d) return;
      e.preventDefault(); crop.x = clamp(crop.x + d[0]); crop.y = clamp(crop.y + d[1]); cf.apply(crop);
    });
    refresh();
  }

  const memoEd = richField(card, "eMemo", clip.type === "image" ? "메모 (이미지 설명, 저장한 이유)" : "메모 (저장한 이유, 출처 등)",
    clip.memoHtml || plainToHtml(clip.memo || ""), "예: 발표 자료 첫 장에 쓰기", true);

  const ft = document.createElement("div"); ft.className = "field";
  const lab = document.createElement("label"); lab.htmlFor = "eTopic"; lab.textContent = "주제";
  const recLine = document.createElement("span"); recLine.className = "rec"; recLine.textContent = ` · 추천: ${rec}`;
  lab.appendChild(recLine);
  const select = document.createElement("select"); select.id = "eTopic";
  allTopics().forEach((t) => { const o = document.createElement("option"); o.value = t; o.textContent = t === rec ? `${t} (추천)` : t; select.appendChild(o); });
  const oc = document.createElement("option"); oc.value = "__custom"; oc.textContent = "직접 입력…"; select.appendChild(oc);
  select.value = clip.topic;
  const custom = document.createElement("input"); custom.id = "eTopicCustom"; custom.type = "text"; custom.maxLength = 12;
  custom.placeholder = "새 주제 이름 (12자 이내)"; custom.hidden = true; custom.setAttribute("aria-label", "새 주제 이름");
  select.addEventListener("change", () => { custom.hidden = select.value !== "__custom"; if (!custom.hidden) custom.focus(); });
  ft.append(lab, select, custom); card.appendChild(ft);

  const err = document.createElement("div"); err.className = "e-err"; err.hidden = true; card.appendChild(err);
  const acts = document.createElement("div"); acts.className = "e-acts";
  const cancel = document.createElement("button"); cancel.type = "button"; cancel.textContent = "취소";
  const save = document.createElement("button"); save.type = "button"; save.className = "primary"; save.textContent = "저장";
  acts.append(cancel, save); card.appendChild(acts);

  cancel.addEventListener("click", endEdit);
  save.addEventListener("click", async () => {
    const content = clip.type === "text" ? contentEd.plain() : clip.content;
    const contentHtml = clip.type === "text" ? contentEd.html() : "";
    const memoHtml = memoEd.html();
    if (!content) { err.textContent = "내용을 비워 둘 수 없어요. 지우려면 ✕를 눌러 주세요."; err.hidden = false; return; }
    let topic = select.value;
    if (topic === "__custom") {
      topic = custom.value.trim();
      if (!topic) { err.textContent = "새 주제 이름을 입력해 주세요."; err.hidden = false; custom.focus(); return; }
    }
    const changed = [];
    const newMemo = memoEd.plain();
    const oldContentHtml = clip.type === "text" ? sanitize(clip.contentHtml || plainToHtml(clip.content)) : "";
    const oldMemoHtml = sanitize(clip.memoHtml || plainToHtml(clip.memo || ""));
    if (content !== clip.content || contentHtml !== oldContentHtml) changed.push("내용");
    if (newMemo !== (clip.memo || "") || memoHtml !== oldMemoHtml) changed.push("메모");
    if (clip.type === "text") { if (HAS_FMT.test(contentHtml)) clip.contentHtml = contentHtml; else delete clip.contentHtml; }
    if (HAS_FMT.test(memoHtml)) clip.memoHtml = memoHtml; else delete clip.memoHtml;
    const userTopic = topic !== clip.topic;
    if (userTopic) changed.push("주제");
    const cropChanged = crop && JSON.stringify(crop) !== JSON.stringify({ ...DEFAULT_CROP, ...(clip.crop || {}) });
    if (cropChanged) changed.push("자르기");
    clip.content = content; clip.memo = newMemo;
    if (crop) clip.crop = { ...crop };
    if (userTopic) {
      clip.topicAuto = false; clip.topic = topic;
      if (topic !== rec) learnFrom(clip, topic);
    } else if (clip.topicAuto && (changed.includes("내용") || changed.includes("메모"))) {
      clip.topic = recommendTopic(clip);
    }
    if (changed.length) clip.edited = true;
    endEdit();
    await persist();
  });
  card.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.stopPropagation(); endEdit(); }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save.click();
  });
  return card;
}

// ---------- 복사 ----------
async function copyText(t, html) {
  if (html && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        "text/plain": new Blob([t], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" })
      })]);
      return true;
    } catch {}
  }
  try { await navigator.clipboard.writeText(t); return true; } catch { return false; }
}
async function copyClip(clip, card) {
  const rich = clip.type === "text" && clip.contentHtml ? sanitize(clip.contentHtml) : null;
  const ok = await copyText(clip.content, rich);
  card.querySelector(".toast")?.remove();
  const toast = document.createElement("span");
  toast.className = ok ? "toast" : "toast err";
  toast.textContent = ok ? (clip.type === "image" ? "✓ 이미지 주소 복사됨" : rich ? "✓ 서식 포함 복사됨" : "✓ 복사됨") : "복사 실패";
  card.appendChild(toast);
  setTimeout(() => toast.remove(), 1200);
}

// ---------- 이벤트 ----------
$("toneBtn").addEventListener("click", () => toggleTone());
$("typeSeg").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
  typeFilter = b.dataset.type; filter = "all"; editingId = null; renderPopup();
}));
$("typeSeg").addEventListener("keydown", (e) => {
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  const bs = [...$("typeSeg").querySelectorAll("button")];
  const i = bs.findIndex((b) => b.dataset.type === typeFilter);
  const n = bs[(i + (e.key === "ArrowRight" ? 1 : bs.length - 1)) % bs.length];
  n.click(); n.focus(); e.preventDefault();
});
$("q").addEventListener("input", () => { query = $("q").value; renderPopup(); });
$("q").addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("q").value) { e.preventDefault(); e.stopPropagation(); $("q").value = ""; query = ""; renderPopup(); }
});
$("clearAll").addEventListener("click", () => { $("confirm").hidden = false; $("cOk").focus(); });
$("cCancel").addEventListener("click", () => { $("confirm").hidden = true; });
$("cOk").addEventListener("click", async () => {
  const snapshot = clips.slice();
  clips = []; filter = "all"; editingId = null; renderPopup(); await persist();
  showSnack(`${snapshot.length}장을 모두 지웠어요`, async () => {
    const ids = new Set(clips.map((c) => c.id));     // 그사이 새로 저장한 카드는 살려 두고 합침
    clips = clips.concat(snapshot.filter((c) => !ids.has(c.id))).slice(0, MAX);
    renderPopup(); await persist(); showSnack("되돌렸어요");
  });
});
document.addEventListener("pointerdown", (e) => {
  if (!$("tonePop").hidden && !e.target.closest(".tone-wrap")) toggleTone(false);
});
document.addEventListener("keydown", (e) => {
  const t = e.target, typing = t.closest && t.closest("input, textarea, select, [contenteditable='true']");
  if (e.key === "/" && !typing && !$("searchWrap").hidden) { e.preventDefault(); $("q").focus(); }
  if (e.key === "Escape" && !$("tonePop").hidden) { toggleTone(false); $("toneBtn").focus(); }
});

// 팝업이 열린 채로 새로 저장되면(다른 창 등) 목록 다시 그리기. 편집 중이면 편집이 끝난 뒤에.
chrome.storage.onChanged.addListener((ch, area) => {
  if (area !== "local" || !ch.clips) return;
  const nv = ch.clips.newValue || [];
  if (JSON.stringify(nv) === lastWrite) return;
  clips = nv;
  if (fillTopics()) persist();
  if (!editingId) renderPopup();
});

// ---------- 버전·브랜딩 ----------
const APP_VERSION = (typeof chrome !== "undefined" && chrome.runtime?.getManifest) ? chrome.runtime.getManifest().version : "2.0.0";
$("ver").textContent = "v" + APP_VERSION;
$("ver").title = `내 문장 모음 버전 ${APP_VERSION}`;
$("year").textContent = String(new Date().getFullYear());
// 문의 이메일: 화면과 소스에 주소가 그대로 보이지 않게 뒤집어 두고, 누를 때만 메일 쓰기 창을 엶
const MAIL = [];   // 공개판: 문의 이메일 없음
const mailAddress = () => MAIL.map((s) => [...s].reverse().join("")).reverse().join("@");
if (!MAIL.length) $("mailBtn")?.remove();   // 공개 저장소판은 주소를 빼고 버튼도 숨김
$("mailBtn")?.addEventListener("click", () => {
  const url = `mailto:${mailAddress()}?subject=${encodeURIComponent(`[내 문장 모음 v${APP_VERSION}] 문의`)}`;
  try { chrome.tabs.create({ url }); } catch { location.href = url; }
});

// ---------- 되돌리기 안내줄 ----------
let snackTimer = 0, undoAction = null;
function showSnack(text, undo) {
  $("snackText").textContent = text;
  $("snackBtn").hidden = !undo;
  undoAction = undo || null;
  $("snack").hidden = false;
  clearTimeout(snackTimer);
  snackTimer = setTimeout(hideSnack, undo ? 6000 : 5000);
}
function hideSnack() { $("snack").hidden = true; undoAction = null; }
$("snackBtn").addEventListener("click", async () => { const u = undoAction; hideSnack(); if (u) await u(); });

async function deleteClip(id) {
  const idx = clips.findIndex((c) => c.id === id);
  if (idx < 0) return;
  const removed = clips[idx];
  clips = clips.filter((c) => c.id !== id); renderPopup(); await persist();
  showSnack("카드 1장을 지웠어요", async () => {
    if (clips.some((c) => c.id === removed.id)) return;
    if (clips.length >= MAX) { showSnack("50개가 가득 차서 되돌릴 수 없어요. 다른 카드를 먼저 지워 주세요."); return; }
    clips.splice(Math.min(idx, clips.length), 0, removed);
    renderPopup(); await persist(); showSnack("되돌렸어요");
  });
}

// ---------- 백업: 내보내기·불러오기 ----------
const stamp = () => { const d = new Date(), p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`; };
function buildBackup() {
  return { app: "내 문장 모음", format: 1, version: APP_VERSION, exportedAt: new Date().toISOString(), clips, learned, theme: themeId };
}
$("exportBtn").addEventListener("click", () => {
  if (!clips.length) { showSnack("백업할 카드가 아직 없어요."); return; }
  const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `내문장모음-백업-${stamp()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  showSnack(`${clips.length}장을 백업 파일로 저장했어요 (다운로드 폴더).`);
});

// 맥 크롬은 팝업에서 파일 고르기 창을 열면 팝업이 닫혀서, 불러오기는 새 탭에서 함
const inPopup = () => { try { return chrome.extension.getViews({ type: "popup" }).includes(window); } catch { return false; } };
if (!inPopup() && location.protocol === "chrome-extension:" && history.length <= 2) document.body.classList.add("as-page");
$("importBtn").addEventListener("click", () => {
  if (inPopup()) { chrome.tabs.create({ url: chrome.runtime.getURL("popup.html#import") }); window.close(); return; }
  $("importFile").click();
});
const BAD_KEYS = new Set(["__proto__", "constructor", "prototype"]);
function cleanClip(c) {
  if (!c || typeof c !== "object") return null;
  const type = c.type === "image" ? "image" : c.type === "text" ? "text" : null;
  if (!type) return null;
  const content = typeof c.content === "string" ? c.content.slice(0, 20000).trim() : "";
  if (!content || (type === "image" && !isSafeImageUrl(content))) return null;
  const out = {
    id: typeof c.id === "string" && /^[\w-]{1,40}$/.test(c.id) ? c.id : Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    type, content,
    pageUrl: typeof c.pageUrl === "string" && /^https?:/i.test(c.pageUrl) ? c.pageUrl.slice(0, 2000) : "",
    savedAt: Number.isFinite(c.savedAt) ? c.savedAt : Date.now(),
    memo: typeof c.memo === "string" ? c.memo.slice(0, 5000) : "",
    topic: typeof c.topic === "string" && c.topic.trim() ? c.topic.trim().slice(0, 12) : null,
    topicAuto: c.topicAuto !== false
  };
  if (type === "text" && typeof c.contentHtml === "string") { const h = sanitize(c.contentHtml); if (HAS_FMT.test(h)) out.contentHtml = h; }
  if (typeof c.memoHtml === "string") { const h = sanitize(c.memoHtml); if (HAS_FMT.test(h)) out.memoHtml = h; }
  if (c.crop && typeof c.crop === "object" && Object.prototype.hasOwnProperty.call(RATIOS, c.crop.ratio))
    out.crop = { ratio: c.crop.ratio, x: clamp(+c.crop.x || 50), y: clamp(+c.crop.y || 50), zoom: Math.min(3, Math.max(1, +c.crop.zoom || 1)) };
  if (c.edited === true) out.edited = true;
  return out;
}
async function importBackup(data) {
  if (!data || data.app !== "내 문장 모음" || !Array.isArray(data.clips)) throw new Error("format");
  let added = 0, dup = 0, over = 0, bad = 0;
  const next = clips.slice();
  for (const raw of data.clips.slice(0, 1000)) {
    const c = cleanClip(raw);
    if (!c) { bad++; continue; }
    if (next.some((x) => x.id === c.id || (x.type === c.type && x.content === c.content))) { dup++; continue; }
    if (next.length >= MAX) { over++; continue; }
    next.push(c); added++;
  }
  if (data.learned && typeof data.learned === "object") {
    for (const kind of ["words", "hosts"]) {
      const src = data.learned[kind];
      if (!src || typeof src !== "object") continue;
      for (const [w, m] of Object.entries(src).slice(0, 5000)) {
        if (BAD_KEYS.has(w) || w.length > 60 || !m || typeof m !== "object") continue;
        learned[kind][w] = learned[kind][w] || {};
        for (const [t, n] of Object.entries(m)) if (!BAD_KEYS.has(t) && t.length <= 12 && Number.isFinite(n)) learned[kind][w][t] = Math.max(learned[kind][w][t] || 0, Math.min(n, 99));
      }
    }
    await chrome.storage.local.set({ learned });
  }
  clips = next; fillTopics(); renderPopup(); await persist();
  return { added, dup, over, bad };
}
$("importFile").addEventListener("change", async () => {
  const f = $("importFile").files[0]; $("importFile").value = "";
  if (!f) return;
  try {
    if (f.size > 5 * 1024 * 1024) throw new Error("size");
    const r = await importBackup(JSON.parse(await f.text()));
    showSnack([`불러왔어요: ${r.added}장 추가`, r.dup && `${r.dup}장은 이미 있음`, r.over && `${r.over}장은 50개가 넘어 못 불러옴`, r.bad && `${r.bad}장은 형식이 맞지 않음`].filter(Boolean).join(" · "));
  } catch {
    showSnack("백업 파일을 읽지 못했어요. ‘내 문장 모음’에서 ⤓ 백업으로 만든 .json 파일인지 확인해 주세요.");
  }
});
if (location.hash === "#import") setTimeout(() => showSnack("여기서 ‘⤒ 불러오기’를 누르고 백업 파일을 고르세요."), 300);

// ---------- 시작 ----------
(async () => {
  const d = await chrome.storage.local.get(["clips", "learned", "theme"]);
  clips = d.clips || [];
  learned = d.learned || learned;
  applyTheme(d.theme || "lemon", false);
  if (fillTopics()) await persist();
  renderPopup();
})();
