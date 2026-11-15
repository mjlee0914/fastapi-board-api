from sqlalchemy.orm import declarative_base

class Base(declarative_base):
    """모든 모델(테이블 클래스)이 상속받는 부모 클래스"""
    
    # Base의 역할
    # 1. 클래스틀 테이블로 바꾸어 준다
        # 모델이 Base를 상속 -> SQLAlchemy가 모델과 연결된 클래스로 알아봄 -> 필드를 컬럼으로 만들어 줌
    # 2. 모든 테이블 목록을 한 곳으로 모아 준다
        # Base를 상속한 클래스들은 전부 Base.metadata라는 목록에 자동 등록됨.
        # EX) Base.metadata.tables.keys()   # → users, posts, comments, likes, friendships
    # 3. 모든 모델에 공통 설저을 한 번에 줄 수 있다
        # 나중에 공통 규칙이 생기면 Base에 한 번만 쓰면 모델들이 알아서 상속받음