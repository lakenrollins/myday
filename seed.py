from app import app
from models import db, User, Pin, Board, Comment

with app.app_context():
    db.drop_all()
    db.create_all()
    
    # Users
    user1 = User(username='alice', email='alice@example.com', password_hash='hashed_pw')
    user2 = User(username='bob', email='bob@example.com', password_hash='hashed_pw')
    db.session.add_all([user1, user2])
    db.session.commit()
    
    # Pins
    pin1 = Pin(title='Beautiful Sunset', description='A sunset in Bali', image_url='https://picsum.photos/200', user_id=user1.id)
    pin2 = Pin(title='Mountain Hike', description='Hiking in Alps', image_url='https://picsum.photos/201', user_id=user2.id)
    db.session.add_all([pin1, pin2])
    db.session.commit()
    
    # Boards
    board1 = Board(name='Vacation Ideas', user_id=user1.id)
    board2 = Board(name='Adventure', user_id=user2.id)
    db.session.add_all([board1, board2])
    db.session.commit()
    
    # Comments
    comment1 = Comment(content='Wow amazing!', user_id=user2.id, pin_id=pin1.id)
    comment2 = Comment(content='I want to go there!', user_id=user1.id, pin_id=pin2.id)
    db.session.add_all([comment1, comment2])
    db.session.commit()
    
    # Add pins to boards
    board1.pins.append(pin1)
    board2.pins.append(pin2)
    db.session.commit()
    
    # Favorite pins
    user1.favorite_pins.append(pin2)
    user2.favorite_pins.append(pin1)
    db.session.commit()
    
    print("Seeding completed!")
