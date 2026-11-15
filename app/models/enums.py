from enum import StrEnum

class Category(StrEnum):
    LUNCH = "LUNCH"  # 오늘 점심
    CAT = "CAT"      # 고양이 자랑
    SKY = "SKY"      # 오늘의 하늘
    HAUL = "HAUL"    # 산 거 자랑
    CHAT = "CHAT"    # 잡담


class Visibility(StrEnum):
    PUBLIC = "PUBLIC"
    FRIENDS = "FRIENDS"


class FriendshipStatus(StrEnum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
