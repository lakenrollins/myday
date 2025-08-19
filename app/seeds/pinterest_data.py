from app.models import db, User, Board, Pin, Like, Comment, Follow, environment, SCHEMA
from sqlalchemy.sql import text
from datetime import datetime
import random

def seed_pinterest_data():
    # Update existing demo user
    demo_user = User.query.filter_by(email='demo@aa.io').first()
    if demo_user:
        demo_user.first_name = 'Demo'
        demo_user.last_name = 'User'
        demo_user.bio = 'I love discovering and sharing beautiful ideas!'
        demo_user.avatar_url = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        demo_user.location = 'San Francisco, CA'

    # Create additional users
    users_data = [
        {
            'username': 'sarah_designs',
            'email': 'sarah@example.com',
            'password': 'password',
            'first_name': 'Sarah',
            'last_name': 'Wilson',
            'bio': 'Interior designer with a passion for modern aesthetics',
            'avatar_url': 'https://images.unsplash.com/photo-1494790108755-2616b332c3a6?w=150&h=150&fit=crop&crop=face',
            'location': 'New York, NY'
        },
        {
            'username': 'food_explorer',
            'email': 'mike@example.com',
            'password': 'password',
            'first_name': 'Mike',
            'last_name': 'Johnson',
            'bio': 'Food photographer and recipe creator',
            'avatar_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            'location': 'Los Angeles, CA'
        },
        {
            'username': 'travel_wanderer',
            'email': 'emma@example.com',
            'password': 'password',
            'first_name': 'Emma',
            'last_name': 'Davis',
            'bio': 'Travel enthusiast sharing adventures from around the world',
            'avatar_url': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
            'location': 'Seattle, WA'
        }
    ]

    created_users = []
    for user_data in users_data:
        existing_user = User.query.filter_by(email=user_data['email']).first()
        if not existing_user:
            user = User(
                username=user_data['username'],
                email=user_data['email'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                bio=user_data['bio'],
                avatar_url=user_data['avatar_url'],
                location=user_data['location']
            )
            user.password = user_data['password']
            db.session.add(user)
            created_users.append(user)

    db.session.commit()

    # Get all users for creating boards and pins
    all_users = User.query.all()
    demo_user = next((u for u in all_users if u.email == 'demo@aa.io'), None)

    # Create boards
    boards_data = [
        {
            'name': 'Home Decor Ideas',
            'description': 'Beautiful interior design inspiration for modern homes',
            'is_private': False,
            'user': demo_user
        },
        {
            'name': 'Travel Dreams',
            'description': 'Places I want to visit around the world',
            'is_private': False,
            'user': demo_user
        },
        {
            'name': 'Recipe Collection',
            'description': 'Delicious recipes to try',
            'is_private': True,
            'user': demo_user
        }
    ]

    created_boards = []
    for board_data in boards_data:
        if board_data['user']:
            board = Board(
                name=board_data['name'],
                description=board_data['description'],
                is_private=board_data['is_private'],
                user_id=board_data['user'].id
            )
            db.session.add(board)
            created_boards.append(board)

    # Add boards for other users
    if len(all_users) > 1:
        for user in all_users[1:4]:  # Skip demo user
            user_boards = [
                {
                    'name': f'{user.first_name}\'s Favorites',
                    'description': f'Curated collection by {user.first_name}',
                    'is_private': False
                },
                {
                    'name': 'Inspiration Board',
                    'description': 'Daily inspiration and motivation',
                    'is_private': False
                }
            ]
            
            for board_data in user_boards:
                board = Board(
                    name=board_data['name'],
                    description=board_data['description'],
                    is_private=board_data['is_private'],
                    user_id=user.id
                )
                db.session.add(board)
                created_boards.append(board)

    db.session.commit()

    # Create diverse pins across different categories
    pins_data = [
        # Home Decor & Interior Design
        {
            'title': 'Modern Living Room Design',
            'description': 'Clean lines and neutral colors create a serene living space with comfortable seating and natural lighting',
            'image_url': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'link': 'https://example.com/modern-living-room',
            'user': demo_user,
            'board': created_boards[0] if created_boards else None,
            'category': 'Interior'
        },
        {
            'title': 'Minimalist Bedroom Sanctuary',
            'description': 'Simple and elegant bedroom design with natural materials and calming colors',
            'image_url': 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'user': demo_user,
            'board': created_boards[0] if created_boards else None,
            'category': 'Interior'
        },
        {
            'title': 'Scandinavian Kitchen Design',
            'description': 'Light wood and white color scheme for a bright, functional kitchen space',
            'image_url': 'https://images.unsplash.com/photo-1556909075-f51b33c4b1b0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'user': all_users[1] if len(all_users) > 1 else demo_user,
            'category': 'Interior'
        },
        {
            'title': 'Cozy Reading Nook',
            'description': 'Perfect corner for reading with comfortable chair and good lighting',
            'image_url': 'https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'user': all_users[1] if len(all_users) > 1 else demo_user,
            'category': 'Interior'
        },

        # Travel & Nature
        {
            'title': 'Santorini Sunset Views',
            'description': 'Breathtaking sunset views from the Greek islands - a must-visit destination',
            'image_url': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'link': 'https://example.com/santorini-guide',
            'user': demo_user,
            'board': created_boards[1] if len(created_boards) > 1 else None,
            'category': 'Travel'
        },
        {
            'title': 'Mountain Hiking Adventure',
            'description': 'Beautiful hiking trail with scenic mountain views and fresh alpine air',
            'image_url': 'https://images.unsplash.com/photo-1464822759844-d150baec843a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'user': all_users[2] if len(all_users) > 2 else demo_user,
            'category': 'Travel'
        },
        {
            'title': 'Cherry Blossoms in Japan',
            'description': 'Spring cherry blossoms creating a magical pink canopy in Tokyo parks',
            'image_url': 'https://images.unsplash.com/photo-1522383225653-ed111181a951?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'user': all_users[2] if len(all_users) > 2 else demo_user,
            'category': 'Travel'
        },
        {
            'title': 'Northern Lights Iceland',
            'description': 'Dancing aurora borealis over the Icelandic landscape - nature\'s light show',
            'image_url': 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'user': all_users[2] if len(all_users) > 2 else demo_user,
            'category': 'Travel'
        },

        # Food & Recipes
        {
            'title': 'Homemade Fresh Pasta',
            'description': 'Fresh pasta made from scratch with simple ingredients - egg, flour, and love',
            'image_url': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'link': 'https://example.com/pasta-recipe',
            'user': demo_user,
            'board': created_boards[2] if len(created_boards) > 2 else None,
            'category': 'Food'
        },
        {
            'title': 'Artisan Coffee Setup',
            'description': 'Perfect home coffee brewing setup for coffee enthusiasts and morning rituals',
            'image_url': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'user': all_users[3] if len(all_users) > 3 else demo_user,
            'category': 'Food'
        },
        {
            'title': 'Tokyo Street Food',
            'description': 'Authentic Japanese street food experience - takoyaki, ramen, and more',
            'image_url': 'https://images.unsplash.com/photo-1554978991-33ef7f31d658?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'user': all_users[1] if len(all_users) > 1 else demo_user,
            'category': 'Food'
        },
        {
            'title': 'Chocolate Chip Cookies',
            'description': 'Classic homemade chocolate chip cookies with crispy edges and soft centers',
            'image_url': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'user': all_users[3] if len(all_users) > 3 else demo_user,
            'category': 'Food'
        },
        {
            'title': 'Avocado Toast Varieties',
            'description': 'Creative avocado toast recipes for a healthy and delicious breakfast',
            'image_url': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'user': all_users[1] if len(all_users) > 1 else demo_user,
            'category': 'Food'
        },

        # Fashion & Style
        {
            'title': 'Minimalist Wardrobe Essentials',
            'description': 'Curated collection of timeless pieces for a capsule wardrobe',
            'image_url': 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'user': all_users[1] if len(all_users) > 1 else demo_user,
            'category': 'Fashion'
        },
        {
            'title': 'Bohemian Summer Style',
            'description': 'Flowy fabrics and earthy tones perfect for summer adventures',
            'image_url': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'user': all_users[2] if len(all_users) > 2 else demo_user,
            'category': 'Fashion'
        },

        # Art & Photography
        {
            'title': 'Abstract Geometric Art',
            'description': 'Modern geometric patterns in bold colors for contemporary spaces',
            'image_url': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'user': all_users[3] if len(all_users) > 3 else demo_user,
            'category': 'Art'
        },
        {
            'title': 'Street Photography Tips',
            'description': 'Capturing authentic moments in urban environments - techniques and inspiration',
            'image_url': 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'user': all_users[2] if len(all_users) > 2 else demo_user,
            'category': 'Photography'
        },
        {
            'title': 'Watercolor Florals',
            'description': 'Delicate watercolor flower paintings with soft, dreamy colors',
            'image_url': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'user': demo_user,
            'category': 'Art'
        },

        # Nature & Outdoors
        {
            'title': 'Forest Bathing Meditation',
            'description': 'Peaceful forest scenes for mindfulness and stress relief',
            'image_url': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'user': all_users[2] if len(all_users) > 2 else demo_user,
            'category': 'Nature'
        },
        {
            'title': 'Succulent Garden Ideas',
            'description': 'Low-maintenance succulent arrangements for indoor and outdoor spaces',
            'image_url': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'user': all_users[1] if len(all_users) > 1 else demo_user,
            'category': 'Nature'
        },

        # Technology & Innovation
        {
            'title': 'Minimalist Desk Setup',
            'description': 'Clean and productive workspace design for remote work and creativity',
            'image_url': 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
            'user': all_users[3] if len(all_users) > 3 else demo_user,
            'category': 'Technology'
        }
    ]

    created_pins = []
    for pin_data in pins_data:
        pin = Pin(
            title=pin_data['title'],
            description=pin_data['description'],
            image_url=pin_data['image_url'],
            link=pin_data.get('link'),
            user_id=pin_data['user'].id,
            board_id=pin_data['board'].id if pin_data.get('board') else None
        )
        db.session.add(pin)
        created_pins.append(pin)

    db.session.commit()

    # Create user follows (social connections)
    if len(all_users) >= 4:
        follows_data = [
            # Demo user follows others
            (demo_user.id, all_users[1].id),
            (demo_user.id, all_users[2].id),
            (demo_user.id, all_users[3].id),
            
            # Others follow demo user
            (all_users[1].id, demo_user.id),
            (all_users[2].id, demo_user.id),
            
            # Cross follows
            (all_users[1].id, all_users[2].id),
            (all_users[2].id, all_users[3].id),
            (all_users[3].id, all_users[1].id),
        ]
        
        for follower_id, followed_id in follows_data:
            if follower_id != followed_id:
                existing_follow = Follow.query.filter_by(
                    follower_id=follower_id, 
                    followed_id=followed_id
                ).first()
                if not existing_follow:
                    follow = Follow(follower_id=follower_id, followed_id=followed_id)
                    db.session.add(follow)

    db.session.commit()

    # Create likes for pins
    all_pins = Pin.query.all()
    if all_pins and len(all_users) >= 2:
        # Demo user likes some pins from others
        for pin in all_pins[:10]:  # Like first 10 pins
            if pin.user_id != demo_user.id:  # Don't like own pins
                like = Like(user_id=demo_user.id, pin_id=pin.id)
                db.session.add(like)
        
        # Other users like demo's pins and each other's
        for user in all_users[1:]:
            pins_to_like = random.sample(all_pins, min(8, len(all_pins)))
            for pin in pins_to_like:
                if pin.user_id != user.id:  # Don't like own pins
                    existing_like = Like.query.filter_by(
                        user_id=user.id, 
                        pin_id=pin.id
                    ).first()
                    if not existing_like:
                        like = Like(user_id=user.id, pin_id=pin.id)
                        db.session.add(like)

    db.session.commit()

    # Create comments on pins
    comments_data = [
        {
            'content': 'This is absolutely gorgeous! Love the color palette!',
            'user': all_users[1] if len(all_users) > 1 else demo_user,
            'pin': all_pins[0] if all_pins else None
        },
        {
            'content': 'Thank you for sharing! I\'ve been looking for inspiration exactly like this.',
            'user': all_users[2] if len(all_users) > 2 else demo_user,
            'pin': all_pins[0] if all_pins else None
        },
        {
            'content': 'This looks amazing! Do you have the recipe for this?',
            'user': demo_user,
            'pin': all_pins[8] if len(all_pins) > 8 else all_pins[0] if all_pins else None
        },
        {
            'content': 'I made this last weekend and it turned out perfect! Thanks for the inspiration.',
            'user': all_users[3] if len(all_users) > 3 else demo_user,
            'pin': all_pins[8] if len(all_pins) > 8 else all_pins[0] if all_pins else None
        },
        {
            'content': 'Adding this to my travel bucket list! When did you visit?',
            'user': all_users[1] if len(all_users) > 1 else demo_user,
            'pin': all_pins[4] if len(all_pins) > 4 else all_pins[0] if all_pins else None
        },
        {
            'content': 'The lighting in this photo is incredible! What camera did you use?',
            'user': all_users[2] if len(all_users) > 2 else demo_user,
            'pin': all_pins[4] if len(all_pins) > 4 else all_pins[0] if all_pins else None
        },
        {
            'content': 'This workspace setup is so clean and inspiring! Where did you get that desk?',
            'user': demo_user,
            'pin': all_pins[-1] if all_pins else None
        },
        {
            'content': 'I need this level of organization in my life! Great ideas here.',
            'user': all_users[1] if len(all_users) > 1 else demo_user,
            'pin': all_pins[-1] if all_pins else None
        },
        {
            'content': 'The minimalist aesthetic is perfect. Saved to my inspiration board!',
            'user': all_users[3] if len(all_users) > 3 else demo_user,
            'pin': all_pins[1] if len(all_pins) > 1 else all_pins[0] if all_pins else None
        },
        {
            'content': 'This is giving me major home renovation goals! Beautiful design.',
            'user': all_users[2] if len(all_users) > 2 else demo_user,
            'pin': all_pins[1] if len(all_pins) > 1 else all_pins[0] if all_pins else None
        }
    ]

    for comment_data in comments_data:
        if comment_data['pin'] and comment_data['user']:
            comment = Comment(
                content=comment_data['content'],
                user_id=comment_data['user'].id,
                pin_id=comment_data['pin'].id
            )
            db.session.add(comment)

    db.session.commit()
    print("Pinterest seed data created successfully!")
    print(f"Created {len(all_users)} users, {len(created_boards)} boards, {len(created_pins)} pins")
    print("Added user follows, pin likes, and comments for realistic social interactions")

def undo_pinterest_data():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.board_followers RESTART IDENTITY CASCADE;")
        db.session.execute(f"TRUNCATE table {SCHEMA}.comments RESTART IDENTITY CASCADE;")
        db.session.execute(f"TRUNCATE table {SCHEMA}.likes RESTART IDENTITY CASCADE;")
        db.session.execute(f"TRUNCATE table {SCHEMA}.follows RESTART IDENTITY CASCADE;")
        db.session.execute(f"TRUNCATE table {SCHEMA}.pins RESTART IDENTITY CASCADE;")
        db.session.execute(f"TRUNCATE table {SCHEMA}.boards RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM board_followers"))
        db.session.execute(text("DELETE FROM comments"))
        db.session.execute(text("DELETE FROM likes"))
        db.session.execute(text("DELETE FROM follows"))
        db.session.execute(text("DELETE FROM pins"))
        db.session.execute(text("DELETE FROM boards"))
        
    db.session.commit()