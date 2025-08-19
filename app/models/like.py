from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime

class Like(db.Model):
    __tablename__ = 'likes'
    
    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    pin_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('pins.id')), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Unique constraint to prevent duplicate likes
    __table_args__ = (
        db.UniqueConstraint('user_id', 'pin_id', name='unique_user_pin_like'),
        {'schema': SCHEMA} if environment == "production" else {}
    )

    # Relationships
    user = db.relationship('User', back_populates='likes')
    pin = db.relationship('Pin', back_populates='likes')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'pin_id': self.pin_id,
            'created_at': self.created_at.isoformat()
        }