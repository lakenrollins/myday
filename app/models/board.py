from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime

class Board(db.Model):
    __tablename__ = 'boards'
    
    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_private = db.Column(db.Boolean, default=False, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='boards')
    pins = db.relationship('Pin', back_populates='board', cascade='all, delete-orphan')
    followers = db.relationship('BoardFollower', back_populates='board', cascade='all, delete-orphan')

    def to_dict(self, include_user=True, include_stats=True, include_pins=False):
        board_dict = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_private': self.is_private,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_user and self.user:
            board_dict['user'] = {
                'id': self.user.id,
                'username': self.user.username,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
                'avatar_url': getattr(self.user, 'avatar_url', None)
            }
        
        if include_stats:
            board_dict['pins_count'] = len(self.pins)
            board_dict['followers_count'] = len(self.followers)
        
        if include_pins:
            board_dict['pins'] = [pin.to_dict(include_user=False, include_stats=False) for pin in self.pins[:20]]
        
        # Add cover image from first pin
        if self.pins:
            board_dict['cover_image'] = self.pins[0].image_url
        
        return board_dict