from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.models import db, User, Follow, Pin, Board
from app.forms import UserUpdateForm
from sqlalchemy import desc, or_

user_routes = Blueprint('users', __name__)

@user_routes.route('/')
def users():
    """Query for all users and return them in a list of user dictionaries"""
    users = User.query.all()
    return jsonify({'users': [user.to_dict() for user in users]})

@user_routes.route('/<int:id>')
def user(id):
    """Query for a user by id and return that user in a dictionary"""
    user = User.query.get(id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict(include_stats=True))

@user_routes.route('/<int:id>', methods=['PUT'])
@login_required
def update_user(id):
    """Update user profile"""
    if current_user.id != id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    user = User.query.get(id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    form = UserUpdateForm()
    form['csrf_token'].data = request.cookies['csrf_token']
    
    if form.validate_on_submit():
        user.first_name = form.first_name.data
        user.last_name = form.last_name.data
        user.bio = form.bio.data
        user.website = form.website.data
        user.location = form.location.data
        user.avatar_url = form.avatar_url.data
        
        db.session.commit()
        return jsonify(user.to_dict(include_stats=True, include_private=True))
    
    return jsonify({'errors': form.errors}), 400

@user_routes.route('/<int:user_id>/follow', methods=['POST'])
@login_required
def follow_user(user_id):
    """Follow or unfollow a user"""
    if current_user.id == user_id:
        return jsonify({'error': 'Cannot follow yourself'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    existing_follow = Follow.query.filter_by(
        follower_id=current_user.id,
        followed_id=user_id
    ).first()
    
    if existing_follow:
        # Unfollow the user
        db.session.delete(existing_follow)
        following = False
    else:
        # Follow the user
        follow = Follow(follower_id=current_user.id, followed_id=user_id)
        db.session.add(follow)
        following = True
    
    db.session.commit()
    
    return jsonify({
        'following': following,
        'followers_count': len(user.followers)
    })

@user_routes.route('/<int:user_id>/follow-status', methods=['GET'])
@login_required
def get_follow_status(user_id):
    """Check if current user is following a specific user"""
    if current_user.id == user_id:
        return jsonify({'following': False, 'message': 'Cannot follow yourself'})
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    existing_follow = Follow.query.filter_by(
        follower_id=current_user.id,
        followed_id=user_id
    ).first()
    
    return jsonify({
        'following': existing_follow is not None,
        'followers_count': len(user.followers)
    })

@user_routes.route('/feed')
@login_required
def get_user_feed():
    """Get personalized feed for current user"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Get pins from users that current user follows
    followed_user_ids = db.session.query(Follow.followed_id)\
        .filter(Follow.follower_id == current_user.id).all()
    followed_user_ids = [id[0] for id in followed_user_ids]
    
    if not followed_user_ids:
        # If not following anyone, show recent pins
        pins_query = Pin.query.order_by(desc(Pin.created_at))
    else:
        # Show pins from followed users + some random recent pins
        pins_query = Pin.query.filter(
            or_(
                Pin.user_id.in_(followed_user_ids)
            )
        ).order_by(desc(Pin.created_at))
    
    pins_paginated = pins_query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )
    
    return jsonify({
        'pins': [pin.to_dict() for pin in pins_paginated.items],
        'page': page,
        'pages': pins_paginated.pages,
        'per_page': per_page,
        'total': pins_paginated.total,
        'has_next': pins_paginated.has_next,
        'has_prev': pins_paginated.has_prev
    })

@user_routes.route('/<int:user_id>/pins')
def get_user_pins(user_id):
    """Get all pins by a specific user"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    pins_paginated = Pin.query.filter_by(user_id=user_id)\
        .order_by(desc(Pin.created_at))\
        .paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
    
    return jsonify({
        'pins': [pin.to_dict() for pin in pins_paginated.items],
        'page': page,
        'pages': pins_paginated.pages,
        'per_page': per_page,
        'total': pins_paginated.total,
        'has_next': pins_paginated.has_next,
        'has_prev': pins_paginated.has_prev
    })

@user_routes.route('/<int:user_id>/boards')
def get_user_boards(user_id):
    """Get all boards by a specific user"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Only show public boards unless it's the user's own profile
    if current_user and current_user.id == user_id:
        boards = Board.query.filter_by(user_id=user_id).all()
    else:
        boards = Board.query.filter_by(user_id=user_id, is_private=False).all()
    
    return jsonify([board.to_dict(include_pins=True) for board in boards])
