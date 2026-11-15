// What's in my cart? 프론트엔드 (빌드 없이 쓰는 순수 JS)
// 백엔드와 같은 주소에서 서빙됨 -> API 주소는 /posts 처럼 앞부분 없이 씀 (CORS 걱정 x)

// 상수

const CATEGORIES = {
  LUNCH: { emoji: "🍱", label: "오늘 점심" },
  CAT: { emoji: "🐱", label: "고양이 자랑" },
  SKY: { emoji: "☁️", label: "오늘의 하늘" },
  HAUL: { emoji: "🛍️", label: "산 거 자랑" },
  CHAT: { emoji: "💬", label: "잡담" },
};
const PAGE_SIZE = 12;

// 상태: 토큰(로그인), 내 정보
const state = {
  token: safeGet("token"),
  me: null,
  feed: { category: null, sort: "latest", today: false, page: 1, items: [], total: 0 },
};

// 유틸

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch { /* 저장 못 해도 동작은 함 */ }
}

// 사용자가 쓴 글을 HTML에 넣을 때 꼭 escape -> <script> 같은 걸 써도 실행 x (XSS 방지)
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function ticketNo(n) {
  return "#" + String(n).padStart(3, "0"); // 5 -> #005
}

function timeText(iso) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// 티켓마다 조금씩 다르게 기울이기. id로 정해서 다시 그려도 같은 각도
function tilt(id) {
  return ((id * 37) % 9) - 4 + "deg";
}

let toastTimer;
function toast(message, isError = false) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.className = "toast" + (isError ? " error" : "");
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2600);
}

// API 호출

class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function api(path, { method = "GET", json, form } = {}) {
  const headers = {};
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  let body;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (form) {
    body = form; // FormData는 Content-Type을 브라우저가 알아서 붙임 (multipart 경계값 포함)
  }

  const res = await fetch(path, { method, headers, body });
  if (res.status === 204) return null; // 삭제 성공은 body 없음
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // 백엔드 에러 형식: {"error": {"code", "message", "details"}}
    const err = data?.error ?? { code: `HTTP_${res.status}`, message: "요청을 처리하지 못했어요." };
    let message = err.message;
    if (err.code === "VALIDATION_ERROR" && Array.isArray(err.details) && err.details.length) {
      message = err.details.map((d) => `${d.field}: ${d.message}`).join(" / ");
    }
    // 토큰 만료/위조 -> 로그아웃 처리하고 로그인 화면으로
    if ((err.code === "TOKEN_EXPIRED" || err.code === "UNAUTHORIZED") && state.token) {
      logout(false);
      toast(err.code === "TOKEN_EXPIRED" ? "로그인이 만료됐어요. 다시 로그인해 주세요." : message, true);
      location.hash = "#/login";
    }
    throw new ApiError(err.code, message, res.status);
  }
  return data;
}

async function loadMe() {
  if (!state.token) {
    state.me = null;
    return;
  }
  try {
    state.me = await api("/users/me");
  } catch {
    state.me = null;
  }
}

function logout(showToast = true) {
  state.token = null;
  state.me = null;
  safeSet("token", null);
  renderNav();
  if (showToast) toast("로그아웃했어요.");
}

// 공통 조각

function clipHtml(extra = "") {
  return `<span class="clip ${extra}" aria-hidden="true"></span>`;
}

function photoHtml(p, cls = "sticker") {
  if (p.image_url) {
    return `<img class="${cls}" src="${esc(p.image_url)}" alt="${esc(p.title)} 사진" loading="lazy" />`;
  }
  const c = CATEGORIES[p.category] ?? CATEGORIES.CHAT;
  return `<div class="${cls} placeholder" aria-hidden="true">${c.emoji}</div>`;
}

function whoHtml(p) {
  // 익명성: PUBLIC 글은 author가 null -> 익명
  if (p.is_mine) return `<span class="who">🛒 내 티켓</span>`;
  if (p.author) return `<span class="who">👥 ${esc(p.author.nickname)}</span>`;
  return `<span class="who">🔒 익명</span>`;
}

function ticketHtml(p) {
  const c = CATEGORIES[p.category] ?? CATEGORIES.CHAT;
  return `
    <article class="ticket" style="--tilt:${tilt(p.id)}" data-action="open-ticket" data-id="${p.id}" tabindex="0"
      aria-label="${esc(p.title)} 티켓 뽑기">
      ${clipHtml()}
      <div class="receipt">
        <div class="ticket-no">TODAY'S TICKET ${ticketNo(p.ticket_no)}</div>
        <hr class="dash" />
        ${photoHtml(p)}
        <div class="starburst" title="나도 담기 수">${p.like_count}<small>담기</small></div>
        <span class="bubble">${c.emoji} ${c.label}</span>
        <div class="ticket-title">${esc(p.title)}</div>
        <hr class="dash" />
        <div class="meta">
          ${whoHtml(p)}
          <span>✋ ${p.pull_count} · 💬 ${p.comment_count}</span>
        </div>
      </div>
    </article>`;
}

// 화면: 오늘의 레일 (피드)

async function renderRail() {
  const f = state.feed;
  const chips = [`<button class="chip ${f.category ? "" : "on"}" data-action="filter" data-cat="">전체</button>`]
    .concat(
      Object.entries(CATEGORIES).map(
        ([key, c]) =>
          `<button class="chip ${f.category === key ? "on" : ""}" data-action="filter" data-cat="${key}"><span class="emo">${c.emoji}</span>${c.label}</button>`
      )
    )
    .join("");

  app().innerHTML = `
    <section>
      <span class="flyer-label">TODAY'S RAIL</span>
      <p class="flyer-sub">HANG ONE PHOTO · PULL ONE STORY — 티켓을 눌러서 뽑아 보세요</p>
      <div class="toolbar">
        ${chips}
        <button class="chip ${f.sort === "popular" ? "on" : ""}" data-action="sort">${f.sort === "popular" ? "🔥 인기순" : "🕒 최신순"}</button>
        <label class="toggle"><input type="checkbox" data-action="today" ${f.today ? "checked" : ""}/> 오늘 걸린 것만</label>
      </div>
      <div class="rail-wrap">
        <div class="rail" aria-hidden="true"></div>
        <div class="rail-track" id="track"><p class="loading">티켓 가져오는 중...</p></div>
      </div>
    </section>`;
  await loadFeed(true);
}

async function loadFeed(reset) {
  const f = state.feed;
  if (reset) {
    f.page = 1;
    f.items = [];
  }
  const params = new URLSearchParams({ page: f.page, size: PAGE_SIZE, sort: f.sort, today: f.today });
  if (f.category) params.set("category", f.category);

  const track = document.getElementById("track");
  try {
    const data = await api(`/posts?${params}`);
    f.items = f.items.concat(data.items);
    f.total = data.total;
  } catch (e) {
    track.innerHTML = `<p class="loading">${esc(e.message)}</p>`;
    return;
  }

  if (!f.items.length) {
    track.innerHTML = `
      <div class="empty-rail">
        <b>레일이 비어 있어요</b>
        <p class="muted">첫 티켓을 걸어 보세요!</p>
        <a class="btn red" href="#/hang">＋ 티켓 걸기</a>
      </div>`;
    return;
  }
  const more = f.items.length < f.total ? `<button class="btn yellow more-btn" data-action="more">더 걸린 티켓 →</button>` : "";
  track.innerHTML = f.items.map(ticketHtml).join("") + more;
}

// 화면: 티켓 뽑기 (상세 모달)

// 지금 열려 있는 티켓. 담기/리뷰 후에 상세를 다시 GET 하면 pull_count가 또 올라감
// -> 한 번 뽑은 티켓은 여기 들고 있다가 화면만 다시 그림
const detail = { post: null, comments: null };

async function openTicket(id) {
  const body = document.getElementById("modal-body");
  document.getElementById("modal").hidden = false;
  body.innerHTML = `<p class="loading">뽑는 중...</p>`;
  try {
    const [post, comments] = await Promise.all([api(`/posts/${id}`), api(`/posts/${id}/comments?size=100`)]);
    detail.post = post;
    detail.comments = comments;
    renderTicketDetail();
  } catch (e) {
    body.innerHTML = `<div class="sheet center">${clipHtml("sheet-clip")}<p>${esc(e.message)}</p>
      <button class="btn" data-action="close-modal">닫기</button></div>`;
  }
}

async function reloadComments() {
  detail.comments = await api(`/posts/${detail.post.id}/comments?size=100`);
  detail.post.comment_count = detail.comments.total;
  renderTicketDetail();
}

function renderTicketDetail() {
  const p = detail.post;
  const comments = detail.comments;
  const c = CATEGORIES[p.category] ?? CATEGORIES.CHAT;
  const lines = comments.items
    .map(
      (cm) => `
      <li>
        <div class="c-head">
          <span class="c-who ${cm.author_label === "글쓴이" ? "op" : ""}">${esc(cm.author_label)}${cm.is_mine ? " (나)" : ""}</span>
          <span class="muted">${timeText(cm.created_at)}
            ${cm.is_mine ? `<button class="btn small" data-action="delete-comment" data-id="${cm.id}">삭제</button>` : ""}
          </span>
        </div>
        <div class="c-body">${esc(cm.content)}</div>
      </li>`
    )
    .join("");

  const commentForm = state.me
    ? `<form class="comment-form" data-action="comment">
         <input name="content" maxlength="500" placeholder="리뷰 남기기 (익명)" required aria-label="댓글" />
         <button class="btn red">남기기</button>
       </form>`
    : `<p class="muted center"><a href="#/login" data-action="close-modal">로그인</a>하면 리뷰를 남길 수 있어요.</p>`;

  const owner = p.is_mine
    ? `<button class="btn small" data-action="edit-post">수정</button>
       <button class="btn small" data-action="delete-post" data-id="${p.id}">삭제</button>`
    : "";

  document.getElementById("modal-body").innerHTML = `
    <div class="sheet" id="detail">
      ${clipHtml("sheet-clip")}
      <button class="close-x" data-action="close-modal" aria-label="닫기">✕</button>
      <div class="ticket-no">TODAY'S TICKET ${ticketNo(p.ticket_no)}</div>
      <hr class="dash" />
      ${photoHtml(p, "sticker detail-photo")}
      <span class="bubble">${c.emoji} ${c.label}</span>
      <h1 style="text-align:left;margin-top:8px">${esc(p.title)}</h1>
      <div class="line">${whoHtml(p)} <span class="lock">${p.visibility === "FRIENDS" ? "👥 FRIENDS" : "🔒 PUBLIC"}</span></div>
      <hr class="dash" />
      <p class="detail-content">${esc(p.content)}</p>
      <hr class="dash" />
      <div class="line"><span>걸린 시각</span><b>${timeText(p.created_at)}</b></div>
      <div class="line"><span>뽑힌 횟수</span><b>✋ ${p.pull_count}</b></div>
      <div class="line"><span>나도 담기</span><b>${p.like_count}</b></div>
      <div class="actions">
        <button class="btn like-btn ${p.liked_by_me ? "on" : ""}" data-action="like">
          ${p.liked_by_me ? "✔ 담았어요" : "＋ 나도 담기"}
        </button>
        ${owner}
      </div>
      <hr class="dash" />
      <h2>REVIEWS (${comments.total})</h2>
      <ul class="comments">${lines || `<li class="muted">아직 리뷰가 없어요.</li>`}</ul>
      ${commentForm}
      <div class="barcode" aria-hidden="true"></div>
      <div class="thanks">THANKS FOR SHARING YOUR DAY</div>
    </div>`;
}

function renderEditForm(p) {
  document.getElementById("detail").innerHTML = `
    ${clipHtml("sheet-clip")}
    <h1>티켓 고치기</h1>
    <form data-action="save-edit">
      <label class="field">제목<input name="title" maxlength="50" value="${esc(p.title)}" required /></label>
      <label class="field">내용<textarea name="content" maxlength="1000" required>${esc(p.content)}</textarea></label>
      ${categoryPicker(p.category)}
      ${visibilityPicker(p.visibility)}
      <div class="actions">
        <button class="btn red">저장</button>
        <button type="button" class="btn" data-action="back-detail">취소</button>
      </div>
    </form>`;
}

// 화면: 티켓 걸기 (글쓰기)

function categoryPicker(selected = "LUNCH") {
  return `<div class="field">코너 (카테고리)<div class="pick">
    ${Object.entries(CATEGORIES)
      .map(
        ([key, c]) =>
          `<label><input type="radio" name="category" value="${key}" ${key === selected ? "checked" : ""}/><span>${c.emoji} ${c.label}</span></label>`
      )
      .join("")}
  </div></div>`;
}

function visibilityPicker(selected = "PUBLIC") {
  return `<div class="field">공개 범위<div class="pick">
    <label><input type="radio" name="visibility" value="PUBLIC" ${selected === "PUBLIC" ? "checked" : ""}/><span>🔒 전체 공개 (익명)</span></label>
    <label><input type="radio" name="visibility" value="FRIENDS" ${selected === "FRIENDS" ? "checked" : ""}/><span>👥 친구만 (닉네임 공개)</span></label>
  </div></div>`;
}

function renderHang() {
  app().innerHTML = `
    <div class="sheet">
      ${clipHtml("sheet-clip")}
      <h1>HANG A TICKET</h1>
      <p class="center muted">사진 한 장으로 오늘을 담아 레일에 걸어요</p>
      <hr class="dash" />
      <form data-action="hang">
        <div class="field">사진 (jpg · png · webp, 5MB 이하)
          <label class="photo-drop" id="drop">
            <span id="drop-text">📸 눌러서 사진 고르기</span>
            <input type="file" name="image" accept="image/jpeg,image/png,image/webp" hidden data-action="preview" />
          </label>
        </div>
        <label class="field">제목<input name="title" maxlength="50" placeholder="오늘 점심 김치찌개" required /></label>
        <label class="field">내용<textarea name="content" maxlength="1000" placeholder="회사 앞 찌개집 최고" required></textarea></label>
        ${categoryPicker()}
        ${visibilityPicker()}
        <hr class="dash" />
        <button class="grab">GRAB! 레일에 걸기</button>
      </form>
      <div class="barcode" aria-hidden="true"></div>
    </div>`;
}

// 화면: 내 카트

async function renderCart() {
  app().innerHTML = `<p class="loading">카트 여는 중...</p>`;
  let data;
  try {
    data = await api(`/users/me/posts?size=100`);
  } catch (e) {
    app().innerHTML = `<p class="loading">${esc(e.message)}</p>`;
    return;
  }
  const me = state.me;
  app().innerHTML = `
    <section>
      <div class="sheet">
        ${clipHtml("sheet-clip")}
        <h1>WHAT'S IN<br/>MY CART?</h1>
        <hr class="dash" />
        <div class="line"><span>CUSTOMER</span><b>${esc(me?.nickname)}</b></div>
        <div class="line"><span>EMAIL</span><b>${esc(me?.email)}</b></div>
        <div class="line"><span>ITEMS</span><b>${data.total}</b></div>
        <div class="line"><span>TOTAL PULLS</span><b>✋ ${data.items.reduce((s, p) => s + p.pull_count, 0)}</b></div>
        <div class="line"><span>TOTAL GRABS</span><b>${data.items.reduce((s, p) => s + p.like_count, 0)}</b></div>
        <div class="barcode" aria-hidden="true"></div>
        <div class="thanks">THANKS FOR SHARING YOUR DAY</div>
      </div>
      <div class="grid">
        ${data.items.length ? data.items.map(ticketHtml).join("") : `<div class="empty-rail">카트가 비어 있어요. <a href="#/hang">첫 티켓 걸기</a></div>`}
      </div>
    </section>`;
}

// 화면: 친구

async function renderFriends() {
  app().innerHTML = `<p class="loading">친구 목록 가져오는 중...</p>`;
  let friends, received, sent;
  try {
    [friends, received, sent] = await Promise.all([
      api("/friends?size=100"),
      api("/friends/requests?type=received&size=100"),
      api("/friends/requests?type=sent&size=100"),
    ]);
  } catch (e) {
    app().innerHTML = `<p class="loading">${esc(e.message)}</p>`;
    return;
  }

  const row = (inner) => `<li>${inner}</li>`;
  app().innerHTML = `
    <div class="sheet">
      ${clipHtml("sheet-clip")}
      <h1>FRIENDS</h1>
      <p class="center muted">친구가 되면 서로의 "친구만" 티켓을 볼 수 있어요</p>
      <hr class="dash" />
      <form class="comment-form" data-action="friend-request">
        <input name="nickname" minlength="2" maxlength="20" placeholder="친구 닉네임" required aria-label="친구 닉네임" />
        <button class="btn red">요청</button>
      </form>

      <h2>받은 요청 (${received.total})</h2>
      <ul class="list">
        ${received.items.map((r) => row(`<span>📨 ${esc(r.nickname)}</span>
          <span><button class="btn small yellow" data-action="respond" data-id="${r.id}" data-status="ACCEPTED">수락</button>
          <button class="btn small" data-action="respond" data-id="${r.id}" data-status="REJECTED">거절</button></span>`)).join("") || `<li class="muted">없어요</li>`}
      </ul>

      <h2>보낸 요청 (${sent.total})</h2>
      <ul class="list">
        ${sent.items.map((r) => row(`<span>📤 ${esc(r.nickname)}</span><span class="muted">대기 중</span>`)).join("") || `<li class="muted">없어요</li>`}
      </ul>

      <h2>내 친구 (${friends.total})</h2>
      <ul class="list">
        ${friends.items.map((f) => row(`<span>👥 ${esc(f.nickname)}</span>
          <button class="btn small" data-action="unfriend" data-nickname="${esc(f.nickname)}">삭제</button>`)).join("") || `<li class="muted">아직 없어요</li>`}
      </ul>
      <div class="barcode" aria-hidden="true"></div>
    </div>`;
}

// 화면: 로그인 / 회원가입

function renderAuth(mode) {
  const isSignup = mode === "signup";
  app().innerHTML = `
    <div class="sheet">
      ${clipHtml("sheet-clip")}
      <h1>${isSignup ? "NEW CUSTOMER" : "WELCOME BACK"}</h1>
      <p class="center muted">${isSignup ? "가입하고 오늘의 티켓을 걸어 보세요" : "로그인하고 친구 티켓까지 뽑아 보세요"}</p>
      <hr class="dash" />
      <form data-action="${mode}">
        <label class="field">이메일<input type="email" name="email" autocomplete="email" required /></label>
        <label class="field">비밀번호${isSignup ? " (8자 이상, 영문+숫자)" : ""}
          <input type="password" name="password" autocomplete="${isSignup ? "new-password" : "current-password"}" required ${isSignup ? 'minlength="8"' : ""}/></label>
        ${isSignup ? `<label class="field">닉네임 (2~20자)<input name="nickname" minlength="2" maxlength="20" required /></label>` : ""}
        <button class="grab">${isSignup ? "가입하기" : "로그인"}</button>
      </form>
      <p class="center muted" style="margin-top:14px">
        ${isSignup ? `이미 회원이에요 → <a href="#/login">로그인</a>` : `처음이에요 → <a href="#/signup">회원가입</a>`}
      </p>
      <div class="barcode" aria-hidden="true"></div>
    </div>`;
}

// 상단 메뉴

function renderNav() {
  const route = location.hash.split("/")[1] || "rail";
  const link = (r, text, cls = "") => `<a href="#/${r}" class="${cls} ${route === r ? "active" : ""}">${text}</a>`;
  document.getElementById("nav").innerHTML = state.me
    ? link("rail", "🧵 오늘의 레일") +
      link("cart", "🛒 내 카트") +
      link("friends", "👥 친구") +
      link("hang", "＋ 티켓 걸기", "hang") +
      `<button data-action="logout">로그아웃</button>`
    : link("rail", "🧵 오늘의 레일") + link("login", "로그인") + link("signup", "회원가입", "hang");
}

// 라우터: 주소의 # 뒤를 보고 화면을 바꿈 ex) #/cart -> 내 카트

const app = () => document.getElementById("app");
const NEED_LOGIN = ["cart", "hang", "friends"];

async function route() {
  const page = location.hash.split("/")[1] || "rail";
  if (NEED_LOGIN.includes(page) && !state.me) {
    toast("로그인이 필요해요.", true);
    location.hash = "#/login";
    return;
  }
  renderNav();
  window.scrollTo(0, 0);
  if (page === "cart") return renderCart();
  if (page === "hang") return renderHang();
  if (page === "friends") return renderFriends();
  if (page === "login" || page === "signup") return renderAuth(page);
  if (page === "ticket") {
    // #/ticket/5 -> 레일을 깔고 5번 티켓을 바로 뽑아서 보여 줌 (티켓 링크 공유용)
    await renderRail();
    return openTicket(location.hash.split("/")[2]);
  }
  return renderRail();
}

function closeModal() {
  document.getElementById("modal").hidden = true;
  document.getElementById("modal-body").innerHTML = "";
}

// 이벤트: 화면마다 따로 붙이지 않고 document 한 곳에서 data-action 보고 처리 (이벤트 위임)

document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-action]");
  if (!el || el.tagName === "FORM") return;
  const { action, id } = el.dataset;

  try {
    if (action === "open-ticket") {
      e.preventDefault();
      return openTicket(id);
    }
    if (action === "close-modal") return closeModal();
    if (action === "logout") {
      logout();
      location.hash = "#/rail";
      return;
    }
    if (action === "filter") {
      state.feed.category = el.dataset.cat || null;
      return renderRail();
    }
    if (action === "sort") {
      state.feed.sort = state.feed.sort === "latest" ? "popular" : "latest";
      return renderRail();
    }
    if (action === "more") {
      state.feed.page += 1;
      return loadFeed(false);
    }
    if (action === "like") {
      if (!state.me) return toast("로그인하면 담을 수 있어요.", true);
      const p = detail.post;
      if (p.liked_by_me) {
        await api(`/posts/${p.id}/likes`, { method: "DELETE" });
        p.liked_by_me = false;
        p.like_count -= 1;
        toast("담기를 취소했어요.");
      } else {
        const r = await api(`/posts/${p.id}/likes`, { method: "POST" });
        p.liked_by_me = true;
        p.like_count = r.like_count; // 서버가 알려 준 최신 담기 수
        toast("나도 담았어요! 🛒");
      }
      renderTicketDetail();
      return refreshAfterChange();
    }
    if (action === "delete-comment") {
      if (!confirm("이 리뷰를 지울까요?")) return;
      await api(`/comments/${id}`, { method: "DELETE" });
      await reloadComments();
      return refreshAfterChange();
    }
    if (action === "edit-post") return renderEditForm(detail.post);
    if (action === "back-detail") return renderTicketDetail();
    if (action === "delete-post") {
      if (!confirm("티켓을 레일에서 내릴까요? 리뷰와 담기도 같이 지워져요.")) return;
      await api(`/posts/${id}`, { method: "DELETE" });
      toast("티켓을 내렸어요.");
      closeModal();
      return route();
    }
    if (action === "respond") {
      await api(`/friends/requests/${id}`, { method: "PATCH", json: { status: el.dataset.status } });
      toast(el.dataset.status === "ACCEPTED" ? "친구가 됐어요! 👥" : "요청을 거절했어요.");
      return renderFriends();
    }
    if (action === "unfriend") {
      if (!confirm(`${el.dataset.nickname}님과 친구를 끊을까요?`)) return;
      await api(`/friends/${encodeURIComponent(el.dataset.nickname)}`, { method: "DELETE" });
      toast("친구를 삭제했어요.");
      return renderFriends();
    }
  } catch (err) {
    toast(err.message, true);
  }
});

// 키보드로도 티켓 열기 (Enter)
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
  if (e.key === "Enter" && e.target.matches?.(".ticket")) openTicket(e.target.dataset.id);
});

// 오늘만 보기 체크박스, 사진 미리보기
document.addEventListener("change", (e) => {
  const action = e.target.dataset?.action;
  if (action === "today") {
    state.feed.today = e.target.checked;
    renderRail();
  }
  if (action === "preview") {
    const file = e.target.files[0];
    const text = document.getElementById("drop-text");
    const old = document.querySelector("#drop img");
    if (old) old.remove();
    if (!file) return (text.hidden = false);
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = "미리보기";
    text.hidden = true;
    document.getElementById("drop").prepend(img);
  }
});

document.addEventListener("submit", async (e) => {
  const form = e.target;
  const action = form.dataset.action;
  if (!action) return;
  e.preventDefault();
  const button = form.querySelector("button:not([type=button])");
  if (button) button.disabled = true;
  const fd = new FormData(form);

  try {
    if (action === "login" || action === "signup") {
      const creds = { email: fd.get("email"), password: fd.get("password") };
      if (action === "signup") {
        await api("/auth/signup", { method: "POST", json: { ...creds, nickname: fd.get("nickname") } });
      }
      const { access_token } = await api("/auth/login", { method: "POST", json: creds });
      state.token = access_token;
      safeSet("token", access_token);
      await loadMe();
      toast(`어서 오세요, ${state.me.nickname}님!`);
      location.hash = "#/rail";
      return;
    }
    if (action === "hang") {
      const image = fd.get("image");
      if (image && !image.size) fd.delete("image"); // 사진 안 고르면 빈 파일이 들어감 -> 빼고 보냄
      const post = await api("/posts", { method: "POST", form: fd });
      toast(`티켓 ${ticketNo(post.ticket_no)} 걸었어요! GRAB!`);
      state.feed = { ...state.feed, category: null, today: false, sort: "latest" };
      location.hash = "#/rail";
      return;
    }
    if (action === "comment") {
      await api(`/posts/${detail.post.id}/comments`, { method: "POST", json: { content: fd.get("content") } });
      await reloadComments();
      return refreshAfterChange();
    }
    if (action === "save-edit") {
      const json = Object.fromEntries(["title", "content", "category", "visibility"].map((k) => [k, fd.get(k)]));
      detail.post = await api(`/posts/${detail.post.id}`, { method: "PATCH", json }); // 수정 응답 = 최신 티켓
      toast("티켓을 고쳤어요.");
      renderTicketDetail();
      return refreshAfterChange();
    }
    if (action === "friend-request") {
      const r = await api("/friends/requests", { method: "POST", json: { nickname: fd.get("nickname").trim() } });
      toast(`${r.nickname}님에게 친구 요청을 보냈어요.`);
      return renderFriends();
    }
  } catch (err) {
    toast(err.message, true);
  } finally {
    if (button) button.disabled = false;
  }
});

// 상세 모달에서 바꾼 내용(담기, 리뷰)을 뒤에 있는 레일/카트에도 반영
function refreshAfterChange() {
  const page = location.hash.split("/")[1] || "rail";
  if (page === "rail") loadFeed(true);
  if (page === "cart") renderCart();
}

// 시작

window.addEventListener("hashchange", route);
(async () => {
  await loadMe();
  if (!location.hash) location.hash = "#/rail";
  else route();
})();
