from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime

class Follow(db.Model):
    __tablename__ = 'follows'
    
    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    followed_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Unique constraint and check constraint
    __table_args__ = (
        db.UniqueConstraint('follower_id', 'followed_id', name='unique_follow'),
        db.CheckConstraint('follower_id != followed_id', name='no_self_follow'),
        {'schema': SCHEMA} if environment == "production" else {}
    )

    # Relationships
    follower = db.relationship('User', foreign_keys=[follower_id], back_populates='following')
    followed = db.relationship('User', foreign_keys=[followed_id], back_populates='followers')

    def to_dict(self):
        return {
            'id': self.id,
            'follower_id': self.follower_id,
            'followed_id': self.followed_id,
            'created_at': self.created_at.isoformat()
        }


class BoardFollower(db.Model):
    __tablename__ = 'board_followers'
    
    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    board_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('boards.id')), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('user_id', 'board_id', name='unique_board_follow'),
        {'schema': SCHEMA} if environment == "production" else {}
    )

    # Relationships
    user = db.relationship('User', back_populates='board_follows')
    board = db.relationship('Board', back_populates='followers')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'board_id': self.board_id,
            'created_at': self.created_at.isoformat()
        }