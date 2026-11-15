-- ERDCloud import용 DDL ("What's in my cart?" 게시판 API)
-- 실제 스키마는 app/models/ + Alembic 마이그레이션이 기준입니다.
-- ERDCloud 호환을 위해 단순화한 부분:
--   * Enum 타입 → VARCHAR (허용 값은 COMMENT에 표기)
--   * friendships의 (LEAST, GREATEST) 함수 기반 unique 인덱스 → COMMENT로만 표기

CREATE TABLE users (
    id                BIGINT       NOT NULL AUTO_INCREMENT COMMENT '사용자 ID',
    email             VARCHAR(255) NOT NULL COMMENT '이메일 (unique)',
    nickname          VARCHAR(20)  NOT NULL COMMENT '닉네임 (unique, 2~20자)',
    hashed_password   VARCHAR(255) NOT NULL COMMENT 'bcrypt 해시',
    profile_image_url VARCHAR(500) NULL     COMMENT '프로필 이미지 URL',
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '가입 시각',
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_nickname (nickname)
) COMMENT = '사용자';

CREATE TABLE posts (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '글(상품/티켓) ID',
    author_id   BIGINT       NOT NULL COMMENT '작성자 ID',
    title       VARCHAR(50)  NOT NULL COMMENT '제목 (1~50자)',
    content     TEXT         NOT NULL COMMENT '내용 (1~1000자)',
    image_url   VARCHAR(500) NULL     COMMENT '사진 URL',
    category    VARCHAR(10)  NOT NULL COMMENT 'LUNCH | CAT | SKY | HAUL | CHAT',
    visibility  VARCHAR(10)  NOT NULL DEFAULT 'PUBLIC' COMMENT 'PUBLIC | FRIENDS',
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성 시각',
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정 시각',
    PRIMARY KEY (id),
    KEY ix_posts_author_id (author_id),
    KEY ix_posts_category (category),
    KEY ix_posts_visibility (visibility),
    KEY ix_posts_created_at (created_at),
    CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
) COMMENT = '글 (= 마트 상품 / 주문 티켓)';

CREATE TABLE comments (
    id          BIGINT    NOT NULL AUTO_INCREMENT COMMENT '댓글 ID',
    post_id     BIGINT    NOT NULL COMMENT '글 ID',
    author_id   BIGINT    NOT NULL COMMENT '작성자 ID',
    content     TEXT      NOT NULL COMMENT '내용',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성 시각',
    PRIMARY KEY (id),
    KEY ix_comments_post_id (post_id),
    KEY ix_comments_author_id (author_id),
    CONSTRAINT fk_comments_post   FOREIGN KEY (post_id)   REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
) COMMENT = '댓글 (= 상품 리뷰)';

CREATE TABLE likes (
    user_id     BIGINT    NOT NULL COMMENT '좋아요 누른 사용자 ID',
    post_id     BIGINT    NOT NULL COMMENT '글 ID',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '누른 시각',
    PRIMARY KEY (user_id, post_id),
    KEY ix_likes_post_id (post_id),
    CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_likes_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
) COMMENT = '좋아요 (= 나도 담기). 복합 PK로 중복 방지';

CREATE TABLE friendships (
    id            BIGINT      NOT NULL AUTO_INCREMENT COMMENT '친구 요청 ID',
    requester_id  BIGINT      NOT NULL COMMENT '요청 보낸 사용자 ID',
    addressee_id  BIGINT      NOT NULL COMMENT '요청 받은 사용자 ID',
    status        VARCHAR(10) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | ACCEPTED | REJECTED',
    created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '요청 시각',
    PRIMARY KEY (id),
    KEY ix_friendships_requester_id (requester_id),
    KEY ix_friendships_addressee_id (addressee_id),
    CONSTRAINT fk_friendships_requester FOREIGN KEY (requester_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_friendships_addressee FOREIGN KEY (addressee_id) REFERENCES users (id) ON DELETE CASCADE
) COMMENT = '친구 관계 (User 자기참조 N:M). requester<>addressee, (LEAST,GREATEST) 쌍 unique';
