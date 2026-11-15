// What's in my cart? 프론트엔드 (빌드 없이 쓰는 순수 JS)
// 백엔드와 같은 주소에서 서빙됨 -> API 주소는 /posts 처럼 앞부분 없이 씀 (CORS 걱정 x)

// 상수

// icon: 홈 상품 그림을 작게 줄인 아이콘 (이모지 대신 같은 그림체로 통일)
// example: 글쓰기 화면의 제목/내용 예시 (카테고리마다 다르게)
const CATEGORIES = {
  LUNCH: {
    icon: "assets/icons/lunch.png", label: "오늘 점심",
    example: { title: "회사 앞 김치찌개 정식", content: "반찬이 여덟 개나 나왔다. 계란말이가 제일 맛있었음" },
  },
  CAT: {
    icon: "assets/icons/cat.png", label: "고양이 자랑",
    example: { title: "창가에서 낮잠 자는 치즈", content: "햇빛 자리를 또 뺏겼다. 오늘도 고양이 승" },
  },
  SKY: {
    icon: "assets/icons/sky.png", label: "오늘의 하늘",
    example: { title: "퇴근길 분홍 노을", content: "버스 기다리다 올려다봤는데 하늘이 솜사탕 색이었다" },
  },
  HAUL: {
    icon: "assets/icons/haul.png", label: "산 거 자랑",
    example: { title: "드디어 산 머그컵", content: "3주 고민하다 결국 샀다. 커피가 두 배로 맛있는 기분" },
  },
  CHAT: {
    icon: "assets/icons/chat.png", label: "잡담",
    example: { title: "엘리베이터에서 생긴 일", content: "처음 본 사람이랑 같은 노래를 흥얼거리고 있었다" },
  },
};

// 카테고리 아이콘 <img>. 장식용이라 alt는 비움 (글자 라벨이 옆에 있음)
function catIcon(key, cls = "cat-icon") {
  const c = CATEGORIES[key] ?? CATEGORIES.CHAT;
  return `<img class="${cls}" src="${c.icon}" alt="" aria-hidden="true" />`;
}

// 손그림 선 아이콘 (SVG). 일부러 선을 살짝 삐뚤게 그려서 손으로 그린 느낌
// 색은 글자색(currentColor)을 따라감 -> 선택되면 같이 빨개짐
const DOODLE_PATHS = {
  latest: ["M12 3.4c4.8-.3 8.6 3.5 8.5 8.4-.1 4.8-3.9 8.4-8.6 8.3-4.8-.1-8.5-3.8-8.3-8.6.2-4.5 3.8-7.9 8.4-8.1z", "M12.2 7.4l-.1 4.9 3.3 2.1"],
  popular: ["M12 19.6c-4.4-3-7.7-6-7.6-9.7.1-2.4 2-4.2 4.2-4.1 1.6.1 2.8 1.1 3.4 2.4.8-1.4 2.1-2.5 3.7-2.4 2.3.1 4 2 3.8 4.4-.3 3.6-3.6 6.4-7.5 9.4z"],
  lock: ["M6.4 11.3c3.7-.4 7.4-.3 11.1 0 .3 2.6.3 5.3 0 7.9-3.7.3-7.4.3-11.1 0-.3-2.7-.3-5.3 0-7.9z", "M8.9 11.1V8.3c0-2 1.4-3.4 3.2-3.4s3.2 1.5 3.2 3.4v2.8", "M12 14.6v1.6"],
  friends: ["M9.1 11.3c1.6 0 2.8-1.3 2.8-2.9S10.7 5.6 9.1 5.6 6.3 6.8 6.3 8.4s1.2 2.9 2.8 2.9z", "M3.8 18.7c.6-3 2.6-4.8 5.3-4.8s4.6 1.8 5.2 4.8", "M15.7 11c1.4.1 2.5-1 2.5-2.4s-1-2.5-2.5-2.5", "M16.6 13.8c2 .4 3.3 2 3.6 4.7"],
  eye: ["M2.9 12.2c2.1-3.9 5.3-6 9.1-6s7 2.1 9.1 5.9c-2.1 3.9-5.3 6-9.1 6s-7-2.1-9.1-5.9z", "M12 14.9c1.6 0 2.8-1.3 2.8-2.8S13.6 9.3 12 9.3s-2.8 1.3-2.8 2.8 1.2 2.8 2.8 2.8z"],
  comment: ["M4.6 6.6c0-1.3.9-2.2 2.2-2.2h10.5c1.3 0 2.2.9 2.2 2.2v6.9c0 1.3-1 2.3-2.3 2.3h-7.1l-3.9 3.3.5-3.3c-1.2 0-2.1-1-2.1-2.3z"],
  camera: ["M4.3 8.5c0-1 .7-1.7 1.7-1.7h2.2l1.4-2.2h4.8l1.4 2.2H18c1 0 1.7.7 1.7 1.7v8.8c0 1-.8 1.7-1.7 1.7H6c-1 0-1.7-.7-1.7-1.7z", "M12.1 16.4c1.8 0 3.2-1.5 3.2-3.3s-1.5-3.2-3.3-3.2-3.2 1.5-3.2 3.3 1.5 3.2 3.3 3.2z"],
  cart: ["M3.4 4.9h2.4l2.1 9.7h9.5l2-6.9H7", "M9.6 19.5c.7 0 1.2-.6 1.2-1.2 0-.7-.6-1.2-1.2-1.2-.7 0-1.2.6-1.2 1.2 0 .7.6 1.2 1.2 1.2z", "M16.4 19.5c.7 0 1.2-.6 1.2-1.2 0-.7-.6-1.2-1.2-1.2-.7 0-1.2.6-1.2 1.2 0 .7.6 1.2 1.2 1.2z"],
  check: ["M5.4 12.8l4.1 3.9 9.1-9.8"],
  plus: ["M12.1 5.4l-.2 13.2", "M5.5 12.3l13-.2"],
  close: ["M6.2 6.4l11.5 11.3", "M17.6 6.2L6.4 17.8"],
  inbox: ["M4.3 13.2l2.2-7.6h11l2.3 7.6v5.3H4.3z", "M4.4 13.2h4.4l1 2h4.4l1-2h4.5"],
  send: ["M4.1 11.6l15.6-6.9-5.8 14.9-2.7-5.6z", "M11.2 14l8.4-9.2"],
};

function doodle(name, cls = "doodle") {
  const paths = (DOODLE_PATHS[name] ?? []).map((d) => `<path d="${d}"/>`).join("");
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
}

// 레일에 티켓을 거는 빨간 집게 (손그림 SVG). 위쪽 철사 고리가 레일을 감싸고, 아래 몸통이 영수증을 물고 있음
const CLIP_SVG = `<svg viewBox="0 0 40 50" aria-hidden="true">
  <path class="wire" d="M12.5 27.5c-1.4-8.8.4-17.4 7.4-19.6 7.3 1.9 9 10.9 7.6 19.6"/>
  <path class="wire" d="M15.6 27.3c-.8-6.4.4-12.3 4.4-14.1 4.1 1.6 4.9 7.7 4.2 14.1"/>
  <path class="body" d="M6.4 27.1c9.2-.9 18.4-.8 27.3.2l2.4 14.5c-10.4 2.7-21 2.6-32 .1z"/>
  <path class="shine" d="M9.6 31.4c6.7-.6 13.5-.6 20.2 0"/>
</svg>`;
const PRODUCTS = {
  LUNCH: { label: "도시락", image: "assets/products/lunch.png" },
  CAT: { label: "고양이 캔", image: "assets/products/cat.png" },
  SKY: { label: "구름 포장", image: "assets/products/sky.png" },
  HAUL: { label: "쇼핑백", image: "assets/products/haul.png" },
  CHAT: { label: "탄산 캔", image: "assets/products/chat.png" },
};
const PAGE_SIZE = 12;

// 상태: 토큰(로그인), 내 정보
const state = {
  token: safeGet("token"),
  me: null,
  selectedProduct: null,
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
  return `<span class="clip ${extra}" aria-hidden="true">${CLIP_SVG}</span>`;
}

function photoHtml(p, cls = "sticker") {
  if (p.image_url) {
    return `<img class="${cls}" src="${esc(p.image_url)}" alt="${esc(p.title)} 사진" loading="lazy" />`;
  }
  const product = PRODUCTS[p.category] ?? PRODUCTS.CHAT;
  return `<div class="${cls} placeholder" aria-hidden="true"><img src="${product.image}" alt="" /></div>`;
}

function whoHtml(p) {
  // 익명성: PUBLIC 글은 author가 null -> 익명
  if (p.is_mine) return `<span class="who">${doodle("cart")}내 티켓</span>`;
  if (p.author) return `<span class="who">${doodle("friends")}${esc(p.author.nickname)}</span>`;
  return `<span class="who">${doodle("lock")}익명</span>`;
}

function ticketHtml(p) {
  const c = CATEGORIES[p.category] ?? CATEGORIES.CHAT;
  return `
    <article class="ticket" style="--tilt:${tilt(p.id)}" data-action="open-ticket" data-id="${p.id}" tabindex="0"
      aria-label="${esc(p.title)} 티켓 보기">
      ${clipHtml()}
      <div class="receipt">
        <div class="ticket-no">TODAY'S TICKET ${ticketNo(p.ticket_no)}</div>
        <hr class="dash" />
        ${photoHtml(p)}
        <div class="starburst" title="나도 담기 수">${p.like_count}<small>담기</small></div>
        <span class="bubble">${catIcon(p.category)}${c.label}</span>
        <div class="ticket-title">${esc(p.title)}</div>
        <hr class="dash" />
        <div class="meta">
          ${whoHtml(p)}
          <span class="counts" title="조회수 · 댓글 수">${doodle("eye")}${p.pull_count}${doodle("comment")}${p.comment_count}</span>
        </div>
      </div>
    </article>`;
}

// 화면: 빈 카트에 상품을 담아 글쓰기 시작

function productHtml([category, product]) {
  return `<button class="product" draggable="true" data-action="pick-product" data-cat="${category}"
    aria-label="${product.label}을 카트에 담아 ${CATEGORIES[category].label} 글쓰기">
    <img src="${product.image}" alt="" draggable="false" />
    <span>${product.label}</span>
  </button>`;
}

function renderHome() {
  app().innerHTML = `
    <section class="cart-studio">
      <div class="studio-copy">
        <h1>오늘 뭐 담았어?</h1>
        <p>상품 하나를 골라 빈 카트에 담아 보세요.</p>
      </div>
      <div class="studio-layout">
        <div class="product-rack" aria-label="글 카테고리 상품">
          ${Object.entries(PRODUCTS).map(productHtml).join("")}
        </div>
        <div class="cart-drop" id="cart-drop" data-action="cart-drop" aria-label="상품을 놓는 빈 카트">
          <img class="empty-cart" src="assets/empty-cart.png" alt="빈 빨간 장바구니" />
        </div>
      </div>
      <p class="studio-help">컴퓨터에서는 드래그 · 휴대폰에서는 상품을 톡 눌러도 돼요</p>
    </section>`;
}

function chooseProduct(category) {
  const product = PRODUCTS[category];
  if (!product) return;
  state.selectedProduct = category;
  const drop = document.getElementById("cart-drop");
  if (drop) {
    drop.querySelector(".cart-item")?.remove();
    const img = document.createElement("img");
    img.className = "cart-item";
    img.src = product.image;
    img.alt = "";
    drop.append(img);
  }
  setTimeout(() => { location.hash = "#/hang"; }, 520);
}

// 화면: 오늘의 레일 (피드)

async function renderRail() {
  const f = state.feed;
  const chips = [`<button class="chip ${f.category ? "" : "on"}" data-action="filter" data-cat=""><img class="cat-icon" src="assets/icons/cart.png" alt="" aria-hidden="true" />전체</button>`]
    .concat(
      Object.entries(CATEGORIES).map(
        ([key, c]) =>
          `<button class="chip ${f.category === key ? "on" : ""}" data-action="filter" data-cat="${key}">${catIcon(key)}${c.label}</button>`
      )
    )
    .join("");

  app().innerHTML = `
    <section>
      <p class="flyer-sub">티켓을 눌러서 구경해 보세요</p>
      <div class="toolbar">
        ${chips}
        <button class="chip ${f.sort === "popular" ? "on" : ""}" data-action="sort">${f.sort === "popular" ? doodle("popular") + "인기순" : doodle("latest") + "최신순"}</button>
        <label class="toggle"><input type="checkbox" data-action="today" ${f.today ? "checked" : ""}/><span class="box" aria-hidden="true"></span><span class="toggle-text">오늘 걸린 것만</span></label>
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
        <a class="btn red" href="#/home">${doodle("plus")}티켓 걸기</a>
      </div>`;
    return;
  }
  const more = f.items.length < f.total ? `<button class="btn yellow more-btn" data-action="more">더 걸린 티켓 →</button>` : "";
  track.innerHTML = f.items.map(ticketHtml).join("") + more;
}

// 화면: 티켓 상세 (모달)

// 지금 열려 있는 티켓. 담기/리뷰 후에 상세를 다시 GET 하면 pull_count가 또 올라감
// -> 한 번 연 티켓은 여기 들고 있다가 화면만 다시 그림
const detail = { post: null, comments: null };

async function openTicket(id) {
  const body = document.getElementById("modal-body");
  document.getElementById("modal").hidden = false;
  body.innerHTML = `<p class="loading">불러오는 중...</p>`;
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
      <button class="close-x" data-action="close-modal" aria-label="닫기">${doodle("close")}</button>
      <div class="ticket-no">TODAY'S TICKET ${ticketNo(p.ticket_no)}</div>
      <hr class="dash" />
      ${photoHtml(p, "sticker detail-photo")}
      <span class="bubble">${catIcon(p.category)}${c.label}</span>
      <h1 style="text-align:left;margin-top:8px">${esc(p.title)}</h1>
      <div class="line">${whoHtml(p)} <span class="lock">${p.visibility === "FRIENDS" ? doodle("friends") + "FRIENDS" : doodle("lock") + "PUBLIC"}</span></div>
      <hr class="dash" />
      <p class="detail-content">${esc(p.content)}</p>
      <hr class="dash" />
      <div class="line"><span>걸린 시각</span><b>${timeText(p.created_at)}</b></div>
      <div class="line"><span>조회수</span><b>${doodle("eye")}${p.pull_count}</b></div>
      <div class="line"><span>나도 담기</span><b>${p.like_count}</b></div>
      <div class="actions">
        <button class="btn like-btn ${p.liked_by_me ? "on" : ""}" data-action="like">
          ${p.liked_by_me ? doodle("check") + "담았어요" : doodle("plus") + "나도 담기"}
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
          `<label><input type="radio" name="category" value="${key}" ${key === selected ? "checked" : ""}/><span>${catIcon(key)}${c.label}</span></label>`
      )
      .join("")}
  </div></div>`;
}

function visibilityPicker(selected = "PUBLIC") {
  return `<div class="field">공개 범위<div class="pick">
    <label><input type="radio" name="visibility" value="PUBLIC" ${selected === "PUBLIC" ? "checked" : ""}/><span>${doodle("lock")}전체 공개 (익명)</span></label>
    <label><input type="radio" name="visibility" value="FRIENDS" ${selected === "FRIENDS" ? "checked" : ""}/><span>${doodle("friends")}친구만 (닉네임 공개)</span></label>
  </div></div>`;
}

function renderHang() {
  const selected = state.selectedProduct && PRODUCTS[state.selectedProduct]
    ? state.selectedProduct
    : "LUNCH";
  const product = PRODUCTS[selected];
  app().innerHTML = `
    <div class="sheet">
      ${clipHtml("sheet-clip")}
      <h1>ADD TO MY CART</h1>
      <p class="center muted">고른 상품으로 오늘의 영수증을 만들어요</p>
      <hr class="dash" />
      <div class="selected-product-line">
        <img src="${product.image}" alt="" />
        <span><b>${product.label}</b><br />${CATEGORIES[selected].label} 코너</span>
      </div>
      <form data-action="hang">
        <div class="field">사진 (jpg · png · webp, 5MB 이하)
          <label class="photo-drop" id="drop">
            <span id="drop-text">${doodle("camera", "doodle big")}<br />눌러서 사진 고르기</span>
            <input type="file" name="image" accept="image/jpeg,image/png,image/webp" hidden data-action="preview" />
          </label>
        </div>
        <label class="field">제목<input name="title" maxlength="50" placeholder="${esc(CATEGORIES[selected].example.title)}" required /></label>
        <label class="field">내용<textarea name="content" maxlength="1000" placeholder="${esc(CATEGORIES[selected].example.content)}" required></textarea></label>
        ${categoryPicker(selected)}
        ${visibilityPicker()}
        <hr class="dash" />
        <button class="grab">카트에 담기</button>
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
        <div class="line"><span>TOTAL VIEWS</span><b>${doodle("eye")}${data.items.reduce((s, p) => s + p.pull_count, 0)}</b></div>
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
        ${received.items.map((r) => row(`<span>${doodle("inbox")}${esc(r.nickname)}</span>
          <span><button class="btn small yellow" data-action="respond" data-id="${r.id}" data-status="ACCEPTED">수락</button>
          <button class="btn small" data-action="respond" data-id="${r.id}" data-status="REJECTED">거절</button></span>`)).join("") || `<li class="muted">없어요</li>`}
      </ul>

      <h2>보낸 요청 (${sent.total})</h2>
      <ul class="list">
        ${sent.items.map((r) => row(`<span>${doodle("send")}${esc(r.nickname)}</span><span class="muted">대기 중</span>`)).join("") || `<li class="muted">없어요</li>`}
      </ul>

      <h2>내 친구 (${friends.total})</h2>
      <ul class="list">
        ${friends.items.map((f) => row(`<span>${doodle("friends")}${esc(f.nickname)}</span>
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
      <p class="center muted">${isSignup ? "가입하고 오늘의 티켓을 걸어 보세요" : "로그인하고 친구 티켓까지 구경해 보세요"}</p>
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
  const route = location.hash.split("/")[1] || "home";
  const link = (r, text, cls = "") => `<a href="#/${r}" class="${cls} ${route === r ? "active" : ""}">${text}</a>`;
  document.getElementById("nav").innerHTML = state.me
    ? link("home", "담기") +
      link("rail", "오늘의 레일") +
      link("cart", "내 카트") +
      link("friends", "친구") +
      `<button data-action="logout">로그아웃</button>`
    : link("home", "담기") + link("rail", "오늘의 레일") + link("login", "로그인") + link("signup", "회원가입", "hang");
}

// 라우터: 주소의 # 뒤를 보고 화면을 바꿈 ex) #/cart -> 내 카트

const app = () => document.getElementById("app");
const NEED_LOGIN = ["cart", "hang", "friends"];

async function route() {
  const page = location.hash.split("/")[1] || "home";
  if (NEED_LOGIN.includes(page) && !state.me) {
    toast("로그인이 필요해요.", true);
    location.hash = "#/login";
    return;
  }
  renderNav();
  window.scrollTo(0, 0);
  if (page === "home") return renderHome();
  if (page === "cart") return renderCart();
  if (page === "hang") return renderHang();
  if (page === "friends") return renderFriends();
  if (page === "login" || page === "signup") return renderAuth(page);
  if (page === "ticket") {
    // #/ticket/5 -> 레일을 깔고 5번 티켓 상세를 바로 열어 줌 (티켓 링크 공유용)
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
    if (action === "pick-product") {
      e.preventDefault();
      return chooseProduct(el.dataset.cat);
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
        toast("나도 담았어요!");
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
      toast(el.dataset.status === "ACCEPTED" ? "친구가 됐어요!" : "요청을 거절했어요.");
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

// 데스크톱 드래그 앤 드롭. 모바일은 위 click 처리로 같은 흐름을 사용한다.
document.addEventListener("dragstart", (e) => {
  const product = e.target.closest?.(".product");
  if (!product) return;
  product.classList.add("dragging");
  e.dataTransfer.effectAllowed = "copy";
  e.dataTransfer.setData("text/plain", product.dataset.cat);
});
document.addEventListener("dragend", (e) => {
  e.target.closest?.(".product")?.classList.remove("dragging");
  document.getElementById("cart-drop")?.classList.remove("over");
});
document.addEventListener("dragover", (e) => {
  const drop = e.target.closest?.("#cart-drop");
  if (!drop) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
  drop.classList.add("over");
});
document.addEventListener("dragleave", (e) => {
  const drop = e.target.closest?.("#cart-drop");
  if (drop && !drop.contains(e.relatedTarget)) drop.classList.remove("over");
});
document.addEventListener("drop", (e) => {
  const drop = e.target.closest?.("#cart-drop");
  if (!drop) return;
  e.preventDefault();
  drop.classList.remove("over");
  chooseProduct(e.dataTransfer.getData("text/plain"));
});

// 오늘만 보기 체크박스, 사진 미리보기
document.addEventListener("change", (e) => {
  const action = e.target.dataset?.action;
  // 글쓰기 폼에서 코너(카테고리)를 바꾸면 제목/내용 예시도 그 카테고리 걸로
  const hangForm = e.target.closest?.('form[data-action="hang"]');
  if (hangForm && e.target.name === "category") {
    const example = CATEGORIES[e.target.value]?.example;
    if (example) {
      hangForm.elements.title.placeholder = example.title;
      hangForm.elements.content.placeholder = example.content;
    }
  }
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
      location.hash = state.selectedProduct ? "#/hang" : "#/home";
      return;
    }
    if (action === "hang") {
      const image = fd.get("image");
      if (image && !image.size) fd.delete("image"); // 사진 안 고르면 빈 파일이 들어감 -> 빼고 보냄
      const post = await api("/posts", { method: "POST", form: fd });
      toast(`영수증 ${ticketNo(post.ticket_no)}을 카트에 담았어요.`);
      state.selectedProduct = null;
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
  const page = location.hash.split("/")[1] || "home";
  if (page === "rail") loadFeed(true);
  if (page === "cart") renderCart();
}

// 시작

window.addEventListener("hashchange", route);
(async () => {
  await loadMe();
  document.getElementById("intro")?.addEventListener("animationend", (e) => {
    if (e.animationName === "intro-away") e.currentTarget.remove();
  });
  if (!location.hash) location.hash = "#/home";
  else route();
})();
