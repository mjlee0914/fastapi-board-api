# 프로젝트 컨텍스트: "오늘 뭐 담았어?" (사진 공유 커뮤니티 게시판 API)

> 이 문서는 VS Code의 Claude에게 프로젝트 상황을 전달하기 위한 문서입니다.
> 작업 전에 반드시 끝까지 읽고, 여기 정해진 결정을 따라 주세요.

---

## 0. 작업 방식 (중요)

- 나는 이 과제를 **단계별로 같이 만들면서 이해하고 싶다.** 한 번에 전체 코드를 쏟아내지 말고, 아래 "구현 단계" 순서대로 한 단계씩 진행한다.
- 각 단계마다: ① 무엇을 왜 만드는지 짧게 설명 → ② 코드 작성 → ③ 직접 실행/테스트하는 방법(Swagger 또는 curl) 안내 → ④ 내가 확인하면 다음 단계로.
- 설명은 한국어로, 핵심 개념(JWT, ORM 관계, 의존성 주입 등)은 처음 나올 때 쉽게 풀어서 설명한다.
- 단계가 끝날 때마다 git 커밋 메시지를 제안한다.

---

## 1. 과제 개요

**과제명:** 백엔드 아키텍처 & API 설계 (RESTful 게시판 API)

**필수 요구사항**

- RESTful 게시판 API (생성/조회/수정/삭제)
- PostgreSQL + SQLAlchemy(ORM)로 모든 데이터 관리
- JWT 인증·인가 (회원가입, 로그인, 작성자 검증 등 권한별 접근 제어)
- OpenAPI(Swagger UI) 문서화

**심화 요구사항**

- AWS EC2 배포 (접속 가능한 퍼블릭 IP/도메인 + Swagger 엔드포인트)
- 일관된 커스텀 에러 스키마, 비밀번호 해싱, 토큰 만료 처리
- Pydantic 데이터 검증 및 직렬화 표준화

**제출물**

- 개인 GitHub 저장소 URL
- EC2 배포 주소 + Swagger UI 주소 (`http://<IP>/docs`)

**채점 기준 (각 5점 만점) — 5점 포인트를 노린다**
| 항목 | 5점 조건 |
|---|---|
| RESTful 엔드포인트 | 완전 구현 + REST 원칙 준수 + OpenAPI 문서화 우수 |
| Pydantic 검증·직렬화 | 커스텀 검증 + 에러 스키마 표준화 |
| SQLAlchemy ORM | 모델·관계 정의 + CRUD + **관계 설계 / 쿼리 효율(N+1 방지)** |
| 인증·인가 | 가입·로그인·권한 + **해싱·토큰 만료 등 보안 모범 사례** |
| 서비스 구성·운영 | **비동기·업로드·캐싱·미들웨어·예외 처리** 적용 + 문서로 검증 |

---

## 2. 서비스 콘셉트

**"오늘 뭐 담았어?"** — 친구들끼리 "오늘 뭐 먹었어?", "고양이 자랑" 같은 일상을 사진으로 공유하는 커뮤니티. (BeReal / Locket 느낌 + 마트 장바구니 콘셉트)

- **사진 글 = 마트 상품.** 사진 찍어 올리면 스티커처럼 오려진 상품이 되어 카트에 담긴다.
- **카테고리 = 마트 코너.** 오늘 점심 / 고양이 자랑 / 오늘의 하늘 / 산 거 자랑 / 잡담 등.
- **피드(공개 벽) = 오늘의 전단지.** 비회원도 전체 공개 글은 구경 가능.
- **내 카트** = 로그인 후 내가 쓴 글 모아보기.
- **댓글 = 상품 리뷰**, **좋아요 = "나도 담기"**
- **친구 기능** + **공개 범위(전체 공개 / 친구만)**

---

## 3. 기술 스택

- Python 3.11+, **FastAPI**
- **SQLAlchemy 2.0 (async)** + **asyncpg** + **PostgreSQL**
- **Alembic** (마이그레이션)
- **Pydantic v2**, pydantic-settings (`.env` 관리)
- JWT: **PyJWT**, 비밀번호 해싱: **bcrypt** (passlib 대신 bcrypt 직접 또는 pwdlib)
- 이미지 업로드: `UploadFile` → 로컬 `uploads/` 디렉토리 저장 + 정적 파일 서빙 (추후 S3 확장 가능하게 저장 로직은 분리)
- 캐싱: 공개 피드 조회에 간단한 TTL 인메모리 캐시 (추후 Redis 교체 가능하게 인터페이스 분리)
- 미들웨어: CORS(FE 바이브코딩 대비), 요청 로깅 + 처리시간(`X-Process-Time`) 헤더
- 로컬 개발: Docker Compose로 PostgreSQL 실행
- 배포: AWS EC2 (Ubuntu) + Docker Compose (app + postgres) + Nginx 리버스 프록시
- 테스트: pytest + httpx (주요 권한 시나리오 위주)

---

## 4. 폴더 구조 (제안)

```
app/
  main.py              # FastAPI 앱, 라우터 등록, 미들웨어, 예외 핸들러
  core/
    config.py          # Settings (.env)
    security.py        # 해싱, JWT 생성/검증
    exceptions.py      # 커스텀 예외 클래스 + 핸들러
    cache.py           # TTL 캐시
  db/
    session.py         # async engine, get_db
    base.py
  models/              # SQLAlchemy 모델 (user, post, comment, like, friendship)
  schemas/             # Pydantic 요청/응답 스키마
  repositories/        # DB 쿼리 (선택)
  services/            # 비즈니스 로직 (권한 체크, 공개범위 판단)
  api/
    deps.py            # get_current_user, get_optional_user
    routes/            # auth, users, posts, comments, likes, friends
  storage/             # 이미지 저장 로직
alembic/
tests/
docker-compose.yml
Dockerfile
.env.example
README.md
```

---

## 5. 데이터 모델

### User

- id, email(unique), nickname(unique), hashed_password, profile_image_url(nullable), created_at

### Post (글 = 상품)

- id, author_id(FK → User), title, content, image_url(nullable)
- category: Enum (`LUNCH`, `CAT`, `SKY`, `HAUL`, `CHAT` …)
- visibility: Enum (`PUBLIC`, `FRIENDS`)
- created_at, updated_at
- 관계: author(N:1), comments(1:N, cascade delete), likes(1:N, cascade delete)

### Comment (리뷰)

- id, post_id(FK), author_id(FK), content, created_at

### Like (나도 담기)

- user_id(FK) + post_id(FK) **복합 PK** (중복 좋아요 방지)
- created_at

### Friendship (자기참조 N:M)

- id, requester_id(FK → User), addressee_id(FK → User)
- status: Enum (`PENDING`, `ACCEPTED`, `REJECTED`)
- created_at
- 같은 두 사람 사이 중복 요청 방지 (unique 제약), 자기 자신에게 요청 금지

**쿼리 효율:** 목록 조회 시 `selectinload`/`joinedload`로 작성자 정보 로딩, 좋아요 수·댓글 수는 서브쿼리/집계로 한 번에 가져와 N+1 방지.

---

## 6. 권한 규칙 (핵심 로직)

| 사용자      | 볼 수 있는 글                                                 |
| ----------- | ------------------------------------------------------------- |
| 비회원      | `PUBLIC` 글만                                                 |
| 로그인 회원 | `PUBLIC` 글 + **친구(ACCEPTED)** 의 `FRIENDS` 글 + 내 글 전부 |

- 글/댓글 **수정·삭제는 작성자 본인만** (아니면 403)
- 볼 권한 없는 `FRIENDS` 글에 접근 → **404** (존재 자체를 숨김)
- 볼 수 없는 글에는 댓글/좋아요도 불가
- 친구 요청 수락·거절은 **받은 사람(addressee)만**
- 토큰 없음/만료/위조 → 401

인증 의존성은 두 가지로 나눈다:

- `get_current_user` — 로그인 필수
- `get_optional_user` — 비회원 허용 (피드, 글 상세)

---

## 7. API 명세

| 기능                           | 메서드 · 경로                                           | 권한                         |
| ------------------------------ | ------------------------------------------------------- | ---------------------------- |
| 회원가입                       | `POST /auth/signup`                                     | 누구나                       |
| 로그인 (JWT 발급)              | `POST /auth/login`                                      | 누구나                       |
| 내 정보                        | `GET /users/me`                                         | 로그인                       |
| 내 카트 (내가 쓴 글)           | `GET /users/me/posts`                                   | 로그인                       |
| 피드                           | `GET /posts?category=&sort=latest\|popular&page=&size=` | 비회원 허용 (공개 범위 필터) |
| 글 상세                        | `GET /posts/{post_id}`                                  | 공개 범위에 따라             |
| 글 작성 (사진 포함, multipart) | `POST /posts`                                           | 로그인                       |
| 글 수정                        | `PATCH /posts/{post_id}`                                | 작성자만                     |
| 글 삭제                        | `DELETE /posts/{post_id}`                               | 작성자만                     |
| 댓글 목록                      | `GET /posts/{post_id}/comments`                         | 글을 볼 수 있는 사람         |
| 댓글 작성                      | `POST /posts/{post_id}/comments`                        | 로그인 + 글 열람 가능        |
| 댓글 삭제                      | `DELETE /comments/{comment_id}`                         | 댓글 작성자만                |
| 좋아요                         | `POST /posts/{post_id}/likes`                           | 로그인                       |
| 좋아요 취소                    | `DELETE /posts/{post_id}/likes`                         | 로그인                       |
| 친구 요청                      | `POST /friends/requests` (body: `addressee_id`)         | 로그인                       |
| 받은/보낸 요청 목록            | `GET /friends/requests?type=received\|sent`             | 로그인                       |
| 요청 수락·거절                 | `PATCH /friends/requests/{request_id}` (body: `status`) | 받은 사람만                  |
| 친구 목록                      | `GET /friends`                                          | 로그인                       |
| 친구 삭제                      | `DELETE /friends/{user_id}`                             | 로그인                       |

**REST 규칙**

- 생성 201, 삭제 204, 조회/수정 200
- 목록은 페이지네이션 응답 형태 통일: `{ "items": [...], "page": 1, "size": 20, "total": 123 }`
- 모든 엔드포인트에 `summary`, `description`, `response_model`, `responses`(에러 예시) 작성 → Swagger 품질 확보
- 라우터 `tags`로 Swagger 그룹화 (Auth / Users / Posts / Comments / Likes / Friends)

---

## 8. 에러 응답 표준 (모든 에러 동일 형태)

```json
{
  "error": {
    "code": "POST_NOT_FOUND",
    "message": "게시글을 찾을 수 없습니다.",
    "details": null
  }
}
```

- 커스텀 예외 베이스 클래스(`AppException(status_code, code, message)`) + 전역 핸들러
- Pydantic `RequestValidationError`도 같은 형태로 변환 (`code: "VALIDATION_ERROR"`, `details`에 필드별 오류)
- `HTTPException`, 예상치 못한 500 에러도 같은 형태로 (500은 내부 정보 노출 금지)
- 대표 코드: `UNAUTHORIZED`, `TOKEN_EXPIRED`, `FORBIDDEN`, `POST_NOT_FOUND`, `COMMENT_NOT_FOUND`, `EMAIL_ALREADY_EXISTS`, `ALREADY_LIKED`, `ALREADY_FRIENDS`, `FRIEND_REQUEST_EXISTS`, `CANNOT_FRIEND_SELF`, `INVALID_IMAGE`, `VALIDATION_ERROR`

**검증 규칙 예시**

- email 형식(EmailStr), 비밀번호 8자 이상 + 영문/숫자 포함 (커스텀 validator)
- nickname 2~20자
- 글 title 1~50자, content 1~1000자
- 이미지: jpg/png/webp만, 5MB 이하

---

## 9. 보안

- 비밀번호 bcrypt 해싱, 응답 스키마에 절대 노출 금지
- JWT access token 만료 시간 설정 (예: 60분), `exp` 검증, 만료 시 `TOKEN_EXPIRED`
- `SECRET_KEY` 등 비밀값은 `.env`로, `.env`는 `.gitignore`에 추가하고 `.env.example` 제공
- 업로드 파일명은 UUID로 재생성 (경로 조작 방지)

---

## 10. 구현 단계 (이 순서로 하나씩)

1. **프로젝트 세팅** — 가상환경, 패키지, 폴더 구조, docker-compose(Postgres), config, DB 연결 확인, `/health`
2. **모델 + Alembic** — User, Post, Comment, Like, Friendship + 첫 마이그레이션
3. **인증** — 회원가입, 로그인, JWT, 해싱, `get_current_user` / `get_optional_user`
4. **에러 스키마** — 커스텀 예외 + 전역 핸들러 (이후 단계에서 계속 사용)
5. **게시글 CRUD + 이미지 업로드** — 작성자 검증 포함
6. **댓글 + 좋아요**
7. **친구 기능 + 공개 범위 필터** — 피드/상세에 친구 공개 로직 적용
8. **미들웨어 + 캐싱 + 쿼리 최적화** — CORS, 로깅, 피드 캐시, N+1 점검
9. **테스트 + README** — 권한 시나리오 테스트, API 문서/실행법 정리
10. **GitHub push + EC2 배포** — EC2 생성부터 단계별 안내 필요 (AWS·GitHub 계정만 있는 상태)

---

## 11. 나중에 (지금은 구현하지 않음, 구조만 확장 가능하게)

- 실시간 알림 (SSE/WebSocket): "지우가 방금 점심을 담았어요"
- 체크아웃 영수증: 오늘 활동을 영수증으로 뽑아 저장·공유 (`Receipt` 모델)
- 팀/그룹 카트 (`Team`, `Post.team_id`)
- S3 이미지 저장, Redis 캐시

---

## 12. 프론트엔드 (백엔드 완성 후 바이브코딩 예정)

- 백엔드의 `/openapi.json`을 FE 생성 AI에게 제공해 API 연동
- **디자인 감성: B급 키치 콜라주**
  - 실사 상품/음식 사진을 흰 테두리 스티커로 오려 붙이고 살짝 기울이기
  - Receiptify 스타일 영수증 (고정폭 폰트, 점선, 바코드)
  - 별 모양(starburst) 가격 딱지, 초록 말풍선 라벨, 별 장식
  - 옛날 전단지 느낌의 굵은 한글 타이포 (Black Han Sans 등 견출고딕 계열, 흑백 반전 박스)
  - 타일/하늘/체크 패턴 배경 위에 요소를 겹겹이 콜라주
  - "GRAB!", "WHAT'S IN my CART?" 같은 카피
- 화면 흐름: 공개 벽(오늘의 전단지) → 내 카트 → (나중에) 계산대 체크아웃 "삑!" → 영수증 저장·공유
