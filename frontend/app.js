// What's in my cart? 프론트엔드 (빌드 없이 쓰는 순수 JS)
// 백엔드와 같은 주소에서 서빙됨 -> API 주소는 /posts 처럼 앞부분 없이 씀 (CORS 걱정 x)

// 상수

// icon: 홈 상품 그림을 작게 줄인 아이콘 (이모지 대신 같은 그림체로 통일)
// example: 글쓰기 화면의 제목/내용 예시 (카테고리마다 다르게)
// 한/영 두 가지씩 들고 있음 -> 지금 언어(state.lang)에 맞는 걸 꺼내 씀
const CATEGORIES = {
  LUNCH: {
    icon: "assets/icons/lunch.png",
    label: { ko: "오늘 점심", en: "Today's Lunch" },
    example: {
      ko: { title: "회사 앞 김치찌개 정식", content: "반찬이 여덟 개나 나왔다. 계란말이가 제일 맛있었음" },
      en: { title: "Kimchi stew set near the office", content: "Eight side dishes today. The rolled omelet was the best." },
    },
  },
  CAT: {
    icon: "assets/icons/cat.png",
    label: { ko: "고양이 자랑", en: "Cat Brag" },
    example: {
      ko: { title: "창가에서 낮잠 자는 치즈", content: "햇빛 자리를 또 뺏겼다. 오늘도 고양이 승" },
      en: { title: "Cheese napping by the window", content: "Lost the sunny spot again. The cat wins, as always." },
    },
  },
  SKY: {
    icon: "assets/icons/sky.png",
    label: { ko: "오늘의 하늘", en: "Today's Sky" },
    example: {
      ko: { title: "퇴근길 분홍 노을", content: "버스 기다리다 올려다봤는데 하늘이 솜사탕 색이었다" },
      en: { title: "Pink sunset on the way home", content: "Looked up at the bus stop and the sky was cotton-candy pink." },
    },
  },
  HAUL: {
    icon: "assets/icons/haul.png",
    label: { ko: "산 거 자랑", en: "My Haul" },
    example: {
      ko: { title: "드디어 산 머그컵", content: "3주 고민하다 결국 샀다. 커피가 두 배로 맛있는 기분" },
      en: { title: "Finally bought the mug", content: "Thought about it for three weeks. Coffee tastes twice as good now." },
    },
  },
  CHAT: {
    icon: "assets/icons/chat.png",
    label: { ko: "잡담", en: "Chit-chat" },
    example: {
      ko: { title: "엘리베이터에서 생긴 일", content: "처음 본 사람이랑 같은 노래를 흥얼거리고 있었다" },
      en: { title: "Something happened in the elevator", content: "A stranger and I were humming the same song." },
    },
  },
};

const catLabel = (key) => (CATEGORIES[key] ?? CATEGORIES.CHAT).label[state.lang];
const catExample = (key) => (CATEGORIES[key] ?? CATEGORIES.CHAT).example[state.lang];

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
  globe: ["M12 20.4c4.6 0 8.4-3.8 8.4-8.4S16.6 3.6 12 3.6 3.6 7.4 3.6 12s3.8 8.4 8.4 8.4z", "M3.9 9.4c5.3.6 10.9.6 16.2-.1", "M3.9 14.7c5.3-.6 10.9-.5 16.2.1", "M11.6 3.7c-3.1 4.9-3.1 11.8.2 16.6", "M12.4 3.7c3 4.9 3 11.8-.2 16.6"],
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
  LUNCH: { label: { ko: "도시락", en: "Lunch box" }, image: "assets/products/lunch.png" },
  CAT: { label: { ko: "고양이 캔", en: "Cat food can" }, image: "assets/products/cat.png" },
  SKY: { label: { ko: "구름 포장", en: "Bagged cloud" }, image: "assets/products/sky.png" },
  HAUL: { label: { ko: "쇼핑백", en: "Shopping bag" }, image: "assets/products/haul.png" },
  CHAT: { label: { ko: "탄산 캔", en: "Soda can" }, image: "assets/products/chat.png" },
};
const productLabel = (key) => (PRODUCTS[key] ?? PRODUCTS.CHAT).label[state.lang];

// 영어 모드 (i18n)
// 화면 문구는 전부 여기서 꺼내 씀: t("rail.sub") -> 지금 언어 문구
// {name} 처럼 중괄호 자리는 t("toast.welcome", { name: "지우" }) 로 채움
const I18N = {
  ko: {
    "meta.description": "사진 한 장을 카트에 담는 익명 커뮤니티",
    "nav.home": "담기", "nav.rail": "오늘의 레일", "nav.cart": "내 카트", "nav.friends": "친구",
    "nav.logout": "로그아웃", "nav.login": "로그인", "nav.signup": "회원가입", "nav.homeAria": "홈",
    "lang.switch": "EN", "lang.switchAria": "Switch to English",
    "home.title": "오늘 뭐 담았어?", "home.sub": "상품 하나를 골라 빈 카트에 담아 보세요.",
    "home.help": "컴퓨터에서는 드래그 · 휴대폰에서는 상품을 톡 눌러도 돼요",
    "home.rackAria": "글 카테고리 상품", "home.cartAria": "상품을 놓는 빈 카트", "home.cartAlt": "빈 빨간 장바구니",
    "home.productAria": "{product}을 카트에 담아 {cat} 글쓰기",
    "ticket.aria": "{title} 티켓 보기", "ticket.likes": "담기", "ticket.likesTitle": "나도 담기 수",
    "ticket.countsTitle": "조회수 · 댓글 수", "ticket.photoAlt": "{title} 사진",
    "who.mine": "내 티켓", "who.anon": "익명",
    "rail.sub": "티켓을 눌러서 구경해 보세요", "rail.all": "전체", "rail.latest": "최신순", "rail.popular": "인기순",
    "rail.today": "오늘 걸린 것만", "rail.loading": "티켓 가져오는 중...", "rail.empty": "레일이 비어 있어요",
    "rail.emptySub": "첫 티켓을 걸어 보세요!", "rail.hang": "티켓 걸기", "rail.more": "더 걸린 티켓 →",
    "common.loading": "불러오는 중...", "common.close": "닫기", "common.delete": "삭제", "common.edit": "수정",
    "common.save": "저장", "common.cancel": "취소", "common.none": "없어요",
    "detail.me": " (나)", "detail.commentPh": "리뷰 남기기 (익명)", "detail.commentAria": "댓글", "detail.commentBtn": "남기기",
    "detail.loginLink": "로그인", "detail.loginRest": "하면 리뷰를 남길 수 있어요.",
    "detail.postedAt": "걸린 시각", "detail.views": "조회수", "detail.likes": "나도 담기",
    "detail.liked": "담았어요", "detail.like": "나도 담기", "detail.noReviews": "아직 리뷰가 없어요.",
    "label.author": "글쓴이", "label.anon": "익명{n}",
    "edit.title": "티켓 고치기",
    "form.title": "제목", "form.content": "내용", "form.category": "코너 (카테고리)", "form.visibility": "공개 범위",
    "form.public": "전체 공개 (익명)", "form.friends": "친구만 (닉네임 공개)",
    "hang.sub": "고른 상품으로 오늘의 영수증을 만들어요", "hang.corner": "{cat} 코너",
    "hang.photo": "사진 (jpg · png · webp, 5MB 이하)", "hang.pick": "눌러서 사진 고르기",
    "hang.submit": "카트에 담기", "hang.previewAlt": "미리보기",
    "cart.loading": "카트 여는 중...", "cart.empty": "카트가 비어 있어요.", "cart.first": "첫 티켓 걸기",
    "friends.loading": "친구 목록 가져오는 중...", "friends.sub": "친구가 되면 서로의 \"친구만\" 티켓을 볼 수 있어요",
    "friends.ph": "친구 닉네임", "friends.request": "요청", "friends.received": "받은 요청", "friends.sent": "보낸 요청",
    "friends.mine": "내 친구", "friends.accept": "수락", "friends.reject": "거절", "friends.pending": "대기 중",
    "friends.noneYet": "아직 없어요",
    "auth.newSub": "가입하고 오늘의 티켓을 걸어 보세요", "auth.backSub": "로그인하고 친구 티켓까지 구경해 보세요",
    "auth.email": "이메일", "auth.password": "비밀번호", "auth.pwRule": " (8자 이상, 영문+숫자)",
    "auth.nickname": "닉네임 (2~20자)", "auth.signupBtn": "가입하기", "auth.loginBtn": "로그인",
    "auth.haveAccount": "이미 회원이에요 →", "auth.newHere": "처음이에요 →",
    "toast.needLogin": "로그인이 필요해요.", "toast.loggedOut": "로그아웃했어요.",
    "toast.expired": "로그인이 만료됐어요. 다시 로그인해 주세요.", "toast.loginToLike": "로그인하면 담을 수 있어요.",
    "toast.unliked": "담기를 취소했어요.", "toast.liked": "나도 담았어요!", "toast.postDeleted": "티켓을 내렸어요.",
    "toast.accepted": "친구가 됐어요!", "toast.rejected": "요청을 거절했어요.", "toast.unfriended": "친구를 삭제했어요.",
    "toast.welcome": "어서 오세요, {name}님!", "toast.hung": "영수증 {no}을 카트에 담았어요.",
    "toast.edited": "티켓을 고쳤어요.", "toast.requested": "{name}님에게 친구 요청을 보냈어요.",
    "confirm.deleteComment": "이 리뷰를 지울까요?",
    "confirm.deletePost": "티켓을 레일에서 내릴까요? 리뷰와 담기도 같이 지워져요.",
    "confirm.unfriend": "{name}님과 친구를 끊을까요?",
    "error.generic": "요청을 처리하지 못했어요.",
  },
  en: {
    "meta.description": "An anonymous community where you put one photo in your cart",
    "nav.home": "Pick", "nav.rail": "Today's Rail", "nav.cart": "My Cart", "nav.friends": "Friends",
    "nav.logout": "Log out", "nav.login": "Log in", "nav.signup": "Sign up", "nav.homeAria": "Home",
    "lang.switch": "한국어", "lang.switchAria": "한국어로 보기",
    "home.title": "What's in your cart?", "home.sub": "Pick one item and drop it into the empty cart.",
    "home.help": "Drag on desktop · tap an item on mobile",
    "home.rackAria": "Category items", "home.cartAria": "Empty cart to drop items into", "home.cartAlt": "Empty red shopping basket",
    "home.productAria": "Put the {product} in the cart to write a {cat} post",
    "ticket.aria": "View ticket: {title}", "ticket.likes": "grabs", "ticket.likesTitle": "Grab count",
    "ticket.countsTitle": "Views · Comments", "ticket.photoAlt": "Photo: {title}",
    "who.mine": "My ticket", "who.anon": "Anonymous",
    "rail.sub": "Tap a ticket to take a look", "rail.all": "All", "rail.latest": "Latest", "rail.popular": "Popular",
    "rail.today": "Today only", "rail.loading": "Loading tickets...", "rail.empty": "The rail is empty",
    "rail.emptySub": "Hang the first ticket!", "rail.hang": "Hang a ticket", "rail.more": "More tickets →",
    "common.loading": "Loading...", "common.close": "Close", "common.delete": "Delete", "common.edit": "Edit",
    "common.save": "Save", "common.cancel": "Cancel", "common.none": "None",
    "detail.me": " (me)", "detail.commentPh": "Leave a review (anonymous)", "detail.commentAria": "Comment", "detail.commentBtn": "Post",
    "detail.loginLink": "Log in", "detail.loginRest": " to leave a review.",
    "detail.postedAt": "Posted", "detail.views": "Views", "detail.likes": "Grabs",
    "detail.liked": "Grabbed", "detail.like": "Grab too", "detail.noReviews": "No reviews yet.",
    "label.author": "Author", "label.anon": "Anon {n}",
    "edit.title": "Edit ticket",
    "form.title": "Title", "form.content": "Content", "form.category": "Corner (category)", "form.visibility": "Visibility",
    "form.public": "Public (anonymous)", "form.friends": "Friends only (nickname shown)",
    "hang.sub": "Make today's receipt with the item you picked", "hang.corner": "{cat} corner",
    "hang.photo": "Photo (jpg · png · webp, up to 5MB)", "hang.pick": "Tap to choose a photo",
    "hang.submit": "Add to cart", "hang.previewAlt": "Preview",
    "cart.loading": "Opening your cart...", "cart.empty": "Your cart is empty.", "cart.first": "Hang your first ticket",
    "friends.loading": "Loading friends...", "friends.sub": "Friends can see each other's \"friends only\" tickets",
    "friends.ph": "Friend's nickname", "friends.request": "Request", "friends.received": "Received", "friends.sent": "Sent",
    "friends.mine": "My friends", "friends.accept": "Accept", "friends.reject": "Decline", "friends.pending": "Pending",
    "friends.noneYet": "None yet",
    "auth.newSub": "Sign up and hang today's ticket", "auth.backSub": "Log in to see your friends' tickets too",
    "auth.email": "Email", "auth.password": "Password", "auth.pwRule": " (8+ chars, letters & numbers)",
    "auth.nickname": "Nickname (2–20 chars)", "auth.signupBtn": "Sign up", "auth.loginBtn": "Log in",
    "auth.haveAccount": "Already a member →", "auth.newHere": "New here →",
    "toast.needLogin": "Please log in first.", "toast.loggedOut": "Logged out.",
    "toast.expired": "Your session expired. Please log in again.", "toast.loginToLike": "Log in to grab this.",
    "toast.unliked": "Removed from your grabs.", "toast.liked": "Grabbed!", "toast.postDeleted": "Ticket removed.",
    "toast.accepted": "You're friends now!", "toast.rejected": "Request declined.", "toast.unfriended": "Friend removed.",
    "toast.welcome": "Welcome, {name}!", "toast.hung": "Receipt {no} added to your cart.",
    "toast.edited": "Ticket updated.", "toast.requested": "Friend request sent to {name}.",
    "confirm.deleteComment": "Delete this review?",
    "confirm.deletePost": "Take this ticket off the rail? Its reviews and grabs will be deleted too.",
    "confirm.unfriend": "Unfriend {name}?",
    "error.generic": "Something went wrong.",
  },
};

// 영어 모드에서 서버 에러: 서버는 한국어 메시지를 주지만 code는 항상 같음 -> code로 영어 문장 찾기
const ERROR_EN = {
  UNAUTHORIZED: "Please log in.",
  TOKEN_EXPIRED: "Your session expired. Please log in again.",
  INVALID_CREDENTIALS: "Wrong email or password.",
  FORBIDDEN: "You don't have permission to do that.",
  POST_NOT_FOUND: "Ticket not found.",
  COMMENT_NOT_FOUND: "Review not found.",
  USER_NOT_FOUND: "User not found.",
  LIKE_NOT_FOUND: "You haven't grabbed this ticket.",
  FRIEND_REQUEST_NOT_FOUND: "Friend request not found.",
  NOT_FRIENDS: "You're not friends.",
  EMAIL_ALREADY_EXISTS: "This email is already registered.",
  NICKNAME_ALREADY_EXISTS: "This nickname is already taken.",
  ALREADY_LIKED: "You already grabbed this.",
  ALREADY_FRIENDS: "You're already friends.",
  FRIEND_REQUEST_EXISTS: "A friend request already exists.",
  CANNOT_FRIEND_SELF: "You can't add yourself as a friend.",
  FRIEND_REQUEST_ALREADY_HANDLED: "This request was already handled.",
  INVALID_IMAGE: "Only jpg, png, or webp images up to 5MB.",
  VALIDATION_ERROR: "Please check your input.",
  NOT_FOUND: "Not found.",
  INTERNAL_SERVER_ERROR: "Server error. Please try again.",
};
// 입력값 검증(422)의 우리 커스텀 메시지 영어판 (Pydantic 기본 메시지는 원래 영어라 그대로 둠)
const VALIDATION_EN = {
  "비밀번호는 영문과 숫자를 모두 포함해야 합니다.": "Password must include both letters and numbers.",
  "닉네임은 공백을 빼고 2자 이상이어야 합니다.": "Nickname must be at least 2 characters (excluding spaces).",
  "공백만 입력할 수 없습니다.": "Can't be only spaces.",
  "수정할 값을 하나 이상 보내 주세요.": "Send at least one field to update.",
};
const PAGE_SIZE = 12;

// 상태: 토큰(로그인), 내 정보
const state = {
  // 저장해 둔 언어가 없으면 브라우저 언어로: 한국어가 아니면 영어
  lang: safeGet("lang") || ((navigator.language || "").toLowerCase().startsWith("ko") ? "ko" : "en"),
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

function t(key, vars = {}) {
  const text = I18N[state.lang]?.[key] ?? I18N.ko[key] ?? key; // 영어에 없으면 한국어로
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

// 서버가 한국어로 주는 익명 라벨("글쓴이", "익명1")을 지금 언어로
function authorLabel(label) {
  if (label === "글쓴이") return t("label.author");
  const m = /^익명(\d*)$/.exec(label);
  return m ? t("label.anon", { n: m[1] }).trim() : label;
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
  return d.toLocaleString(state.lang === "ko" ? "ko-KR" : "en-US", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
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
    const err = data?.error ?? { code: `HTTP_${res.status}`, message: t("error.generic") };
    let message = err.message;
    if (state.lang === "en") message = ERROR_EN[err.code] ?? t("error.generic"); // 영어 모드: code로 영어 문장
    if (err.code === "VALIDATION_ERROR" && Array.isArray(err.details) && err.details.length) {
      const msg = (m) => (state.lang === "en" ? VALIDATION_EN[m] ?? m : m);
      message = err.details.map((d) => `${d.field}: ${msg(d.message)}`).join(" / ");
    }
    // 토큰 만료/위조 -> 로그아웃 처리하고 로그인 화면으로
    if ((err.code === "TOKEN_EXPIRED" || err.code === "UNAUTHORIZED") && state.token) {
      logout(false);
      toast(err.code === "TOKEN_EXPIRED" ? t("toast.expired") : message, true);
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
  if (showToast) toast(t("toast.loggedOut"));
}

// 공통 조각

function clipHtml(extra = "") {
  return `<span class="clip ${extra}" aria-hidden="true">${CLIP_SVG}</span>`;
}

function photoHtml(p, cls = "sticker") {
  if (p.image_url) {
    return `<img class="${cls}" src="${esc(p.image_url)}" alt="${esc(t("ticket.photoAlt", { title: p.title }))}" loading="lazy" />`;
  }
  const product = PRODUCTS[p.category] ?? PRODUCTS.CHAT;
  return `<div class="${cls} placeholder" aria-hidden="true"><img src="${product.image}" alt="" /></div>`;
}

function whoHtml(p) {
  // 익명성: PUBLIC 글은 author가 null -> 익명
  if (p.is_mine) return `<span class="who">${doodle("cart")}${t("who.mine")}</span>`;
  if (p.author) return `<span class="who">${doodle("friends")}${esc(p.author.nickname)}</span>`;
  return `<span class="who">${doodle("lock")}${t("who.anon")}</span>`;
}

// 담기 수 = 사진 모서리에 붙은 하트 스티커. 내가 담았으면 빨갛게 채워짐
const HEART_PATH = "M20 34.6C11.8 29 5.4 23.6 5.6 16.4c.1-4.5 3.6-7.9 7.8-7.8 3 .1 5.3 1.9 6.5 4.4 1.4-2.6 3.8-4.6 6.9-4.5 4.3.1 7.6 3.7 7.3 8.3-.4 6.9-6.7 12.2-14.1 17.8z";
function heartHtml(p) {
  return `<span class="heart-badge ${p.liked_by_me ? "on" : ""}" title="${t("ticket.likesTitle")}">
    <svg viewBox="0 0 40 40" aria-hidden="true"><path d="${HEART_PATH}"/></svg>
    <b>${p.like_count}</b>
  </span>`;
}

function ticketHtml(p) {
  return `
    <article class="ticket" style="--tilt:${tilt(p.id)}" data-action="open-ticket" data-id="${p.id}" tabindex="0"
      aria-label="${esc(t("ticket.aria", { title: p.title }))}">
      ${clipHtml()}
      <div class="receipt">
        <div class="ticket-no">TODAY'S TICKET ${ticketNo(p.ticket_no)}</div>
        <hr class="dash" />
        <div class="photo-wrap">
          ${photoHtml(p)}
          ${heartHtml(p)}
        </div>
        <span class="bubble">${catIcon(p.category)}${catLabel(p.category)}</span>
        <div class="ticket-title">${esc(p.title)}</div>
        <hr class="dash" />
        <div class="meta">
          ${whoHtml(p)}
          <span class="counts" title="${t("ticket.countsTitle")}">${doodle("eye")}${p.pull_count}${doodle("comment")}${p.comment_count}</span>
        </div>
      </div>
    </article>`;
}

// 화면: 빈 카트에 상품을 담아 글쓰기 시작

function productHtml([category, product]) {
  return `<button class="product" draggable="true" data-action="pick-product" data-cat="${category}"
    aria-label="${t("home.productAria", { product: productLabel(category), cat: catLabel(category) })}">
    <img src="${product.image}" alt="" draggable="false" />
    <span>${productLabel(category)}</span>
  </button>`;
}

function renderHome() {
  app().innerHTML = `
    <section class="cart-studio">
      <div class="studio-copy">
        <h1>${t("home.title")}</h1>
        <p>${t("home.sub")}</p>
      </div>
      <div class="studio-layout">
        <div class="product-rack" aria-label="${t("home.rackAria")}">
          ${Object.entries(PRODUCTS).map(productHtml).join("")}
        </div>
        <div class="cart-drop" id="cart-drop" data-action="cart-drop" aria-label="${t("home.cartAria")}">
          <img class="empty-cart" src="assets/empty-cart.png" alt="${t("home.cartAlt")}" />
        </div>
      </div>
      <p class="studio-help">${t("home.help")}</p>
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
  const chips = [`<button class="chip ${f.category ? "" : "on"}" data-action="filter" data-cat=""><img class="cat-icon" src="assets/icons/cart.png" alt="" aria-hidden="true" />${t("rail.all")}</button>`]
    .concat(
      Object.entries(CATEGORIES).map(
        ([key]) =>
          `<button class="chip ${f.category === key ? "on" : ""}" data-action="filter" data-cat="${key}">${catIcon(key)}${catLabel(key)}</button>`
      )
    )
    .join("");

  app().innerHTML = `
    <section>
      <p class="flyer-sub">${t("rail.sub")}</p>
      <div class="toolbar">
        ${chips}
        <button class="chip ${f.sort === "popular" ? "on" : ""}" data-action="sort">${f.sort === "popular" ? doodle("popular") + t("rail.popular") : doodle("latest") + t("rail.latest")}</button>
        <label class="toggle"><input type="checkbox" data-action="today" ${f.today ? "checked" : ""}/><span class="box" aria-hidden="true"></span><span class="toggle-text">${t("rail.today")}</span></label>
      </div>
      <div class="rail-wrap">
        <div class="rail" aria-hidden="true"></div>
        <div class="rail-track" id="track"><p class="loading">${t("rail.loading")}</p></div>
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
        <b>${t("rail.empty")}</b>
        <p class="muted">${t("rail.emptySub")}</p>
        <a class="btn red" href="#/home">${doodle("plus")}${t("rail.hang")}</a>
      </div>`;
    return;
  }
  const more = f.items.length < f.total ? `<button class="btn yellow more-btn" data-action="more">${t("rail.more")}</button>` : "";
  track.innerHTML = f.items.map(ticketHtml).join("") + more;
}

// 화면: 티켓 상세 (모달)

// 지금 열려 있는 티켓. 담기/리뷰 후에 상세를 다시 GET 하면 pull_count가 또 올라감
// -> 한 번 연 티켓은 여기 들고 있다가 화면만 다시 그림
const detail = { post: null, comments: null };

async function openTicket(id) {
  const body = document.getElementById("modal-body");
  document.getElementById("modal").hidden = false;
  body.innerHTML = `<p class="loading">${t("common.loading")}</p>`;
  try {
    const [post, comments] = await Promise.all([api(`/posts/${id}`), api(`/posts/${id}/comments?size=100`)]);
    detail.post = post;
    detail.comments = comments;
    renderTicketDetail();
  } catch (e) {
    body.innerHTML = `<div class="sheet center">${clipHtml("sheet-clip")}<p>${esc(e.message)}</p>
      <button class="btn" data-action="close-modal">${t("common.close")}</button></div>`;
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
  const lines = comments.items
    .map(
      (cm) => `
      <li>
        <div class="c-head">
          <span class="c-who ${cm.author_label === "글쓴이" ? "op" : ""}">${esc(authorLabel(cm.author_label))}${cm.is_mine ? t("detail.me") : ""}</span>
          <span class="muted">${timeText(cm.created_at)}
            ${cm.is_mine ? `<button class="btn small" data-action="delete-comment" data-id="${cm.id}">${t("common.delete")}</button>` : ""}
          </span>
        </div>
        <div class="c-body">${esc(cm.content)}</div>
      </li>`
    )
    .join("");

  const commentForm = state.me
    ? `<form class="comment-form" data-action="comment">
         <input name="content" maxlength="500" placeholder="${t("detail.commentPh")}" required aria-label="${t("detail.commentAria")}" />
         <button class="btn red">${t("detail.commentBtn")}</button>
       </form>`
    : `<p class="muted center"><a href="#/login" data-action="close-modal">${t("detail.loginLink")}</a>${t("detail.loginRest")}</p>`;

  const owner = p.is_mine
    ? `<button class="btn small" data-action="edit-post">${t("common.edit")}</button>
       <button class="btn small" data-action="delete-post" data-id="${p.id}">${t("common.delete")}</button>`
    : "";

  document.getElementById("modal-body").innerHTML = `
    <div class="sheet" id="detail">
      ${clipHtml("sheet-clip")}
      <button class="close-x" data-action="close-modal" aria-label="${t("common.close")}">${doodle("close")}</button>
      <div class="ticket-no">TODAY'S TICKET ${ticketNo(p.ticket_no)}</div>
      <hr class="dash" />
      ${photoHtml(p, "sticker detail-photo")}
      <span class="bubble">${catIcon(p.category)}${catLabel(p.category)}</span>
      <h1 style="text-align:left;margin-top:8px">${esc(p.title)}</h1>
      <div class="line">${whoHtml(p)} <span class="lock">${p.visibility === "FRIENDS" ? doodle("friends") + "FRIENDS" : doodle("lock") + "PUBLIC"}</span></div>
      <hr class="dash" />
      <p class="detail-content">${esc(p.content)}</p>
      <hr class="dash" />
      <div class="line"><span>${t("detail.postedAt")}</span><b>${timeText(p.created_at)}</b></div>
      <div class="line"><span>${t("detail.views")}</span><b>${doodle("eye")}${p.pull_count}</b></div>
      <div class="line"><span>${t("detail.likes")}</span><b>${p.like_count}</b></div>
      <div class="actions">
        <button class="btn like-btn ${p.liked_by_me ? "on" : ""}" data-action="like">
          ${p.liked_by_me ? doodle("check") + t("detail.liked") : doodle("plus") + t("detail.like")}
        </button>
        ${owner}
      </div>
      <hr class="dash" />
      <h2>REVIEWS (${comments.total})</h2>
      <ul class="comments">${lines || `<li class="muted">${t("detail.noReviews")}</li>`}</ul>
      ${commentForm}
      <div class="barcode" aria-hidden="true"></div>
      <div class="thanks">THANKS FOR SHARING YOUR DAY</div>
    </div>`;
}

function renderEditForm(p) {
  document.getElementById("detail").innerHTML = `
    ${clipHtml("sheet-clip")}
    <h1>${t("edit.title")}</h1>
    <form data-action="save-edit">
      <label class="field">${t("form.title")}<input name="title" maxlength="50" value="${esc(p.title)}" required /></label>
      <label class="field">${t("form.content")}<textarea name="content" maxlength="1000" required>${esc(p.content)}</textarea></label>
      ${categoryPicker(p.category)}
      ${visibilityPicker(p.visibility)}
      <div class="actions">
        <button class="btn red">${t("common.save")}</button>
        <button type="button" class="btn" data-action="back-detail">${t("common.cancel")}</button>
      </div>
    </form>`;
}

// 화면: 티켓 걸기 (글쓰기)

function categoryPicker(selected = "LUNCH") {
  return `<div class="field">${t("form.category")}<div class="pick">
    ${Object.entries(CATEGORIES)
      .map(
        ([key]) =>
          `<label><input type="radio" name="category" value="${key}" ${key === selected ? "checked" : ""}/><span>${catIcon(key)}${catLabel(key)}</span></label>`
      )
      .join("")}
  </div></div>`;
}

function visibilityPicker(selected = "PUBLIC") {
  return `<div class="field">${t("form.visibility")}<div class="pick">
    <label><input type="radio" name="visibility" value="PUBLIC" ${selected === "PUBLIC" ? "checked" : ""}/><span>${doodle("lock")}${t("form.public")}</span></label>
    <label><input type="radio" name="visibility" value="FRIENDS" ${selected === "FRIENDS" ? "checked" : ""}/><span>${doodle("friends")}${t("form.friends")}</span></label>
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
      <p class="center muted">${t("hang.sub")}</p>
      <hr class="dash" />
      <div class="selected-product-line">
        <img src="${product.image}" alt="" />
        <span><b>${productLabel(selected)}</b><br />${t("hang.corner", { cat: catLabel(selected) })}</span>
      </div>
      <form data-action="hang">
        <div class="field">${t("hang.photo")}
          <label class="photo-drop" id="drop">
            <span id="drop-text">${doodle("camera", "doodle big")}<br />${t("hang.pick")}</span>
            <input type="file" name="image" accept="image/jpeg,image/png,image/webp" hidden data-action="preview" />
          </label>
        </div>
        <label class="field">${t("form.title")}<input name="title" maxlength="50" placeholder="${esc(catExample(selected).title)}" required /></label>
        <label class="field">${t("form.content")}<textarea name="content" maxlength="1000" placeholder="${esc(catExample(selected).content)}" required></textarea></label>
        ${categoryPicker(selected)}
        ${visibilityPicker()}
        <hr class="dash" />
        <button class="grab">${t("hang.submit")}</button>
      </form>
      <div class="barcode" aria-hidden="true"></div>
    </div>`;
}

// 화면: 내 카트

async function renderCart() {
  app().innerHTML = `<p class="loading">${t("cart.loading")}</p>`;
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
        ${data.items.length ? data.items.map(ticketHtml).join("") : `<div class="empty-rail">${t("cart.empty")} <a href="#/home">${t("cart.first")}</a></div>`}
      </div>
    </section>`;
}

// 화면: 친구

async function renderFriends() {
  app().innerHTML = `<p class="loading">${t("friends.loading")}</p>`;
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
      <p class="center muted">${t("friends.sub")}</p>
      <hr class="dash" />
      <form class="comment-form" data-action="friend-request">
        <input name="nickname" minlength="2" maxlength="20" placeholder="${t("friends.ph")}" required aria-label="${t("friends.ph")}" />
        <button class="btn red">${t("friends.request")}</button>
      </form>

      <h2>${t("friends.received")} (${received.total})</h2>
      <ul class="list">
        ${received.items.map((r) => row(`<span>${doodle("inbox")}${esc(r.nickname)}</span>
          <span><button class="btn small yellow" data-action="respond" data-id="${r.id}" data-status="ACCEPTED">${t("friends.accept")}</button>
          <button class="btn small" data-action="respond" data-id="${r.id}" data-status="REJECTED">${t("friends.reject")}</button></span>`)).join("") || `<li class="muted">${t("common.none")}</li>`}
      </ul>

      <h2>${t("friends.sent")} (${sent.total})</h2>
      <ul class="list">
        ${sent.items.map((r) => row(`<span>${doodle("send")}${esc(r.nickname)}</span><span class="muted">${t("friends.pending")}</span>`)).join("") || `<li class="muted">${t("common.none")}</li>`}
      </ul>

      <h2>${t("friends.mine")} (${friends.total})</h2>
      <ul class="list">
        ${friends.items.map((f) => row(`<span>${doodle("friends")}${esc(f.nickname)}</span>
          <button class="btn small" data-action="unfriend" data-nickname="${esc(f.nickname)}">${t("common.delete")}</button>`)).join("") || `<li class="muted">${t("friends.noneYet")}</li>`}
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
      <p class="center muted">${isSignup ? t("auth.newSub") : t("auth.backSub")}</p>
      <hr class="dash" />
      <form data-action="${mode}">
        <label class="field">${t("auth.email")}<input type="email" name="email" autocomplete="email" required /></label>
        <label class="field">${t("auth.password")}${isSignup ? t("auth.pwRule") : ""}
          <input type="password" name="password" autocomplete="${isSignup ? "new-password" : "current-password"}" required ${isSignup ? 'minlength="8"' : ""}/></label>
        ${isSignup ? `<label class="field">${t("auth.nickname")}<input name="nickname" minlength="2" maxlength="20" required /></label>` : ""}
        <button class="grab">${isSignup ? t("auth.signupBtn") : t("auth.loginBtn")}</button>
      </form>
      <p class="center muted" style="margin-top:14px">
        ${isSignup ? `${t("auth.haveAccount")} <a href="#/login">${t("nav.login")}</a>` : `${t("auth.newHere")} <a href="#/signup">${t("nav.signup")}</a>`}
      </p>
      <div class="barcode" aria-hidden="true"></div>
    </div>`;
}

// 상단 메뉴

function renderNav() {
  const route = location.hash.split("/")[1] || "home";
  const link = (r, text, cls = "") => `<a href="#/${r}" class="${cls} ${route === r ? "active" : ""}">${text}</a>`;
  const langBtn = `<button class="lang-btn" data-action="lang" aria-label="${t("lang.switchAria")}">${doodle("globe")}${t("lang.switch")}</button>`;
  document.getElementById("nav").innerHTML =
    (state.me
      ? link("home", t("nav.home")) +
        link("rail", t("nav.rail")) +
        link("cart", t("nav.cart")) +
        link("friends", t("nav.friends")) +
        `<button data-action="logout">${t("nav.logout")}</button>`
      : link("home", t("nav.home")) + link("rail", t("nav.rail")) + link("login", t("nav.login")) + link("signup", t("nav.signup"), "hang")) +
    langBtn;
}

// 언어가 바뀌면 HTML에 박혀 있는 문구(lang 속성, 설명, 로고 라벨)도 같이 바꿈
function applyLang() {
  document.documentElement.lang = state.lang;
  document.querySelector('meta[name="description"]')?.setAttribute("content", t("meta.description"));
  document.querySelector(".logo")?.setAttribute("aria-label", t("nav.homeAria"));
}

// 라우터: 주소의 # 뒤를 보고 화면을 바꿈 ex) #/cart -> 내 카트

const app = () => document.getElementById("app");
const NEED_LOGIN = ["cart", "hang", "friends"];

async function route() {
  const page = location.hash.split("/")[1] || "home";
  if (NEED_LOGIN.includes(page) && !state.me) {
    toast(t("toast.needLogin"), true);
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
    if (action === "lang") {
      // 언어 바꾸고 저장 -> 지금 화면을 새 언어로 다시 그림 (열려 있는 상세도 같이)
      state.lang = state.lang === "ko" ? "en" : "ko";
      safeSet("lang", state.lang);
      applyLang();
      await route();
      if (!document.getElementById("modal").hidden && detail.post) renderTicketDetail();
      return;
    }
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
      if (!state.me) return toast(t("toast.loginToLike"), true);
      const p = detail.post;
      if (p.liked_by_me) {
        await api(`/posts/${p.id}/likes`, { method: "DELETE" });
        p.liked_by_me = false;
        p.like_count -= 1;
        toast(t("toast.unliked"));
      } else {
        const r = await api(`/posts/${p.id}/likes`, { method: "POST" });
        p.liked_by_me = true;
        p.like_count = r.like_count; // 서버가 알려 준 최신 담기 수
        toast(t("toast.liked"));
      }
      renderTicketDetail();
      return refreshAfterChange();
    }
    if (action === "delete-comment") {
      if (!confirm(t("confirm.deleteComment"))) return;
      await api(`/comments/${id}`, { method: "DELETE" });
      await reloadComments();
      return refreshAfterChange();
    }
    if (action === "edit-post") return renderEditForm(detail.post);
    if (action === "back-detail") return renderTicketDetail();
    if (action === "delete-post") {
      if (!confirm(t("confirm.deletePost"))) return;
      await api(`/posts/${id}`, { method: "DELETE" });
      toast(t("toast.postDeleted"));
      closeModal();
      return route();
    }
    if (action === "respond") {
      await api(`/friends/requests/${id}`, { method: "PATCH", json: { status: el.dataset.status } });
      toast(el.dataset.status === "ACCEPTED" ? t("toast.accepted") : t("toast.rejected"));
      return renderFriends();
    }
    if (action === "unfriend") {
      if (!confirm(t("confirm.unfriend", { name: el.dataset.nickname }))) return;
      await api(`/friends/${encodeURIComponent(el.dataset.nickname)}`, { method: "DELETE" });
      toast(t("toast.unfriended"));
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
    const example = CATEGORIES[e.target.value] && catExample(e.target.value);
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
    img.alt = t("hang.previewAlt");
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
      toast(t("toast.welcome", { name: state.me.nickname }));
      location.hash = state.selectedProduct ? "#/hang" : "#/home";
      return;
    }
    if (action === "hang") {
      const image = fd.get("image");
      if (image && !image.size) fd.delete("image"); // 사진 안 고르면 빈 파일이 들어감 -> 빼고 보냄
      const post = await api("/posts", { method: "POST", form: fd });
      toast(t("toast.hung", { no: ticketNo(post.ticket_no) }));
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
      toast(t("toast.edited"));
      renderTicketDetail();
      return refreshAfterChange();
    }
    if (action === "friend-request") {
      const r = await api("/friends/requests", { method: "POST", json: { nickname: fd.get("nickname").trim() } });
      toast(t("toast.requested", { name: r.nickname }));
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
  applyLang();
  await loadMe();
  document.getElementById("intro")?.addEventListener("animationend", (e) => {
    if (e.animationName === "intro-away") e.currentTarget.remove();
  });
  if (!location.hash) location.hash = "#/home";
  else route();
})();
