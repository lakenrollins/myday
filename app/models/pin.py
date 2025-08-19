from .db import db, environment, SCHEMA, add_prefix_for_prod
from datetime import datetime

class Pin(db.Model):
    __tablename__ = 'pins'
    
    if environment == "production":
        __table_args__ = {'schema': SCHEMA}

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(500), nullable=False)
    link = db.Column(db.String(500))
    user_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('users.id')), nullable=False)
    board_id = db.Column(db.Integer, db.ForeignKey(add_prefix_for_prod('boards.id')))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='pins')
    board = db.relationship('Board', back_populates='pins')
    likes = db.relationship('Like', back_populates='pin', cascade='all, delete-orphan')
    comments = db.relationship('Comment', back_populates='pin', cascade='all, delete-orphan')

    def to_dict(self, include_user=True, include_stats=True):
        pin_dict = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'image_url': self.image_url,
            'link': self.link,
            'user_id': self.user_id,
            'board_id': self.board_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_user and self.user:
            pin_dict['user'] = {
                'id': self.user.id,
                'username': self.user.username,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
                'avatar_url': getattr(self.user, 'avatar_url', None)
            }
        
        if include_stats:
            pin_dict['likes_count'] = len(self.likes)
            pin_dict['comments_count'] = len(self.comments)
        
        return pin_dict